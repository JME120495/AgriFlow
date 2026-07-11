import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Toaster, toast } from 'react-hot-toast';
import io from 'socket.io-client';
import Login from './pages/Auth/Login';
import ForgotPassword from './pages/Auth/ForgotPassword';
import Users from './pages/Admin/Users';
import Permissions from './pages/Admin/Permissions';
import Dashboard from './pages/Dashboard/Dashboard';
import PlanterList from './pages/Planters/PlanterList';
import PlanterForm from './pages/Planters/PlanterForm';
import PlanterDetails from './pages/Planters/PlanterDetails';
import SubBuyersList from './pages/SubBuyers/SubBuyersList';
import SubBuyerDetail from './pages/SubBuyers/SubBuyerDetail';
import ZoneManagersList from './pages/ZoneManagers/ZoneManagersList';
import ZoneManagerDetails from './pages/ZoneManagers/ZoneManagerDetails';
import ZoneMap from './pages/ZoneManagers/ZoneMap';
import CreditsList from './pages/Credits/CreditsList';
import CreditDetails from './pages/Credits/CreditDetails';
import PurchasesList from './pages/Purchases/PurchasesList';
import PurchaseForm from './pages/Purchases/PurchaseForm';

// Initialiser le WebSocket
const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:3000', {
  transports: ['websocket'],
});

// Route protégée vérifiant si l'utilisateur est authentifié
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
        Chargement de l'environnement sécurisé...
      </div>
    );
  }
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

function App() {
  useEffect(() => {
    socket.on('connect', () => {
      console.log('Connecté au serveur WebSocket');
    });

    socket.on('alert', (data) => {
      if (data.type === 'error') toast.error(data.message);
      else if (data.type === 'success') toast.success(data.message);
      else toast(data.message);
    });

    return () => {
      socket.off('connect');
      socket.off('alert');
    };
  }, []);

  return (
    <AuthProvider>
      <Toaster position="top-right" />
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/planters"
            element={
              <ProtectedRoute>
                <PlanterList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/planters/new"
            element={
              <ProtectedRoute>
                <PlanterForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/planters/:id"
            element={
              <ProtectedRoute>
                <PlanterDetails />
              </ProtectedRoute>
            }
          />
          <Route
            path="/planters/:id/edit"
            element={
              <ProtectedRoute>
                <PlanterForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/sub-buyers"
            element={
              <ProtectedRoute>
                <SubBuyersList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/sub-buyers/:id"
            element={
              <ProtectedRoute>
                <SubBuyerDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/zone-managers"
            element={
              <ProtectedRoute>
                <ZoneManagersList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/zone-managers/:id"
            element={
              <ProtectedRoute>
                <ZoneManagerDetails />
              </ProtectedRoute>
            }
          />
          <Route
            path="/zone-managers/map"
            element={
              <ProtectedRoute>
                <ZoneMap />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute>
                <Users />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/permissions"
            element={
              <ProtectedRoute>
                <Permissions />
              </ProtectedRoute>
            }
          />
          <Route
            path="/credits"
            element={
              <ProtectedRoute>
                <CreditsList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/credits/:id"
            element={
              <ProtectedRoute>
                <CreditDetails />
              </ProtectedRoute>
            }
          />
          <Route
            path="/purchases"
            element={
              <ProtectedRoute>
                <PurchasesList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/purchases/new"
            element={
              <ProtectedRoute>
                <PurchaseForm />
              </ProtectedRoute>
            }
          />
          
          {/* Redirection par défaut */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
