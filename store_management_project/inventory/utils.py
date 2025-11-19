# inventory/utils.py

from django.db import transaction
from django.db.models import F
from django.core.exceptions import ObjectDoesNotExist
from .models import Product, Batch, Stock # Import your models

def deduct_stock_from_batches(product_id, quantity_to_deduct):
    """
    Atomically deducts the specified quantity from the product's batches,
    prioritizing batches by expiry date (FEFO).
    
    Returns: A list of (batch_id, deducted_quantity, unit_cost) tuples used in the sale.
    Raises: Exception if insufficient stock is found.
    """
    
    with transaction.atomic():
        try:
            # 1. Lock the Stock record for the product to prevent race conditions
            stock = Stock.objects.select_for_update().get(product_id=product_id)
        except ObjectDoesNotExist:
            raise Exception(f"CRITICAL ERROR: Stock record missing for Product ID {product_id}.")

        total_stock = stock.quantity
        if total_stock < quantity_to_deduct:
            remaining = total_stock if total_stock is not None else 0
            raise Exception(f"Insufficient stock for {stock.product.name}. Required {quantity_to_deduct}, but only {remaining} available.")
        
        # 2. Lock and order batches (FEFO: Earliest Expiry Date first)
        batches = Batch.objects.select_for_update().filter(
            product_id=product_id, 
            quantity__gt=0
        ).order_by('expiry_date', 'purchase_date') # FEFO/FIFO tiebreaker
        
        remaining_to_deduct = quantity_to_deduct
        deductions = []

        # 3. Iterate through batches and deduct stock
        for batch in batches:
            if remaining_to_deduct == 0:
                break
                
            available_in_batch = batch.quantity
            deduct_amount = min(remaining_to_deduct, available_in_batch)
            
            if deduct_amount > 0:
                # Atomic update for the specific batch
                Batch.objects.filter(id=batch.id).update(
                    quantity=F('quantity') - deduct_amount
                )
                
                deductions.append((batch.id, deduct_amount, batch.cost_price))
                remaining_to_deduct -= deduct_amount

        # 4. Final total stock update and check
        if remaining_to_deduct == 0:
            # Atomic update for the main stock tracker
            Stock.objects.filter(product_id=product_id).update(
                quantity=F('quantity') - quantity_to_deduct
            )
            return deductions
        else:
            # Should not happen if the initial check was correct, but handles unexpected failures
            raise Exception(f"CRITICAL ERROR: Failed to fully deduct stock for {stock.product.name} during transaction commit. Remaining {remaining_to_deduct} units.")