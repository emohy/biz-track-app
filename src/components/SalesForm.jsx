import { useState, useEffect } from 'react';
import { X, ShoppingBag, User, CreditCard, PieChart, AlertCircle, Search, PlusCircle } from 'lucide-react';
import { useProduct } from '../context/ProductContext';
import { useCustomer } from '../context/CustomerContext';
import { useSettings } from '../context/SettingsContext';
import { formatCurrency, parseCurrency } from '../utils';
import './SalesForm.css';

const SalesForm = ({ isOpen, onClose, onSubmit }) => {
    const { products } = useProduct() || {};
    const safeProducts = Array.isArray(products) ? products : [];

    const { customers, addCustomer } = useCustomer() || {};
    const safeCustomers = Array.isArray(customers) ? customers : [];

    const { notify } = useSettings();

    const [formData, setFormData] = useState({
        productId: '',
        quantitySold: '',
        paymentStatus: 'Paid',
        paymentMode: 'Cash',
        customerId: '',
        customerName: '', // For new customer entry or display
        customerPhone: '',
        amountPaid: ''
    });

    const [selectedProduct, setSelectedProduct] = useState(null);
    const [error, setError] = useState('');
    const [displayPaid, setDisplayPaid] = useState('');
    const [isNewCustomer, setIsNewCustomer] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Autocomplete States
    const [customerSearch, setCustomerSearch] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(false);

    useEffect(() => {
        if (!isOpen) {
            setFormData({
                productId: '',
                quantitySold: '',
                paymentStatus: 'Paid',
                paymentMode: 'Cash',
                customerId: '',
                customerName: '',
                customerPhone: '',
                amountPaid: ''
            });
            setSelectedProduct(null);
            setError('');
            setDisplayPaid('');
            setIsNewCustomer(false);
            setCustomerSearch('');
            setShowSuggestions(false);
        }
    }, [isOpen]);

    const handleProductChange = (e) => {
        const productId = e.target.value;
        const product = safeProducts.find(p => p.id === productId);
        setFormData(prev => ({ ...prev, productId }));
        setSelectedProduct(product || null);
        setError('');
    };

    // Autocomplete Logic
    const filteredCustomers = customerSearch
        ? safeCustomers.filter(c =>
            c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
            (c.phone && c.phone.includes(customerSearch))
        ).slice(0, 5) // Limit to 5 suggestions
        : [];

    const handleSearchChange = (e) => {
        const value = e.target.value;
        setCustomerSearch(value);
        setShowSuggestions(true);

        // Clear selected ID if user changes text (implies starting fresh search or new creation)
        if (formData.customerId) {
            setFormData(prev => ({ ...prev, customerId: '', customerName: value, customerPhone: '' }));
            setIsNewCustomer(false);
        } else {
            setFormData(prev => ({ ...prev, customerName: value }));
        }
    };

    const selectCustomer = (customer) => {
        setFormData(prev => ({
            ...prev,
            customerId: customer.id,
            customerName: customer.name,
            customerPhone: customer.phone || ''
        }));
        setCustomerSearch(customer.name);
        setShowSuggestions(false);
        setIsNewCustomer(false);
    };

    const selectCreateNew = () => {
        setFormData(prev => ({ ...prev, customerId: '', customerName: customerSearch }));
        setIsNewCustomer(true);
        setShowSuggestions(false);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === 'amountPaid') {
            setDisplayPaid(value);
            setFormData(prev => ({ ...prev, [name]: parseCurrency(value) }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
        setError('');
    };

    const handleBlurPaid = () => {
        setDisplayPaid(formatCurrency(formData.amountPaid));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!selectedProduct || isLoading) return;

        const qty = Number(formData.quantitySold);
        if (qty <= 0) {
            setError('Quantity must be greater than 0');
            return;
        }
        if (qty > selectedProduct.stockQuantity) {
            setError(`Only ${selectedProduct.stockQuantity} items in stock`);
            return;
        }

        const totalAmount = selectedProduct.sellingPrice * qty;

        // Start Loading
        setIsLoading(true);

        // --- Simulated processing delay for quality feedback ---
        await new Promise(resolve => setTimeout(resolve, 600));

        // --- Customer Auto-Create / De-Dup Logic ---
        let finalCustomerId = formData.customerId;
        let finalCustomerName = formData.customerName;

        if (!finalCustomerId && (formData.customerName || formData.customerPhone)) {
            const inputPhone = formData.customerPhone ? formData.customerPhone.trim() : '';
            const inputName = formData.customerName ? formData.customerName.trim() : '';

            let existingMatch = null;
            if (inputPhone) existingMatch = safeCustomers.find(c => c.phone === inputPhone);
            if (!existingMatch && inputName) {
                existingMatch = safeCustomers.find(c => c.name.toLowerCase() === inputName.toLowerCase());
            }

            if (existingMatch) {
                finalCustomerId = existingMatch.id;
                finalCustomerName = existingMatch.name;
            } else if (inputName) {
                const newCust = addCustomer({ name: inputName, phone: inputPhone });
                finalCustomerId = newCust.id;
            }
        }

        let amountPaid = 0;
        let amountDue = 0;

        if (formData.paymentStatus === 'Paid') {
            amountPaid = totalAmount;
            amountDue = 0;
        } else if (formData.paymentStatus === 'Unpaid') {
            amountPaid = 0;
            amountDue = totalAmount;
        } else if (formData.paymentStatus === 'Partial') {
            amountPaid = Number(formData.amountPaid);
            if (amountPaid >= totalAmount) {
                setError('Partial payment cannot be equal or greater than total.');
                setIsLoading(false);
                return;
            }
            if (amountPaid <= 0) {
                setError('Partial payment must be greater than 0');
                setIsLoading(false);
                return;
            }
            amountDue = totalAmount - amountPaid;
        }

        // Calculate profit metrics
        const costPrice = selectedProduct.costPrice || 0;
        const profitPerUnit = selectedProduct.sellingPrice - costPrice;
        const totalProfit = profitPerUnit * qty;
        const profitMargin = totalAmount > 0 ? (totalProfit / totalAmount) * 100 : 0;

        onSubmit({
            productId: selectedProduct.id,
            productName: selectedProduct.productName,
            quantitySold: qty,
            sellingPriceAtTime: selectedProduct.sellingPrice,
            totalAmount: totalAmount,
            paymentStatus: formData.paymentStatus,
            paymentMode: formData.paymentMode,
            customerId: finalCustomerId || null,
            customerName: finalCustomerName,
            amountPaid,
            amountDue,
            // Profit tracking
            costPrice,
            profitPerUnit,
            totalProfit,
            profitMargin
        });

        notify(`Sold ${qty}x ${selectedProduct.productName}`);
        setIsLoading(false);
        onClose();
    };

    if (!isOpen) return null;

    const totalAmount = selectedProduct && formData.quantitySold
        ? selectedProduct.sellingPrice * Number(formData.quantitySold)
        : 0;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content premium-modal sales-modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <div className="title-with-icon">
                        <ShoppingBag size={24} className="header-icon" />
                        <h2>Complete Sale</h2>
                    </div>
                    <button className="close-btn" onClick={onClose}><X size={20} /></button>
                </div>

                <form onSubmit={handleSubmit} className="premium-form">
                    {/* Section 1: Product & Quantity */}
                    <section className="form-section">
                        <div className="section-header">Product Selection</div>
                        <div className="form-group">
                            <label>Product*</label>
                            <select
                                name="productId"
                                value={formData.productId}
                                onChange={handleProductChange}
                                required
                                className="premium-select"
                            >
                                <option value="">-- Choose Product --</option>
                                {safeProducts.map(p => (
                                    <option key={p.id} value={p.id}>
                                        {p.productName} ({formatCurrency(p.sellingPrice)})
                                    </option>
                                ))}
                            </select>
                        </div>

                        {selectedProduct && (
                            <div className="stock-info-badge">
                                <AlertCircle size={14} />
                                <span>{selectedProduct.stockQuantity} items in stock</span>
                            </div>
                        )}

                        <div className="form-row">
                            <div className="form-group">
                                <label>Quantity</label>
                                <input
                                    type="number"
                                    name="quantitySold"
                                    value={formData.quantitySold}
                                    onChange={handleChange}
                                    placeholder="0"
                                    required
                                />
                            </div>
                            <div className="form-group total-display-group">
                                <label>Net Total</label>
                                <div className="net-total-display">{formatCurrency(totalAmount)}</div>
                            </div>
                        </div>

                        {/* Insight Panel */}
                        {selectedProduct && formData.quantitySold && (
                            <div className="insight-panel zoom-in">
                                <div className="insight-header">
                                    <PieChart size={16} />
                                    <span>Profit Insight</span>
                                </div>
                                <div className="insight-body">
                                    {(() => {
                                        const costPrice = selectedProduct.costPrice || 0;
                                        const profit = (selectedProduct.sellingPrice - costPrice) * Number(formData.quantitySold);
                                        const margin = totalAmount > 0 ? (profit / totalAmount) * 100 : 0;
                                        return (
                                            <>
                                                <div className="insight-main">
                                                    <span className="insight-label">Est. Profit</span>
                                                    <span className={`insight-value ${profit >= 0 ? 'pos' : 'neg'}`}>
                                                        {formatCurrency(profit)}
                                                    </span>
                                                </div>
                                                <div className={`margin-badge ${margin >= 20 ? 'v-high' : 'v-low'}`}>
                                                    {margin.toFixed(0)}% Margin
                                                </div>
                                            </>
                                        );
                                    })()}
                                </div>
                            </div>
                        )}
                    </section>

                    {/* Section 2: Customer */}
                    <section className="form-section">
                        <div className="section-header">Customer Details</div>
                        <div className="form-group search-container">
                            <div className="input-with-icon">
                                <Search size={18} className="input-icon" />
                                <input
                                    type="text"
                                    value={customerSearch}
                                    onChange={handleSearchChange}
                                    onFocus={() => setShowSuggestions(true)}
                                    placeholder="Search by name or phone..."
                                />
                            </div>
                            {showSuggestions && customerSearch && (
                                <div className="premium-suggestions">
                                    {filteredCustomers.map(c => (
                                        <div key={c.id} className="suggestion-row" onClick={() => selectCustomer(c)}>
                                            <User size={14} />
                                            <div className="suggestion-info">
                                                <span className="s-name">{c.name}</span>
                                                <span className="s-phone">{c.phone}</span>
                                            </div>
                                        </div>
                                    ))}
                                    <div className="suggestion-row create-action" onClick={selectCreateNew}>
                                        <PlusCircle size={14} />
                                        <span>New Customer: "{customerSearch}"</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {(isNewCustomer || (formData.customerName && !formData.customerId)) && (
                            <div className="form-row slide-down">
                                <div className="form-group">
                                    <input name="customerName" value={formData.customerName} onChange={handleChange} placeholder="Name" required />
                                </div>
                                <div className="form-group">
                                    <input name="customerPhone" value={formData.customerPhone} onChange={handleChange} placeholder="Phone" />
                                </div>
                            </div>
                        )}
                    </section>

                    {/* Section 3: Payment */}
                    <section className="form-section highlight-blue">
                        <div className="section-header">Payment & Finalization</div>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Status</label>
                                <select name="paymentStatus" value={formData.paymentStatus} onChange={handleChange}>
                                    <option value="Paid">Fully Paid</option>
                                    <option value="Partial">Partial</option>
                                    <option value="Unpaid">Unpaid / Credit</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Method</label>
                                <select name="paymentMode" value={formData.paymentMode} onChange={handleChange}>
                                    <option value="Cash">Cash</option>
                                    <option value="Mobile Money">M-Pesa</option>
                                    <option value="Credit">Card/Other</option>
                                </select>
                            </div>
                        </div>

                        {formData.paymentStatus === 'Partial' && (
                            <div className="form-group partial-input-group slide-down">
                                <label>Deposit Amount</label>
                                <div className="deposit-input-wrapper">
                                    <CreditCard size={18} />
                                    <input
                                        type="text"
                                        name="amountPaid"
                                        value={displayPaid}
                                        onChange={handleChange}
                                        onBlur={handleBlurPaid}
                                        placeholder="UGX 0"
                                        required
                                    />
                                </div>
                                <small className="due-amount">Remaining: {formatCurrency(totalAmount - (Number(formData.amountPaid) || 0))}</small>
                            </div>
                        )}
                    </section>

                    {error && (
                        <div className="premium-error slide-down">
                            <AlertCircle size={16} />
                            <span>{error}</span>
                        </div>
                    )}

                    <button type="submit" className="save-btn premium-btn" disabled={!selectedProduct || !formData.quantitySold || !!error || isLoading}>
                        {isLoading ? 'Processing...' : 'Record Transaction'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default SalesForm;
