import * as React from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export type HabitStatus = "completed" | "missed" | "inactive";

export interface HabitGridCellProps extends React.HTMLAttributes<HTMLDivElement> {
  status: HabitStatus;
  onToggle?: () => void;
}

const HabitGridCell = React.forwardRef<HTMLDivElement, HabitGridCellProps>(
  ({ status, onToggle, className, ...props }, ref) => {
    const getStatusClass = () => {
      switch (status) {
        case "completed":
          return "habit-grid-cell completed";
        case "missed":
          return "habit-grid-cell missed";
        case "inactive":
          return "habit-grid-cell inactive";
        default:
          return "habit-grid-cell";
      }
    };

    // Different animations based on status
    const getVariants = () => {
      switch (status) {
        case "completed":
          return {
            initial: { scale: 0 },
            animate: { 
              scale: 1,
              transition: { 
                type: "spring", 
                stiffness: 500, 
                damping: 15 
              }
            },
            hover: { 
              scale: 1.1,
              boxShadow: "0px 5px 10px rgba(0,0,0,0.1)"
            }
          };
        case "missed":
          return {
            initial: { scale: 0 },
            animate: { 
              scale: 1,
              transition: { 
                type: "spring", 
                stiffness: 300, 
                damping: 20 
              }
            },
            hover: { 
              scale: 1.1,
              rotate: [0, -5, 5, 0],
              transition: {
                rotate: {
                  repeat: Infinity,
                  repeatType: "reverse",
                  duration: 1
                }
              }
            }
          };
        case "inactive":
          return {
            initial: { scale: 0.8, opacity: 0.5 },
            animate: { 
              scale: 1, 
              opacity: 0.7,
              transition: { 
                type: "spring", 
                stiffness: 200, 
                damping: 25 
              }
            }
          };
        default:
          return {
            initial: { scale: 0 },
            animate: { scale: 1 }
          };
      }
    };

    return (
      <motion.div
        ref={ref}
        className={cn(getStatusClass(), className)}
        onClick={status !== "inactive" ? onToggle : undefined}
        variants={getVariants()}
        initial="initial"
        animate="animate"
        whileHover={status !== "inactive" ? "hover" : undefined}
        whileTap={{ scale: 0.9 }}
        {...props}
      />
    );
  }
);

HabitGridCell.displayName = "HabitGridCell";

export { HabitGridCell };

export function HabitGridStyles() {
  return (
    <style dangerouslySetInnerHTML={{ __html: `
      .habit-grid-cell {
        position: relative;
        width: 30px;
        height: 30px;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.2s;
        perspective: 500px;
      }
      .habit-grid-cell::after {
        content: '';
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 22px;
        height: 22px;
        border-radius: 6px;
        transition: all 0.2s;
        box-shadow: 0 2px 5px rgba(0,0,0,0.1);
      }
      .habit-grid-cell.completed::after {
        background-color: hsl(var(--secondary));
        box-shadow: 0 3px 8px rgba(16, 185, 129, 0.3);
      }
      .habit-grid-cell.missed::after {
        background-color: hsl(var(--destructive));
        box-shadow: 0 3px 8px rgba(239, 68, 68, 0.3);
      }
      .habit-grid-cell.inactive::after {
        background-color: #E5E7EB;
        box-shadow: 0 2px 3px rgba(0,0,0,0.05);
      }
      .habit-grid-cell:hover::after {
        transform: translate(-50%, -50%) scale(1.1);
      }
      .habit-grid-cell.completed:hover::after {
        box-shadow: 0 5px 12px rgba(16, 185, 129, 0.4);
      }
    ` }} />
  );
}
