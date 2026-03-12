export interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'backlog' | 'in-progress' | 'done';
  priority: 'low' | 'medium' | 'high';
  createdAt: string;
  order: number;
  boardId: string;
}