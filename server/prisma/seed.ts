import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding...');

  const user = await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {},
    create: {
      googleId: 'fake-google-id-123',
      email: 'test@example.com',
      name: 'Test User',
      avatar: null,
    },
  });

  console.log('Created user:', user.name);

  const board = await prisma.board.upsert({
    where: { id: 'seed-board-1' },
    update: {},
    create: {
      id: 'seed-board-1',
      title: 'My First Board',
      description: 'A seeded board for development',
      ownerId: user.id,
    },
  });

  console.log('Created board:', board.title);

  const tasks = [
    { title: 'Design system architecture', description: 'Review and finalize the component structure', status: 'BACKLOG' as const, priority: 'HIGH' as const, order: 0, boardId: board.id },
    { title: 'Implement auth flow', description: 'Google OAuth with Passport.js', status: 'IN_PROGRESS' as const, priority: 'HIGH' as const, order: 1, boardId: board.id },
    { title: 'Set up database', description: 'Prisma + PostgreSQL schema and migrations', status: 'DONE' as const, priority: 'MEDIUM' as const, order: 2, boardId: board.id },
    { title: 'Write API endpoints', description: 'Boards and tasks CRUD', status: 'BACKLOG' as const, priority: 'MEDIUM' as const, order: 3, boardId: board.id },
  ];

  for (const task of tasks) {
    await prisma.task.create({ data: task });
  }

  console.log(`Created ${tasks.length} tasks`);
  console.log('Seeding complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });