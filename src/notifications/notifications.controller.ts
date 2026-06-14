import { Controller, Get, Patch, Post, Param, Query, ParseIntPipe, HttpCode, HttpStatus, BadRequestException } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';

@ApiTags('notifications')
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'Get notifications for a user', description: 'Retrieves all warnings and critical alerts for devices assigned to the user. Admins and Operators will receive all alerts in the system.' })
  @ApiQuery({ name: 'userId', required: true, description: 'The ID of the user requesting notifications' })
  @ApiResponse({ status: 200, description: 'Successfully retrieved notifications.' })
  @ApiResponse({ status: 400, description: 'Bad Request - userId is required.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  async getNotifications(@Query('userId') userId: string) {
    if (!userId) {
      throw new BadRequestException('userId query parameter is required');
    }
    return this.notificationsService.getUserNotifications(userId);
  }

  @Patch(':id/read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark a notification as read', description: 'Marks a specific alert as read using its ID.' })
  @ApiResponse({ status: 200, description: 'Notification successfully marked as read.' })
  @ApiResponse({ status: 404, description: 'Notification not found.' })
  async markAsRead(@Param('id', ParseIntPipe) id: number) {
    return this.notificationsService.markAsRead(id);
  }

  @Post('read-all')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark all notifications as read', description: 'Marks all alerts as read for the devices assigned to the user. Admins and Operators mark all alerts in the system as read.' })
  @ApiQuery({ name: 'userId', required: true, description: 'The ID of the user marking all notifications as read' })
  @ApiResponse({ status: 200, description: 'All notifications successfully marked as read.' })
  @ApiResponse({ status: 400, description: 'Bad Request - userId is required.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  async markAllAsRead(@Query('userId') userId: string) {
    if (!userId) {
      throw new BadRequestException('userId query parameter is required');
    }
    return this.notificationsService.markAllAsRead(userId);
  }
}
