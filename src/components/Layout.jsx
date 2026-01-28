import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import BottomNavigation from './BottomNavigation';
import GlobalFAB from './GlobalFAB';
import BottomSheet from './BottomSheet';
import ProductForm from './ProductForm';
import SalesForm from './SalesForm';
import ExpenseForm from './ExpenseForm';
import { useProduct } from '../context/ProductContext';
import { useSales } from '../context/SalesContext';
import { useExpense } from '../context/ExpenseContext';
import './Layout.css';

const Layout = () => {
    const location = useLocation();
    const { addProduct, updateProduct, products } = useProduct();
    const { addSale } = useSales();
    const { addExpense } = useExpense();
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [isAddProductOpen, setIsAddProductOpen] = useState(false);
    const [isAddSaleOpen, setIsAddSaleOpen] = useState(false);
    const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);

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
        { label: 'Add Product', onClick: handleAddProductClick, disabled: false },
        { label: 'Add Sale', onClick: handleAddSaleClick, disabled: false },
        { label: 'Add Expense', onClick: handleAddExpenseClick, disabled: false },
        { label: 'Record Payment', disabled: true },
    ];

    return (
        <div className="app-layout">
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
