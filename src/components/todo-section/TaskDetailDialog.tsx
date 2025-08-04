import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const statusOptions = [
  { value: "not started", label: "Not Started", color: "bg-gray-400" },
  { value: "in progress", label: "In Progress", color: "bg-blue-500" },
  { value: "completed", label: "Completed", color: "bg-green-500" },
];

export function TaskDetailDialog({ open, onOpenChange, task, onStatusChange }: {
  open: boolean,
  onOpenChange: (open: boolean) => void,
  task: any,
  onStatusChange?: (status: string) => void,
}) {
  if (!task) return null;
  const currentStatus = statusOptions.find(s => s.value === task.status);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-0 overflow-hidden">
        <div className="bg-gradient-to-r from-orange-100 to-orange-300 px-6 py-4 flex items-center justify-between">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-orange-900">{task.title}</DialogTitle>
          </DialogHeader>
          {currentStatus && (
            <span className={`ml-4 px-3 py-1 rounded-full text-xs font-semibold text-white ${currentStatus.color}`}>{currentStatus.label}</span>
          )}
        </div>
        <div className="px-6 py-4 space-y-4">
          <div>
            <span className="font-semibold">Description:</span>
            <div className="text-gray-700 mt-1">{task.description || <span className="italic text-gray-400">No description</span>}</div>
          </div>
          <div className="flex gap-2">
            {statusOptions.map(option => (
              <button
                key={option.value}
                className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all duration-150 ${
                  task.status === option.value
                    ? option.color + " text-white border-transparent shadow"
                    : "bg-white text-gray-700 border-gray-300 hover:bg-orange-50 hover:border-orange-400"
                }`}
                disabled={task.status === option.value}
                onClick={async () => {
                  if (onStatusChange) {
                    await onStatusChange(option.value);
                    window.dispatchEvent(new Event('tasks-updated'));
                  }
                }}
              >
                {option.label}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-4 text-sm text-gray-500">
            <div>
              <span className="font-semibold">Created at:</span> {new Date(task.created_at).toLocaleString()}
            </div>
            <div>
              <span className="font-semibold">Updated at:</span> {new Date(task.updated_at).toLocaleString()}
            </div>
          </div>
          {task.image_url && (
            <div className="mt-2">
              <img src={task.image_url} alt="Task" className="max-w-full max-h-60 rounded-lg border" />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
} 