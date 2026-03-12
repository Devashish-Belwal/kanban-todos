import { useRef } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { GripVertical, Clock, AlertCircle, ChevronUp, ChevronDown } from 'lucide-react';
import { motion } from 'motion/react';
import type { Task } from '../../types/kanban';

interface TaskCardProps {
  task: Task;
  onClick: () => void;
  onReorder: (draggedId: string, targetId: string) => void;
  onStatusChange: (taskId: string, newStatus: Task['status']) => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
}

export function TaskCard({
  task, onClick, onReorder, onStatusChange,
  onMoveUp, onMoveDown, canMoveUp = false, canMoveDown = false,
}: TaskCardProps) {
  const ref = useRef<HTMLDivElement>(null);

  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'TASK',
    item: { id: task.id, status: task.status },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));

  const [, drop] = useDrop(() => ({
    accept: 'TASK',
    hover: (item: { id: string; status: Task['status'] }) => {
      if (item.id !== task.id) {
        onReorder(item.id, task.id);
      }
    },
  }));

  // Connect both drag and drop to the same DOM element
  drag(drop(ref));

  const priorityColors = {
    low: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    medium: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    high: 'bg-red-500/10 text-red-400 border-red-500/20',
  };

  const priorityIcons = {
    low: null,
    medium: <Clock className="h-3 w-3" />,
    high: <AlertCircle className="h-3 w-3" />,
  };

  return (
    <motion.div
      ref={ref}
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: isDragging ? 0.5 : 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      onClick={onClick}
      className="group relative cursor-pointer rounded-xl border border-white/10 bg-linear-to-br from-white/5 to-white/2 p-4 backdrop-blur-sm transition-all hover:border-white/20 hover:from-white/[0.07] hover:to-white/3 select-none"
      style={{ boxShadow: '0 0 20px rgba(0, 0, 0, 0.3)' }}
    >
      {/* Drag Handle */}
      <div
        className="absolute left-2 top-1/2 hidden -translate-y-1/2 cursor-grab opacity-0 transition-opacity group-hover:opacity-60 active:cursor-grabbing lg:block"
        onClick={(e) => e.stopPropagation()}
      >
        <GripVertical className="h-4 w-4 text-white" />
      </div>

      <div className="space-y-3 pl-3">
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider ${priorityColors[task.priority]}`}>
            {priorityIcons[task.priority]}
            {task.priority}
          </span>
          <span className="font-mono text-[10px] text-white/30">#{task.id.slice(0, 6)}</span>
        </div>

        <h3 className="text-sm leading-relaxed text-white/90">{task.title}</h3>

        {task.description && (
          <p className="line-clamp-2 text-xs leading-relaxed text-white/50">{task.description}</p>
        )}

        <div className="flex items-center justify-between pt-1">
          <span className="font-mono text-[10px] text-white/30">
            {new Date(task.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </span>
        </div>

        {/* Mobile Status Buttons */}
        <div className="flex gap-2 pt-2 lg:hidden" onClick={(e) => e.stopPropagation()}>
          {(['backlog', 'in-progress', 'done'] as const).map((s) => (
            <button key={s} onClick={() => onStatusChange(task.id, s)} disabled={task.status === s}
              className={`flex-1 rounded-lg border px-2 py-1.5 font-mono text-[10px] uppercase tracking-wider transition-all ${
                task.status === s ? 'border-slate-500/30 bg-slate-500/20 text-slate-400'
                : 'border-white/10 bg-white/5 text-white/50 hover:border-white/20 hover:bg-white/10'
              }`}>
              {s === 'in-progress' ? 'Prog' : s}
            </button>
          ))}
        </div>

        {/* Mobile Move Buttons */}
        <div className="flex gap-2 pt-2 lg:hidden" onClick={(e) => e.stopPropagation()}>
          <button onClick={onMoveUp} disabled={!canMoveUp}
            className={`flex-1 rounded-lg border px-2 py-1.5 transition-all ${!canMoveUp ? 'border-slate-500/30 bg-slate-500/20 text-slate-400' : 'border-white/10 bg-white/5 text-white/50 hover:bg-white/10'}`}>
            <ChevronUp className="h-3 w-3 mx-auto" />
          </button>
          <button onClick={onMoveDown} disabled={!canMoveDown}
            className={`flex-1 rounded-lg border px-2 py-1.5 transition-all ${!canMoveDown ? 'border-slate-500/30 bg-slate-500/20 text-slate-400' : 'border-white/10 bg-white/5 text-white/50 hover:bg-white/10'}`}>
            <ChevronDown className="h-3 w-3 mx-auto" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}