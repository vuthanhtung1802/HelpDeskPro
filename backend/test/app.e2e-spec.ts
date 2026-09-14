import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { TicketStatus, UserRole } from '@prisma/client';
import bcrypt from 'bcrypt';
import cookieParser from 'cookie-parser';
import { Server } from 'node:http';
import request, { Response } from 'supertest';
import { AppModule } from '../src/app.module';
import { AllExceptionsFilter } from '../src/common/filters/all-exceptions.filter';
import { ResponseInterceptor } from '../src/common/interceptors/response.interceptor';
import { PrismaService } from '../src/prisma/prisma.service';

interface ApiEnvelope<T> {
  data: T;
}
interface AuthData {
  accessToken: string;
  user: { id: string; email: string };
}
interface TicketData {
  id: string;
  code: string;
  status: TicketStatus;
}
interface CommentData {
  id: string;
  content: string;
}
interface AttachmentData {
  id: string;
  originalName: string;
}

function responseData<T>(response: Response): T {
  return (response.body as ApiEnvelope<T>).data;
}

describe('HelpDesk Pro API (e2e)', () => {
  let app: INestApplication;
  let server: Server;
  let prisma: PrismaService;
  const runId = `${Date.now()}-${process.pid}`;
  const password = 'E2eStrong@123';
  const emails = {
    admin: `e2e-admin-${runId}@example.com`,
    agent: `e2e-agent-${runId}@example.com`,
    customer: `e2e-customer-${runId}@example.com`,
    outsider: `e2e-outsider-${runId}@example.com`,
  };
  let agentId: string;
  let categoryId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.use(cookieParser());
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    app.useGlobalFilters(new AllExceptionsFilter());
    app.useGlobalInterceptors(new ResponseInterceptor());
    await app.init();
    server = app.getHttpServer() as Server;
    prisma = app.get(PrismaService);

    const passwordHash = await bcrypt.hash(password, 4);
    const [, agent] = await prisma.$transaction([
      prisma.user.create({
        data: {
          email: emails.admin,
          fullName: 'E2E Admin',
          passwordHash,
          role: UserRole.ADMIN,
        },
      }),
      prisma.user.create({
        data: {
          email: emails.agent,
          fullName: 'E2E Agent',
          passwordHash,
          role: UserRole.AGENT,
        },
        select: { id: true },
      }),
      prisma.user.create({
        data: {
          email: emails.outsider,
          fullName: 'E2E Outsider',
          passwordHash,
        },
      }),
    ]);
    agentId = agent.id;
    const category = await prisma.category.create({
      data: {
        name: `E2E Category ${runId}`,
        slug: `e2e-category-${runId}`,
      },
      select: { id: true },
    });
    categoryId = category.id;
  }, 30_000);

  afterAll(async () => {
    if (prisma) {
      const testUsers = await prisma.user.findMany({
        where: { email: { in: Object.values(emails) } },
        select: { id: true },
      });
      const userIds = testUsers.map((user) => user.id);
      await prisma.ticket.deleteMany({
        where: {
          OR: [{ creatorId: { in: userIds } }, { assigneeId: { in: userIds } }],
        },
      });
      await prisma.category.deleteMany({ where: { id: categoryId } });
      await prisma.user.deleteMany({ where: { id: { in: userIds } } });
    }
    if (app) await app.close();
  }, 30_000);

  it('serves health through the complete application', async () => {
    const response = await request(server).get('/api/v1/health').expect(200);
    expect(responseData<{ status: string }>(response).status).toBe('ok');
  });

  it('covers auth, ticket workflow, permissions and related resources', async () => {
    const customerClient = request.agent(server);
    const registration = await customerClient
      .post('/api/v1/auth/register')
      .send({
        email: emails.customer,
        fullName: 'E2E Customer',
        password,
      })
      .expect(201);
    expect(responseData<AuthData>(registration).user.email).toBe(
      emails.customer,
    );

    const refresh = await customerClient
      .post('/api/v1/auth/refresh')
      .expect(200);
    const customerToken = responseData<AuthData>(refresh).accessToken;

    const login = async (email: string): Promise<string> => {
      const response = await request(server)
        .post('/api/v1/auth/login')
        .send({ email, password })
        .expect(200);
      return responseData<AuthData>(response).accessToken;
    };
    const [adminToken, agentToken, outsiderToken] = await Promise.all([
      login(emails.admin),
      login(emails.agent),
      login(emails.outsider),
    ]);

    const createdResponse = await request(server)
      .post('/api/v1/tickets')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        title: 'E2E authentication problem',
        description: 'The E2E customer cannot access the support portal.',
        priority: 'HIGH',
        categoryId,
      })
      .expect(201);
    const ticket = responseData<TicketData>(createdResponse);
    expect(ticket.status).toBe(TicketStatus.OPEN);

    await request(server)
      .get(`/api/v1/tickets/${ticket.id}`)
      .set('Authorization', `Bearer ${outsiderToken}`)
      .expect(404);

    const assigned = await request(server)
      .patch(`/api/v1/tickets/${ticket.id}/assign`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ agentId })
      .expect(200);
    expect(responseData<TicketData>(assigned).status).toBe(
      TicketStatus.ASSIGNED,
    );

    await request(server)
      .patch(`/api/v1/tickets/${ticket.id}/status`)
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ status: TicketStatus.IN_PROGRESS })
      .expect(403);
    await request(server)
      .patch(`/api/v1/tickets/${ticket.id}/status`)
      .set('Authorization', `Bearer ${agentToken}`)
      .send({ status: TicketStatus.IN_PROGRESS })
      .expect(200);

    const commentResponse = await request(server)
      .post(`/api/v1/tickets/${ticket.id}/comments`)
      .set('Authorization', `Bearer ${agentToken}`)
      .send({ content: 'I am investigating this issue.' })
      .expect(201);
    expect(responseData<CommentData>(commentResponse).content).toContain(
      'investigating',
    );
    await request(server)
      .post(`/api/v1/tickets/${ticket.id}/comments`)
      .set('Authorization', `Bearer ${outsiderToken}`)
      .send({ content: 'I should not be able to comment.' })
      .expect(403);

    const uploadResponse = await request(server)
      .post(`/api/v1/tickets/${ticket.id}/attachments`)
      .set('Authorization', `Bearer ${customerToken}`)
      .attach('file', Buffer.from('E2E attachment content'), {
        filename: 'evidence.txt',
        contentType: 'text/plain',
      })
      .expect(201);
    const attachment = responseData<AttachmentData>(uploadResponse);
    expect(attachment.originalName).toBe('evidence.txt');
    await request(server)
      .get(`/api/v1/attachments/${attachment.id}/download`)
      .set('Authorization', `Bearer ${outsiderToken}`)
      .expect(404);
    await request(server)
      .get(`/api/v1/attachments/${attachment.id}/download`)
      .set('Authorization', `Bearer ${customerToken}`)
      .expect(200);
    await request(server)
      .delete(`/api/v1/attachments/${attachment.id}`)
      .set('Authorization', `Bearer ${customerToken}`)
      .expect(200);

    await request(server)
      .patch(`/api/v1/tickets/${ticket.id}/status`)
      .set('Authorization', `Bearer ${agentToken}`)
      .send({ status: TicketStatus.RESOLVED })
      .expect(200);
    await request(server)
      .patch(`/api/v1/tickets/${ticket.id}/status`)
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ status: TicketStatus.CLOSED })
      .expect(200);

    const rating = await request(server)
      .post(`/api/v1/tickets/${ticket.id}/rating`)
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ score: 5, comment: 'Excellent support' })
      .expect(201);
    expect(responseData<{ score: number }>(rating).score).toBe(5);
    await request(server)
      .post(`/api/v1/tickets/${ticket.id}/rating`)
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ score: 4 })
      .expect(409);

    const notifications = await request(server)
      .get('/api/v1/notifications')
      .set('Authorization', `Bearer ${customerToken}`)
      .expect(200);
    expect(responseData<unknown[]>(notifications).length).toBeGreaterThan(0);

    await customerClient.post('/api/v1/auth/logout').expect(200);
    await customerClient.post('/api/v1/auth/refresh').expect(401);
  }, 60_000);
});
