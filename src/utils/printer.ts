/**
 * Thermal Printer Utility
 * 
 * Supports two modes:
 * 1. Browser Print — opens a styled print window optimized for thermal paper
 * 2. Bluetooth ESC/POS — connects to thermal printer via Web Bluetooth API
 */

import type { AppSettings, Transaction, CartItem } from '../types';
import { formatRupiah } from './format';

// ============================================================
// RECEIPT GENERATION (shared between both modes)
// ============================================================

export interface ReceiptData {
  storeName: string;
  storeAddress?: string;
  storeLogo?: string;
  queueNumber: number;
  date: string;
  cashierName: string;
  customerName?: string;
  items: CartItem[];
  subtotal: number;
  discount: number;
  tax?: number; // GAP-3 fix: Pajak
  total: number;
  paymentMethod: string;
  cashReceived?: number;
  change?: number;
  orderType?: 'Dine In' | 'Take Away';
}

export function buildReceiptFromTransaction(tx: Transaction, settings: AppSettings): ReceiptData {
  return {
    storeName: settings.storeName,
    storeAddress: settings.address,
    storeLogo: settings.storeLogo,
    queueNumber: tx.queueNumber,
    date: tx.date,
    cashierName: tx.cashierName,
    customerName: tx.customerName,
    items: tx.items,
    subtotal: tx.subtotal,
    discount: tx.discount,
    tax: tx.tax, // GAP-3 fix: Pajak
    total: tx.totalAmount,
    paymentMethod: tx.paymentMethod,
    cashReceived: tx.cashReceived,
    change: tx.change,
    orderType: tx.orderType,
  };
}

// ============================================================
// MODE 1: BROWSER PRINT (window.print)
// ============================================================

export function printReceiptBrowser(data: ReceiptData, width: '58mm' | '80mm') {
  const fontSize = width === '58mm' ? '10px' : '12px';
  const paperWidth = width === '58mm' ? '48mm' : '72mm';
  const separator = width === '58mm' ? '─'.repeat(32) : '─'.repeat(42);

  const dateStr = new Date(data.date).toLocaleString('id-ID');

  let lines: string[] = [];

  // Header
  lines.push(center(data.storeName, width));
  if (data.storeAddress) lines.push(center(data.storeAddress, width));
  lines.push(separator);

  // Transaction info
  lines.push(`No: #${data.queueNumber}`);
  lines.push(`Tgl: ${dateStr}`);
  lines.push(`Kasir: ${data.cashierName}`);
  if (data.customerName) lines.push(`Pelanggan: ${data.customerName}`);
  if (data.orderType) lines.push(`Tipe: ${data.orderType}`);
  lines.push(separator);

  // Items
  for (const item of data.items) {
    const addonStr = item.addons.length > 0 ? ` +${item.addons.map(a => a.name).join(',')}` : '';
    lines.push(`${item.name}`);
    const sugarStr = item.showSugarLevel !== false ? `/${item.sugar}` : '';
    const tempStr = item.showTemperature !== false ? item.temperature : '';
    lines.push(`  ${tempStr}${sugarStr}${addonStr}`);
    lines.push(`  ${item.quantity}x ${formatRupiah(item.basePrice + item.addons.reduce((a, b) => a + b.price, 0))}${padLeft(formatRupiah(item.subtotal), width)}`);
  }

  lines.push(separator);

  // Totals
  lines.push(leftRight('Subtotal', formatRupiah(data.subtotal), width));
  if (data.discount > 0) {
    lines.push(leftRight('Diskon', `-${formatRupiah(data.discount)}`, width));
  }
  if (data.tax && data.tax > 0) {
    lines.push(leftRight('Pajak', formatRupiah(data.tax), width));
  }
  lines.push(leftRight('TOTAL', formatRupiah(data.total), width));
  lines.push(separator);

  // Payment
  lines.push(leftRight(`Bayar (${data.paymentMethod})`, formatRupiah(data.cashReceived || data.total), width));
  if (data.paymentMethod === 'Cash' && data.change !== undefined) {
    lines.push(leftRight('Kembali', formatRupiah(data.change), width));
  }

  lines.push(separator);
  lines.push('');
  lines.push(center('Terima kasih!', width));
  lines.push(center('Semoga sehat selalu 🌿', width));
  lines.push('');

  // Open print window
  const printWindow = window.open('', '_blank', 'width=400,height=600');
  if (!printWindow) return;

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Struk #${data.queueNumber}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Courier New', monospace; font-size: ${fontSize}; width: ${paperWidth}; margin: 0 auto; padding: 4mm 2mm; }
        pre { white-space: pre-wrap; word-break: break-all; line-height: 1.4; }
        @media print {
          @page { margin: 0; size: ${width} auto; }
          body { width: 100%; padding: 2mm; }
        }
      </style>
    </head>
    <body>
      <pre>${lines.join('\n')}</pre>
    </body>
    </html>
  `);
  printWindow.document.close();

  // Auto print after a short delay for rendering
  setTimeout(() => {
    printWindow.print();
    // Close after print dialog
    setTimeout(() => printWindow.close(), 1000);
  }, 300);
}

// ============================================================
// MODE 2: BLUETOOTH ESC/POS
// ============================================================

let bluetoothDevice: BluetoothDevice | null = null;
let bluetoothCharacteristic: BluetoothRemoteGATTCharacteristic | null = null;

export async function connectBluetoothPrinter(): Promise<boolean> {
  try {
    if (!navigator.bluetooth) {
      alert('Browser ini tidak mendukung Web Bluetooth. Gunakan Chrome atau Edge.');
      return false;
    }

    bluetoothDevice = await navigator.bluetooth.requestDevice({
      filters: [
        { services: ['000018f0-0000-1000-8000-00805f9b34fb'] }, // Common thermal printer service
      ],
      optionalServices: [
        '000018f0-0000-1000-8000-00805f9b34fb',
        '0000ff00-0000-1000-8000-00805f9b34fb',
        'e7810a71-73ae-499d-8c15-faa9aef0c3f2',
      ],
    });

    if (!bluetoothDevice) return false;

    const gatt = bluetoothDevice.gatt;
    if (!gatt) {
      alert('Printer tidak mendukung GATT. Coba pairing ulang.');
      return false;
    }
    const server = await gatt.connect();

    // Try common thermal printer services
    const serviceUUIDs = [
      '000018f0-0000-1000-8000-00805f9b34fb',
      '0000ff00-0000-1000-8000-00805f9b34fb',
      'e7810a71-73ae-499d-8c15-faa9aef0c3f2',
    ];

    for (const uuid of serviceUUIDs) {
      try {
        const service = await server.getPrimaryService(uuid);
        const characteristics = await service.getCharacteristics();
        // Find writable characteristic
        for (const char of characteristics) {
          if (char.properties.write || char.properties.writeWithoutResponse) {
            bluetoothCharacteristic = char;
            return true;
          }
        }
      } catch {
        continue;
      }
    }

    alert('Printer ditemukan tapi tidak bisa menulis. Pastikan printer thermal Bluetooth kompatibel.');
    return false;
  } catch (err: any) {
    if (err.name !== 'NotFoundError') { // User cancelled
      console.error('Bluetooth error:', err);
      alert(`Gagal connect: ${err.message}`);
    }
    return false;
  }
}

export function isBluetoothConnected(): boolean {
  return !!(bluetoothDevice?.gatt?.connected && bluetoothCharacteristic);
}

export async function disconnectBluetoothPrinter() {
  if (bluetoothDevice?.gatt?.connected) {
    bluetoothDevice.gatt.disconnect();
  }
  bluetoothDevice = null;
  bluetoothCharacteristic = null;
}

export async function printReceiptBluetooth(data: ReceiptData, width: '58mm' | '80mm') {
  if (!bluetoothCharacteristic) {
    const connected = await connectBluetoothPrinter();
    if (!connected) return;
  }

  const maxChars = width === '58mm' ? 32 : 42;
  const encoder = new TextEncoder();

  // ESC/POS commands
  const ESC = 0x1B;
  const GS = 0x1D;
  const commands: number[] = [];

  // Initialize printer
  commands.push(ESC, 0x40); // ESC @ - Initialize

  // Center align
  commands.push(ESC, 0x61, 0x01); // ESC a 1 - Center

  // Bold on
  commands.push(ESC, 0x45, 0x01); // ESC E 1 - Bold on
  commands.push(...encoder.encode(data.storeName + '\n'));
  commands.push(ESC, 0x45, 0x00); // Bold off

  if (data.storeAddress) {
    commands.push(...encoder.encode(data.storeAddress + '\n'));
  }

  // Left align
  commands.push(ESC, 0x61, 0x00); // ESC a 0 - Left
  commands.push(...encoder.encode('─'.repeat(maxChars) + '\n'));

  // Transaction info
  commands.push(...encoder.encode(`No: #${data.queueNumber}\n`));
  commands.push(...encoder.encode(`Tgl: ${new Date(data.date).toLocaleString('id-ID')}\n`));
  commands.push(...encoder.encode(`Kasir: ${data.cashierName}\n`));
  if (data.customerName) {
    commands.push(...encoder.encode(`Pelanggan: ${data.customerName}\n`));
  }
  if (data.orderType) {
    commands.push(...encoder.encode(`Tipe: ${data.orderType}\n`));
  }
  commands.push(...encoder.encode('─'.repeat(maxChars) + '\n'));

  // Items
  for (const item of data.items) {
    commands.push(...encoder.encode(`${item.name}\n`));
    const addonStr = item.addons.length > 0 ? ` +${item.addons.map(a => a.name).join(',')}` : '';
    const sugarStr = item.showSugarLevel !== false ? `/${item.sugar}` : '';
    const tempStr = item.showTemperature !== false ? item.temperature : '';
    commands.push(...encoder.encode(`  ${tempStr}${sugarStr}${addonStr}\n`));
    commands.push(...encoder.encode(`  ${item.quantity}x    ${formatRupiah(item.subtotal)}\n`));
  }

  commands.push(...encoder.encode('─'.repeat(maxChars) + '\n'));

  // Totals
  commands.push(...encoder.encode(`Subtotal: ${formatRupiah(data.subtotal)}\n`));
  if (data.discount > 0) {
    commands.push(...encoder.encode(`Diskon: -${formatRupiah(data.discount)}\n`));
  }
  if (data.tax && data.tax > 0) {
    commands.push(...encoder.encode(`Pajak: ${formatRupiah(data.tax)}\n`));
  }

  // Bold total
  commands.push(ESC, 0x45, 0x01);
  commands.push(...encoder.encode(`TOTAL: ${formatRupiah(data.total)}\n`));
  commands.push(ESC, 0x45, 0x00);

  commands.push(...encoder.encode('─'.repeat(maxChars) + '\n'));
  commands.push(...encoder.encode(`Bayar (${data.paymentMethod}): ${formatRupiah(data.cashReceived || data.total)}\n`));
  if (data.paymentMethod === 'Cash' && data.change !== undefined) {
    commands.push(...encoder.encode(`Kembali: ${formatRupiah(data.change)}\n`));
  }

  commands.push(...encoder.encode('─'.repeat(maxChars) + '\n'));

  // Center footer
  commands.push(ESC, 0x61, 0x01);
  commands.push(...encoder.encode('\nTerima kasih!\nSemoga sehat selalu\n\n'));

  // Feed and cut
  commands.push(ESC, 0x64, 0x04); // Feed 4 lines
  commands.push(GS, 0x56, 0x00); // Cut paper

  // Send data in chunks (BLE has MTU limit ~20 bytes)
  const data_array = new Uint8Array(commands);
  const chunkSize = 20;

  for (let i = 0; i < data_array.length; i += chunkSize) {
    const chunk = data_array.slice(i, i + chunkSize);
    try {
      if (bluetoothCharacteristic!.properties.writeWithoutResponse) {
        await bluetoothCharacteristic!.writeValueWithoutResponse(chunk);
      } else {
        await bluetoothCharacteristic!.writeValue(chunk);
      }
      // Small delay between chunks
      await new Promise((r) => setTimeout(r, 20));
    } catch (err) {
      console.error('Print chunk error:', err);
      break;
    }
  }
}

// ============================================================
// MAIN PRINT FUNCTION (auto-selects mode based on settings)
// ============================================================

export function printKitchenReceiptBrowser(data: ReceiptData, items: CartItem[], kp: KitchenPrinterConfig) {
  const fontSize = kp.width === '58mm' ? '10px' : '12px';
  const paperWidth = kp.width === '58mm' ? '48mm' : '72mm';
  const separator = kp.width === '58mm' ? '─'.repeat(32) : '─'.repeat(42);

  const dateStr = new Date(data.date).toLocaleString('id-ID');

  let lines: string[] = [];

  // Header
  lines.push(center(`TIKET DAPUR - #${data.queueNumber}`, kp.width));
  lines.push(center(kp.name.toUpperCase(), kp.width));
  lines.push(separator);

  // Info
  lines.push(`Tgl: ${dateStr}`);
  lines.push(`Kasir: ${data.cashierName}`);
  if (data.customerName) lines.push(`Pelanggan: ${data.customerName}`);
  if (data.orderType) lines.push(`Tipe: ${data.orderType}`);
  lines.push(separator);

  // Items
  for (const item of items) {
    const addonStr = item.addons.length > 0 ? ` +${item.addons.map(a => a.name).join(',')}` : '';
    lines.push(`${item.name}`);
    const sugarStr = item.showSugarLevel !== false ? `/${item.sugar}` : '';
    const tempStr = item.showTemperature !== false ? item.temperature : '';
    lines.push(`  ${tempStr}${sugarStr}${addonStr}`);
    lines.push(`  QTY: ${item.quantity}`);
    lines.push('');
  }

  lines.push(separator);
  lines.push('');
  lines.push(center('Selesai Tiket', kp.width));
  lines.push('');

  const printWindow = window.open('', '_blank', 'width=400,height=600');
  if (!printWindow) return;

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Tiket Dapur #${data.queueNumber} - ${kp.name}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Courier New', monospace; font-size: ${fontSize}; width: ${paperWidth}; margin: 0 auto; padding: 4mm 2mm; }
        pre { white-space: pre-wrap; word-break: break-all; line-height: 1.4; font-weight: bold; }
        @media print {
          @page { margin: 0; size: ${kp.width} auto; }
          body { width: 100%; padding: 2mm; }
        }
      </style>
    </head>
    <body>
      <pre>${lines.join('\n')}</pre>
    </body>
    </html>
  `);
  printWindow.document.close();

  setTimeout(() => {
    printWindow.print();
    setTimeout(() => printWindow.close(), 1000);
  }, 300);
}

export async function printKitchenReceiptBluetooth(data: ReceiptData, items: CartItem[], kp: KitchenPrinterConfig) {
  const maxChars = kp.width === '58mm' ? 32 : 42;
  const encoder = new TextEncoder();
  const ESC = 0x1B;
  const GS = 0x1D;
  const commands: number[] = [];

  commands.push(ESC, 0x40);
  commands.push(ESC, 0x61, 0x01);
  commands.push(ESC, 0x45, 0x01);
  commands.push(...encoder.encode(`TIKET DAPUR - #${data.queueNumber}\n`));
  commands.push(...encoder.encode(`${kp.name.toUpperCase()}\n`));
  commands.push(ESC, 0x45, 0x00);

  commands.push(ESC, 0x61, 0x00);
  commands.push(...encoder.encode('─'.repeat(maxChars) + '\n'));
  commands.push(...encoder.encode(`Tgl: ${new Date(data.date).toLocaleString('id-ID')}\n`));
  commands.push(...encoder.encode(`Kasir: ${data.cashierName}\n`));
  if (data.customerName) {
    commands.push(...encoder.encode(`Pelanggan: ${data.customerName}\n`));
  }
  if (data.orderType) {
    commands.push(...encoder.encode(`Tipe: ${data.orderType}\n`));
  }
  commands.push(...encoder.encode('─'.repeat(maxChars) + '\n'));

  for (const item of items) {
    commands.push(...encoder.encode(`${item.name}\n`));
    const addonStr = item.addons.length > 0 ? ` +${item.addons.map(a => a.name).join(',')}` : '';
    const sugarStr = item.showSugarLevel !== false ? `/${item.sugar}` : '';
    const tempStr = item.showTemperature !== false ? item.temperature : '';
    commands.push(...encoder.encode(`  ${tempStr}${sugarStr}${addonStr}\n`));
    commands.push(ESC, 0x45, 0x01);
    commands.push(...encoder.encode(`  QTY: ${item.quantity}\n\n`));
    commands.push(ESC, 0x45, 0x00);
  }

  commands.push(...encoder.encode('─'.repeat(maxChars) + '\n'));
  commands.push(ESC, 0x61, 0x01);
  commands.push(...encoder.encode('\nSelesai Tiket\n\n'));
  commands.push(ESC, 0x64, 0x04);
  commands.push(GS, 0x56, 0x00);

  const data_array = new Uint8Array(commands);
  const chunkSize = 20;

  if (!bluetoothCharacteristic) {
    alert(`Printer Bluetooth untuk ${kp.name} belum terhubung. Sambungkan printer terlebih dahulu.`);
    return;
  }

  for (let i = 0; i < data_array.length; i += chunkSize) {
    const chunk = data_array.slice(i, i + chunkSize);
    try {
      if (bluetoothCharacteristic.properties.writeWithoutResponse) {
        await bluetoothCharacteristic.writeValueWithoutResponse(chunk);
      } else {
        await bluetoothCharacteristic.writeValue(chunk);
      }
      await new Promise((r) => setTimeout(r, 20));
    } catch (err) {
      console.error('Print chunk error:', err);
      break;
    }
  }
}

import type { KitchenPrinterConfig } from '../types';

export async function printReceipt(data: ReceiptData, settings: AppSettings) {
  // 1. Print full receipt on cashier printer if enabled
  if (settings.printerEnabled) {
    if (settings.printerType === 'bluetooth') {
      await printReceiptBluetooth(data, settings.printerWidth);
    } else {
      printReceiptBrowser(data, settings.printerWidth);
    }
  }

  // 2. Print split kitchen receipts for each configured kitchen printer
  if (settings.kitchenPrinters && settings.kitchenPrinters.length > 0) {
    for (const kp of settings.kitchenPrinters) {
      if (!kp.enabled) continue;

      // Filter items matching the targeted kitchen/bar category
      const matchingItems = data.items.filter((item) => {
        const itemTarget = (item.kitchenTarget || '').trim().toLowerCase();
        const printerTarget = (kp.targetCategory || '').trim().toLowerCase();
        return itemTarget === printerTarget && printerTarget !== '';
      });

      if (matchingItems.length === 0) continue;

      // Print kitchen ticket
      if (kp.type === 'bluetooth') {
        await printKitchenReceiptBluetooth(data, matchingItems, kp);
      } else {
        printKitchenReceiptBrowser(data, matchingItems, kp);
      }
    }
  }
}

// GAP-7 fix: General raw text printing utility (supporting bluetooth & browser fallback)
export async function printTextRaw(lines: string[], settings: AppSettings) {
  if (!settings.printerEnabled) {
    fallbackBrowserPrintText(lines, '58mm');
    return;
  }

  if (settings.printerType === 'bluetooth') {
    const connected = bluetoothCharacteristic ? true : await connectBluetoothPrinter();
    if (!connected) {
      fallbackBrowserPrintText(lines, settings.printerWidth);
      return;
    }
    const maxChars = settings.printerWidth === '58mm' ? 32 : 42;
    const encoder = new TextEncoder();
    const ESC = 0x1B;
    const GS = 0x1D;
    const commands: number[] = [];

    // Initialize printer
    commands.push(ESC, 0x40); // ESC @
    commands.push(ESC, 0x61, 0x00); // Left align

    for (const line of lines) {
      commands.push(...encoder.encode(line + '\n'));
    }

    // Feed and cut
    commands.push(ESC, 0x64, 0x04); // Feed 4 lines
    commands.push(GS, 0x56, 0x00); // Cut paper

    const data_array = new Uint8Array(commands);
    const chunkSize = 20;
    for (let i = 0; i < data_array.length; i += chunkSize) {
      const chunk = data_array.slice(i, i + chunkSize);
      try {
        if (bluetoothCharacteristic!.properties.writeWithoutResponse) {
          await bluetoothCharacteristic!.writeValueWithoutResponse(chunk);
        } else {
          await bluetoothCharacteristic!.writeValue(chunk);
        }
        await new Promise((r) => setTimeout(r, 20));
      } catch (err) {
        console.error('Print chunk error:', err);
        break;
      }
    }
  } else {
    fallbackBrowserPrintText(lines, settings.printerWidth);
  }
}

function fallbackBrowserPrintText(lines: string[], width: '58mm' | '80mm') {
  const fontSize = width === '58mm' ? '10px' : '12px';
  const paperWidth = width === '58mm' ? '48mm' : '72mm';
  const printWindow = window.open('', '_blank', 'width=400,height=600');
  if (!printWindow) return;
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Ringkasan</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Courier New', monospace; font-size: ${fontSize}; width: ${paperWidth}; margin: 0 auto; padding: 4mm 2mm; }
        pre { white-space: pre-wrap; word-break: break-all; line-height: 1.4; }
        @media print {
          @page { margin: 0; size: ${width} auto; }
          body { width: 100%; padding: 2mm; }
        }
      </style>
    </head>
    <body>
      <pre>${lines.join('\n')}</pre>
    </body>
    </html>
  `);
  printWindow.document.close();
  printWindow.print();
}

// ============================================================
// HELPERS
// ============================================================

function center(text: string, width: '58mm' | '80mm'): string {
  const maxChars = width === '58mm' ? 32 : 42;
  const pad = Math.max(0, Math.floor((maxChars - text.length) / 2));
  return ' '.repeat(pad) + text;
}

function leftRight(left: string, right: string, width: '58mm' | '80mm'): string {
  const maxChars = width === '58mm' ? 32 : 42;
  const space = Math.max(1, maxChars - left.length - right.length);
  return left + ' '.repeat(space) + right;
}

function padLeft(text: string, width: '58mm' | '80mm'): string {
  // BUG-R2 fix: Actually right-align within remaining line space
  const maxChars = width === '58mm' ? 32 : 42;
  const pad = Math.max(1, maxChars - text.length - 10); // account for qty prefix
  return ' '.repeat(pad) + text;
}
