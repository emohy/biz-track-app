import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { formatCurrency, parseCurrency } from '../utils'; // Utilities
import { useProduct } from '../context/ProductContext'; // Import ProductContext
import { useSettings } from '../context/SettingsContext';
import './ExpenseForm.css';

const CATEGORIES = [
    'Transport', 'Rent', 'Salaries', 'Internet', 'Marketing',
    'Utilities', 'Food', 'Beer', 'Maintenance'
];

const ExpenseForm = ({ isOpen, onClose, onSubmit, initialData }) => {
    const { notify } = useSettings();
    const [isLoading, setIsLoading] = useState(false);

    const { products } = useProduct() || {}; // Access products, guard against context failure
    const safeProducts = Array.isArray(products) ? products : [];

    const [formData, setFormData] = useState({
        category: '',
        amount: '',
        paymentMode: '',
        description: '',
        linkedProductId: '' // Optional Field
    });

    const [displayAmount, setDisplayAmount] = useState('');

    useEffect(() => {
        if (initialData) {
            setFormData({
                category: initialData.category || '',
                amount: initialData.amount || '',
                paymentMode: initialData.paymentMode || '',
                description: initialData.description || '',
                linkedProductId: initialData.linkedProductId || ''
            });
            setDisplayAmount(initialData.amount ? formatCurrency(initialData.amount) : '');
        } else if (!isOpen) {
            setFormData({ category: '', amount: '', paymentMode: '', description: '', linkedProductId: '' });
            setDisplayAmount('');
        }
    }, [initialData, isOpen]);

    if (!isOpen) return null;

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === 'amount') {
            setDisplayAmount(value);
            const parsed = parseCurrency(value);
            setFormData(prev => ({ ...prev, [name]: parsed }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleBlur = (e) => {
        if (e.target.name === 'amount') {
            setDisplayAmount(formatCurrency(formData.amount));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.category || !formData.amount || Number(formData.amount) < 0 || isLoading) return;

        setIsLoading(true);

        try {
            // Conditionally include optional fields to avoid sending empty strings if preferred, 
            // though rules now allow them. We'll follow the user's request for "clean" data.
            const submissionData = {
                category: formData.category,
                amount: Number(formData.amount)
            };

            if (formData.description) submissionData.description = formData.description;
            if (formData.paymentMode) submissionData.paymentMode = formData.paymentMode;
            if (formData.linkedProductId) submissionData.linkedProductId = formData.linkedProductId;

            await onSubmit(submissionData);

            notify(`Expense "${formData.category}" recorded`);
            onClose();
        } catch (error) {
            console.error("Form Submission Error:", error);
            let userMessage = "Failed to save expense. Please try again.";
            
            if (error.code === 'permission-denied') {
                userMessage = "Permission denied. Check if the amount/category is valid or if you're in Test Mode.";
            } else if (error.message) {
                userMessage = `Error: ${error.message}`;
            }
            
            notify(userMessage, "error");
            // Note: form stays open because we don't call onClose() here
        } finally {
            setIsLoading(false);
        }
    };

    const isValid = formData.category && formData.amount && Number(formData.amount) >= 0;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>{initialData ? 'Edit Expense' : 'Add Expense'}</h2>
                    <button className="close-btn" onClick={onClose}><X size={20} /></button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Category*</label>
                        <select name="category" value={formData.category} onChange={handleChange} required disabled={isLoading}>
                            <option value="">-- Select Category --</option>
                            {CATEGORIES.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Amount*</label>
                        <input
                            type="text"
                            name="amount"
                            value={displayAmount}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            placeholder="UGX 0"
                            required
                            disabled={isLoading}
                        />
                    </div>

                    {/* Optional Linked Product */}
                    <div className="form-group">
                        <label>Linked Product (Optional)</label>
                        <select name="linkedProductId" value={formData.linkedProductId} onChange={handleChange} disabled={isLoading}>
                            <option value="">-- None --</option>
                            {safeProducts.map(p => (
                                <option key={p.id} value={p.id}>{p.productName}</option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Payment Mode (Optional)</label>
                        <select name="paymentMode" value={formData.paymentMode} onChange={handleChange} disabled={isLoading}>
                            <option value="">-- None --</option>
                            <option value="cash">Cash</option>
                            <option value="mobile_money">Mobile Money</option>
                            <option value="bank">Bank Transfer</option>
                            <option value="other">Other</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Description (Optional)</label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            placeholder="Description..."
                            rows="3"
                            disabled={isLoading}
                        />
                    </div>

                    {initialData && (
                        <div className="audit-stamps">
                            <span>Created: {new Date(initialData.createdAt).toLocaleString()}</span>
                            {initialData.updatedAt && (
                                <span>Updated: {new Date(initialData.updatedAt).toLocaleString()}</span>
                            )}
                        </div>
                    )}

                    <button type="submit" className="save-btn" disabled={!isValid || isLoading}>
                        {isLoading ? 'Recording...' : 'Save Expense'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ExpenseForm;
