import { useState } from 'react';
import { formatCurrency, parseCurrency } from '../utils';

const QuickPaymentModal = ({ isOpen, onClose, onSubmit, customerSales, customerName }) => {
    const [selectedSaleId, setSelectedSaleId] = useState('');
    const [paymentAmount, setPaymentAmount] = useState('');

    const unpaidSales = customerSales.filter(s => s.amountDue > 0);
    const selectedSale = unpaidSales.find(s => s.id === selectedSaleId);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!selectedSaleId || !paymentAmount) return;

        const amount = Number(parseCurrency(paymentAmount));
        if (amount <= 0 || amount > selectedSale.amountDue) {
            alert("Invalid amount. Cannot pay more than due.");
            return;
        }

        onSubmit(selectedSaleId, amount);
        setPaymentAmount('');
        setSelectedSaleId('');
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Record Payment</h2>
                    <p className="subtitle">for {customerName}</p>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Select Unpaid Sale</label>
                        <select
                            value={selectedSaleId}
                            onChange={e => setSelectedSaleId(e.target.value)}
                            required
                        >
                            <option value="">-- Select Sale --</option>
                            {unpaidSales.map(sale => (
                                <option key={sale.id} value={sale.id}>
                                    {sale.productName} ({formatCurrency(sale.amountDue)} due) - {new Date(sale.createdAt).toLocaleDateString()}
                                </option>
                            ))}
                        </select>
                    </div>

                    {selectedSale && (
                        <div className="form-group">
                            <label>Amount Receiving (Due: {formatCurrency(selectedSale.amountDue)})</label>
                            <input
                                type="text"
                                value={paymentAmount}
                                onChange={e => setPaymentAmount(e.target.value)}
                                placeholder="UGX 0"
                                autoFocus
                                required
                            />
                        </div>
                    )}

                    <div className="modal-actions">
                        <button type="button" className="cancel-btn" onClick={onClose}>Cancel</button>
                        <button type="submit" className="save-btn" disabled={!selectedSaleId || !paymentAmount}>
                            Confirm Payment
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default QuickPaymentModal;
