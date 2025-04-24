import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, subDays, parseISO } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { HabitIcon } from "@/components/ui/habit-icon";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Habit } from "@shared/schema";

type TimeRange = "7" | "30" | "90" | "180" | "365";

export default function Statistics() {
  const [timeRange, setTimeRange] = useState<TimeRange>("30");
  const [selectedHabitId, setSelectedHabitId] = useState<number | "all">("all");

  // Fetch habits
  const { data: habits, isLoading: isLoadingHabits } = useQuery<Habit[]>({
    queryKey: ['/api/habits'],
  });

  // Fetch completions for the selected time range
  const today = new Date();
  const startDate = format(subDays(today, parseInt(timeRange)), "yyyy-MM-dd");
  const endDate = format(today, "yyyy-MM-dd");

  const { data: completions, isLoading: isLoadingCompletions } = useQuery<any[]>({
    queryKey: ['/api/completions', startDate, endDate],
    queryFn: async () => {
      const res = await fetch(`/api/completions?startDate=${startDate}&endDate=${endDate}`);
      if (!res.ok) throw new Error('Failed to fetch completions');
      return res.json();
    }
  });

  // Fetch habit stats
  const { data: stats, isLoading: isLoadingStats } = useQuery<any[]>({
    queryKey: ['/api/stats'],
  });

  const isLoading = isLoadingHabits || isLoadingCompletions || isLoadingStats;

  // Prepare data for the charts
  const prepareBarChartData = () => {
    if (!habits || !completions) return [];

    // Filter completions by selected habit if not "all"
    const filteredCompletions = selectedHabitId === "all"
      ? completions
      : completions.filter(c => c.habitId === selectedHabitId);

    // Group by date and count completions
    const dateGroups = new Map<string, { date: string, completed: number, total: number }>();
    
    // Initialize all dates in range
    for (let i = 0; i <= parseInt(timeRange); i++) {
      const date = subDays(today, i);
      const dateStr = format(date, "MMM d");
      dateGroups.set(dateStr, { date: dateStr, completed: 0, total: 0 });
    }

    // Populate with actual data
    filteredCompletions.forEach(completion => {
      const date = parseISO(completion.date);
      const dateStr = format(date, "MMM d");
      
      if (dateGroups.has(dateStr)) {
        const existing = dateGroups.get(dateStr)!;
        existing.total += 1;
        if (completion.completed) {
          existing.completed += 1;
        }
        dateGroups.set(dateStr, existing);
      }
    });

    // Convert to array and sort by date
    return Array.from(dateGroups.values())
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  const preparePieChartData = () => {
    if (!habits || !stats) return [];

    // If a specific habit is selected, show completion rate vs non-completion
    if (selectedHabitId !== "all") {
      const habitStat = stats.find(s => s.habitId === selectedHabitId);
      if (!habitStat) return [];

      const completionRate = habitStat.completionRate;
      return [
        { name: "Completed", value: completionRate },
        { name: "Missed", value: 100 - completionRate }
      ];
    }

    // Otherwise show completion rates for each habit
    return habits.map(habit => {
      const habitStat = stats.find(s => s.habitId === habit.id);
      return {
        name: habit.name,
        value: habitStat ? habitStat.completionRate : 0
      };
    });
  };

  const barChartData = prepareBarChartData();
  const pieChartData = preparePieChartData();

  // Colors for charts
  const pieColors = ['#4F46E5', '#10B981', '#F97316', '#F59E0B', '#EF4444', '#8B5CF6'];

  return (
    <div className="p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Statistics</h2>
          <p className="mt-1 text-gray-500">Analyze your habit performance</p>
        </div>
        
        <div className="mt-4 sm:mt-0 flex flex-col sm:flex-row gap-3">
          <Select
            value={timeRange}
            onValueChange={(value) => setTimeRange(value as TimeRange)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 Days</SelectItem>
              <SelectItem value="30">Last 30 Days</SelectItem>
              <SelectItem value="90">Last 90 Days</SelectItem>
              <SelectItem value="180">Last 180 Days</SelectItem>
              <SelectItem value="365">Last Year</SelectItem>
            </SelectContent>
          </Select>
          
          <Select
            value={selectedHabitId.toString()}
            onValueChange={(value) => setSelectedHabitId(value === "all" ? "all" : parseInt(value))}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select habit" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Habits</SelectItem>
              {habits?.map(habit => (
                <SelectItem key={habit.id} value={habit.id.toString()}>
                  {habit.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-80 w-full" />
          <Skeleton className="h-80 w-full" />
        </div>
      ) : (
        <>
          <Tabs defaultValue="charts" className="mb-8">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="charts">Charts</TabsTrigger>
              <TabsTrigger value="details">Habit Details</TabsTrigger>
            </TabsList>
            
            <TabsContent value="charts">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Bar Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle>Completion History</CardTitle>
                    <CardDescription>
                      Daily habit completion over time
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={barChartData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis />
                          <Tooltip formatter={(value) => [`${value}`, 'Count']} />
                          <Legend />
                          <Bar dataKey="completed" fill="#4F46E5" name="Completed" />
                          <Bar dataKey="total" fill="#E5E7EB" name="Total" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Pie Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle>Completion Rate</CardTitle>
                    <CardDescription>
                      {selectedHabitId === "all" 
                        ? "Completion rate by habit" 
                        : "Completed vs. missed"
                      }
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={pieChartData}
                            cx="50%"
                            cy="50%"
                            outerRadius={100}
                            innerRadius={60}
                            fill="#8884d8"
                            dataKey="value"
                            label={({ name, value }) => `${name}: ${value}%`}
                          >
                            {pieChartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value) => [`${value}%`, 'Completion Rate']} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="details">
              <Card>
                <CardHeader>
                  <CardTitle>Habit Statistics</CardTitle>
                  <CardDescription>
                    Detailed stats for each habit
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="divide-y divide-gray-200">
                    {habits?.map(habit => {
                      const habitStat = stats?.find(s => s.habitId === habit.id);
                      return (
                        <div key={habit.id} className="py-4 flex items-start">
                          <HabitIcon icon={habit.icon as any} color={habit.color} className="mt-1" />
                          <div className="ml-4 flex-1">
                            <h4 className="text-lg font-medium text-gray-800">{habit.name}</h4>
                            <p className="text-sm text-gray-500">{habit.description}</p>
                            
                            <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-4">
                              <div>
                                <p className="text-sm text-gray-500">Current Streak</p>
                                <p className="text-xl font-bold text-primary">{habitStat?.currentStreak || 0} days</p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-500">Longest Streak</p>
                                <p className="text-xl font-bold text-primary">{habitStat?.longestStreak || 0} days</p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-500">Completion Rate</p>
                                <p className="text-xl font-bold text-primary">{Math.round(habitStat?.completionRate || 0)}%</p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-500">Total Completions</p>
                                <p className="text-xl font-bold text-primary">{habitStat?.totalCompletions || 0}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    
                    {habits?.length === 0 && (
                      <div className="py-8 text-center text-gray-500">
                        No habits found. Add a habit to see statistics!
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}
