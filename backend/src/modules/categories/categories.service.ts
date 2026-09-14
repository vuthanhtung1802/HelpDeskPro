import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, UserRole } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

export const categorySelect = {
  id: true,
  name: true,
  slug: true,
  description: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.CategorySelect;

export type Category = Prisma.CategoryGetPayload<{
  select: typeof categorySelect;
}>;

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(role: UserRole): Promise<Category[]> {
    return this.prisma.category.findMany({
      where: role === UserRole.ADMIN ? {} : { isActive: true },
      select: categorySelect,
      orderBy: { name: 'asc' },
    });
  }

  async getById(id: string, role: UserRole): Promise<Category> {
    const category = await this.prisma.category.findFirst({
      where: {
        id,
        ...(role === UserRole.ADMIN ? {} : { isActive: true }),
      },
      select: categorySelect,
    });
    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return category;
  }

  async create(dto: CreateCategoryDto): Promise<Category> {
    const slug = this.createSlug(dto.name);

    try {
      return await this.prisma.category.create({
        data: { name: dto.name, slug, description: dto.description },
        select: categorySelect,
      });
    } catch (error: unknown) {
      this.throwIfUniqueConstraint(error);
      throw error;
    }
  }

  async update(id: string, dto: UpdateCategoryDto): Promise<Category> {
    await this.getById(id, UserRole.ADMIN);
    const data: Prisma.CategoryUpdateInput = {
      description: dto.description,
      isActive: dto.isActive,
    };
    if (dto.name) {
      data.name = dto.name;
      data.slug = this.createSlug(dto.name);
    }

    try {
      return await this.prisma.category.update({
        where: { id },
        data,
        select: categorySelect,
      });
    } catch (error: unknown) {
      this.throwIfUniqueConstraint(error);
      throw error;
    }
  }

  async deactivate(id: string): Promise<Category> {
    await this.getById(id, UserRole.ADMIN);
    return this.prisma.category.update({
      where: { id },
      data: { isActive: false },
      select: categorySelect,
    });
  }

  private createSlug(name: string): string {
    const slug = name
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    if (!slug) {
      throw new ConflictException('Category name cannot produce a valid slug');
    }

    return slug;
  }

  private throwIfUniqueConstraint(error: unknown): void {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw new ConflictException('Category name already exists');
    }
  }
}
