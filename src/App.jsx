import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import Sales from './pages/Sales';
import FinancePage from './pages/FinancePage';
import LoanDetail from './pages/LoanDetail';
import Customers from './pages/Customers';
import CustomerDetail from './pages/CustomerDetail';
import SignIn from './pages/SignIn';
import MigrationModal from './components/MigrationModal';
import { ProductProvider } from './context/ProductContext';
import { SalesProvider } from './context/SalesContext';
import { ExpenseProvider } from './context/ExpenseContext';
import { CustomerProvider } from './context/CustomerContext';
import { SettingsProvider, useSettings } from './context/SettingsContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoanProvider } from './context/LoanContext';
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

const AppContent = () => {
  const { user } = useAuth();

  useEffect(() => {
    console.log("Environment check:", {
      hasApiKey: !!import.meta.env.VITE_FIREBASE_API_KEY,
      hasProjectId: !!import.meta.env.VITE_FIREBASE_PROJECT_ID,
      env: import.meta.env.MODE
    });
  }, []);

  if (!user) {
    return <SignIn />;
  }

  return (
    <SettingsProvider>
      <ProductProvider>
        <SalesProvider>
          <ExpenseProvider>
            <CustomerProvider>
              <LoanProvider>
                <MigrationModal user={user} />
                <Router>
                  <TestModeBanner />
                  <Routes>
                    <Route path="/" element={<Layout />}>
                      <Route index element={<Dashboard />} />
                      <Route path="inventory" element={<Inventory />} />
                      <Route path="sales" element={<Sales />} />
                      <Route path="finance" element={<FinancePage />} />
                      <Route path="expenses" element={<FinancePage />} />
                      <Route path="customers" element={<Customers />} />
                      <Route path="customers/:id" element={<CustomerDetail />} />
                      <Route path="loans" element={<FinancePage />} />
                      <Route path="finance/loans/:loanId" element={<LoanDetail />} />
                      <Route path="settings" element={<Settings />} />
                    </Route>
                  </Routes>
                </Router>
              </LoanProvider>
            </CustomerProvider>
          </ExpenseProvider>
        </SalesProvider>
      </ProductProvider>
    </SettingsProvider>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
