import { useState, useEffect } from 'react';
import { useProduct } from '../context/ProductContext';
import ProductCard from '../components/ProductCard';
import ProductForm from '../components/ProductForm';
import UndoToast from '../components/UndoToast';
import SkeletonLoader from '../components/SkeletonLoader';
import './Inventory.css';

const Inventory = () => {
    const { products, updateProduct, deleteProduct, undoDelete } = useProduct();
    const [editingProduct, setEditingProduct] = useState(null);
    const [lastDeletedId, setLastDeletedId] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => setIsLoading(false), 400);
        return () => clearTimeout(timer);
    }, []);

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
        <div className="page container">
            <h1>Inventory</h1>

            {isLoading ? (
                <SkeletonLoader type="card" count={3} />
            ) : products.length === 0 ? (
                <div className="empty-state">
                    <p>Ready to organize your shop?</p>
                    <small>Tap + to add your first product and track stock levels in real-time.</small>
                </div>
            ) : (
                <div className="product-list fade-in">
                    {products.map(product => (
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
