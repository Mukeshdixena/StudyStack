import { Controller, Get, Post, Body, Param, Put, Delete } from '@nestjs/common';
import { TopicsService } from './topics.service';

@Controller('topics')
export class TopicsController {
    constructor(private readonly topicsService: TopicsService) { }

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
}
