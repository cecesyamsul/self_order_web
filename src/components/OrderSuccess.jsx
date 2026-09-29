import { useEffect, useState } from "react";
import { CheckCircle2, Clock, ChefHat, XCircle } from "lucide-react";
import { fetchOrderStatus } from "../lib/api";
import { formatRupiah } from "../lib/format";
import Logo from "./Logo";

function statusInfo(s) {
  if (!s) return { icon: Clock, tone: "text-amber-600 bg-amber-50", text: "Pesanan terkirim ke kasir" };
  if (s.status === "CANCELLED") return { icon: XCircle, tone: "text-red-600 bg-red-50", text: "Pesanan dibatalkan" };
  if (s.status === "COMPLETED") return { icon: CheckCircle2, tone: "text-primary-dark bg-primary-light", text: "Pesanan selesai. Terima kasih!" };
  if (s.acknowledged) return { icon: ChefHat, tone: "text-primary-dark bg-primary-light", text: "Pesanan diterima & sedang diproses" };
  return { icon: Clock, tone: "text-amber-600 bg-amber-50", text: "Menunggu konfirmasi kasir" };
}

export default function OrderSuccess({ order, onNewOrder }) {
  const [status, setStatus] = useState(null);

  useEffect(() => {
    let stop = false;
    async function poll() {
      try {
        const s = await fetchOrderStatus(order.id);
        if (!stop && !s?.error) setStatus(s);
      } catch {
        /* koneksi putus sesaat: coba lagi di polling berikutnya */
      }
    }
    poll();
    const t = setInterval(poll, 8000);
    return () => {
      stop = true;
      clearInterval(t);
    };
  }, [order.id]);

  const info = statusInfo(status);
  const Icon = info.icon;
  const items = status?.items || [];

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col px-5 py-10">
      <div className="text-center animate-fade-up">
        <Logo size={56} eager className="mx-auto mb-5 bg-white shadow-soft" />
        <div className="relative mx-auto mb-4 flex h-24 w-24 items-center justify-center">
          <span className="absolute inset-0 rounded-full bg-primary/10" />
          <span className="absolute inset-2 rounded-full bg-primary-light" />
          <CheckCircle2 className="relative h-12 w-12 animate-pop text-primary" />
        </div>
        <h1 className="font-display text-2xl text-gray-900">Pesanan berhasil dikirim</h1>
        <p className="mt-1 text-sm text-gray-500">Terima kasih, pesanan Anda sedang kami siapkan.</p>
        <div className="mt-4 inline-flex divide-x divide-gray-100 overflow-hidden rounded-2xl bg-white text-sm shadow-soft">
          <span className="px-4 py-2.5 text-gray-600">Meja <b className="text-gray-900">{order.table_number}</b></span>
          <span className="px-4 py-2.5 text-gray-600">No. <b className="text-primary-dark">{order.order_number}</b></span>
        </div>
      </div>

      <div className={`mt-6 flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium ${info.tone}`}>
        <Icon className="h-5 w-5 shrink-0" />
        {info.text}
      </div>

      {items.length > 0 && (
        <div className="mt-4 divide-y divide-gray-100 rounded-3xl bg-white shadow-soft ring-1 ring-black/[.03]">
          {items.map((it, i) => (
            <div key={i} className="flex justify-between gap-3 px-4 py-3 text-sm">
              <span>{it.qty}x {it.name}</span>
              <span className="text-gray-600">{formatRupiah(it.subtotal)}</span>
            </div>
          ))}
          <div className="flex justify-between px-4 py-3 text-sm font-bold">
            <span>Total</span>
            <span>{formatRupiah(status.total)}</span>
          </div>
        </div>
      )}

      <p className="mt-4 text-center text-xs text-gray-500">
        Silakan lakukan pembayaran di kasir. Status akan diperbarui otomatis.
      </p>

      <button onClick={onNewOrder} className="btn-light mt-6 w-full">
        Pesan lagi
      </button>
    </div>
  );
}
