import { QRCodeSVG } from "qrcode.react";

// `value` is the attendance link that gets encoded in the QR code.
export default function AttendanceQRCode({
  value,
  size = 208,
  label = "Scan to mark attendance",
  caption,
}) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-ink-200/80 bg-white p-5 text-center dark:border-ink-800 dark:bg-white">
      <QRCodeSVG
        value={value}
        size={size}
        level="H"
        marginSize={1}
        bgColor="#ffffff"
        fgColor="#0f1219"
        title={label}
      />
      <p className="mt-4 text-[13px] font-bold text-ink-900">{label}</p>
      {caption && (
        <p className="mt-1 max-w-[15rem] text-[11.5px] text-ink-500">{caption}</p>
      )}
    </div>
  );
}
