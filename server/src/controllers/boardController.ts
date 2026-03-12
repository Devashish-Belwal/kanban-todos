import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { asyncHandler } from '../lib/asyncHandler';

export const getBoards = asyncHandler(async (req, res) => {
  const boards = await prisma.board.findMany({
    where: { ownerId: req.user!.id },
    orderBy: { createdAt: 'desc' },
  });
  res.json(boards);
});

export const createBoard = asyncHandler(async (req, res) => {
  const { title, description } = req.body;
  if (!title) return res.status(400).json({ error: 'Title is required' });
  const board = await prisma.board.create({
    data: { title, description, ownerId: req.user!.id },
  });
  res.status(201).json(board);
});

export const getBoard = asyncHandler(async (req, res) => {
  const board = await prisma.board.findFirst({
    where: { id: req.params.id, ownerId: req.user!.id },
    include: { tasks: { orderBy: { order: 'asc' } } },
  });
  if (!board) return res.status(404).json({ error: 'Board not found' });
  res.json(board);
});

export const updateBoard = asyncHandler(async (req, res) => {
  const { title, description } = req.body;
  const board = await prisma.board.findFirst({
    where: { id: req.params.id, ownerId: req.user!.id },
  });
  if (!board) return res.status(404).json({ error: 'Board not found' });
  const updated = await prisma.board.update({
    where: { id: req.params.id },
    data: { title, description },
  });
  res.json(updated);
});

export const deleteBoard = asyncHandler(async (req, res) => {
  const board = await prisma.board.findFirst({
    where: { id: req.params.id, ownerId: req.user!.id },
  });
  if (!board) return res.status(404).json({ error: 'Board not found' });
  await prisma.board.delete({ where: { id: req.params.id } });
  res.json({ success: true });
});

// export async function deleteBoard(req: Request, res: Response) {
//   const board = await prisma.board.findFirst({
//     where: { id: req.params.id, ownerId: req.user!.id },
//   });
//   if (!board) return res.status(404).json({ error: 'Board not found' });

//   await prisma.board.delete({ where: { id: req.params.id } });
//   res.json({ success: true });
// }