import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

@Injectable()
export class AiService {
    private openai: OpenAI;

    constructor(private configService: ConfigService) {
        this.openai = new OpenAI({
            apiKey: this.configService.get<string>('AI_API_KEY'),
            baseURL: this.configService.get<string>('AI_BASE_URL'),
        });
    }

    async extractForgettablePoints(title: string, content: string): Promise<string> {
        try {
            const model = this.configService.get<string>('AI_MODEL') || 'google/gemini-2.0-flash-lite-preview-02-05:free';
            const response = await this.openai.chat.completions.create({
                model,
                messages: [
                    {
                        role: 'system',
                        content: 'You are a DSA expert. Your task is to extract only the most important and easily forgettable points from the following study note. Be very concise, use bullet points or a single powerful sentence.',
                    },
                    {
                        role: 'user',
                        content: `Topic: ${title}\nContent: ${content}`,
                    },
                ] as any, // Bypass strict type check for now if necessary
                temperature: 0.7,
            });

            return response.choices[0].message?.content?.trim() || 'No insight found.';
        } catch (error) {
            console.error('AI Extraction Error:', error);
            return 'Failed to extract insights.';
        }
    }
}
