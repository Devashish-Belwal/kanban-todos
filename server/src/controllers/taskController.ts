import { Request, Response } from 'express';
import { asyncHandler } from '../lib/asyncHandler';
import { prisma } from '../lib/prisma';

// Verify the request has rights to modify this board
// Either: logged-in owner, or valid EDIT share token
async function verifyBoardAccess(req: Request, boardId: string): Promise<boolean> {
  // Share token path
  if (req.shareBoard) {
    return req.shareBoard.id === boardId;
  }
  // Logged-in user path
  if (!req.user) return false;
  const board = await prisma.board.findFirst({
    where: { id: boardId, ownerId: req.user.id },
  });
  return !!board;
}

export const createTask= asyncHandler(async (req,res)=> {
  const { boardId } = req.params;
  const { title, description, status, priority } = req.body;

  const hasAccess = await verifyBoardAccess(req, boardId);
  if (!hasAccess) return res.status(403).json({ error: 'Access denied' });

  const lastTask = await prisma.task.findFirst({
    where: { boardId },
    orderBy: { order: 'desc' },
  });
  const order = lastTask ? lastTask.order + 1 : 0;

  const task = await prisma.task.create({
    data: { title, description, status, priority, order, boardId },
  });
  res.status(201).json(task);
})

export const updateTask = asyncHandler(async (req, res) => {
  console.log('updateTask hit:', {
    boardId: req.params.boardId,
    taskId: req.params.taskId,
    body: req.body,
    user: req.user,
    shareBoard: req.shareBoard,
  });

  const { boardId, taskId } = req.params;

  const hasAccess = await verifyBoardAccess(req, boardId);
  if (!hasAccess) return res.status(403).json({ error: 'Access denied' });

  const task = await prisma.task.update({
    where: { id: taskId },
    data: req.body,
  });
  res.json(task);
})

export const deleteTask= asyncHandler(async (req,res)=> {
  const { boardId, taskId } = req.params;

  const hasAccess = await verifyBoardAccess(req, boardId);
  if (!hasAccess) return res.status(403).json({ error: 'Access denied' });

  await prisma.task.delete({ where: { id: taskId } });
  res.json({ success: true });
})

export const reorderTasks= asyncHandler(async (req,res)=> {
  const { boardId } = req.params;
  const { taskIds } = req.body;

  const hasAccess = await verifyBoardAccess(req, boardId);
  if (!hasAccess) return res.status(403).json({ error: 'Access denied' });

  await Promise.all(
    taskIds.map((id: string, index: number) =>
      prisma.task.update({ where: { id }, data: { order: index } })
    )
  );
  res.json({ success: true });
})
