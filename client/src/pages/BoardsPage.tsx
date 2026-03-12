import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import { BoardCardSkeleton } from '../components/Skeleton';

interface Board {
  id: string;
  title: string;
  description?: string;
  createdAt: string;
}

export default function BoardsPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [newTitle, setNewTitle] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const { data: boards = [], isLoading } = useQuery({
    queryKey: ['boards'],
    queryFn: () => api.get<Board[]>('/boards').then((r) => r.data),
  });

  const createBoard = useMutation({
    mutationFn: (title: string) => api.post('/boards', { title }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boards'] });
      setNewTitle('');
      setIsCreating(false);
    },
  });

  const deleteBoard = useMutation({
    mutationFn: (id: string) => api.delete(`/boards/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['boards'] }),
  });

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">TaskFlow</h1>
        <div className="flex items-center gap-4">
          <span className="text-white/50 text-sm">{user?.name}</span>
          <button
            onClick={logout}
            className="text-sm text-white/50 hover:text-white transition-colors"
          >
            Sign out
          </button>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-semibold">My Boards</h2>
          <button
            onClick={() => setIsCreating(true)}
            className="bg-white text-black px-4 py-2 rounded-lg text-sm font-medium hover:bg-white/90 transition-colors"
          >
            + New Board
          </button>
        </div>

        {/* New board form */}
        {isCreating && (
          <div className="mb-6 flex gap-3">
            <input
              autoFocus
              type="text"
              placeholder="Board name..."
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && newTitle.trim()) createBoard.mutate(newTitle.trim());
                if (e.key === 'Escape') setIsCreating(false);
              }}
              className="bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder:text-white/30 flex-1 outline-none focus:border-white/40"
            />
            <button
              onClick={() => newTitle.trim() && createBoard.mutate(newTitle.trim())}
              className="bg-white text-black px-4 py-2 rounded-lg text-sm font-medium"
            >
              Create
            </button>
            <button
              onClick={() => setIsCreating(false)}
              className="text-white/50 px-4 py-2 text-sm"
            >
              Cancel
            </button>
          </div>
        )}

        {/* Board grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => <BoardCardSkeleton key={i} />)}
          </div>
        ) : boards.length === 0 ? (
          <p className="text-white/30">No boards yet. Create one to get started.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {boards.map((board) => (
              <div
                key={board.id}
                onClick={() => navigate(`/boards/${board.id}`)}
                className="bg-white/5 border border-white/10 rounded-xl p-5 cursor-pointer hover:bg-white/10 hover:border-white/20 transition-all group"
              >
                <div className="flex items-start justify-between">
                  <h3 className="font-medium text-white">{board.title}</h3>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteBoard.mutate(board.id);
                    }}
                    className="text-white/20 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 text-sm"
                  >
                    Delete
                  </button>
                </div>
                {board.description && (
                  <p className="text-white/40 text-sm mt-1">{board.description}</p>
                )}
                <p className="text-white/20 text-xs mt-3">
                  {new Date(board.createdAt).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}