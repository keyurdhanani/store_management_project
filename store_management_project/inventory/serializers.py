# inventory/serializers.py

from rest_framework import serializers
from .models import Category, Product, Stock

# 1. Category Serializer
class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'description'] # Fields to expose in the API

# 2. Stock Serializer (Nested for Product)
class StockSerializer(serializers.ModelSerializer):
    class Meta:
        model = Stock
        # Expose key stock data, but don't expose 'product' here as it's the parent.
        fields = ['quantity', 'expiry_date', 'low_stock_threshold']

# 3. Product Serializer
class ProductSerializer(serializers.ModelSerializer):
    # Nested Serializers to include related data
    category_name = serializers.ReadOnlyField(source='category.name')
    stock_details = StockSerializer(source='stock', read_only=True) # Use source='stock' because of related_name in OneToOneField

    class Meta:
        model = Product
        fields = [
            'id',
            'name',
            'category', # For POST/PUT requests (sending category ID)
            'category_name', # For GET requests (displaying category name)
            'base_price',
            'description',
            'is_active',
            'stock_details',
        ]
        read_only_fields = ['category_name', 'stock_details'] # These are derived, not set directly

    # Custom method to handle Stock creation/update when a Product is created/updated
    def create(self, validated_data):
        # Create the Product instance first
        product = Product.objects.create(**validated_data)
        # Automatically create a related Stock instance with default values
        Stock.objects.create(product=product, quantity=0)
        return product