import { useState } from 'react';
import { Edit2, Trash2 } from 'lucide-react';
import { useExpense } from '../context/ExpenseContext';
import ExpenseForm from '../components/ExpenseForm';
import { formatCurrency } from '../utils';
import './Expenses.css';

const Expenses = () => {
    const { expenses, updateExpense, deleteExpense } = useExpense();
    const [editingExpense, setEditingExpense] = useState(null);

    const handleEditClick = (expense) => {
        setEditingExpense(expense);
    };

    const handleUpdate = (updatedData) => {
        if (editingExpense) {
            updateExpense(editingExpense.id, updatedData);
            setEditingExpense(null);
        }
    };

    const handleDelete = (id) => {
        if (window.confirm('Are you sure you want to delete this expense?')) {
            deleteExpense(id);
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit'
        });
    };

    return (
        <div className="page container">
            <h1>Expenses</h1>

            {expenses.length === 0 ? (
                <div className="empty-state">
                    <p>No expenses recorded. Tap + to add one.</p>
                </div>
            ) : (
                <div className="expenses-list">
                    {expenses.map(expense => (
                        <div key={expense.id} className="expense-card">
                            <div className="expense-header">
                                <span className="expense-category">{expense.category}</span>
                                <span className="expense-amount">
                                    {formatCurrency(expense.amount)}
                                </span>
                            </div>
                            <div className="expense-meta">
                                <span>{formatDate(expense.createdAt)}</span>
                                {expense.paymentMode && (
                                    <span className="expense-mode">{expense.paymentMode}</span>
                                )}
                            </div>
                            {expense.notes && (
                                <div className="expense-notes">
                                    {expense.notes}
                                </div>
                            )}
                            <div className="expense-actions">
                                <button className="action-btn edit" onClick={() => handleEditClick(expense)}>
                                    <Edit2 size={16} />
                                </button>
                                <button className="action-btn delete" onClick={() => handleDelete(expense.id)}>
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
        </div>
    );
};

export default Expenses;
