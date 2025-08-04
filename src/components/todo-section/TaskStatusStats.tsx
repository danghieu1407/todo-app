import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

const statusMeta = [
  {
    key: "completed",
    label: "Completed",
    color: "text-green-500 bg-green-500",
    circle: "text-green-500",
  },
  {
    key: "in progress",
    label: "In Progress",
    color: "text-blue-500 bg-blue-500",
    circle: "text-blue-500",
  },
  {
    key: "not started",
    label: "Not Started",
    color: "text-red-500 bg-red-500",
    circle: "text-red-500",
  },
];

function getStatusCount(tasks, status) {
  return tasks.filter((t) => t.status === status).length;
}

export function TaskStatusStats() {
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

  const total = tasks.length || 1;
  return (
    <div className="bg-white rounded-xl shadow-sm border p-6">
      <div className="flex items-center space-x-2 mb-6">
        <svg className="w-5 h-5 text-coral" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"
            clipRule="evenodd"
          ></path>
        </svg>
        <h3 className="text-lg font-semibold text-gray-800">Task Status</h3>
      </div>
      <div className="grid grid-cols-3 gap-4 mb-6">
        {statusMeta.map((meta) => {
          const count = getStatusCount(tasks, meta.key);
          const percent = Math.round((count / total) * 100);
          const dash = `${percent}, 100`;
          return (
            <div className="text-center" key={meta.key}>
              <div className="relative w-16 h-16 mx-auto mb-2">
                <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-gray-200"
                    stroke="currentColor"
                    strokeWidth="3"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  ></path>
                  <path
                    className={meta.circle}
                    stroke="currentColor"
                    strokeWidth="3"
                    fill="none"
                    strokeDasharray={dash}
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  ></path>
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm font-bold text-gray-800">{percent}%</span>
                </div>
              </div>
              <div className="flex items-center justify-center space-x-1">
                <div className={`w-2 h-2 ${meta.color.split(' ')[1]} rounded-full`}></div>
                <span className="text-xs text-gray-600">{meta.label}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
} 