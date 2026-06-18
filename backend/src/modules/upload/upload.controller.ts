import {
  Controller,
  Post,
  Get,
  Param,
  Res,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
  NotFoundException,
  Query,
  UseGuards,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { StorageService } from '../storage/storage.service';
import { UserContextGuard } from '../../common/guards/user-context.guard';
import * as path from 'path';
import * as fs from 'fs';

const ALLOWED_EXTENSIONS = [
  '.jpg',
  '.jpeg',
  '.png',
  '.webp',
  '.pdf',
  '.doc',
  '.docx',
  '.ppt',
  '.pptx',
  '.zip',
  '.rar',
];

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MB

@Controller()
export class UploadController {
  constructor(private readonly storageService: StorageService) {}

  @Post('tasks/upload')
  @UseGuards(UserContextGuard)
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: any,
    @Query('taskId') taskId: string,
  ) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    if (!taskId) {
      throw new BadRequestException('taskId query parameter is required');
    }

    // Validate size
    if (file.size > MAX_FILE_SIZE) {
      throw new BadRequestException('File exceeds maximum limit of 25MB');
    }

    // Validate extension
    const ext = path.extname(file.originalname).toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      throw new BadRequestException(`File extension ${ext} is not allowed`);
    }

    const result = await this.storageService.uploadFile(file, taskId);
    return {
      success: true,
      data: result,
    };
  }

  // Route to serve local files dynamically
  @Get('uploads/tasks/:taskId/:filename')
  async serveLocalFile(
    @Param('taskId') taskId: string,
    @Param('filename') filename: string,
    @Res() res: any,
  ) {
    const filePath = path.join(process.cwd(), 'uploads', 'tasks', taskId, filename);

    if (!fs.existsSync(filePath)) {
      throw new NotFoundException('File not found');
    }

    const ext = path.extname(filename).toLowerCase();
    let contentType = 'application/octet-stream';
    if (ext === '.pdf') contentType = 'application/pdf';
    else if (['.jpg', '.jpeg'].includes(ext)) contentType = 'image/jpeg';
    else if (ext === '.png') contentType = 'image/png';
    else if (ext === '.webp') contentType = 'image/webp';
    else if (ext === '.zip') contentType = 'application/zip';
    else if (ext === '.rar') contentType = 'application/x-rar-compressed';

    res.setHeader('Content-Type', contentType);
    
    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  }
}
