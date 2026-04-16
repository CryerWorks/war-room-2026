// ScanLoader — tactical scanning line animation.
// Replaces boring "Loading..." text with a radar-sweep line.
// Optional label shows small text below the scan line.

interface ScanLoaderProps {
  label?: string;
  color?: string;
}

export default function ScanLoader({ label = "SCANNING", color }: ScanLoaderProps) {
  return (
    <div className="py-8 flex flex-col items-center gap-3">
      <div
        className="scan-loader w-32"
        style={color ? { "--scan-color": color } as React.CSSProperties : undefined}
      />
      <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-zinc-600">
        {label}
      </span>
    </div>
  );
}
