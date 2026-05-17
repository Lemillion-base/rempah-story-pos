import { useState } from 'react';
import Modal from './Modal';
import { useSettingsStore } from '../store/settingsStore';
import { ShieldAlert } from 'lucide-react';

interface PinModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  title?: string;
}

export default function PinModal({ open, onClose, onSuccess, title }: PinModalProps) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const { verifyPin } = useSettingsStore();

  const handleSubmit = () => {
    if (verifyPin(pin)) {
      setPin('');
      setError('');
      onSuccess();
    } else {
      setError('PIN salah. Coba lagi.');
    }
  };

  const handleClose = () => {
    setPin('');
    setError('');
    onClose();
  };

  return (
    <Modal open={open} onClose={handleClose} title={title || 'Otorisasi Manager'} maxWidth="max-w-sm">
      <div className="text-center space-y-4">
        <div className="w-14 h-14 mx-auto rounded-full bg-amber-100 flex items-center justify-center">
          <ShieldAlert className="text-amber-600" size={28} />
        </div>
        <p className="text-sm text-slate-600">
          Masukkan PIN Manager untuk melanjutkan tindakan ini.
        </p>
        <input
          type="password"
          maxLength={6}
          value={pin}
          onChange={(e) => {
            setPin(e.target.value.replace(/\D/g, ''));
            setError('');
          }}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          placeholder="Masukkan PIN"
          className="input text-center text-2xl tracking-[0.5em] font-mono"
          autoFocus
        />
        {error && <p className="text-sm text-red-500">{error}</p>}
        <div className="flex gap-3">
          <button onClick={handleClose} className="btn-secondary flex-1">
            Batal
          </button>
          <button onClick={handleSubmit} className="btn-primary flex-1" disabled={pin.length < 4}>
            Konfirmasi
          </button>
        </div>
      </div>
    </Modal>
  );
}
