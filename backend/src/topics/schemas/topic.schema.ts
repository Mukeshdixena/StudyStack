import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Topic extends Document {
    @Prop({ required: true, trim: true })
    name: string;

    @Prop({ trim: true })
    description: string;

    @Prop()
    keyInsights: string; // Brief overview

    @Prop({ default: '' })
    theoryContent: string; // The detailed study document (The Big Note)

    @Prop({ default: '' })
    snippetsContent: string; // The cohesive "Golden Bits" document

    @Prop({ default: 0 })
    totalQuestions: number;

    @Prop({ default: 0 })
    totalConcepts: number;

    @Prop({ default: false })
    isFolder: boolean;

    @Prop({ default: null })
    parentId: string; // ID of the parent folder

    @Prop({ default: 0 })
    order: number; // For manual sorting later

    @Prop({
        type: [{
            name: String,
            url: String,
            key: String, // S3/Spaces key
            type: { type: String, enum: ['upload', 'url'], default: 'url' },
            createdAt: { type: Date, default: Date.now }
        }],
        default: []
    })
    materials: any[];
}

export const TopicSchema = SchemaFactory.createForClass(Topic);
