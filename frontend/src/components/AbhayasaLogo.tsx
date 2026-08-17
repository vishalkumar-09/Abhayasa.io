"use client";

import Image from "next/image";

interface AbhayasaLogoProps {
  /** Controls the rendered width of the wordmark artwork. */
  width?: number;
  /** Optional extra class names on the wrapper element */
  className?: string;
  /** Show only the "A" icon mark (square crop), not the full wordmark */
  iconOnly?: boolean;
  /**
   * Theme variant:
   * - "auto": Uses crisp white logo with purple accent on dark mode, navy logo on light mode
   * - "dark": Always uses crisp white logo with purple accent (for dark backgrounds)
   * - "light": Always uses navy logo (for light backgrounds)
   */
  variant?: "auto" | "dark" | "light";
  /** Whether to append the ".io" domain suffix (default: true) */
  showIo?: boolean;
}

/**
 * Official Abhayasa brand logo component with ".io" brand extension.
 * Uses the exact provided logo asset with high-contrast rendering across dark and light themes.
 */
export function AbhayasaLogo({
  width = 130,
  className = "",
  iconOnly = false,
  variant = "auto",
  showIo = true,
}: AbhayasaLogoProps) {
  // Height calculated from cropped 827x152 content dimensions (~5.44:1 ratio)
  const contentHeight = Math.round(width * (152 / 827));
  const iconSize = Math.round(width * 0.32);

  if (iconOnly) {
    // Show just the "A" mark — square icon container
    return (
      <div
        className={`relative overflow-hidden rounded shrink-0 ${className}`}
        style={{ width: iconSize, height: iconSize }}
      >
        {/* Dark Theme / Default: White with purple dot */}
        <div className={variant === "auto" ? "block light:hidden w-full h-full relative" : variant === "dark" ? "block w-full h-full relative" : "hidden"}>
          <Image
            src="/abhayasa-logo-white-tight.png"
            alt="Abhayasa.io"
            width={width}
            height={contentHeight}
            className="absolute top-0 left-0 h-full w-auto max-w-none"
            priority
            draggable={false}
          />
        </div>
        {/* Light Theme: Navy with purple dot */}
        <div className={variant === "auto" ? "hidden light:block w-full h-full relative" : variant === "light" ? "block w-full h-full relative" : "hidden"}>
          <Image
            src="/abhayasa-logo-tight.png"
            alt="Abhayasa.io"
            width={width}
            height={contentHeight}
            className="absolute top-0 left-0 h-full w-auto max-w-none"
            priority
            draggable={false}
          />
        </div>
      </div>
    );
  }

  // Full horizontal wordmark + .io extension
  const ioFontSize = Math.max(12, Math.round(contentHeight * 0.85));

  return (
    <div className={`relative shrink-0 inline-flex items-center gap-0.5 ${className}`}>
      <div className="relative shrink-0 flex items-center" style={{ width, height: contentHeight }}>
        {/* Dark Theme / Dark background: Crisp white with purple dot */}
        {(variant === "auto" || variant === "dark") && (
          <Image
            src="/abhayasa-logo-white-tight.png"
            alt="Abhayasa"
            width={width}
            height={contentHeight}
            className={`object-contain object-left ${variant === "auto" ? "block light-logo-hide" : "block"}`}
            priority
            draggable={false}
          />
        )}
        {/* Light Theme: Deep navy with purple dot */}
        {(variant === "auto" || variant === "light") && (
          <Image
            src="/abhayasa-logo-tight.png"
            alt="Abhayasa"
            width={width}
            height={contentHeight}
            className={`object-contain object-left ${variant === "auto" ? "hidden light-logo-show" : "block"}`}
            priority
            draggable={false}
          />
        )}
      </div>

      {showIo && (
        <span
          className="font-bold tracking-tight select-none flex items-baseline"
          style={{
            fontSize: `${ioFontSize}px`,
            lineHeight: 1,
            marginTop: "1px",
          }}
        >
          <span className="text-indigo-400">.</span>
          <span className="text-slate-100 light:text-[#031a4a]">io</span>
        </span>
      )}
    </div>
  );
}
