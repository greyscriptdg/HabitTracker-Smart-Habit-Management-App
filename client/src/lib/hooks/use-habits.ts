import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Habit } from "@shared/schema";

export function useHabits() {
  const { toast } = useToast();
  
  // Fetch all habits
  const {
    data: habits,
    isLoading: isLoadingHabits,
    error: habitsError,
  } = useQuery<Habit[]>({
    queryKey: ['/api/habits'],
  });
  
  // Create a new habit
  const createHabitMutation = useMutation({
    mutationFn: async (habitData: any) => {
      return apiRequest("POST", "/api/habits", habitData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/habits"] });
      toast({
        title: "Success!",
        description: "Habit created successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to create habit: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // Update an existing habit
  const updateHabitMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      return apiRequest("PATCH", `/api/habits/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/habits"] });
      toast({
        title: "Success!",
        description: "Habit updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update habit: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // Delete a habit
  const deleteHabitMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/habits/${id}`, null);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/habits"] });
      toast({
        title: "Success!",
        description: "Habit deleted successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete habit: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // Toggle habit completion for a specific date
  const toggleHabitCompletionMutation = useMutation({
    mutationFn: async ({ 
      habitId, 
      date, 
      completed 
    }: { 
      habitId: number; 
      date: Date | string; 
      completed: boolean;
    }) => {
      const dateStr = typeof date === "string" ? date : format(date, "yyyy-MM-dd");
      
      return apiRequest("POST", "/api/completions", {
        habitId,
        date: dateStr,
        completed,
        notes: null
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/completions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update habit completion: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // Get today's completion status
  const today = format(new Date(), "yyyy-MM-dd");
  const { 
    data: todayCompletions,
    isLoading: isLoadingTodayCompletions,
  } = useQuery<any[]>({
    queryKey: ['/api/completions', today],
    queryFn: async () => {
      const res = await fetch(`/api/completions?startDate=${today}&endDate=${today}`);
      if (!res.ok) throw new Error('Failed to fetch completions');
      return res.json();
    }
  });
  
  // Get habit stats
  const {
    data: habitStats,
    isLoading: isLoadingStats,
  } = useQuery<any[]>({
    queryKey: ['/api/stats'],
  });
  
  // Get completion status for a specific habit
  const getHabitCompletion = (habitId: number, date: Date | string = new Date()) => {
    if (!todayCompletions) return false;
    
    const dateStr = typeof date === "string" ? date : format(date, "yyyy-MM-dd");
    const completion = todayCompletions.find(c => c.habitId === habitId && c.date === dateStr);
    
    return completion ? completion.completed : false;
  };
  
  // Get stats for a specific habit
  const getHabitStats = (habitId: number) => {
    if (!habitStats) return null;
    return habitStats.find(s => s.habitId === habitId);
  };
  
  return {
    // Data
    habits,
    todayCompletions,
    habitStats,
    
    // Loading states
    isLoadingHabits,
    isLoadingTodayCompletions,
    isLoadingStats,
    
    // Mutations
    createHabit: createHabitMutation.mutate,
    updateHabit: updateHabitMutation.mutate,
    deleteHabit: deleteHabitMutation.mutate,
    toggleHabitCompletion: toggleHabitCompletionMutation.mutate,
    
    // Helper functions
    getHabitCompletion,
    getHabitStats,
    
    // Mutation states
    isCreating: createHabitMutation.isPending,
    isUpdating: updateHabitMutation.isPending,
    isDeleting: deleteHabitMutation.isPending,
    isTogglingCompletion: toggleHabitCompletionMutation.isPending,
  };
}
