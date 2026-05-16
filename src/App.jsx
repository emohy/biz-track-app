import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import Sales from './pages/Sales';
import FinancePage from './pages/FinancePage';
import LoanDetail from './pages/LoanDetail';
import Customers from './pages/Customers';
import CustomerDetail from './pages/CustomerDetail';
import SignIn from './pages/SignIn';
import LandingPage from './pages/LandingPage';
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

import splashLogo from './assets/branding/logo-full.png';

const SplashScreen = () => (
  <div style={{ 
    height: '100vh', 
    display: 'flex', 
    flexDirection: 'column',
    alignItems: 'center', 
    justifyContent: 'center',
    background: '#F8FAFC',
    color: '#0F172A',
    padding: '2rem',
    textAlign: 'center'
  }}>
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2rem' }}>
      <img 
        src={splashLogo} 
        alt="PesaFlow" 
        style={{ 
          width: '180px', 
          height: 'auto',
          marginBottom: '1rem'
        }} 
      />
      <div className="spinner" style={{ width: '30px', height: '30px', borderTopColor: '#2F6FED' }}></div>
      <p style={{ 
        position: 'absolute', 
        bottom: '3rem', 
        fontSize: '1rem', 
        fontWeight: '600',
        letterSpacing: '0.05em',
        color: '#475569',
        opacity: 0.8
      }}>
        TRACK. GROW. FLOW.
      </p>
    </div>
  </div>
);

const AuthenticatedApp = ({ user }) => (
  <SettingsProvider>
    <ProductProvider>
      <SalesProvider>
        <ExpenseProvider>
          <CustomerProvider>
            <LoanProvider>
              <MigrationModal user={user} />
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
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Route>
              </Routes>
            </LoanProvider>
          </CustomerProvider>
        </ExpenseProvider>
      </SalesProvider>
    </ProductProvider>
  </SettingsProvider>
);

const AppContent = () => {
  const { user, loading } = useAuth();

  useEffect(() => {
    console.log("Environment check:", {
      hasApiKey: !!import.meta.env.VITE_FIREBASE_API_KEY,
      hasProjectId: !!import.meta.env.VITE_FIREBASE_PROJECT_ID,
      env: import.meta.env.MODE
    });
  }, []);

  if (loading) {
    return <SplashScreen />;
  }

  return (
    <Router>
      <Routes>
        <Route path="/landing" element={<LandingPage />} />
        <Route 
          path="/*" 
          element={!user ? <SignIn /> : <AuthenticatedApp user={user} />} 
        />
      </Routes>
    </Router>
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

