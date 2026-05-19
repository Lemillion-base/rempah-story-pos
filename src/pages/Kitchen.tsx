import { useState, useEffect, useRef } from 'react';
import { useTransactionStore } from '../store/transactionStore';
import { useShiftStore } from '../store/shiftStore';
import { useAuthStore } from '../store/authStore';
import { formatRupiah, formatTime } from '../utils/format';
import { playNewOrderSound, playAlertSound } from '../utils/sound';
import { subscribeToTransactions, unsubscribeChannel, fetchTransactionsFromCloud } from '../lib/cloudSync';
import { isSupabaseConfigured } from '../lib/supabase';
import type { KitchenStatus } from '../types';
import { Clock, Flame, CheckCircle2, ArrowRight, AlertTriangle } from 'lucide-react';

const columns: { status: KitchenStatus; label: string; color: string; icon: any }[] = [
  { status: 'Waiting', label: 'Antrean Menunggu', color: 'border-amber-400 bg-amber-50', icon: Clock },
  { status: 'Processing', label: 'Sedang Diproses', color: 'border-blue-400 bg-blue-50', icon: Flame },
  { status: 'Done', label: 'Selesai', color: 'border-green-400 bg-green-50', icon: CheckCircle2 },
];

const ALERT_THRESHOLD_MS = 5 * 60 * 1000; // 5 menit

export default function Kitchen() {
  const { transactions, updateKitchenStatus, lastKdsClearTime, loadFromCloud } = useTransactionStore();
  const { shifts } = useShiftStore();
  const { currentUser } = useAuthStore();
  const [now, setNow] = useState(Date.now());
  const prevWaitingCount = useRef(0);

  // Fetch transactions from cloud on mount + subscribe to real-time updates
  useEffect(() => {
    if (!isSupabaseConfigured) return;

    // Initial fetch from cloud
    const fetchData = async () => {
      const cloudTx = await fetchTransactionsFromCloud();
      if (cloudTx && cloudTx.length > 0) {
        loadFromCloud(cloudTx);
      }
    };
    fetchData();

    // Subscribe to real-time changes
    const channel = subscribeToTransactions((payload: any) => {
      // Re-fetch all transactions when any change happens
      fetchTransactionsFromCloud().then((cloudTx) => {
        if (cloudTx) loadFromCloud(cloudTx, true); // fullSync: cloud is authoritative
      });
    });

    return () => { if (channel) unsubscribeChannel(channel); };
  }, []);

  // Update time every 10 seconds for alert calculation
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 10000);
    return () => clearInterval(interval);
  }, []);

  // Filter active orders — only show TODAY's transactions
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const activeOrders = transactions.filter((t) => {
    if (t.txStatus !== 'Selesai') return false;
    // Only show today's orders
    if (new Date(t.date) < today) return false;
    // Hide Done orders that were cleared
    if (t.kitchenStatus === 'Done' && lastKdsClearTime && new Date(t.date) < new Date(lastKdsClearTime)) {
      return false;
    }
    return true;
  });

  const waitingOrders = activeOrders.filter((t) => t.kitchenStatus === 'Waiting');

  const getWaitingMinutes = (dateStr: string): number => {
    return Math.floor((now - new Date(dateStr).getTime()) / 60000);
  };

  const isOverdue = (dateStr: string): boolean => {
    return (now - new Date(dateStr).getTime()) >= ALERT_THRESHOLD_MS;
  };

  // Count overdue orders
  const overdueCount = activeOrders.filter(
    (t) => t.kitchenStatus === 'Waiting' && isOverdue(t.date)
  ).length;

  // Sound: chime when new order arrives
  useEffect(() => {
    if (waitingOrders.length > prevWaitingCount.current) {
      playNewOrderSound();
    }
    prevWaitingCount.current = waitingOrders.length;
  }, [waitingOrders.length]);

  // Sound: alarm for overdue orders
  useEffect(() => {
    if (overdueCount > 0) {
      playAlertSound();
    }
  }, [overdueCount]);

  // Re-trigger alarm periodically if overdue persists
  useEffect(() => {
    if (overdueCount === 0) return;
    const interval = setInterval(() => {
      if (overdueCount > 0) playAlertSound();
    }, 30000);
    return () => clearInterval(interval);
  }, [overdueCount]);

  const getNextStatus = (current: KitchenStatus): KitchenStatus | null => {
    if (current === 'Waiting') return 'Processing';
    if (current === 'Processing') return 'Done';
    return null;
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">🍳 Kitchen Display System</h1>
        {overdueCount > 0 && (
          <div className="flex items-center gap-2 px-4 py-2 bg-red-100 border border-red-300 rounded-xl animate-pulse">
            <AlertTriangle size={18} className="text-red-600" />
            <span className="text-sm font-bold text-red-700">
              {overdueCount} pesanan menunggu &gt; 5 menit!
            </span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1 min-h-0">
        {columns.map(({ status, label, color, icon: Icon }) => {
          const orders = activeOrders
            .filter((t) => t.kitchenStatus === status)
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()); // oldest first
          return (
            <div key={status} className={`rounded-2xl border-2 ${color} flex flex-col min-h-0`}>
              <div className="p-4 flex items-center gap-2">
                <Icon size={20} />
                <h2 className="font-bold text-lg">{label}</h2>
                <span className="badge bg-white/80 text-slate-700 ml-auto">{orders.length}</span>
              </div>

              <div className="flex-1 overflow-y-auto p-3 space-y-3">
                {orders.map((order) => {
                  const overdue = status === 'Waiting' && isOverdue(order.date);
                  const waitMins = getWaitingMinutes(order.date);

                  return (
                    <div
                      key={order.id}
                      className={`rounded-xl p-4 shadow-sm transition-all ${
                        overdue
                          ? 'bg-red-50 border-2 border-red-300 animate-pulse'
                          : 'bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl font-extrabold text-brand-700">
                            #{order.queueNumber}
                          </span>
                          {overdue && (
                            <span className="badge bg-red-100 text-red-700 text-xs">
                              <AlertTriangle size={10} /> {waitMins} mnt
                            </span>
                          )}
                          {status === 'Waiting' && !overdue && (
                            <span className="text-xs text-slate-400">{waitMins} mnt</span>
                          )}
                        </div>
                        {getNextStatus(status) && (
                          <button
                            onClick={() =>
                              updateKitchenStatus(order.id, getNextStatus(status)!)
                            }
                            className={`btn-primary text-xs py-1.5 px-3 ${
                              overdue ? 'animate-bounce' : ''
                            }`}
                          >
                            <ArrowRight size={14} />
                            {status === 'Waiting' ? 'Proses' : 'Selesai'}
                          </button>
                        )}
                      </div>

                      {/* Shift/Cashier info */}
                      <p className="text-xs text-slate-400 mb-2">
                        {formatTime(order.date)} • {order.cashierName}
                      </p>

                      <div className="space-y-2">
                        {order.items.map((item) => (
                          <div key={item.lineId} className="border-l-4 border-brand-300 pl-3">
                            <p className="font-bold text-base">{item.name}</p>
                            <p className="text-sm text-slate-600 font-semibold">
                              {item.temperature} • Gula {item.sugar} • x{item.quantity}
                            </p>
                            {item.addons.length > 0 && (
                              <p className="text-xs text-slate-500">
                                + {item.addons.map((a) => a.name).join(', ')}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
                {orders.length === 0 && (
                  <div className="text-center py-8 text-slate-400 text-sm">
                    Tidak ada pesanan
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
