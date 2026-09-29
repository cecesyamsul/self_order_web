import { useEffect, useState } from "react";
import { CheckCircle2, Clock, ChefHat, XCircle } from "lucide-react";
import { fetchOrderStatus } from "../lib/api";
import { formatRupiah } from "../lib/format";

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
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-primary-light text-primary">
          <CheckCircle2 className="h-11 w-11" />
        </div>
        <h1 className="text-xl font-bold text-gray-900">Pesanan berhasil dikirim</h1>
        <p className="mt-1 text-sm text-gray-500">Meja {order.table_number}</p>
        <p className="mt-4 inline-block rounded-xl bg-white px-4 py-2 text-sm shadow-soft">
          No. pesanan <b className="text-primary-dark">{order.order_number}</b>
        </p>
      </div>

      <div className={`mt-6 flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium ${info.tone}`}>
        <Icon className="h-5 w-5 shrink-0" />
        {info.text}
      </div>

      {items.length > 0 && (
        <div className="mt-4 divide-y divide-gray-100 rounded-2xl bg-white shadow-soft">
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
