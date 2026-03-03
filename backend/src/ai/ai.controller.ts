import { Controller, Post, Body } from '@nestjs/common';
import { AiService } from './ai.service';

@Controller('ai')
export class AiController {
    constructor(private readonly aiService: AiService) { }

    @Post('extract')
    async extract(@Body() body: { title: string; content: string }) {
        const insight = await this.aiService.extractForgettablePoints(body.title, body.content);
        return { insight };
    }
}
