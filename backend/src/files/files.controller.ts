import {
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
  Res,
  StreamableFile,
  UploadedFile,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { GetCurrentUser } from '../auth/decorators/get-current-user.decorator';
import { UserRole } from '../users/entities/user.entity';
import { FileKind } from './entities/stored-file.entity';
import { FilesService, FileViewer, UploadedImage } from './files.service';
import { ImageUpload } from './image-upload';

@ApiTags('files')
@Controller('files')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Get('portfolio/me')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.INFLUENCER)
  myPortfolio(@GetCurrentUser('sub') userId: string) {
    return this.filesService.listPortfolio(userId);
  }

  @Post('portfolio')
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.INFLUENCER)
  @ImageUpload()
  addPortfolio(
    @GetCurrentUser('sub') userId: string,
    @UploadedFile() file: UploadedImage | undefined,
  ) {
    return this.filesService.addPortfolioImage(userId, file);
  }

  @Delete('portfolio/:id')
  @HttpCode(204)
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.INFLUENCER)
  async removePortfolio(
    @GetCurrentUser('sub') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    await this.filesService.removePortfolioImage(userId, id);
  }

  /** Portfolio images for anyone; other files for their owner and admins. */
  @Get(':id')
  @UseGuards(OptionalJwtAuthGuard)
  async serve(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: { user: FileViewer | null },
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const { file, stream } = await this.filesService.open(id, req.user);
    const isPublic = file.kind === FileKind.PORTFOLIO;
    res.set({
      'Cache-Control': isPublic
        ? 'public, max-age=31536000, immutable'
        : 'private, no-store',
      // Public images are embedded by the app's origin (another port in dev).
      'Cross-Origin-Resource-Policy': isPublic ? 'cross-origin' : 'same-site',
      'Content-Security-Policy': "default-src 'none'; sandbox",
    });
    return new StreamableFile(stream, {
      type: file.mimeType,
      length: file.size,
      disposition: 'inline',
    });
  }
}
