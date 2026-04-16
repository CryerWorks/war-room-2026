// CornerBrackets — adds L-shaped HUD targeting brackets to all four
// corners of its children. Like the targeting overlay in Division.
// Uses CSS pseudo-elements for top corners and absolute-positioned
// spans for bottom corners (CSS limits pseudo-elements to 2 per element).

interface CornerBracketsProps {
  children: React.ReactNode;
  color?: string;
  className?: string;
}

export default function CornerBrackets({
  children,
  color = "#71717a",
  className = "",
}: CornerBracketsProps) {
  return (
    <div
      className={`corner-brackets ${className}`}
      style={{ "--bracket-color": color } as React.CSSProperties}
    >
      {children}
      {/* Bottom-left corner */}
      <span
        className="absolute bottom-[-1px] left-[-1px] w-3 h-3 pointer-events-none opacity-30 transition-opacity duration-300"
        style={{
          borderBottom: `2px solid ${color}`,
          borderLeft: `2px solid ${color}`,
        }}
      />
      {/* Bottom-right corner */}
      <span
        className="absolute bottom-[-1px] right-[-1px] w-3 h-3 pointer-events-none opacity-30 transition-opacity duration-300"
        style={{
          borderBottom: `2px solid ${color}`,
          borderRight: `2px solid ${color}`,
        }}
      />
    </div>
  );
}
