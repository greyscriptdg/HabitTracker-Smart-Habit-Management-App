import { useState } from "react";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HabitIcon } from "@/components/ui/habit-icon";
import { format, isSameDay } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { Habit } from "@shared/schema";
import { motion } from "framer-motion";

export default function Calendar() {
  const [date, setDate] = useState<Date>(new Date());
  
  // Fetch habits
  const { data: habits, isLoading: isLoadingHabits } = useQuery<Habit[]>({
    queryKey: ['/api/habits'],
  });
  
  // Fetch all completions
  const { data: completions, isLoading: isLoadingCompletions } = useQuery<any[]>({
    queryKey: ['/api/completions'],
  });
  
  // Get completions for the selected date
  const selectedDateStr = format(date, "yyyy-MM-dd");
  const completionsForDate = completions?.filter(c => 
    c.date === selectedDateStr
  ) || [];
  
  const isLoading = isLoadingHabits || isLoadingCompletions;
  
  // Function to get completed habit count for a day (used by calendar)
  const getCompletedCountForDay = (day: Date) => {
    if (!completions) return 0;
    
    const dayStr = format(day, "yyyy-MM-dd");
    return completions.filter(c => c.date === dayStr && c.completed).length;
  };
  
  // Animation variants for calendar components
  const pageVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.1,
        delayChildren: 0.2
      } 
    }
  };

  const cardVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: {
        type: "spring",
        damping: 15,
        stiffness: 300
      }
    }
  };

  const calendarDayVariants = {
    initial: { scale: 0.9, opacity: 0.6 },
    hover: { 
      scale: 1.1, 
      boxShadow: "0px 5px 10px rgba(0,0,0,0.1)",
      transition: {
        type: "spring",
        stiffness: 400
      }
    },
    selected: {
      scale: 1.1,
      boxShadow: "0px 5px 15px rgba(0,0,0,0.2)",
      backgroundColor: "var(--primary)",
      color: "#fff",
      transition: {
        type: "spring",
        stiffness: 500,
        damping: 15
      }
    }
  };

  const listItemVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: (i: number) => ({ 
      opacity: 1, 
      x: 0,
      transition: { 
        delay: i * 0.1,
        type: "spring",
        stiffness: 300,
        damping: 20
      }
    }),
    hover: {
      x: 5,
      transition: { type: "spring", stiffness: 400 }
    }
  };

  // Custom day render function for calendar
  const renderDay = (day: Date) => {
    const completedCount = getCompletedCountForDay(day);
    const totalHabits = habits?.length || 0;
    const isSelected = isSameDay(day, date);
    
    return (
      <motion.div 
        className="relative w-full h-full flex flex-col justify-center items-center"
        variants={calendarDayVariants}
        initial="initial"
        whileHover={!isSelected ? "hover" : undefined}
        animate={isSelected ? "selected" : undefined}
        style={{ borderRadius: "4px", padding: "2px" }}
      >
        <div className="text-center">{day.getDate()}</div>
        {completedCount > 0 && (
          <motion.div 
            className="absolute bottom-0 left-0 right-0 flex justify-center"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ 
              scale: 1, 
              opacity: 1,
              transition: { delay: 0.1, type: "spring", stiffness: 500 }
            }}
          >
            <div className={`text-xs rounded-full px-1 ${isSelected ? 'bg-white text-primary' : 'bg-secondary text-white'}`}>
              {completedCount}/{totalHabits}
            </div>
          </motion.div>
        )}
      </motion.div>
    );
  };
  
  return (
    <motion.div 
      className="p-4 sm:p-6"
      variants={pageVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            type: "spring",
            stiffness: 300,
            damping: 15
          }}
        >
          <h2 className="text-2xl font-bold text-gray-800">Calendar</h2>
          <p className="mt-1 text-gray-500">Track your habits by date</p>
        </motion.div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Calendar Section */}
        <motion.div variants={cardVariants}>
          <Card className="md:col-span-2">
            <CardHeader>
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
              >
                <CardTitle>Habit Calendar</CardTitle>
              </motion.div>
            </CardHeader>
            <CardContent>
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ 
                  opacity: 1, 
                  scale: 1,
                  transition: {
                    type: "spring",
                    damping: 20,
                    stiffness: 300,
                    delay: 0.3
                  }
                }}
              >
                <CalendarComponent
                  mode="single"
                  selected={date}
                  onSelect={(day) => day && setDate(day)}
                  className="rounded-md border"
                  components={{
                    DayContent: (props) => renderDay(props.date),
                  }}
                />
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>
        
        {/* Selected Date Details */}
        <motion.div variants={cardVariants}>
          <Card>
            <CardHeader>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ 
                  opacity: 1,
                  transition: { duration: 0.5 }
                }}
                key={date.toISOString()} // Change animation key when date changes
              >
                <CardTitle>
                  {format(date, "MMMM d, yyyy")}
                </CardTitle>
              </motion.div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {isLoading ? (
                  // Loading skeleton
                  <>
                    {[...Array(4)].map((_, i) => (
                      <motion.div 
                        key={i} 
                        className="flex items-center"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ 
                          opacity: 1, 
                          x: 0,
                          transition: { 
                            delay: i * 0.1 
                          }
                        }}
                      >
                        <Skeleton className="h-10 w-10 rounded-md mr-4" />
                        <div>
                          <Skeleton className="h-5 w-40 mb-1" />
                          <Skeleton className="h-4 w-20" />
                        </div>
                      </motion.div>
                    ))}
                  </>
                ) : (
                  // Render habits for selected date with animations
                  <motion.div
                    variants={pageVariants}
                    initial="hidden"
                    animate="visible"
                    key={date.toISOString()} // Change animation key when date changes
                  >
                    {habits?.map((habit, index) => {
                      const completion = completionsForDate.find(c => c.habitId === habit.id);
                      return (
                        <motion.div 
                          key={habit.id} 
                          className="flex items-center p-2 rounded-lg cursor-pointer"
                          variants={listItemVariants}
                          custom={index}
                          whileHover="hover"
                          style={{ 
                            perspective: "1000px", 
                            borderRadius: "8px",
                            border: "1px solid transparent"
                          }}
                          animate={{
                            borderColor: completion?.completed ? 
                              "rgba(16, 185, 129, 0.3)" : 
                              completion ? 
                                "rgba(239, 68, 68, 0.3)" : 
                                "transparent",
                            backgroundColor: completion?.completed ? 
                              "rgba(16, 185, 129, 0.05)" : 
                              completion ? 
                                "rgba(239, 68, 68, 0.05)" : 
                                "transparent"
                          }}
                        >
                          <motion.div
                            whileHover={{ 
                              rotate: [0, -10, 10, -5, 5, 0],
                              transition: { duration: 0.5 }
                            }}
                          >
                            <HabitIcon icon={habit.icon as any} color={habit.color} />
                          </motion.div>
                          <div className="ml-4 flex-grow">
                            <h4 className="text-base font-medium text-gray-800">{habit.name}</h4>
                            <motion.p 
                              className="text-sm"
                              animate={{ 
                                color: completion?.completed ? 
                                  "#10B981" : 
                                  completion ? 
                                    "#EF4444" : 
                                    "#6B7280" 
                              }}
                              transition={{ duration: 0.3 }}
                            >
                              {completion?.completed 
                                ? "✓ Completed" 
                                : completion 
                                  ? "✗ Missed" 
                                  : "○ Not tracked"
                              }
                            </motion.p>
                          </div>
                        </motion.div>
                      );
                    })}
                    
                    {habits?.length === 0 && (
                      <motion.div 
                        className="text-center py-6 text-gray-500"
                        initial={{ opacity: 0 }}
                        animate={{ 
                          opacity: 1,
                          transition: { delay: 0.3 }
                        }}
                      >
                        No habits found. Add a habit to start tracking!
                      </motion.div>
                    )}
                  </motion.div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}
