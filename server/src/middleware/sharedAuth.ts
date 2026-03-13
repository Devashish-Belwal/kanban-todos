import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';

declare global {
  namespace Express {
    interface Request {
      shareBoard?: { id: string; permission: string };
    }
  }
}

export async function requireAuthOrShareEdit(
  req: Request,
  res: Response,
  next: NextFunction
) {
  
  console.log('sharedAuth hit:', {
  isAuthenticated: req.isAuthenticated(),
  authHeader: req.headers.authorization,
  boardId: req.params.boardId,
  
  // If logged in via session, allow through
  if (req.isAuthenticated()) return next();

  // Check Authorization header for share token
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const token = authHeader.slice(7);

  try {
    const board = await prisma.board.findUnique({
      where: { shareToken: token },
    });

    if (!board || board.sharePermission !== 'EDIT') {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    if (req.params.boardId && req.params.boardId !== board.id) {
      return res.status(403).json({ error: 'Token does not match this board' });
    }

    req.shareBoard = { id: board.id, permission: 'EDIT' };
    next();
  } catch (err) {
    next(err);
  }
}
