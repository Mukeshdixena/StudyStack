import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Question extends Document {
    @Prop({ type: Types.ObjectId, ref: 'Topic', required: true })
    topicId: Types.ObjectId;

    @Prop({ required: true, trim: true })
    title: string;

    @Prop({ enum: ['easy', 'medium', 'hard'], default: 'medium' })
    difficulty: string;

    @Prop({ default: false })
    needsRevision: boolean;

    @Prop({ default: false })
    isSolved: boolean;

    @Prop()
    leetcodeLink: string;

    @Prop()
    gfgLink: string;

    @Prop({ default: '' })
    content: string;  // Single rich Markdown document: problem understanding, logic, pseudocode, code, complexity

    @Prop({ type: [String], default: [] })
    tags: string[];
}

export const QuestionSchema = SchemaFactory.createForClass(Question);
