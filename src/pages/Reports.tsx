import { useState, useMemo } from 'react';
import { useTransactionStore } from '../store/transactionStore';
import { useInventoryStore } from '../store/inventoryStore';
import { useAuthStore } from '../store/authStore';
import { useMenuStore } from '../store/menuStore';
import { useShiftStore } from '../store/shiftStore';
import { useSettingsStore } from '../store/settingsStore';
import { formatRupiah, formatDate } from '../utils/format';
import { useStockOpnameStore } from '../store/stockOpnameStore';
import { exportPnlPDF, exportTransactionsPDF, exportInventoryPDF, exportShiftPDF, exportCashPDF } from '../utils/pdfExport';
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
import { Doughnut } from 'react-chartjs-2';
import {
  TrendingUp,
  TrendingDown,
  Package,
  Users,
  Calendar,
  AlertTriangle,
  DollarSign,
  FileText,
  Download,
  Wallet,
  ClipboardCheck,
} from 'lucide-react';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend, ArcElement);

type ReportTab = 'pnl' | 'transactions' | 'inventory' | 'shift' | 'cash' | 'opname';
type DateFilterType = 'today' | 'week' | 'month' | 'custom';

export default function Reports() {
  const [activeTab, setActiveTab] = useState<ReportTab>('pnl');
  const [dateFilterType, setDateFilterType] = useState<DateFilterType>('today');
  const [customDateFrom, setCustomDateFrom] = useState('');
  const [customDateTo, setCustomDateTo] = useState('');
  const [filterMonth, setFilterMonth] = useState('');

  const { transactions } = useTransactionStore();
  const { items: inventory } = useInventoryStore();
  const { users } = useAuthStore();
  const { menus } = useMenuStore();
  const { shifts } = useShiftStore();
  const { settings } = useSettingsStore();
  const { records: opnameRecords } = useStockOpnameStore();

  // Filter transactions by date
  const filteredTx = useMemo(() => {
    const now = new Date();
    return transactions.filter((t) => {
      if (t.txStatus !== 'Selesai') return false;
      const d = new Date(t.date);
      switch (dateFilterType) {
        case 'today':
          return d.toDateString() === now.toDateString();
        case 'week': {
          const weekAgo = new Date(now);
          weekAgo.setDate(weekAgo.getDate() - 7);
          return d >= weekAgo;
        }
        case 'month': {
          if (filterMonth) {
            const [y, m] = filterMonth.split('-').map(Number);
            return d.getFullYear() === y && d.getMonth() === m - 1;
          }
          return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        }
        case 'custom': {
          const from = customDateFrom ? new Date(customDateFrom) : new Date(0);
          const to = customDateTo ? new Date(customDateTo + 'T23:59:59') : new Date();
          return d >= from && d <= to;
        }
        default:
          return true;
      }
    });
  }, [transactions, dateFilterType, customDateFrom, customDateTo, filterMonth]);

  // Compute date range for reuse in other tabs (opname, etc.)
  const { dateFrom, dateTo } = useMemo(() => {
    const now = new Date();
    switch (dateFilterType) {
      case 'today': {
        const from = new Date(now); from.setHours(0, 0, 0, 0);
        const to = new Date(now); to.setHours(23, 59, 59, 999);
        return { dateFrom: from, dateTo: to };
      }
      case 'week': {
        const from = new Date(now); from.setDate(from.getDate() - 7);
        return { dateFrom: from, dateTo: now };
      }
      case 'month': {
        if (filterMonth) {
          const [y, m] = filterMonth.split('-').map(Number);
          const from = new Date(y, m - 1, 1);
          const to = new Date(y, m, 0, 23, 59, 59, 999);
          return { dateFrom: from, dateTo: to };
        }
        const from = new Date(now.getFullYear(), now.getMonth(), 1);
        const to = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        return { dateFrom: from, dateTo: to };
      }
      case 'custom': {
        const from = customDateFrom ? new Date(customDateFrom) : new Date(0);
        const to = customDateTo ? new Date(customDateTo + 'T23:59:59') : new Date();
        return { dateFrom: from, dateTo: to };
      }
      default:
        return { dateFrom: new Date(0), dateTo: new Date() };
    }
  }, [dateFilterType, customDateFrom, customDateTo, filterMonth]);

  // P&L calculations
  const totalGrossRevenue = filteredTx.reduce((a, t) => a + t.subtotal, 0);
  const totalRevenue = filteredTx.reduce((a, t) => a + t.totalAmount, 0);
  const totalHPP = filteredTx.reduce((a, t) => a + t.hpp, 0);
  const totalDiscount = filteredTx.reduce((a, t) => a + t.discount, 0);
  const totalTax = filteredTx.reduce((a, t) => a + (t.tax || 0), 0); // GAP-3 fix
  const netRevenue = totalGrossRevenue - totalDiscount;
  const grossProfit = netRevenue - totalHPP;
  const profitMargin = netRevenue > 0 ? (grossProfit / netRevenue) * 100 : 0;
  const avgTransaction = filteredTx.length > 0 ? totalRevenue / filteredTx.length : 0;

  // Payment breakdown
  const paymentBreakdown = useMemo(() => {
    const map = { Cash: 0, QRIS: 0, Transfer: 0 };
    filteredTx.forEach((t) => { map[t.paymentMethod] += t.totalAmount; });
    return map;
  }, [filteredTx]);

  // Order Type breakdown (Dine In vs Take Away)
  const orderTypeBreakdown = useMemo(() => {
    const map = { 'Dine In': 0, 'Take Away': 0 };
    filteredTx.forEach((t) => {
      const type = t.orderType || 'Dine In';
      if (type === 'Dine In' || type === 'Take Away') {
        map[type] = (map[type] || 0) + 1;
      }
    });
    return map;
  }, [filteredTx]);

  // Category sales
  const categorySales = useMemo(() => {
    const map: Record<string, { revenue: number; qty: number }> = {};
    filteredTx.forEach((t) =>
      t.items.forEach((item) => {
        const menu = menus.find((m) => m.id === item.menuId);
        const cat = menu?.category || 'Lainnya';
        if (!map[cat]) map[cat] = { revenue: 0, qty: 0 };
        map[cat].revenue += item.subtotal;
        map[cat].qty += item.quantity;
      })
    );
    return Object.entries(map).sort((a, b) => b[1].revenue - a[1].revenue);
  }, [filteredTx, menus]);

  // Shift/employee report
  const shiftReport = useMemo(() => {
    const map: Record<string, { name: string; txCount: number; revenue: number; firstTx: string; lastTx: string }> = {};
    filteredTx.forEach((t) => {
      if (!map[t.cashierId]) {
        map[t.cashierId] = { name: t.cashierName, txCount: 0, revenue: 0, firstTx: t.date, lastTx: t.date };
      }
      map[t.cashierId].txCount++;
      map[t.cashierId].revenue += t.totalAmount;
      if (t.date < map[t.cashierId].firstTx) map[t.cashierId].firstTx = t.date;
      if (t.date > map[t.cashierId].lastTx) map[t.cashierId].lastTx = t.date;
    });
    return Object.values(map).sort((a, b) => b.revenue - a.revenue);
  }, [filteredTx]);

  // Inventory
  const totalInventoryValue = inventory.reduce((a, i) => a + i.stock * i.costPerUnit, 0);
  const lowStockItems = inventory.filter((i) => i.stock < (i.minStock ?? 3));

  // Export functions
  const exportPnlExcel = () => {
    const rows = [
      ['LAPORAN LABA RUGI'],
      ['Periode', getDateLabel()],
      [''],
      ['Keterangan', 'Jumlah (Rp)'],
      ['Total Pendapatan (Gross)', totalGrossRevenue],
      ['Diskon yang Diberikan', -totalDiscount],
      ['Pendapatan Bersih (Net)', netRevenue],
      ['Pajak Terkumpul', totalTax],
      ['Harga Pokok Penjualan (HPP)', -totalHPP],
      ['Laba Kotor', grossProfit],
      [''],
      ['Jumlah Transaksi', filteredTx.length],
      ['Rata-rata per Transaksi', Math.round(avgTransaction)],
      ['Margin (%)', profitMargin.toFixed(1) + '%'],
      [''],
      ['DISTRIBUSI PEMBAYARAN'],
      ['Cash', paymentBreakdown.Cash],
      ['QRIS', paymentBreakdown.QRIS],
      ['Transfer', paymentBreakdown.Transfer],
      [''],
      ['TIPE PESANAN'],
      ['Dine In', orderTypeBreakdown['Dine In']],
      ['Take Away', orderTypeBreakdown['Take Away']],
      [''],
      ['PENJUALAN PER KATEGORI'],
      ['Kategori', 'Revenue', 'Qty'],
      ...categorySales.map(([cat, data]) => [cat, data.revenue, data.qty]),
    ];
    downloadCSV(rows, 'laporan-laba-rugi.csv');
  };

  const exportInventoryExcel = () => {
    const rows = [
      ['LAPORAN STOK BAHAN BAKU'],
      ['Tanggal Export', new Date().toLocaleDateString('id-ID')],
      [''],
      ['ID', 'Nama', 'Stok', 'Unit', 'Harga/Unit', 'Nilai', 'Min. Stok', 'Status'],
      ...inventory.map((i) => [
        i.id,
        i.name,
        i.stock,
        i.unit,
        i.costPerUnit,
        i.stock * i.costPerUnit,
        i.minStock ?? 3,
        i.stock < (i.minStock ?? 3) ? 'RENDAH' : 'Aman',
      ]),
      [''],
      ['Total Nilai Inventaris', '', '', '', '', totalInventoryValue],
      ['Item Stok Rendah', '', '', '', '', lowStockItems.length],
    ];
    downloadCSV(rows, 'laporan-stok-bahan.csv');
  };

  const exportShiftExcel = () => {
    const rows = [
      ['LAPORAN SHIFT KARYAWAN'],
      ['Periode', getDateLabel()],
      [''],
      ['Nama', 'Jumlah Transaksi', 'Total Revenue', 'Rata-rata/Transaksi', 'Shift Mulai', 'Shift Akhir'],
      ...shiftReport.map((emp) => [
        emp.name,
        emp.txCount,
        emp.revenue,
        emp.txCount > 0 ? Math.round(emp.revenue / emp.txCount) : 0,
        formatDate(emp.firstTx),
        formatDate(emp.lastTx),
      ]),
    ];
    downloadCSV(rows, 'laporan-shift-karyawan.csv');
  };

  const exportCashExcel = () => {
    const rows = [
      ['LAPORAN KAS KASIR'],
      [''],
      ['Kasir', 'Tanggal Buka', 'Tanggal Tutup', 'Modal Awal', 'Expected Cash', 'Kas Aktual', 'Selisih', 'Total Penjualan', 'Jml Transaksi'],
      ...shifts.map((s) => [
        s.userName,
        formatDate(s.openedAt),
        s.closedAt ? formatDate(s.closedAt) : '-',
        s.openingCash,
        s.expectedCash ?? 0,
        s.closingCash ?? 0,
        s.cashDifference ?? 0,
        s.totalSales,
        s.totalTransactions,
      ]),
    ];
    downloadCSV(rows, 'laporan-kas-kasir.csv');
  };

  const exportTransactionsExcel = () => {
    const rows = [
      ['LAPORAN TRANSAKSI'],
      ['Periode', getDateLabel()],
      [''],
      ['No. Antrean', 'Tanggal', 'Kasir', 'Pelanggan', 'Items', 'Subtotal', 'Diskon', 'Pajak', 'Total', 'Metode', 'Status'],
      ...filteredTx.map((t) => [
        `#${t.queueNumber}`,
        formatDate(t.date),
        t.cashierName,
        t.customerName || '-',
        t.items.map((i) => `${i.name} x${i.quantity}`).join('; '),
        t.subtotal,
        t.discount,
        t.tax || 0,
        t.totalAmount,
        t.paymentMethod,
        t.txStatus,
      ]),
    ];
    downloadCSV(rows, 'laporan-transaksi.csv');
  };

  const downloadCSV = (rows: any[][], filename: string) => {
    const csv = rows.map((row) =>
      row.map((cell) => {
        const str = String(cell ?? '');
        return str.includes(',') || str.includes('"') ? `"${str.replace(/"/g, '""')}"` : str;
      }).join(',')
    ).join('\n');
    // Add BOM for Excel compatibility
    const bom = '\uFEFF';
    const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
  };

  const getDateLabel = () => {
    switch (dateFilterType) {
      case 'today': return 'Hari Ini (' + new Date().toLocaleDateString('id-ID') + ')';
      case 'week': return '7 Hari Terakhir';
      case 'month': return filterMonth || 'Bulan Ini';
      case 'custom': return `${customDateFrom || '...'} s/d ${customDateTo || '...'}`;
      default: return '';
    }
  };

  const tabs = [
    { id: 'pnl' as ReportTab, label: 'Laba Rugi', icon: DollarSign },
    { id: 'transactions' as ReportTab, label: 'Transaksi', icon: FileText },
    { id: 'cash' as ReportTab, label: 'Kas Kasir', icon: Wallet },
    { id: 'inventory' as ReportTab, label: 'Stok Bahan', icon: Package },
    { id: 'shift' as ReportTab, label: 'Shift', icon: Users },
    { id: 'opname' as ReportTab, label: 'Stock Opname', icon: ClipboardCheck },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">📊 Laporan</h1>
        <div className="flex items-center gap-2">
          {activeTab === 'pnl' && (
            <button onClick={exportPnlExcel} className="btn-secondary text-sm">
              <Download size={14} /> CSV
            </button>
          )}
          {activeTab === 'pnl' && (
            <button onClick={() => exportPnlPDF({ storeName: settings.storeName, period: getDateLabel(), totalRevenue: totalGrossRevenue, totalHPP, totalDiscount, totalTax, netRevenue, grossProfit, profitMargin, txCount: filteredTx.length, avgTransaction, paymentBreakdown, orderTypeBreakdown, categorySales })} className="btn-primary text-sm">
              <FileText size={14} /> PDF
            </button>
          )}
          {activeTab === 'inventory' && (
            <button onClick={exportInventoryExcel} className="btn-secondary text-sm">
              <Download size={14} /> CSV
            </button>
          )}
          {activeTab === 'inventory' && (
            <button onClick={() => exportInventoryPDF({ storeName: settings.storeName, items: inventory.map((i) => ({ name: i.name, stock: String(i.stock), unit: i.unit, minStock: String(i.minStock ?? 3), cost: formatRupiah(i.costPerUnit), value: formatRupiah(i.stock * i.costPerUnit), status: i.stock < (i.minStock ?? 3) ? 'RENDAH' : 'Aman' })), totalValue: totalInventoryValue, lowStockCount: lowStockItems.length })} className="btn-primary text-sm">
              <FileText size={14} /> PDF
            </button>
          )}
          {activeTab === 'shift' && (
            <button onClick={exportShiftExcel} className="btn-secondary text-sm">
              <Download size={14} /> CSV
            </button>
          )}
          {activeTab === 'shift' && (
            <button onClick={() => exportShiftPDF({ storeName: settings.storeName, period: getDateLabel(), shifts: shiftReport.map((e) => ({ name: e.name, txCount: String(e.txCount), revenue: formatRupiah(e.revenue), avg: formatRupiah(e.txCount > 0 ? e.revenue / e.txCount : 0), from: formatDate(e.firstTx), to: formatDate(e.lastTx) })) })} className="btn-primary text-sm">
              <FileText size={14} /> PDF
            </button>
          )}
          {activeTab === 'cash' && (
            <button onClick={exportCashExcel} className="btn-secondary text-sm">
              <Download size={14} /> CSV
            </button>
          )}
          {activeTab === 'cash' && (
            <button onClick={() => exportCashPDF({ storeName: settings.storeName, shifts: shifts.map((s) => ({ cashier: s.userName, open: formatDate(s.openedAt), close: s.closedAt ? formatDate(s.closedAt) : '-', opening: formatRupiah(s.openingCash), expected: formatRupiah(s.expectedCash || 0), actual: formatRupiah(s.closingCash || 0), diff: formatRupiah(s.cashDifference || 0), sales: formatRupiah(s.totalSales), tx: String(s.totalTransactions) })) })} className="btn-primary text-sm">
              <FileText size={14} /> PDF
            </button>
          )}
          {activeTab === 'transactions' && (
            <button onClick={exportTransactionsExcel} className="btn-secondary text-sm">
              <Download size={14} /> CSV
            </button>
          )}
          {activeTab === 'transactions' && (
            <button onClick={() => exportTransactionsPDF({ storeName: settings.storeName, period: getDateLabel(), transactions: filteredTx.map((t) => ({ queue: `#${t.queueNumber}`, date: formatDate(t.date), cashier: t.cashierName, customer: t.customerName || '-', items: t.items.map((i) => `${i.name} x${i.quantity}`).join(', '), tax: formatRupiah(t.tax || 0), total: formatRupiah(t.totalAmount), method: t.paymentMethod, status: t.txStatus })), totalRevenue, txCount: filteredTx.length })} className="btn-primary text-sm">
              <FileText size={14} /> PDF
            </button>
          )}
        </div>
      </div>

      {/* Date Filter */}
      <div className="card p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-slate-400" />
            <span className="text-sm font-medium text-slate-600">Filter:</span>
          </div>
          <div className="flex gap-2 flex-wrap">
            {([
              { value: 'today', label: 'Hari Ini' },
              { value: 'week', label: '7 Hari' },
              { value: 'month', label: 'Bulan' },
              { value: 'custom', label: 'Tanggal' },
            ] as { value: DateFilterType; label: string }[]).map((opt) => (
              <button
                key={opt.value}
                onClick={() => setDateFilterType(opt.value)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                  dateFilterType === opt.value
                    ? 'bg-brand-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Month picker */}
          {dateFilterType === 'month' && (
            <input
              type="month"
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
              className="input w-auto text-sm"
            />
          )}

          {/* Custom date range */}
          {dateFilterType === 'custom' && (
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={customDateFrom}
                onChange={(e) => setCustomDateFrom(e.target.value)}
                className="input w-auto text-sm"
              />
              <span className="text-sm text-slate-400">s/d</span>
              <input
                type="date"
                value={customDateTo}
                onChange={(e) => setCustomDateTo(e.target.value)}
                className="input w-auto text-sm"
              />
            </div>
          )}
        </div>
        <p className="text-xs text-slate-400 mt-2">
          Menampilkan {filteredTx.length} transaksi • {getDateLabel()}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium transition ${
              activeTab === tab.id
                ? 'bg-white shadow-sm text-brand-700'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* P&L Tab */}
      {activeTab === 'pnl' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="card p-5">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-green-100 flex items-center justify-center">
                  <TrendingUp className="text-green-600" size={22} />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Total Pendapatan</p>
                  <p className="text-xl font-bold text-green-700">{formatRupiah(totalRevenue)}</p>
                </div>
              </div>
            </div>
            <div className="card p-5">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-red-100 flex items-center justify-center">
                  <TrendingDown className="text-red-600" size={22} />
                </div>
                <div>
                  <p className="text-xs text-slate-500">HPP (COGS)</p>
                  <p className="text-xl font-bold text-red-700">{formatRupiah(totalHPP)}</p>
                </div>
              </div>
            </div>
            <div className="card p-5">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center">
                  <DollarSign className="text-purple-600" size={22} />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Laba Kotor</p>
                  <p className="text-xl font-bold text-purple-700 dark:text-purple-400">{formatRupiah(grossProfit)}</p>
                </div>
              </div>
            </div>
            <div className="card p-5">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-blue-100 flex items-center justify-center">
                  <FileText className="text-blue-600" size={22} />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Margin</p>
                  <p className="text-xl font-bold text-blue-700">{profitMargin.toFixed(1)}%</p>
                </div>
              </div>
            </div>
          </div>

          {/* Detail P&L */}
          <div className="card p-5">
            <h3 className="font-bold text-lg mb-4">Laporan Laba Rugi</h3>
            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-700">
                <span className="text-slate-600 dark:text-slate-400">Total Pendapatan Kotor (Revenue Gross)</span>
                <span className="font-bold text-slate-750 dark:text-slate-300">{formatRupiah(totalGrossRevenue)}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-700 pl-4">
                <span className="text-slate-500 dark:text-slate-400">- Diskon yang diberikan</span>
                <span className="text-red-500">({formatRupiah(totalDiscount)})</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-700">
                <span className="text-slate-600 dark:text-slate-400 font-semibold">Pendapatan Bersih (Net Sales)</span>
                <span className="font-bold text-green-700 dark:text-green-400">{formatRupiah(netRevenue)}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-700 pl-4">
                <span className="text-slate-500 dark:text-slate-400">+ Pajak Terkumpul (Tax)</span>
                <span className="text-green-600">+{formatRupiah(totalTax)}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-700 pl-4">
                <span className="text-slate-500 dark:text-slate-400">- Harga Pokok Penjualan (HPP)</span>
                <span className="text-red-500">({formatRupiah(totalHPP)})</span>
              </div>
              <div className="flex justify-between py-3 bg-purple-50 dark:bg-purple-950/30 rounded-xl px-4 font-bold">
                <span>Laba Kotor</span>
                <span className="text-purple-700 dark:text-purple-400">{formatRupiah(grossProfit)}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-700">
                <span className="text-slate-600 dark:text-slate-400">Jumlah Transaksi</span>
                <span className="font-medium">{filteredTx.length}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-700">
                <span className="text-slate-600 dark:text-slate-400">Rata-rata per Transaksi</span>
                <span className="font-medium">{formatRupiah(avgTransaction)}</span>
              </div>
            </div>
          </div>

          {/* Payment, Order Type & Category */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="card p-5">
              <h3 className="font-bold mb-3">Distribusi Pembayaran</h3>
              <div className="h-48">
                <Doughnut
                  data={{
                    labels: ['Cash', 'QRIS', 'Transfer'],
                    datasets: [{
                      data: [paymentBreakdown.Cash, paymentBreakdown.QRIS, paymentBreakdown.Transfer],
                      backgroundColor: ['#22c55e', '#8b5cf6', '#3b82f6'],
                    }],
                  }}
                  options={{ responsive: true, maintainAspectRatio: false }}
                />
              </div>
              <div className="mt-3 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-green-500" /> Cash</span>
                  <span className="font-medium">{formatRupiah(paymentBreakdown.Cash)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-purple-500" /> QRIS</span>
                  <span className="font-medium">{formatRupiah(paymentBreakdown.QRIS)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-blue-500" /> Transfer</span>
                  <span className="font-medium">{formatRupiah(paymentBreakdown.Transfer)}</span>
                </div>
              </div>
            </div>

            <div className="card p-5">
              <h3 className="font-bold mb-3">Tipe Pesanan</h3>
              <div className="h-48">
                <Doughnut
                  data={{
                    labels: ['Dine In', 'Take Away'],
                    datasets: [{
                      data: [orderTypeBreakdown['Dine In'], orderTypeBreakdown['Take Away']],
                      backgroundColor: ['#06b6d4', '#f97316'],
                    }],
                  }}
                  options={{ responsive: true, maintainAspectRatio: false }}
                />
              </div>
              <div className="mt-3 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-cyan-500" /> Dine In</span>
                  <span className="font-medium">{orderTypeBreakdown['Dine In']} Pesanan</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-orange-500" /> Take Away</span>
                  <span className="font-medium">{orderTypeBreakdown['Take Away']} Pesanan</span>
                </div>
              </div>
            </div>

            <div className="card p-5">
              <h3 className="font-bold mb-3">Penjualan per Kategori</h3>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {categorySales.map(([cat, data]) => (
                  <div key={cat} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">{cat}</p>
                      <p className="text-xs text-slate-400">{data.qty} item terjual</p>
                    </div>
                    <span className="font-bold text-sm text-brand-700">{formatRupiah(data.revenue)}</span>
                  </div>
                ))}
                {categorySales.length === 0 && (
                  <p className="text-sm text-slate-400 text-center py-4">Belum ada data</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Transactions Tab */}
      {activeTab === 'transactions' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="card p-5">
              <p className="text-xs text-slate-500">Total Transaksi</p>
              <p className="text-2xl font-bold">{filteredTx.length}</p>
            </div>
            <div className="card p-5">
              <p className="text-xs text-slate-500">Total Pendapatan</p>
              <p className="text-2xl font-bold text-green-700">{formatRupiah(totalRevenue)}</p>
            </div>
            <div className="card p-5">
              <p className="text-xs text-slate-500">Rata-rata / Transaksi</p>
              <p className="text-2xl font-bold text-brand-700">{formatRupiah(avgTransaction)}</p>
            </div>
          </div>

          <div className="card overflow-hidden">
            <div className="p-4 border-b border-slate-100">
              <h3 className="font-bold">Riwayat Transaksi</h3>
            </div>
            {filteredTx.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                <p className="text-sm">Belum ada transaksi pada periode ini</p>
              </div>
            ) : (
              <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-100 dark:border-slate-700 sticky top-0">
                    <tr>
                      <th className="text-left p-3 font-semibold">No.</th>
                      <th className="text-left p-3 font-semibold">Tanggal</th>
                      <th className="text-left p-3 font-semibold">Kasir</th>
                      <th className="text-left p-3 font-semibold">Pelanggan</th>
                      <th className="text-left p-3 font-semibold">Items</th>
                      <th className="text-right p-3 font-semibold">Total</th>
                      <th className="text-center p-3 font-semibold">Metode</th>
                      <th className="text-center p-3 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTx.map((t) => (
                      <tr key={t.id} className="border-b border-slate-50 dark:border-slate-700/40 hover:bg-slate-50 dark:hover:bg-slate-700/30">
                        <td className="p-3 font-bold text-brand-700">#{t.queueNumber}</td>
                        <td className="p-3 text-xs text-slate-500">{formatDate(t.date)}</td>
                        <td className="p-3 text-sm">{t.cashierName}</td>
                        <td className="p-3 text-sm text-slate-500">{t.customerName || '-'}</td>
                        <td className="p-3 text-xs text-slate-600 max-w-[200px] truncate">
                          {t.items.map((i) => `${i.name} x${i.quantity}`).join(', ')}
                        </td>
                        <td className="p-3 text-right font-medium">{formatRupiah(t.totalAmount)}</td>
                        <td className="p-3 text-center">
                          <span className={`badge ${
                            t.paymentMethod === 'Cash' ? 'bg-green-100 text-green-700' :
                            t.paymentMethod === 'QRIS' ? 'bg-purple-100 text-purple-700' :
                            'bg-blue-100 text-blue-700'
                          }`}>
                            {t.paymentMethod}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <span className={`badge ${
                            t.txStatus === 'Selesai' ? 'bg-green-100 text-green-700' :
                            t.txStatus === 'Cancel' ? 'bg-red-100 text-red-700' :
                            'bg-purple-100 text-purple-700'
                          }`}>
                            {t.txStatus}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Inventory Tab */}
      {activeTab === 'inventory' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="card p-5">
              <p className="text-xs text-slate-500">Total Item</p>
              <p className="text-2xl font-bold">{inventory.length}</p>
            </div>
            <div className="card p-5">
              <p className="text-xs text-slate-500">Nilai Inventaris</p>
              <p className="text-2xl font-bold text-green-700">{formatRupiah(totalInventoryValue)}</p>
            </div>
            <div className="card p-5">
              <p className="text-xs text-slate-500 flex items-center gap-1">
                <AlertTriangle size={12} className="text-red-500" /> Stok Rendah
              </p>
              <p className="text-2xl font-bold text-red-600">{lowStockItems.length}</p>
            </div>
          </div>

          {lowStockItems.length > 0 && (
            <div className="card p-5">
              <h3 className="font-bold mb-3 flex items-center gap-2 text-red-600">
                <AlertTriangle size={18} /> Peringatan Stok Rendah
              </h3>
              <div className="space-y-2">
                {lowStockItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-950/30 rounded-xl border border-red-100 dark:border-red-900/40">
                    <div>
                      <p className="font-medium text-sm">{item.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Min. stok: {item.minStock ?? 3} {item.unit}</p>
                    </div>
                    <span className="badge bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 font-bold">
                      {item.stock} {item.unit}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="card overflow-hidden">
            <div className="p-4 border-b border-slate-100 dark:border-slate-700">
              <h3 className="font-bold">Daftar Stok Bahan Baku</h3>
            </div>
            <div className="overflow-x-auto max-h-96 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-100 dark:border-slate-700 sticky top-0">
                  <tr>
                    <th className="text-left p-3 font-semibold">Nama</th>
                    <th className="text-right p-3 font-semibold">Stok</th>
                    <th className="text-left p-3 font-semibold">Unit</th>
                    <th className="text-right p-3 font-semibold">Min. Stok</th>
                    <th className="text-right p-3 font-semibold">Harga/Unit</th>
                    <th className="text-right p-3 font-semibold">Nilai</th>
                    <th className="text-center p-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {inventory.map((item) => {
                    const isLow = item.stock < (item.minStock ?? 3);
                    return (
                      <tr key={item.id} className={`border-b border-slate-50 dark:border-slate-700/40 ${isLow ? 'bg-red-50/50 dark:bg-red-950/20' : ''}`}>
                        <td className="p-3 font-medium">{item.name}</td>
                        <td className="p-3 text-right font-medium">{item.stock}</td>
                        <td className="p-3 text-slate-500 dark:text-slate-400">{item.unit}</td>
                        <td className="p-3 text-right text-slate-500 dark:text-slate-400">{item.minStock ?? 3}</td>
                        <td className="p-3 text-right">{formatRupiah(item.costPerUnit)}</td>
                        <td className="p-3 text-right font-medium">{formatRupiah(item.stock * item.costPerUnit)}</td>
                        <td className="p-3 text-center">
                          {isLow ? (
                            <span className="badge bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300">Rendah</span>
                          ) : (
                            <span className="badge bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300">Aman</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Shift Tab */}
      {activeTab === 'shift' && (
        <div className="space-y-6">
          <div className="card p-5">
            <h3 className="font-bold text-lg mb-4">Laporan Shift Karyawan</h3>
            {shiftReport.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-8">Belum ada data transaksi pada periode ini</p>
            ) : (
              <div className="space-y-4">
                {shiftReport.map((emp) => (
                  <div key={emp.name} className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-brand-200 flex items-center justify-center text-brand-700 font-bold">
                          {emp.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold">{emp.name}</p>
                          <p className="text-xs text-slate-500">
                            {formatDate(emp.firstTx)} — {formatDate(emp.lastTx)}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      <div className="p-3 bg-white rounded-lg">
                        <p className="text-xs text-slate-500">Transaksi</p>
                        <p className="text-lg font-bold">{emp.txCount}</p>
                      </div>
                      <div className="p-3 bg-white rounded-lg">
                        <p className="text-xs text-slate-500">Total Revenue</p>
                        <p className="text-lg font-bold text-green-700">{formatRupiah(emp.revenue)}</p>
                      </div>
                      <div className="p-3 bg-white rounded-lg">
                        <p className="text-xs text-slate-500">Rata-rata/Transaksi</p>
                        <p className="text-lg font-bold text-brand-700">
                          {formatRupiah(emp.txCount > 0 ? emp.revenue / emp.txCount : 0)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Cash Tab */}
      {activeTab === 'cash' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="card p-5">
              <p className="text-xs text-slate-500">Total Shift Tercatat</p>
              <p className="text-2xl font-bold">{shifts.length}</p>
            </div>
            <div className="card p-5">
              <p className="text-xs text-slate-500">Total Selisih Kas</p>
              <p className={`text-2xl font-bold ${
                shifts.reduce((a, s) => a + (s.cashDifference || 0), 0) >= 0
                  ? 'text-green-700' : 'text-red-700'
              }`}>
                {formatRupiah(shifts.reduce((a, s) => a + (s.cashDifference || 0), 0))}
              </p>
            </div>
            <div className="card p-5">
              <p className="text-xs text-slate-500">Shift Bermasalah</p>
              <p className="text-2xl font-bold text-amber-600">
                {shifts.filter((s) => s.cashDifference && s.cashDifference !== 0).length}
              </p>
            </div>
          </div>

          <div className="card overflow-hidden">
            <div className="p-4 border-b border-slate-100">
              <h3 className="font-bold">Riwayat Kas Kasir</h3>
            </div>
            {shifts.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                <Wallet size={40} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm">Belum ada data shift</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-100 dark:border-slate-700">
                    <tr>
                      <th className="text-left p-3 font-semibold">Kasir</th>
                      <th className="text-left p-3 font-semibold">Waktu Buka</th>
                      <th className="text-left p-3 font-semibold">Waktu Tutup</th>
                      <th className="text-right p-3 font-semibold">Modal Awal</th>
                      <th className="text-right p-3 font-semibold">Expected</th>
                      <th className="text-right p-3 font-semibold">Aktual</th>
                      <th className="text-right p-3 font-semibold">Selisih</th>
                      <th className="text-right p-3 font-semibold">Penjualan</th>
                      <th className="text-center p-3 font-semibold">Tx</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shifts.map((s) => (
                      <tr key={s.id} className={`border-b border-slate-50 ${
                        s.cashDifference && s.cashDifference < 0 ? 'bg-red-50/50' : ''
                      }`}>
                        <td className="p-3 font-medium">{s.userName}</td>
                        <td className="p-3 text-slate-500 text-xs">{formatDate(s.openedAt)}</td>
                        <td className="p-3 text-slate-500 text-xs">{s.closedAt ? formatDate(s.closedAt) : '-'}</td>
                        <td className="p-3 text-right">{formatRupiah(s.openingCash)}</td>
                        <td className="p-3 text-right">{formatRupiah(s.expectedCash || 0)}</td>
                        <td className="p-3 text-right font-medium">{formatRupiah(s.closingCash || 0)}</td>
                        <td className="p-3 text-right">
                          <span className={`font-bold ${
                            (s.cashDifference || 0) === 0
                              ? 'text-green-600'
                              : (s.cashDifference || 0) > 0
                              ? 'text-blue-600'
                              : 'text-red-600'
                          }`}>
                            {(s.cashDifference || 0) === 0 ? 'Pas' : formatRupiah(s.cashDifference || 0)}
                          </span>
                        </td>
                        <td className="p-3 text-right font-medium text-green-700">{formatRupiah(s.totalSales)}</td>
                        <td className="p-3 text-center">{s.totalTransactions}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Stock Opname Tab */}
      {activeTab === 'opname' && (() => {
        const filteredOpnames = opnameRecords.filter((r) => {
          const d = new Date(r.date);
          return d >= dateFrom && d <= dateTo;
        });
        const totalOpnameLoss = filteredOpnames.reduce((a, r) => a + r.totalLossValue, 0);
        const totalOpnameItems = filteredOpnames.reduce((a, r) => a + r.totalItems, 0);
        const totalOpnameDiffs = filteredOpnames.reduce((a, r) => a + r.itemsWithDifference, 0);
        // Aggregate loss per reason
        const lossPerReason: Record<string, number> = {};
        filteredOpnames.forEach((r) => {
          r.items.filter((i) => i.difference !== 0).forEach((i) => {
            const key = i.reason || 'Tidak Diketahui';
            lossPerReason[key] = (lossPerReason[key] || 0) + i.lossValue;
          });
        });
        const sortedReasons = Object.entries(lossPerReason).sort((a, b) => b[1] - a[1]);

        return (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="card p-5">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <ClipboardCheck className="text-blue-600 dark:text-blue-400" size={22} />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Jumlah Opname</p>
                    <p className="text-xl font-bold">{filteredOpnames.length}</p>
                  </div>
                </div>
              </div>
              <div className="card p-5">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                    <Package className="text-amber-600 dark:text-amber-400" size={22} />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Total Item Diopname</p>
                    <p className="text-xl font-bold">{totalOpnameItems}</p>
                  </div>
                </div>
              </div>
              <div className="card p-5">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                    <AlertTriangle className="text-orange-600 dark:text-orange-400" size={22} />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Item Selisih</p>
                    <p className="text-xl font-bold text-amber-600">{totalOpnameDiffs}</p>
                  </div>
                </div>
              </div>
              <div className="card p-5">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                    <TrendingDown className="text-red-600 dark:text-red-400" size={22} />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Total Kerugian</p>
                    <p className={`text-xl font-bold ${totalOpnameLoss > 0 ? 'text-red-600' : 'text-green-600'}`}>{formatRupiah(totalOpnameLoss)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Loss per Reason */}
            {sortedReasons.length > 0 && (
              <div className="card p-5">
                <h3 className="font-semibold text-sm mb-3">Kerugian per Alasan</h3>
                <div className="space-y-2">
                  {sortedReasons.map(([reason, loss]) => (
                    <div key={reason} className="flex items-center justify-between text-sm">
                      <span className="text-slate-600 dark:text-slate-400">{reason}</span>
                      <span className="font-semibold text-red-600">{formatRupiah(loss)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Opname Records Table */}
            <div className="card overflow-hidden">
              <div className="p-4 border-b border-slate-100 dark:border-slate-700">
                <h3 className="font-semibold text-sm">Riwayat Stock Opname</h3>
              </div>
              {filteredOpnames.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-sm">Tidak ada data stock opname pada periode ini.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-100 dark:border-slate-700">
                      <tr>
                        <th className="text-left p-3 font-semibold">Tanggal</th>
                        <th className="text-left p-3 font-semibold">Petugas</th>
                        <th className="text-center p-3 font-semibold">Item</th>
                        <th className="text-center p-3 font-semibold">Selisih</th>
                        <th className="text-right p-3 font-semibold">Kerugian</th>
                        <th className="text-center p-3 font-semibold">PIN</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredOpnames.map((rec) => (
                        <tr key={rec.id} className={`border-b border-slate-50 dark:border-slate-700/40 ${rec.totalLossValue > 0 ? 'bg-red-50/30 dark:bg-red-950/10' : ''}`}>
                          <td className="p-3 text-xs">{formatDate(rec.date)}</td>
                          <td className="p-3 font-medium">{rec.staffName}</td>
                          <td className="p-3 text-center">{rec.totalItems}</td>
                          <td className="p-3 text-center">
                            <span className={`font-semibold ${rec.itemsWithDifference > 0 ? 'text-amber-600' : 'text-green-600'}`}>{rec.itemsWithDifference}</span>
                          </td>
                          <td className="p-3 text-right">
                            <span className={`font-bold ${rec.totalLossValue > 0 ? 'text-red-600' : 'text-green-600'}`}>{formatRupiah(rec.totalLossValue)}</span>
                          </td>
                          <td className="p-3 text-center text-xs">
                            {rec.pinVerified ? <span className="text-green-600 font-medium">✓</span> : <span className="text-slate-300">—</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        );
      })()}
    </div>
  );
}
