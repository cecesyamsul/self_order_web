import { Loader2, QrCode, WifiOff } from "lucide-react";
import Logo from "./Logo";

export function FullLoading({ label = "Memuat menu..." }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-5 px-6 text-gray-500">
      <div className="relative">
        <span className="absolute inset-0 animate-ping rounded-full bg-primary/10" />
        <Logo size={96} eager className="relative bg-white shadow-soft animate-float" />
      </div>
      <p className="flex items-center gap-2 text-sm">
        <Loader2 className="h-4 w-4 animate-spin text-primary" />
        {label}
      </p>
    </div>
  );
}

export function FullMessage({ icon = "qr", title, children, action }) {
  const Icon = icon === "wifi" ? WifiOff : QrCode;
  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-6 text-center animate-fade-up">
      <Logo size={88} eager className="mb-6 bg-white shadow-soft" />
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-light text-primary">
        <Icon className="h-6 w-6" />
      </div>
      <h1 className="font-display text-2xl text-gray-900">{title}</h1>
      <p className="mt-2 text-sm leading-relaxed text-gray-500">{children}</p>
      {action}
    </div>
  );
}
