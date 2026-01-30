import { useState, useEffect } from 'react';
import { Trash2 } from 'lucide-react';
import { useSales } from '../context/SalesContext';
import { useProduct } from '../context/ProductContext';
import { formatCurrency } from '../utils';
import UndoToast from '../components/UndoToast';
import SkeletonLoader from '../components/SkeletonLoader';
import './Sales.css';

const Sales = () => {
    const { sales, deleteSale, undoDelete } = useSales();
    const { products, updateProduct } = useProduct();
    const [lastDeletedSale, setLastDeletedSale] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => setIsLoading(false), 400);
        return () => clearTimeout(timer);
    }, []);

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit'
        });
    };

    const handleDelete = (sale) => {
        const product = products.find(p => p.id === sale.productId);

        if (product) {
            // Restore Stock immediately
            updateProduct(product.id, {
                stockQuantity: product.stockQuantity + sale.quantitySold
            });
        }

        // Soft Delete Sale
        deleteSale(sale.id);
        setLastDeletedSale(sale);
    };

    const handleUndo = () => {
        if (!lastDeletedSale) return;

        const product = products.find(p => p.id === lastDeletedSale.productId);
        if (product) {
            // Re-take Stock
            updateProduct(product.id, {
                stockQuantity: product.stockQuantity - lastDeletedSale.quantitySold
            });
        }

        undoDelete(lastDeletedSale.id);
        setLastDeletedSale(null);
    };

    return (
        <div className="page container">
            <h1>Sales History</h1>

            {isLoading ? (
                <SkeletonLoader type="list" count={4} />
            ) : sales.length === 0 ? (
                <div className="empty-state">
                    <p>No sales recorded yet.</p>
                    <small>Record your first transaction to start generating business growth insights.</small>
                </div>
            ) : (
                <div className="sales-list fade-in">
                    {sales.map(sale => (
                        <div key={sale.id} className="sale-card">
                            <div className="sale-main-row">
                                <div className="sale-primary-info">
                                    <span className="sale-amount">
                                        {formatCurrency(sale.totalAmount)}
                                    </span>

                                    {/* Profit Display */}
                                    {sale.totalProfit !== undefined && (
                                        <div className="profit-info">
                                            <span className="profit-amount">
                                                +{formatCurrency(sale.totalProfit)}
                                            </span>
                                            <span className={`profit-margin-badge ${sale.profitMargin >= 30 ? 'high' : sale.profitMargin >= 15 ? 'medium' : 'low'}`}>
                                                {sale.profitMargin.toFixed(1)}%
                                            </span>
                                        </div>
                                    )}

                                    <div className="product-info-col">
                                        <span className="sale-product">{sale.productName}</span>
                                        {sale.customerName && (
                                            <span className="sale-customer">{sale.customerName}</span>
                                        )}
                                    </div>
                                </div>
                                <button className="delete-sale-btn" onClick={() => handleDelete(sale)}>
                                    <Trash2 size={16} />
                                </button>
                            </div>

                            <div className="sale-footer">
                                <div className="sale-badges">
                                    <span className={`badge status ${sale.paymentStatus.toLowerCase()}`}>
                                        {sale.paymentStatus}
                                    </span>
                                    <span className="badge mode-chip">
                                        {sale.paymentMode}
                                    </span>
                                </div>
                                <div className="sale-meta-info">
                                    <span className="sale-meta">Qty: {sale.quantitySold}</span>
                                    <span className="sale-meta-dot">•</span>
                                    <span className="sale-meta">{formatDate(sale.createdAt)}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {lastDeletedSale && (
                <UndoToast
                    message="Sale deleted & stock restored"
                    onUndo={handleUndo}
                    onDismiss={() => setLastDeletedSale(null)}
                />
            )}
        </div>
    );
};

export default Sales;
