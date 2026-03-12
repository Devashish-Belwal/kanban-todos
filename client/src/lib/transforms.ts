import type { Task } from '../types/kanban';

// API → UI
export function toUITask(apiTask: any): Task {
  return {
    ...apiTask,
    status: ({
      BACKLOG: 'backlog',
      IN_PROGRESS: 'in-progress',
      DONE: 'done',
    } as const)[apiTask.status as string] ?? 'backlog',
    priority: apiTask.priority.toLowerCase() as Task['priority'],
  };
}

// UI → API
export function toAPIStatus(uiStatus: Task['status']): string {
  return ({
    'backlog': 'BACKLOG',
    'in-progress': 'IN_PROGRESS',
    'done': 'DONE',
  })[uiStatus];
}

export function toAPIPriority(uiPriority: Task['priority']): string {
  return uiPriority.toUpperCase();
}