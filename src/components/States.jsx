import { Loader2, QrCode, WifiOff } from "lucide-react";

export function FullLoading({ label = "Memuat menu..." }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 text-gray-500">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="text-sm">{label}</p>
    </div>
  );
}

export function FullMessage({ icon = "qr", title, children, action }) {
  const Icon = icon === "wifi" ? WifiOff : QrCode;
  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-6 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-light text-primary">
        <Icon className="h-8 w-8" />
      </div>
      <h1 className="text-lg font-bold text-gray-900">{title}</h1>
      <p className="mt-2 text-sm text-gray-500">{children}</p>
      {action}
    </div>
  );
}
