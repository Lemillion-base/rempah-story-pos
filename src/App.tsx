import { Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense, useEffect } from 'react';
import { useAuthStore } from './store/authStore';
import { useShiftStore } from './store/shiftStore';
import { useStockLogStore } from './store/stockLogStore';
import { useAuditLogStore } from './store/auditLogStore';
import { useSettingsStore } from './store/settingsStore';
import { useCustomerStore } from './store/customerStore';
import { useTransactionStore } from './store/transactionStore';
import { useMenuStore } from './store/menuStore';
import { useInventoryStore } from './store/inventoryStore';
import { usePromoStore } from './store/promoStore';
import { updateFavicon, updatePageTitle } from './utils/favicon';
import { initOfflineQueue } from './lib/offlineQueue';
import { fetchTransactionsFromCloud, runMigrations, subscribeToUsers, unsubscribeChannel } from './lib/cloudSync';
import Layout from './components/Layout';
import OpenShiftModal from './components/OpenShiftModal';
import ToastContainer from './components/ToastContainer';
import Login from './pages/Login';

const POS = lazy(() => import('./pages/POS'));
const Kitchen = lazy(() => import('./pages/Kitchen'));
const Transactions = lazy(() => import('./pages/Transactions'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Catalog = lazy(() => import('./pages/Catalog'));
const Inventory = lazy(() => import('./pages/Inventory'));
const Reports = lazy(() => import('./pages/Reports'));
const Customers = lazy(() => import('./pages/Customers'));
const Promos = lazy(() => import('./pages/Promos'));
const AuditLog = lazy(() => import('./pages/AuditLog'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));

function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode; allowedRoles?: string[] }) {
  const { currentUser } = useAuthStore();
  if (!currentUser) return <Navigate to="/" replace />;
  if (allowedRoles && !allowedRoles.includes(currentUser.role)) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}

function ShiftGuard({ children }: { children: React.ReactNode }) {
  const { currentUser } = useAuthStore();
  const { activeShift } = useShiftStore();

  // BUG-K4 fix: Both Kasir and Manager must open shift before working
  // so all POS transactions are tracked for accurate cash reconciliation
  const needsShift = currentUser && (currentUser.role === 'Kasir' || currentUser.role === 'Manager') && !activeShift;

  return (
    <>
      {needsShift && <OpenShiftModal open={true} />}
      {children}
    </>
  );
}

export default function App() {
  const { currentUser, migratePasswords } = useAuthStore();

  // Migrate passwords, load cloud data, cleanup old logs, update favicon, init offline queue
  useEffect(() => {
    // BUG-K2 fix: migratePasswords MUST complete before loadFromCloud
    // to prevent cloud plain-text passwords from overwriting local hashed ones
    migratePasswords();
    initOfflineQueue();

    // Load all shared data from cloud (fullSync=true: cloud is authoritative at boot)
    useSettingsStore.getState().loadFromCloud().then(() => {
      const s = useSettingsStore.getState().settings;
      updateFavicon(s.storeLogo);
      updatePageTitle(s.storeName);
    });
    // Run database migrations first, then load cloud data
    runMigrations().then(() => {
      useMenuStore.getState().loadFromCloud(true);
    });
    useCustomerStore.getState().loadFromCloud(true);
    useInventoryStore.getState().loadFromCloud(true);
    // BUG-K2 fix: Load auth from cloud AFTER migratePasswords has set passwordsHashed=true
    // migratePasswords is synchronous, so by this point local passwords are already hashed
    useAuthStore.getState().loadFromCloud(true);
    usePromoStore.getState().loadFromCloud(true);
    // BUG-C3 fix: Load shifts from cloud
    useShiftStore.getState().loadFromCloud();
    fetchTransactionsFromCloud().then((txs) => {
      if (txs && txs.length > 0) useTransactionStore.getState().loadFromCloud(txs, true);
    });

    // Cleanup old logs, then load from cloud
    // BUG-C4 fix: Load stock logs and audit logs from cloud
    useStockLogStore.getState().clearOldLogs(30);
    useStockLogStore.getState().loadFromCloud();
    useAuditLogStore.getState().clearOldLogs(90);
    useAuditLogStore.getState().loadFromCloud();
  }, []);

  // Subscribe to realtime users table changes to prevent multi-device logins
  useEffect(() => {
    if (!currentUser) return;

    const channel = subscribeToUsers((payload: any) => {
      if (payload.new && payload.new.id === currentUser.id) {
        const localActiveSessionId = currentUser.activeSessionId;
        const newActiveSessionId = payload.new.active_session_id;

        // If there's a different session ID active in cloud, log out local session
        if (newActiveSessionId && localActiveSessionId && newActiveSessionId !== localActiveSessionId) {
          alert('Akun Anda telah masuk di perangkat lain. Sesi ini akan ditutup.');
          useAuthStore.getState().logout();
          window.location.href = '/';
        }
      }
    });

    return () => {
      if (channel) unsubscribeChannel(channel);
    };
  }, [currentUser]);

  return (
    <>
    <ToastContainer />
    <Suspense fallback={<div className="flex items-center justify-center h-screen"><div className="text-brand-600 text-lg font-medium">Memuat...</div></div>}>
    <Routes>
      <Route
        path="/"
        element={
          currentUser ? (
            <Navigate to={currentUser.role === 'Manager' ? '/dashboard' : currentUser.role === 'Kasir' ? '/pos' : '/kitchen'} replace />
          ) : (
            <Login />
          )
        }
      />

      <Route
        element={
          <ProtectedRoute>
            <ShiftGuard>
              <Layout />
            </ShiftGuard>
          </ProtectedRoute>
        }
      >
        <Route path="/pos" element={<ProtectedRoute allowedRoles={['Manager', 'Kasir']}><POS /></ProtectedRoute>} />
        <Route path="/kitchen" element={<ProtectedRoute allowedRoles={['Manager', 'Acaraki']}><Kitchen /></ProtectedRoute>} />
        <Route path="/transactions" element={<ProtectedRoute allowedRoles={['Manager', 'Kasir']}><Transactions /></ProtectedRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute allowedRoles={['Manager']}><Dashboard /></ProtectedRoute>} />
        <Route path="/catalog" element={<ProtectedRoute allowedRoles={['Manager']}><Catalog /></ProtectedRoute>} />
        <Route path="/inventory" element={<ProtectedRoute allowedRoles={['Manager']}><Inventory /></ProtectedRoute>} />
        <Route path="/reports" element={<ProtectedRoute allowedRoles={['Manager']}><Reports /></ProtectedRoute>} />
        <Route path="/customers" element={<ProtectedRoute allowedRoles={['Manager', 'Kasir']}><Customers /></ProtectedRoute>} />
        <Route path="/promos" element={<ProtectedRoute allowedRoles={['Manager']}><Promos /></ProtectedRoute>} />
        <Route path="/audit-log" element={<ProtectedRoute allowedRoles={['Manager']}><AuditLog /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute allowedRoles={['Manager']}><SettingsPage /></ProtectedRoute>} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </Suspense>
    </>
  );
}
