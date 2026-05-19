import { useState, useEffect } from 'react';
import { useTransactionStore } from '../store/transactionStore';
import { useAuthStore } from '../store/authStore';
import { useAuditLogStore } from '../store/auditLogStore';
import { subscribeToTransactions, unsubscribeChannel, fetchTransactionsFromCloud } from '../lib/cloudSync';
import { isSupabaseConfigured } from '../lib/supabase';
import { formatRupiah, formatDate } from '../utils/format';
import type { TxStatus } from '../types';
import PinModal from '../components/PinModal';
import ConfirmDialog from '../components/ConfirmDialog';
import {
  ChevronDown,
  ChevronUp,
  Trash2,
  Ban,
  CheckCircle2,
  FlaskConical,
} from 'lucide-react';

export default function Transactions() {
  const { transactions, updateTxStatus, deleteTransaction, loadFromCloud } = useTransactionStore();
  const { currentUser } = useAuthStore();
  const { addLog } = useAuditLogStore();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [pinAction, setPinAction] = useState<{ type: 'status' | 'delete'; id: string; status?: TxStatus } | null>(null);
  // FEAT-5: Confirmation dialog state for Manager actions
  const [confirmAction, setConfirmAction] = useState<{ type: 'status' | 'delete'; id: string; status?: TxStatus; queueNumber?: number } | null>(null);

  // Real-time sync: subscribe to transaction changes from other devices
  useEffect(() => {
    if (!isSupabaseConfigured) return;

    // Subscribe to real-time changes (INSERT, UPDATE, DELETE from any device)
    const channel = subscribeToTransactions(() => {
      fetchTransactionsFromCloud().then((cloudTx) => {
        if (cloudTx) loadFromCloud(cloudTx, true); // fullSync: cloud is authoritative
      });
    });

    return () => { if (channel) unsubscribeChannel(channel); };
  }, []);

  const todayTx = transactions.filter((t) => {
    const d = new Date(t.date);
    const today = new Date();
    return (
      d.getFullYear() === today.getFullYear() &&
      d.getMonth() === today.getMonth() &&
      d.getDate() === today.getDate()
    );
  });

  const handleStatusChange = (id: string, status: TxStatus, queueNumber?: number) => {
    if (currentUser?.role === 'Manager') {
      // FEAT-5: Show confirmation dialog instead of instant execution
      setConfirmAction({ type: 'status', id, status, queueNumber });
    } else {
      setPinAction({ type: 'status', id, status });
    }
  };

  const handleDelete = (id: string, queueNumber?: number) => {
    if (currentUser?.role === 'Manager') {
      // FEAT-5: Show confirmation dialog instead of instant execution
      setConfirmAction({ type: 'delete', id, queueNumber });
    } else {
      setPinAction({ type: 'delete', id });
    }
  };

  // FEAT-5: Execute after Manager confirms
  const onConfirmAction = () => {
    if (!confirmAction) return;
    if (confirmAction.type === 'status' && confirmAction.status) {
      updateTxStatus(confirmAction.id, confirmAction.status);
      if (currentUser) {
        addLog(currentUser.id, currentUser.name, currentUser.role, 'void_transaction', `Ubah status transaksi #${confirmAction.queueNumber || '?'} menjadi ${confirmAction.status}`, { transactionId: confirmAction.id, newStatus: confirmAction.status });
      }
    } else if (confirmAction.type === 'delete') {
      deleteTransaction(confirmAction.id);
      if (currentUser) {
        addLog(currentUser.id, currentUser.name, currentUser.role, 'delete_transaction', `Hapus transaksi #${confirmAction.queueNumber || '?'}`, { transactionId: confirmAction.id });
      }
    }
    setConfirmAction(null);
  };

  const onPinSuccess = () => {
    if (!pinAction) return;
    if (pinAction.type === 'status' && pinAction.status) {
      updateTxStatus(pinAction.id, pinAction.status);
      if (currentUser) {
        addLog(currentUser.id, currentUser.name, currentUser.role, 'void_transaction', `Ubah status transaksi ${pinAction.id} menjadi ${pinAction.status}`, { transactionId: pinAction.id, newStatus: pinAction.status });
      }
    } else if (pinAction.type === 'delete') {
      deleteTransaction(pinAction.id);
      if (currentUser) {
        addLog(currentUser.id, currentUser.name, currentUser.role, 'delete_transaction', `Hapus transaksi ${pinAction.id}`, { transactionId: pinAction.id });
      }
    }
    setPinAction(null);
  };

  const statusBadge = (status: TxStatus) => {
    switch (status) {
      case 'Selesai':
        return <span className="badge bg-green-100 text-green-700"><CheckCircle2 size={12} /> Selesai</span>;
      case 'Cancel':
        return <span className="badge bg-red-100 text-red-700"><Ban size={12} /> Cancel</span>;
      case 'Demo':
        return <span className="badge bg-purple-100 text-purple-700"><FlaskConical size={12} /> Demo</span>;
    }
  };

  // FEAT-5: Build confirmation message
  const getConfirmMessage = () => {
    if (!confirmAction) return '';
    if (confirmAction.type === 'delete') {
      return `Hapus transaksi #${confirmAction.queueNumber || '?'} secara permanen? Data tidak bisa dikembalikan.`;
    }
    const statusLabel = confirmAction.status === 'Cancel' ? 'CANCEL (void)' : confirmAction.status;
    return `Ubah status transaksi #${confirmAction.queueNumber || '?'} menjadi "${statusLabel}"?`;
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">📋 Riwayat Transaksi Hari Ini</h1>

      {todayTx.length === 0 ? (
        <div className="card p-12 text-center text-slate-400">
          <p>Belum ada transaksi hari ini</p>
        </div>
      ) : (
        <div className="space-y-3">
          {todayTx.map((tx) => (
            <div key={tx.id} className="card overflow-hidden">
              <button
                onClick={() => setExpanded(expanded === tx.id ? null : tx.id)}
                className="w-full p-4 flex items-center gap-4 text-left hover:bg-slate-50 transition"
              >
                <div className="w-10 h-10 rounded-xl bg-brand-100 flex items-center justify-center font-bold text-brand-700">
                  #{tx.queueNumber}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{formatDate(tx.date)}</p>
                  <p className="text-xs text-slate-500">
                    {tx.paymentMethod} • {tx.items.length} item • {tx.cashierName}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-brand-700">{formatRupiah(tx.totalAmount)}</p>
                  {statusBadge(tx.txStatus)}
                </div>
                {expanded === tx.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>

              {expanded === tx.id && (
                <div className="px-4 pb-4 border-t border-slate-100 pt-3 space-y-3">
                  {/* Items */}
                  <div className="space-y-2">
                    {tx.items.map((item) => (
                      <div key={item.lineId} className="flex justify-between text-sm">
                        <div>
                          <span className="font-medium">{item.name}</span>
                          <span className="text-slate-500 ml-2">
                            x{item.quantity} • {item.temperature} • {item.sugar}
                          </span>
                          {item.addons.length > 0 && (
                            <span className="text-xs text-slate-400 ml-1">
                              (+{item.addons.map((a) => a.name).join(', ')})
                            </span>
                          )}
                        </div>
                        <span className="font-medium">{formatRupiah(item.subtotal)}</span>
                      </div>
                    ))}
                  </div>

                  {tx.discount > 0 && (
                    <div className="flex justify-between text-sm text-red-500">
                      <span>Diskon</span>
                      <span>-{formatRupiah(tx.discount)}</span>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-2 border-t border-slate-100">
                    {tx.txStatus !== 'Selesai' && (
                      <button
                        onClick={() => handleStatusChange(tx.id, 'Selesai', tx.queueNumber)}
                        className="btn-secondary text-xs"
                      >
                        <CheckCircle2 size={14} /> Selesai
                      </button>
                    )}
                    {tx.txStatus !== 'Cancel' && (
                      <button
                        onClick={() => handleStatusChange(tx.id, 'Cancel', tx.queueNumber)}
                        className="btn-secondary text-xs text-red-600"
                      >
                        <Ban size={14} /> Cancel
                      </button>
                    )}
                    {tx.txStatus !== 'Demo' && (
                      <button
                        onClick={() => handleStatusChange(tx.id, 'Demo', tx.queueNumber)}
                        className="btn-secondary text-xs text-purple-600"
                      >
                        <FlaskConical size={14} /> Demo
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(tx.id, tx.queueNumber)}
                      className="btn-secondary text-xs text-red-600 ml-auto"
                    >
                      <Trash2 size={14} /> Hapus
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* PIN Modal for Kasir */}
      <PinModal
        open={!!pinAction}
        onClose={() => setPinAction(null)}
        onSuccess={onPinSuccess}
      />

      {/* FEAT-5: Confirmation Dialog for Manager */}
      <ConfirmDialog
        open={!!confirmAction}
        onClose={() => setConfirmAction(null)}
        onConfirm={onConfirmAction}
        title={confirmAction?.type === 'delete' ? '⚠️ Hapus Transaksi' : 'Ubah Status Transaksi'}
        message={getConfirmMessage()}
        confirmText={confirmAction?.type === 'delete' ? 'Ya, Hapus' : 'Ya, Ubah Status'}
        variant={confirmAction?.type === 'delete' || confirmAction?.status === 'Cancel' ? 'danger' : 'warning'}
      />
    </div>
  );
}
