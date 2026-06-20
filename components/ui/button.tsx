import * as React from "react";
import Link from "next/link";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils/cn";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "bg-primary text-white hover:bg-primary/90",
        secondary: "bg-surface text-text ring-1 ring-border hover:bg-slate-50",
        ghost: "bg-transparent text-text hover:bg-slate-100",
      },
      size: {
        default: "h-11 px-4 py-2",
        lg: "h-12 px-5 py-3 text-sm",
        sm: "h-9 px-3 text-xs",
      },
      fullWidth: {
        true: "w-full",
        false: "",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
      fullWidth: false,
    },
  },
);

type SharedButtonProps = VariantProps<typeof buttonVariants> & {
  className?: string;
};

type ButtonBaseProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  SharedButtonProps & {
    href?: never;
  };

type LinkButtonProps = Omit<React.ComponentPropsWithoutRef<typeof Link>, "className"> &
  SharedButtonProps & {
    href: string;
  };

function isLinkButtonProps(props: ButtonBaseProps | LinkButtonProps): props is LinkButtonProps {
  return "href" in props;
}

export function Button(props: ButtonBaseProps): React.JSX.Element;
export function Button(props: LinkButtonProps): React.JSX.Element;
export function Button(props: ButtonBaseProps | LinkButtonProps) {
  const { className, variant, size, fullWidth } = props;
  const buttonClassName = cn(buttonVariants({ variant, size, fullWidth }), className);

  if (isLinkButtonProps(props)) {
    const {
      className: linkClassName,
      variant: linkVariant,
      size: linkSize,
      fullWidth: linkFullWidth,
      ...linkProps
    } = props;
    void linkClassName;
    void linkVariant;
    void linkSize;
    void linkFullWidth;
    return <Link className={buttonClassName} {...linkProps} />;
  }

  const {
    className: buttonClassNameProp,
    variant: buttonVariant,
    size: buttonSize,
    fullWidth: buttonFullWidth,
    ...buttonProps
  } = props;
  void buttonClassNameProp;
  void buttonVariant;
  void buttonSize;
  void buttonFullWidth;
  return <button className={buttonClassName} {...buttonProps} />;
}
