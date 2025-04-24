import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Check, ArrowDownNarrowWide, Plus } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { HabitButton } from "@/components/ui/habit-button";
import { HabitIcon } from "@/components/ui/habit-icon";
import { Skeleton } from "@/components/ui/skeleton";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { Habit } from "@shared/schema";
import { motion } from "framer-motion";
import { EmptyState } from "@/components/ui/empty-state";

export default function TodaysHabits() {
  const [sortBy, setSortBy] = useState<'name' | 'streak'>('name');

  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split('T')[0];

  // Fetch habits
  const { data: habits, isLoading: isLoadingHabits } = useQuery<Habit[]>({
    queryKey: ['/api/habits'],
  });

  // Fetch today's completions
  const { data: completions, isLoading: isLoadingCompletions } = useQuery<any[]>({
    queryKey: ['/api/completions', today],
    queryFn: async () => {
      const res = await fetch(`/api/completions?startDate=${today}&endDate=${today}`);
      if (!res.ok) throw new Error('Failed to fetch completions');
      return res.json();
    }
  });

  // Fetch habit stats
  const { data: stats, isLoading: isLoadingStats } = useQuery<any[]>({
    queryKey: ['/api/stats'],
  });

  // Mutation for toggling habit completion
  const toggleCompletionMutation = useMutation({
    mutationFn: async ({ habitId, completed }: { habitId: number, completed: boolean }) => {
      return apiRequest('POST', '/api/completions', {
        habitId,
        date: today,
        completed,
        notes: null
      });
    },
    onSuccess: () => {
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/completions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/completions', today] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
    },
  });

  // Get completion status for a habit
  const getHabitCompletion = (habitId: number) => {
    if (!completions) return false;
    const completion = completions.find(c => c.habitId === habitId);
    return completion ? completion.completed : false;
  };

  // Get current streak for a habit
  const getHabitStreak = (habitId: number) => {
    if (!stats) return 0;
    const stat = stats.find(s => s.habitId === habitId);
    return stat ? stat.currentStreak : 0;
  };

  // Toggle habit completion
  const toggleHabitCompletion = (habitId: number, currentValue: boolean) => {
    toggleCompletionMutation.mutate({
      habitId,
      completed: !currentValue
    });
  };

  // Sort habits
  const sortedHabits = () => {
    if (!habits) return [];
    return [...habits].sort((a, b) => {
      if (sortBy === 'streak') {
        return getHabitStreak(b.id) - getHabitStreak(a.id);
      } else {
        return a.name.localeCompare(b.name);
      }
    });
  };

  const isLoading = isLoadingHabits || isLoadingCompletions || isLoadingStats;

  if (isLoading) {
    return (
      <Card className="mb-6">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Today's Habits</CardTitle>
            <Skeleton className="h-8 w-24" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Skeleton className="h-10 w-10 rounded-md mr-4" />
                    <div>
                      <Skeleton className="h-5 w-40 mb-1" />
                      <Skeleton className="h-4 w-20" />
                    </div>
                  </div>
                  <div className="flex items-center">
                    <Skeleton className="h-10 w-20 mr-6 hidden sm:block" />
                    <Skeleton className="h-10 w-10 rounded-md" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { 
      y: 20, 
      opacity: 0,
      scale: 0.95 
    },
    visible: { 
      y: 0, 
      opacity: 1,
      scale: 1,
      transition: { 
        type: "spring", 
        stiffness: 300, 
        damping: 20 
      }
    },
    hover: {
      scale: 1.02,
      boxShadow: "0px 8px 15px rgba(0,0,0,0.05)",
      borderColor: "var(--primary)",
      transition: {
        type: "spring",
        stiffness: 500,
        damping: 15
      }
    }
  };
  
  const streakCounterVariants = {
    hidden: { scale: 0, opacity: 0 },
    visible: { 
      scale: 1, 
      opacity: 1,
      transition: { 
        type: "spring", 
        stiffness: 500, 
        damping: 10,
        delay: 0.2
      } 
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex justify-between items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <CardTitle>Today's Habits</CardTitle>
          </motion.div>
          {habits && habits.length > 0 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              whileHover={{ scale: 1.05 }}
            >
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-primary hover:text-primary/80 text-sm font-medium"
                onClick={() => setSortBy(sortBy === 'name' ? 'streak' : 'name')}
              >
                <motion.div 
                  animate={{ rotate: sortBy === 'streak' ? 180 : 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <ArrowDownNarrowWide className="h-4 w-4 mr-1" />
                </motion.div>
                {sortBy === 'name' ? 'Sort by name' : 'Sort by streak'}
              </Button>
            </motion.div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {habits && habits.length > 0 ? (
          <motion.div 
            className="space-y-3"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {sortedHabits().map((habit, index) => {
              const isCompleted = getHabitCompletion(habit.id);
              const streak = getHabitStreak(habit.id);
              
              return (
                <motion.div 
                  key={habit.id} 
                  className="border border-gray-200 rounded-lg p-4 flex items-center justify-between"
                  variants={itemVariants}
                  whileHover="hover"
                  custom={index}
                  style={{ perspective: "1000px" }}
                >
                  <div className="flex items-center">
                    <HabitIcon icon={habit.icon as any} color={habit.color} />
                    <div className="ml-4">
                      <h4 className="text-base font-medium text-gray-800">{habit.name}</h4>
                      <p className="text-sm text-gray-500">{habit.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <motion.div 
                      className="text-right mr-6 hidden sm:block"
                      variants={streakCounterVariants}
                    >
                      <p className="text-sm font-medium text-gray-800">Current Streak</p>
                      <p className="text-2xl font-bold text-primary">{streak} days</p>
                    </motion.div>
                    <HabitButton 
                      completed={isCompleted}
                      size="icon"
                      onClick={() => toggleHabitCompletion(habit.id, isCompleted)}
                      disabled={toggleCompletionMutation.isPending}
                    >
                      <Check className="h-6 w-6" />
                    </HabitButton>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        ) : (
          <EmptyState
            title="No habits yet"
            description="Create your first habit to start tracking your progress"
            animationType="habits"
            actionLabel="Add Habit"
            onAction={() => document.dispatchEvent(new CustomEvent('open-add-habit'))}
          />
        )}
      </CardContent>
    </Card>
  );
}
