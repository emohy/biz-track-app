import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, Wallet, Users, Package, AlertTriangle, ArrowRight, Plus } from 'lucide-react';
import { useSales } from '../context/SalesContext';
import { useExpense } from '../context/ExpenseContext';
import { useProduct } from '../context/ProductContext';
import { useCustomer } from '../context/CustomerContext';
import { formatCurrency } from '../utils';
import './Dashboard.css';

const Dashboard = () => {
    const { sales } = useSales();
    const { expenses } = useExpense();
    const { products } = useProduct();
    const { customers } = useCustomer();
    const navigate = useNavigate();

    const stats = useMemo(() => {
        const now = new Date();
        const todayStr = now.toISOString().split('T')[0];

        // Start of week (Monday)
        const startOfWeek = new Date(now);
        const day = startOfWeek.getDay();
        const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
        startOfWeek.setDate(diff);
        startOfWeek.setHours(0, 0, 0, 0);

        // Start of month
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const filterByDate = (items, startDate) => {
            return items.filter(item => new Date(item.createdAt) >= startDate);
        };

        const todaySales = sales.filter(s => s.createdAt.startsWith(todayStr));
        const todayExpenses = expenses.filter(e => e.createdAt.startsWith(todayStr));

        const weekSales = filterByDate(sales, startOfWeek);
        const weekExpenses = filterByDate(expenses, startOfWeek);

        const monthSales = filterByDate(sales, startOfMonth);
        const monthExpenses = filterByDate(expenses, startOfMonth);

        const totalDebt = sales.reduce((acc, sale) => acc + (sale.amountDue || 0), 0);
        const owingCustomersCount = customers.filter(c => {
            const customerSales = sales.filter(s => s.customerId === c.id);
            return customerSales.some(s => s.amountDue > 0);
        }).length;

        const outOfStock = products.filter(p => p.stockQuantity === 0);
        const lowStock = products.filter(p => p.stockQuantity > 0 && p.stockQuantity <= p.minimumStockLevel);

        const sum = (items, key) => items.reduce((acc, item) => acc + (item[key] || 0), 0);

        return {
            today: {
                sales: sum(todaySales, 'totalAmount'),
                expenses: sum(todayExpenses, 'amount'),
                net: sum(todaySales, 'totalAmount') - sum(todayExpenses, 'amount')
            },
            week: {
                sales: sum(weekSales, 'totalAmount'),
                expenses: sum(weekExpenses, 'amount'),
                net: sum(weekSales, 'totalAmount') - sum(weekExpenses, 'amount')
            },
            month: {
                sales: sum(monthSales, 'totalAmount'),
                expenses: sum(monthExpenses, 'amount'),
                net: sum(monthSales, 'totalAmount') - sum(monthExpenses, 'amount')
            },
            debt: {
                total: totalDebt,
                count: owingCustomersCount
            },
            inventory: {
                out: outOfStock.length,
                low: lowStock.length,
                shortlist: [...outOfStock, ...lowStock].slice(0, 5)
            }
        };
    }, [sales, expenses, products, customers]);

    return (
        <div className="page container dashboard">
            <header className="dashboard-header">
                <h1>Overview</h1>
                <span className="current-date">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</span>
            </header>

            {/* 1. Today Summary */}
            <section className="summary-section">
                <div className="summary-grid">
                    <div className="summary-card main">
                        <span className="label">Today's Sales</span>
                        <span className="value">{formatCurrency(stats.today.sales)}</span>
                    </div>
                    <div className="summary-card">
                        <span className="label">Today's Costs</span>
                        <span className="value secondary">{formatCurrency(stats.today.expenses)}</span>
                    </div>
                    <div className="summary-card">
                        <span className="label">Today's Net</span>
                        <span className={`value ${stats.today.net >= 0 ? 'positive' : 'negative'}`}>
                            {formatCurrency(stats.today.net)}
                        </span>
                    </div>
                </div>
            </section>

            {/* 2. Debt & Inventory Alerts */}
            <div className="alert-grid">
                <div className="alert-card debt" onClick={() => navigate('/customers?tab=owing')}>
                    <div className="alert-header">
                        <Users size={18} />
                        <span>Outstanding Debt</span>
                    </div>
                    <div className="alert-content">
                        <span className="alert-value">{formatCurrency(stats.debt.total)}</span>
                        <span className="alert-meta">{stats.debt.count} customers owing</span>
                    </div>
                    <ArrowRight size={16} className="chevron" />
                </div>

                <div className="alert-card stock" onClick={() => navigate('/inventory', { state: { filter: 'low' } })}>
                    <div className="alert-header">
                        <AlertTriangle size={18} />
                        <span>Inventory Alerts</span>
                    </div>
                    <div className="alert-content">
                        <span className="alert-value">{stats.inventory.out + stats.inventory.low} Items</span>
                        <span className="alert-meta">{stats.inventory.out} Out, {stats.inventory.low} Low</span>
                    </div>
                    <ArrowRight size={16} className="chevron" />
                </div>
            </div>

            {/* 3. Time Summaries */}
            <section className="time-summaries">
                <div className="content-card">
                    <h3>Performance</h3>
                    <div className="time-row">
                        <div className="time-label">This Week</div>
                        <div className="time-values">
                            <span className="pos">+{formatCurrency(stats.week.sales)}</span>
                            <span className="neg">-{formatCurrency(stats.week.expenses)}</span>
                        </div>
                    </div>
                    <div className="time-row">
                        <div className="time-label">This Month</div>
                        <div className="time-values">
                            <span className="pos">+{formatCurrency(stats.month.sales)}</span>
                            <span className="neg">-{formatCurrency(stats.month.expenses)}</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* 4. Inventory Shortlist */}
            {stats.inventory.shortlist.length > 0 && (
                <section className="inventory-watchlist">
                    <h3>Restock Needed</h3>
                    <div className="watchlist-list">
                        {stats.inventory.shortlist.map(p => (
                            <div key={p.id} className="watchlist-item" onClick={() => navigate('/inventory')}>
                                <span className="product-name">{p.productName}</span>
                                <span className={`stock-level ${p.stockQuantity === 0 ? 'critical' : 'warning'}`}>
                                    {p.stockQuantity === 0 ? 'OUT' : `${p.stockQuantity} left`}
                                </span>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* 5. Quick Actions */}
            <section className="quick-actions">
                <button className="action-btn" onClick={() => document.getElementById('global-fab')?.click()}>
                    <Plus size={20} />
                    <span>Quick Transaction</span>
                </button>
                <div className="action-row">
                    <button className="small-action" onClick={() => navigate('/customers?tab=owing')}>
                        View Debtors
                    </button>
                    <button className="small-action" onClick={() => navigate('/inventory')}>
                        Check Stock
                    </button>
                </div>
            </section>
        </div>
    );
};

export default Dashboard;
