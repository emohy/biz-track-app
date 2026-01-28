import { useState } from 'react';
import { useProduct } from '../context/ProductContext';
import ProductCard from '../components/ProductCard';
import ProductForm from '../components/ProductForm';
import './Inventory.css';

const Inventory = () => {
    const { products, updateProduct, deleteProduct } = useProduct();
    const [editingProduct, setEditingProduct] = useState(null);

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
        if (window.confirm('Are you sure you want to delete this product?')) {
            deleteProduct(id);
        }
    };

    return (
        <div className="page container">
            <h1>Inventory</h1>

            {products.length === 0 ? (
                <div className="empty-state">
                    <p>No products yet. Tap + to add one.</p>
                </div>
            ) : (
                <div className="product-list">
                    {products.map(product => (
                        <ProductCard
                            key={product.id}
                            product={product}
                            onEdit={handleEditClick}
                            onDelete={handleDelete}
                        // Assuming ProductCard will use formatCurrency internally for price display
                        // If Inventory itself needed to display a formatted price, it would be done here:
                        // <p>Price: {formatCurrency(product.price)}</p>
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
        </div>
    );
};

export default Inventory;
