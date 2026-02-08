import { useState, useEffect, useMemo } from 'react';
import { X, AlertCircle, BookUser, Phone } from 'lucide-react';
import { useProduct } from '../context/ProductContext';
import { useCustomer } from '../context/CustomerContext';
import { useSettings } from '../context/SettingsContext';
import { formatCurrency, parseCurrency, normalizePhone } from '../utils';
import BottomSheet from './BottomSheet';
import './SalesForm.css';

const SalesForm = ({ isOpen, onClose, onSubmit }) => {
    const { products } = useProduct() || {};
    const safeProducts = Array.isArray(products) ? products : [];

    const { customers, addCustomer } = useCustomer() || {};
    const safeCustomers = Array.isArray(customers) ? customers : [];

    const { businessProfile, notify } = useSettings();
    const defaultCountryCode = businessProfile?.defaultCountryCode || '+256';

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

    // Contact Picker State
    const [phoneOptions, setPhoneOptions] = useState(null); // { name, numbers: [] }
    const [showPhonePicker, setShowPhonePicker] = useState(false);
    const isContactPickerSupported = !!(navigator.contacts && window.isSecureContext);

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
            setPhoneOptions(null);
            setShowPhonePicker(false);
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

    const handlePickContact = async () => {
        if (!isContactPickerSupported) return;

        try {
            const props = ['name', 'tel'];
            const opts = { multiple: false };
            const contacts = await navigator.contacts.select(props, opts);

            if (!contacts || contacts.length === 0) return;

            const contact = contacts[0];
            const name = contact.name?.[0] || 'Unknown';
            const numbers = contact.tel || [];

            if (numbers.length === 0) {
                notify("This contact has no phone numbers.", "error");
                return;
            }

            if (numbers.length === 1) {
                applyPickedContact(name, numbers[0]);
            } else {
                setPhoneOptions({ name, numbers });
                setShowPhonePicker(true);
            }
        } catch (err) {
            console.error("Contact picker error:", err);
            if (err.name !== 'AbortError') {
                notify("Failed to open contact picker.", "error");
            }
        }
    };

    const applyPickedContact = async (name, rawPhone) => {
        const normalized = normalizePhone(rawPhone, defaultCountryCode);

        // Find existing or match
        let existing = safeCustomers.find(c => {
            const cNormalized = normalizePhone(c.phone, defaultCountryCode);
            return cNormalized === normalized && normalized !== "";
        });

        if (!existing) {
            existing = safeCustomers.find(c => c.name.toLowerCase() === name.toLowerCase());
        }

        if (existing) {
            selectCustomer(existing);
            notify(`Selected existing customer: ${existing.name}`);
        } else {
            // Create new customer record
            const newCust = await addCustomer({ name, phone: rawPhone });
            selectCustomer({ id: newCust.id, name, phone: rawPhone });
            notify(`Created new customer: ${name}`);
        }

        setShowPhonePicker(false);
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
                const newCust = await addCustomer({ name: inputName, phone: inputPhone });
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
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>New Sale</h2>
                    <button className="close-btn" onClick={onClose}><X size={20} /></button>
                </div>

                <form onSubmit={handleSubmit}>
                    {/* 1. Product Selection */}
                    <div className="form-group">
                        <label>Select Product*</label>
                        <select
                            name="productId"
                            value={formData.productId}
                            onChange={handleProductChange}
                            required
                        >
                            <option value="">-- Choose Product --</option>
                            {safeProducts.map(p => (
                                <option key={p.id} value={p.id}>
                                    {p.productName} (Stock: {p.stockQuantity})
                                </option>
                            ))}
                        </select>
                    </div>

                    {selectedProduct && (
                        <div className="sale-details">
                            <div className="detail-item">
                                <span>Unit Price:</span>
                                <strong>{formatCurrency(selectedProduct.sellingPrice)}</strong>
                            </div>
                            <div className="detail-item">
                                <span>Available:</span>
                                <strong>{selectedProduct.stockQuantity}</strong>
                            </div>
                        </div>
                    )}

                    {/* 2. Quantity & Total */}
                    <div className="form-row">
                        <div className="form-group">
                            <label>Quantity*</label>
                            <input
                                type="number"
                                name="quantitySold"
                                value={formData.quantitySold}
                                onChange={handleChange}
                                placeholder="0"
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Total</label>
                            <div className="read-only-field">{formatCurrency(totalAmount)}</div>
                        </div>
                    </div>

                    {/* Profit Preview */}
                    {selectedProduct && formData.quantitySold && (
                        <div className="profit-preview fade-in">
                            {(() => {
                                const costPrice = selectedProduct.costPrice || 0;
                                const profitPerUnit = selectedProduct.sellingPrice - costPrice;
                                const totalProfit = profitPerUnit * Number(formData.quantitySold);
                                const profitMargin = totalAmount > 0 ? (totalProfit / totalAmount) * 100 : 0;

                                return (
                                    <>
                                        <span className="profit-label">Profit:</span>
                                        <span className={`profit-amount ${totalProfit >= 0 ? 'positive' : 'negative'}`}>
                                            {formatCurrency(totalProfit)}
                                        </span>
                                        <span className={`profit-margin-badge ${profitMargin >= 30 ? 'high' : profitMargin >= 15 ? 'medium' : 'low'}`}>
                                            {profitMargin.toFixed(1)}%
                                        </span>
                                    </>
                                );
                            })()}
                        </div>
                    )}

                    {/* 3. Customer Selection (Search-as-you-type) */}
                    <div className="form-group" style={{ position: 'relative' }}>
                        <label>Customer (Optional)</label>
                        <div className="autocomplete-row">
                            <div className="autocomplete-wrapper">
                                <input
                                    type="text"
                                    value={customerSearch}
                                    onChange={handleSearchChange}
                                    onFocus={() => setShowSuggestions(true)}
                                    placeholder="Search Name or Phone..."
                                />
                                {showSuggestions && customerSearch && (
                                    <div className="suggestions-list">
                                        {filteredCustomers.map(c => (
                                            <div
                                                key={c.id}
                                                className="suggestion-item"
                                                onClick={() => selectCustomer(c)}
                                            >
                                                <span>{c.name}</span>
                                                <small style={{ color: 'var(--text-secondary)' }}>{c.phone}</small>
                                            </div>
                                        ))}
                                        <div
                                            className="suggestion-item create-new"
                                            onClick={selectCreateNew}
                                        >
                                            + Create new "{customerSearch}"
                                        </div>
                                    </div>
                                )}
                            </div>
                            <button
                                type="button"
                                className="contact-picker-btn"
                                onClick={handlePickContact}
                                disabled={!isContactPickerSupported}
                                title={isContactPickerSupported ? "Pick from device contacts" : "Contact picker not supported"}
                            >
                                <BookUser size={20} />
                            </button>
                        </div>
                        {!isContactPickerSupported && (
                            <small className="contact-picker-unsupported">Contact picker not available on this browser.</small>
                        )}
                    </div>

                    {/* Show Phone input if creating new OR if searched but no ID linked (implied new/guest) */}
                    {(isNewCustomer || (!formData.customerId && customerSearch)) && (
                        <div className="form-row fade-in">
                            <div className="form-group">
                                <label>Name*</label>
                                <input
                                    name="customerName"
                                    value={formData.customerName}
                                    onChange={(e) => {
                                        handleChange(e);
                                        setCustomerSearch(e.target.value);
                                    }}
                                    placeholder="e.g. John Doe"
                                    required={isNewCustomer}
                                />
                            </div>
                            <div className="form-group">
                                <label>Phone</label>
                                <input name="customerPhone" value={formData.customerPhone} onChange={handleChange} placeholder="07..." />
                            </div>
                        </div>
                    )}

                    {/* 4. Payment Logic */}
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
                            <label>Mode</label>
                            <select name="paymentMode" value={formData.paymentMode} onChange={handleChange}>
                                <option value="Cash">Cash</option>
                                <option value="Mobile Money">Mobile Money</option>
                                <option value="Credit">Credit/Card</option>
                            </select>
                        </div>
                    </div>

                    {/* Partial Payment Input */}
                    {formData.paymentStatus === 'Partial' && (
                        <div className="form-group fade-in">
                            <label>Amount Paid Now*</label>
                            <input
                                type="text"
                                name="amountPaid"
                                value={displayPaid}
                                onChange={handleChange}
                                onBlur={handleBlurPaid}
                                placeholder="UGX 0"
                                required
                            />
                            <small style={{ color: 'var(--text-secondary)' }}>
                                Remaining Due: {formatCurrency(totalAmount - (Number(formData.amountPaid) || 0))}
                            </small>
                        </div>
                    )}

                    {error && (
                        <div className="error-message">
                            <AlertCircle size={16} />
                            <span>{error}</span>
                        </div>
                    )}

                    <button type="submit" className="save-btn" disabled={!selectedProduct || !formData.quantitySold || !!error || isLoading}>
                        {isLoading ? 'Processing...' : 'Complete Sale'}
                    </button>
                </form>
            </div>

            {/* Phone Number Selection for Multi-number Contacts */}
            {phoneOptions && (
                <BottomSheet
                    isOpen={showPhonePicker}
                    onClose={() => setShowPhonePicker(false)}
                    actions={[
                        { type: 'header', label: `Select number for ${phoneOptions.name}` },
                        ...phoneOptions.numbers.map(num => ({
                            label: num,
                            icon: <Phone size={18} />,
                            onClick: () => applyPickedContact(phoneOptions.name, num)
                        }))
                    ]}
                />
            )}
        </div>
    );
};

export default SalesForm;
