import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Pencil, Trash2, AlertCircle } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { HabitIcon } from "@/components/ui/habit-icon";
import HabitForm from "@/components/habit/habit-form";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { Habit } from "@shared/schema";

export default function Settings() {
  const [editHabit, setEditHabit] = useState<Habit | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [habitToDelete, setHabitToDelete] = useState<Habit | null>(null);
  
  const { toast } = useToast();
  
  // Fetch habits
  const { data: habits, isLoading } = useQuery<Habit[]>({
    queryKey: ['/api/habits'],
  });
  
  // Delete habit mutation
  const deleteHabitMutation = useMutation({
    mutationFn: async (habitId: number) => {
      return apiRequest("DELETE", `/api/habits/${habitId}`, null);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/habits"] });
      toast({
        title: "Success!",
        description: "Habit deleted successfully.",
      });
      setIsDeleteDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete habit: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // Handle edit button click
  const handleEdit = (habit: Habit) => {
    setEditHabit(habit);
    setIsEditDialogOpen(true);
  };
  
  // Handle delete button click
  const handleDelete = (habit: Habit) => {
    setHabitToDelete(habit);
    setIsDeleteDialogOpen(true);
  };
  
  // Confirm delete
  const confirmDelete = () => {
    if (habitToDelete) {
      deleteHabitMutation.mutate(habitToDelete.id);
    }
  };
  
  return (
    <div className="p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Settings</h2>
          <p className="mt-1 text-gray-500">Manage your habits and preferences</p>
        </div>
      </div>
      
      <Tabs defaultValue="habits" className="mb-8">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="habits">My Habits</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
        </TabsList>
        
        <TabsContent value="habits">
          <Card>
            <CardHeader>
              <CardTitle>Manage Habits</CardTitle>
              <CardDescription>
                Edit or delete your existing habits
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">Loading habits...</div>
              ) : (
                <div className="space-y-4">
                  {habits?.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      No habits found. Add a habit to get started!
                    </div>
                  )}
                  
                  {habits?.map(habit => (
                    <div key={habit.id} className="p-4 border border-gray-200 rounded-lg hover:border-gray-300">
                      <div className="flex justify-between items-start">
                        <div className="flex items-start">
                          <HabitIcon icon={habit.icon as any} color={habit.color} className="mt-0.5" />
                          <div className="ml-4">
                            <h3 className="text-lg font-medium text-gray-800">{habit.name}</h3>
                            <p className="text-sm text-gray-500">{habit.description}</p>
                            
                            <div className="mt-2 flex flex-wrap gap-1">
                              {["M", "T", "W", "T", "F", "S", "S"].map((day, index) => {
                                const isActive = habit.weekdays.includes(day);
                                return (
                                  <span 
                                    key={`${day}-${index}`} 
                                    className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs ${
                                      isActive 
                                        ? "bg-primary text-white" 
                                        : "bg-gray-100 text-gray-400"
                                    }`}
                                  >
                                    {day}
                                  </span>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex space-x-2">
                          <Button 
                            variant="outline" 
                            size="icon"
                            onClick={() => handleEdit(habit)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="icon"
                            className="text-destructive hover:text-destructive-foreground hover:bg-destructive"
                            onClick={() => handleDelete(habit)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="preferences">
          <Card>
            <CardHeader>
              <CardTitle>App Preferences</CardTitle>
              <CardDescription>
                Customize how the habit tracker works for you
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="notifications" className="text-base">Enable Notifications</Label>
                  <p className="text-sm text-gray-500">Get notified when it's time to complete your habits</p>
                </div>
                <Switch id="notifications" defaultChecked />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="darkMode" className="text-base">Dark Mode</Label>
                  <p className="text-sm text-gray-500">Switch between light and dark theme</p>
                </div>
                <Switch id="darkMode" />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="weekStart" className="text-base">Week Starts On</Label>
                  <p className="text-sm text-gray-500">Choose the first day of the week</p>
                </div>
                <select 
                  id="weekStart" 
                  className="w-24 rounded-md border border-gray-300 py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                  defaultValue="monday"
                >
                  <option value="monday">Monday</option>
                  <option value="sunday">Sunday</option>
                </select>
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="dataExport" className="text-base">Export Data</Label>
                  <p className="text-sm text-gray-500">Download all your habit data</p>
                </div>
                <Button variant="outline">Export</Button>
              </div>
            </CardContent>
            <CardFooter>
              <Button className="ml-auto">Save Preferences</Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Edit Habit Dialog */}
      {editHabit && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Edit Habit</DialogTitle>
              <DialogDescription>
                Make changes to your habit below
              </DialogDescription>
            </DialogHeader>
            
            <HabitForm 
              isEdit={true}
              habitId={editHabit.id}
              initialData={editHabit}
              onSuccess={() => setIsEditDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      )}
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center text-destructive">
              <AlertCircle className="h-5 w-5 mr-2" />
              Delete Habit
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this habit? This action cannot be undone and all tracking data will be lost.
            </DialogDescription>
          </DialogHeader>
          
          {habitToDelete && (
            <div className="flex items-center py-2">
              <HabitIcon icon={habitToDelete.icon as any} color={habitToDelete.color} />
              <div className="ml-3">
                <h4 className="font-medium">{habitToDelete.name}</h4>
                <p className="text-sm text-gray-500">{habitToDelete.description}</p>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmDelete}
              disabled={deleteHabitMutation.isPending}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
