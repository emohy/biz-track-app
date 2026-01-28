import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, DollarSign } from 'lucide-react';
import { useCustomer } from '../context/CustomerContext';
import { useSales } from '../context/SalesContext';
import { formatCurrency, parseCurrency } from '../utils';
import './CustomerDetail.css';

const CustomerDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { customers } = useCustomer();
    const { sales, updateSale } = useSales(); // Need updateSale to record payments

    const customer = customers.find(c => c.id === id);
    const customerSales = sales.filter(s => s.customerId === id).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const [paymentModalOpen, setPaymentModalOpen] = useState(false);
    const [selectedSale, setSelectedSale] = useState(null);
    const [paymentAmount, setPaymentAmount] = useState('');

    const stats = useMemo(() => {
        return customerSales.reduce((acc, sale) => ({
            totalPurchases: acc.totalPurchases + (sale.totalAmount || 0),
            totalDebt: acc.totalDebt + (sale.amountDue || 0)
        }), { totalPurchases: 0, totalDebt: 0 });
    }, [customerSales]);

    if (!customer) {
        return <div className="page container">Customer not found</div>;
    }

    const openPaymentModal = (sale) => {
        if (sale.amountDue <= 0) return; // Already paid
        setSelectedSale(sale);
        setPaymentAmount('');
        setPaymentModalOpen(true);
    };

    const handlePaymentSubmit = (e) => {
        e.preventDefault();
        if (!selectedSale || !paymentAmount) return;

        const amount = Number(parseCurrency(paymentAmount));
        if (amount <= 0 || amount > selectedSale.amountDue) {
            alert("Invalid amount. Cannot pay more than due.");
            return;
        }

        const newAmountPaid = (selectedSale.amountPaid || 0) + amount;
        const newAmountDue = selectedSale.totalAmount - newAmountPaid;
        const newStatus = newAmountDue <= 0 ? 'Paid' : 'Partial';

        updateSale(selectedSale.id, {
            amountPaid: newAmountPaid,
            amountDue: newAmountDue,
            paymentStatus: newStatus
        });

        setPaymentModalOpen(false);
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString();
    };

    return (
        <div className="page container">
            <div className="detail-header">
                <button className="back-btn" onClick={() => navigate(-1)}>
                    <ArrowLeft size={24} />
                </button>
                <h1>{customer.name}</h1>
                <div style={{ width: 24 }}></div>
            </div>

            <div className="customer-stats">
                <div className="stat-card">
                    <span className="label">Total Purchases</span>
                    <span className="value">{formatCurrency(stats.totalPurchases)}</span>
                </div>
                <div className="stat-card">
                    <span className="label">Total Debt</span>
                    <span className={`value ${stats.totalDebt > 0 ? 'danger' : 'success'}`}>
                        {formatCurrency(stats.totalDebt)}
                    </span>
                </div>
            </div>

            <h3>Purchase History</h3>
            <div className="history-list">
                {customerSales.map(sale => (
                    <div
                        key={sale.id}
                        className="history-card"
                        onClick={() => openPaymentModal(sale)}
                    >
                        <div className="history-main">
                            <span className="product-name">{sale.productName}</span>
                            <span className="sale-date">{formatDate(sale.createdAt)}</span>
                        </div>
                        <div className="history-financials">
                            <div className="totals">
                                <span className="total-amount">{formatCurrency(sale.totalAmount)}</span>
                                {sale.amountDue > 0 && (
                                    <span className="due-amount">Due: {formatCurrency(sale.amountDue)}</span>
                                )}
                            </div>
                            <span className={`status-pill ${sale.paymentStatus.toLowerCase()}`}>
                                {sale.paymentStatus}
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Simple Payment Modal */}
            {paymentModalOpen && (
                <div className="modal-overlay" onClick={() => setPaymentModalOpen(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Record Payment</h2>
                        </div>
                        <form onSubmit={handlePaymentSubmit}>
                            <p className="payment-context">
                                paying for <strong>{selectedSale?.productName}</strong><br />
                                Due: {formatCurrency(selectedSale?.amountDue)}
                            </p>
                            <div className="form-group">
                                <label>Amount Receiving</label>
                                <input
                                    type="text"
                                    value={paymentAmount}
                                    onChange={e => setPaymentAmount(e.target.value)}
                                    placeholder="UGX 0"
                                    autoFocus
                                />
                            </div>
                            <button className="save-btn">Confirm Payment</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CustomerDetail;
