import { Controller, Post, Body, ValidationPipe, UsePipes, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto, ResetPasswordDto, ForgotPasswordDto } from './dto/auth.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'User Login', description: 'Authenticates a user with email and password. Returns user data or a flag if a password reset is required (for first-time login).' })
  @ApiResponse({ status: 200, description: 'Successfully logged in.', schema: { example: { message: 'Login successful', user: { id: 'uuid-1', name: 'John Doe', email: 'john@example.com', role: 'ADMIN' } } } })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid credentials or account suspended/inactive.' })
  @UsePipes(new ValidationPipe({ transform: true }))
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto.email, loginDto.password);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset Password', description: 'Allows a user to set a new password. Requires a valid reset token (from email) or is used during first-time login.' })
  @ApiResponse({ status: 200, description: 'Password successfully reset.', schema: { example: { message: 'Password reset successful', user: { id: 'uuid-1', email: 'john@example.com' } } } })
  @ApiResponse({ status: 400, description: 'Bad Request - Invalid token or user not found.' })
  @UsePipes(new ValidationPipe({ transform: true }))
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(resetPasswordDto.email, resetPasswordDto.newPassword, resetPasswordDto.token);
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Forgot Password', description: 'Initiates the password recovery process by sending a reset link with a secure token to the user\'s registered email.' })
  @ApiResponse({ status: 200, description: 'Reset email sent.', schema: { example: { message: 'Reset link sent successfully to your email!' } } })
  @ApiResponse({ status: 400, description: 'Bad Request - Email not registered or account disabled.' })
  @UsePipes(new ValidationPipe({ transform: true }))
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.forgotPassword(forgotPasswordDto.email);
  }
}
