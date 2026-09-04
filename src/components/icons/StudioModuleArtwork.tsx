import type { ReactNode, SVGProps } from "react";

interface StudioModuleArtworkCanvasProps extends SVGProps<SVGSVGElement> {
  readonly artworkId: "prompt" | "animation";
  readonly children: ReactNode;
}

function StudioModuleArtworkCanvas({
  artworkId,
  children,
  ...props
}: StudioModuleArtworkCanvasProps) {
  return (
    <svg
      {...props}
      viewBox="0 0 180 120"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="square"
      strokeLinejoin="miter"
      aria-hidden="true"
      data-studio-artwork={artworkId}
      focusable="false"
    >
      {children}
    </svg>
  );
}

export function PromptStudioArtwork(props: SVGProps<SVGSVGElement>) {
  return (
    <StudioModuleArtworkCanvas artworkId="prompt" {...props}>
      <path d="M13 18h105v77H13V18ZM13 33h105" />
      <path d="M22 25h4M31 25h4M40 25h4" />
      <path d="m26 50 9 8-9 8M44 58h49M44 71h37M26 82h67" />

      <path
        d="M132 25h22v7h7v23h-7v8h-6v10h-10V63h-7v-8h-7V32h8V25Z"
        opacity="0.28"
        fill="currentColor"
        stroke="none"
      />
      <path d="M134 36h17v17h-17V36ZM130 73h26M143 53v20" />
      <path d="M126 42h5M154 42h5M126 50h5M154 50h5" />
      <path d="M139 43h2M146 43h2M141 49h5" />
      <path d="M128 85h7M131.5 81.5v7M153 76h10M158 71v10M145 96h6M148 93v6" />
    </StudioModuleArtworkCanvas>
  );
}

export function AnimationStudioArtwork(props: SVGProps<SVGSVGElement>) {
  return (
    <StudioModuleArtworkCanvas artworkId="animation" {...props}>
      <path d="M11 16h158v88H11V16ZM11 31h158M11 84h158" />
      <path d="M20 24h4M29 24h4M38 24h4" />

      <g opacity="0.24" transform="translate(68 0)">
        <circle cx="48" cy="44" r="8" />
        <path d="M48 52v18M48 57l-12 9M48 57l12 9M48 70l-9 11M48 70l9 11" />
      </g>
      <g opacity="0.48" transform="translate(34 0)">
        <circle cx="48" cy="44" r="8" />
        <path d="M48 52v18M48 57l-12 5M48 57l12 5M48 70l-12 8M48 70l12 8" />
      </g>
      <circle cx="48" cy="44" r="8" />
      <path d="M48 52v18M48 57l-12 2M48 57l12 2M48 70l-12 5M48 70l12 5" />
      <circle cx="48" cy="57" r="2.5" fill="currentColor" stroke="none" />
      <circle cx="36" cy="59" r="2.5" fill="currentColor" stroke="none" />
      <circle cx="60" cy="59" r="2.5" fill="currentColor" stroke="none" />
      <circle cx="36" cy="75" r="2.5" fill="currentColor" stroke="none" />
      <circle cx="60" cy="75" r="2.5" fill="currentColor" stroke="none" />

      <path d="M20 91h18v7H20zM44 91h18v7H44zM68 91h18v7H68zM92 91h18v7H92zM116 91h18v7h-18z" />
      <path d="m146 88 12 7-12 7V88Z" fill="currentColor" stroke="none" />
    </StudioModuleArtworkCanvas>
  );
}
