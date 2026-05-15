import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { MailService } from '../mail/mail.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
  ) {}

  async login(emailInput: string, pass: string) {
    const email = emailInput.toLowerCase();
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new UnauthorizedException('Invalid email');
    }

    const isMatch = await bcrypt.compare(pass, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid password');
    }

    const userStatus = user.status?.toString().toUpperCase();
    console.log(`Login attempt for ${email}: Status is ${userStatus}`);

    if (userStatus === 'SUSPENDED') {
      throw new UnauthorizedException('Login Failed, Your account is Suspended please contact the Admin of the system');
    }

    if (userStatus === 'INACTIVE') {
      throw new UnauthorizedException('Login Failed, Your account is Inactive please contact the Admin of the system');
    }

    if (userStatus !== 'ACTIVE') {
      throw new UnauthorizedException('Login Failed, Your account is not active please contact the Admin of the system');
    }

    if (user.isTemporaryPassword) {
      return {
        requiresReset: true,
        message: 'You must reset your password before continuing.',
        email: user.email,
      };
    }

    // In a real application, you would generate and return a JWT here
    // For now, we return user info
    const { passwordHash: _, ...result } = user;
    
    // Update last login
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() }
    });

    return {
      message: 'Login successful',
      user: result,
      // accessToken: '...',
    };
  }

  async resetPassword(emailInput: string, newPassword: string, token?: string) {
    const email = emailInput.toLowerCase();
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new BadRequestException('User not found');
    }

    // Verify token if provided, otherwise check if it's a first-time login (temporary password)
    if (token) {
      if (user.passwordResetToken !== token || !user.passwordResetExpires || user.passwordResetExpires < new Date()) {
        throw new UnauthorizedException('Invalid or expired reset token');
      }
    } else if (!user.isTemporaryPassword) {
      throw new UnauthorizedException('Security token is required to reset password');
    }

    const userStatus = user.status?.toString().toUpperCase();
    console.log(`Password reset attempt for ${email}: Status is ${userStatus}`);

    if (userStatus === 'SUSPENDED') {
      throw new UnauthorizedException('Login Failed, Your account is Suspended please contact the Admin of the system');
    }

    if (userStatus === 'INACTIVE') {
      throw new UnauthorizedException('Login Failed, Your account is Inactive please contact the Admin of the system');
    }

    if (userStatus !== 'ACTIVE') {
      throw new UnauthorizedException('Login Failed, Your account is not active please contact the Admin of the system');
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    // Update user: set new password, clear reset token, and remove temporary flag
    const updatedUser = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        isTemporaryPassword: false,
        passwordResetToken: null,
        passwordResetExpires: null,
        lastLogin: new Date(),
      },
    });

    const { passwordHash: _, ...result } = updatedUser;
    
    return {
      message: 'Password reset successful',
      user: result,
    };
  }

  async forgotPassword(emailInput: string) {
    const email = emailInput.toLowerCase();
    const user = await this.prisma.user.findUnique({ where: { email } });
    
    if (!user) {
      throw new BadRequestException('This email is not registered in our system');
    }

    const userStatus = user.status?.toString().toUpperCase();

    if (userStatus === 'SUSPENDED') {
      throw new UnauthorizedException('Your account is Suspended. Please contact the Admin of the system.');
    }

    if (userStatus === 'INACTIVE') {
      throw new UnauthorizedException('Your account is Inactive. Please contact the Admin of the system.');
    }

    if (userStatus !== 'ACTIVE') {
      throw new UnauthorizedException('Your account is not active. Please contact the Admin of the system.');
    }

    // Generate a reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const passwordResetExpires = new Date(Date.now() + 3600000); // 1 hour

    // Save token to database
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: resetToken,
        passwordResetExpires,
      },
    });

    // Send reset email
    await this.mailService.sendResetPasswordEmail(user.email, user.name, resetToken);

    return {
      message: 'Reset link sent successfully to your email!',
    };
  }
}
