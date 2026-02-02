import { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ShoppingCart, Wallet, Users, Package, AlertTriangle, ArrowRight, Plus,
    TrendingUp, TrendingDown, Minus, Clock, BarChart2, Sparkles, ChevronDown, ChevronUp, Settings as SettingsIcon
} from 'lucide-react';
import { useSales } from '../context/SalesContext';
import { useExpense } from '../context/ExpenseContext';
import { useProduct } from '../context/ProductContext';
import { useCustomer } from '../context/CustomerContext';
import { useSettings } from '../context/SettingsContext';
import { formatCurrency } from '../utils';
import SkeletonLoader from '../components/SkeletonLoader';
import './Dashboard.css';

const Dashboard = () => {
    const { sales } = useSales();
    const { expenses } = useExpense();
    const { products } = useProduct();
    const { customers } = useCustomer();
    const navigate = useNavigate();
    const { testMode, alertsEnabled, setAlertsEnabled } = useSettings();

    const [timeScope, setTimeScope] = useState('today'); // 'today', 'week', 'month'
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => setIsLoading(false), 400);
        return () => clearTimeout(timer);
    }, []);

    // History key shifts based on test mode
    const historyKey = testMode ? 'test_dashboard_history' : 'dashboard_history';

    const [alertHistory, setAlertHistory] = useState(() => {
        const saved = localStorage.getItem(historyKey);
        return saved ? JSON.parse(saved) : { lastDate: '', lowStock: {} };
    });

    useEffect(() => {
        const saved = localStorage.getItem(historyKey);
        setAlertHistory(saved ? JSON.parse(saved) : { lastDate: '', lowStock: {} });
    }, [testMode, historyKey]);

    useEffect(() => {
        const todayStr = new Date().toISOString().split('T')[0];
        if (alertHistory.lastDate !== todayStr) {
            const currentLowStockIds = products.filter(p => p.stockQuantity <= p.minimumStockLevel).map(p => p.id);
            const newLowStockHistory = {};

            products.forEach(p => {
                if (currentLowStockIds.includes(p.id)) {
                    newLowStockHistory[p.id] = (alertHistory.lowStock[p.id] || 0) + 1;
                }
                // if not low, it resets (by being excluded from newLowStockHistory)
            });

            const newHistory = { lastDate: todayStr, lowStock: newLowStockHistory };
            setAlertHistory(newHistory);
            localStorage.setItem(historyKey, JSON.stringify(newHistory));
        }
    }, [products, historyKey, alertHistory.lastDate]);

    // Accordion / Collapsible State
    const [expandedSections, setExpandedSections] = useState({
        alerts: true,
        aiInsights: false,
        salesTrends: false,
        expenses: false,
        productMovement: false,
        paymentBehavior: false
    });

    const toggleSection = (section) => {
        setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
    };

    const stats = useMemo(() => {
        const now = new Date();
        const todayStr = now.toISOString().split('T')[0];
        const sevenDaysAgo = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));

        const yesterday = new Date(now);
        yesterday.setDate(now.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        // Start of weeks
        const getStartOfWeek = (date) => {
            const d = new Date(date);
            const day = d.getDay();
            const diff = d.getDate() - day + (day === 0 ? -6 : 1);
            d.setDate(diff);
            d.setHours(0, 0, 0, 0);
            return d;
        };
        const startOfThisWeek = getStartOfWeek(now);
        const startOfLastWeek = new Date(startOfThisWeek);
        startOfLastWeek.setDate(startOfLastWeek.getDate() - 7);

        // Start of months
        const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

        const filterByRange = (items, start, end) => {
            return items.filter(item => {
                const date = new Date(item.createdAt);
                return date >= start && (!end || date <= end);
            });
        };

        const sum = (items, key) => items.reduce((acc, item) => acc + (item[key] || 0), 0);

        // --- PHASE 8: SMART ALERTS LOGIC ---
        const activeAlertsList = [];

        // 1. Aging Debt Alert
        const agingDebtors = customers.filter(c => {
            const debtorSales = sales.filter(s => s.customerId === c.id);
            return debtorSales.some(s => s.amountDue > 0 && new Date(s.createdAt) < sevenDaysAgo);
        });
        if (agingDebtors.length > 0) {
            activeAlertsList.push({
                id: 'aging-debt',
                type: 'debt',
                title: 'Aging Debt Detected',
                message: `${agingDebtors.length} customers have balances older than 7 days worth checking.`,
                action: () => navigate('/customers?tab=owing')
            });
        }

        // 2. Recurring Low Stock Alert
        const recurringLowCount = products.filter(p => alertHistory.lowStock[p.id] >= 3).length;
        if (recurringLowCount > 0) {
            activeAlertsList.push({
                id: 'recurring-low',
                type: 'stock',
                title: 'Recurring Low Stock',
                message: `${recurringLowCount} items have been low for 3+ consecutive days.`,
                action: () => navigate('/inventory', { state: { filter: 'low' } })
            });
        }

        // 3. Expense Spike Alert (3-day trend)
        const d2Str = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const d1Str = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const d0Str = todayStr;
        const dStr = [d2Str, d1Str, d0Str];

        const expenseMap = {};
        expenses.forEach(e => {
            const date = e.createdAt.split('T')[0];
            if (dStr.includes(date)) {
                if (!expenseMap[e.category]) expenseMap[e.category] = { [d2Str]: 0, [d1Str]: 0, [dStr[2]]: 0 };
                expenseMap[e.category][date] += e.amount;
            }
        });

        const spikeCat = Object.keys(expenseMap).find(cat => {
            const day2 = expenseMap[cat][d2Str];
            const day1 = expenseMap[cat][d1Str];
            const day0 = expenseMap[cat][d0Str];
            return day0 > day1 && day1 > day2 && day2 > 0;
        });

        if (spikeCat) {
            activeAlertsList.push({
                id: 'expense-spike',
                type: 'expense',
                title: 'Expense Spike',
                message: `Daily spending in ${spikeCat} has increased for 3 consecutive days.`,
                action: () => navigate('/expenses')
            });
        }
        // -----------------------------------

        // Sales Trends Data
        const todaySalesList = sales.filter(s => s.createdAt.startsWith(todayStr));
        const yesterdaySales = sales.filter(s => s.createdAt.startsWith(yesterdayStr));
        const thisWeekSales = filterByRange(sales, startOfThisWeek);
        const lastWeekSales = filterByRange(sales, startOfLastWeek, new Date(startOfThisWeek.getTime() - 1));
        const thisMonthSales = filterByRange(sales, startOfThisMonth);
        const lastMonthSales = filterByRange(sales, startOfLastMonth, endOfLastMonth);

        const getDrift = (curr, prev) => {
            if (curr > prev) return 'up';
            if (curr < prev) return 'down';
            return 'flat';
        };

        const trends = {
            today: { current: sum(todaySalesList, 'totalAmount'), previous: sum(yesterdaySales, 'totalAmount'), drift: getDrift(sum(todaySalesList, 'totalAmount'), sum(yesterdaySales, 'totalAmount')) },
            week: { current: sum(thisWeekSales, 'totalAmount'), previous: sum(lastWeekSales, 'totalAmount'), drift: getDrift(sum(thisWeekSales, 'totalAmount'), sum(lastWeekSales, 'totalAmount')) },
            month: { current: sum(thisMonthSales, 'totalAmount'), previous: sum(lastMonthSales, 'totalAmount'), drift: getDrift(sum(thisMonthSales, 'totalAmount'), sum(lastMonthSales, 'totalAmount')) }
        };

        // Current Scope Data
        let currentSalesItems = [];
        let previousSalesItems = [];
        let currentExpensesItems = [];
        let previousExpensesItems = [];

        if (timeScope === 'today') {
            currentSalesItems = todaySalesList;
            previousSalesItems = yesterdaySales;
            currentExpensesItems = expenses.filter(e => e.createdAt.startsWith(todayStr));
            previousExpensesItems = expenses.filter(e => e.createdAt.startsWith(yesterdayStr));
        } else if (timeScope === 'week') {
            currentSalesItems = thisWeekSales;
            previousSalesItems = lastWeekSales;
            currentExpensesItems = filterByRange(expenses, startOfThisWeek);
            previousExpensesItems = filterByRange(expenses, startOfLastWeek, new Date(startOfThisWeek.getTime() - 1));
        } else {
            currentSalesItems = thisMonthSales;
            previousSalesItems = lastMonthSales;
            currentExpensesItems = filterByRange(expenses, startOfThisMonth);
            previousExpensesItems = filterByRange(expenses, startOfLastMonth, endOfLastMonth);
        }

        // Expense Overview
        const getTopCategories = (items, prevItems) => {
            const cats = {};
            items.forEach(e => {
                cats[e.category] = (cats[e.category] || 0) + e.amount;
            });
            const prevCats = {};
            prevItems.forEach(e => {
                prevCats[e.category] = (prevCats[e.category] || 0) + e.amount;
            });

            return Object.entries(cats)
                .map(([name, amount]) => ({
                    name,
                    amount,
                    drift: getDrift(amount, prevCats[name] || 0)
                }))
                .sort((a, b) => b.amount - a.amount)
                .slice(0, 3);
        };

        const topExpenses = getTopCategories(currentExpensesItems, previousExpensesItems);
        const totalExpenses = sum(currentExpensesItems, 'amount');

        // Product Movement (Velocity)
        const productSales = {};
        currentSalesItems.forEach(s => {
            productSales[s.productId] = (productSales[s.productId] || 0) + s.quantitySold;
        });

        const movement = products.map(p => ({
            ...p,
            unitsSold: productSales[p.id] || 0
        })).sort((a, b) => b.unitsSold - a.unitsSold).slice(0, 5);

        // Velocity Labels logic
        const maxSold = movement[0]?.unitsSold || 0;
        const velocityMovement = movement.map(m => {
            let velocity = 'Normal';
            if (m.unitsSold > 0) {
                if (m.unitsSold >= maxSold * 0.8) velocity = 'Fast moving';
                else if (m.unitsSold <= maxSold * 0.2) velocity = 'Slow moving';
            } else {
                velocity = 'No movement';
            }
            return { ...m, velocity };
        });

        // Payment Behavior
        const totalSalesCount = currentSalesItems.length;
        const behaviorValues = {
            paid: currentSalesItems.filter(s => s.paymentStatus === 'Paid').length,
            partial: currentSalesItems.filter(s => s.paymentStatus === 'Partial').length,
            unpaid: currentSalesItems.filter(s => s.paymentStatus === 'Unpaid').length
        };

        const getPercent = (count) => totalSalesCount === 0 ? 0 : Math.round((count / totalSalesCount) * 100);

        const totalDebt = sales.reduce((acc, sale) => acc + (sale.amountDue || 0), 0);
        const owingCustomersCount = customers.filter(c => {
            const customerSales = sales.filter(s => s.customerId === c.id);
            return customerSales.some(s => s.amountDue > 0);
        }).length;

        const outOfStock = products.filter(p => p.stockQuantity === 0);
        const lowStock = products.filter(p => p.stockQuantity > 0 && p.stockQuantity <= p.minimumStockLevel);

        // Profit Calculations
        const grossProfit = currentSalesItems.reduce((acc, sale) =>
            acc + (sale.totalProfit || 0), 0
        );

        const previousGrossProfit = previousSalesItems.reduce((acc, sale) =>
            acc + (sale.totalProfit || 0), 0
        );

        const netProfit = grossProfit - totalExpenses;

        const avgProfitMargin = currentSalesItems.length > 0
            ? currentSalesItems.reduce((acc, sale) => acc + (sale.profitMargin || 0), 0) / currentSalesItems.length
            : 0;

        const profitTrend = getDrift(grossProfit, previousGrossProfit);

        // Most profitable products
        const productProfits = {};
        currentSalesItems.forEach(sale => {
            if (!productProfits[sale.productId]) {
                productProfits[sale.productId] = {
                    productName: sale.productName,
                    totalProfit: 0,
                    unitsSold: 0
                };
            }
            productProfits[sale.productId].totalProfit += sale.totalProfit || 0;
            productProfits[sale.productId].unitsSold += sale.quantitySold;
        });

        const topProfitableProducts = Object.values(productProfits)
            .sort((a, b) => b.totalProfit - a.totalProfit)
            .slice(0, 5);

        // AI Advisory Insights
        const aiInsightsList = [];

        const currentTrend = trends[timeScope];
        if (currentTrend.current > currentTrend.previous * 1.1) {
            aiInsightsList.push({
                type: 'sales',
                text: `Sales are up significantly. This could indicate strong demand worth reviewing.`,
                icon: 'TrendingUp'
            });
        } else if (currentTrend.current < currentTrend.previous * 0.9 && currentTrend.previous > 0) {
            aiInsightsList.push({
                type: 'sales',
                text: `Sales are lower than in the previous period. You may want to check recent turnover.`,
                icon: 'TrendingDown'
            });
        }

        if (topExpenses.length > 0) {
            const topExp = topExpenses[0];
            if (topExp.drift === 'up') {
                aiInsightsList.push({
                    type: 'expense',
                    text: `Spending on ${topExp.name} has increased. Worth checking if this rise aligns with your plans.`,
                    icon: 'Wallet'
                });
            }
        }

        if (outOfStock.length > 0) {
            aiInsightsList.push({
                type: 'inventory',
                text: `${outOfStock.length} items are out of stock. Restocking soon could prevent missed sales.`,
                icon: 'Package'
            });
        }

        if (behaviorValues.unpaid > 20) {
            aiInsightsList.push({
                type: 'payment',
                text: `${behaviorValues.unpaid}% of sales are unpaid. This could indicate growing credit levels for follow-up.`,
                icon: 'Clock'
            });
        }

        if (aiInsightsList.length < 1) {
            aiInsightsList.push({
                type: 'info',
                text: `Continue recording transactions to generate deeper business insights.`,
                icon: 'Sparkles'
            });
        }

        // Section Summaries for Accordion
        const summaries = {
            salesTrends: `${timeScope.charAt(0).toUpperCase() + timeScope.slice(1)}: ${formatCurrency(currentTrend.current)} (${currentTrend.drift === 'up' ? '▲' : currentTrend.drift === 'down' ? '▼' : '—'})`,
            expenses: `Total: ${formatCurrency(totalExpenses)} • Top: ${topExpenses[0]?.name || 'None'}`,
            productMovement: `Top: ${movement[0]?.productName || 'None'} (${movement[0]?.unitsSold || 0} sold)`,
            paymentBehavior: `${getPercent(behaviorValues.paid)}% fully paid immediately`
        };

        return {
            trends,
            aiInsights: aiInsightsList.slice(0, 5),
            activeAlerts: activeAlertsList,
            summaries,
            scope: {
                sales: sum(currentSalesItems, 'totalAmount'),
                expenses: totalExpenses,
                topExpenses,
                movement: velocityMovement,
                behavior: {
                    paid: getPercent(behaviorValues.paid),
                    partial: getPercent(behaviorValues.partial),
                    unpaid: getPercent(behaviorValues.unpaid)
                },
                totalCount: totalSalesCount
            },
            debt: {
                total: totalDebt,
                count: owingCustomersCount
            },
            inventory: {
                out: outOfStock.length,
                low: lowStock.length,
                shortlist: [...outOfStock, ...lowStock].slice(0, 5)
            },
            profit: {
                gross: grossProfit,
                net: netProfit,
                margin: avgProfitMargin,
                trend: profitTrend,
                topProducts: topProfitableProducts
            }
        };
    }, [sales, expenses, products, customers, timeScope, alertHistory]);

    const TrendIcon = ({ drift }) => {
        if (drift === 'up') return <TrendingUp size={14} className="trend-up" />;
        if (drift === 'down') return <TrendingDown size={14} className="trend-down" />;
        return <Minus size={14} className="trend-flat" />;
    };

    const InsightIcon = ({ type }) => {
        switch (type) {
            case 'sales': return <TrendingUp size={18} />;
            case 'expense': return <Wallet size={18} />;
            case 'inventory': return <Package size={18} />;
            case 'payment': return <Clock size={18} />;
            default: return <Sparkles size={18} />;
        }
    };

    return (
        <div className="page container dashboard">
            <header className="dashboard-header">
                <div className="header-main">
                    <span className="greeting-text">{greeting},</span>
                    <h1>{businessProfile.name || <span className="setup-prompt">Set your business name in Settings</span>}</h1>
                    <span className="current-date">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</span>
                </div>
                <button className="settings-trigger" onClick={() => navigate('/settings')}>
                    <SettingsIcon size={24} />
                </button>
            </header>

            {activeHoliday && (
                <div className="holiday-banner fade-in">
                    <Sparkles size={16} className="holiday-stars" />
                    <span>Happy {activeHoliday.name} 🇺🇬 {activeHoliday.message}</span>
                </div>
            )}

            {/* Scope Control */}
            <div className="scope-selector">
                <button className={timeScope === 'today' ? 'active' : ''} onClick={() => setTimeScope('today')}>Today</button>
                <button className={timeScope === 'week' ? 'active' : ''} onClick={() => setTimeScope('week')}>This Week</button>
                <button className={timeScope === 'month' ? 'active' : ''} onClick={() => setTimeScope('month')}>This Month</button>
            </div>

            <div className="fade-in">
                {isLoading ? (
                    <>
                        <section className="tier-1-stats">
                            <SkeletonLoader type="stat" count={2} />
                        </section>
                        <section className="progressive-section">
                            <SkeletonLoader type="list" count={1} />
                        </section>
                    </>
                ) : (
                    <>
                        {/* TIER 1: Always Visible Core Stats */}
                        <section className="tier-1-stats">
                            <div className="main-stat-card">
                                <span className="label">Total {timeScope} Sales</span>
                                <span className="value">{formatCurrency(stats.scope.sales)}</span>
                            </div>

                            <div className="main-stat-card profit">
                                <span className="label">Net Profit ({timeScope})</span>
                                <span className="value">{formatCurrency(stats.profit.net)}</span>
                                <span className="meta">
                                    Margin: {stats.profit.margin.toFixed(1)}%
                                    <TrendIcon drift={stats.profit.trend} />
                                </span>
                            </div>

                            <div className="compact-grid">
                                <div className="compact-card danger" onClick={() => navigate('/customers?tab=owing')}>
                                    <div className="card-header"><Users size={16} /> <span>Debt</span></div>
                                    <span className="card-value">{formatCurrency(stats.debt.total)}</span>
                                    <span className="card-meta">{stats.debt.count} customers</span>
                                </div>
                                <div className="compact-card warning" onClick={() => navigate('/inventory', { state: { filter: 'low' } })}>
                                    <div className="card-header"><AlertTriangle size={16} /> <span>Alerts</span></div>
                                    <span className="card-value">{stats.inventory.out + stats.inventory.low} Items</span>
                                    <span className="card-meta">{stats.inventory.out} out of stock</span>
                                </div>
                            </div>
                        </section>

                        {/* PHASE 8: Smart Alerts Section */}
                        <section className={`progressive-section alerts-container ${expandedSections.alerts ? 'expanded' : ''}`}>
                            <div className="section-trigger" onClick={() => toggleSection('alerts')}>
                                <div className="trigger-left">
                                    <AlertTriangle size={18} className="alert-icon-main" />
                                    <div className="trigger-text">
                                        <h3>Smart Alerts</h3>
                                        {!expandedSections.alerts && (
                                            <span className={`preview-text ${stats.activeAlerts.length > 0 ? 'has-alerts' : ''}`}>
                                                {stats.activeAlerts.length > 0 ? `${stats.activeAlerts.length} matters need attention` : 'No alerts today'}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="trigger-right-actions">
                                    <label className="toggle-switch" onClick={e => e.stopPropagation()}>
                                        <input
                                            type="checkbox"
                                            checked={alertsEnabled}
                                            onChange={() => setAlertsEnabled(!alertsEnabled)}
                                        />
                                        <span className="slider round"></span>
                                    </label>
                                    {expandedSections.alerts ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                </div>
                            </div>

                            {expandedSections.alerts && alertsEnabled && (
                                <div className="expanded-content alerts-list">
                                    {stats.activeAlerts.length > 0 ? (
                                        stats.activeAlerts.map(alert => (
                                            <div key={alert.id} className={`alert-item-card ${alert.type}`} onClick={alert.action}>
                                                <div className="alert-card-icon">
                                                    {alert.type === 'debt' && <Users size={16} />}
                                                    {alert.type === 'stock' && <Package size={16} />}
                                                    {alert.type === 'expense' && <Wallet size={16} />}
                                                </div>
                                                <div className="alert-card-text">
                                                    <h4>{alert.title}</h4>
                                                    <p>{alert.message}</p>
                                                </div>
                                                <ArrowRight size={14} className="alert-chevron" />
                                            </div>
                                        ))
                                    ) : <p className="empty-alerts">All systems healthy. No alerts today.</p>}
                                </div>
                            )}
                        </section>
                    </>
                )}

                {/* TIER 2: Collapsible AI Insights */}
                <section className={`progressive-section ai-insights ${expandedSections.aiInsights ? 'expanded' : ''}`}>
                    <div className="section-trigger" onClick={() => toggleSection('aiInsights')}>
                        <div className="trigger-left">
                            <Sparkles size={18} className="ai-icon" />
                            <div className="trigger-text">
                                <h3>Today's Insights</h3>
                                {!expandedSections.aiInsights && <span className="preview-text">{stats.aiInsights.length} business insights available</span>}
                            </div>
                        </div>
                        {expandedSections.aiInsights ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </div>

                    {expandedSections.aiInsights && (
                        <div className="expanded-content">
                            <div className="ai-insights-scroll">
                                {stats.aiInsights.map((insight, idx) => (
                                    <div key={idx} className={`ai-insight-card ${insight.type}`}>
                                        <div className="insight-icon-wrapper">
                                            <InsightIcon type={insight.type} />
                                        </div>
                                        <p>{insight.text}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </section>

                {/* TIER 3: Collapsible Details (Accordion) */}
                <div className="detail-accordion">
                    {/* Sales Trends */}
                    <div className={`accordion-item ${expandedSections.salesTrends ? 'expanded' : ''}`}>
                        <div className="accordion-trigger" onClick={() => toggleSection('salesTrends')}>
                            <div className="trigger-label">
                                <BarChart2 size={18} />
                                <span>Sales Trends</span>
                            </div>
                            <div className="trigger-summary">
                                {!expandedSections.salesTrends && <span>{stats.summaries.salesTrends}</span>}
                                {expandedSections.salesTrends ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                            </div>
                        </div>
                        {expandedSections.salesTrends && (
                            <div className="accordion-content">
                                <div className="trend-list">
                                    {['today', 'week', 'month'].map(scope => (
                                        <div key={scope} className="trend-item">
                                            <div className="trend-info">
                                                <span className="trend-label">{scope.charAt(0).toUpperCase() + scope.slice(1)}</span>
                                                <div className="trend-values">
                                                    <span className="current">{formatCurrency(stats.trends[scope].current)}</span>
                                                    <span className="previous">vs {formatCurrency(stats.trends[scope].previous)}</span>
                                                </div>
                                            </div>
                                            <TrendIcon drift={stats.trends[scope].drift} />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Expenses Overview */}
                    <div className={`accordion-item ${expandedSections.expenses ? 'expanded' : ''}`}>
                        <div className="accordion-trigger" onClick={() => toggleSection('expenses')}>
                            <div className="trigger-label">
                                <Wallet size={18} />
                                <span>Expenses Overview</span>
                            </div>
                            <div className="trigger-summary">
                                {!expandedSections.expenses && <span>{stats.summaries.expenses}</span>}
                                {expandedSections.expenses ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                            </div>
                        </div>
                        {expandedSections.expenses && (
                            <div className="accordion-content">
                                <div className="expense-insight-content">
                                    <div className="expense-total-display">
                                        <span className="label">Total Expenses ({timeScope})</span>
                                        <span className="value">{formatCurrency(stats.scope.expenses)}</span>
                                    </div>
                                    {stats.scope.topExpenses.length > 0 ? (
                                        <div className="top-categories">
                                            <span className="sub-label">Top Categories</span>
                                            {stats.scope.topExpenses.map(cat => (
                                                <div key={cat.name} className="cat-drift-item">
                                                    <div className="cat-info">
                                                        <span className="cat-name">{cat.name}</span>
                                                        <span className="cat-amount">{formatCurrency(cat.amount)}</span>
                                                    </div>
                                                    <TrendIcon drift={cat.drift} />
                                                </div>
                                            ))}
                                        </div>
                                    ) : <p className="empty-text">No expenses recorded.</p>}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Product Movement */}
                    <div className={`accordion-item ${expandedSections.productMovement ? 'expanded' : ''}`}>
                        <div className="accordion-trigger" onClick={() => toggleSection('productMovement')}>
                            <div className="trigger-label">
                                <Package size={18} />
                                <span>Product Movement</span>
                            </div>
                            <div className="trigger-summary">
                                {!expandedSections.productMovement && <span>{stats.summaries.productMovement}</span>}
                                {expandedSections.productMovement ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                            </div>
                        </div>
                        {expandedSections.productMovement && (
                            <div className="accordion-content">
                                {stats.scope.movement.length > 0 ? (
                                    <div className="movement-list">
                                        {stats.scope.movement.map(item => (
                                            <div key={item.id} className="movement-item">
                                                <div className="item-info">
                                                    <span className="item-name">{item.productName}</span>
                                                    <span className="item-meta">{item.unitsSold} sold • {item.stockQuantity} in stock</span>
                                                </div>
                                                <span className={`velocity-badge ${item.velocity.toLowerCase().replace(' ', '-')}`}>
                                                    {item.velocity}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                ) : <p className="empty-text">No sales recorded.</p>}
                            </div>
                        )}
                    </div>

                    {/* Payment Behavior */}
                    <div className={`accordion-item ${expandedSections.paymentBehavior ? 'expanded' : ''}`}>
                        <div className="accordion-trigger" onClick={() => toggleSection('paymentBehavior')}>
                            <div className="trigger-label">
                                <ShoppingCart size={18} />
                                <span>Payment Behavior</span>
                            </div>
                            <div className="trigger-summary">
                                {!expandedSections.paymentBehavior && <span>{stats.summaries.paymentBehavior}</span>}
                                {expandedSections.paymentBehavior ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                            </div>
                        </div>
                        {expandedSections.paymentBehavior && (
                            <div className="accordion-content">
                                {stats.scope.totalCount > 0 ? (
                                    <div className="behavior-content">
                                        {[
                                            { label: 'Paid Immediately', value: stats.scope.behavior.paid, color: '#22c55e' },
                                            { label: 'Partial Payment', value: stats.scope.behavior.partial, color: '#f59e0b' },
                                            { label: 'Unpaid / Credit', value: stats.scope.behavior.unpaid, color: '#ef4444' }
                                        ].map(item => (
                                            <div key={item.label} className="behavior-row">
                                                <div className="behavior-labels">
                                                    <span>{item.label}</span>
                                                    <span>{item.value}%</span>
                                                </div>
                                                <div className="progress-bar">
                                                    <div className="progress-fill" style={{ width: `${item.value}%`, backgroundColor: item.color }} />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : <p className="empty-text">No data to display.</p>}
                            </div>
                        )}
                    </div>
                </div>

                {/* Quick Actions (Always Visible) */}
                <section className="quick-actions">
                    <button className="action-btn" onClick={() => navigate('/customers', { state: { focusSearch: true } })}>
                        <Plus size={20} />
                        <span>Quick Transaction</span>
                    </button>
                    <div className="action-row">
                        <button className="small-action" onClick={() => navigate('/customers?tab=owing')}>View Debtors</button>
                        <button className="small-action" onClick={() => navigate('/inventory')}>Check Stock</button>
                    </div>
                </section>
            </div>
        </div>
    );
};

export default Dashboard;
