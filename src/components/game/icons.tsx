import type { ElementId } from "@/game/content";

/* All icons are hand-drawn inline SVG — stroke-based, inherit currentColor. */

interface IconProps {
  size?: number;
  className?: string;
  strokeWidth?: number;
}

function base(props: IconProps) {
  const { size = 18, className, strokeWidth = 1.8 } = props;
  return {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className,
    "aria-hidden": true,
  };
}

/* ------------------------------ Element glyphs ------------------------------ */

export function FireIcon(p: IconProps) {
  return (
    <svg {...base(p)}>
      <path d="M12 3c1 3-3 4.5-3 8a3.9 3.9 0 0 0 1.2 2.9C10 12.5 11 11.6 11 10c2.5 1.5 4.5 3.6 4.5 6.2A5.6 5.6 0 0 1 12 21.5 6.3 6.3 0 0 1 6 15c0-5 4.5-7 6-12z" />
      <path d="M12 21.5c-1.6-.8-2.4-2.3-2-4 .3-1.3 1.4-2 2-3.4.8 1.5 2.2 2.4 2.3 4.2.1 1.5-.8 2.6-2.3 3.2z" />
    </svg>
  );
}

export function IceIcon(p: IconProps) {
  return (
    <svg {...base(p)}>
      <path d="M12 2v20M4.5 6.5l15 11M19.5 6.5l-15 11" />
      <path d="M12 2l-2.4 2.6M12 2l2.4 2.6M12 22l-2.4-2.6M12 22l2.4-2.6" />
    </svg>
  );
}

export function BoltIcon(p: IconProps) {
  return (
    <svg {...base(p)}>
      <path d="M13.5 2 5 13.5h5L9.5 22 19 10h-5.5L13.5 2z" />
    </svg>
  );
}

export function EarthIcon(p: IconProps) {
  return (
    <svg {...base(p)}>
      <path d="M3.5 19 9 8l3.5 5L16 7l4.5 12z" />
      <path d="M2 19h20" />
    </svg>
  );
}

export function ShadowIcon(p: IconProps) {
  return (
    <svg {...base(p)}>
      <path d="M19.5 14.5A8.5 8.5 0 0 1 9.5 4.3a8.5 8.5 0 1 0 10 10.2z" />
      <path d="M15 5.5h.01M18.5 8.5h.01" />
    </svg>
  );
}

export function LightIcon(p: IconProps) {
  return (
    <svg {...base(p)}>
      <circle cx="12" cy="12" r="4.2" />
      <path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5 5l2.1 2.1M16.9 16.9 19 19M19 5l-2.1 2.1M7.1 16.9 5 19" />
    </svg>
  );
}

export function TimeIcon(p: IconProps) {
  return (
    <svg {...base(p)}>
      <path d="M6.5 2.5h11M6.5 21.5h11" />
      <path d="M8 2.5v3.2c0 2.8 4 4.3 4 6.3s-4 3.5-4 6.3v3.2M16 2.5v3.2c0 2.8-4 4.3-4 6.3s4 3.5 4 6.3v3.2" />
    </svg>
  );
}

export function VoidIcon(p: IconProps) {
  return (
    <svg {...base(p)}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 6.5a5.5 5.5 0 0 1 5.5 5.5M12 9.5a2.5 2.5 0 0 1 2.5 2.5M12 17.5A5.5 5.5 0 0 1 6.5 12" />
      <circle cx="12" cy="12" r="0.6" fill="currentColor" />
    </svg>
  );
}

export function ArcaneIcon(p: IconProps) {
  return (
    <svg {...base(p)}>
      <path d="M12 21 4 5l8 4 8-4-8 16z" />
      <path d="M12 9v6" />
    </svg>
  );
}

export function BloodIcon(p: IconProps) {
  return (
    <svg {...base(p)}>
      <path d="M12 2.5s7 7.5 7 12.2a7 7 0 0 1-14 0C5 10 12 2.5 12 2.5z" />
      <path d="M9.5 13.5c0 1.8 1 3.2 2.5 3.7" />
      <path d="M12 7.5v4" opacity="0.7" />
    </svg>
  );
}

export function NatureIcon(p: IconProps) {
  return (
    <svg {...base(p)}>
      <path d="M12 21v-8" />
      <path d="M12 13c0-4 2.6-6.6 7-7-.4 4.6-3 7-7 7z" />
      <path d="M12 13c0-3-2-5-5.4-5.3.3 3.6 2.2 5.3 5.4 5.3z" />
      <circle cx="7" cy="19" r="0.7" fill="currentColor" />
      <circle cx="17.5" cy="18" r="0.7" fill="currentColor" />
    </svg>
  );
}

/* Patch 9.0 — wind & sonic glyphs */
export function WindIcon(p: IconProps) {
  return (
    <svg {...base(p)}>
      <path d="M3 8h10.5a2.75 2.75 0 1 0-2.7-3.3" />
      <path d="M3 12.5h14.5a2.9 2.9 0 1 1-2.8 3.6" />
      <path d="M3 17h7.5a2.3 2.3 0 1 1-2.2 2.9" />
    </svg>
  );
}

export function SonicIcon(p: IconProps) {
  return (
    <svg {...base(p)}>
      <circle cx="8" cy="12" r="1.6" fill="currentColor" stroke="none" />
      <path d="M11.5 8.2a5.4 5.4 0 0 1 0 7.6M14.4 5.4a9.4 9.4 0 0 1 0 13.2" />
      <path d="M17.3 2.8a13.2 13.2 0 0 1 0 18.4" opacity="0.55" />
    </svg>
  );
}

/* Patch 9.0 — rotate-your-screen glyph (forced-landscape overlay) */
export function RotateIcon(p: IconProps) {
  return (
    <svg {...base(p)}>
      <rect x="7" y="3" width="10" height="18" rx="2.2" />
      <path d="M10.8 18.6h2.4" />
      <path d="M20.5 8.5a9 9 0 0 1 1 4.5M21.5 6.5v3h-3" />
    </svg>
  );
}

export function SpellIcon({ id, ...p }: IconProps & { id: ElementId }) {
  switch (id) {
    case "fire": return <FireIcon {...p} />;
    case "ice": return <IceIcon {...p} />;
    case "lightning": return <BoltIcon {...p} />;
    case "earth": return <EarthIcon {...p} />;
    case "shadow": return <ShadowIcon {...p} />;
    case "light": return <LightIcon {...p} />;
    case "time": return <TimeIcon {...p} />;
    case "void": return <VoidIcon {...p} />;
    case "arcane": return <ArcaneIcon {...p} />;
    case "blood": return <BloodIcon {...p} />;
    case "nature": return <NatureIcon {...p} />;
    case "wind": return <WindIcon {...p} />;
    case "sonic": return <SonicIcon {...p} />;
  }
}

/* -------------------------------- Boon icons -------------------------------- */

export function BoonIcon({ name, ...p }: IconProps & { name: string }) {
  switch (name) {
    case "sword":
      return (
        <svg {...base(p)}>
          <path d="M4 20l2.5-2.5M14.5 4 20 3l-1 5.5L8.5 19 5 15.5 14.5 4z" />
          <path d="M5 15.5 4 20l4.5-1" />
        </svg>
      );
    case "hourglass": return <TimeIcon {...p} />;
    case "heart":
      return (
        <svg {...base(p)}>
          <path d="M12 20.5S3.5 15 3.5 8.9A4.6 4.6 0 0 1 12 6.4a4.6 4.6 0 0 1 8.5 2.5c0 6.1-8.5 11.6-8.5 11.6z" />
        </svg>
      );
    case "leaf":
      return (
        <svg {...base(p)}>
          <path d="M5 19C5 9 11 4.5 20 4c-.5 9-5 15-15 15z" />
          <path d="M5 19c2-5.5 5.5-9.5 10-12" />
        </svg>
      );
    case "drop":
      return (
        <svg {...base(p)}>
          <path d="M12 3s6.5 7 6.5 11.5a6.5 6.5 0 0 1-13 0C5.5 10 12 3 12 3z" />
          <path d="M9 14.5a3 3 0 0 0 2 2.8" />
        </svg>
      );
    case "mind":
      return (
        <svg {...base(p)}>
          <path d="M12 3a9 9 0 1 0 9 9" />
          <path d="M12 7a5 5 0 1 0 5 5" />
          <circle cx="12" cy="12" r="1" fill="currentColor" />
        </svg>
      );
    case "boot":
      return (
        <svg {...base(p)}>
          <path d="M6 3h6v8l6 4.5c1 .8.5 3.5-1.5 3.5H6z" />
          <path d="M6 14h5" />
        </svg>
      );
    case "star":
      return (
        <svg {...base(p)}>
          <path d="m12 2.8 2.6 5.6 6.1.7-4.5 4.2 1.2 6-5.4-3-5.4 3 1.2-6L3.3 9.1l6.1-.7L12 2.8z" />
        </svg>
      );
    case "arrows":
      return (
        <svg {...base(p)}>
          <path d="M3 12h18M3 12l4-4M3 12l4 4M21 12l-4-4M21 12l-4 4" />
        </svg>
      );
    case "rings":
      return (
        <svg {...base(p)}>
          <circle cx="9" cy="12" r="5.5" />
          <circle cx="15" cy="12" r="5.5" />
        </svg>
      );
    case "shield":
      return (
        <svg {...base(p)}>
          <path d="M12 3 5 5.5v6c0 4.6 3 8.1 7 9.5 4-1.4 7-4.9 7-9.5v-6L12 3z" />
          <path d="M9 11.5l2.2 2.2L15.5 9" />
        </svg>
      );
    case "settings":
      return (
        <svg {...base(p)}>
          <circle cx="12" cy="12" r="3.2" />
          <path d="M12 2.8v3M12 18.2v3M2.8 12h3M18.2 12h3M5.5 5.5l2.1 2.1M16.4 16.4l2.1 2.1M18.5 5.5l-2.1 2.1M7.6 16.4l-2.1 2.1" />
        </svg>
      );
    case "bolt": return <BoltIcon {...p} />;
    case "fang":
      return (
        <svg {...base(p)}>
          <path d="M7 3c-1 6 1 14 5 18 4-4 6-12 5-18-2.5 2-7.5 2-10 0z" />
          <path d="M12 8v6" />
        </svg>
      );
    case "gem":
      return (
        <svg {...base(p)}>
          <path d="M7 3h10l4 6-9 12L3 9l4-6z" />
          <path d="M3 9h18M12 21 8.5 9 12 3l3.5 6L12 21z" />
        </svg>
      );
    case "fan":
      return (
        <svg {...base(p)}>
          <path d="M12 20 5 4.5M12 20 12 3M12 20l7-15.5" />
          <path d="M8.6 8.5a9 9 0 0 1 6.8 0" opacity="0.75" />
          <circle cx="12" cy="20" r="1" fill="currentColor" />
        </svg>
      );
    case "target":
      return (
        <svg {...base(p)}>
          <circle cx="12" cy="12" r="8" />
          <circle cx="12" cy="12" r="3.6" />
          <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
          <circle cx="12" cy="12" r="0.7" fill="currentColor" />
        </svg>
      );
    case "reach":
      return (
        <svg {...base(p)}>
          <path d="M3 12h13M13 8.5 16.5 12 13 15.5" />
          <path d="M19 5v14" opacity="0.7" />
          <circle cx="5.5" cy="12" r="1.6" />
        </svg>
      );
    case "hand":
      return (
        <svg {...base(p)}>
          <path d="M8 12V5.8a1.5 1.5 0 0 1 3 0V11m0-5.2a1.5 1.5 0 0 1 3 0V11m0-3.7a1.5 1.5 0 0 1 3 0V13c0 4.5-2.5 8-6.5 8-3 0-4.6-1.6-6-4.5L3 13.6a1.6 1.6 0 0 1 2.6-1.8L8 14" />
        </svg>
      );
    case "volley":
      return (
        <svg {...base(p)}>
          <path d="M4 17 18 5M4 17l3.5-.8M4 17l.8-3.5" />
          <circle cx="7.5" cy="8" r="1.4" />
          <circle cx="11" cy="12.5" r="1.4" />
          <circle cx="16.5" cy="9.5" r="1.4" />
          <circle cx="14.5" cy="17" r="1.4" />
        </svg>
      );
    default: return <SpellIcon id="void" {...p} />;
  }
}

/* --------------------------------- UI icons --------------------------------- */

export function UiIcon({ name, ...p }: IconProps & { name: string }) {
  switch (name) {
    case "pause":
      return (
        <svg {...base(p)}>
          <path d="M8.5 5v14M15.5 5v14" strokeWidth={2.4} />
        </svg>
      );
    case "play":
      return (
        <svg {...base(p)}>
          <path d="M7 4.5 19 12 7 19.5z" />
        </svg>
      );
    case "sound":
      return (
        <svg {...base(p)}>
          <path d="M4 9.5v5h3.5L12 19V5L7.5 9.5H4z" />
          <path d="M15.5 9a4.5 4.5 0 0 1 0 6M18 6.5a8 8 0 0 1 0 11" />
        </svg>
      );
    case "mute":
      return (
        <svg {...base(p)}>
          <path d="M4 9.5v5h3.5L12 19V5L7.5 9.5H4z" />
          <path d="m16 9.5 5 5M21 9.5l-5 5" />
        </svg>
      );
    case "skull":
      return (
        <svg {...base(p)}>
          <path d="M12 2.5a8 8 0 0 0-8 8c0 2.9 1.5 5 3.5 6.4V20a1.5 1.5 0 0 0 1.5 1.5h6A1.5 1.5 0 0 0 16.5 20v-3.1c2-1.4 3.5-3.5 3.5-6.4a8 8 0 0 0-8-8z" />
          <circle cx="8.8" cy="11" r="1.7" fill="currentColor" stroke="none" />
          <circle cx="15.2" cy="11" r="1.7" fill="currentColor" stroke="none" />
          <path d="M10.5 21v-2.4M13.5 21v-2.4M12 14.5l-.9 2h1.8z" />
        </svg>
      );
    case "gem": return <BoonIcon name="gem" {...p} />;
    case "settings": return <BoonIcon name="settings" {...p} />;
    case "shield": return <BoonIcon name="shield" {...p} />;
    case "heart": return <BoonIcon name="heart" {...p} />;
    case "sword": return <BoonIcon name="sword" {...p} />;
    /* Patch 10.1 — bolt glyph for the attunement status chip */
    case "bolt": return <BoonIcon name="bolt" {...p} />;
    case "book":
      return (
        <svg {...base(p)}>
          <path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v17.5H6.5A2.5 2.5 0 0 0 4 22z" />
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M8 6.5h8M8 10h5" />
        </svg>
      );
    case "dice":
      return (
        <svg {...base(p)}>
          <rect x="3.5" y="3.5" width="17" height="17" rx="3" />
          <circle cx="8.5" cy="8.5" r="1.1" fill="currentColor" stroke="none" />
          <circle cx="15.5" cy="15.5" r="1.1" fill="currentColor" stroke="none" />
          <circle cx="15.5" cy="8.5" r="1.1" fill="currentColor" stroke="none" />
          <circle cx="8.5" cy="15.5" r="1.1" fill="currentColor" stroke="none" />
        </svg>
      );
    case "gate":
      return (
        <svg {...base(p)}>
          <path d="M4 21V8l8-5 8 5v13" />
          <path d="M9 21v-8a3 3 0 0 1 6 0v8M2 21h20" />
        </svg>
      );
    case "refresh":
      return (
        <svg {...base(p)}>
          <path d="M20 5v5h-5" />
          <path d="M20 10a8 8 0 1 0 2 5.3" opacity="0" />
          <path d="M19.5 10A8 8 0 1 0 20 14" />
        </svg>
      );
    case "wave":
      return (
        <svg {...base(p)}>
          <path d="M2.5 12c1.6-4 3.2-6 4.8-6s3.2 2 4.7 6 3.1 6 4.7 6 3.2-2 4.8-6" />
        </svg>
      );
    /* Patch 10.1 — fullscreen toggle glyphs (four-corner arrows) */
    case "expand":
      return (
        <svg {...base(p)}>
          <path d="M14 4h6v6M10 4H4v6M14 20h6v-6M10 20H4v-6" />
        </svg>
      );
    case "compress":
      return (
        <svg {...base(p)}>
          <path d="M20 14h-6v6M4 14h6v6M20 10h-6V4M4 10h6V4" />
        </svg>
      );
    default: return null;
  }
}
