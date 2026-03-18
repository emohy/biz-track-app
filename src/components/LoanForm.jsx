import { useState, useEffect, useMemo } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { useLoan } from '../context/LoanContext';
import { useSettings } from '../context/SettingsContext';
import { formatCurrency, parseCurrency } from '../utils';

const LoanForm = ({ isOpen, onClose, initialData = null }) => {
    const { addLoan, updateLoan } = useLoan();
    const { notify } = useSettings();
    
    const [formData, setFormData] = useState({
        lenderName: '',
        principal: '',
        interestType: 'fixed_amount',
        interestValue: '',
        repaymentFrequency: 'monthly',
        startDate: new Date().toISOString().split('T')[0],
        firstDueDate: '',
        endDate: '',
        installmentMode: 'derived', // derived OR manual
        agreedPaymentPerPeriod: ''
    });

    const [displayPrincipal, setDisplayPrincipal] = useState('');
    const [displayInterest, setDisplayInterest] = useState('');
    const [displayAgreedPayment, setDisplayAgreedPayment] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (!isOpen) {
            setFormData({
                lenderName: '', principal: '', interestType: 'fixed_amount', interestValue: '',
                repaymentFrequency: 'monthly', startDate: new Date().toISOString().split('T')[0],
                firstDueDate: '', endDate: '', installmentMode: 'derived', agreedPaymentPerPeriod: ''
            });
            setDisplayPrincipal('');
            setDisplayInterest('');
            setDisplayAgreedPayment('');
            setError('');
        } else if (initialData) {
            setFormData({
                lenderName: initialData.lenderName || '',
                principal: initialData.principal || '',
                interestType: initialData.interestType || 'fixed_amount',
                interestValue: initialData.interestValue || '',
                repaymentFrequency: initialData.repaymentFrequency || 'monthly',
                startDate: initialData.startDate ? initialData.startDate.split('T')[0] : new Date().toISOString().split('T')[0],
                firstDueDate: initialData.firstDueDate ? initialData.firstDueDate.split('T')[0] : '',
                endDate: initialData.endDate ? initialData.endDate.split('T')[0] : '',
                installmentMode: initialData.installmentMode || 'derived',
                agreedPaymentPerPeriod: initialData.agreedPaymentPerPeriod || ''
            });
            setDisplayPrincipal(initialData.principal ? formatCurrency(initialData.principal) : '');
            setDisplayInterest(initialData.interestValue && initialData.interestType === 'fixed_amount' ? formatCurrency(initialData.interestValue) : (initialData.interestValue || ''));
            setDisplayAgreedPayment(initialData.agreedPaymentPerPeriod ? formatCurrency(initialData.agreedPaymentPerPeriod) : '');
        }
    }, [isOpen, initialData]);

    // ── Derived total repayment ──
    const derivedTotal = useMemo(() => {
        const p = Number(formData.principal) || 0;
        const iv = Number(formData.interestValue) || 0;
        if (p <= 0) return 0;
        if (formData.interestType === 'fixed_amount') {
            return p + iv;
        }
        // fixed_rate: interestValue is a percentage
        return Math.round(p * (1 + iv / 100));
    }, [formData.principal, formData.interestType, formData.interestValue]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        
        if (name === 'principal') {
            setDisplayPrincipal(value);
            const num = parseCurrency(value);
            setFormData(prev => ({ ...prev, [name]: num }));
        } else if (name === 'agreedPaymentPerPeriod') {
            setDisplayAgreedPayment(value);
            const num = parseCurrency(value);
            setFormData(prev => ({ ...prev, [name]: num }));
        } else if (name === 'interestValue') {
            if (formData.interestType === 'fixed_amount') {
                setDisplayInterest(value);
                const num = parseCurrency(value);
                setFormData(prev => ({ ...prev, [name]: num }));
            } else {
                setDisplayInterest(value);
                setFormData(prev => ({ ...prev, [name]: value }));
            }
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
        setError('');
    };

    const handleBlur = (field) => {
        if (field === 'principal') {
            setDisplayPrincipal(formatCurrency(formData.principal));
        } else if (field === 'agreedPaymentPerPeriod') {
            setDisplayAgreedPayment(formatCurrency(formData.agreedPaymentPerPeriod));
        } else if (field === 'interestValue' && formData.interestType === 'fixed_amount') {
            setDisplayInterest(formatCurrency(formData.interestValue));
        }
    };

    // When interest type changes, reset display
    const handleInterestTypeChange = (e) => {
        setFormData(prev => ({ ...prev, interestType: e.target.value, interestValue: '' }));
        setDisplayInterest('');
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (isLoading) return;

        // Validation
        if (!formData.lenderName || !formData.principal || !formData.firstDueDate || !formData.endDate) {
            setError('Please fill in all required fields');
            return;
        }

        if (Number(formData.principal) <= 0) {
            setError('Principal must be greater than 0');
            return;
        }

        const start = new Date(formData.startDate);
        const firstDue = new Date(formData.firstDueDate);
        const end = new Date(formData.endDate);
        
        if (isNaN(start.getTime()) || isNaN(firstDue.getTime()) || isNaN(end.getTime())) {
            setError('Please enter valid dates');
            return;
        }

        if (firstDue <= start) {
            setError('First due date must be after start date');
            return;
        }

        if (end <= firstDue) {
            setError('End date must be after first due date');
            return;
        }

        if (derivedTotal <= Number(formData.principal)) {
            // Only warn if interest was provided but total is still <= principal
            const iv = Number(formData.interestValue) || 0;
            if (iv < 0) {
                setError('Interest value cannot be negative');
                return;
            }
        }

        if (formData.installmentMode === 'manual' && (!formData.agreedPaymentPerPeriod || Number(formData.agreedPaymentPerPeriod) <= 0)) {
            setError('Please enter a valid agreed payment amount per period');
            return;
        }

        setIsLoading(true);
        try {
            const loanPayload = {
                agreementMode: 'structured',
                lenderName: formData.lenderName,
                principal: Number(formData.principal),
                interestType: formData.interestType,
                interestValue: Number(formData.interestValue) || 0,
                repaymentFrequency: formData.repaymentFrequency,
                startDate: formData.startDate,
                firstDueDate: formData.firstDueDate,
                endDate: formData.endDate,
                totalRepayment: derivedTotal,
                installmentMode: formData.installmentMode,
                agreedPaymentPerPeriod: formData.installmentMode === 'manual' ? Number(formData.agreedPaymentPerPeriod) : null
            };

            if (initialData) {
                await updateLoan(initialData.id, loanPayload);
                notify(`Loan from ${formData.lenderName} updated successfully`);
            } else {
                await addLoan({ ...loanPayload, amountPaid: 0, status: 'active' });
                notify(`Loan from ${formData.lenderName} added successfully`);
            }
            onClose();
        } catch (err) {
            setError(err.message || 'Failed to preserve loan');
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>{initialData ? 'Edit Loan' : 'New Loan'}</h2>
                    <button className="close-btn" onClick={onClose}><X size={20} /></button>
                </div>

                <form onSubmit={handleSubmit}>
                    {/* Lender Name */}
                    <div className="form-group">
                        <label>Lender Name*</label>
                        <input
                            type="text"
                            name="lenderName"
                            value={formData.lenderName}
                            onChange={handleChange}
                            placeholder="e.g. Musa Traders / Bank"
                            required
                        />
                    </div>

                    {/* Principal */}
                    <div className="form-group">
                        <label>Principal Amount*</label>
                        <input
                            type="text"
                            name="principal"
                            value={displayPrincipal}
                            onChange={handleChange}
                            onBlur={() => handleBlur('principal')}
                            placeholder="UGX 0"
                            required
                        />
                    </div>

                    {/* Interest Type + Value */}
                    <div className="form-row">
                        <div className="form-group">
                            <label>Interest Type</label>
                            <select
                                name="interestType"
                                value={formData.interestType}
                                onChange={handleInterestTypeChange}
                            >
                                <option value="fixed_amount">Fixed Amount</option>
                                <option value="fixed_rate">Fixed Rate (%)</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>
                                {formData.interestType === 'fixed_rate' ? 'Interest Rate (%)' : 'Interest Amount'}
                            </label>
                            <input
                                type="text"
                                name="interestValue"
                                value={displayInterest}
                                onChange={handleChange}
                                onBlur={() => handleBlur('interestValue')}
                                placeholder={formData.interestType === 'fixed_rate' ? 'e.g. 10' : 'UGX 0'}
                            />
                        </div>
                    </div>

                    {/* Total Repayment Preview */}
                    {derivedTotal > 0 && (
                        <div className="form-group derived-total">
                            <label>Total Repayment</label>
                            <span className="derived-value">{formatCurrency(derivedTotal)}</span>
                        </div>
                    )}

                    {/* Repayment Frequency */}
                    <div className="form-group">
                        <label>Repayment Frequency*</label>
                        <select
                            name="repaymentFrequency"
                            value={formData.repaymentFrequency}
                            onChange={handleChange}
                            required
                        >
                            <option value="daily">Daily</option>
                            <option value="weekly">Weekly</option>
                            <option value="monthly">Monthly</option>
                            <option value="quarterly">Quarterly</option>
                        </select>
                    </div>

                    {/* Installment Mode Toggle */}
                    <div className="form-group">
                        <label>Installment Mode</label>
                        <select
                            name="installmentMode"
                            value={formData.installmentMode}
                            onChange={handleChange}
                        >
                            <option value="derived">Calculated Automatically</option>
                            <option value="manual">Agreed Manual Payment</option>
                        </select>
                    </div>

                    {formData.installmentMode === 'manual' && (
                        <div className="form-group">
                            <label>Agreed Payment Per Period*</label>
                            <input
                                type="text"
                                name="agreedPaymentPerPeriod"
                                value={displayAgreedPayment}
                                onChange={handleChange}
                                onBlur={() => handleBlur('agreedPaymentPerPeriod')}
                                placeholder="UGX 0"
                                required={formData.installmentMode === 'manual'}
                            />
                        </div>
                    )}

                    {/* Dates */}
                    <div className="form-group">
                        <label>Start Date</label>
                        <input
                            type="date"
                            name="startDate"
                            value={formData.startDate}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>First Due Date*</label>
                            <input
                                type="date"
                                name="firstDueDate"
                                value={formData.firstDueDate}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>End Date*</label>
                            <input
                                type="date"
                                name="endDate"
                                value={formData.endDate}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="error-message">
                            <AlertCircle size={16} />
                            <span>{error}</span>
                        </div>
                    )}

                    <button type="submit" className="save-btn" disabled={isLoading}>
                        {isLoading ? 'Processing...' : (initialData ? 'Save Changes' : 'Add Loan')}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default LoanForm;
