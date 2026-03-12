import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Plus } from 'lucide-react';
import axios from 'axios';
import { KanbanColumn } from '../components/kanban/KanbanColumn';
import { TaskModal } from '../components/kanban/TaskModal';
import { toUITask, toAPIStatus, toAPIPriority } from '../lib/transforms';
import type { Task } from '../types/kanban';

interface Board {
  id: string;
  title: string;
  sharePermission: 'VIEW' | 'EDIT';
  tasks: any[];
}

export default function SharedBoardPage() {
  const { token } = useParams<{ token: string }>();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [initialStatus, setInitialStatus] = useState<Task['status'] | null>(null);

  // Shared board API — sends token in Authorization header
  const sharedApi = axios.create({
    baseURL: '/api',
    headers: { Authorization: `Bearer ${token}` },
  });

  const { data: board, isLoading, isError } = useQuery({
    queryKey: ['shared', token],
    queryFn: () =>
      axios.get<Board>(`/api/shared/${token}`).then((r) => r.data),
  });

  const tasks: Task[] = (board?.tasks ?? []).map(toUITask);
  const isReadOnly = board?.sharePermission === 'VIEW';

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['shared', token] });

  const createTask = useMutation({
    mutationFn: (data: Partial<Task>) =>
      sharedApi.post(`/boards/${board!.id}/tasks`, {
        title: data.title,
        description: data.description,
        status: toAPIStatus(data.status || 'backlog'),
        priority: toAPIPriority(data.priority || 'medium'),
      }),
    onSuccess: invalidate,
  });

  const updateTask = useMutation({
    mutationFn: ({ taskId, data }: { taskId: string; data: Partial<Task> }) =>
      sharedApi.put(`/boards/${board!.id}/tasks/${taskId}`, {
        title: data.title,
        description: data.description,
        status: toAPIStatus(data.status!),
        priority: toAPIPriority(data.priority!),
      }),
    onSuccess: invalidate,
  });

  const deleteTask = useMutation({
    mutationFn: (taskId: string) =>
      sharedApi.delete(`/boards/${board!.id}/tasks/${taskId}`),
    onSuccess: invalidate,
  });

  const reorderTasks = useMutation({
    mutationFn: (taskIds: string[]) =>
      sharedApi.put(`/boards/${board!.id}/tasks/reorder`, { taskIds }),
    onSuccess: invalidate,
  });

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
    const otherTasks = tasks.filter((t) => t.status !== status);
    reorderTasks.mutate([...otherTasks, ...reordered].map((t) => t.id));
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-white/50">Loading shared board...</p>
      </div>
    );
  }

  if (isError || !board) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <p className="text-white text-lg font-medium mb-2">Link not found</p>
          <p className="text-white/40 text-sm">
            This share link may have been revoked or never existed.
          </p>
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
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -left-40 -top-40 h-80 w-80 rounded-full bg-blue-500/20" style={{ filter: 'blur(100px)' }} />
          <div className="absolute -right-40 top-1/4 h-80 w-80 rounded-full bg-purple-500/20" style={{ filter: 'blur(100px)' }} />
        </div>

        <div className="relative z-10">
          <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-black/50 backdrop-blur-xl">
            <div className="container mx-auto flex h-16 items-center justify-between px-6">
              <div className="flex items-center gap-3">
                <h1 className="font-mono text-sm tracking-tight text-white">{board.title}</h1>
                <span className="text-xs text-white/30 border border-white/10 px-3 py-1 rounded-full">
                  {isReadOnly ? '👁 View only' : '✏️ Can edit'}
                </span>
              </div>

              {!isReadOnly && (
                <button
                  onClick={() => { setSelectedTask(null); setInitialStatus(null); setIsModalOpen(true); }}
                  className="flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-medium text-black hover:bg-white/90 transition-all"
                >
                  <Plus className="h-4 w-4" />
                  New Task
                </button>
              )}
            </div>
          </header>

          <main className="container mx-auto px-6 py-8">
            {isReadOnly ? (
              // Read-only: simple card display, no interactions
              <div className="flex flex-col gap-6 pb-8 lg:flex-row">
                {[
                  { label: 'Backlog', tasks: backlogTasks },
                  { label: 'In Progress', tasks: inProgressTasks },
                  { label: 'Done', tasks: doneTasks },
                ].map((col) => (
                  <div key={col.label} className="flex-1 bg-white/5 rounded-xl p-4 border border-white/10">
                    <h2 className="font-mono text-sm uppercase tracking-wider text-white/50 mb-4">
                      {col.label} <span className="text-white/30">({col.tasks.length})</span>
                    </h2>
                    <div className="space-y-3">
                      {col.tasks.length === 0 ? (
                        <p className="font-mono text-xs text-white/20 text-center py-8">No tasks</p>
                      ) : col.tasks.map((task) => (
                        <div key={task.id} className="rounded-xl border border-white/10 bg-white/5 p-4">
                          <p className="text-sm text-white/90">{task.title}</p>
                          {task.description && (
                            <p className="text-xs text-white/40 mt-1">{task.description}</p>
                          )}
                          <span className={`text-xs mt-2 inline-block px-2 py-0.5 rounded-full ${
                            task.priority === 'high' ? 'bg-red-500/20 text-red-400' :
                            task.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                            'bg-blue-500/20 text-blue-400'
                          }`}>
                            {task.priority}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              // Edit mode: full interactive board
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
            )}
          </main>
        </div>

        {!isReadOnly && (
          <TaskModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onSave={handleSaveTask}
            onDelete={selectedTask ? handleDeleteTask : undefined}
            task={selectedTask}
            initialStatus={initialStatus}
          />
        )}
      </div>
    </DndProvider>
  );
}