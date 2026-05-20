import { IsString, IsNotEmpty, IsEnum, IsOptional, IsIP, IsMACAddress } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { VehicleType } from '@prisma/client';

export class CreateDeviceDto {
  @ApiProperty({ example: 'Toyota Corolla', description: 'Name or model of the device/vehicle' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ enum: VehicleType, example: 'CAR', description: 'Type of installation' })
  @IsEnum(VehicleType)
  @IsNotEmpty()
  type: VehicleType;

  @ApiProperty({ example: 'Jean-Paul Habimana', description: 'Owner or Operator name' })
  @IsString()
  @IsNotEmpty()
  owner: string;

  @ApiProperty({ example: 'RAC 784 B', description: 'License plate or business reference ID' })
  @IsString()
  @IsNotEmpty()
  plateOrRef: string;

  @ApiProperty({ example: 'Kigali — Nyarugenge', description: 'Operating location' })
  @IsString()
  @IsNotEmpty()
  location: string;

  @ApiPropertyOptional({ example: '192.168.1.105', description: 'IP Address' })
  @IsOptional()
  @IsString()
  ip?: string;

  @ApiPropertyOptional({ example: 'A4:CF:12:7E:3B:05', description: 'MAC Address' })
  @IsOptional()
  @IsString()
  mac?: string;

  @ApiPropertyOptional({ example: 'v2.1.3', description: 'Firmware version' })
  @IsOptional()
  @IsString()
  firmware?: string;
}
