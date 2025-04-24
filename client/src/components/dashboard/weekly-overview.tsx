import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { HabitGridCell, HabitGridStyles, HabitStatus } from "@/components/ui/habit-grid-cell";
import { HabitIcon } from "@/components/ui/habit-icon";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format, startOfWeek, endOfWeek, addDays, subWeeks, addWeeks, isWithinInterval } from "date-fns";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";
import { Habit } from "@shared/schema";

export default function WeeklyOverview() {
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const today = new Date();
    return startOfWeek(today, { weekStartsOn: 1 }); // Monday as start of week
  });
  
  // Calculate weekly range
  const weekStart = format(currentWeekStart, "MMM d");
  const weekEnd = format(endOfWeek(currentWeekStart, { weekStartsOn: 1 }), "MMM d");
  
  // Generate array of weekdays
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const day = addDays(currentWeekStart, i);
    return { 
      date: day,
      shortName: format(day, "EEE").slice(0, 1),
      fullName: format(day, "EEE")
    };
  });

  // Fetch habits
  const { data: habits, isLoading: isLoadingHabits } = useQuery<Habit[]>({
    queryKey: ['/api/habits'],
  });

  // Fetch completions for this week
  const startDateStr = format(currentWeekStart, "yyyy-MM-dd");
  const endDateStr = format(endOfWeek(currentWeekStart, { weekStartsOn: 1 }), "yyyy-MM-dd");
  
  const { data: completions, isLoading: isLoadingCompletions } = useQuery<any[]>({
    queryKey: ['/api/completions', startDateStr, endDateStr],
    queryFn: async () => {
      const res = await fetch(`/api/completions?startDate=${startDateStr}&endDate=${endDateStr}`);
      if (!res.ok) throw new Error('Failed to fetch completions');
      return res.json();
    }
  });

  // Mutation for toggling habit completion
  const toggleCompletionMutation = useMutation({
    mutationFn: async ({ habitId, date, completed }: { habitId: number, date: string, completed: boolean }) => {
      return apiRequest('POST', '/api/completions', {
        habitId,
        date,
        completed,
        notes: null
      });
    },
    onSuccess: () => {
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/completions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/completions', startDateStr, endDateStr] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
    },
  });

  // Get cell status for a habit on a specific day
  const getCellStatus = (habitId: number, date: Date): HabitStatus => {
    // Future dates are inactive
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (date > today) {
      return "inactive";
    }
    
    if (!completions) return "missed";
    
    const dateStr = format(date, "yyyy-MM-dd");
    const completion = completions.find(c => c.habitId === habitId && c.date === dateStr);
    
    return completion?.completed ? "completed" : "missed";
  };

  // Toggle completion status
  const toggleCompletion = (habitId: number, date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Don't allow toggling future dates
    if (date > today) return;
    
    const dateStr = format(date, "yyyy-MM-dd");
    const currentStatus = getCellStatus(habitId, date);
    const newStatus = currentStatus === "completed" ? false : true;
    
    toggleCompletionMutation.mutate({
      habitId,
      date: dateStr,
      completed: newStatus
    });
  };

  // Calculate weekly completion percentage for a habit
  const getWeeklyCompletion = (habitId: number): number => {
    if (!completions) return 0;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Only count days up to today
    const daysToCount = weekDays.filter(day => day.date <= today).length;
    if (daysToCount === 0) return 0;
    
    const habitCompletions = completions.filter(c => c.habitId === habitId && c.completed);
    return Math.round((habitCompletions.length / daysToCount) * 100);
  };

  // Navigate between weeks
  const previousWeek = () => {
    setCurrentWeekStart(prev => subWeeks(prev, 1));
  };

  const nextWeek = () => {
    const proposed = addWeeks(currentWeekStart, 1);
    const today = new Date();
    
    // Don't allow navigating past the current week
    if (isWithinInterval(today, {
      start: proposed,
      end: endOfWeek(proposed, { weekStartsOn: 1 })
    })) {
      setCurrentWeekStart(proposed);
    }
  };

  const isLoading = isLoadingHabits || isLoadingCompletions;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center mb-6">
            <CardTitle>Weekly Overview</CardTitle>
            <Skeleton className="h-8 w-40" />
          </div>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-80 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center mb-6">
          <CardTitle>Weekly Overview</CardTitle>
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="icon" onClick={previousWeek}>
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <span className="text-sm font-medium">{weekStart} - {weekEnd}</span>
            <Button variant="ghost" size="icon" onClick={nextWeek}>
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto pb-2">
          <table className="min-w-full">
            <thead>
              <tr>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4">Habit</th>
                {weekDays.map((day) => (
                  <th 
                    key={day.fullName} 
                    className="text-center py-3 px-2 text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    {day.shortName}
                  </th>
                ))}
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Completion</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {habits?.map((habit) => {
                const completionPercentage = getWeeklyCompletion(habit.id);
                
                return (
                  <tr key={habit.id}>
                    <td className="py-4 px-4">
                      <div className="flex items-center">
                        <HabitIcon 
                          icon={habit.icon as any} 
                          color={habit.color} 
                          size={5}
                          className="h-8 w-8"
                        />
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-800">{habit.name}</p>
                        </div>
                      </div>
                    </td>
                    
                    {weekDays.map((day) => (
                      <td key={day.fullName} className="py-2 px-2 text-center">
                        <HabitGridCell 
                          status={getCellStatus(habit.id, day.date)}
                          onToggle={() => toggleCompletion(habit.id, day.date)}
                        />
                      </td>
                    ))}
                    
                    <td className="py-4 px-4">
                      <div className="flex items-center">
                        <div className="w-32 bg-gray-200 rounded-full h-2.5">
                          <div 
                            className="bg-secondary h-2.5 rounded-full" 
                            style={{ width: `${completionPercentage}%` }}
                          ></div>
                        </div>
                        <span className="ml-3 text-sm font-medium text-gray-800">{completionPercentage}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <HabitGridStyles />
      </CardContent>
    </Card>
  );
}
