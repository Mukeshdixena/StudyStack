import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Topic extends Document {
    @Prop({ required: true, trim: true })
    name: string;

    @Prop({ trim: true })
    description: string;

    @Prop()
    keyInsights: string; // Most important notes for the topic

    @Prop({ default: 0 })
    totalQuestions: number;

    @Prop({ default: 0 })
    totalConcepts: number;
}

export const TopicSchema = SchemaFactory.createForClass(Topic);
