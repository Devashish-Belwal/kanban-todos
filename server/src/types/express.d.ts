import { User } from '@prisma/client';

declare global {
  namespace Express {
    interface User {
      id: string;
      googleId: string;
      email: string;
      name: string;
      avatar: string | null;
      createdAt: Date;
    }
  }
}