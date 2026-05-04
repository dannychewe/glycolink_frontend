import { cn } from "@/lib/utils/cn";

type ContainerProps = Readonly<{
  children: React.ReactNode;
  className?: string;
  as?: React.ElementType;
}>;

export function Container({ children, className, as: Component = "div" }: ContainerProps) {
  return <Component className={cn("container w-full", className)}>{children}</Component>;
}
