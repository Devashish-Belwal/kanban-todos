import { asyncHandler } from '../lib/asyncHandler';
import { prisma } from '../lib/prisma';
import { v4 as uuidv4 } from 'uuid';

export const getSharedBoard = asyncHandler(async (req,res)=> {
  const board = await prisma.board.findUnique({
    where: { shareToken: req.params.token },
    include: { tasks: { orderBy: { order: 'asc' } } },
  });
  if (!board) return res.status(404).json({ error: 'Share link not found or revoked' });
  res.json(board);
})

export const enableSharing = asyncHandler(async (req,res)=> {
  const { boardId } = req.params;
  const { permission } = req.body; // 'VIEW' or 'EDIT'

  const board = await prisma.board.findFirst({
    where: { id: boardId, ownerId: req.user!.id },
  });
  if (!board) return res.status(404).json({ error: 'Board not found' });

  // Generate token only if one doesn't exist yet
  const shareToken = board.shareToken ?? uuidv4();

  const updated = await prisma.board.update({
    where: { id: boardId },
    data: { shareToken, sharePermission: permission },
  });
  res.json({ shareToken: updated.shareToken, sharePermission: updated.sharePermission });
})

export const revokeSharing = asyncHandler(async (req,res)=> {
  const { boardId } = req.params;

  const board = await prisma.board.findFirst({
    where: { id: boardId, ownerId: req.user!.id },
  });
  if (!board) return res.status(404).json({ error: 'Board not found' });

  await prisma.board.update({
    where: { id: boardId },
    data: { shareToken: null, sharePermission: null },
  });
  res.json({ success: true });
})