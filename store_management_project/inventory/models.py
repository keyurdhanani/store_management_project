from django.db import models
from django.core.validators import MinValueValidator
from django.db.models import F
from django.db import transaction 
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.utils import timezone 

# --- Base Models ---

class Category(models.Model):
    """Categories: Medicines, Cosmetics, Health products, etc."""
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True, null=True)

    class Meta:
        verbose_name_plural = "Categories" 

    def __str__(self):
        return self.name

class Product(models.Model):
    """Base product information with pricing and categorization."""
    name = models.CharField(max_length=255, unique=True)
    description = models.TextField(blank=True, null=True)
    
    base_price = models.DecimalField(
        max_digits=10, decimal_places=2, validators=[MinValueValidator(0.01)],
        help_text="Base price (legacy field). Minimum 0.01."
    )
    mrp = models.DecimalField(
        max_digits=10, decimal_places=2, default=0.00, validators=[MinValueValidator(0.00)],
        help_text="Maximum Retail Price."
    )
    supplier_base_price = models.DecimalField(
        max_digits=10, decimal_places=2, default=0.00, validators=[MinValueValidator(0.00)],
        help_text="Price paid to the supplier."
    )
    category = models.ForeignKey(
        'Category', on_delete=models.SET_NULL, related_name='products', null=True, blank=True
    )
    # Field used for soft deletion/deactivation - Set to True for active inventory
    is_active = models.BooleanField(default=True) 

    def __str__(self):
        cat = self.category.name if self.category else 'N/A'
        return f"{self.name} ({cat})"
    
class Stock(models.Model):
    """Tracks total stock quantity, batch-derived updates, expiry info, and low-stock alerts."""
    product = models.OneToOneField(
        'Product', on_delete=models.CASCADE, related_name='stock'
    )
    quantity = models.IntegerField(
        default=0, validators=[MinValueValidator(0)],
        help_text="Total quantity aggregated from active batches."
    )
    low_stock_threshold = models.IntegerField(
        default=10, validators=[MinValueValidator(0)]
    )
    expiry_date = models.DateField(
        null=True, blank=True,
        help_text="Optional global expiry date (if not using batch-level expiries)."
    )

    class Meta:
        verbose_name_plural = "Stock"

    def __str__(self):
        return f"Stock for {self.product.name} ({self.quantity} units)"

    @property
    def is_low_stock(self):
        return self.quantity <= self.low_stock_threshold
    
class Supplier(models.Model):
    """Information about product suppliers."""
    name = models.CharField(max_length=200, unique=True)
    contact_person = models.CharField(max_length=100, blank=True)
    phone = models.CharField(max_length=20, blank=True)
    email = models.EmailField(blank=True)
    address = models.TextField(blank=True)

    def __str__(self):
        return self.name

class Batch(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='batches')
    batch_number = models.CharField(max_length=50)
    cost_price = models.DecimalField(max_digits=10, decimal_places=2) 
    expiry_date = models.DateField(null=True, blank=True)
    quantity = models.IntegerField(default=0) 
    purchase_date = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('product', 'batch_number') 
        # Order by expiry date (FEFO) for easy stock deduction later
        ordering = ['expiry_date', 'purchase_date']

    def __str__(self):
        return f"{self.product.name} - {self.batch_number} ({self.quantity})"


class Purchase(models.Model):
    # Allows CASCADE deletion of Product, necessary for hard deletion
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='purchases')
    supplier = models.ForeignKey(
        Supplier, on_delete=models.SET_NULL, related_name='deliveries', null=True 
    ) 
    purchase_quantity = models.IntegerField(validators=[MinValueValidator(1)])
    unit_purchase_price = models.DecimalField(
        max_digits=10, decimal_places=2, validators=[MinValueValidator(0.01)]
    )
    purchase_date = models.DateField(auto_now_add=True)
    invoice_number = models.CharField(max_length=50, blank=True, null=True)
    
    batch_number_input = models.CharField(max_length=50, blank=True, null=True)
    expiry_date_input = models.DateField(null=True, blank=True)
    
    batch_created = models.ForeignKey(
        'Batch', on_delete=models.SET_NULL, null=True, blank=True,
        related_name='source_purchases'
    )

    def __str__(self):
        return f"Purchase: {self.product.name} - {self.purchase_quantity} units on {self.purchase_date}"


class SaleInvoice(models.Model):
    """Represents a single customer transaction (the bill)."""
    invoice_number = models.CharField(max_length=50, unique=True, blank=True) 
    sale_date = models.DateTimeField(auto_now_add=True)
    customer_name = models.CharField(max_length=100, blank=True, null=True)
    discount_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0.00) 
    tax_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0.00) 
    subtotal = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    tax_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    final_total = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)

    def __str__(self):
        return f"Invoice #{self.invoice_number} ({self.sale_date.strftime('%Y-%m-%d %H:%M')})"

class SaleItem(models.Model):
    """Details of products sold within a SaleInvoice, supporting batch-level tracking."""
    invoice = models.ForeignKey(
        'SaleInvoice', on_delete=models.CASCADE, related_name='items'
    )
    # Allows CASCADE deletion of Product, necessary for hard deletion
    product = models.ForeignKey(
        'Product', on_delete=models.CASCADE
    )
    sold_quantity = models.IntegerField(
        validators=[MinValueValidator(1)], help_text="Number of units sold."
    )
    unit_sale_price = models.DecimalField(max_digits=10, decimal_places=2)
    unit_cost_price = models.DecimalField(
        max_digits=10, decimal_places=2, default=0.00,
        help_text="Cost per unit based on batch cost or product supplier cost."
    )
    batch = models.ForeignKey(
        'Batch', on_delete=models.SET_NULL, null=True, blank=True,
        help_text="Batch from which stock was deducted."
    )

    @property
    def total_price(self):
        return self.unit_sale_price * self.sold_quantity

    @property
    def total_cost(self):
        """Total COGS for this sale line."""
        return self.unit_cost_price * self.sold_quantity

    def __str__(self):
        return f"Sale: {self.product.name} x {self.sold_quantity}"


# ----------------------------------------------------
# 🚨 PURCHASE SIGNALS (Stock IN) 🚨
# ----------------------------------------------------

@receiver(post_save, sender=Purchase)
def create_batch_and_update_stock(sender, instance, created, **kwargs):
    """Handles stock update and Batch creation/linking after a new Purchase."""
    if created:
        try:
            instance.product.stock 
        except Stock.DoesNotExist:
             Stock.objects.create(product=instance.product, quantity=0)

        with transaction.atomic():
            try:
                # 1. ATOMICALLY UPDATE TOTAL STOCK
                Stock.objects.filter(product=instance.product).update(
                    quantity=F('quantity') + instance.purchase_quantity
                )
                
                # 2. CREATE/UPDATE BATCH RECORD
                batch_number = instance.batch_number_input or instance.invoice_number or f'PUR-{instance.id}'
                expiry_date = instance.expiry_date_input 
                
                batch, _ = Batch.objects.update_or_create(
                    product=instance.product,
                    batch_number=batch_number,
                    defaults={
                        'cost_price': instance.unit_purchase_price,
                        'expiry_date': expiry_date,
                    },
                )
                
                # Atomically increment quantity for the batch
                Batch.objects.filter(id=batch.id).update(
                    quantity=F('quantity') + instance.purchase_quantity
                )

                # 3. LINK BATCH BACK TO PURCHASE
                Purchase.objects.filter(id=instance.id).update(batch_created=batch)

            except Exception as e:
                print(f"Transaction failed for Purchase {instance.id} during stock/batch update: {e}")
                raise 


@receiver(post_delete, sender=Purchase)
def revert_stock_and_batch(sender, instance, **kwargs):
    """Handles atomic stock and batch reversal when a Purchase is deleted."""
    quantity_to_revert = instance.purchase_quantity
    
    with transaction.atomic():
        # 1. ATOMICALLY DECREMENT TOTAL STOCK
        Stock.objects.filter(product=instance.product).update(
            quantity=F('quantity') - quantity_to_revert
        )
        Stock.objects.filter(product=instance.product, quantity__lt=0).update(quantity=0)

        # 2. ATOMICALLY REVERT BATCH QUANTITY
        try:
            batch_id = instance.batch_created.id
            
            Batch.objects.filter(id=batch_id).update(
                quantity=F('quantity') - quantity_to_revert
            )
            
            # Delete batch if quantity hits zero or less
            Batch.objects.filter(id=batch_id, quantity__lte=0).delete()
            
        except Batch.DoesNotExist:
            pass
        except AttributeError:
            pass