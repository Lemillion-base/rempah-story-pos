import { useMemo, useState } from 'react';
import { useTransactionStore } from '../store/transactionStore';
import { useInventoryStore } from '../store/inventoryStore';
import { useMenuStore } from '../store/menuStore';
import { formatRupiah } from '../utils/format';
import { isSameDay } from '../utils/format';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import {
  TrendingUp,
  ShoppingCart,
  Award,
  AlertTriangle,
  DollarSign,
  Package,
} from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

type Period = 'daily' | 'weekly' | 'monthly' | 'yearly';

export default function Dashboard() {
  const { transactions } = useTransactionStore();
  const { items: inventory } = useInventoryStore();
  const { menus } = useMenuStore();
  const [period, setPeriod] = useState<Period>('daily');

  const today = new Date();
  const todayTx = transactions.filter(
    (t) => isSameDay(new Date(t.date), today) && t.txStatus === 'Selesai'
  );

  const todayRevenue = todayTx.reduce((a, t) => a + t.totalAmount, 0);
  const todayHPP = todayTx.reduce((a, t) => a + t.hpp, 0);
  const todayCount = todayTx.length;

  // Best seller
  const menuSales = useMemo(() => {
    const map: Record<string, { name: string; qty: number }> = {};
    todayTx.forEach((t) =>
      t.items.forEach((i) => {
        if (!map[i.menuId]) map[i.menuId] = { name: i.name, qty: 0 };
        map[i.menuId].qty += i.quantity;
      })
    );
    return Object.values(map).sort((a, b) => b.qty - a.qty);
  }, [todayTx]);

  const bestSeller = menuSales[0]?.name || '-';

  // Low stock
  const lowStock = inventory.filter((i) => i.stock < (i.minStock ?? 3));

  // Payment distribution
  const paymentDist = useMemo(() => {
    const map = { Cash: 0, QRIS: 0, Transfer: 0 };
    todayTx.forEach((t) => { map[t.paymentMethod]++; });
    return map;
  }, [todayTx]);

  // Revenue chart data
  const chartData = useMemo(() => {
    const labels: string[] = [];
    const data: number[] = [];

    if (period === 'daily') {
      for (let h = 8; h <= 22; h++) {
        labels.push(`${h}:00`);
        const rev = transactions
          .filter((t) => {
            const d = new Date(t.date);
            return isSameDay(d, today) && d.getHours() === h && t.txStatus === 'Selesai';
          })
          .reduce((a, t) => a + t.totalAmount, 0);
        data.push(rev);
      }
    } else if (period === 'weekly') {
      const days = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        labels.push(days[d.getDay() === 0 ? 6 : d.getDay() - 1]);
        const rev = transactions
          .filter((t) => isSameDay(new Date(t.date), d) && t.txStatus === 'Selesai')
          .reduce((a, t) => a + t.totalAmount, 0);
        data.push(rev);
      }
    } else if (period === 'monthly') {
      for (let i = 29; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        labels.push(`${d.getDate()}`);
        const rev = transactions
          .filter((t) => isSameDay(new Date(t.date), d) && t.txStatus === 'Selesai')
          .reduce((a, t) => a + t.totalAmount, 0);
        data.push(rev);
      }
    } else {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
      for (let m = 0; m < 12; m++) {
        labels.push(months[m]);
        const rev = transactions
          .filter((t) => {
            const d = new Date(t.date);
            return d.getFullYear() === today.getFullYear() && d.getMonth() === m && t.txStatus === 'Selesai';
          })
          .reduce((a, t) => a + t.totalAmount, 0);
        data.push(rev);
      }
    }

    return {
      labels,
      datasets: [
        {
          label: 'Omset',
          data,
          backgroundColor: 'rgba(184, 95, 33, 0.7)',
          borderRadius: 8,
        },
      ],
    };
  }, [transactions, period]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">📊 Dashboard</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-5">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-green-100 flex items-center justify-center">
              <TrendingUp className="text-green-600" size={22} />
            </div>
            <div>
              <p className="text-xs text-slate-500">Pendapatan Hari Ini</p>
              <p className="text-xl font-bold text-green-700">{formatRupiah(todayRevenue)}</p>
            </div>
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-blue-100 flex items-center justify-center">
              <ShoppingCart className="text-blue-600" size={22} />
            </div>
            <div>
              <p className="text-xs text-slate-500">Jumlah Transaksi</p>
              <p className="text-xl font-bold">{todayCount}</p>
            </div>
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-amber-100 flex items-center justify-center">
              <Award className="text-amber-600" size={22} />
            </div>
            <div>
              <p className="text-xs text-slate-500">Menu Terlaris</p>
              <p className="text-lg font-bold truncate">{bestSeller}</p>
            </div>
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-purple-100 flex items-center justify-center">
              <DollarSign className="text-purple-600" size={22} />
            </div>
            <div>
              <p className="text-xs text-slate-500">Laba Kotor Hari Ini</p>
              <p className="text-xl font-bold text-purple-700">{formatRupiah(todayRevenue - todayHPP)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-lg">Grafik Omset</h2>
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as Period)}
            className="input w-auto text-sm"
          >
            <option value="daily">Harian</option>
            <option value="weekly">Mingguan</option>
            <option value="monthly">Bulanan</option>
            <option value="yearly">Tahunan</option>
          </select>
        </div>
        <div className="h-64">
          <Bar
            data={chartData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: { legend: { display: false } },
              scales: {
                y: { beginAtZero: true, ticks: { callback: (v) => formatRupiah(v as number) } },
              },
            }}
          />
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Payment Distribution */}
        <div className="card p-5">
          <h3 className="font-bold mb-3">Metode Pembayaran</h3>
          <div className="h-48">
            <Doughnut
              data={{
                labels: ['Cash', 'QRIS', 'Transfer'],
                datasets: [
                  {
                    data: [paymentDist.Cash, paymentDist.QRIS, paymentDist.Transfer],
                    backgroundColor: ['#22c55e', '#8b5cf6', '#3b82f6'],
                  },
                ],
              }}
              options={{ responsive: true, maintainAspectRatio: false }}
            />
          </div>
        </div>

        {/* Best Sellers */}
        <div className="card p-5 flex flex-col">
          <h3 className="font-bold mb-3">🏆 Top Menu</h3>
          <div className="space-y-2 overflow-y-auto max-h-48">
            {menuSales.slice(0, 10).map((m, i) => (
              <div key={m.name} className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-brand-100 text-brand-700 text-xs font-bold flex items-center justify-center flex-shrink-0">
                  {i + 1}
                </span>
                <span className="flex-1 text-sm truncate">{m.name}</span>
                <span className="text-sm font-semibold">{m.qty}x</span>
              </div>
            ))}
            {menuSales.length === 0 && (
              <p className="text-sm text-slate-400">Belum ada data</p>
            )}
          </div>
        </div>

        {/* Low Stock Alert */}
        <div className="card p-5 flex flex-col">
          <h3 className="font-bold mb-3 flex items-center gap-2">
            <AlertTriangle size={16} className="text-red-500" /> Stok Rendah
            {lowStock.length > 0 && <span className="badge bg-red-100 text-red-700 text-xs">{lowStock.length}</span>}
          </h3>
          <div className="space-y-2 overflow-y-auto max-h-48">
            {lowStock.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-2 bg-red-50 rounded-lg">
                <span className="text-sm font-medium">{item.name}</span>
                <span className="badge bg-red-100 text-red-700">
                  {item.stock} {item.unit}
                </span>
              </div>
            ))}
            {lowStock.length === 0 && (
              <p className="text-sm text-green-600">✓ Semua stok aman</p>
            )}
          </div>
        </div>
      </div>

      {/* P&L Summary */}
      <div className="card p-5">
        <h3 className="font-bold mb-3 flex items-center gap-2">
          <Package size={18} /> Laporan Keuangan Hari Ini (P&L Sederhana)
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 bg-green-50 rounded-xl">
            <p className="text-xs text-slate-500">Total Pendapatan</p>
            <p className="text-xl font-bold text-green-700">{formatRupiah(todayRevenue)}</p>
          </div>
          <div className="p-4 bg-red-50 rounded-xl">
            <p className="text-xs text-slate-500">HPP (Cost of Goods)</p>
            <p className="text-xl font-bold text-red-700">{formatRupiah(todayHPP)}</p>
          </div>
          <div className="p-4 bg-purple-50 rounded-xl">
            <p className="text-xs text-slate-500">Laba Kotor</p>
            <p className="text-xl font-bold text-purple-700">{formatRupiah(todayRevenue - todayHPP)}</p>
          </div>
        </div>
        <div className="mt-4 p-4 bg-blue-50 rounded-xl">
          <p className="text-xs text-slate-500">Expected Cash (Transaksi Cash Hari Ini)</p>
          <p className="text-xl font-bold text-blue-700">
            {formatRupiah(todayTx.filter((t) => t.paymentMethod === 'Cash').reduce((a, t) => a + t.totalAmount, 0))}
          </p>
        </div>
      </div>
    </div>
  );
}
