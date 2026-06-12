import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateDeviceDto } from './dto/create-device.dto';
import { UpdateDeviceDto } from './dto/update-device.dto';
import { PostReadingDto } from './dto/post-reading.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DevicesService {
  constructor(private prisma: PrismaService) {}

  private mapDevice(device: any) {
    const { ipAddress, macAddress, ...rest } = device;
    return {
      ...rest,
      type: device.type.toLowerCase(),
      ip: ipAddress,
      mac: macAddress,
    };
  }

  async create(createDeviceDto: CreateDeviceDto) {
    const count = await this.prisma.device.count();
    const nextIdStr = String(count + 1).padStart(3, '0');
    const id = `ESP32-${nextIdStr}`;

    const newDevice = await this.prisma.device.create({
      data: {
        id,
        name: createDeviceDto.name,
        type: createDeviceDto.type,
        owner: createDeviceDto.owner,
        plateOrRef: createDeviceDto.plateOrRef,
        location: createDeviceDto.location,
        ipAddress: createDeviceDto.ip,
        macAddress: createDeviceDto.mac,
        firmware: createDeviceDto.firmware,
        status: 'OFFLINE',
        installedAt: new Date(),
        uptime: '—',
      },
    });

    return this.mapDevice(newDevice);
  }

  async findAll() {
    const devices = await this.prisma.device.findMany();
    return devices.map((d) => this.mapDevice(d));
  }

  async findOne(id: string) {
    const device = await this.prisma.device.findUnique({
      where: { id },
    });
    if (!device) throw new NotFoundException(`Device with ID ${id} not found`);
    return this.mapDevice(device);
  }

  async update(id: string, updateDeviceDto: UpdateDeviceDto) {
    const data: any = { ...updateDeviceDto };
    if (updateDeviceDto.ip) {
      data.ipAddress = updateDeviceDto.ip;
      delete data.ip;
    }
    if (updateDeviceDto.mac) {
      data.macAddress = updateDeviceDto.mac;
      delete data.mac;
    }

    try {
      const updated = await this.prisma.device.update({
        where: { id },
        data,
      });
      return this.mapDevice(updated);
    } catch (e) {
      throw new NotFoundException(`Device with ID ${id} not found`);
    }
  }

  async remove(id: string) {
    try {
      await this.prisma.device.delete({
        where: { id },
      });
      return { message: 'Device deleted successfully' };
    } catch (e) {
      throw new NotFoundException(`Device with ID ${id} not found`);
    }
  }

  async reboot(id: string) {
    const device = await this.prisma.device.findUnique({ where: { id } });
    if (!device) throw new NotFoundException(`Device with ID ${id} not found`);
    // Mocking reboot action by changing status temporarily or just returning success
    return { message: `Device ${id} is rebooting...` };
  }

  async postReading(id: string, dto: PostReadingDto) {
    const device = await this.prisma.device.findUnique({
      where: { id },
    });
    if (!device) {
      throw new NotFoundException(`Device with ID ${id} not found`);
    }

    const reductionPercentage = dto.inputPpm > 0 
      ? ((dto.inputPpm - dto.outputPpm) / dto.inputPpm) * 100 
      : 0;

    let status = dto.status;
    if (!status) {
      if (dto.inputPpm >= 100) {
        status = 'CRITICAL';
      } else if (dto.inputPpm >= 35) {
        status = 'WARNING';
      } else {
        status = 'NORMAL';
      }
    }

    const reading = await this.prisma.reading.create({
      data: {
        deviceId: id,
        inputPpm: dto.inputPpm,
        outputPpm: dto.outputPpm,
        reductionPercentage,
        status,
      },
    });

    const deviceStatus = status === 'NORMAL' ? 'ONLINE' : 'WARNING';

    const updateData: any = {
      status: deviceStatus,
      coInput: dto.inputPpm,
      coOutput: dto.outputPpm,
      reduction: reductionPercentage,
      lastSeen: new Date(),
    };

    if (dto.uptime) updateData.uptime = dto.uptime;
    if (dto.firmware) updateData.firmware = dto.firmware;
    if (dto.ip) updateData.ipAddress = dto.ip;
    if (dto.mac) updateData.macAddress = dto.mac;

    const updatedDevice = await this.prisma.device.update({
      where: { id },
      data: updateData,
    });

    let alert: any = null;
    if (status === 'WARNING' || status === 'CRITICAL') {
      const alertLevel = status === 'CRITICAL' ? 'CRITICAL' : 'WARNING';
      alert = await this.prisma.alert.create({
        data: {
          deviceId: id,
          level: alertLevel,
          message: `Device ${device.name || id} recorded a ${status.toLowerCase()} CO level. Input: ${dto.inputPpm} ppm, Output: ${dto.outputPpm} ppm (Reduction: ${reductionPercentage.toFixed(1)}%).`,
          location: device.location || 'Unknown',
        },
      });
    }

    return {
      reading,
      device: this.mapDevice(updatedDevice),
      alert,
    };
  }
}
