import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceArea,
  ReferenceLine
} from "recharts";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { format, subDays, isAfter, parseISO, addDays } from "date-fns";
import { Habit } from "@shared/schema";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { HabitIcon } from "@/components/ui/habit-icon";
import { 
  ZoomIn, 
  ZoomOut, 
  RefreshCw, 
  ChevronLeft, 
  ChevronRight,
  Calendar 
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

type TimeRange = "30" | "60" | "90";
type ChartMode = "line" | "area" | "stacked";

export default function ProgressChart() {
  const [timeRange, setTimeRange] = useState<TimeRange>("30");
  const [chartMode, setChartMode] = useState<ChartMode>("line");
  const [activeHabits, setActiveHabits] = useState<Record<number, boolean>>({});
  const [zoomState, setZoomState] = useState<{left: number; right: number} | null>(null);
  const [hoveredHabit, setHoveredHabit] = useState<number | null>(null);
  
  // Fetch habits
  const { data: habits, isLoading: isLoadingHabits } = useQuery<Habit[]>({
    queryKey: ['/api/habits'],
  });

  // Fetch completions
  const { data: completions, isLoading: isLoadingCompletions } = useQuery<any[]>({
    queryKey: ['/api/completions'],
  });

  // Initialize active habits when data loads
  useState(() => {
    if (habits && Object.keys(activeHabits).length === 0) {
      const initialActiveHabits: Record<number, boolean> = {};
      habits.forEach(habit => {
        initialActiveHabits[habit.id] = true; // All habits active by default
      });
      setActiveHabits(initialActiveHabits);
    }
  });

  if (isLoadingHabits || isLoadingCompletions) {
    return (
      <Card className="mb-6">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Progress Tracker</CardTitle>
            <Skeleton className="h-9 w-36" />
          </div>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  // Prepare data for the chart
  const prepareChartData = () => {
    if (!habits || !completions) return [];

    const today = new Date();
    const startDate = subDays(today, parseInt(timeRange));
    const dateMap = new Map<string, any>();

    // Create data points for each day in the selected range
    for (let i = 0; i <= parseInt(timeRange); i++) {
      const date = subDays(today, i);
      const dateStr = format(date, "MMM d");
      dateMap.set(dateStr, { date: dateStr, idx: parseInt(timeRange) - i });
    }

    // Calculate completion rate for each habit for each day
    habits.forEach(habit => {
      // Skip if this habit is not active
      if (!activeHabits[habit.id]) return;
      
      // For each day in our range
      for (let i = 0; i <= parseInt(timeRange); i++) {
        const date = subDays(today, i);
        const dateStr = format(date, "MMM d");
        const dateISOStr = date.toISOString().split('T')[0];
        
        // Find completions for this habit on this day
        const habitCompletions = completions.filter(c => 
          c.habitId === habit.id && c.date === dateISOStr
        );
        
        // Calculate completion rate (0 or 100 for a single day)
        const completionRate = habitCompletions.some(c => c.completed) ? 100 : 0;
        
        // Update data point for this date
        const dataPoint = dateMap.get(dateStr) || { date: dateStr, idx: parseInt(timeRange) - i };
        dataPoint[habit.name] = completionRate;
        dateMap.set(dateStr, dataPoint);
      }
    });

    // Convert map to array and sort by date
    let result = Array.from(dateMap.values())
      .sort((a, b) => {
        // Sorting dates from oldest to newest
        return a.idx - b.idx;
      });

    // Apply zoom if active
    if (zoomState) {
      result = result.filter(item => 
        item.idx >= zoomState.left && item.idx <= zoomState.right
      );
    }

    return result;
  };

  const chartData = prepareChartData();

  // Define custom colors for the chart lines
  const colors = ['#4F46E5', '#F97316', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  // Get visible habits
  const visibleHabits = habits?.filter(habit => activeHabits[habit.id]) || [];

  // Handle zooming
  const handleZoomIn = () => {
    if (chartData.length <= 5) return; // Prevent zooming too close
    
    const dataLength = chartData.length;
    const newLeft = Math.floor(dataLength * 0.25); // Zoom to middle 50%
    const newRight = Math.floor(dataLength * 0.75);
    
    setZoomState({
      left: newLeft,
      right: newRight
    });
  };

  const handleZoomOut = () => {
    setZoomState(null); // Reset zoom
  };

  // Simplified click handler for zoom in/out
  const handleAreaClick = (chartObj: any) => {
    if (!chartObj || !chartObj.activeCoordinate) return;

    if (zoomState) {
      // If already zoomed, reset zoom
      handleZoomOut();
    } else {
      // If not zoomed, zoom in around clicked point
      const dataIndex = chartObj.activeTooltipIndex;
      if (dataIndex !== undefined && chartData.length > 5) {
        // Create a zoom window around the clicked point
        const windowSize = Math.floor(chartData.length * 0.3); // 30% of total data
        const halfWindow = Math.floor(windowSize / 2);
        
        const leftIndex = Math.max(0, dataIndex - halfWindow);
        const rightIndex = Math.min(chartData.length - 1, dataIndex + halfWindow);
        
        setZoomState({
          left: chartData[leftIndex].idx,
          right: chartData[rightIndex].idx
        });
      }
    }
  };

  // Animation variants
  const cardVariants = {
    hidden: { 
      opacity: 0,
      y: 20
    },
    visible: { 
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        damping: 15,
        stiffness: 300
      }
    }
  };

  const titleVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { 
      opacity: 1, 
      x: 0,
      transition: {
        delay: 0.2,
        duration: 0.5
      }
    }
  };

  const selectVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: {
        delay: 0.3,
        type: "spring",
        stiffness: 500
      }
    }
  };

  const chartVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: {
        delay: 0.4,
        duration: 0.8,
        type: "spring",
        damping: 20
      }
    }
  };

  const legendButtonVariants = {
    hidden: { opacity: 0, y: 5 },
    visible: (i: number) => ({ 
      opacity: 1, 
      y: 0,
      transition: {
        delay: 0.2 + (i * 0.05),
        duration: 0.5
      }
    }),
    hover: { 
      scale: 1.05,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 10
      }
    }
  };

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 shadow-lg rounded-lg border border-gray-100">
          <h4 className="font-semibold text-sm mb-2">{label}</h4>
          <div className="space-y-1.5">
            {payload.map((entry: any, index: number) => (
              <div key={index} className="flex items-center space-x-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-sm font-medium">{entry.name}</span>
                <span className="text-sm text-gray-600 font-semibold">{entry.value}%</span>
              </div>
            ))}
          </div>
        </div>
      );
    }
  
    return null;
  };

  // Get chart title based on time range
  const getChartTitle = () => {
    switch(timeRange) {
      case "30": return "Monthly Progress";
      case "60": return "Bi-Monthly Progress";
      case "90": return "Quarterly Progress";
      default: return "Progress Tracker";
    }
  };

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
    >
      <Card className="mb-6">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div className="space-y-1">
              <motion.div variants={titleVariants}>
                <CardTitle>{getChartTitle()}</CardTitle>
              </motion.div>
              <CardDescription>
                Track your habit completion over time
              </CardDescription>
            </div>
            <div className="flex items-center space-x-3">
              {zoomState && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <Button 
                    variant="outline" 
                    size="icon" 
                    onClick={handleZoomOut} 
                    className="h-9 w-9"
                    title="Reset zoom"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </motion.div>
              )}
              <motion.div variants={selectVariants}>
                <Select
                  value={timeRange}
                  onValueChange={(value) => setTimeRange(value as TimeRange)}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select time range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">Last 30 Days</SelectItem>
                    <SelectItem value="60">Last 60 Days</SelectItem>
                    <SelectItem value="90">Last 90 Days</SelectItem>
                  </SelectContent>
                </Select>
              </motion.div>
            </div>
          </div>
          
          {/* Habit filters */}
          <div className="mt-4 flex flex-wrap gap-2">
            {habits?.map((habit, i) => (
              <motion.div
                key={habit.id}
                custom={i}
                variants={legendButtonVariants}
                initial="hidden"
                animate="visible"
                whileHover="hover"
                onClick={() => {
                  setActiveHabits(prev => ({
                    ...prev,
                    [habit.id]: !prev[habit.id]
                  }));
                }}
                onMouseEnter={() => setHoveredHabit(habit.id)}
                onMouseLeave={() => setHoveredHabit(null)}
              >
                <Badge 
                  variant={activeHabits[habit.id] ? "default" : "outline"}
                  className={`cursor-pointer transition-all duration-300 ${
                    activeHabits[habit.id] 
                      ? "bg-opacity-90 shadow-sm" 
                      : "bg-transparent text-gray-500"
                  }`}
                  style={{ 
                    backgroundColor: activeHabits[habit.id] ? colors[i % colors.length] : undefined,
                    transform: `scale(${hoveredHabit === habit.id ? 1.05 : 1})`,
                  }}
                >
                  <div className="flex items-center space-x-1">
                    <HabitIcon icon={habit.icon} size={14} color={activeHabits[habit.id] ? "white" : habit.color} />
                    <span>{habit.name}</span>
                  </div>
                </Badge>
              </motion.div>
            ))}
          </div>
          
          {/* Chart toolbar */}
          <div className="flex justify-between items-center mt-3">
            <div className="flex space-x-1">
              <Button 
                variant="ghost" 
                size="sm" 
                className={`text-xs ${chartMode === 'line' ? 'bg-muted' : ''}`}
                onClick={() => setChartMode('line')}
              >
                Line
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className={`text-xs ${chartMode === 'area' ? 'bg-muted' : ''}`}
                onClick={() => setChartMode('area')}
              >
                Area
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                className={`text-xs ${chartMode === 'stacked' ? 'bg-muted' : ''}`} 
                onClick={() => setChartMode('stacked')}
              >
                Stacked
              </Button>
            </div>
            <div className="flex space-x-1">
              <Button 
                variant="outline" 
                size="icon" 
                className="h-7 w-7" 
                onClick={handleZoomIn}
                disabled={!!zoomState}
                title="Zoom in"
              >
                <ZoomIn className="h-3.5 w-3.5" />
              </Button>
              <Button 
                variant="outline" 
                size="icon" 
                className="h-7 w-7" 
                onClick={handleZoomOut}
                disabled={!zoomState}
                title="Zoom out"
              >
                <ZoomOut className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <motion.div 
            className="h-80"
            variants={chartVariants}
            whileHover={{ 
              boxShadow: "0px 10px 25px rgba(0,0,0,0.1)",
              scale: 1.02,
              transition: {
                type: "spring",
                stiffness: 300
              }
            }}
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart 
                data={chartData}
                onClick={handleAreaClick}
                margin={{ top: 10, right: 10, left: 0, bottom: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" opacity={0.7} />
                <XAxis 
                  dataKey="date"
                  tick={{ fontSize: 12 }}
                  tickLine={{ strokeWidth: 1 }}
                />
                <YAxis
                  domain={[0, 100]}
                  tickFormatter={(value) => `${value}%`}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip 
                  content={<CustomTooltip />}
                  animationDuration={300}
                />
                <Legend wrapperStyle={{ paddingTop: "10px" }} />

                {/* Today reference line */}
                <ReferenceLine 
                  x={format(new Date(), "MMM d")} 
                  stroke="#666"
                  strokeDasharray="3 3"
                  label={{
                    value: "Today",
                    position: "insideTopRight",
                    fill: "#666",
                    fontSize: 12
                  }}
                />

                {visibleHabits.map((habit, index) => {
                  // Base line props for recharts Line component
                  const lineProps = {
                    key: habit.id,
                    dataKey: habit.name,
                    stroke: colors[index % colors.length],
                    fill: colors[index % colors.length],
                    activeDot: { 
                      r: 8,
                      strokeWidth: 1,
                      stroke: "#fff"
                    },
                    strokeWidth: 2,
                    dot: { 
                      r: 4,
                      strokeWidth: 1,
                      stroke: "#fff"
                    },
                    animationDuration: 1500,
                    animationEasing: "ease-out",
                    connectNulls: true,
                  };

                  // Return different chart elements based on mode
                  switch (chartMode) {
                    case 'area':
                      return (
                        <Line
                          {...lineProps}
                          key={`area-${habit.id}`}
                          strokeWidth={3}
                          fillOpacity={0.2}
                        />
                      );
                    case 'stacked':
                      return (
                        <Line
                          {...lineProps}
                          key={`stacked-${habit.id}`}
                          fillOpacity={0.5}
                          strokeWidth={1.5}
                        />
                      );
                    default: // 'line'
                      return <Line {...lineProps} />;
                  }
                })}
              </LineChart>
            </ResponsiveContainer>
          </motion.div>
          
          {/* Chart footer with insights */}
          <div className="mt-4 text-sm text-muted-foreground">
            {visibleHabits.length === 0 ? (
              <p className="text-center italic">Select habits above to view progress data</p>
            ) : visibleHabits.length === 1 ? (
              <p>
                <span className="font-medium" style={{color: colors[0]}}>
                  {visibleHabits[0].name}
                </span> habit has been tracked for {timeRange} days.
                {chartData.length > 0 && ` You can click and drag to zoom into specific date ranges.`}
              </p>
            ) : (
              <p>Showing progress for {visibleHabits.length} habits over the last {timeRange} days. 
                {chartData.length > 0 && ` Click on the habit badges to hide or show data.`}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
