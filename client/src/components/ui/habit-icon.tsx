import * as React from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { 
  Moon, 
  BookOpen, 
  Zap, 
  Languages, 
  Dumbbell, 
  Coffee, 
  Bike, 
  Music, 
  Pencil, 
  Heart, 
  Timer, 
  Code,
  LucideIcon,
  LucideProps
} from "lucide-react";

export type HabitIconType = 
  | "meditation"
  | "book"
  | "exercise"
  | "language"
  | "workout"
  | "coffee"
  | "bike"
  | "music"
  | "write"
  | "health"
  | "timer"
  | "code";

interface HabitIconProps extends React.HTMLAttributes<HTMLDivElement> {
  icon: HabitIconType;
  color?: string;
  size?: number;
  iconProps?: LucideProps;
}

const iconMap: Record<HabitIconType, LucideIcon> = {
  meditation: Moon,
  book: BookOpen,
  exercise: Zap,
  language: Languages,
  workout: Dumbbell,
  coffee: Coffee,
  bike: Bike,
  music: Music,
  write: Pencil,
  health: Heart,
  timer: Timer,
  code: Code
};

const colorMap: Record<string, string> = {
  green: "bg-green-100 text-secondary",
  blue: "bg-indigo-100 text-primary",
  orange: "bg-orange-100 text-accent",
  yellow: "bg-yellow-100 text-warning",
  red: "bg-red-100 text-destructive",
  purple: "bg-purple-100 text-purple-600",
};

// Motion variants for the icon container
const containerVariants = {
  initial: { 
    opacity: 0, 
    y: 10,
    rotateY: 90 
  },
  animate: { 
    opacity: 1, 
    y: 0,
    rotateY: 0,
    transition: { 
      type: "spring", 
      stiffness: 300, 
      damping: 20,
      delay: 0.1
    } 
  },
  hover: { 
    scale: 1.05,
    boxShadow: "0px 5px 15px rgba(0,0,0,0.1)",
    y: -5,
    transition: { 
      type: "spring", 
      stiffness: 500, 
      damping: 10 
    }
  }
};

// Motion variants for the icon itself
const iconVariants = {
  initial: { scale: 0.8 },
  animate: { 
    scale: 1,
    transition: { 
      type: "spring", 
      stiffness: 500, 
      delay: 0.2
    }
  },
  hover: { 
    rotate: [0, -10, 10, -5, 5, 0],
    transition: { 
      duration: 0.5,
      ease: "easeInOut" 
    }
  }
};

export const HabitIcon = React.forwardRef<HTMLDivElement, HabitIconProps>(
  ({ icon, color = "blue", size = 6, iconProps, className, ...props }, ref) => {
    const IconComponent = iconMap[icon] || Moon; // Default to Moon if icon not found
    const colorClass = colorMap[color] || colorMap.blue; // Default to blue if color not found

    return (
      <motion.div
        ref={ref}
        className={cn(
          `flex-shrink-0 h-12 w-12 flex items-center justify-center ${colorClass} rounded-lg shadow-sm`,
          className
        )}
        variants={containerVariants}
        initial="initial"
        animate="animate"
        whileHover="hover"
        style={{ perspective: "500px" }}
        {...props}
      >
        <motion.div
          variants={iconVariants}
          className="flex items-center justify-center"
        >
          <IconComponent className={`h-${size} w-${size}`} {...iconProps} />
        </motion.div>
      </motion.div>
    );
  }
);

HabitIcon.displayName = "HabitIcon";
