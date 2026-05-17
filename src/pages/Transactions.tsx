import { useState } from 'react';
import { useTransactionStore } from '../store/transactionStore';
import { useAuthStore } from '../store/authStore';
import { useAuditLogStore } from '../store/auditLogStore';
import { formatRupiah, formatDate } from '../utils/format';
import type { TxStatus } from '../types';
import PinModal from '../components/PinModal';
import {
  ChevronDown,
  ChevronUp,
  Trash2,
  Ban,
  CheckCircle2,
  FlaskConical,
} from 'lucide-react';

export default function Transactions() {
  const { transactions, updateTxStatus, deleteTransaction } = useTransactionStore();
  const { currentUser } = useAuthStore();
  const { addLog } = useAuditLogStore();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [pinAction, setPinAction] = useState<{ type: 'status' | 'delete'; id: string; status?: TxStatus } | null>(null);

  const todayTx = transactions.filter((t) => {
    const d = new Date(t.date);
    const today = new Date();
    return (
      d.getFullYear() === today.getFullYear() &&
      d.getMonth() === today.getMonth() &&
      d.getDate() === today.getDate()
    );
  });

  const handleStatusChange = (id: string, status: TxStatus) => {
    if (currentUser?.role === 'Manager') {
      updateTxStatus(id, status);
      if (currentUser) {
        addLog(currentUser.id, currentUser.name, currentUser.role, 'void_transaction', `Ubah status transaksi ${id} menjadi ${status}`, { transactionId: id, newStatus: status });
      }
    } else {
      setPinAction({ type: 'status', id, status });
    }
  };

  const handleDelete = (id: string) => {
    if (currentUser?.role === 'Manager') {
      deleteTransaction(id);
      if (currentUser) {
        addLog(currentUser.id, currentUser.name, currentUser.role, 'delete_transaction', `Hapus transaksi ${id}`, { transactionId: id });
      }
    } else {
      setPinAction({ type: 'delete', id });
    }
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
                        onClick={() => handleStatusChange(tx.id, 'Selesai')}
                        className="btn-secondary text-xs"
                      >
                        <CheckCircle2 size={14} /> Selesai
                      </button>
                    )}
                    {tx.txStatus !== 'Cancel' && (
                      <button
                        onClick={() => handleStatusChange(tx.id, 'Cancel')}
                        className="btn-secondary text-xs text-red-600"
                      >
                        <Ban size={14} /> Cancel
                      </button>
                    )}
                    {tx.txStatus !== 'Demo' && (
                      <button
                        onClick={() => handleStatusChange(tx.id, 'Demo')}
                        className="btn-secondary text-xs text-purple-600"
                      >
                        <FlaskConical size={14} /> Demo
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(tx.id)}
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

      <PinModal
        open={!!pinAction}
        onClose={() => setPinAction(null)}
        onSuccess={onPinSuccess}
      />
    </div>
  );
}
