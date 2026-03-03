import { Controller, Get, Post, Body, Param, Put, Delete } from '@nestjs/common';
import { QuestionsService } from './questions.service';

@Controller('questions')
export class QuestionsController {
    constructor(private readonly questionsService: QuestionsService) { }

    @Post()
    create(@Body() data: any) { return this.questionsService.create(data); }

    @Get('by-topic/:topicId')
    findByTopic(@Param('topicId') topicId: string) { return this.questionsService.findByTopic(topicId); }

    @Get('needs-revision')
    getNeedsRevision() { return this.questionsService.getNeedsRevision(); }

    @Get(':id')
    findOne(@Param('id') id: string) { return this.questionsService.findOne(id); }

    @Put(':id')
    update(@Param('id') id: string, @Body() data: any) { return this.questionsService.update(id, data); }

    @Delete(':id')
    remove(@Param('id') id: string) { return this.questionsService.remove(id); }
}
