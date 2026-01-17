import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Provider } from 'react-redux';
import { Toaster } from 'react-hot-toast';
import { store } from './store/store';
import { LanguageProvider } from './i18n';
import { ThemeProvider } from './context/ThemeContext';
import Layout from './components/Layout';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import POS from './pages/POS';
import Products from './pages/Products';
import Customers from './pages/Customers';
import Cashiers from './pages/Cashiers';
import Branches from './pages/Branches';
import Debts from './pages/Debts';
import Deliveries from './pages/Deliveries';
import Warehouses from './pages/Warehouses';
import Returns from './pages/Returns';
import History from './pages/History';
import Settings from './pages/Settings';
import { OfflineIndicator } from './components/PWA';
import './App.css';

function App() {
  return (
    <Provider store={store}>
      <ThemeProvider>
      <LanguageProvider>
      <Router>
        <div className="App">
          <OfflineIndicator />
          <Toaster position="top-right" />
          <Routes>
            {/* Asosiy sahifa - Kassirlar ro'yxati */}
            <Route path="/" element={<Home />} />
            
            {/* POS - Kassir ID bilan */}
            <Route path="/:cashierId/pos" element={<POS />} />
            <Route path="/:cashierId/pos/products" element={<POS />} />
            <Route path="/:cashierId/pos/customers" element={<POS />} />
            <Route path="/:cashierId/pos/debts" element={<POS />} />
            
            {/* Admin Panel */}
            <Route path="/admin" element={<Layout />}>
              <Route index element={<Dashboard />} />
              <Route path="cashiers" element={<Cashiers />} />
              <Route path="branches" element={<Branches />} />
              <Route path="products" element={<Products />} />
              <Route path="deliveries" element={<Deliveries />} />
              <Route path="warehouses" element={<Warehouses />} />
              <Route path="returns" element={<Returns />} />
              <Route path="debts" element={<Debts />} />
              <Route path="history" element={<History />} />
              <Route path="customers" element={<Customers />} />
              <Route path="settings" element={<Settings />} />
            </Route>
          </Routes>
        </div>
      </Router>
      </LanguageProvider>
      </ThemeProvider>
    </Provider>
  );
}

export default App;
