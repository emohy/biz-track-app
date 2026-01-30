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
import { SettingsProvider, useSettings } from './context/SettingsContext';
import Settings from './pages/Settings';

const TestModeBanner = () => {
  const { testMode } = useSettings();
  if (!testMode) return null;
  return (
    <div className="test-mode-banner">
      <span>TEST MODE ACTIVE</span>
    </div>
  );
};

function App() {
  return (
    <SettingsProvider>
      <ProductProvider>
        <SalesProvider>
          <ExpenseProvider>
            <CustomerProvider>
              <Router>
                <TestModeBanner />
                <Routes>
                  <Route path="/" element={<Layout />}>
                    <Route index element={<Dashboard />} />
                    <Route path="inventory" element={<Inventory />} />
                    <Route path="sales" element={<Sales />} />
                    <Route path="expenses" element={<Expenses />} />
                    <Route path="customers" element={<Customers />} />
                    <Route path="customers/:id" element={<CustomerDetail />} />
                    <Route path="settings" element={<Settings />} />
                  </Route>
                </Routes>
              </Router>
            </CustomerProvider>
          </ExpenseProvider>
        </SalesProvider>
      </ProductProvider>
    </SettingsProvider>
  );
}

export default App;
