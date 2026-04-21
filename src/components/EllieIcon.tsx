import ellieImg from "@/assets/ellie.png";
import { cn } from "@/lib/utils";

interface EllieIconProps {
  /** Pixel size (square). Default 20. */
  size?: number;
  className?: string;
  /** Decorative by default; pass alt to make it meaningful for AT. */
  alt?: string;
}

/**
 * Official Coach Ellie identity used everywhere across the app.
 * Single source of truth: the Ellie character image.
 *
 * Renders as an inline image scaled to the requested size so it can be used
 * just like a Lucide icon inside buttons, headings, suggestion chips, etc.
 */
export function EllieIcon({ size = 20, className, alt = "" }: EllieIconProps) {
  return (
    <img
      src={ellieImg}
      alt={alt}
      width={size}
      height={size}
      draggable={false}
      className={cn("inline-block shrink-0 select-none object-contain", className)}
      style={{ width: size, height: size }}
    />
  );
}
