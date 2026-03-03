import { Controller, Get, Post, Body, Param, Put, Delete } from '@nestjs/common';
import { ConceptsService } from './concepts.service';

@Controller('concepts')
export class ConceptsController {
    constructor(private readonly conceptsService: ConceptsService) { }

    @Post()
    create(@Body() data: any) { return this.conceptsService.create(data); }

    @Get('by-topic/:topicId')
    findByTopic(@Param('topicId') topicId: string) { return this.conceptsService.findByTopic(topicId); }

    @Get(':id')
    findOne(@Param('id') id: string) { return this.conceptsService.findOne(id); }

    @Put(':id')
    update(@Param('id') id: string, @Body() data: any) { return this.conceptsService.update(id, data); }

    @Delete(':id')
    remove(@Param('id') id: string) { return this.conceptsService.remove(id); }
}
