import { Controller, Get, Post, Body, Param, Put, Delete, UseInterceptors, UploadedFile } from '@nestjs/common';
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
        return this.topicsService.updatePdf(id, url, key);
    }
}
