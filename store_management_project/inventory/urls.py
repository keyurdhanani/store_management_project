# inventory/urls.py (New file in the inventory directory)

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CategoryViewSet, ProductViewSet, SupplierViewSet, PurchaseViewSet
from .views import (CategoryViewSet, ProductViewSet, SupplierViewSet, 
                   PurchaseViewSet, SaleInvoiceViewSet,
                   DashboardStatsView, LowStockListView)

router = DefaultRouter()
router.register(r'categories', CategoryViewSet)
router.register(r'products', ProductViewSet)   
router.register(r'suppliers', SupplierViewSet) 
router.register(r'purchases', PurchaseViewSet)
router.register(r'sales', SaleInvoiceViewSet)
urlpatterns = [
    path('', include(router.urls)),
    path('dashboard/stats/', DashboardStatsView.as_view(), name='dashboard-stats'),
    path('dashboard/low-stock/', LowStockListView.as_view(), name='low-stock-list'),
]