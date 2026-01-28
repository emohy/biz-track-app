import { Trash2 } from 'lucide-react';
import { useSales } from '../context/SalesContext';
import { useProduct } from '../context/ProductContext';
import { formatCurrency } from '../utils';
import './Sales.css';

const Sales = () => {
    const { sales, deleteSale } = useSales();
    const { products, updateProduct } = useProduct();

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit'
        });
    };

    const handleDelete = (sale) => {
        if (!window.confirm('Delete this sale? This will restore stock.')) {
            return;
        }

        const product = products.find(p => p.id === sale.productId);

        if (!product) {
            alert('Cannot delete because product no longer exists.');
            return;
        }

        // Restore Stock
        const newStock = product.stockQuantity + sale.quantitySold;
        updateProduct(product.id, { stockQuantity: newStock });

        // Delete Sale
        deleteSale(sale.id);
    };

    return (
        <div className="page container">
            <h1>Sales History</h1>

            {sales.length === 0 ? (
                <div className="empty-state">
                    <p>No sales recorded yet. Tap + to add one.</p>
                </div>
            ) : (
                <div className="sales-list">
                    {sales.map(sale => (
                        <div key={sale.id} className="sale-card">
                            <div className="sale-header">
                                <div className="product-info-col">
                                    <span className="sale-product">{sale.productName}</span>
                                    {sale.customerName && (
                                        <span className="sale-customer">{sale.customerName}</span>
                                    )}
                                </div>
                                <div className="sale-header-right">
                                    <span className="sale-amount">
                                        {formatCurrency(sale.totalAmount)}
                                    </span>
                                    <button className="delete-sale-btn" onClick={() => handleDelete(sale)}>
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                            <div className="sale-details-row">
                                <span className="sale-meta">Qty: {sale.quantitySold}</span>
                                <span className="sale-meta">{formatDate(sale.createdAt)}</span>
                            </div>
                            <div className="sale-badges">
                                <span className={`badge status ${sale.paymentStatus.toLowerCase()}`}>
                                    {sale.paymentStatus}
                                </span>
                                <span className="badge mode">
                                    {sale.paymentMode}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Sales;
