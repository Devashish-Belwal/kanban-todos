import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';

// Extends req with share context so controllers can use it
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
  // If the user is logged in normally, let them through
  if (req.isAuthenticated()) return next();

  // Check for share token in the Authorization header
  // Frontend will send: Authorization: Bearer <shareToken>
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const token = authHeader.slice(7);
  const board = await prisma.board.findUnique({
    where: { shareToken: token },
  });

  if (!board || board.sharePermission !== 'EDIT') {
    return res.status(403).json({ error: 'Insufficient permissions' });
  }

  // Also verify the boardId in the URL matches the token's board
  if (req.params.boardId && req.params.boardId !== board.id) {
    return res.status(403).json({ error: 'Token does not match this board' });
  }

  req.shareBoard = { id: board.id, permission: 'EDIT' };
  next();
}