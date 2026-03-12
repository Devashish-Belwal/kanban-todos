import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import type { Task } from '../../types/kanban';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: Partial<Task>) => void;
  onDelete?: () => void;
  task?: Task | null;
  initialStatus?: Task['status'] | null;
}

export function TaskModal({ isOpen, onClose, onSave, onDelete, task, initialStatus }: TaskModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Task['priority']>('medium');
  const [status, setStatus] = useState<Task['status']>('backlog');

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || '');
      setPriority(task.priority);
      setStatus(task.status);
    } else {
      setTitle('');
      setDescription('');
      setPriority('medium');
      setStatus(initialStatus || 'backlog');
    }
  }, [task, isOpen, initialStatus]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSave({ title, description, priority, status });
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-white/20 bg-linear-to-br from-zinc-900 to-black p-6 shadow-2xl"
          >
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl text-white">{task ? 'Edit Task' : 'Create New Task'}</h2>
              <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg text-white/60 hover:bg-white/10 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm text-white/80">Title</label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter task title..."
                  autoFocus
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white placeholder:text-white/30 outline-none focus:border-white/30"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm text-white/80">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Add more details..."
                  rows={3}
                  className="w-full resize-none rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white placeholder:text-white/30 outline-none focus:border-white/30"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm text-white/80">Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as Task['priority'])}
                    className="w-full rounded-lg border border-white/10 bg-zinc-900 px-3 py-2 text-white outline-none focus:border-white/30"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-white/80">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as Task['status'])}
                    className="w-full rounded-lg border border-white/10 bg-zinc-900 px-3 py-2 text-white outline-none focus:border-white/30"
                  >
                    <option value="backlog">Backlog</option>
                    <option value="in-progress">In Progress</option>
                    <option value="done">Done</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4">
                {task && onDelete ? (
                  <button type="button" onClick={onDelete}
                    className="text-sm text-red-400 hover:text-red-300 transition-colors">
                    Delete task
                  </button>
                ) : <div />}
                <div className="flex gap-3">
                  <button type="button" onClick={onClose}
                    className="px-4 py-2 text-sm text-white/60 hover:text-white transition-colors">
                    Cancel
                  </button>
                  <button type="submit"
                    className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-black hover:bg-white/90 transition-colors">
                    {task ? 'Save Changes' : 'Create Task'}
                  </button>
                </div>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}