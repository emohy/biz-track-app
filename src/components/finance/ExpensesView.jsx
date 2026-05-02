import { useState, useEffect } from 'react';
import {
    Edit2, Trash2, Home, User, ShoppingBag,
    Zap, Truck, FileText, MoreHorizontal
} from 'lucide-react';
import { useExpense } from '../../context/ExpenseContext';
import { useProduct } from '../../context/ProductContext';
import ExpenseForm from '../ExpenseForm';
import { formatCurrency } from '../../utils';
import UndoToast from '../UndoToast';
import SkeletonLoader from '../SkeletonLoader';
import './ExpensesView.css';

const ExpensesView = () => {
    const { expenses, updateExpense, deleteExpense, undoDelete } = useExpense();
    const { products } = useProduct() || { products: [] };
    const [editingExpense, setEditingExpense] = useState(null);
    const [lastDeletedId, setLastDeletedId] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => setIsLoading(false), 400);
        return () => clearTimeout(timer);
    }, []);

    const getCategoryIcon = (category) => {
        const cat = category?.toLowerCase() || '';
        if (cat.includes('rent')) return <Home size={20} />;
        if (cat.includes('salary') || cat.includes('wage')) return <User size={20} />;
        if (cat.includes('utility') || cat.includes('bill') || cat.includes('electricity')) return <Zap size={20} />;
        if (cat.includes('stock') || cat.includes('inventory') || cat.includes('purchase')) return <ShoppingBag size={20} />;
        if (cat.includes('transport') || cat.includes('delivery')) return <Truck size={20} />;
        if (cat.includes('tax') || cat.includes('legal')) return <FileText size={20} />;
        return <MoreHorizontal size={20} />;
    };

    const handleEditClick = (expense) => {
        setEditingExpense(expense);
    };

    const handleUpdate = (updatedData) => {
        if (editingExpense) {
            return updateExpense(editingExpense.id, updatedData);
        }
    };

    const handleDelete = (id) => {
        deleteExpense(id);
        setLastDeletedId(id);
    };

    const handleUndo = () => {
        if (lastDeletedId) {
            undoDelete(lastDeletedId);
            setLastDeletedId(null);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'Just now';
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return 'Just now';

        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric'
        }) + ' • ' + date.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit'
        });
    };
    
    const getProductName = (id) => {
        if (!id) return null;
        const product = products?.find(p => p.id === id);
        return product ? product.productName : null;
    };

    return (
        <div className="expenses-view">
            {isLoading ? (
                <SkeletonLoader type="list" count={4} />
            ) : expenses.length === 0 ? (
                <div className="empty-state">
                    <p>No spending recorded yet</p>
                    <small>Track your operational costs to get a clear view of your net profit.</small>
                </div>
            ) : (
                <div className="expenses-list fade-in">
                    {expenses.map(expense => (
                        <div key={expense.id} className="expense-card">
                            <div className="category-icon-wrapper">
                                {getCategoryIcon(expense.category)}
                            </div>

                            <div className="expense-details">
                                <div className="expense-top-line">
                                    <span className="expense-category">{expense.category}</span>
                                    <span className="expense-amount">{formatCurrency(expense.amount)}</span>
                                </div>

                                <div className="expense-footer">
                                    <span className="expense-date">{formatDate(expense.createdAt)}</span>
                                    {expense.paymentMode && (
                                        <span className="expense-mode-chip">
                                            {expense.paymentMode.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                                        </span>
                                    )}
                                    {expense.linkedProductId && getProductName(expense.linkedProductId) && (
                                        <span className="expense-mode-chip product-link">
                                            Linked: {getProductName(expense.linkedProductId)}
                                        </span>
                                    )}
                                </div>

                                {expense.description && (
                                    <div className="expense-notes-preview">
                                        "{expense.description}"
                                    </div>
                                )}
                            </div>

                            <div className="expense-card-actions">
                                <button title="Edit" onClick={() => handleEditClick(expense)}>
                                    <Edit2 size={16} />
                                </button>
                                <button title="Delete" className="delete" onClick={() => handleDelete(expense.id)}>
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <ExpenseForm
                isOpen={!!editingExpense}
                onClose={() => setEditingExpense(null)}
                onSubmit={handleUpdate}
                initialData={editingExpense}
            />

            {lastDeletedId && (
                <UndoToast
                    message="Expense deleted"
                    onUndo={handleUndo}
                    onDismiss={() => setLastDeletedId(null)}
                />
            )}
        </div>
    );
};

export default ExpensesView;
