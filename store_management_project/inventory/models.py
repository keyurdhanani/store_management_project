# inventory/models.py

from django.db import models
from django.core.validators import MinValueValidator

# 1. Category Model
class Category(models.Model):
    """Categories: Medicines, Cosmetics, Health products, etc."""
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True, null=True)

    class Meta:
        verbose_name_plural = "Categories" # Fixes 'Categorys' in admin

    def __str__(self):
        return self.name


# 2. Product Model
class Product(models.Model):
    """Base product information."""
    name = models.CharField(max_length=200, unique=True)
    # Foreign Key: Links Product to a Category
    category = models.ForeignKey(
        Category,
        on_delete=models.SET_NULL, # If category is deleted, set product category to NULL
        related_name='products',
        null=True
    )
    # Price in INR number
    base_price = models.DecimalField(
        max_digits=10, 
        decimal_places=2,
        validators=[MinValueValidator(0.01)]
    )
    description = models.TextField(blank=True, null=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.name} ({self.category.name if self.category else 'N/A'})"


# 3. Stock Model
# This model tracks the inventory details like quantity, expiry, and low-stock threshold.
class Stock(models.Model):
    """Tracks stock quantity, expiry date, and low-stock alerts."""
    # Foreign Key: Links Stock to a Product
    product = models.OneToOneField(
        Product,
        on_delete=models.CASCADE, # If product is deleted, delete its stock record
        related_name='stock'
    )
    quantity = models.IntegerField(
        default=0,
        validators=[MinValueValidator(0)]
    )
    # Expiry date tracking
    expiry_date = models.DateField(null=True, blank=True)

    # Low-stock alert threshold
    low_stock_threshold = models.IntegerField(
        default=10,
        validators=[MinValueValidator(0)]
    )

    def __str__(self):
        return f"Stock for {self.product.name}"