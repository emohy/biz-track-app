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
        notes: '',
        linkedProductId: '' // Optional Field
    });

    const [displayAmount, setDisplayAmount] = useState('');

    useEffect(() => {
        if (initialData) {
            setFormData(initialData);
            setDisplayAmount(initialData.amount ? formatCurrency(initialData.amount) : '');
        } else if (!isOpen) {
            setFormData({ category: '', amount: '', paymentMode: '', notes: '', linkedProductId: '' });
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
        await new Promise(resolve => setTimeout(resolve, 600));

        onSubmit({
            ...formData,
            amount: Number(formData.amount)
        });

        notify(`Expense "${formData.category}" recorded`);
        setIsLoading(false);
        onClose();
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
                            <option value="Cash">Cash</option>
                            <option value="Mobile Money">Mobile Money</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Notes (Optional)</label>
                        <textarea
                            name="notes"
                            value={formData.notes}
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
