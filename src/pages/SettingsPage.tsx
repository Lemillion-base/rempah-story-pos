import { useState, useRef } from 'react';
import { v4 as uuid } from 'uuid';
import { useAuthStore } from '../store/authStore';
import { useSettingsStore } from '../store/settingsStore';
import { useAuditLogStore } from '../store/auditLogStore';
import { connectBluetoothPrinter, disconnectBluetoothPrinter, isBluetoothConnected } from '../utils/printer';
import { resetToDefault, clearOperationalData, factoryReset } from '../utils/dataManager';
import type { User, Role } from '../types';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import {
  Users,
  Plus,
  Pencil,
  Trash2,
  Key,
  Save,
  Store,
  ImagePlus,
  X,
  Printer,
  RotateCcw,
  Database,
  AlertTriangle,
} from 'lucide-react';

export default function SettingsPage() {
  const { users, addUser, updateUser, deleteUser, currentUser } = useAuthStore();
  const { settings, updateSettings } = useSettingsStore();
  const { addLog } = useAuditLogStore();

  // Store settings
  const [storeName, setStoreName] = useState(settings.storeName);
  const [storeAddress, setStoreAddress] = useState(settings.address || '');
  const [storeLogo, setStoreLogo] = useState(settings.storeLogo || '');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // User form
  const [showUserForm, setShowUserForm] = useState(false);
  const [editUserId, setEditUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState('');
  const [userUsername, setUserUsername] = useState('');
  const [userPassword, setUserPassword] = useState('');
  const [userRole, setUserRole] = useState<Role>('Kasir');

  // PIN
  const [pin, setPin] = useState(settings.managerPin);

  // Data management confirm dialogs
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showFactoryConfirm, setShowFactoryConfirm] = useState(false);
  // Super Admin access
  const [superAdminUnlocked, setSuperAdminUnlocked] = useState(false);
  const [superPinInput, setSuperPinInput] = useState('');
  const [superPinError, setSuperPinError] = useState('');
  const [newSuperPin, setNewSuperPin] = useState('');

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 500 * 1024) {
      alert('Ukuran file maksimal 500KB');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setStoreLogo(dataUrl);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const saveStoreSettings = () => {
    updateSettings({
      storeName,
      address: storeAddress,
      storeLogo: storeLogo || undefined,
    });
  };

  const openAddUser = () => {
    setEditUserId(null);
    setUserName('');
    setUserUsername('');
    setUserPassword('');
    setUserRole('Kasir');
    setShowUserForm(true);
  };

  const openEditUser = (u: User) => {
    setEditUserId(u.id);
    setUserName(u.name);
    setUserUsername(u.username);
    setUserPassword('');
    setUserRole(u.role);
    setShowUserForm(true);
  };

  const saveUser = () => {
    // Check username uniqueness
    const existingUser = users.find(u => u.username === userUsername && u.id !== editUserId);
    if (existingUser) {
      alert('Username sudah digunakan. Pilih username lain.');
      return;
    }

    if (editUserId) {
      const data: Partial<User> = { name: userName, username: userUsername, role: userRole };
      if (userPassword) data.password = userPassword;
      updateUser(editUserId, data);
      if (currentUser) {
        addLog(currentUser.id, currentUser.name, currentUser.role, 'update_user', `Edit user: ${userName}`, { userId: editUserId });
      }
    } else {
      const newId = uuid();
      addUser({
        id: newId,
        name: userName,
        username: userUsername,
        password: userPassword,
        role: userRole,
        createdAt: new Date().toISOString(),
      });
      if (currentUser) {
        addLog(currentUser.id, currentUser.name, currentUser.role, 'create_user', `Tambah user: ${userName} (${userRole})`, { userId: newId });
      }
    }
    setShowUserForm(false);
  };

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">⚙️ Settings</h1>

      {/* Store Settings */}
      <div className="card p-5">
        <h2 className="font-bold text-lg flex items-center gap-2 mb-4">
          <Store size={18} /> Pengaturan Toko
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-[200px_1fr] gap-6">
          {/* Logo */}
          <div className="flex flex-col items-center gap-3">
            <div className="w-32 h-32 rounded-2xl border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden bg-slate-50">
              {storeLogo ? (
                <img src={storeLogo} alt="Logo" className="w-full h-full object-contain" />
              ) : (
                <div className="text-center text-slate-400">
                  <ImagePlus size={32} className="mx-auto mb-1" />
                  <p className="text-xs">Logo Toko</p>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="btn-secondary text-xs"
              >
                <ImagePlus size={14} /> Upload
              </button>
              {storeLogo && (
                <button
                  onClick={() => setStoreLogo('')}
                  className="btn-ghost text-xs text-red-500"
                >
                  <X size={14} /> Hapus
                </button>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleLogoUpload}
              className="hidden"
            />
            <p className="text-xs text-slate-400">Maks. 500KB (PNG/JPG)</p>
          </div>

          {/* Store Info */}
          <div className="space-y-4">
            <div>
              <label className="label">Nama Toko</label>
              <input
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                className="input"
                placeholder="Nama toko Anda"
              />
            </div>
            <div>
              <label className="label">Alamat</label>
              <input
                value={storeAddress}
                onChange={(e) => setStoreAddress(e.target.value)}
                className="input"
                placeholder="Alamat toko"
              />
            </div>
            <button onClick={saveStoreSettings} className="btn-primary">
              <Save size={16} /> Simpan Pengaturan Toko
            </button>
          </div>
        </div>
      </div>

      {/* PIN Manager */}
      <div className="card p-5">
        <h2 className="font-bold text-lg flex items-center gap-2 mb-4">
          <Key size={18} /> PIN Manager
        </h2>
        <div className="flex gap-3 items-end">
          <div className="flex-1 max-w-xs">
            <label className="label">Kombinasi PIN (4-6 digit)</label>
            <input
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
              className="input font-mono text-center tracking-widest"
              maxLength={6}
            />
          </div>
          <button
            onClick={() => updateSettings({ managerPin: pin })}
            className="btn-primary"
          >
            <Save size={16} /> Simpan PIN
          </button>
        </div>
      </div>

      {/* Printer Settings */}
      <div className="card p-5">
        <h2 className="font-bold text-lg flex items-center gap-2 mb-4">
          <Printer size={18} /> Integrasi Printer Thermal
        </h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-sm">Aktifkan Printer</p>
              <p className="text-xs text-slate-500">Cetak struk saat transaksi selesai</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.printerEnabled}
                onChange={(e) => updateSettings({ printerEnabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:ring-2 peer-focus:ring-brand-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-sm">Auto Print saat Checkout</p>
              <p className="text-xs text-slate-500">Otomatis cetak struk setelah pembayaran</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.autoPrintOnCheckout}
                onChange={(e) => updateSettings({ autoPrintOnCheckout: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:ring-2 peer-focus:ring-brand-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-600"></div>
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Metode Cetak</label>
              <select
                value={settings.printerType}
                onChange={(e) => updateSettings({ printerType: e.target.value as 'browser' | 'bluetooth' })}
                className="input"
              >
                <option value="browser">Browser Print (window.print)</option>
                <option value="bluetooth">Bluetooth (Web Bluetooth API)</option>
              </select>
            </div>
            <div>
              <label className="label">Lebar Kertas</label>
              <select
                value={settings.printerWidth}
                onChange={(e) => updateSettings({ printerWidth: e.target.value as '58mm' | '80mm' })}
                className="input"
              >
                <option value="58mm">58mm (Mini)</option>
                <option value="80mm">80mm (Standard)</option>
              </select>
            </div>
          </div>

          {settings.printerType === 'bluetooth' && (
            <div className="p-3 bg-amber-50 rounded-xl text-sm text-amber-700 space-y-3">
              <div>
                <p className="font-medium">🔗 Bluetooth Printer</p>
                <p className="text-xs mt-1">
                  Hubungkan printer thermal Bluetooth Anda. Pastikan printer sudah menyala dan dalam mode pairing.
                  Didukung di Chrome/Edge.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={async () => {
                    const ok = await connectBluetoothPrinter();
                    if (ok) alert('Printer berhasil terhubung!');
                  }}
                  className="btn-primary text-xs"
                >
                  <Printer size={14} /> Hubungkan Printer
                </button>
                {isBluetoothConnected() && (
                  <button
                    onClick={() => { disconnectBluetoothPrinter(); alert('Printer diputus.'); }}
                    className="btn-secondary text-xs text-red-600"
                  >
                    Putuskan
                  </button>
                )}
                <span className={`text-xs font-medium ${isBluetoothConnected() ? 'text-green-600' : 'text-slate-400'}`}>
                  {isBluetoothConnected() ? '● Terhubung' : '○ Tidak terhubung'}
                </span>
              </div>
            </div>
          )}

          {settings.printerType === 'browser' && (
            <div className="p-3 bg-blue-50 rounded-xl text-sm text-blue-700">
              <p className="font-medium">ℹ️ Browser Print</p>
              <p className="text-xs mt-1">
                Struk akan dicetak menggunakan dialog print browser. Atur printer default 
                ke printer thermal Anda di pengaturan sistem operasi untuk hasil terbaik.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* User Management */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-lg flex items-center gap-2">
            <Users size={18} /> Manajemen User
          </h2>
          <button onClick={openAddUser} className="btn-primary text-sm">
            <Plus size={16} /> Tambah User
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="text-left p-3 font-semibold">Nama</th>
                <th className="text-left p-3 font-semibold">Username</th>
                <th className="text-left p-3 font-semibold">Role</th>
                <th className="text-center p-3 font-semibold">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-slate-50">
                  <td className="p-3 font-medium">{u.name}</td>
                  <td className="p-3 text-slate-500">{u.username}</td>
                  <td className="p-3">
                    <span className={`badge ${
                      u.role === 'Manager' ? 'bg-purple-100 text-purple-700' :
                      u.role === 'Kasir' ? 'bg-blue-100 text-blue-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => openEditUser(u)} className="p-1.5 rounded-lg hover:bg-slate-100">
                        <Pencil size={14} />
                      </button>
                      {u.id !== currentUser?.id && (
                        <button onClick={() => {
                          deleteUser(u.id);
                          if (currentUser) {
                            addLog(currentUser.id, currentUser.name, currentUser.role, 'delete_user', `Hapus user: ${u.name}`, { userId: u.id });
                          }
                        }} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500">
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Form Modal */}
      <Modal open={showUserForm} onClose={() => setShowUserForm(false)} title={editUserId ? 'Edit User' : 'Tambah User'}>
        <div className="space-y-4">
          <div>
            <label className="label">Nama Lengkap</label>
            <input value={userName} onChange={(e) => setUserName(e.target.value)} className="input" />
          </div>
          <div>
            <label className="label">Username</label>
            <input value={userUsername} onChange={(e) => setUserUsername(e.target.value)} className="input" />
          </div>
          <div>
            <label className="label">Password {editUserId && '(kosongkan jika tidak diubah)'}</label>
            <input type="password" value={userPassword} onChange={(e) => setUserPassword(e.target.value)} className="input" />
          </div>
          <div>
            <label className="label">Role</label>
            <select value={userRole} onChange={(e) => setUserRole(e.target.value as Role)} className="input">
              <option value="Manager">Manager</option>
              <option value="Kasir">Kasir</option>
              <option value="Acaraki">Acaraki</option>
            </select>
          </div>
          <div className="flex gap-3 pt-3 border-t border-slate-100">
            <button onClick={() => setShowUserForm(false)} className="btn-secondary flex-1">Batal</button>
            <button onClick={saveUser} className="btn-primary flex-1" disabled={!userName || !userUsername || (!editUserId && !userPassword)}>
              {editUserId ? 'Simpan' : 'Tambah'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Data Management — Protected by Super Admin PIN */}
      <div className="card p-5 border-red-200">
        <h2 className="font-bold text-lg flex items-center gap-2 mb-4 text-red-700">
          <Database size={18} /> Manajemen Data
        </h2>

        {!superAdminUnlocked ? (
          <div className="space-y-3">
            <p className="text-sm text-slate-500">
              Section ini dilindungi. Masukkan Super Admin PIN untuk mengakses.
            </p>
            <div className="flex gap-2 max-w-xs">
              <input
                type="password"
                value={superPinInput}
                onChange={(e) => { setSuperPinInput(e.target.value.replace(/\D/g, '')); setSuperPinError(''); }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    if (superPinInput === settings.superAdminPin) { setSuperAdminUnlocked(true); setSuperPinError(''); }
                    else setSuperPinError('PIN salah');
                  }
                }}
                placeholder="Super Admin PIN"
                className="input font-mono text-center tracking-widest"
                maxLength={6}
              />
              <button
                onClick={() => {
                  if (superPinInput === settings.superAdminPin) { setSuperAdminUnlocked(true); setSuperPinError(''); }
                  else setSuperPinError('PIN salah');
                }}
                className="btn-primary text-sm"
              >
                Buka
              </button>
            </div>
            {superPinError && <p className="text-xs text-red-500">{superPinError}</p>}
          </div>
        ) : (
          <div className="space-y-4">
            {/* Demo Mode Toggle */}
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <p className="font-medium text-sm">Mode Demo</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Tampilkan info akun demo di halaman login. Matikan untuk produksi klien.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.demoMode}
                  onChange={(e) => updateSettings({ demoMode: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:ring-2 peer-focus:ring-brand-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-600"></div>
              </label>
            </div>

            {/* Change Super Admin PIN */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">Ubah Super Admin PIN</p>
                  <p className="text-xs text-slate-500 mt-0.5">PIN saat ini: ••••••</p>
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                <input
                  type="password"
                  value={newSuperPin}
                  onChange={(e) => setNewSuperPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="PIN baru (4-6 digit)"
                  maxLength={6}
                  className="input w-40 text-center font-mono text-sm tracking-widest"
                />
                <button
                  onClick={() => {
                    if (newSuperPin.length >= 4) {
                      updateSettings({ superAdminPin: newSuperPin });
                      setNewSuperPin('');
                      alert('Super Admin PIN berhasil diubah!');
                    }
                  }}
                  disabled={newSuperPin.length < 4}
                  className="btn-primary text-xs"
                >
                  <Save size={14} /> Simpan
                </button>
              </div>
            </div>

            {/* Clear Operational Data */}
            <div className="flex items-center justify-between p-4 bg-amber-50 rounded-xl border border-amber-200">
              <div>
                <p className="font-medium text-sm">Bersihkan Data Transaksi</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Hapus transaksi, shift, pelanggan, promo, log. Menu & inventaris tetap.
                </p>
              </div>
              <button onClick={() => setShowClearConfirm(true)} className="btn-secondary text-xs text-amber-700 border-amber-300 whitespace-nowrap">
                <Trash2 size={14} /> Bersihkan
              </button>
            </div>

            {/* Reset to Default */}
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-xl border border-blue-200">
              <div>
                <p className="font-medium text-sm">Reset ke Default (Demo)</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Kembalikan semua data ke seed default. Untuk reset demo.
                </p>
              </div>
              <button onClick={() => setShowResetConfirm(true)} className="btn-secondary text-xs text-blue-700 border-blue-300 whitespace-nowrap">
                <RotateCcw size={14} /> Reset
              </button>
            </div>

            {/* Factory Reset */}
            <div className="flex items-center justify-between p-4 bg-red-50 rounded-xl border border-red-200">
              <div>
                <p className="font-medium text-sm text-red-700">Factory Reset</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Hapus SEMUA data + cloud. Tidak bisa dikembalikan.
                </p>
              </div>
              <button onClick={() => setShowFactoryConfirm(true)} className="btn-danger text-xs whitespace-nowrap">
                <AlertTriangle size={14} /> Reset
              </button>
            </div>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={showClearConfirm}
        onClose={() => setShowClearConfirm(false)}
        onConfirm={clearOperationalData}
        title="Bersihkan Data Transaksi"
        message="Semua transaksi, shift, pelanggan, promo, dan log akan dihapus permanen. Menu dan inventaris tetap. Lanjutkan?"
        confirmText="Ya, Bersihkan"
        variant="warning"
      />

      <ConfirmDialog
        open={showResetConfirm}
        onClose={() => setShowResetConfirm(false)}
        onConfirm={resetToDefault}
        title="Reset ke Default"
        message="Semua data akan dikembalikan ke keadaan awal (demo). Semua perubahan Anda akan hilang. Lanjutkan?"
        confirmText="Ya, Reset"
        variant="warning"
      />

      <ConfirmDialog
        open={showFactoryConfirm}
        onClose={() => setShowFactoryConfirm(false)}
        onConfirm={factoryReset}
        title="⚠️ Factory Reset"
        message="SEMUA DATA akan dihapus permanen termasuk menu, inventaris, settings, dan data cloud. Tindakan ini TIDAK BISA dibatalkan. Yakin?"
        confirmText="HAPUS SEMUA"
        variant="danger"
      />
    </div>
  );
}
