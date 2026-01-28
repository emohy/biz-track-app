import { Edit2, Trash2 } from 'lucide-react';
import './ProductCard.css';

const ProductCard = ({ product, onEdit, onDelete }) => {
    const isLowStock = product.stockQuantity <= product.minimumStockLevel;

    return (
        <div className="product-card">
            <div className="product-info">
                <h3 className="product-name">{product.productName}</h3>
                <div className="stock-info">
                    <span className="stock-count">Stock: {product.stockQuantity}</span>
                    {isLowStock && <span className="status-badge low">LOW STOCK</span>}
                    {!isLowStock && <span className="status-badge normal">NORMAL</span>}
                </div>
            </div>
            <div className="product-actions">
                <button className="action-btn edit" onClick={() => onEdit(product)}>
                    <Edit2 size={18} />
                </button>
                <button className="action-btn delete" onClick={() => onDelete(product.id)}>
                    <Trash2 size={18} />
                </button>
            </div>
        </div>
    );
};

export default ProductCard;
