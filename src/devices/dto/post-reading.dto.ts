import { IsNumber, IsString, IsEnum, IsOptional, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ReadingStatus } from '@prisma/client';

export class PostReadingDto {
  @ApiProperty({ example: 12.5, description: 'The input CO/gas level in PPM' })
  @IsNumber()
  @Min(0)
  inputPpm: number;

  @ApiProperty({ example: 4.2, description: 'The output CO/gas level in PPM after reduction' })
  @IsNumber()
  @Min(0)
  outputPpm: number;

  @ApiPropertyOptional({
    enum: ReadingStatus,
    example: 'NORMAL',
    description: 'The status of the reading (optional, will be calculated if not provided)',
  })
  @IsOptional()
  @IsEnum(ReadingStatus)
  status?: ReadingStatus;

  @ApiPropertyOptional({ example: '1d 4h 32m', description: 'Uptime of the device' })
  @IsOptional()
  @IsString()
  uptime?: string;

  @ApiPropertyOptional({ example: 'v1.0.4', description: 'Firmware version of the device' })
  @IsOptional()
  @IsString()
  firmware?: string;

  @ApiPropertyOptional({ example: '192.168.1.150', description: 'IP address of the device' })
  @IsOptional()
  @IsString()
  ip?: string;

  @ApiPropertyOptional({ example: '24:0A:C4:8B:58:A2', description: 'MAC address of the device' })
  @IsOptional()
  @IsString()
  mac?: string;
}
