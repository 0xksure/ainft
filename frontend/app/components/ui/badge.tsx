import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "./utils";

const badgeVariants = cva(
    "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2",
    {
        variants: {
            variant: {
                default:
                    "border-transparent bg-gray-700 text-white",
                secondary:
                    "border-transparent bg-sky-800 text-sky-100",
                destructive:
                    "border-transparent bg-red-900 text-red-100",
                outline: "text-sky-400 border-sky-800",
            },
        },
        defaultVariants: {
            variant: "default",
        },
    }
);

export interface BadgeProps
    extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> { }

function Badge({ className, variant, ...props }: BadgeProps) {
    return (
        <div className={cn(badgeVariants({ variant }), className)} {...props} />
    );
}

export { Badge, badgeVariants }; 