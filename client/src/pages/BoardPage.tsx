import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Plus } from 'lucide-react';
import { KanbanColumn } from '../components/kanban/KanbanColumn';
import { TaskModal } from '../components/kanban/TaskModal';
import api from '../lib/api';
import { toUITask, toAPIStatus, toAPIPriority } from '../lib/transforms';
import type { Task } from '../types/kanban';
import { TaskCardSkeleton } from '../components/Skeleton';

interface Board {
  id: string;
  title: string;
  shareToken?: string;
  sharePermission?: 'VIEW' | 'EDIT';
  tasks: any[];
}

export default function BoardPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [initialStatus, setInitialStatus] = useState<Task['status'] | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [copied, setCopied] = useState(false);

  // ── Data fetching ─────────────────────────────────────
  const { data: board, isLoading } = useQuery({
    queryKey: ['board', id],
    queryFn: () => api.get<Board>(`/boards/${id}`).then((r) => r.data),
  });

  const tasks: Task[] = (board?.tasks ?? []).map(toUITask);

  // ── Mutations ─────────────────────────────────────────
  const invalidateBoard = () => queryClient.invalidateQueries({ queryKey: ['board', id] });

  const createTask = useMutation({
    mutationFn: (data: Partial<Task>) =>
      api.post(`/boards/${id}/tasks`, {
        title: data.title,
        description: data.description,
        status: toAPIStatus(data.status || 'backlog'),
        priority: toAPIPriority(data.priority || 'medium'),
      }),
    onSuccess: invalidateBoard,
  });

  const updateTask = useMutation({
    mutationFn: ({ taskId, data }: { taskId: string; data: Partial<Task> }) =>
      api.put(`/boards/${id}/tasks/${taskId}`, {
        title: data.title,
        description: data.description,
        status: toAPIStatus(data.status!),
        priority: toAPIPriority(data.priority!),
      }),
    onSuccess: invalidateBoard,
  });

  const deleteTask = useMutation({
    mutationFn: (taskId: string) => api.delete(`/boards/${id}/tasks/${taskId}`),
    onSuccess: invalidateBoard,
  });

  const reorderTasks = useMutation({
    mutationFn: (taskIds: string[]) =>
      api.put(`/boards/${id}/tasks/reorder`, { taskIds }),
    onSuccess: invalidateBoard,
  });

  // ── Share mutations ───────────────────────────────────
  const enableSharing = useMutation({
    mutationFn: (permission: 'VIEW' | 'EDIT') =>
      api.post(`/boards/${id}/share`, { permission }),
    onSuccess: invalidateBoard,
  });

  const revokeSharing = useMutation({
    mutationFn: () => api.delete(`/boards/${id}/share`),
    onSuccess: invalidateBoard,
  });

  // ── Event handlers ────────────────────────────────────
  const handleTaskDrop = (taskId: string, newStatus: Task['status']) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;
    updateTask.mutate({ taskId, data: { ...task, status: newStatus } });
  };

  const handleStatusChange = (taskId: string, newStatus: Task['status']) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;
    updateTask.mutate({ taskId, data: { ...task, status: newStatus } });
  };

  const handleTaskReorder = (draggedId: string, targetId: string, status: Task['status']) => {
    const statusTasks = tasks.filter((t) => t.status === status);
    const withoutDragged = statusTasks.filter((t) => t.id !== draggedId);
    const targetIndex = withoutDragged.findIndex((t) => t.id === targetId);
    const dragged = statusTasks.find((t) => t.id === draggedId)!;
    const reordered = [...withoutDragged];
    reordered.splice(targetIndex, 0, dragged);
    // Build full task ID list preserving other columns
    const otherTasks = tasks.filter((t) => t.status !== status);
    const allOrdered = [...otherTasks, ...reordered];
    reorderTasks.mutate(allOrdered.map((t) => t.id));
  };

  const handleMoveTask = (taskId: string, direction: 'up' | 'down') => {
    const task = tasks.find((t) => t.id === taskId)!;
    const colTasks = tasks.filter((t) => t.status === task.status);
    const index = colTasks.findIndex((t) => t.id === taskId);
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === colTasks.length - 1) return;
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    const reordered = [...colTasks];
    [reordered[index], reordered[swapIndex]] = [reordered[swapIndex], reordered[index]];
    const otherTasks = tasks.filter((t) => t.status !== task.status);
    reorderTasks.mutate([...otherTasks, ...reordered].map((t) => t.id));
  };

  const handleSaveTask = (data: Partial<Task>) => {
    if (selectedTask) {
      updateTask.mutate({ taskId: selectedTask.id, data: { ...selectedTask, ...data } });
    } else {
      createTask.mutate(data);
    }
  };

  const handleDeleteTask = () => {
    if (selectedTask) {
      deleteTask.mutate(selectedTask.id);
      setIsModalOpen(false);
    }
  };

  const shareUrl = board?.shareToken
    ? `${window.location.origin}/shared/${board.shareToken}`
    : null;

  const handleCopy = () => {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ── Render ────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white">
        <div className="container mx-auto px-6 py-8">
          <div className="flex gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex-1 bg-white/5 rounded-xl p-4 border border-white/10">
                <div className="h-4 bg-white/10 rounded w-1/3 mb-4 animate-pulse" />
                <div className="space-y-3">
                  {[...Array(2)].map((_, j) => <TaskCardSkeleton key={j} />)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!board) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <p className="text-white/50 mb-4">Board not found.</p>
          <button onClick={() => navigate('/boards')} className="text-white underline text-sm">
            Back to boards
          </button>
        </div>
      </div>
    );
  }

  const backlogTasks = tasks.filter((t) => t.status === 'backlog');
  const inProgressTasks = tasks.filter((t) => t.status === 'in-progress');
  const doneTasks = tasks.filter((t) => t.status === 'done');

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="dark min-h-screen bg-black">
        {/* Ambient background */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -left-40 -top-40 h-80 w-80 rounded-full bg-blue-500/20" style={{ filter: 'blur(100px)' }} />
          <div className="absolute -right-40 top-1/4 h-80 w-80 rounded-full bg-purple-500/20" style={{ filter: 'blur(100px)' }} />
          <div className="absolute -bottom-40 left-1/3 h-80 w-80 rounded-full bg-indigo-500/20" style={{ filter: 'blur(100px)' }} />
        </div>

        <div className="relative z-10">
          {/* Header */}
          <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-black/50 backdrop-blur-xl">
            <div className="container mx-auto flex h-16 items-center justify-between px-6">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => navigate('/boards')}
                  className="text-white/50 hover:text-white text-sm transition-colors"
                >
                  ← Boards
                </button>
                <h1 className="font-mono text-sm tracking-tight text-white">{board.title}</h1>
              </div>

              {/* Stats */}
              <div className="hidden md:flex items-center gap-4">
                {[
                  { label: 'Total', value: tasks.length },
                  { label: 'Progress', value: inProgressTasks.length },
                  { label: 'Done', value: doneTasks.length },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5">
                    <span className="font-mono text-xs text-white/50">{label}</span>
                    <span className="font-mono text-sm text-white">{value}</span>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowShareModal(true)}
                  className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/70 hover:bg-white/10 hover:text-white transition-all"
                >
                  Share
                </button>
                <button
                  onClick={() => { setSelectedTask(null); setInitialStatus(null); setIsModalOpen(true); }}
                  className="flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-medium text-black hover:bg-white/90 transition-all"
                >
                  <Plus className="h-4 w-4" />
                  New Task
                </button>
              </div>
            </div>
          </header>

          {/* Board */}
          <main className="container mx-auto px-6 py-8">
            <div className="flex flex-col gap-6 pb-8 lg:flex-row">
              <KanbanColumn
                title="Backlog" status="backlog" tasks={backlogTasks}
                onTaskClick={(t) => { setSelectedTask(t); setIsModalOpen(true); }}
                onTaskDrop={handleTaskDrop}
                onTaskReorder={handleTaskReorder}
                onStatusChange={handleStatusChange}
                onMoveTask={handleMoveTask}
                onHeaderDoubleClick={(s) => { setSelectedTask(null); setInitialStatus(s); setIsModalOpen(true); }}
              />
              <KanbanColumn
                title="In Progress" status="in-progress" tasks={inProgressTasks}
                onTaskClick={(t) => { setSelectedTask(t); setIsModalOpen(true); }}
                onTaskDrop={handleTaskDrop}
                onTaskReorder={handleTaskReorder}
                onStatusChange={handleStatusChange}
                onMoveTask={handleMoveTask}
                onHeaderDoubleClick={(s) => { setSelectedTask(null); setInitialStatus(s); setIsModalOpen(true); }}
              />
              <KanbanColumn
                title="Done" status="done" tasks={doneTasks}
                onTaskClick={(t) => { setSelectedTask(t); setIsModalOpen(true); }}
                onTaskDrop={handleTaskDrop}
                onTaskReorder={handleTaskReorder}
                onStatusChange={handleStatusChange}
                onMoveTask={handleMoveTask}
                onHeaderDoubleClick={(s) => { setSelectedTask(null); setInitialStatus(s); setIsModalOpen(true); }}
              />
            </div>
          </main>
        </div>

        {/* Task Modal */}
        <TaskModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSaveTask}
          onDelete={selectedTask ? handleDeleteTask : undefined}
          task={selectedTask}
          initialStatus={initialStatus}
        />

        {/* Share Modal */}
        {showShareModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
            onClick={() => setShowShareModal(false)}>
            <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6 w-full max-w-md mx-4"
              onClick={(e) => e.stopPropagation()}>
              <h2 className="text-lg font-semibold mb-1 text-white">Share Board</h2>
              <p className="text-white/40 text-sm mb-6">Anyone with the link can access this board.</p>

              {!board.shareToken ? (
                <div className="space-y-3">
                  <p className="text-white/60 text-sm">Choose a permission level:</p>
                  <div className="flex gap-3">
                    <button onClick={() => enableSharing.mutate('VIEW')} disabled={enableSharing.isPending}
                      className="flex-1 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg py-3 text-sm font-medium text-white transition-colors">
                      👁 View only
                    </button>
                    <button onClick={() => enableSharing.mutate('EDIT')} disabled={enableSharing.isPending}
                      className="flex-1 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg py-3 text-sm font-medium text-white transition-colors">
                      ✏️ Can edit
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-2">
                    <p className="text-white/60 text-xs flex-1 truncate">{shareUrl}</p>
                    <button onClick={handleCopy}
                      className="text-xs text-white bg-white/20 hover:bg-white/30 px-3 py-1 rounded-md transition-colors shrink-0">
                      {copied ? '✓ Copied' : 'Copy'}
                    </button>
                  </div>
                  <p className="text-white/40 text-xs">
                    Permission: <span className="text-white/70">{board.sharePermission === 'VIEW' ? 'View only' : 'Can edit'}</span>
                  </p>
                  <button onClick={() => revokeSharing.mutate()} disabled={revokeSharing.isPending}
                    className="w-full text-red-400 hover:text-red-300 border border-red-400/20 hover:border-red-400/40 rounded-lg py-2 text-sm transition-colors">
                    Revoke link
                  </button>
                </div>
              )}

              <button onClick={() => setShowShareModal(false)}
                className="mt-4 w-full text-white/30 hover:text-white/60 text-sm transition-colors">
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </DndProvider>
  );
}