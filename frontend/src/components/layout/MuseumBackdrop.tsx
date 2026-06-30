import museumHero from "@/assets/nmp-museum-hero.png";
import { cn } from "@/lib/utils";

type MuseumBackdropProps = {
  className?: string;
};

export function MuseumBackdrop({ className }: MuseumBackdropProps) {
  return (
    <div className={cn("museum-backdrop", className)} aria-hidden>
      <svg className="pointer-events-none absolute h-0 w-0" aria-hidden>
        <defs>
          <filter
            id="museum-clarity"
            x="-8%"
            y="-8%"
            width="116%"
            height="116%"
            colorInterpolationFilters="sRGB"
          >
            <feGaussianBlur in="SourceGraphic" stdDeviation="0.55" result="blur" />
            <feComposite
              in="SourceGraphic"
              in2="blur"
              operator="arithmetic"
              k1="0"
              k2="1.45"
              k3="-0.45"
              k4="0"
              result="sharp"
            />
            <feConvolveMatrix
              in="sharp"
              order="3"
              kernelMatrix="0 -0.35 0 -0.35 2.4 -0.35 0 -0.35 0"
              preserveAlpha="true"
            />
          </filter>
        </defs>
      </svg>
      <img
        src={museumHero}
        alt=""
        className="museum-backdrop-image"
        loading="eager"
        decoding="sync"
        fetchPriority="high"
      />
      <div className="museum-backdrop-overlay" />
    </div>
  );
}
