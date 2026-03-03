import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export class Approach {
    title: string;   // e.g. "Approach 1: Brute Force"
    code: string;    // actual code
    language: string; // js, python, java, cpp etc.
    timeComplexity: string;
    spaceComplexity: string;
    notes: string;
}

@Schema({ timestamps: true })
export class Question extends Document {
    @Prop({ type: Types.ObjectId, ref: 'Topic', required: true })
    topicId: Types.ObjectId;

    @Prop({ required: true, trim: true })
    title: string;

    @Prop({ enum: ['easy', 'medium', 'hard'], default: 'medium' })
    difficulty: string;

    @Prop({ default: false })
    needsRevision: boolean;   // ← the "hard / revise this" flag

    @Prop({ default: false })
    isSolved: boolean;

    @Prop()
    leetcodeLink: string;

    @Prop()
    gfgLink: string;

    @Prop()
    personalNotes: string;

    @Prop({ type: [Object], default: [] })
    approaches: Approach[];   // [{title, code, language, timeComplexity, spaceComplexity, notes}]

    @Prop({ type: [String], default: [] })
    tags: string[];
}

export const QuestionSchema = SchemaFactory.createForClass(Question);
