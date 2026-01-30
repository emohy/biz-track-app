import { Edit2, Trash2 } from 'lucide-react';
import './ProductCard.css';

const ProductCard = ({ product, onEdit, onDelete }) => {
    const isLowStock = product.stockQuantity <= product.minimumStockLevel;

    return (
        <div className={`product-card ${isLowStock ? 'low-stock' : ''}`}>
            <div className="product-main-info">
                <div className="stock-level-display">
                    <span className="stock-count">{product.stockQuantity}</span>
                    <span className="stock-label">units in stock</span>
                </div>

                <h3 className="product-name">{product.productName}</h3>

                <div className="stock-progress-container">
                    <div
                        className={`stock-progress-bar ${isLowStock ? 'low' : 'normal'}`}
                        style={{ width: `${Math.min(100, (product.stockQuantity / (product.minimumStockLevel * 2)) * 100)}%` }}
                    ></div>
                </div>

                {isLowStock && (
                    <div className="low-stock-alert">
                        <span>Low Stock Risk</span>
                    </div>
                )}
            </div>
            <div className="product-actions">
                <button className="secondary-action-btn" onClick={() => onEdit(product)}>
                    <Edit2 size={16} />
                </button>
                <button className="secondary-action-btn delete" onClick={() => onDelete(product.id)}>
                    <Trash2 size={16} />
                </button>
            </div>
        </div>
    );
};

export default ProductCard;
