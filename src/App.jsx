import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import Sales from './pages/Sales';
import Expenses from './pages/Expenses';
import Customers from './pages/Customers';
import CustomerDetail from './pages/CustomerDetail';
import { ProductProvider } from './context/ProductContext';
import { SalesProvider } from './context/SalesContext';
import { ExpenseProvider } from './context/ExpenseContext';
import { CustomerProvider } from './context/CustomerContext';

function App() {
  return (
    <ProductProvider>
      <SalesProvider>
        <ExpenseProvider>
          <CustomerProvider>
            <Router>
              <Routes>
                <Route path="/" element={<Layout />}>
                  <Route index element={<Dashboard />} />
                  <Route path="inventory" element={<Inventory />} />
                  <Route path="sales" element={<Sales />} />
                  <Route path="expenses" element={<Expenses />} />
                  <Route path="customers" element={<Customers />} />
                  <Route path="customers/:id" element={<CustomerDetail />} />
                </Route>
              </Routes>
            </Router>
          </CustomerProvider>
        </ExpenseProvider>
      </SalesProvider>
    </ProductProvider>
  );
}

export default App;
