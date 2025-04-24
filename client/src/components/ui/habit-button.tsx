import React, { useState } from 'react';
import { Button, ButtonProps } from '@/components/ui/button';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

const habitButtonVariants = cva(
  "flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        completed: "bg-secondary text-white shadow-sm hover:bg-green-600 transition-colors",
        incomplete: "bg-gray-200 text-gray-600 shadow-sm hover:bg-gray-300 transition-colors",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "incomplete",
      size: "default",
    },
  }
);

export interface HabitButtonProps extends ButtonProps {
  completed?: boolean;
}

const MotionButton = motion(Button);

const HabitButton = React.forwardRef<HTMLButtonElement, HabitButtonProps>(
  ({ className, variant, size, completed = false, ...props }, ref) => {
    const [isHovered, setIsHovered] = useState(false);

    return (
      <MotionButton
        className={cn(habitButtonVariants({ 
          variant: completed ? 'completed' : 'incomplete', 
          size: size || 'default' 
        }), className)}
        ref={ref}
        whileHover={{ 
          scale: 1.05,
          boxShadow: "0px 5px 15px rgba(0,0,0,0.1)"
        }}
        whileTap={{ scale: 0.95 }}
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
        initial={{ opacity: 0, y: 10 }}
        animate={{ 
          opacity: 1, 
          y: completed ? [0, -5, 0] : 0,
          rotateZ: isHovered ? [0, -5, 5, -3, 3, 0] : 0,
          transition: { 
            duration: 0.5,
            rotateZ: { duration: 0.5 },
            y: { duration: 0.3 }
          }
        }}
        {...props}
      />
    );
  }
);

HabitButton.displayName = "HabitButton";

export { HabitButton, habitButtonVariants };
