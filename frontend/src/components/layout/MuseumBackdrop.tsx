import museumHero from "@/assets/nmp-museum-hero.png";
import { cn } from "@/lib/utils";

type MuseumBackdropProps = {
  variant?: "landing" | "login";
  className?: string;
};

export function MuseumBackdrop({ variant = "landing", className }: MuseumBackdropProps) {
  return (
    <div className={cn("museum-backdrop", className)} aria-hidden>
      <img src={museumHero} alt="" className="museum-backdrop-image" />
      <div
        className={cn(
          "museum-backdrop-overlay",
          variant === "login" && "museum-backdrop-overlay--login",
        )}
      />
    </div>
  );
}
