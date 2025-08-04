import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { EditTaskDialog } from "@/components/custom-dialog/EditTaskDialog";
import { CreateTaskDialog } from "@/components/custom-dialog/CreateTaskDialog";
import { TaskDetailDialog } from "./TaskDetailDialog";

export function TaskList() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [marking, setMarking] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);

  const fetchTasks = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("tasks").select("*");
    if (error) {
      setError(error.message);
      setTasks([]);
    } else {
      setTasks(data || []);
      setError(null);
    }
    setLoading(false);
  };

  const markAsCompleted = async (taskId: string) => {
    setMarking(taskId);
    await supabase.from("tasks").update({ status: "completed", updated_at: new Date().toISOString() }).eq("id", taskId);
    setMarking(null);
    fetchTasks();
  };

  const handleStatusChange = async (status: string) => {
    if (!selectedTask) return;
    await supabase.from("tasks").update({ status, updated_at: new Date().toISOString() }).eq("id", selectedTask.id);
    fetchTasks();
    setSelectedTask({ ...selectedTask, status, updated_at: new Date().toISOString() });
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <svg
            className="w-5 h-5 text-coral"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
              clipRule="evenodd"
            ></path>
          </svg>
          <h3 className="text-lg font-semibold text-gray-800">To-Do</h3>
        </div>
        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-500">{new Date().toLocaleDateString()} • Today</span>
          <CreateTaskDialog
            onTaskCreated={fetchTasks}
            trigger={
              <button className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium">+ Create Task</button>
            }
          />
        </div>
      </div>
      <div className="space-y-4" id="tasks-list" style={{ maxHeight: '900px', overflowY: 'auto' }}>
        {loading ? (
          <div className="text-center py-8 text-gray-500">Loading tasks...</div>
        ) : error ? (
          <div className="text-center py-8 text-red-500">{error}</div>
        ) : tasks.length > 0 ? (
          [...tasks]
            .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
            .map((task) => (
              <div
                key={task.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => {
                  setSelectedTask(task);
                  setDetailOpen(true);
                }}
              >
                <div className="flex items-start space-x-4">
                  <div
                    className={`w-2 h-2 ${
                      task.priority === "extreme"
                        ? "bg-red-500"
                        : task.priority === "moderate"
                        ? "bg-blue-500"
                        : "bg-green-500"
                    } rounded-full mt-2`}
                  />
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-800 mb-2">{task.title}</h4>
                    <p className="text-sm text-gray-600 mb-3">{task.description}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <span>
                          Priority:{" "}
                          <span
                            className={
                              task.priority === "extreme"
                                ? "text-red-500 font-medium"
                                : task.priority === "moderate"
                                ? "text-blue-500 font-medium"
                                : "text-green-500 font-medium"
                            }
                          >
                            {task.priority === "extreme"
                              ? "🔥 Extreme"
                              : task.priority === "moderate"
                              ? "⚡ Moderate"
                              : "🌱 Low"}
                          </span>
                        </span>
                        <span>
                          Status:{" "}
                          <span
                            className={
                              task.status === "pending"
                                ? "text-red-500"
                                : task.status === "in progress"
                                ? "text-blue-500"
                                : task.status === "completed"
                                ? "text-green-500"
                                : "text-gray-500"
                            }
                          >
                            {task.status.charAt(0).toUpperCase() + task.status.slice(1)}
                          </span>
                        </span>
                        <span>
                          Created on: {new Date(task.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        {task.status !== "completed" && (
                          <span onClick={e => e.stopPropagation()}>
                            <EditTaskDialog
                              task={task}
                              onTaskUpdated={fetchTasks}
                            />
                          </span>
                        )}
                        <button className="text-red-500 hover:text-red-700 text-xs font-medium" onClick={e => e.stopPropagation()}>
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                  {task.image_url && (
                    <img
                      src={task.image_url}
                      alt="Task image"
                      className="w-15 h-15 rounded-lg object-cover"
                    />
                  )}
                </div>
              </div>
            ))
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">You have no tasks yet. Create one!</p>
          </div>
        )}
        <TaskDetailDialog open={detailOpen} onOpenChange={setDetailOpen} task={selectedTask} onStatusChange={handleStatusChange} />
      </div>
    </div>
  );
} 