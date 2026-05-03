import { QRCodeSVG } from "qrcode.react";

interface AttendanceQRCodeProps {
  value: string;
  label?: string;
}

export default function AttendanceQRCode({ value, label = "Scan to mark attendance" }: AttendanceQRCodeProps) {
  return (
    <div className="flex flex-col items-center rounded-3xl border border-neutral-200 bg-white p-5 text-center shadow-sm dark:border-neutral-800 dark:bg-white">
      <QRCodeSVG value={value} size={240} level="H" includeMargin />
      <p className="mt-4 text-sm font-semibold text-black">{label}</p>
      <p className="mt-1 max-w-64 break-all text-xs text-neutral-500">{value}</p>
    </div>
  );
}
