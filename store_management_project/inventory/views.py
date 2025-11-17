
from rest_framework import viewsets
from .models import Category, Product, Stock, Supplier, Purchase, SaleInvoice
from .serializers import CategorySerializer, ProductSerializer, SupplierSerializer, PurchaseSerializer, SaleInvoiceSerializer
from rest_framework import views
from rest_framework.response import Response
from django.db.models import Sum, F, DecimalField
from django.utils import timezone
from django.http import HttpResponse
import csv
from datetime import timedelta

class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all().order_by('name')
    serializer_class = CategorySerializer

class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all().select_related('category', 'stock').order_by('name')
    serializer_class = ProductSerializer

class SupplierViewSet(viewsets.ModelViewSet):
    queryset = Supplier.objects.all().order_by('name')
    serializer_class = SupplierSerializer

class PurchaseViewSet(viewsets.ModelViewSet):
    queryset = Purchase.objects.all().select_related('product', 'supplier').order_by('-purchase_date')
    serializer_class = PurchaseSerializer

class SaleInvoiceViewSet(viewsets.ModelViewSet):
    # Stock deduction is now handled reliably by SaleItem.save()
    queryset = SaleInvoice.objects.all().prefetch_related('items__product').order_by('-sale_date')
    serializer_class = SaleInvoiceSerializer


class DashboardStatsView(views.APIView):
    """API to return aggregated statistics for the dashboard cards."""

    def get(self, request, format=None):
        # --- 1. Key Metrics ---

        total_products = Product.objects.count()

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

    def get(self, request, format=None):
        low_stock_products = Product.objects.filter(
            stock__quantity__lte=F('stock__low_stock_threshold'), 
            stock__quantity__gt=0
        ).select_related('stock', 'category')

        # We reuse the ProductSerializer to format the output
        # (Assuming ProductSerializer includes stock details as a nested field)
        serializer = ProductSerializer(low_stock_products, many=True)
        return Response(serializer.data)
    
class SaleHistoryListView(viewsets.ReadOnlyModelViewSet):
    """View for listing all past sales."""
    queryset = SaleInvoice.objects.all().prefetch_related('items').order_by('-sale_date')
    serializer_class = SaleInvoiceSerializer
    
class PurchaseHistoryListView(viewsets.ReadOnlyModelViewSet):
    """View for listing all past purchases."""
    queryset = Purchase.objects.all().select_related('product', 'supplier').order_by('-purchase_date')
    serializer_class = PurchaseSerializer
    
class SalesExportView(views.APIView):
    """API to export all sales data to a CSV file."""

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