import { Controller, Get, Post, Body, Patch, Param, Delete, HttpCode, HttpStatus, UsePipes, ValidationPipe, Query } from '@nestjs/common';
import { DevicesService } from './devices.service';
import { CreateDeviceDto } from './dto/create-device.dto';
import { UpdateDeviceDto } from './dto/update-device.dto';
import { PostReadingDto } from './dto/post-reading.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';

@ApiTags('devices')
@Controller('devices')
export class DevicesController {
  constructor(private readonly devicesService: DevicesService) {}

  @Post()
  @ApiOperation({ summary: 'Register a new device' })
  @ApiResponse({ status: 201, description: 'The device has been successfully created.' })
  create(@Body() createDeviceDto: CreateDeviceDto) {
    return this.devicesService.create(createDeviceDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all devices' })
  @ApiResponse({ status: 200, description: 'Return all devices.' })
  findAll() {
    return this.devicesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific device by id' })
  @ApiResponse({ status: 200, description: 'Return the device details.' })
  @ApiResponse({ status: 404, description: 'Device not found.' })
  findOne(@Param('id') id: string) {
    return this.devicesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a device' })
  @ApiResponse({ status: 200, description: 'The device has been successfully updated.' })
  update(@Param('id') id: string, @Body() updateDeviceDto: UpdateDeviceDto) {
    return this.devicesService.update(id, updateDeviceDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a device' })
  @ApiResponse({ status: 200, description: 'The device has been successfully deleted.' })
  remove(@Param('id') id: string) {
    return this.devicesService.remove(id);
  }

  @Post(':id/reboot')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reboot a device' })
  @ApiResponse({ status: 200, description: 'The device reboot signal has been sent.' })
  reboot(@Param('id') id: string) {
    return this.devicesService.reboot(id);
  }

  @Post(':id/readings')
  @ApiOperation({ summary: 'Post telemetry/sensor reading data from a device' })
  @ApiResponse({ status: 201, description: 'The reading has been successfully recorded and processed.' })
  @ApiResponse({ status: 404, description: 'Device not found.' })
  @UsePipes(new ValidationPipe({ transform: true }))
  postReading(
    @Param('id') id: string,
    @Body() postReadingDto: PostReadingDto,
  ) {
    return this.devicesService.postReading(id, postReadingDto);
  }

  @Get(':id/history')
  @ApiOperation({ summary: 'Get unified simulation / alert history for a device' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Limit the number of events (default: 50)' })
  @ApiQuery({ name: 'type', required: false, enum: ['all', 'reading', 'alert'], description: 'Filter events by type (default: all)' })
  @ApiResponse({ status: 200, description: 'Return the unified chronological device history.' })
  @ApiResponse({ status: 404, description: 'Device not found.' })
  getHistory(
    @Param('id') id: string,
    @Query('limit') limit?: string,
    @Query('type') type?: 'all' | 'reading' | 'alert',
  ) {
    const parsedLimit = limit ? parseInt(limit, 10) : 50;
    return this.devicesService.getHistory(id, parsedLimit, type || 'all');
  }
}
