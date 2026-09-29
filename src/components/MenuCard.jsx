import { useState } from "react";
import { Minus, Plus } from "lucide-react";
import { formatRupiah } from "../lib/format";
import Logo from "./Logo";

function Photo({ src, alt }) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  // Tanpa foto (atau gagal dimuat): tampilkan logo samar sebagai placeholder,
  // jadi kartu tetap terlihat rapi dan konsisten dengan brand.
  if (!src || failed) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary-light to-cream">
        <Logo size={44} className="opacity-40 grayscale-[30%]" />
      </div>
    );
  }
  return (
    <div className="relative h-full w-full bg-primary-light">
      <img
        src={src}
        alt={alt}
        loading="lazy"
        onLoad={() => setLoaded(true)}
        onError={() => setFailed(true)}
        className={`h-full w-full object-cover transition-opacity duration-500 ${loaded ? "opacity-100" : "opacity-0"}`}
      />
    </div>
  );
}

function Stepper({ qty, onChange }) {
  if (qty === 0) {
    return (
      <button onClick={() => onChange(1)} className="btn-primary !rounded-full !px-4 !py-2 text-sm">
        <Plus className="h-4 w-4" /> Tambah
      </button>
    );
  }
  return (
    <div className="flex items-center gap-1 rounded-full bg-primary-light p-1">
      <button
        aria-label="Kurangi"
        onClick={() => onChange(qty - 1)}
        className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-primary shadow-sm active:scale-90"
      >
        <Minus className="h-4 w-4" />
      </button>
      <span className="w-7 text-center text-sm font-bold text-primary-dark">{qty}</span>
      <button
        aria-label="Tambah"
        onClick={() => onChange(qty + 1)}
        className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white shadow-sm active:scale-90"
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}

export default function MenuCard({ item, qty, onChange }) {
  const isPackage = item.type === "PACKAGE";
  return (
    <div
      className={`flex gap-3.5 rounded-3xl bg-white p-3 shadow-soft transition-shadow ${
        qty > 0 ? "ring-2 ring-primary/30" : "ring-1 ring-black/[.03]"
      }`}
    >
      <div className="relative h-[104px] w-[104px] shrink-0 overflow-hidden rounded-2xl">
        <Photo src={item.photo} alt={item.name} />
        {isPackage && (
          <span className="absolute left-1.5 top-1.5 rounded-full bg-brand-brown px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white shadow">
            Paket
          </span>
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col justify-between py-0.5">
        <div>
          <p className="line-clamp-2 text-[15px] font-semibold leading-snug text-gray-900">{item.name}</p>
          {item.desc && <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-gray-500">{item.desc}</p>}
        </div>
        <div className="mt-2 flex items-center justify-between gap-2">
          <p className="text-[15px] font-bold text-primary-dark">{formatRupiah(item.price)}</p>
          <Stepper qty={qty} onChange={onChange} />
        </div>
      </div>
    </div>
  );
}
