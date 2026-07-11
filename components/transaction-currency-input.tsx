"use client";

import { useLayoutEffect, useRef, useState, type ChangeEvent, type ClipboardEvent } from "react";
import { bersihkanAngkaInput, formatRupiahInput, parseRupiahInput } from "@/lib/format/currency-input";

// Input nominal khusus form Transaksi Harian - tampil format Rupiah saat
// diketik, tapi nilai internal & yang dikirim ke form (lewat hidden input,
// supaya kompatibel dengan submit form native yang sudah dipakai halaman ini)
// tetap number murni. TIDAK dipakai di halaman lain - format Rupiah pada
// Dashboard/tabel/laporan tetap pakai formatRupiah lokal masing-masing.

function hitungDigitSebelumKursor(str: string, cursorIndex: number): number {
  let count = 0;
  for (let i = 0; i < cursorIndex && i < str.length; i++) {
    if (/[0-9-]/.test(str[i])) count++;
  }
  return count;
}

function cariPosisiSetelahNDigit(str: string, n: number): number {
  if (n <= 0) return 0;
  let count = 0;
  for (let i = 0; i < str.length; i++) {
    if (/[0-9-]/.test(str[i])) {
      count++;
      if (count === n) return i + 1;
    }
  }
  return str.length;
}

type Props = {
  label: string;
  name?: string;
  value?: number | null;
  defaultValue?: number | null;
  onChange?: (value: number | null) => void;
  placeholder?: string;
  disabled?: boolean;
  readOnly?: boolean;
  allowNegative?: boolean;
  required?: boolean;
  error?: string;
};

export function TransactionCurrencyInput({
  label,
  name,
  value,
  defaultValue,
  onChange,
  placeholder = "Rp0",
  disabled,
  readOnly,
  allowNegative = false,
  required,
  error,
}: Props) {
  const isControlled = value !== undefined;
  const [uncontrolledValue, setUncontrolledValue] = useState<number | null>(defaultValue ?? null);
  const currentValue = isControlled ? (value ?? null) : uncontrolledValue;
  const display = formatRupiahInput(currentValue);

  const inputRef = useRef<HTMLInputElement>(null);
  const pendingCursor = useRef<number | null>(null);

  useLayoutEffect(() => {
    if (pendingCursor.current !== null && inputRef.current) {
      inputRef.current.setSelectionRange(pendingCursor.current, pendingCursor.current);
      pendingCursor.current = null;
    }
  });

  function applyChange(rawInputValue: string, cursorIndex: number) {
    const digitsBeforeCursor = hitungDigitSebelumKursor(rawInputValue, cursorIndex);
    const cleaned = bersihkanAngkaInput(rawInputValue, allowNegative);
    const next = parseRupiahInput(cleaned, allowNegative);
    const newDisplay = formatRupiahInput(next);
    pendingCursor.current = cariPosisiSetelahNDigit(newDisplay, digitsBeforeCursor);
    if (!isControlled) setUncontrolledValue(next);
    onChange?.(next);
  }

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    applyChange(e.target.value, e.target.selectionStart ?? e.target.value.length);
  }

  function handlePaste(e: ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text");
    const cleaned = bersihkanAngkaInput(pasted, allowNegative);
    const next = parseRupiahInput(cleaned, allowNegative);
    if (!isControlled) setUncontrolledValue(next);
    onChange?.(next);
    pendingCursor.current = formatRupiahInput(next).length;
  }

  const inputId = name ? `field-${name}` : undefined;
  const errorId = name ? `${name}-error` : undefined;

  return (
    <div className="space-y-1">
      <label htmlFor={inputId} className="text-xs font-medium text-neutral-600">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </label>
      <input
        ref={inputRef}
        id={inputId}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        value={display}
        onChange={handleChange}
        onPaste={handlePaste}
        placeholder={placeholder}
        disabled={disabled}
        readOnly={readOnly}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        className="w-full rounded-md border border-neutral-300 px-3 py-1.5 text-sm focus:border-neutral-500 focus:outline-none disabled:bg-neutral-100 disabled:text-neutral-500"
      />
      {!isControlled && name && <input type="hidden" name={name} value={currentValue ?? ""} />}
      {error && (
        <p id={errorId} className="text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
