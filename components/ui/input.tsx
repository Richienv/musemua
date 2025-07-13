import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const inputVariants = cva(
  "flex w-full font-body ring-offset-background file:border-0 file:bg-transparent file:font-medium placeholder:text-muted-foreground focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-300",
  {
    variants: {
      variant: {
        default: "h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        
        // Luxury Variants
        luxury: "h-12 rounded-none border-0 border-b-2 border-black bg-transparent px-0 py-3 text-base focus-visible:border-vogue-gold focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-vogue-silver",
        "luxury-outline": "h-12 rounded-sm border-2 border-black bg-vogue-cream px-4 py-3 text-base focus-visible:border-vogue-gold focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-vogue-silver",
        "luxury-minimal": "h-14 rounded-none border-0 border-b border-vogue-silver bg-transparent px-0 py-4 text-lg focus-visible:border-black focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-vogue-silver/60",
        
        // Editorial Variants
        editorial: "h-12 rounded-sm border border-black bg-white px-4 py-3 text-base font-editorial focus-visible:border-vogue-gold focus-visible:ring-1 focus-visible:ring-vogue-gold focus-visible:ring-offset-0 placeholder:text-vogue-silver placeholder:font-body",
        "editorial-minimal": "h-16 rounded-none border-0 bg-transparent px-0 py-4 text-xl font-editorial border-b-2 border-black focus-visible:border-vogue-gold focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-vogue-silver/60 placeholder:font-body",
      },
      inputSize: {
        default: "text-sm",
        sm: "text-xs h-8",
        lg: "text-base h-12",
        xl: "text-lg h-14",
      },
    },
    defaultVariants: {
      variant: "default",
      inputSize: "default",
    },
  },
);

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement>,
    VariantProps<typeof inputVariants> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, variant, inputSize, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(inputVariants({ variant, inputSize, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
