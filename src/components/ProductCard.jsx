import { Edit2, Trash2, AlertCircle, Coins, Award } from 'lucide-react';
import { formatCurrency } from '../utils';
import './ProductCard.css';

const ProductCard = ({ product, onEdit, onDelete }) => {
    const isLowStock = product.stockQuantity <= product.minimumStockLevel;
    const profit = product.sellingPrice - product.costPrice;
    const margin = ((profit / product.sellingPrice) * 100).toFixed(0);

    return (
        <div className={`product-card ${isLowStock ? 'low-stock' : ''}`}>
            <div className="product-visual-cell">
                <div className="product-initial">
                    {product.productName.charAt(0).toUpperCase()}
                </div>
            </div>

            <div className="product-main-info">
                <div className="product-title-row">
                    <h3 className="product-name">{product.productName}</h3>
                    {profit > 0 && (
                        <div className="profit-tag">
                            <Award size={10} />
                            {margin}% margin
                        </div>
                    )}
                </div>

                <div className="product-price-row">
                    <div className="price-item">
                        <span className="price-label">Selling Price</span>
                        <span className="price-value">{formatCurrency(product.sellingPrice)}</span>
                    </div>
                </div>

                <div className="stock-visual-row">
                    <div className="stock-info-compact">
                        <span className="stock-count">{product.stockQuantity}</span>
                        <span className="stock-label">units</span>
                    </div>
                    <div className="stock-progress-container">
                        <div
                            className={`stock-progress-bar ${isLowStock ? 'low' : 'normal'}`}
                            style={{ width: `${Math.min(100, (product.stockQuantity / (product.minimumStockLevel * 2)) * 100)}%` }}
                        ></div>
                    </div>
                </div>

                {isLowStock && (
                    <div className="low-stock-alert">
                        <AlertCircle size={14} />
                        <span>Restock suggested</span>
                    </div>
                )}
            </div>

            <div className="product-actions">
                <button title="Edit Product" onClick={() => onEdit(product)}>
                    <Edit2 size={16} />
                </button>
                <button title="Delete Product" className="delete" onClick={() => onDelete(product.id)}>
                    <Trash2 size={16} />
                </button>
            </div>
        </div>
    );
};

export default ProductCard;
