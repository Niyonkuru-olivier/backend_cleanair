import { Controller, Post, Get, Patch, Delete, Param, Body, ValidationPipe, UsePipes, HttpCode, HttpStatus } from '@nestjs/common';
import { UsersService } from './users.service';
import { IsEmail, IsNotEmpty, IsEnum, IsOptional } from 'class-validator';
import { ApiTags, ApiOperation, ApiResponse, ApiProperty } from '@nestjs/swagger';

export enum UserRole {
  ADMIN = 'ADMIN',
  OPERATOR = 'OPERATOR',
  VIEWER = 'VIEWER',
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
}

export class CreateUserDto {
  @ApiProperty({ example: 'John Doe', description: 'The name of the user' })
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'john@example.com', description: 'The email of the user' })
  @IsEmail()
  email: string;

  @ApiProperty({ enum: UserRole, example: UserRole.OPERATOR, description: 'The role of the user' })
  @IsEnum(UserRole)
  role: UserRole;
}

export class UpdateUserDto {
  @ApiProperty({ example: 'John Doe', description: 'The name of the user', required: false })
  @IsOptional()
  @IsNotEmpty()
  name?: string;

  @ApiProperty({ example: 'john@example.com', description: 'The email of the user', required: false })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ enum: UserRole, example: UserRole.ADMIN, description: 'The role of the user', required: false })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiProperty({ enum: UserStatus, example: UserStatus.ACTIVE, description: 'The status of the user', required: false })
  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;

  @ApiProperty({ example: '+1234567890', description: 'The phone number', required: false })
  @IsOptional()
  phone?: string;

  @ApiProperty({ example: 'newpassword123', description: 'The password', required: false })
  @IsOptional()
  password?: string;
}

@ApiTags('admin/users')
@Controller('admin/users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create user', description: 'Creates a new user with a specific role (ADMIN, OPERATOR, VIEWER). The system will automatically generate a temporary password and send an onboarding email.' })
  @ApiResponse({ status: 201, description: 'User successfully created.', schema: { example: { id: 'uuid-123', name: 'John Doe', email: 'john@example.com', role: 'OPERATOR', status: 'ACTIVE' } } })
  @ApiResponse({ status: 400, description: 'Bad Request - Validation failed or email already exists.' })
  @UsePipes(new ValidationPipe({ transform: true }))
  async createUser(@Body() createUserDto: CreateUserDto) {
    return this.usersService.createUser(createUserDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all users', description: 'Retrieves a list of all users registered in the system, including their status and last login details.' })
  @ApiResponse({ status: 200, description: 'List of users.', schema: { example: [{ id: 'uuid-1', name: 'Admin', email: 'admin@cleanair.com', role: 'ADMIN', status: 'ACTIVE' }] } })
  async findAllUsers() {
    return this.usersService.findAllUsers();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID', description: 'Retrieves detailed information for a specific user using their unique ID.' })
  @ApiResponse({ status: 200, description: 'User details found.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  async findUserById(@Param('id') id: string) {
    return this.usersService.findUserById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update user', description: 'Updates one or more fields for an existing user (name, email, role, status, phone, or password).' })
  @ApiResponse({ status: 200, description: 'User successfully updated.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  @UsePipes(new ValidationPipe({ transform: true }))
  async updateUser(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.updateUser(id, updateUserDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete user', description: 'Permanently removes a user from the database. This action cannot be undone.' })
  @ApiResponse({ status: 204, description: 'User successfully deleted.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  async deleteUser(@Param('id') id: string) {
    return this.usersService.deleteUser(id);
  }
}

