import 'reflect-metadata';
import { NotFoundException } from '@nestjs/common';
import { Prisma, UserRole } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CategoriesService, Category } from './categories.service';

const category: Category = {
  id: '96bc46cd-8d50-4dcb-85d8-b5a27472730b',
  name: 'Phần mềm',
  slug: 'phan-mem',
  description: 'Ứng dụng và lỗi phần mềm',
  isActive: true,
  createdAt: new Date('2026-09-03T00:00:00.000Z'),
  updatedAt: new Date('2026-09-03T00:00:00.000Z'),
};

describe('CategoriesService', () => {
  const categoryRepository = {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  };
  const prisma = {
    category: categoryRepository,
  } as unknown as PrismaService;

  let service: CategoriesService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new CategoriesService(prisma);
  });

  it('only exposes active categories to non-admin users', async () => {
    let receivedArgs: Prisma.CategoryFindManyArgs | undefined;
    categoryRepository.findMany.mockImplementation(
      (args: Prisma.CategoryFindManyArgs) => {
        receivedArgs = args;
        return Promise.resolve([category]);
      },
    );

    const result = await service.findAll(UserRole.USER);

    expect(result).toEqual([category]);
    expect(receivedArgs?.where).toEqual({ isActive: true });
  });

  it('creates a normalized slug for Vietnamese category names', async () => {
    let createdArgs: Prisma.CategoryCreateArgs | undefined;
    categoryRepository.create.mockImplementation(
      (args: Prisma.CategoryCreateArgs) => {
        createdArgs = args;
        return Promise.resolve(category);
      },
    );

    await service.create({
      name: 'Phần mềm',
      description: 'Ứng dụng và lỗi phần mềm',
    });

    expect(createdArgs?.data).toMatchObject({
      name: 'Phần mềm',
      slug: 'phan-mem',
    });
  });

  it('does not allow a regular user to access an inactive category', async () => {
    categoryRepository.findFirst.mockResolvedValue(null);

    await expect(
      service.getById(category.id, UserRole.USER),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('deactivates a category instead of deleting it', async () => {
    categoryRepository.findFirst.mockResolvedValue(category);
    categoryRepository.update.mockResolvedValue({
      ...category,
      isActive: false,
    });

    const result = await service.deactivate(category.id);

    expect(result.isActive).toBe(false);
    expect(categoryRepository.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { isActive: false } }),
    );
  });
});
