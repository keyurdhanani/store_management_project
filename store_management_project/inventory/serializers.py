# api/serializers.py (FINAL CORRECTED VERSION)

from rest_framework import serializers
from .models import SaleInvoice, SaleItem, Supplier, Category, Product, Purchase, Stock
from django.db import transaction
from decimal import Decimal
from django.db.models import F # Keep F expression for good practice, though not used here directly

# --- Model Serializers ---

# Category Serializer
class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'description']

# Stock Serializer
class StockSerializer(serializers.ModelSerializer):
    class Meta:
        model = Stock
        fields = ['quantity', 'expiry_date', 'low_stock_threshold']

# Product Serializer
class ProductSerializer(serializers.ModelSerializer):
    category_name = serializers.ReadOnlyField(source='category.name')
    stock_details = StockSerializer(source='stock', read_only=True)

    class Meta:
        model = Product
        fields = ['id', 'name', 'category', 'category_name', 'base_price', 
                  'description', 'is_active', 'stock_details']
        read_only_fields = ['category_name', 'stock_details']

    def create(self, validated_data):
        product = Product.objects.create(**validated_data)
        # Stock record initialization is correct here
        Stock.objects.create(product=product, quantity=0) 
        return product

# Supplier Serializer
class SupplierSerializer(serializers.ModelSerializer):
    class Meta:
        model = Supplier
        fields = ['id', 'name', 'contact_person', 'phone', 'email', 'address']

# Purchase Serializer
class PurchaseSerializer(serializers.ModelSerializer):
    product_name = serializers.ReadOnlyField(source='product.name')
    supplier_name = serializers.ReadOnlyField(source='supplier.name')

    class Meta:
        model = Purchase
        fields = ['id', 'product', 'product_name', 'supplier', 'supplier_name',
                  'purchase_quantity', 'unit_purchase_price', 'purchase_date', 'invoice_number']
        read_only_fields = ['purchase_date', 'product_name', 'supplier_name']

# Sale Item Serializer
class SaleItemSerializer(serializers.ModelSerializer):
    product_name = serializers.ReadOnlyField(source='product.name')

    class Meta:
        model = SaleItem
        fields = ['product', 'product_name', 'sold_quantity', 'unit_sale_price', 'item_total']
        read_only_fields = ['product_name', 'item_total']

# --- Sale Logic Serializers ---

# Sale Invoice Serializer
class SaleInvoiceSerializer(serializers.ModelSerializer):
    items = SaleItemSerializer(many=True)

    class Meta:
        model = SaleInvoice
        fields = ['id', 'invoice_number', 'sale_date', 'customer_name',
                  'discount_rate', 'tax_rate', 'subtotal', 'tax_amount', 'final_total', 'items']
        read_only_fields = ['invoice_number', 'sale_date', 'subtotal', 'tax_amount', 'final_total']

    def validate(self, data):
        # Stock validation is critical and correctly placed here, before creation starts
        items_data = data.get('items', [])
        for item_data in items_data:
            product = item_data.get('product')
            sold_quantity = item_data.get('sold_quantity')

            if not product:
                raise serializers.ValidationError("Each sale item must include a product ID.")
            if sold_quantity <= 0:
                raise serializers.ValidationError(f"Invalid quantity for {product.name}.")

            try:
                current_stock = product.stock.quantity
                if sold_quantity > current_stock:
                    raise serializers.ValidationError(
                        f"Insufficient stock for {product.name}. Requested: {sold_quantity}, Available: {current_stock}"
                    )
            except Stock.DoesNotExist:
                raise serializers.ValidationError(f"Product {product.name} has no stock record.")
        return data

    @transaction.atomic
    def create(self, validated_data):
        items_data = validated_data.pop('items')

        # --- 1. Calculate Totals ---
        subtotal = sum(
            Decimal(item['sold_quantity']) * Decimal(item['unit_sale_price'])
            for item in items_data
        )
        discount_rate = Decimal(validated_data.get('discount_rate', 0))
        tax_rate = Decimal(validated_data.get('tax_rate', 0))
        discounted_subtotal = subtotal * (Decimal('1') - discount_rate / Decimal('100'))
        tax_amount = discounted_subtotal * tax_rate / Decimal('100')
        final_total = discounted_subtotal + tax_amount

        # --- 2. Generate Invoice Number ---
        last_invoice = SaleInvoice.objects.all().order_by('-id').first()
        new_id = (last_invoice.id if last_invoice else 0) + 1
        invoice_number = f"INV-{new_id:05d}"

        # --- 3. Create Sale Invoice ---
        invoice = SaleInvoice.objects.create(
            invoice_number=invoice_number,
            subtotal=subtotal,
            tax_amount=tax_amount,
            final_total=final_total,
            **validated_data
        )

        # --- 4. Create Sale Items (This triggers the stock deduction in SaleItem.save()) ---
        for item_data in items_data:
            product = item_data['product']
            sold_quantity = int(item_data['sold_quantity'])
            unit_sale_price = Decimal(item_data['unit_sale_price'])
            item_total = sold_quantity * unit_sale_price

            SaleItem.objects.create(
                invoice=invoice,
                product=product,
                sold_quantity=sold_quantity,
                unit_sale_price=unit_sale_price,
                item_total=item_total
            )
        return invoice