import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Modal from './Modal';
import { useShiftStore } from '../store/shiftStore';
import { useAuthStore } from '../store/authStore';
import { useAuditLogStore } from '../store/auditLogStore';
import { formatRupiah } from '../utils/format';
import { Wallet } from 'lucide-react';

interface OpenShiftModalProps {
  open: boolean;
}

export default function OpenShiftModal({ open }: OpenShiftModalProps) {
  const [cashInput, setCashInput] = useState('');
  const navigate = useNavigate();
  const { openShift } = useShiftStore();
  const { currentUser } = useAuthStore();
  const { addLog } = useAuditLogStore();

  const handleOpen = () => {
    if (!currentUser) return;
    const amount = parseInt(cashInput) || 0;
    openShift(currentUser.id, currentUser.name, amount);
    addLog(currentUser.id, currentUser.name, currentUser.role, 'open_shift', `Buka shift dengan modal ${formatRupiah(amount)}`, { openingCash: amount });
    setCashInput('');
  };

  return (
    <Modal open={open} onClose={() => {}} title="Buka Shift Kasir" dismissible={false}>
      <div className="space-y-5">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto rounded-full bg-brand-100 flex items-center justify-center mb-3">
            <Wallet className="text-brand-600" size={32} />
          </div>
          <p className="text-sm text-slate-600">
            Selamat datang, <strong>{currentUser?.name}</strong>!<br />
            Masukkan jumlah modal kas awal di laci untuk memulai shift.
          </p>
        </div>

        <div>
          <label className="label">Modal Kas Awal (Rp)</label>
          <input
            type="text"
            value={cashInput}
            onChange={(e) => setCashInput(e.target.value.replace(/\D/g, ''))}
            placeholder="Contoh: 200000"
            className="input text-lg font-semibold text-center"
            autoFocus
            onKeyDown={(e) => e.key === 'Enter' && cashInput && handleOpen()}
          />
          {cashInput && (
            <p className="text-center text-sm text-brand-600 mt-2 font-medium">
              {formatRupiah(parseInt(cashInput) || 0)}
            </p>
          )}
        </div>

        {/* Quick amount buttons */}
        <div className="grid grid-cols-3 gap-2">
          {[100000, 200000, 300000, 500000, 750000, 1000000].map((v) => (
            <button
              key={v}
              onClick={() => setCashInput(String(v))}
              className="btn-secondary text-xs py-2"
            >
              {formatRupiah(v)}
            </button>
          ))}
        </div>

        <div className="space-y-2">
          <button
            onClick={handleOpen}
            className="btn-primary w-full text-base"
            disabled={!cashInput || parseInt(cashInput) <= 0}
          >
            <Wallet size={18} /> Mulai Shift
          </button>
          {currentUser?.role === 'Manager' && (
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="w-full btn-secondary text-base py-2.5"
            >
              Batal & Kembali ke Dashboard
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
}
