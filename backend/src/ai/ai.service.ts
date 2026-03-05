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
            const configModel = this.configService.get<string>('AI_MODEL') || 'google/gemini-2.0-flash-001';
            const model = configModel.trim();
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
                ] as any,
                temperature: 0.7,
            });

            return response.choices[0].message?.content?.trim() || 'No insight found.';
        } catch (error) {
            console.error('AI Extraction Error:', error);
            return 'Failed to extract insights.';
        }
    }

    async generateQuestions(content: string): Promise<any[]> {
        try {
            const configModel = this.configService.get<string>('AI_MODEL') || 'google/gemini-2.0-flash-001';
            const model = configModel.trim();
            const response = await this.openai.chat.completions.create({
                model,
                messages: [
                    {
                        role: 'system',
                        content: 'You are a technical interviewer. Given a study note, generate 3-5 high-quality practice questions. Return ONLY a JSON array of objects with "text" and "answer" properties. No markdown formatting.',
                    },
                    {
                        role: 'user',
                        content: `Content: ${content}`,
                    },
                ] as any,
                temperature: 0.8,
            });

            const rawContent = response.choices[0].message?.content?.trim() || '[]';
            // Clean markdown if AI included it
            const cleaned = rawContent.replace(/```json/g, '').replace(/```/g, '').trim();
            return JSON.parse(cleaned);
        } catch (error) {
            console.error('AI Question Generation Error:', error);
            return [];
        }
    }

    async refineQuestion(rawInput: string): Promise<any> {
        try {
            const configModel = this.configService.get<string>('AI_MODEL') || 'google/gemini-2.0-flash-001';
            const model = configModel.trim();
            const response = await this.openai.chat.completions.create({
                model,
                messages: [
                    {
                        role: 'system',
                        content: `You are a professional DSA tutor. A student pasted a raw question (maybe with an answer). 
                        Extract it into a structured JSON object:
                        {
                          "title": "Clean concise title",
                          "difficulty": "easy/medium/hard",
                          "tags": ["tag1", "tag2"],
                          "personalNotes": "Core intuition or trick to solve",
                          "approaches": [
                            {
                              "title": "Main Approach",
                              "timeComplexity": "O(...)",
                              "spaceComplexity": "O(...)",
                              "notes": "Step-by-step pseudocode/logic description",
                              "code": "Cleanly formatted code block",
                              "language": "java/python/cpp/javascript"
                            }
                          ]
                        }
                        Return ONLY the JSON object. No markdown.`,
                    },
                    {
                        role: 'user',
                        content: `Raw Input: ${rawInput}`,
                    },
                ] as any,
                temperature: 0.5,
            });

            const rawContent = response.choices[0].message?.content?.trim() || '{}';
            const cleaned = rawContent.replace(/```json/g, '').replace(/```/g, '').trim();
            return JSON.parse(cleaned);
        } catch (error) {
            console.error('AI Refine Question Error:', error);
            return null;
        }
    }
}
