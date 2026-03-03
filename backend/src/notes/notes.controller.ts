import { Controller, Get, Post, Body, Param, Put, Delete, Query } from '@nestjs/common';
import { NotesService } from './notes.service';

@Controller('notes')
export class NotesController {
    constructor(private readonly notesService: NotesService) { }

    @Post()
    async create(@Body() noteData: any) {
        return this.notesService.create(noteData);
    }

    @Get()
    async findAll(@Query('topic') topic?: string) {
        return this.notesService.findAll(topic);
    }

    @Get('topics')
    async getTopics() {
        return this.notesService.getTopics();
    }

    @Get(':id')
    async findOne(@Param('id') id: string) {
        return this.notesService.findOne(id);
    }

    @Put(':id')
    async update(@Param('id') id: string, @Body() noteData: any) {
        return this.notesService.update(id, noteData);
    }

    @Delete(':id')
    async remove(@Param('id') id: string) {
        return this.notesService.remove(id);
    }
}
