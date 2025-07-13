"use client";

import * as React from "react";
import * as LabelPrimitive from "@radix-ui/react-label";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const labelVariants = cva(
  "leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 transition-all duration-300",
  {
    variants: {
      variant: {
        default: "text-sm font-medium font-body",
        
        // Luxury Variants
        luxury: "font-body font-medium tracking-widest uppercase text-xs text-black",
        "luxury-minimal": "font-body font-normal text-sm text-vogue-silver",
        "luxury-accent": "font-body font-medium tracking-wide uppercase text-xs text-vogue-gold",
        
        // Editorial Variants
        editorial: "font-editorial font-medium text-base text-black",
        "editorial-caption": "font-body font-light tracking-wide uppercase text-xs text-vogue-silver",
        "editorial-title": "font-editorial font-semibold text-lg text-black",
        
        // Form Specific
        "form-luxury": "font-body font-medium tracking-wide uppercase text-xs text-black mb-2 block",
        "form-editorial": "font-editorial font-medium text-sm text-black mb-3 block",
      },
      size: {
        default: "text-sm",
        sm: "text-xs",
        lg: "text-base",
        xl: "text-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> &
    VariantProps<typeof labelVariants>
>(({ className, variant, size, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    className={cn(labelVariants({ variant, size, className }))}
    {...props}
  />
));
Label.displayName = LabelPrimitive.Root.displayName;

export { Label };
