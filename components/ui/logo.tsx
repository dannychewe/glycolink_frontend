import { cn } from "@/lib/utils/cn";

type LogoProps = Readonly<{
  className?: string;
  /**
   * "stacked" (default) is the two-line mark (public/img/logo.svg, viewBox ~2:1) —
   * used in the narrow dashboard sidebars.
   * "horizontal" is the single-line wordmark (public/img/logo_alt.svg, viewBox ~6:1) —
   * used on the public site where there's room to run wide.
   */
  variant?: "stacked" | "horizontal";
}>;

const SRC: Record<NonNullable<LogoProps["variant"]>, string> = {
  stacked: "/img/logo.svg",
  horizontal: "/img/logo_alt.svg",
};

/**
 * Naje Health wordmark. Rendered as a plain <img> (not next/image) to avoid the
 * SVG optimizer config, matching this codebase's existing convention for local SVGs.
 */
export function Logo({ className, variant = "stacked" }: LogoProps) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- avoids next/image SVG/remote config
    <img
      src={SRC[variant]}
      alt="Naje Health"
      className={cn("block h-8 w-auto shrink-0 self-start align-top", className)}
    />
  );
}
