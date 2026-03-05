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
                        content: `You are a professional DSA coach who writes exceptional interview study notes.
A student will paste a raw DSA question (possibly with partial notes or code).
Your job is to return a JSON object with these fields:
{
  "title": "Clean concise question title",
  "difficulty": "easy | medium | hard",
  "tags": ["tag1", "tag2"],
  "content": "A full rich markdown study document"
}

The "content" field must be a detailed Markdown document structured exactly like this:

# 1. Understand the Problem
[Clear English explanation of what is being asked]

---

# 2. Brute Force Idea
[Simple naive approach]

### Pseudocode
\`\`\`
[pseudocode here]
\`\`\`

### Complexity
- Time: O(...)
- Space: O(...)

### Problem with this approach
[Why it's too slow or wrong]

---

# 3. Optimization / Key Insight
[Mathematical property or pattern that enables speedup]

\`\`\`
[improved pseudocode]
\`\`\`

---

# 4. Algorithm Walkthrough
[Step-by-step example trace with a concrete input]

---

# 5. Final Algorithm
[Numbered clean steps]

---

# 6. Clean Code
\`\`\`java
[final interview-ready Java code]
\`\`\`

---

# 7. Complexity Analysis
- **Time:** O(...) — explanation
- **Space:** O(...) — explanation

---

# 8. Edge Cases & Follow-ups
[Common interview follow-up questions with brief answers]

Return ONLY the JSON. No markdown wrapper.`,
                    },
                    {
                        role: 'user',
                        content: `Raw Input:\n\n${rawInput}`,
                    },
                ] as any,
                temperature: 0.4,
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
