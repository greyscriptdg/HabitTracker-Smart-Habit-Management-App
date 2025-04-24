import { useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import HabitForm from "./habit-form";
import { motion } from "framer-motion";

interface AddHabitDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AddHabitDialog({ open, onOpenChange }: AddHabitDialogProps) {
  // Listen for custom events to open the dialog
  useEffect(() => {
    const handleOpenAddHabit = () => {
      onOpenChange(true);
    };
    
    document.addEventListener('open-add-habit', handleOpenAddHabit);
    
    return () => {
      document.removeEventListener('open-add-habit', handleOpenAddHabit);
    };
  }, [onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <DialogTitle className="text-xl font-bold text-gray-800">Create New Habit</DialogTitle>
            <DialogDescription>
              Create a new habit to track. Fill out the details below.
            </DialogDescription>
          </motion.div>
        </DialogHeader>
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ 
            duration: 0.4,
            type: "spring",
            damping: 15
          }}
        >
          <HabitForm 
            onSuccess={() => onOpenChange(false)}
          />
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
