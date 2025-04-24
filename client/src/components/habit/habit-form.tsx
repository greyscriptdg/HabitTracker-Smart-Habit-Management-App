import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { insertHabitSchema } from "@shared/schema";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Card, CardContent } from "@/components/ui/card";
import { HabitIcon } from "@/components/ui/habit-icon";
import { Badge } from "@/components/ui/badge";

// Template definitions
const habitTemplates = [
  {
    name: "Morning Meditation",
    description: "Start your day with mindfulness",
    icon: "meditation",
    color: "blue",
    weekdays: "MTWTFSS",
  },
  {
    name: "Exercise Routine",
    description: "30 minutes of physical activity",
    icon: "exercise",
    color: "green",
    weekdays: "MTWTFS",
  },
  {
    name: "Reading Time",
    description: "Read for 20 minutes",
    icon: "book",
    color: "orange",
    weekdays: "MTWTFSS",
  },
  {
    name: "Language Learning",
    description: "Practice vocabulary and speaking",
    icon: "language",
    color: "yellow",
    weekdays: "MTWTF",
  },
  {
    name: "Coding Practice",
    description: "Work on personal coding projects",
    icon: "code",
    color: "purple",
    weekdays: "MWF",
  },
  {
    name: "No Coffee Day",
    description: "Skip coffee to improve sleep",
    icon: "coffee",
    color: "red",
    weekdays: "TTS",
  },
];

// Extend the insert schema with any additional validation
const habitFormSchema = insertHabitSchema.extend({
  // Make sure weekdays is not empty
  weekdays: z.string().min(1, "Select at least one day of the week"),
});

type HabitFormValues = z.infer<typeof habitFormSchema>;

interface HabitFormProps {
  onSuccess?: () => void;
  initialData?: Partial<HabitFormValues>;
  isEdit?: boolean;
  habitId?: number;
}

export default function HabitForm({
  onSuccess,
  initialData,
  isEdit = false,
  habitId,
}: HabitFormProps) {
  const { toast } = useToast();
  const [showTemplates, setShowTemplates] = useState(!isEdit);

  // Set default values
  const defaultValues: Partial<HabitFormValues> = {
    name: "",
    description: "",
    icon: "meditation",
    color: "blue",
    weekdays: "MTWTFSS", // All days by default
    reminderTime: "",
    userId: null,
    ...initialData,
  };

  const form = useForm<HabitFormValues>({
    resolver: zodResolver(habitFormSchema),
    defaultValues,
  });

  // Create habit mutation
  const createHabitMutation = useMutation({
    mutationFn: async (data: HabitFormValues) => {
      return apiRequest("POST", "/api/habits", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/habits"] });
      toast({
        title: "Success!",
        description: "Habit created successfully.",
      });
      form.reset();
      onSuccess?.();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to create habit: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Update habit mutation
  const updateHabitMutation = useMutation({
    mutationFn: async (data: HabitFormValues) => {
      return apiRequest("PATCH", `/api/habits/${habitId}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/habits"] });
      toast({
        title: "Success!",
        description: "Habit updated successfully.",
      });
      onSuccess?.();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update habit: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Form submission handler
  function onSubmit(data: HabitFormValues) {
    if (isEdit && habitId) {
      updateHabitMutation.mutate(data);
    } else {
      createHabitMutation.mutate(data);
    }
  }

  // Helper to handle weekday toggles
  const getDayToggleState = (day: string) => {
    const weekdays = form.watch("weekdays") || "";
    return weekdays.includes(day);
  };

  const handleDayToggle = (day: string) => {
    const weekdays = form.watch("weekdays") || "";
    const index = "MTWTFSS".indexOf(day);
    
    // Create a new weekdays string with the day toggled
    let newWeekdays = weekdays.split("");
    if (weekdays.includes(day)) {
      // Remove the day (make it lowercase)
      newWeekdays[index] = day.toLowerCase();
    } else {
      // Add the day (make it uppercase)
      newWeekdays[index] = day;
    }
    
    form.setValue("weekdays", newWeekdays.join(""));
  };

  // Function to apply a template
  const applyTemplate = (template: typeof habitTemplates[0]) => {
    form.setValue("name", template.name);
    form.setValue("description", template.description);
    form.setValue("icon", template.icon);
    form.setValue("color", template.color);
    form.setValue("weekdays", template.weekdays);
    setShowTemplates(false);
    
    // Show success toast
    toast({
      title: "Template Applied",
      description: `Applied the "${template.name}" template.`,
    });
  };

  // Animation variants for templates section
  const templatesContainerVariants = {
    hidden: { 
      opacity: 0,
      height: 0,
      marginBottom: 0
    },
    visible: { 
      opacity: 1,
      height: "auto",
      marginBottom: 20,
      transition: { 
        duration: 0.3,
        staggerChildren: 0.05
      }
    },
    exit: {
      opacity: 0,
      height: 0,
      marginBottom: 0,
      transition: { 
        duration: 0.2
      }
    }
  };

  const templateCardVariants = {
    hidden: { 
      opacity: 0,
      y: 20,
      scale: 0.95 
    },
    visible: { 
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 15
      }
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {!isEdit && (
          <div className="mb-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-medium text-sm text-gray-700">
                {showTemplates ? "Choose a template or create from scratch" : "Need inspiration?"}
              </h3>
              <Button 
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowTemplates(!showTemplates)}
                className="text-sm"
              >
                {showTemplates ? "Hide Templates" : "Show Templates"}
              </Button>
            </div>
            
            <AnimatePresence>
              {showTemplates && (
                <motion.div
                  variants={templatesContainerVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6"
                >
                  {habitTemplates.map((template, index) => (
                    <motion.div
                      key={index}
                      variants={templateCardVariants}
                      whileHover={{ 
                        scale: 1.03, 
                        boxShadow: "0 10px 25px rgba(0, 0, 0, 0.08)",
                        transition: { type: "spring", stiffness: 400 }
                      }}
                      onClick={() => applyTemplate(template)}
                      className="cursor-pointer"
                    >
                      <Card className="overflow-hidden border border-gray-100 hover:border-primary/30 transition-colors">
                        <CardContent className="p-4">
                          <div className="flex items-start space-x-3">
                            <div className="flex-shrink-0 mt-1">
                              <HabitIcon 
                                icon={template.icon}
                                color={template.color}
                                size={32}
                              />
                            </div>
                            <div className="flex-1">
                              <h4 className="font-medium text-base text-gray-800 mb-1">{template.name}</h4>
                              <p className="text-gray-500 text-sm mb-2">{template.description}</p>
                              <div className="flex space-x-2">
                                <Badge variant="outline" className="text-xs font-normal">
                                  {template.weekdays}
                                </Badge>
                                <Badge variant="secondary" className="text-xs font-normal">
                                  {template.color}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Habit Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Morning Meditation" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description (Optional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Add some details about your habit..."
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="icon"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Icon</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select an icon" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="meditation">Meditation</SelectItem>
                    <SelectItem value="book">Reading</SelectItem>
                    <SelectItem value="exercise">Exercise</SelectItem>
                    <SelectItem value="language">Language Learning</SelectItem>
                    <SelectItem value="workout">Workout</SelectItem>
                    <SelectItem value="coffee">No Coffee</SelectItem>
                    <SelectItem value="bike">Cycling</SelectItem>
                    <SelectItem value="music">Music Practice</SelectItem>
                    <SelectItem value="write">Writing</SelectItem>
                    <SelectItem value="health">Health</SelectItem>
                    <SelectItem value="timer">Time Management</SelectItem>
                    <SelectItem value="code">Coding</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="color"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Color</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a color" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="blue">Blue</SelectItem>
                    <SelectItem value="green">Green</SelectItem>
                    <SelectItem value="orange">Orange</SelectItem>
                    <SelectItem value="yellow">Yellow</SelectItem>
                    <SelectItem value="red">Red</SelectItem>
                    <SelectItem value="purple">Purple</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="weekdays"
          render={() => (
            <FormItem>
              <FormLabel>Days of the Week</FormLabel>
              <div className="flex space-x-2">
                {["M", "T", "W", "T", "F", "S", "S"].map((day, index) => (
                  <Button
                    key={`${day}-${index}`}
                    type="button"
                    variant={getDayToggleState(day) ? "default" : "outline"}
                    className={`w-8 h-8 p-0 rounded-full ${
                      getDayToggleState(day)
                        ? "bg-primary text-white"
                        : "border-gray-300 text-gray-400"
                    }`}
                    onClick={() => handleDayToggle(day)}
                  >
                    {day}
                  </Button>
                ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="reminderTime"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Reminder (Optional)</FormLabel>
              <FormControl>
                <Input type="time" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex space-x-3 pt-4">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={() => onSuccess?.()}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className="flex-1 bg-primary text-white"
            disabled={createHabitMutation.isPending || updateHabitMutation.isPending}
          >
            {isEdit ? "Update Habit" : "Create Habit"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
