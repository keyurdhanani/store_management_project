# inventory/admin.py

from django.contrib import admin
from .models import Category, Product, Stock

# Register your models here.
admin.site.register(Category)
admin.site.register(Product)
admin.site.register(Stock)