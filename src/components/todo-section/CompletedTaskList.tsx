import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

function timeAgo(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diff < 60) return `${diff} seconds ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
  return `${Math.floor(diff / 86400)} days ago`;
}

export function CompletedTaskList() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTasks = async () => {
      setLoading(true);
      const { data } = await supabase.from("tasks").select("*");
      setTasks(data || []);
      setLoading(false);
    };
    fetchTasks();
    const handler = () => fetchTasks();
    window.addEventListener('tasks-updated', handler);
    return () => window.removeEventListener('tasks-updated', handler);
  }, []);

  const completed = tasks.filter(t => t.status === "completed");

  if (loading) return <div>Loading...</div>;
  if (completed.length === 0) return <div className="bg-white rounded-xl shadow-sm border p-6">No completed tasks.</div>;

  return (
    <div className="bg-white rounded-xl shadow-sm border p-6">
      <div className="flex items-center space-x-2 mb-6">
        <svg className="w-5 h-5 text-coral" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
        </svg>
        <h3 className="text-lg font-semibold text-gray-800">Completed Task</h3>
      </div>
      <div className="space-y-4">
        {completed.map(task => (
          <div key={task.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
              </svg>
            </div>
            <div className="flex-1">
              <h4 className="font-medium text-gray-800">{task.title}</h4>
              <p className="text-sm text-gray-600">{task.description}</p>
              <div className="flex items-center space-x-2 mt-1">
                <span className="text-xs text-green-600">Status: Completed</span>
                <span className="text-xs text-gray-500">
                  Completed {task.updated_at ? timeAgo(task.updated_at) : ""}
                </span>
              </div>
            </div>
            {task.image_url && (
              <img src={task.image_url} alt="Task image" className="w-10 h-10 rounded-lg object-cover" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
} 