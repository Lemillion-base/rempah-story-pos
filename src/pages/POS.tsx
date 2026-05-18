import { useState, useMemo, useEffect } from 'react';
import { v4 as uuid } from 'uuid';
import { useMenuStore } from '../store/menuStore';
import { useCartStore } from '../store/cartStore';
import { useTransactionStore } from '../store/transactionStore';
import { useInventoryStore } from '../store/inventoryStore';
import { useAuthStore } from '../store/authStore';
import { useCustomerStore } from '../store/customerStore';
import { useSettingsStore } from '../store/settingsStore';
import { useToastStore } from '../store/toastStore';
import { usePromoStore } from '../store/promoStore';
import { useAuditLogStore } from '../store/auditLogStore';
import { formatRupiah } from '../utils/format';
import { calculateTransactionHPP } from '../utils/hpp';
import { printReceipt, buildReceiptFromTransaction } from '../utils/printer';
import { checkStockAvailability, type StockWarning } from '../utils/stockCheck';
import type { Menu, CartItem, Temperature, SugarLevel, AddOn, PaymentMethod } from '../types';
import Modal from '../components/Modal';
import {
  Search,
  Plus,
  Minus,
  Trash2,
  ShoppingBag,
  CreditCard,
  Banknote,
  QrCode,
  X,
  ChevronUp,
  ChevronDown,
  AlertTriangle,
} from 'lucide-react';

export default function POS() {
  const { menus } = useMenuStore();
  const { items: inventory } = useInventoryStore();
  const { deductStock } = useInventoryStore();
  const cart = useCartStore();
  const { addTransaction, getNextQueueNumber } = useTransactionStore();
  const { currentUser } = useAuthStore();
  const { customers, recordVisit } = useCustomerStore();
  const { settings } = useSettingsStore();
  const { addToast } = useToastStore();
  const { getActivePromos, getPromoByCode, incrementUsage, getCustomerDiscount } = usePromoStore();
  const { addLog } = useAuditLogStore();

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'F1') { e.preventDefault(); handleCheckout(); }
      if (e.key === 'Escape') { setShowCheckout(false); setSelectedMenu(null); setMobileCartOpen(false); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }); // eslint-disable-line react-hooks/exhaustive-deps — intentionally re-binds to capture latest handleCheckout

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('Semua');
  const [selectedMenu, setSelectedMenu] = useState<Menu | null>(null);
  const [showCheckout, setShowCheckout] = useState(false);

  // Mobile cart toggle
  const [mobileCartOpen, setMobileCartOpen] = useState(false);

  // Customer selection
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);

  // Customization state
  const [temp, setTemp] = useState<Temperature>('Dingin');
  const [sugar, setSugar] = useState<SugarLevel>('Normal');
  const [selectedAddons, setSelectedAddons] = useState<AddOn[]>([]);
  const [qty, setQty] = useState(1);

  // Checkout state
  const [payMethod, setPayMethod] = useState<PaymentMethod>('Cash');
  const [cashReceived, setCashReceived] = useState('');
  const [discountInput, setDiscountInput] = useState('');
  const [stockWarnings, setStockWarnings] = useState<StockWarning[]>([]);
  const [showStockWarning, setShowStockWarning] = useState(false);

  // Promo/Voucher state
  const [voucherCode, setVoucherCode] = useState('');
  const [appliedPromoId, setAppliedPromoId] = useState<string | null>(null);
  const [promoError, setPromoError] = useState('');

  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId);

  // Active promos for dropdown
  const activePromos = getActivePromos();

  // Calculate promo discount
  const calculatePromoDiscount = (promoId: string | null, subtotal: number): number => {
    if (!promoId) return 0;
    const promo = activePromos.find((p) => p.id === promoId);
    if (!promo) return 0;

    // Check min purchase
    if (promo.minPurchase && subtotal < promo.minPurchase) return 0;

    // Check loyalty requirement
    if (promo.scope === 'loyalty' && promo.loyaltyMinVisits) {
      if (!selectedCustomer || selectedCustomer.visitCount < promo.loyaltyMinVisits) return 0;
    }

    let discount = 0;
    if (promo.type === 'percentage') {
      discount = Math.round(subtotal * promo.value / 100);
      if (promo.maxDiscount && discount > promo.maxDiscount) discount = promo.maxDiscount;
    } else {
      discount = promo.value;
    }
    return discount;
  };

  const promoDiscount = useMemo(() => calculatePromoDiscount(appliedPromoId, cart.getSubtotal()), [appliedPromoId, cart.items]);

  const applyVoucherCode = () => {
    setPromoError('');
    if (!voucherCode.trim()) return;
    const promo = getPromoByCode(voucherCode.trim());
    if (!promo) {
      setPromoError('Kode voucher tidak valid atau sudah expired');
      return;
    }
    if (promo.minPurchase && cart.getSubtotal() < promo.minPurchase) {
      setPromoError(`Min. belanja ${formatRupiah(promo.minPurchase)}`);
      return;
    }
    setAppliedPromoId(promo.id);
    const disc = calculatePromoDiscount(promo.id, cart.getSubtotal());
    addToast(`Voucher "${promo.name}" diterapkan! -${formatRupiah(disc)}`, 'success');
  };

  const selectPromo = (promoId: string) => {
    if (promoId === '') {
      setAppliedPromoId(null);
      return;
    }
    setAppliedPromoId(promoId);
    setVoucherCode('');
    setPromoError('');
  };

  const clearPromo = () => {
    setAppliedPromoId(null);
    setVoucherCode('');
    setPromoError('');
  };

  // Loyalty discount (auto-applied if customer selected)
  const loyaltyDiscount = useMemo(() => {
    if (!selectedCustomer) return 0;
    const pct = getCustomerDiscount(selectedCustomer.visitCount);
    if (pct <= 0) return 0;
    return Math.round(cart.getSubtotal() * pct / 100);
  }, [selectedCustomer, cart.items]);

  const categories = useMemo(() => {
    const cats = ['Semua', 'Best Seller', ...new Set(menus.map((m) => m.category))];
    return [...new Set(cats)];
  }, [menus]);

  const filteredMenus = useMemo(() => {
    let list = menus.filter((m) => m.isAvailable !== false); // hide unavailable
    if (category === 'Best Seller') list = list.filter((m) => m.isBestSeller);
    else if (category !== 'Semua') list = list.filter((m) => m.category === category);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((m) => m.name.toLowerCase().includes(q));
    }
    return list;
  }, [menus, category, search]);

  const openCustomize = (menu: Menu) => {
    setSelectedMenu(menu);
    setTemp('Dingin');
    setSugar('Normal');
    setSelectedAddons([]);
    setQty(1);
  };

  const addToCart = () => {
    if (!selectedMenu) return;
    const addonTotal = selectedAddons.reduce((a, b) => a + b.price, 0);
    const unitPrice = selectedMenu.price + addonTotal;
    const item: CartItem = {
      lineId: uuid(),
      menuId: selectedMenu.id,
      name: selectedMenu.name,
      basePrice: selectedMenu.price,
      quantity: qty,
      temperature: temp,
      sugar,
      addons: selectedAddons,
      subtotal: unitPrice * qty,
    };
    cart.addItem(item);
    setSelectedMenu(null);
    addToast(`${selectedMenu.name} ditambahkan ke keranjang`, 'success');
  };

  const toggleAddon = (addon: AddOn) => {
    setSelectedAddons((prev) =>
      prev.find((a) => a.name === addon.name)
        ? prev.filter((a) => a.name !== addon.name)
        : [...prev, addon]
    );
  };

  const handleCheckout = () => {
    if (cart.items.length === 0) return;
    const manualDiscount = parseInt(discountInput) || 0;
    cart.setDiscount(manualDiscount + promoDiscount + loyaltyDiscount);

    // Validate stock availability
    const warnings = checkStockAvailability(cart.items, menus, inventory);
    if (warnings.length > 0) {
      setStockWarnings(warnings);
      setShowStockWarning(true);
      return;
    }

    setShowCheckout(true);
  };

  const proceedCheckoutAnyway = () => {
    setShowStockWarning(false);
    setStockWarnings([]);
    setShowCheckout(true);
  };

  const finalizeTransaction = () => {
    const manualDiscount = parseInt(discountInput) || 0;
    const totalDiscount = manualDiscount + promoDiscount + loyaltyDiscount;
    const subtotal = cart.getSubtotal();
    const total = Math.max(0, subtotal - totalDiscount);
    const cash = parseInt(cashReceived) || 0;

    // Safety guard: Cash payment must have sufficient funds
    if (payMethod === 'Cash' && cash < total) return;

    const queueNum = getNextQueueNumber();

    const hpp = calculateTransactionHPP(cart.items, menus, inventory);

    // Deduct inventory
    const deductions: Record<string, number> = {};
    for (const item of cart.items) {
      const menu = menus.find((m) => m.id === item.menuId);
      if (menu) {
        for (const [invId, amount] of Object.entries(menu.ingredients)) {
          deductions[invId] = (deductions[invId] || 0) + amount * item.quantity;
        }
      }
    }
    deductStock(deductions);

    const tx = {
      id: uuid(),
      queueNumber: queueNum,
      date: new Date().toISOString(),
      items: cart.items,
      subtotal,
      discount: totalDiscount,
      totalAmount: total,
      paymentMethod: payMethod,
      cashReceived: payMethod === 'Cash' ? cash : undefined,
      change: payMethod === 'Cash' ? Math.max(0, cash - total) : undefined,
      kitchenStatus: 'Waiting' as const,
      txStatus: 'Selesai' as const,
      cashierId: currentUser?.id || '',
      cashierName: currentUser?.name || '',
      customerId: selectedCustomerId || undefined,
      customerName: selectedCustomer?.name || undefined,
      hpp,
    };

    addTransaction(tx);

    // Audit log
    if (currentUser) {
      addLog(currentUser.id, currentUser.name, currentUser.role, 'create_transaction', `Transaksi #${queueNum} sebesar ${formatRupiah(total)}`, { transactionId: tx.id, queueNumber: queueNum, total });
    }
    if (settings.printerEnabled) {
      const receiptData = buildReceiptFromTransaction(tx, settings);
      printReceipt(receiptData, settings);
    }

    // Record customer visit
    if (selectedCustomerId) {
      recordVisit(selectedCustomerId, total);
    }

    // Increment promo usage
    if (appliedPromoId) {
      incrementUsage(appliedPromoId);
    }

    cart.clearCart();
    setShowCheckout(false);
    setDiscountInput('');
    setCashReceived('');
    setPayMethod('Cash');
    setSelectedCustomerId(null);
    clearPromo();
    addToast(`Pesanan #${queueNum} berhasil! 🎉`, 'success');
  };

  return (
    <div className="flex flex-col lg:flex-row gap-0 lg:gap-4 h-full -m-4 lg:-m-6">
      {/* Left: Product Catalog */}
      <div className="flex-1 flex flex-col p-4 lg:p-6 overflow-hidden">
        {/* Search & Filter */}
        <div className="mb-4 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari menu..."
              className="input pl-10"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition ${
                  category === cat
                    ? 'bg-brand-600 text-white'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Product Grid */}
        <div className="flex-1 overflow-y-auto pb-20 lg:pb-0">
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
            {filteredMenus.map((menu) => {
              const initials = menu.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
              return (
                <button
                  key={menu.id}
                  onClick={() => openCustomize(menu)}
                  className="card p-4 text-left hover:shadow-md hover:border-brand-200 transition group"
                >
                  <div className="w-full aspect-square rounded-xl bg-gradient-to-br from-brand-100 to-brand-200 mb-3 flex items-center justify-center overflow-hidden">
                    {menu.image ? (
                      <img src={menu.image} alt={menu.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-2xl font-bold text-brand-400">{initials}</span>
                    )}
                  </div>
                  {menu.isBestSeller && (
                    <span className="badge bg-amber-100 text-amber-700 mb-1">⭐ Best Seller</span>
                  )}
                  <h3 className="font-semibold text-sm leading-tight mb-1 group-hover:text-brand-700 transition">
                    {menu.name}
                  </h3>
                  <p className="text-brand-600 font-bold text-sm">{formatRupiah(menu.price)}</p>
                </button>
              );
            })}
          </div>
          {filteredMenus.length === 0 && (
            <div className="text-center py-12 text-slate-400">
              <p>Menu tidak ditemukan</p>
            </div>
          )}
        </div>
      </div>

      {/* Mobile: Floating Cart Bar (minimized) */}
      {cart.items.length > 0 && !mobileCartOpen && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-30 p-3 bg-white border-t border-slate-200 shadow-lg">
          <button
            onClick={() => setMobileCartOpen(true)}
            className="w-full flex items-center justify-between bg-brand-600 text-white rounded-xl px-4 py-3"
          >
            <div className="flex items-center gap-3">
              <ShoppingBag size={20} />
              <span className="font-semibold">{cart.items.length} item</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold">{formatRupiah(Math.max(0, cart.getSubtotal() - (parseInt(discountInput) || 0) - promoDiscount - loyaltyDiscount))}</span>
              <ChevronUp size={18} />
            </div>
          </button>
        </div>
      )}

      {/* Mobile: Expanded Cart (overlay) */}
      {mobileCartOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex flex-col">
          <div className="absolute inset-0 bg-black/30" onClick={() => setMobileCartOpen(false)} />
          <div className="relative mt-auto bg-white rounded-t-2xl max-h-[85vh] flex flex-col shadow-xl animate-in slide-in-from-bottom duration-200">
            {/* Cart Header */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="font-bold text-lg flex items-center gap-2">
                <ShoppingBag size={20} className="text-brand-600" />
                Keranjang
                <span className="badge bg-brand-100 text-brand-700">{cart.items.length}</span>
              </h2>
              <button onClick={() => setMobileCartOpen(false)} className="p-2 rounded-lg hover:bg-slate-100">
                <ChevronDown size={20} />
              </button>
            </div>

            {/* Customer Selection */}
            <div className="px-4 pt-3">
              <select
                value={selectedCustomerId || ''}
                onChange={(e) => setSelectedCustomerId(e.target.value || null)}
                className="input text-sm"
              >
                <option value="">-- Pelanggan (opsional) --</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}{c.phone ? ` (${c.phone})` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {cart.items.map((item) => (
                <div key={item.lineId} className="bg-slate-50 rounded-xl p-3">
                  <div className="flex justify-between items-start mb-1">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{item.name}</p>
                      <p className="text-xs text-slate-500">
                        {item.temperature} • Gula {item.sugar}
                        {item.addons.length > 0 && ` • +${item.addons.map((a) => a.name).join(', ')}`}
                      </p>
                    </div>
                    <button onClick={() => cart.removeItem(item.lineId)} className="p-1 text-red-400 hover:text-red-600">
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => { if (item.quantity <= 1) cart.removeItem(item.lineId); else cart.updateQuantity(item.lineId, item.quantity - 1); }}
                        className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center"
                      >
                        <Minus size={12} />
                      </button>
                      <span className="text-sm font-semibold w-5 text-center">{item.quantity}</span>
                      <button
                        onClick={() => cart.updateQuantity(item.lineId, item.quantity + 1)}
                        className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center"
                      >
                        <Plus size={12} />
                      </button>
                    </div>
                    <p className="font-semibold text-sm text-brand-700">{formatRupiah(item.subtotal)}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Cart Footer */}
            <div className="p-4 border-t border-slate-100 space-y-3">
              {/* Promo/Voucher */}
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={voucherCode}
                    onChange={(e) => { setVoucherCode(e.target.value.toUpperCase()); setPromoError(''); }}
                    onKeyDown={(e) => e.key === 'Enter' && applyVoucherCode()}
                    placeholder="Kode voucher"
                    className="input text-sm flex-1 font-mono"
                  />
                  <button onClick={applyVoucherCode} className="btn-secondary text-xs" disabled={!voucherCode}>OK</button>
                </div>
                {activePromos.length > 0 && !appliedPromoId && (
                  <select onChange={(e) => selectPromo(e.target.value)} className="input text-xs" value="">
                    <option value="">Pilih promo...</option>
                    {activePromos.map((p) => (
                      <option key={p.id} value={p.id}>{p.name} ({p.type === 'percentage' ? `${p.value}%` : formatRupiah(p.value)})</option>
                    ))}
                  </select>
                )}
                {appliedPromoId && (
                  <div className="flex items-center justify-between p-2 bg-green-50 rounded-lg text-xs">
                    <span className="text-green-700 font-medium">✓ {activePromos.find(p => p.id === appliedPromoId)?.name} (-{formatRupiah(promoDiscount)})</span>
                    <button onClick={clearPromo} className="text-red-500 hover:underline">Hapus</button>
                  </div>
                )}
                {promoError && <p className="text-xs text-red-500">{promoError}</p>}
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={discountInput}
                  onChange={(e) => setDiscountInput(e.target.value.replace(/\D/g, ''))}
                  placeholder="Diskon manual (Rp)"
                  className="input text-sm flex-1"
                />
              </div>
              <div className="flex justify-between font-bold text-lg">
                <span>Total</span>
                <span className="text-brand-700">
                  {formatRupiah(Math.max(0, cart.getSubtotal() - (parseInt(discountInput) || 0) - promoDiscount - loyaltyDiscount))}
                </span>
              </div>
              <button onClick={() => { setMobileCartOpen(false); handleCheckout(); }} className="btn-primary w-full text-base">
                <CreditCard size={18} /> Bayar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Desktop: Cart Sidebar */}
      <div className="hidden lg:flex w-96 bg-white border-l border-slate-100 flex-col">
        <div className="p-4 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-lg flex items-center gap-2">
              <ShoppingBag size={20} className="text-brand-600" />
              Keranjang
              {cart.items.length > 0 && (
                <span className="badge bg-brand-100 text-brand-700">{cart.items.length}</span>
              )}
            </h2>
          </div>

          {/* Customer Selection - Dropdown */}
          <div className="mt-3">
            <select
              value={selectedCustomerId || ''}
              onChange={(e) => setSelectedCustomerId(e.target.value || null)}
              className="input text-sm"
            >
              <option value="">-- Pelanggan (opsional) --</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}{c.phone ? ` (${c.phone})` : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cart.items.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <ShoppingBag size={40} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">Keranjang kosong</p>
            </div>
          ) : (
            cart.items.map((item) => (
              <div key={item.lineId} className="bg-slate-50 rounded-xl p-3">
                <div className="flex justify-between items-start mb-1">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{item.name}</p>
                    <p className="text-xs text-slate-500">
                      {item.temperature} • Gula {item.sugar}
                      {item.addons.length > 0 && ` • +${item.addons.map((a) => a.name).join(', ')}`}
                    </p>
                  </div>
                  <button
                    onClick={() => cart.removeItem(item.lineId)}
                    className="p-1 text-red-400 hover:text-red-600"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        if (item.quantity <= 1) cart.removeItem(item.lineId);
                        else cart.updateQuantity(item.lineId, item.quantity - 1);
                      }}
                      className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center"
                    >
                      <Minus size={12} />
                    </button>
                    <span className="text-sm font-semibold w-5 text-center">{item.quantity}</span>
                    <button
                      onClick={() => cart.updateQuantity(item.lineId, item.quantity + 1)}
                      className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center"
                    >
                      <Plus size={12} />
                    </button>
                  </div>
                  <p className="font-semibold text-sm text-brand-700">{formatRupiah(item.subtotal)}</p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Cart Footer */}
        {cart.items.length > 0 && (
          <div className="p-4 border-t border-slate-100 space-y-3">
            {/* Promo/Voucher */}
            <div className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={voucherCode}
                  onChange={(e) => { setVoucherCode(e.target.value.toUpperCase()); setPromoError(''); }}
                  onKeyDown={(e) => e.key === 'Enter' && applyVoucherCode()}
                  placeholder="Kode voucher"
                  className="input text-sm flex-1 font-mono"
                />
                <button onClick={applyVoucherCode} className="btn-secondary text-xs" disabled={!voucherCode}>OK</button>
              </div>
              {activePromos.length > 0 && !appliedPromoId && (
                <select onChange={(e) => selectPromo(e.target.value)} className="input text-xs" value="">
                  <option value="">Pilih promo aktif...</option>
                  {activePromos.map((p) => (
                    <option key={p.id} value={p.id}>{p.name} ({p.type === 'percentage' ? `${p.value}%` : formatRupiah(p.value)})</option>
                  ))}
                </select>
              )}
              {appliedPromoId && (
                <div className="flex items-center justify-between p-2 bg-green-50 rounded-lg text-xs">
                  <span className="text-green-700 font-medium">✓ {activePromos.find(p => p.id === appliedPromoId)?.name} (-{formatRupiah(promoDiscount)})</span>
                  <button onClick={clearPromo} className="text-red-500 hover:underline">Hapus</button>
                </div>
              )}
              {loyaltyDiscount > 0 && (
                <div className="p-2 bg-amber-50 rounded-lg text-xs text-amber-700 font-medium">
                  👑 Loyalty discount: -{formatRupiah(loyaltyDiscount)}
                </div>
              )}
              {promoError && <p className="text-xs text-red-500">{promoError}</p>}
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={discountInput}
                onChange={(e) => setDiscountInput(e.target.value.replace(/\D/g, ''))}
                placeholder="Diskon manual (Rp)"
                className="input text-sm flex-1"
              />
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Subtotal</span>
              <span className="font-medium">{formatRupiah(cart.getSubtotal())}</span>
            </div>
            {(parseInt(discountInput) > 0 || promoDiscount > 0 || loyaltyDiscount > 0) && (
              <div className="flex justify-between text-sm">
                <span className="text-red-500">Total Diskon</span>
                <span className="text-red-500">-{formatRupiah((parseInt(discountInput) || 0) + promoDiscount + loyaltyDiscount)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-lg">
              <span>Total</span>
              <span className="text-brand-700">
                {formatRupiah(Math.max(0, cart.getSubtotal() - (parseInt(discountInput) || 0) - promoDiscount - loyaltyDiscount))}
              </span>
            </div>
            <button onClick={handleCheckout} className="btn-primary w-full text-base">
              <CreditCard size={18} /> Bayar
            </button>
          </div>
        )}
      </div>

      {/* Customization Modal */}
      <Modal
        open={!!selectedMenu}
        onClose={() => setSelectedMenu(null)}
        title={selectedMenu?.name || ''}
        maxWidth="max-w-md"
      >
        {selectedMenu && (
          <div className="space-y-5">
            {/* Temperature */}
            <div>
              <label className="label">Suhu</label>
              <div className="flex gap-2">
                {(['Hangat', 'Dingin'] as Temperature[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTemp(t)}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition ${
                      temp === t
                        ? 'bg-brand-600 text-white border-brand-600'
                        : 'bg-white border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {t === 'Hangat' ? '🔥' : '🧊'} {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Sugar Level */}
            <div>
              <label className="label">Level Gula</label>
              <div className="flex gap-2">
                {(['Normal', 'Less', 'None'] as SugarLevel[]).map((s) => (
                  <button
                    key={s}
                    onClick={() => setSugar(s)}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition ${
                      sugar === s
                        ? 'bg-brand-600 text-white border-brand-600'
                        : 'bg-white border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Add-ons */}
            {selectedMenu.availableAddons.length > 0 && (
              <div>
                <label className="label">Add-ons</label>
                <div className="space-y-2">
                  {selectedMenu.availableAddons.map((addon) => {
                    const active = selectedAddons.find((a) => a.name === addon.name);
                    return (
                      <button
                        key={addon.name}
                        onClick={() => toggleAddon(addon)}
                        className={`w-full flex items-center justify-between p-3 rounded-xl border transition ${
                          active
                            ? 'bg-brand-50 border-brand-300'
                            : 'bg-white border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <span className="text-sm font-medium">{addon.name}</span>
                        <span className="text-sm text-brand-600">+{formatRupiah(addon.price)}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div>
              <label className="label">Jumlah</label>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setQty(Math.max(1, qty - 1))}
                  className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center"
                >
                  <Minus size={16} />
                </button>
                <span className="text-xl font-bold w-8 text-center">{qty}</span>
                <button
                  onClick={() => setQty(qty + 1)}
                  className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>

            {/* Total & Add */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <div>
                <p className="text-sm text-slate-500">Total</p>
                <p className="text-xl font-bold text-brand-700">
                  {formatRupiah(
                    (selectedMenu.price + selectedAddons.reduce((a, b) => a + b.price, 0)) * qty
                  )}
                </p>
              </div>
              <button onClick={addToCart} className="btn-primary">
                <Plus size={16} /> Tambah
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Checkout Modal */}
      <Modal
        open={showCheckout}
        onClose={() => setShowCheckout(false)}
        title="Pembayaran"
        maxWidth="max-w-md"
      >
        <div className="space-y-5">
          <div className="bg-brand-50 rounded-xl p-4 text-center">
            <p className="text-sm text-slate-600">Total Pembayaran</p>
            <p className="text-3xl font-bold text-brand-700">
              {formatRupiah(Math.max(0, cart.getSubtotal() - (parseInt(discountInput) || 0) - promoDiscount - loyaltyDiscount))}
            </p>
            <p className="text-xs text-slate-500 mt-1">Antrean #{getNextQueueNumber()}</p>
            {selectedCustomer && (
              <p className="text-xs text-brand-600 mt-1">Pelanggan: {selectedCustomer.name}</p>
            )}
          </div>

          {/* Payment Method */}
          <div>
            <label className="label">Metode Pembayaran</label>
            <div className="grid grid-cols-3 gap-2">
              {([
                { method: 'Cash' as PaymentMethod, icon: Banknote, label: 'Cash' },
                { method: 'QRIS' as PaymentMethod, icon: QrCode, label: 'QRIS' },
                { method: 'Transfer' as PaymentMethod, icon: CreditCard, label: 'Transfer' },
              ]).map(({ method, icon: Icon, label }) => (
                <button
                  key={method}
                  onClick={() => setPayMethod(method)}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition ${
                    payMethod === method
                      ? 'bg-brand-600 text-white border-brand-600'
                      : 'bg-white border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <Icon size={20} />
                  <span className="text-xs font-medium">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Cash Calculator */}
          {payMethod === 'Cash' && (
            <div>
              <label className="label">Uang Diterima</label>
              <input
                type="text"
                value={cashReceived}
                onChange={(e) => setCashReceived(e.target.value.replace(/\D/g, ''))}
                placeholder="Masukkan nominal"
                className="input text-lg font-semibold"
                autoFocus
              />
              {parseInt(cashReceived) > 0 && (
                <div className="mt-3 p-3 bg-green-50 rounded-xl">
                  <div className="flex justify-between">
                    <span className="text-sm text-green-700">Kembalian</span>
                    <span className="font-bold text-green-700">
                      {formatRupiah(
                        Math.max(
                          0,
                          parseInt(cashReceived) -
                            Math.max(0, cart.getSubtotal() - (parseInt(discountInput) || 0) - promoDiscount - loyaltyDiscount)
                        )
                      )}
                    </span>
                  </div>
                </div>
              )}
              <div className="grid grid-cols-3 gap-2 mt-3">
                {[20000, 50000, 100000].map((v) => (
                  <button
                    key={v}
                    onClick={() => setCashReceived(String(v))}
                    className="btn-secondary text-xs"
                  >
                    {formatRupiah(v)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Finalize */}
          <button
            onClick={finalizeTransaction}
            disabled={
              payMethod === 'Cash' &&
              (!cashReceived || (parseInt(cashReceived) || 0) <
                Math.max(0, cart.getSubtotal() - (parseInt(discountInput) || 0) - promoDiscount - loyaltyDiscount))
            }
            className="btn-primary w-full text-base"
          >
            Selesaikan Pesanan
          </button>
        </div>
      </Modal>

      {/* Stock Warning Modal */}
      <Modal
        open={showStockWarning}
        onClose={() => setShowStockWarning(false)}
        title="⚠️ Peringatan Stok"
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Beberapa bahan baku tidak mencukupi untuk pesanan ini:
          </p>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {stockWarnings.map((w) => (
              <div key={w.ingredientId} className="flex items-center justify-between p-3 bg-red-50 rounded-xl">
                <div>
                  <p className="font-medium text-sm text-red-800">{w.ingredientName}</p>
                  <p className="text-xs text-red-600">
                    Butuh: {w.required.toFixed(2)} {w.unit} • Tersedia: {w.available.toFixed(2)} {w.unit}
                  </p>
                </div>
                <AlertTriangle size={16} className="text-red-500 flex-shrink-0" />
              </div>
            ))}
          </div>
          <div className="flex gap-3 pt-3 border-t border-slate-100">
            <button onClick={() => setShowStockWarning(false)} className="btn-secondary flex-1">
              Kembali
            </button>
            <button onClick={proceedCheckoutAnyway} className="btn-primary flex-1 bg-amber-600 hover:bg-amber-700">
              Lanjutkan Tetap
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
