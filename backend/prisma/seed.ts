import {
  NotificationType,
  PrismaClient,
  TicketPriority,
  TicketStatus,
  UserRole,
  UserStatus,
} from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const demoUsers = [
  ['admin@example.com', 'System Admin', UserRole.ADMIN, 'Admin@123'],
  ['staff@example.com', 'Support Agent 1', UserRole.AGENT, 'Staff@123'],
  ['staff2@example.com', 'Support Agent 2', UserRole.AGENT, 'Staff@123'],
  ['customer@example.com', 'Demo Customer 1', UserRole.USER, 'Customer@123'],
  ['customer2@example.com', 'Demo Customer 2', UserRole.USER, 'Customer@123'],
  ['customer3@example.com', 'Demo Customer 3', UserRole.USER, 'Customer@123'],
] as const;

const demoCategories = [
  ['Tài khoản', 'tai-khoan', 'Đăng nhập, mật khẩu và quyền truy cập'],
  ['Phần mềm', 'phan-mem', 'Ứng dụng và lỗi phần mềm'],
  ['Phần cứng', 'phan-cung', 'Máy tính và thiết bị ngoại vi'],
  ['Mạng', 'mang', 'Internet, Wi-Fi và kết nối nội bộ'],
  ['Thanh toán', 'thanh-toan', 'Hóa đơn và giao dịch'],
] as const;

const priorities = [
  TicketPriority.LOW,
  TicketPriority.MEDIUM,
  TicketPriority.HIGH,
  TicketPriority.URGENT,
] as const;

const statuses = [
  TicketStatus.OPEN,
  TicketStatus.ASSIGNED,
  TicketStatus.IN_PROGRESS,
  TicketStatus.WAITING_FOR_USER,
  TicketStatus.RESOLVED,
  TicketStatus.REOPENED,
  TicketStatus.CLOSED,
  TicketStatus.CANCELLED,
] as const;

const ticketSubjects = [
  'Không đăng nhập được hệ thống',
  'Ứng dụng hiển thị màn hình trắng',
  'Máy tính không nhận bàn phím',
  'Kết nối Wi-Fi thường xuyên bị ngắt',
  'Không tải được hóa đơn tháng này',
  'Cần cấp lại quyền truy cập',
  'Ứng dụng chạy chậm sau cập nhật',
  'Màn hình nhấp nháy khi khởi động',
  'Không truy cập được mạng nội bộ',
  'Giao dịch bị ghi nhận hai lần',
  'Không nhận được email xác minh',
  'Không thể xuất báo cáo PDF',
  'Ổ cứng ngoài không được nhận diện',
  'VPN không kết nối được',
  'Cần điều chỉnh thông tin hóa đơn',
  'Tài khoản bị khóa ngoài ý muốn',
  'Thông báo trong ứng dụng không hoạt động',
  'Chuột không dây mất kết nối',
] as const;

function deterministicUuid(namespace: number, index: number): string {
  return `${namespace.toString().padStart(8, '0')}-0000-4000-8000-${index
    .toString()
    .padStart(12, '0')}`;
}

function dueHours(priority: TicketPriority): number {
  return {
    [TicketPriority.LOW]: 72,
    [TicketPriority.MEDIUM]: 48,
    [TicketPriority.HIGH]: 24,
    [TicketPriority.URGENT]: 4,
  }[priority];
}

async function seedUsers() {
  const users = new Map<string, { id: string }>();

  for (const [email, fullName, role, password] of demoUsers) {
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.upsert({
      where: { email },
      update: { fullName, role, status: UserStatus.ACTIVE, deletedAt: null },
      create: { email, fullName, role, passwordHash },
      select: { id: true },
    });
    users.set(email, user);
  }

  return users;
}

async function seedCategories() {
  const categories = new Map<string, { id: string }>();

  for (const [name, slug, description] of demoCategories) {
    const category = await prisma.category.upsert({
      where: { slug },
      update: { name, description, isActive: true },
      create: { name, slug, description },
      select: { id: true },
    });
    categories.set(slug, category);
  }

  return categories;
}

async function seedTickets(
  users: Map<string, { id: string }>,
  categories: Map<string, { id: string }>,
): Promise<void> {
  const customerIds = [
    users.get('customer@example.com')?.id,
    users.get('customer2@example.com')?.id,
    users.get('customer3@example.com')?.id,
  ];
  const agentIds = [
    users.get('staff@example.com')?.id,
    users.get('staff2@example.com')?.id,
  ];
  const categoryIds = demoCategories.map(
    ([, slug]) => categories.get(slug)?.id,
  );
  const adminId = users.get('admin@example.com')?.id;

  if (
    customerIds.some((id) => !id) ||
    agentIds.some((id) => !id) ||
    categoryIds.some((id) => !id) ||
    !adminId
  ) {
    throw new Error('Demo users or categories could not be created');
  }

  for (const [index, title] of ticketSubjects.entries()) {
    const number = index + 1;
    const status = statuses[index % statuses.length];
    const priority = priorities[index % priorities.length];
    const creatorId = customerIds[index % customerIds.length] as string;
    const categoryId = categoryIds[index % categoryIds.length] as string;
    const assigneeId =
      status === TicketStatus.OPEN || status === TicketStatus.CANCELLED
        ? null
        : (agentIds[index % agentIds.length] as string);
    const createdAt = new Date(Date.UTC(2026, 7, number, 8, 0, 0));
    const resolvedAt =
      status === TicketStatus.RESOLVED || status === TicketStatus.CLOSED
        ? new Date(createdAt.getTime() + 3 * 3_600_000)
        : null;
    const closedAt =
      status === TicketStatus.CLOSED
        ? new Date(createdAt.getTime() + 4 * 3_600_000)
        : null;
    const code = `HD-2026-${number.toString().padStart(6, '0')}`;

    const ticket = await prisma.ticket.upsert({
      where: { code },
      update: {
        title,
        priority,
        status,
        creatorId,
        assigneeId,
        categoryId,
        resolvedAt,
        closedAt,
      },
      create: {
        code,
        title,
        description: `Dữ liệu demo cho yêu cầu: ${title}.`,
        priority,
        status,
        creatorId,
        assigneeId,
        categoryId,
        dueAt: new Date(createdAt.getTime() + dueHours(priority) * 3_600_000),
        resolvedAt,
        closedAt,
        createdAt,
      },
      select: { id: true },
    });

    await prisma.comment.upsert({
      where: { id: deterministicUuid(1, number) },
      update: { content: `Bình luận mẫu cho ${code}.` },
      create: {
        id: deterministicUuid(1, number),
        ticketId: ticket.id,
        authorId: creatorId,
        content: `Bình luận mẫu cho ${code}.`,
        createdAt: new Date(createdAt.getTime() + 15 * 60_000),
      },
    });

    await prisma.notification.upsert({
      where: { id: deterministicUuid(2, number) },
      update: { title: `Ticket ${code} đã được tạo` },
      create: {
        id: deterministicUuid(2, number),
        type: NotificationType.TICKET_CREATED,
        title: `Ticket ${code} đã được tạo`,
        message: title,
        recipientId: adminId,
        actorId: creatorId,
        ticketId: ticket.id,
        createdAt,
      },
    });

    await prisma.ticketHistory.upsert({
      where: { id: deterministicUuid(3, number) },
      update: { action: 'CREATED' },
      create: {
        id: deterministicUuid(3, number),
        action: 'CREATED',
        newValue: { status: TicketStatus.OPEN },
        ticketId: ticket.id,
        actorId: creatorId,
        createdAt,
      },
    });
  }
}

async function main(): Promise<void> {
  const users = await seedUsers();
  const categories = await seedCategories();
  await seedTickets(users, categories);
}

main()
  .then(async () => prisma.$disconnect())
  .catch(async (error: unknown) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
