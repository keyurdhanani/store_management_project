# inventory/models.py

from django.db import models
from django.core.validators import MinValueValidator
from django.db.models import F 

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

    def __str__(self):
        return f"Stock for {self.product.name}"
    
    
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

# 5. Purchase Model
class Purchase(models.Model):
    """Record of stock purchased from a supplier."""
    product = models.ForeignKey(Product, on_delete=models.PROTECT, related_name='purchases')
    supplier = models.ForeignKey(Supplier, on_delete=models.PROTECT, related_name='deliveries')
    purchase_quantity = models.IntegerField(validators=[MinValueValidator(1)])
    unit_purchase_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(0.01)]
    )
    purchase_date = models.DateField(auto_now_add=True)
    invoice_number = models.CharField(max_length=50, blank=True, null=True)

    def __str__(self):
        return f"{self.product.name} - {self.purchase_quantity} units on {self.purchase_date}"
    
    # Custom save method to update stock when a purchase is recorded
    def save(self, *args, **kwargs):
        is_new = self._state.adding
        super().save(*args, **kwargs)
        
        # Only update stock on new purchases
        if is_new:
            try:
                # Use F expression for atomic update to avoid race conditions
                Stock.objects.filter(product=self.product).update(
                    quantity=F('quantity') + self.purchase_quantity
                )
            except Stock.DoesNotExist:
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
        return f"{self.product.name} x {self.sold_quantity}"

    # Custom save method to deduct stock when a sale item is created
    def save(self, *args, **kwargs):
        is_new = self._state.adding
        
        # --- Stock Check and Deduction Logic ---
        if is_new:
            # 1. Check stock BEFORE saving the SaleItem record
            stock_record = self.product.stock
            if stock_record.quantity < self.sold_quantity:
                print(f"ERROR: Insufficient stock for {self.product.name}. Saving sale but stock will go negative/to zero.")
            
            # 2. Save the SaleItem record first
            super().save(*args, **kwargs)

            # 3. Perform atomic deduction *after* successful save
            try:
                Stock.objects.filter(product=self.product).update(
                    quantity=F('quantity') - self.sold_quantity
                )
            except Stock.DoesNotExist:
                pass
            
        else:
            super().save(*args, **kwargs)