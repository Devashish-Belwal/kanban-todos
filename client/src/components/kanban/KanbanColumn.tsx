import { useRef } from 'react';
import { useDrop } from 'react-dnd';
import { TaskCard } from './TaskCard';
import type { Task } from '../../types/kanban';

interface KanbanColumnProps {
  title: string;
  status: Task['status'];
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onTaskDrop: (taskId: string, newStatus: Task['status']) => void;
  onTaskReorder: (draggedId: string, targetId: string, status: Task['status']) => void;
  onStatusChange: (taskId: string, newStatus: Task['status']) => void;
  onMoveTask: (taskId: string, direction: 'up' | 'down') => void;
  onHeaderDoubleClick: (status: Task['status']) => void;
}

export function KanbanColumn({
  title, status, tasks,
  onTaskClick, onTaskDrop, onTaskReorder,
  onStatusChange, onMoveTask, onHeaderDoubleClick,
}: KanbanColumnProps) {
  const ref = useRef<HTMLDivElement>(null);

  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'TASK',
    drop: (item: { id: string; status: Task['status'] }) => {
      if (item.status !== status) onTaskDrop(item.id, status);
    },
    collect: (monitor) => ({ isOver: monitor.isOver() }),
  }));

  drop(ref);

  const columnColors = {
    backlog: 'from-slate-500/10 to-slate-600/5',
    'in-progress': 'from-blue-500/10 to-purple-600/5',
    done: 'from-green-500/10 to-emerald-600/5',
  };

  const headerColors = {
    backlog: 'text-slate-400',
    'in-progress': 'text-blue-400',
    done: 'text-green-400',
  };

  return (
    <div className="flex h-full flex-1 flex-col lg:min-w-[320px]">
      <div
        className="mb-4 flex items-center justify-between px-1 cursor-pointer select-none"
        onDoubleClick={() => onHeaderDoubleClick(status)}
      >
        <div className="flex items-center gap-2">
          <h2 className={`text-sm uppercase tracking-wider ${headerColors[status]}`}>{title}</h2>
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/10 font-mono text-[10px] text-white/60">
            {tasks.length}
          </span>
        </div>
      </div>

      <div
        ref={ref}
        className={`flex-1 space-y-3 rounded-2xl border border-white/10 bg-linear-to-b p-4 transition-all ${columnColors[status]} ${isOver ? 'border-white/30 bg-white/5 shadow-[0_0_30px_rgba(255,255,255,0.1)]' : ''}`}
        style={{ minHeight: '500px', boxShadow: '0 0 40px rgba(0, 0, 0, 0.2)' }}
      >
        {tasks.length === 0 ? (
          <div className="flex h-40 items-center justify-center">
            <p className="font-mono text-xs text-white/30">{isOver ? 'Drop here' : 'No tasks'}</p>
          </div>
        ) : (
          tasks.map((task, index) => (
            <TaskCard
              key={task.id}
              task={task}
              onClick={() => onTaskClick(task)}
              onReorder={(draggedId, targetId) => onTaskReorder(draggedId, targetId, status)}
              onStatusChange={onStatusChange}
              onMoveUp={() => onMoveTask(task.id, 'up')}
              onMoveDown={() => onMoveTask(task.id, 'down')}
              canMoveUp={index > 0}
              canMoveDown={index < tasks.length - 1}
            />
          ))
        )}
      </div>
    </div>
  );
}