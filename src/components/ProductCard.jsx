import { Edit2, Trash2, AlertCircle } from 'lucide-react';
import './ProductCard.css';

const ProductCard = ({ product, onEdit, onDelete }) => {
    const isLowStock = product.stockQuantity <= product.minimumStockLevel;

    return (
        <div className={`product-card ${isLowStock ? 'low-stock' : ''}`}>
            <div className="product-main-info">
                <div className="stock-info-row">
                    <span className="stock-count">{product.stockQuantity}</span>
                    <span className="stock-label">items in stock</span>
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
                        <AlertCircle size={14} />
                        <span>Restock suggested</span>
                    </div>
                )}
            </div>

            <div className="product-actions">
                <button title="Edit Product" onClick={() => onEdit(product)}>
                    <Edit2 size={18} />
                </button>
                <button title="Delete Product" className="delete" onClick={() => onDelete(product.id)}>
                    <Trash2 size={18} />
                </button>
            </div>
        </div>
    );
};

export default ProductCard;
