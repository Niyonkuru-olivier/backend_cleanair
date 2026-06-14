import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async getUserNotifications(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    if (user.role === 'ADMIN' || user.role === 'OPERATOR') {
      // Admins and Operators see all alerts
      return this.prisma.alert.findMany({
        orderBy: { createdAt: 'desc' },
      });
    }

    // Viewers see only alerts from their assigned devices
    const userDevices = await this.prisma.userDevice.findMany({
      where: { userId },
    });

    const deviceIds = userDevices.map((ud) => ud.deviceId);

    if (deviceIds.length === 0) {
      return [];
    }

    return this.prisma.alert.findMany({
      where: {
        deviceId: { in: deviceIds },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async markAsRead(id: number) {
    const alert = await this.prisma.alert.findUnique({
      where: { id },
    });

    if (!alert) {
      throw new NotFoundException(`Notification with ID ${id} not found`);
    }

    return this.prisma.alert.update({
      where: { id },
      data: { isRead: true },
    });
  }

  async markAllAsRead(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    if (user.role === 'ADMIN' || user.role === 'OPERATOR') {
      await this.prisma.alert.updateMany({
        where: { isRead: false },
        data: { isRead: true },
      });
    } else {
      const userDevices = await this.prisma.userDevice.findMany({
        where: { userId },
      });

      const deviceIds = userDevices.map((ud) => ud.deviceId);

      if (deviceIds.length > 0) {
        await this.prisma.alert.updateMany({
          where: {
            deviceId: { in: deviceIds },
            isRead: false,
          },
          data: { isRead: true },
        });
      }
    }

    return { message: 'All notifications marked as read' };
  }
}
