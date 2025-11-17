# inventory/urls.py (FINAL CODE)

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (CategoryViewSet, ProductViewSet, SupplierViewSet, 
                    PurchaseViewSet, SaleInvoiceViewSet,
                    DashboardStatsView, LowStockListView,
                    PurchaseHistoryListView, SaleHistoryListView, SalesExportView,
                    # Import the new view
                    RegisterView) 
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

router = DefaultRouter()
router.register(r'categories', CategoryViewSet)
router.register(r'products', ProductViewSet) 
router.register(r'suppliers', SupplierViewSet) 
router.register(r'purchases', PurchaseViewSet)
router.register(r'sales', SaleInvoiceViewSet)

urlpatterns = [
    # --- New Registration and Authentication Paths ---
    path('auth/register/', RegisterView.as_view(), name='auth_register'),
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # --- Router Paths ---
    path('', include(router.urls)),
    
    # --- Custom API Paths ---
    path('dashboard/stats/', DashboardStatsView.as_view(), name='dashboard-stats'),
    path('dashboard/low-stock/', LowStockListView.as_view(), name='low-stock-list'),
    path('history/sales/', SaleHistoryListView.as_view({'get': 'list'}), name='sales-history'),
    path('history/purchases/', PurchaseHistoryListView.as_view({'get': 'list'}), name='purchase-history'),
    path('export/sales/', SalesExportView.as_view(), name='sales-export'),
]