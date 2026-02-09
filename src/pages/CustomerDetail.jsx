import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, DollarSign } from 'lucide-react';
import { useCustomer } from '../context/CustomerContext';
import { useSales } from '../context/SalesContext';
import { formatCurrency, parseCurrency } from '../utils';
import QuickPaymentModal from '../components/QuickPaymentModal';
import './CustomerDetail.css';

const CustomerDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { customers } = useCustomer();
    const { sales, updateSale } = useSales();

    const customer = customers.find(c => c.id === id);
    const customerSales = sales.filter(s => s.customerId === id).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const [paymentModalOpen, setPaymentModalOpen] = useState(false);

    const stats = useMemo(() => {
        return customerSales.reduce((acc, sale) => ({
            totalPurchases: acc.totalPurchases + (sale.totalAmount || 0),
            totalDebt: acc.totalDebt + (sale.amountDue || 0)
        }), { totalPurchases: 0, totalDebt: 0 });
    }, [customerSales]);

    if (!customer) {
        return <div className="page container">Customer not found</div>;
    }

    const handlePaymentSubmit = async (saleId, amount) => {
        const sale = sales.find(s => s.id === saleId);
        if (!sale) return;

        const newAmountPaid = (sale.amountPaid || 0) + amount;
        const newAmountDue = sale.totalAmount - newAmountPaid;
        const newStatus = newAmountDue <= 0 ? 'Paid' : 'Partial';

        await updateSale(saleId, {
            amountPaid: newAmountPaid,
            amountDue: newAmountDue,
            paymentStatus: newStatus
        });
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'Just now';
        const date = new Date(dateString);
        return isNaN(date.getTime()) ? 'Just now' : date.toLocaleDateString();
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

            <div className="audit-stamps" style={{ marginBottom: 20 }}>
                <span>Customer since: {customer.createdAt ? new Date(customer.createdAt).toLocaleString() : 'Just now'}</span>
                {customer.updatedAt && (
                    <span>Last updated: {new Date(customer.updatedAt).toLocaleString()}</span>
                )}
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
                        onClick={() => sale.amountDue > 0 && setPaymentModalOpen(true)}
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

            <QuickPaymentModal
                isOpen={paymentModalOpen}
                onClose={() => setPaymentModalOpen(false)}
                onSubmit={handlePaymentSubmit}
                customerSales={customerSales}
                customerName={customer.name}
            />
        </div>
    );
};

export default CustomerDetail;
