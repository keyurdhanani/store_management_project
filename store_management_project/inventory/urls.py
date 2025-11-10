# inventory/urls.py (New file in the inventory directory)

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CategoryViewSet, ProductViewSet

# Create a router and register our ViewSets with it.
router = DefaultRouter()
router.register(r'categories', CategoryViewSet) # Endpoint: /api/categories/
router.register(r'products', ProductViewSet)   # Endpoint: /api/products/

# The API URLs are now determined automatically by the router.
urlpatterns = [
    path('', include(router.urls)),
]