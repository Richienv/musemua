import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90 rounded-md",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-md",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground rounded-md",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-md",
        ghost: "hover:bg-accent hover:text-accent-foreground rounded-md",
        link: "text-primary underline-offset-4 hover:underline",
        
        // Old Money Luxury Variants
        luxury: "bg-old-money-navy text-old-money-ivory font-body font-medium tracking-wider uppercase text-sm transition-all duration-500 ease-out hover:bg-old-money-charcoal hover:tracking-wide border border-transparent",
        "luxury-outline": "bg-transparent text-old-money-navy border-old-money-navy font-body font-medium tracking-wider uppercase text-sm transition-all duration-500 ease-out hover:bg-old-money-navy hover:text-old-money-ivory hover:tracking-wide",
        "luxury-sage": "bg-old-money-sage text-old-money-navy font-body font-medium tracking-wider uppercase text-sm transition-all duration-500 ease-out hover:bg-old-money-navy hover:text-old-money-ivory border border-transparent",
        "luxury-ghost": "bg-transparent text-old-money-navy font-body font-medium tracking-wide uppercase text-sm transition-all duration-500 ease-out hover:text-old-money-charcoal hover:tracking-wider",
        
        // Editorial Variants
        editorial: "bg-old-money-navy text-old-money-ivory font-editorial font-medium text-base transition-all duration-500 ease-out hover:bg-old-money-charcoal rounded-sm",
        "editorial-outline": "bg-transparent text-old-money-navy border-2 border-old-money-navy font-editorial font-medium text-base transition-all duration-500 ease-out hover:bg-old-money-navy hover:text-old-money-ivory rounded-sm",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 px-3 py-1 text-xs",
        lg: "h-12 px-8 py-3",
        xl: "h-14 px-10 py-4 text-base",
        
        // Luxury Sizes
        "luxury-sm": "h-10 px-6 py-2",
        "luxury-default": "h-12 px-8 py-3",
        "luxury-lg": "h-14 px-10 py-4",
        
        // Editorial Sizes
        "editorial-sm": "h-10 px-6 py-2",
        "editorial-default": "h-12 px-8 py-3",
        "editorial-lg": "h-16 px-12 py-4",
        
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
