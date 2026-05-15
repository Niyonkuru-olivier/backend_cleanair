import { Injectable, ConflictException, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { CreateUserDto, UpdateUserDto } from './users.controller';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
  ) {}

  private generateTemporaryPassword(length: number = 10): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < length; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }

  async createUser(dto: CreateUserDto) {
    const email = dto.email.toLowerCase();
    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });
    
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const tempPassword = this.generateTemporaryPassword(12);
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(tempPassword, salt);

    try {
      const newUser = await this.prisma.user.create({
        data: {
          name: dto.name,
          email,
          passwordHash,
          role: dto.role,
          isTemporaryPassword: true,
        },
      });

      console.log(`[USER CREATED] Email: ${email} | Temporary Password: ${tempPassword}`);

      // Send welcome email asynchronously
      this.mailService.sendWelcomeEmail(dto.email, dto.name, tempPassword).catch((err) => {
        // Log but don't fail the request if email fails
        console.error(`Background email task failed for ${dto.email}:`, err);
      });

      // Don't return the password hash in the response
      const { passwordHash: _, ...userWithoutPassword } = newUser;
      return {
        message: 'User created successfully',
        user: userWithoutPassword,
      };
    } catch (error) {
      throw new InternalServerErrorException('Failed to create user');
    }
  }

  async findAllUsers() {
    const users = await this.prisma.user.findMany({
      orderBy: { joinedAt: 'desc' },
      include: {
        userDevices: true,
      }
    });

    return users.map((user) => {
      const { passwordHash, ...userWithoutPassword } = user;
      return {
        ...userWithoutPassword,
        assignedDevices: user.userDevices.map((ud) => ud.deviceId),
      };
    });
  }
  async findUserById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { userDevices: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const { passwordHash, ...userWithoutPassword } = user;
    return {
      ...userWithoutPassword,
      assignedDevices: user.userDevices.map((ud) => ud.deviceId),
    };
  }

  async updateUser(id: string, dto: UpdateUserDto) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (dto.email && dto.email !== user.email) {
      const existingEmail = await this.prisma.user.findUnique({ where: { email: dto.email } });
      if (existingEmail) {
        throw new ConflictException('Email is already in use');
      }
    }

    const updatedData: any = {
      name: dto.name,
      email: dto.email ? dto.email.toLowerCase() : undefined,
      role: dto.role,
      status: dto.status,
      phone: dto.phone,
    };

    if (dto.password) {
      const salt = await bcrypt.genSalt(10);
      updatedData.passwordHash = await bcrypt.hash(dto.password, salt);
      updatedData.isTemporaryPassword = false;
    }

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: updatedData,
    });

    const { passwordHash, ...userWithoutPassword } = updatedUser;
    return userWithoutPassword;
  }

  async deleteUser(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.prisma.user.delete({ where: { id } });
    return { success: true };
  }
}
