import { useState, useMemo, useEffect } from 'react';
import { useProduct } from '../context/ProductContext';
import { Search, X, Package, AlertTriangle, TrendingUp } from 'lucide-react';
import ProductCard from '../components/ProductCard';
import ProductForm from '../components/ProductForm';
import UndoToast from '../components/UndoToast';
import SkeletonLoader from '../components/SkeletonLoader';
import { formatCurrency } from '../utils';
import './Inventory.css';

const Inventory = () => {
    const { products, updateProduct, deleteProduct, undoDelete } = useProduct();
    const [editingProduct, setEditingProduct] = useState(null);
    const [lastDeletedId, setLastDeletedId] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const timer = setTimeout(() => setIsLoading(false), 400);
        return () => clearTimeout(timer);
    }, []);

    const filteredProducts = useMemo(() => {
        if (!searchQuery) return products;
        const q = searchQuery.toLowerCase();
        return products.filter(p =>
            p.productName.toLowerCase().includes(q) ||
            (p.supplierName && p.supplierName.toLowerCase().includes(q))
        );
    }, [products, searchQuery]);

    const stats = useMemo(() => {
        const totalValue = products.reduce((acc, p) => acc + (p.stockQuantity * p.sellingPrice), 0);
        const lowStockCount = products.filter(p => p.stockQuantity <= p.minimumStockLevel).length;
        return { totalValue, lowStockCount, count: products.length };
    }, [products]);

    const handleEditClick = (product) => {
        setEditingProduct(product);
    };

    const handleUpdate = (updatedData) => {
        if (editingProduct) {
            updateProduct(editingProduct.id, updatedData);
            setEditingProduct(null);
        }
    };

    const handleDelete = (id) => {
        deleteProduct(id);
        setLastDeletedId(id);
    };

    const handleUndo = () => {
        if (lastDeletedId) {
            undoDelete(lastDeletedId);
            setLastDeletedId(null);
        }
    };

    return (
        <div className="page container fade-in">
            <div className="inventory-header">
                <h1>
                    Inventory
                    <span className="count-badge">{stats.count}</span>
                </h1>
            </div>

            <div className="inventory-stats-row">
                <div className="mini-stat-card">
                    <TrendingUp className="stat-icon purple" size={18} />
                    <div className="stat-content">
                        <span className="stat-label">Stock Value</span>
                        <span className="stat-value">{formatCurrency(stats.totalValue)}</span>
                    </div>
                </div>
                <div className="mini-stat-card">
                    <AlertTriangle className={`stat-icon ${stats.lowStockCount > 0 ? 'red' : 'green'}`} size={18} />
                    <div className="stat-content">
                        <span className="stat-label">Low Stock</span>
                        <span className="stat-value">{stats.lowStockCount} items</span>
                    </div>
                </div>
            </div>

            <div className="search-container">
                <div className="premium-search-bar">
                    <Search className="search-icon" size={20} />
                    <input
                        type="text"
                        placeholder="Search products or suppliers..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    {searchQuery && (
                        <X
                            size={18}
                            className="clear-icon"
                            onClick={() => setSearchQuery('')}
                        />
                    )}
                </div>
            </div>

            {isLoading ? (
                <SkeletonLoader type="card" count={3} />
            ) : filteredProducts.length === 0 ? (
                <div className="empty-state card">
                    <Package size={48} className="empty-icon" />
                    <p>{searchQuery ? 'No products match your search' : 'Ready to organize your shop?'}</p>
                    <small>Tap + to add your first product and track stock levels in real-time.</small>
                </div>
            ) : (
                <div className="product-list">
                    {filteredProducts.map(product => (
                        <ProductCard
                            key={product.id}
                            product={product}
                            onEdit={handleEditClick}
                            onDelete={handleDelete}
                        />
                    ))}
                </div>
            )}

            <ProductForm
                isOpen={!!editingProduct}
                onClose={() => setEditingProduct(null)}
                onSubmit={handleUpdate}
                initialData={editingProduct}
            />

            {lastDeletedId && (
                <UndoToast
                    message="Product deleted"
                    onUndo={handleUndo}
                    onDismiss={() => setLastDeletedId(null)}
                />
            )}
        </div>
    );
};

export default Inventory;
