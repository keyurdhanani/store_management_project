from django.utils import timezone
from rest_framework import serializers
from django.db import transaction
from decimal import Decimal
from django.db.models import F
from django.contrib.auth.models import User
from django.core.exceptions import ObjectDoesNotExist

from .models import (
    Batch, SaleInvoice, SaleItem, Supplier,
    Category, Product, Purchase, Stock
)

# 🚨 Import the stock deduction utility that handles atomic FEFO/FIFO logic 🚨
from .utils import deduct_stock_from_batches 


# -----------------------------
# CATEGORY SERIALIZER
# -----------------------------
class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'description']


# -----------------------------
# STOCK SERIALIZER
# -----------------------------
class StockSerializer(serializers.ModelSerializer):
    class Meta:
        model = Stock
        fields = ['quantity', 'expiry_date', 'low_stock_threshold']


# -----------------------------
# BATCH SERIALIZER
# -----------------------------
class BatchSerializer(serializers.ModelSerializer):
    class Meta:
        model = Batch
        fields = '__all__'
        read_only_fields = ('quantity', 'product', 'purchase_date')


# -----------------------------
# PRODUCT SERIALIZER
# -----------------------------
class ProductSerializer(serializers.ModelSerializer):
    category_name = serializers.ReadOnlyField(source='category.name')
    stock_details = StockSerializer(source='stock', read_only=True)
    active_batches = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = (
            'id', 'name', 'description',
            'base_price', 'mrp', 'supplier_base_price',
            'category', 'category_name',
            'is_active', 'stock_details', 'active_batches'
        )
        read_only_fields = ('category_name', 'stock_details', 'active_batches')

    def get_active_batches(self, obj):
        # Optimized: only fetch batches with positive quantity
        batches = obj.batches.filter(quantity__gt=0).order_by('expiry_date', 'purchase_date')
        return BatchSerializer(batches, many=True).data

    def create(self, validated_data):
        product = Product.objects.create(**validated_data)
        # Ensure Stock record is created immediately upon product creation
        Stock.objects.create(product=product, quantity=0)
        return product


# -----------------------------
# SUPPLIER SERIALIZER
# -----------------------------
class SupplierSerializer(serializers.ModelSerializer):
    class Meta:
        model = Supplier
        fields = ['id', 'name', 'contact_person', 'phone', 'email', 'address']


# -----------------------------
# PURCHASE SERIALIZER
# -----------------------------
class PurchaseSerializer(serializers.ModelSerializer):
    product_name = serializers.ReadOnlyField(source='product.name')
    supplier_name = serializers.ReadOnlyField(source='supplier.name')

    # Input fields for Batch creation/linking (map directly to Purchase model fields)
    batch_number_input = serializers.CharField(max_length=50, required=False, allow_null=True)
    expiry_date_input = serializers.DateField(required=False, allow_null=True)


    class Meta:
        model = Purchase
        fields = [
            'id', 'product', 'product_name',
            'supplier', 'supplier_name',
            'purchase_quantity', 'unit_purchase_price',
            'purchase_date', 'invoice_number',
            'batch_created', 
            'batch_number_input', 
            'expiry_date_input',  
        ]
        read_only_fields = ['purchase_date', 'product_name', 'supplier_name', 'batch_created']


    @transaction.atomic
    def create(self, validated_data):
        # Logic delegated to post_save signal in models.py
        purchase = super().create(validated_data)
        return purchase


    @transaction.atomic
    def update(self, instance, validated_data):
        # 1. Capture old quantity
        old_quantity = instance.purchase_quantity
        
        # 2. Update the Purchase instance
        instance = super().update(instance, validated_data)

        new_quantity = instance.purchase_quantity
        stock_change = new_quantity - old_quantity

        # 3. Update the associated Batch record
        if instance.batch_created:
            Batch.objects.filter(id=instance.batch_created.id).update(
                quantity=F('quantity') + stock_change,
                cost_price=instance.unit_purchase_price,
                batch_number=instance.batch_number_input or instance.invoice_number or instance.batch_created.batch_number,
                expiry_date=instance.expiry_date_input,
            )
            
            # 4. Defensive check: remove zeroed-out batches
            Batch.objects.filter(
                id=instance.batch_created.id, 
                quantity__lte=0
            ).delete()
            
        # 5. Atomically update the Stock record
        Stock.objects.filter(product=instance.product).update(quantity=F('quantity') + stock_change)
        
        return instance


# -----------------------------
# SALE ITEM SERIALIZER
# -----------------------------
class SaleItemSerializer(serializers.ModelSerializer):
    product_name = serializers.ReadOnlyField(source='product.name')
    item_total = serializers.SerializerMethodField()

    class Meta:
        model = SaleItem
        # Only include input fields for creation
        fields = ['product', 'product_name', 'sold_quantity', 'unit_sale_price', 'item_total', 'batch']
        read_only_fields = ['product_name', 'item_total', 'batch']

    def get_item_total(self, obj):
        return obj.total_price


# -----------------------------
# SALE INVOICE SERIALIZER (FIXED: Uses deduct_stock_from_batches)
# -----------------------------
class SaleInvoiceSerializer(serializers.ModelSerializer):
    # 'items' is used for incoming data (write_only=True)
    items = SaleItemSerializer(many=True, write_only=True)
    
    # Read-only fields for displaying created sale items
    sale_items = SaleItemSerializer(source='items', many=True, read_only=True)

    class Meta:
        model = SaleInvoice
        fields = [
            'id', 'invoice_number', 'sale_date', 'customer_name',
            'discount_rate', 'tax_rate',
            'subtotal', 'tax_amount', 'final_total',
            'items', # Write field for incoming data
            'sale_items' # Read field for outgoing data
        ]
        read_only_fields = [
            'invoice_number', 'sale_date', 'subtotal', 'tax_amount', 
            'final_total', 'sale_items'
        ]

    def validate(self, data):
        """Pre-check validation for basic stock availability."""
        items_data = data.get('items', [])
        for item in items_data:
            product = item.get('product')
            sold_quantity = item.get('sold_quantity')
            
            if not product:
                raise serializers.ValidationError("A sale item must contain a product.")
            
            try:
                # Use the Stock object for the initial check
                current_stock = product.stock.quantity
                if sold_quantity > current_stock:
                    raise serializers.ValidationError(
                        f"Not enough stock for {product.name}. "
                        f"Requested {sold_quantity}, available {current_stock}."
                    )
            except ObjectDoesNotExist:
                raise serializers.ValidationError(f"Product {product.name} has no stock record.")

        return data

    @transaction.atomic
    def create(self, validated_data):
        items_data = validated_data.pop('items')

        # --- 1. Calculate and Prepare Invoice Fields ---
        subtotal = sum(
            Decimal(item['sold_quantity']) * Decimal(item['unit_sale_price'])
            for item in items_data
        )
        discount_rate = Decimal(validated_data.get('discount_rate', 0))
        tax_rate = Decimal(validated_data.get('tax_rate', 0))
        discounted_subtotal = subtotal * (Decimal('1') - discount_rate / Decimal('100'))
        tax_amount = discounted_subtotal * (tax_rate / Decimal('100'))
        final_total = discounted_subtotal + tax_amount

        # Generate Invoice Number
        last_invoice = SaleInvoice.objects.order_by('-id').first()
        new_id = (last_invoice.id if last_invoice else 0) + 1
        invoice_number = f"INV-{new_id:05d}"

        # 2. Create the SaleInvoice instance
        invoice = SaleInvoice.objects.create(
            invoice_number=invoice_number,
            subtotal=subtotal,
            tax_amount=tax_amount,
            final_total=final_total,
            **validated_data
        )

        # 3. Process each item, deduct stock atomically, and create SaleItems
        for item_data in items_data:
            product = item_data['product']
            sold_quantity = item_data['sold_quantity']
            unit_sale_price = item_data['unit_sale_price']
            
            try:
                # 💥 CORRECTED LOGIC: Use the atomic utility function
                deductions = deduct_stock_from_batches(product.id, sold_quantity)
                
                # Create one SaleItem for the entire sold quantity, linking to the
                # first batch used, and using the cost price of that batch.
                
                # NOTE: If stock was pulled from multiple batches, this simplified 
                # SaleItem model loses some COGS accuracy. For full accuracy, you 
                # would need to create multiple SaleItem records (one per batch deduction). 
                # For simplicity here, we use the first batch's cost.
                
                first_batch_id, _, first_cost = deductions[0]
                first_batch = Batch.objects.get(id=first_batch_id)

                SaleItem.objects.create(
                    invoice=invoice,
                    product=product,
                    sold_quantity=sold_quantity,
                    unit_sale_price=unit_sale_price,
                    unit_cost_price=first_cost, 
                    batch=first_batch
                )

            except Exception as e:
                # Any failure here triggers an atomic rollback of the entire transaction
                # (including the SaleInvoice creation).
                raise serializers.ValidationError({'detail': str(e)})

        return invoice


# -----------------------------
# USER SERIALIZER
# -----------------------------
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'password')
        extra_kwargs = {'password': {'write_only': True, 'required': True}}

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password']
        )
        return user