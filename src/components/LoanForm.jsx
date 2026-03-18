import { useState, useEffect, useMemo } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { useLoan } from '../context/LoanContext';
import { useSettings } from '../context/SettingsContext';
import { formatCurrency, parseCurrency } from '../utils';

const LoanForm = ({ isOpen, onClose }) => {
    const { addLoan } = useLoan();
    const { notify } = useSettings();
    
    const [formData, setFormData] = useState({
        lenderName: '',
        principal: '',
        interestType: 'fixed_amount',
        interestValue: '',
        repaymentFrequency: 'monthly',
        startDate: new Date().toISOString().split('T')[0],
        firstDueDate: '',
        endDate: ''
    });

    const [displayPrincipal, setDisplayPrincipal] = useState('');
    const [displayInterest, setDisplayInterest] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (!isOpen) {
            setFormData({
                lenderName: '',
                principal: '',
                interestType: 'fixed_amount',
                interestValue: '',
                repaymentFrequency: 'monthly',
                startDate: new Date().toISOString().split('T')[0],
                firstDueDate: '',
                endDate: ''
            });
            setDisplayPrincipal('');
            setDisplayInterest('');
            setError('');
        }
    }, [isOpen]);

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
        } else if (name === 'interestValue') {
            if (formData.interestType === 'fixed_amount') {
                setDisplayInterest(value);
                const num = parseCurrency(value);
                setFormData(prev => ({ ...prev, [name]: num }));
            } else {
                // percentage: allow raw number input
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

        setIsLoading(true);
        try {
            await addLoan({
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
                amountPaid: 0,
                status: 'active'
            });
            notify(`Loan from ${formData.lenderName} added successfully`);
            onClose();
        } catch (err) {
            setError(err.message || 'Failed to add loan');
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>New Loan</h2>
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
                        {isLoading ? 'Processing...' : 'Add Loan'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default LoanForm;
