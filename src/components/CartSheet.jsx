import { useEffect, useState } from "react";
import { Loader2, Minus, Plus, Trash2, X } from "lucide-react";
import { formatRupiah } from "../lib/format";

const NAME_KEY = "so-customer";

function loadCustomer() {
  try {
    return JSON.parse(localStorage.getItem(NAME_KEY)) || { name: "", phone: "" };
  } catch {
    return { name: "", phone: "" };
  }
}

export default function CartSheet({ open, onClose, cart, tableNumber, submitting, error, onSubmit }) {
  const [name, setName] = useState(() => loadCustomer().name);
  const [phone, setPhone] = useState(() => loadCustomer().phone);
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  const nameOk = name.trim().length >= 2;
  const digits = phone.replace(/[^0-9+]/g, "");
  const phoneOk = digits === "" || (digits.length >= 8 && digits.length <= 16);

  function submit(e) {
    e.preventDefault();
    setTouched(true);
    if (!nameOk || !phoneOk || cart.list.length === 0) return;
    try {
      localStorage.setItem(NAME_KEY, JSON.stringify({ name: name.trim(), phone: digits }));
    } catch {
      /* abaikan */
    }
    onSubmit({ name: name.trim(), phone: digits });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50" onClick={onClose}>
      <form
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[92vh] w-full max-w-lg flex-col rounded-t-3xl bg-cream"
      >
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
          <div>
            <h2 className="text-base font-bold text-gray-900">Pesanan Anda</h2>
            <p className="text-xs text-gray-500">Meja {tableNumber}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Tutup" className="rounded-full p-2 text-gray-500 hover:bg-gray-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
          <div className="space-y-3">
            {cart.list.map((it) => (
              <div key={it.k} className="rounded-2xl bg-white p-3 shadow-soft">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900">{it.name}</p>
                    <p className="text-xs text-gray-500">{formatRupiah(it.price)}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      aria-label="Kurangi"
                      onClick={() => cart.setQty(it, it.qty - 1)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 text-gray-700 active:scale-95"
                    >
                      {it.qty === 1 ? <Trash2 className="h-4 w-4 text-red-500" /> : <Minus className="h-4 w-4" />}
                    </button>
                    <span className="w-7 text-center text-sm font-bold">{it.qty}</span>
                    <button
                      type="button"
                      aria-label="Tambah"
                      onClick={() => cart.setQty(it, it.qty + 1)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white active:scale-95"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <input
                  value={it.notes || ""}
                  maxLength={200}
                  onChange={(e) => cart.setNotes(it.k, e.target.value)}
                  placeholder="Catatan (mis. tidak pedas, less sugar)"
                  className="mt-2 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-primary"
                />
                <p className="mt-2 text-right text-sm font-bold text-primary-dark">{formatRupiah(it.qty * it.price)}</p>
              </div>
            ))}
          </div>

          <div className="space-y-3 rounded-2xl bg-white p-4 shadow-soft">
            <div>
              <label className="label" htmlFor="cname">Nama <span className="text-red-500">*</span></label>
              <input
                id="cname"
                value={name}
                maxLength={60}
                autoComplete="name"
                onChange={(e) => setName(e.target.value)}
                placeholder="Nama Anda"
                className={`input ${touched && !nameOk ? "!border-red-400" : ""}`}
              />
              {touched && !nameOk && <p className="mt-1 text-xs text-red-500">Nama wajib diisi (min. 2 huruf).</p>}
            </div>
            <div>
              <label className="label" htmlFor="cphone">No. Telepon <span className="normal-case text-gray-400">(opsional)</span></label>
              <input
                id="cphone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                value={phone}
                maxLength={20}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="08xxxxxxxxxx"
                className={`input ${touched && !phoneOk ? "!border-red-400" : ""}`}
              />
              {touched && !phoneOk && <p className="mt-1 text-xs text-red-500">Nomor telepon tidak valid.</p>}
            </div>
          </div>

          {error && <p className="rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
        </div>

        <div className="pb-safe border-t border-gray-200 bg-white px-5 pt-3">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm text-gray-500">Total</span>
            <span className="text-lg font-bold text-gray-900">{formatRupiah(cart.total)}</span>
          </div>
          <button type="submit" disabled={submitting || cart.list.length === 0} className="btn-primary w-full">
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Mengirim...
              </>
            ) : (
              "Kirim Pesanan"
            )}
          </button>
          <p className="mt-2 text-center text-[11px] text-gray-400">Pembayaran dilakukan di kasir.</p>
        </div>
      </form>
    </div>
  );
}
