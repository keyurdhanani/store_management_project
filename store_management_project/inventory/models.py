# inventory/models.py

from django.db import models
from django.core.validators import MinValueValidator
# Imports related to signals have been removed as the logic is now in the save method.


# 1. Category Model
class Category(models.Model):
    """Categories: Medicines, Cosmetics, Health products, etc."""
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True, null=True)

    class Meta:
        verbose_name_plural = "Categories" 

    def __str__(self):
        return self.name


# 2. Product Model
class Product(models.Model):
    """Base product information."""
    name = models.CharField(max_length=200, unique=True)
    category = models.ForeignKey(
        Category,
        on_delete=models.SET_NULL, 
        related_name='products',
        null=True
    )
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
class Stock(models.Model):
    """Tracks stock quantity, expiry date, and low-stock alerts."""
    product = models.OneToOneField(
        Product,
        on_delete=models.CASCADE, 
        related_name='stock'
    )
    quantity = models.IntegerField(
        default=0,
        validators=[MinValueValidator(0)]
    )
    expiry_date = models.DateField(null=True, blank=True) 

    low_stock_threshold = models.IntegerField(
        default=10,
        validators=[MinValueValidator(0)]
    )

    class Meta:
        verbose_name_plural = "Stock"

    def __str__(self):
        return f"Stock for {self.product.name} ({self.quantity} units)"
    
    @property
    def is_low_stock(self):
        return self.quantity <= self.low_stock_threshold
    
    
# 4. Supplier Model
class Supplier(models.Model):
    """Information about product suppliers."""
    name = models.CharField(max_length=200, unique=True)
    contact_person = models.CharField(max_length=100, blank=True)
    phone = models.CharField(max_length=20, blank=True)
    email = models.EmailField(blank=True)
    address = models.TextField(blank=True)

    def __str__(self):
        return self.name

# 5. Purchase Model (Updated with save method)
class Purchase(models.Model):
    """Record of stock purchased from a supplier."""
    product = models.ForeignKey(Product, on_delete=models.PROTECT, related_name='purchases')
    
    supplier = models.ForeignKey(
        Supplier, 
        on_delete=models.SET_NULL, 
        related_name='deliveries', 
        null=True 
    ) 
    
    purchase_quantity = models.IntegerField(validators=[MinValueValidator(1)])
    unit_purchase_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(0.01)]
    )
    purchase_date = models.DateField(auto_now_add=True)
    invoice_number = models.CharField(max_length=50, blank=True, null=True)

    def __str__(self):
        return f"Purchase: {self.product.name} - {self.purchase_quantity} units on {self.purchase_date}"
    
    # Custom save method to update stock when a purchase is recorded
    def save(self, *args, **kwargs):
        is_new = self._state.adding
        super().save(*args, **kwargs) # Save the Purchase first

        # Only update stock on new purchases
        if is_new:
            try:
                # Retrieve the Stock record associated with the product
                stock_record = self.product.stock 

                # Crucial Stock Addition Logic
                # Renamed 'purchased_quantity' to 'purchase_quantity' to match the model field
                stock_record.quantity += self.purchase_quantity 

                # Save the updated quantity
                stock_record.save(update_fields=['quantity']) 

            except Stock.DoesNotExist:
                # In a real system, you'd create the stock record if missing, 
                # but for now, we'll assume it exists or pass.
                print(f"CRITICAL ERROR: Stock record missing for product ID {self.product.id}. Purchase stock not updated.")
                pass

# 6. SaleInvoice Model
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

# 7. SaleItem Model
class SaleItem(models.Model):
    """Details of products sold within a SaleInvoice."""
    invoice = models.ForeignKey(SaleInvoice, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.PROTECT)
    sold_quantity = models.IntegerField(validators=[MinValueValidator(1)])
    unit_sale_price = models.DecimalField(max_digits=10, decimal_places=2) 
    item_total = models.DecimalField(max_digits=10, decimal_places=2)

    def __str__(self):
        return f"Sale: {self.product.name} x {self.sold_quantity}"

    # Custom save method to deduct stock when a sale item is created
    def save(self, *args, **kwargs):
        is_new = self._state.adding
        super().save(*args, **kwargs) # Save the SaleItem first

        # Only update stock on new sale items
        if is_new:
            try:
                # IMPORTANT: Use .select_for_update() in a transaction for real-world safety
                # But for this structure, ensure the relationship is correct:
                stock_record = self.product.stock 

                # Crucial Stock Deduction Logic
                stock_record.quantity -= self.sold_quantity 

                if stock_record.quantity < 0:
                    stock_record.quantity = 0 

                stock_record.save(update_fields=['quantity']) # <-- Use update_fields for efficiency

            except Stock.DoesNotExist:
                # Log an error here in a real app
                print(f"CRITICAL ERROR: Stock record missing for product ID {self.product.id}")
                pass