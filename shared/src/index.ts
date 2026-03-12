export type Status = 'BACKLOG' | 'IN_PROGRESS' | 'DONE';
export type Priority = 'LOW' | 'MEDIUM' | 'HIGH';
export type ShareMode = 'VIEW' | 'EDIT';

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: Status;
  priority: Priority;
  order: number;
  boardId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Board {
  id: string;
  title: string;
  description?: string;
  ownerId: string;
  shareToken?: string;
  sharePermission?: ShareMode;
  tasks: Task[];
  createdAt: string;
  updatedAt: string;
}