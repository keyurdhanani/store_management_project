from django.contrib.auth.models import User
from django.db.models import Sum, F, DecimalField
from django.db.models.functions import TruncDate
from django.http import HttpResponse
from django.utils import timezone
from datetime import timedelta
import csv

# 💥 NEW IMPORT: Necessary for catching the deletion error
from django.db.models.deletion import ProtectedError 

from rest_framework import views, viewsets, generics, status
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated

from .models import Category, Product, SaleItem, Stock, Supplier, Purchase, SaleInvoice
from .serializers import (
    CategorySerializer, 
    ProductSerializer, 
    SupplierSerializer, 
    PurchaseSerializer, 
    SaleInvoiceSerializer,
    UserSerializer
)

# --- Core CRUD ViewSets ---

class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all().order_by('name')
    serializer_class = CategorySerializer
    permission_classes = [IsAuthenticated]

class ProductViewSet(viewsets.ModelViewSet):
    # ✅ FIX 1: Filter queryset to only retrieve active products (is_active=True)
    queryset = Product.objects.filter(is_active=True).select_related('category', 'stock').order_by('name')     
    serializer_class = ProductSerializer
    permission_classes = [IsAuthenticated]

    # ✅ FIX 2: Override destroy() to handle ProtectedError gracefully
    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        try:
            instance.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except ProtectedError as e:
            # Catch the ProtectedError and return a 400 Bad Request with a clear message
            return Response(
                {"detail": "Cannot delete this product. It is linked to existing purchases, sales, or other historical records. Use the 'Deactivate' function instead.",
                 "error": str(e)},
                status=status.HTTP_400_BAD_REQUEST 
            )

class SupplierViewSet(viewsets.ModelViewSet):
    queryset = Supplier.objects.all().order_by('name')
    serializer_class = SupplierSerializer
    permission_classes = [IsAuthenticated]

class PurchaseViewSet(viewsets.ModelViewSet):
    """
    Handles Purchases. Creation relies on the PurchaseSerializer
    to correctly populate batch_number_input and expiry_date_input 
    for the model signal to manage Stock/Batch records.
    """
    queryset = Purchase.objects.all().select_related('product', 'supplier', 'batch_created').order_by('-purchase_date')
    serializer_class = PurchaseSerializer
    permission_classes = [IsAuthenticated]


class SaleInvoiceViewSet(viewsets.ModelViewSet):
    queryset = SaleInvoice.objects.all().prefetch_related('items__product').order_by('-sale_date')
    serializer_class = SaleInvoiceSerializer
    permission_classes = [IsAuthenticated]


# --- Authentication ---

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = (AllowAny,)
    serializer_class = UserSerializer


# --- Analytics and Reporting Views ---

class DashboardStatsView(views.APIView):
    """API to return aggregated statistics for the dashboard cards."""
    permission_classes = [IsAuthenticated]

    def get(self, request, format=None):
        # --- 1. Key Metrics ---

        total_products = Product.objects.count()

        # NOTE: Using product__base_price is a simple way, but cost_price from Batches 
        # would be more accurate for true inventory value.
        stock_value = Stock.objects.aggregate(
            total_value=Sum(F('product__base_price') * F('quantity'), output_field=DecimalField())
        )['total_value'] or 0.00

        low_stock_count = Stock.objects.filter(
            quantity__lte=F('low_stock_threshold'), quantity__gt=0
        ).count()

        # --- 2. Sales Metrics (Last 7 Days) ---
        seven_days_ago = timezone.now() - timedelta(days=7)

        recent_sales = SaleInvoice.objects.filter(sale_date__gte=seven_days_ago)

        recent_revenue = recent_sales.aggregate(
            total=Sum('final_total', output_field=DecimalField())
        )['total'] or 0.00

        recent_sales_count = recent_sales.count()

        data = {
            'total_products': total_products,
            'total_stock_value': round(stock_value, 2),
            'low_stock_count': low_stock_count,
            'recent_revenue': round(recent_revenue, 2),
            'recent_sales_count': recent_sales_count,
        }
        return Response(data)


class LowStockListView(views.APIView):
    """API to return a list of products that are currently low on stock."""
    permission_classes = [IsAuthenticated]

    def get(self, request, format=None):
        low_stock_products = Product.objects.filter(
            stock__quantity__lte=F('stock__low_stock_threshold'), 
            stock__quantity__gt=0
        ).select_related('stock', 'category')

        serializer = ProductSerializer(low_stock_products, many=True)
        return Response(serializer.data)
    
class SaleHistoryListView(viewsets.ReadOnlyModelViewSet):
    """View for listing all past sales."""
    queryset = SaleInvoice.objects.all().prefetch_related('items').order_by('-sale_date')
    serializer_class = SaleInvoiceSerializer
    permission_classes = [IsAuthenticated]
    
class PurchaseHistoryListView(viewsets.ReadOnlyModelViewSet):
    """View for listing all past purchases."""
    queryset = Purchase.objects.all().select_related('product', 'supplier', 'batch_created').order_by('-purchase_date')
    serializer_class = PurchaseSerializer
    permission_classes = [IsAuthenticated]
    
class SalesExportView(views.APIView):
    """API to export all sales data to a CSV file."""
    permission_classes = [IsAuthenticated]

    def get(self, request, format=None):
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="sales_report.csv"'

        writer = csv.writer(response)
        # Define CSV Header Row
        writer.writerow(['Invoice No', 'Date', 'Customer Name', 'Subtotal', 'Tax', 'Total'])

        # Fetch data
        sales = SaleInvoice.objects.all().order_by('-sale_date')

        # Write data rows
        for sale in sales:
            writer.writerow([
                sale.invoice_number,
                sale.sale_date.strftime('%Y-%m-%d %H:%M'),
                sale.customer_name or 'N/A',
                sale.subtotal,
                sale.tax_amount,
                sale.final_total
            ])

        return response
    
class ProfitMarginView(views.APIView):
    """Calculates total sales revenue and profit margin grouped by date."""
    permission_classes = [IsAuthenticated]

    def get(self, request, format=None):
        sales_items = SaleItem.objects.annotate(
            revenue=F('unit_sale_price') * F('sold_quantity'),
            cost=F('unit_cost_price') * F('sold_quantity'),
            profit=F('revenue') - F('cost')
        ).select_related('invoice')

        daily_margins = sales_items.annotate(
            date=TruncDate('invoice__sale_date') 
        ).values('date').annotate(
            total_revenue=Sum('revenue'),
            total_cost=Sum('cost'),
            total_profit=Sum('profit')
        ).order_by('-date')

        return Response(list(daily_margins))