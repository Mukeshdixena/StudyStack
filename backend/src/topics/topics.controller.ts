import { Controller, Get, Post, Body, Param, Put, Delete, UseInterceptors, UploadedFile, Query } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { TopicsService } from './topics.service';
import { StorageService } from '../storage/storage.service';

@Controller('topics')
export class TopicsController {
    constructor(
        private readonly topicsService: TopicsService,
        private readonly storageService: StorageService
    ) { }

    @Post()
    create(@Body() data: any) { return this.topicsService.create(data); }

    @Get()
    findAll() { return this.topicsService.findAll(); }

    @Get(':id')
    findOne(@Param('id') id: string) { return this.topicsService.findOne(id); }

    @Put(':id')
    update(@Param('id') id: string, @Body() data: any) { return this.topicsService.update(id, data); }

    @Delete(':id')
    remove(@Param('id') id: string) { return this.topicsService.remove(id); }

    @Post(':id/upload-pdf')
    @UseInterceptors(FileInterceptor('file'))
    async uploadPdf(
        @Param('id') id: string,
        @UploadedFile() file: Express.Multer.File
    ) {
        const { url, key } = await this.storageService.uploadFile(file);
        return this.topicsService.addMaterial(id, {
            name: file.originalname,
            url,
            key,
            type: 'upload'
        });
    }

    @Post(':id/materials')
    addMaterialUrl(@Param('id') id: string, @Body() data: { name: string, url: string }) {
        return this.topicsService.addMaterial(id, {
            ...data,
            type: 'url'
        });
    }

    @Delete(':id/materials/:materialId')
    removeMaterial(@Param('id') id: string, @Param('materialId') materialId: string) {
        return this.topicsService.removeMaterial(id, materialId);
    }

    @Put(':id/move')
    move(@Param('id') id: string, @Body('parentId') parentId: string) {
        return this.topicsService.move(id, parentId);
    }

    @Get('search/find')
    search(@Query('q') q: string) {
        return this.topicsService.search(q);
    }
}
