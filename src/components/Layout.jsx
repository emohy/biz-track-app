import { useState, useMemo } from 'react';
import { useNavigate, Outlet, useLocation } from 'react-router-dom';
import BottomNavigation from './BottomNavigation';
import GlobalFAB from './GlobalFAB';
import BottomSheet from './BottomSheet';
import ProductForm from './ProductForm';
import SalesForm from './SalesForm';
import ExpenseForm from './ExpenseForm';
import NotificationToast from './NotificationToast';
import Onboarding from './Onboarding';
import { useProduct } from '../context/ProductContext';
import { useSales } from '../context/SalesContext';
import { useExpense } from '../context/ExpenseContext';
import { useCustomer } from '../context/CustomerContext';
import { Plus, ShoppingCart, Package, Receipt, CreditCard } from 'lucide-react';
import './Layout.css';

const Layout = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { addProduct, updateProduct, products } = useProduct();
    const { addSale, sales } = useSales();
    const { addExpense } = useExpense();
    const { customers } = useCustomer();
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [isAddProductOpen, setIsAddProductOpen] = useState(false);
    const [isAddSaleOpen, setIsAddSaleOpen] = useState(false);
    const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);

    const hasOwingCustomers = useMemo(() => {
        return customers.some(customer => {
            const customerSales = sales.filter(s => s.customerId === customer.id);
            const balance = customerSales.reduce((acc, sale) => acc + (sale.amountDue || 0), 0);
            return balance > 0;
        });
    }, [customers, sales]);

    const openSheet = () => setIsSheetOpen(true);
    const closeSheet = () => setIsSheetOpen(false);

    const handleAddProductClick = () => {
        closeSheet();
        setIsAddProductOpen(true);
    };

    const handleAddSaleClick = () => {
        closeSheet();
        setIsAddSaleOpen(true);
    };

    const handleAddExpenseClick = () => {
        closeSheet();
        setIsAddExpenseOpen(true);
    };

    const handleRecordPaymentClick = () => {
        closeSheet();
        navigate('/customers', { state: { activeTab: 'owing' } });
    };

    const submitProduct = (data) => {
        addProduct(data);
        setIsAddProductOpen(false);
    };

    const submitSale = (saleData) => {
        // 1. Create Sale Record
        addSale(saleData);

        // 2. Deduct Stock Logic
        const product = products.find(p => p.id === saleData.productId);
        if (product) {
            const newStock = product.stockQuantity - saleData.quantitySold;
            updateProduct(saleData.productId, { stockQuantity: newStock });
        }

        setIsAddSaleOpen(false);
    };

    const submitExpense = (data) => {
        addExpense(data);
        setIsAddExpenseOpen(false);
    };

    const actions = [
        { label: 'Add Sale', onClick: handleAddSaleClick, icon: <ShoppingCart size={20} />, primary: true },
        { label: 'Add Product', onClick: handleAddProductClick, icon: <Package size={20} /> },
        { label: 'Add Expense', onClick: handleAddExpenseClick, icon: <Receipt size={20} /> },
        { type: 'separator' },
        {
            label: 'Record Payment',
            onClick: handleRecordPaymentClick,
            icon: <CreditCard size={20} />,
            subtitle: !hasOwingCustomers ? 'No outstanding payments to record' : null
        },
    ];

    return (
        <div className="app-layout">
            <NotificationToast />
            <Onboarding />
            <main className="content">
                <Outlet />
            </main>
            <BottomNavigation />
            <GlobalFAB onClick={openSheet} />

            <BottomSheet
                isOpen={isSheetOpen}
                onClose={closeSheet}
                actions={actions}
            />

            <ProductForm
                isOpen={isAddProductOpen}
                onClose={() => setIsAddProductOpen(false)}
                onSubmit={submitProduct}
            />

            <SalesForm
                isOpen={isAddSaleOpen}
                onClose={() => setIsAddSaleOpen(false)}
                onSubmit={submitSale}
            />

            <ExpenseForm
                isOpen={isAddExpenseOpen}
                onClose={() => setIsAddExpenseOpen(false)}
                onSubmit={submitExpense}
            />
        </div>
    );
};

export default Layout;
