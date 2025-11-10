# inventory/views.py

from rest_framework import viewsets
from .models import Category, Product
from .serializers import CategorySerializer, ProductSerializer

# Category ViewSet (Handles /api/categories/)
class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all().order_by('name')
    serializer_class = CategorySerializer

# Product ViewSet (Handles /api/products/)
class ProductViewSet(viewsets.ModelViewSet):
    # Prefetch related data (stock and category) for performance
    queryset = Product.objects.all().select_related('category', 'stock').order_by('name')
    serializer_class = ProductSerializer