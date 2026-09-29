import { ImageOff, Minus, Plus } from "lucide-react";
import { formatRupiah } from "../lib/format";

function Photo({ src, alt }) {
  if (!src) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-primary-light text-primary/40">
        <ImageOff className="h-6 w-6" />
      </div>
    );
  }
  return <img src={src} alt={alt} loading="lazy" className="h-full w-full object-cover" />;
}

function Stepper({ qty, onChange }) {
  if (qty === 0) {
    return (
      <button onClick={() => onChange(1)} className="btn-primary !px-4 !py-2 text-sm">
        <Plus className="h-4 w-4" /> Tambah
      </button>
    );
  }
  return (
    <div className="flex items-center gap-1 rounded-xl bg-primary-light p-1">
      <button
        aria-label="Kurangi"
        onClick={() => onChange(qty - 1)}
        className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-primary shadow-sm active:scale-95"
      >
        <Minus className="h-4 w-4" />
      </button>
      <span className="w-8 text-center text-sm font-bold text-primary-dark">{qty}</span>
      <button
        aria-label="Tambah"
        onClick={() => onChange(qty + 1)}
        className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white shadow-sm active:scale-95"
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}

export default function MenuCard({ item, qty, onChange }) {
  return (
    <div className="flex gap-3 rounded-2xl bg-white p-3 shadow-soft">
      <div className="h-24 w-24 shrink-0 overflow-hidden rounded-xl">
        <Photo src={item.photo} alt={item.name} />
      </div>
      <div className="flex min-w-0 flex-1 flex-col justify-between">
        <div>
          <p className="line-clamp-2 text-sm font-semibold leading-snug text-gray-900">{item.name}</p>
          {item.desc && <p className="mt-0.5 line-clamp-2 text-xs text-gray-500">{item.desc}</p>}
        </div>
        <div className="mt-2 flex items-center justify-between gap-2">
          <p className="text-sm font-bold text-primary-dark">{formatRupiah(item.price)}</p>
          <Stepper qty={qty} onChange={onChange} />
        </div>
      </div>
    </div>
  );
}
