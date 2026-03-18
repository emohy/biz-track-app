import { useState, useMemo } from 'react';
import { X, Search, UserPlus, Contact, Phone, Clock } from 'lucide-react';
import { useCustomer } from '../context/CustomerContext';
import { normalizePhone } from '../utils';
import { pickSingleContact, isContactPickerSupported } from '../utils/contactPicker';
import './CustomerPicker.css';

const CustomerPicker = ({ isOpen, onClose, onSelect, currentCustomerId }) => {
    const { customers, addCustomer } = useCustomer() || {};
    const safeCustomers = Array.isArray(customers) ? customers : [];

    const [search, setSearch] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Filter customers based on search
    const filteredCustomers = useMemo(() => {
        if (!search) return safeCustomers;
        const s = search.toLowerCase();
        return safeCustomers.filter(c =>
            (c.name && c.name.toLowerCase().includes(s)) ||
            (c.phone && c.phone.includes(s))
        );
    }, [safeCustomers, search]);

    // Grouping recent customers (mock logic for now, could be improved with real usage data)
    const recentCustomers = useMemo(() => {
        return safeCustomers.slice(0, 3);
    }, [safeCustomers]);

    const handleSelect = (customer) => {
        onSelect(customer);
        onClose();
    };

    const handleCreateNew = async () => {
        if (!search.trim()) return;

        setIsLoading(true);
        try {
            const newCust = await addCustomer({ name: search.trim(), phone: '' });
            onSelect(newCust);
            onClose();
        } catch (error) {
            console.error('Error creating customer:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handlePickFromContacts = async () => {
        if (!isContactPickerSupported()) {
            alert('Contact picker is not supported on this device/browser. Please enter manually.');
            return;
        }

        try {
            const contactData = await pickSingleContact();
            if (!contactData) return; // user cancelled

            const name = contactData.name || 'Unknown';
            const rawPhone = contactData.numbers?.[0] || '';
            const phone = normalizePhone(rawPhone);

            // Check if customer exists
            let existing = safeCustomers.find(c =>
                (phone && c.phone === phone) ||
                (c.name && c.name.toLowerCase() === name.toLowerCase())
            );

            if (existing) {
                handleSelect(existing);
            } else {
                setIsLoading(true);
                const newCust = await addCustomer({ name, phone });
                handleSelect(newCust);
            }
        } catch (err) {
            console.error('Contact picker error:', err);
            alert('Could not open contacts. Please enter customer manually.');
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="customer-picker-overlay" onClick={onClose}>
            <div className="customer-picker-sheet" onClick={e => e.stopPropagation()}>
                <div className="picker-header">
                    <div className="drag-handle"></div>
                    <div className="header-top">
                        <h3>Select Customer</h3>
                        <button className="close-btn" onClick={onClose}><X size={20} /></button>
                    </div>
                </div>

                <div className="picker-content">
                    <div className="search-wrapper">
                        <Search className="search-icon" size={18} />
                        <input
                            type="text"
                            placeholder="Search name or phone..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            autoFocus
                        />
                    </div>

                    <div className="quick-actions">
                        <button className="action-row" onClick={handlePickFromContacts}>
                            <div className="action-icon contact">
                                <Contact size={20} />
                            </div>
                            <div className="action-info">
                                <span>Choose from Phone Contacts</span>
                                <small>Import name & number</small>
                            </div>
                        </button>

                        {search && !filteredCustomers.some(c => c.name && c.name.toLowerCase() === search.toLowerCase()) && (
                            <button className="action-row create" onClick={handleCreateNew} disabled={isLoading}>
                                <div className="action-icon new">
                                    <UserPlus size={20} />
                                </div>
                                <div className="action-info">
                                    <span>Create "{search}"</span>
                                    <small>Add as new customer</small>
                                </div>
                            </button>
                        )}
                    </div>

                    <div className="results-container">
                        {!search && recentCustomers.length > 0 && (
                            <div className="section">
                                <div className="section-title">
                                    <Clock size={14} />
                                    <span>Recent Customers</span>
                                </div>
                                {recentCustomers.map(c => (
                                    <button
                                        key={c.id}
                                        className={`customer-row ${c.id === currentCustomerId ? 'selected' : ''}`}
                                        onClick={() => handleSelect(c)}
                                    >
                                        <div className="cust-avatar">{(c.name || '?').charAt(0)}</div>
                                        <div className="cust-details">
                                            <span className="cust-name">{c.name || 'Unnamed Customer'}</span>
                                            <span className="cust-phone">{c.phone || 'No phone'}</span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}

                        <div className="section">
                            <div className="section-title">
                                <span>{search ? `Searching for "${search}"` : 'All Customers'}</span>
                            </div>
                            {filteredCustomers.length > 0 ? (
                                filteredCustomers.map(c => (
                                    <button
                                        key={c.id}
                                        className={`customer-row ${c.id === currentCustomerId ? 'selected' : ''}`}
                                        onClick={() => handleSelect(c)}
                                    >
                                        <div className="cust-avatar">{(c.name || '?').charAt(0)}</div>
                                        <div className="cust-details">
                                            <span className="cust-name">{c.name || 'Unnamed Customer'}</span>
                                            <span className="cust-phone">{c.phone || 'No phone'}</span>
                                        </div>
                                    </button>
                                ))
                            ) : (
                                !isLoading && search && <div className="no-results">No existing customers found</div>
                            )}
                        </div>
                    </div>
                </div>
                <div className="safe-area-bottom"></div>
            </div>
        </div>
    );
};

export default CustomerPicker;
