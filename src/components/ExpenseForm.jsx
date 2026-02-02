import { useState, useEffect } from 'react';
import {
    X,
    Receipt,
    Truck,
    Home,
    UserCircle,
    Globe,
    Share2,
    Zap,
    Coffee,
    Tool,
    FileText,
    CreditCard
} from 'lucide-react';
import { formatCurrency, parseCurrency } from '../utils';
import { useProduct } from '../context/ProductContext';
import { useSettings } from '../context/SettingsContext';
import './ExpenseForm.css';

const CATEGORIES = [
    { name: 'Transport', icon: <Truck size={18} /> },
    { name: 'Rent', icon: <Home size={18} /> },
    { name: 'Salaries', icon: <UserCircle size={18} /> },
    { name: 'Internet', icon: <Globe size={18} /> },
    { name: 'Marketing', icon: <Share2 size={18} /> },
    { name: 'Utilities', icon: <Zap size={18} /> },
    { name: 'Food', icon: <Coffee size={18} /> },
    { name: 'Beer', icon: <Coffee size={18} /> },
    { name: 'Maintenance', icon: <Tool size={18} /> }
];

const ExpenseForm = ({ isOpen, onClose, onSubmit, initialData }) => {
    const { notify } = useSettings();
    const [isLoading, setIsLoading] = useState(false);

    const { products } = useProduct() || {};
    const safeProducts = Array.isArray(products) ? products : [];

    const [formData, setFormData] = useState({
        category: '',
        amount: '',
        paymentMode: '',
        notes: '',
        linkedProductId: ''
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
            <div className="modal-content premium-modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <div className="title-with-icon">
                        <Receipt size={24} className="header-icon" />
                        <h2>{initialData ? 'Edit Expense' : 'Add Expense'}</h2>
                    </div>
                    <button className="close-btn" onClick={onClose}><X size={20} /></button>
                </div>

                <form onSubmit={handleSubmit} className="premium-form">
                    <section className="form-section category-grid-section">
                        <div className="section-header">Select Category</div>
                        <div className="category-chips">
                            {CATEGORIES.map(cat => (
                                <button
                                    key={cat.name}
                                    type="button"
                                    className={`category-chip ${formData.category === cat.name ? 'active' : ''}`}
                                    onClick={() => setFormData(prev => ({ ...prev, category: cat.name }))}
                                >
                                    {cat.icon}
                                    <span>{cat.name}</span>
                                </button>
                            ))}
                        </div>
                    </section>

                    <section className="form-section amount-section">
                        <label className="section-label">Amount Spent*</label>
                        <div className="amount-input-wrapper">
                            <span className="currency-symbol">UGX</span>
                            <input
                                type="text"
                                name="amount"
                                value={displayAmount}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                placeholder="0"
                                required
                                disabled={isLoading}
                                className="big-amount-input"
                            />
                        </div>
                    </section>

                    <section className="form-section">
                        <div className="form-row">
                            <div className="form-group">
                                <label>Linked Product</label>
                                <select name="linkedProductId" value={formData.linkedProductId} onChange={handleChange} disabled={isLoading}>
                                    <option value="">-- None --</option>
                                    {safeProducts.map(p => (
                                        <option key={p.id} value={p.id}>{p.productName}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Payment Mode</label>
                                <select name="paymentMode" value={formData.paymentMode} onChange={handleChange} disabled={isLoading}>
                                    <option value="">-- None --</option>
                                    <option value="Cash">Cash</option>
                                    <option value="Mobile Money">Mobile Money</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                        </div>
                    </section>

                    <section className="form-section">
                        <div className="form-group">
                            <label className="label-with-icon"><FileText size={14} /> Notes</label>
                            <textarea
                                name="notes"
                                value={formData.notes}
                                onChange={handleChange}
                                placeholder="What was this for? (e.g. Fuel for delivery truck)"
                                rows="3"
                                disabled={isLoading}
                                className="premium-textarea"
                            />
                        </div>
                    </section>

                    <button type="submit" className="save-btn premium-btn" disabled={!isValid || isLoading}>
                        {isLoading ? 'Recording...' : 'Record Expense'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ExpenseForm;
