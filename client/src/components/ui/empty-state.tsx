import React, { useState, useEffect } from 'react';
import { Player } from '@lottiefiles/react-lottie-player';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { CircleCheck, PencilLine, BarChartBig, X, FilePlus, FileQuestion, HandHelping } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description: string;
  animationType?: 'habits' | 'stats' | 'calendar' | 'completed' | 'help';
  actionLabel?: string;
  onAction?: () => void;
  variant?: 'default' | 'transparent';
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15
    }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { 
    opacity: 1, 
    y: 0,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 20
    }
  }
};

// Animated icon element that rotates and scales
const AnimatedIcon = ({ icon: Icon, color = "#4f46e5" }: { icon: React.ComponentType<any>; color?: string }) => {
  return (
    <motion.div
      className="rounded-full bg-indigo-50 p-6 w-24 h-24 flex items-center justify-center"
      animate={{ 
        scale: [1, 1.05, 1],
        rotate: [0, 5, 0, -5, 0]
      }}
      transition={{ 
        duration: 6, 
        repeat: Infinity,
        repeatType: "reverse" 
      }}
    >
      <Icon size={48} color={color} />
    </motion.div>
  );
};

export function EmptyState({
  title,
  description,
  animationType = 'habits',
  actionLabel,
  onAction,
  variant = 'default'
}: EmptyStateProps) {
  // Maps animation type to the appropriate icon
  const getIconForType = () => {
    switch (animationType) {
      case 'habits':
        return CircleCheck;
      case 'stats':
        return BarChartBig;
      case 'calendar':
        return PencilLine;
      case 'completed':
        return CircleCheck;
      case 'help':
        return HandHelping;
      default:
        return FileQuestion;
    }
  };
  
  // Color based on animation type
  const getColorForType = () => {
    switch (animationType) {
      case 'habits':
        return "#4f46e5"; // indigo
      case 'stats':
        return "#0ea5e9"; // sky
      case 'calendar':
        return "#8b5cf6"; // violet
      case 'completed':
        return "#10b981"; // emerald
      case 'help':
        return "#f59e0b"; // amber
      default:
        return "#6b7280"; // gray
    }
  };

  return (
    <motion.div
      className={`flex flex-col items-center justify-center p-8 text-center space-y-6 rounded-lg ${
        variant === 'default' ? 'bg-background border border-border shadow-sm' : ''
      }`}
      variants={container}
      initial="hidden"
      animate="show"
    >
      <motion.div 
        className="mb-4"
        variants={item}
        whileHover={{ scale: 1.05 }}
      >
        <AnimatedIcon 
          icon={getIconForType()} 
          color={getColorForType()} 
        />
      </motion.div>
      
      <motion.h3 
        className="text-xl font-semibold" 
        variants={item}
      >
        {title}
      </motion.h3>
      
      <motion.p 
        className="text-muted-foreground max-w-sm" 
        variants={item}
      >
        {description}
      </motion.p>
      
      {actionLabel && onAction && (
        <motion.div 
          variants={item}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Button
            onClick={onAction}
            className="mt-4"
            size="lg"
          >
            {actionLabel}
          </Button>
        </motion.div>
      )}
    </motion.div>
  );
}