import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AuthenticatedUser } from '../../common/types/authenticated-user.type';
import { DashboardService } from './dashboard.service';

@ApiTags('dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('admin')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get system-wide ticket statistics' })
  getAdminStats() {
    return this.dashboardService.getAdminStats();
  }

  @Get('agent')
  @Roles(UserRole.AGENT)
  @ApiOperation({ summary: 'Get statistics for the assigned agent' })
  getAgentStats(@CurrentUser() user: AuthenticatedUser) {
    return this.dashboardService.getAgentStats(user.id);
  }

  @Get('user')
  @Roles(UserRole.USER)
  @ApiOperation({ summary: 'Get statistics for the ticket owner' })
  getUserStats(@CurrentUser() user: AuthenticatedUser) {
    return this.dashboardService.getUserStats(user.id);
  }
}
