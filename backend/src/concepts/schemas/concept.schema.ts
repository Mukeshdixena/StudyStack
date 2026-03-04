import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Concept extends Document {
    @Prop({ type: Types.ObjectId, ref: 'Topic', required: true })
    topicId: Types.ObjectId;

    @Prop({ default: '', trim: true })
    title: string;

    @Prop({ default: '' })
    explanation: string;

    @Prop({ default: '' })
    keyPoints: string;  // The forgettable / crucial bits
}

export const ConceptSchema = SchemaFactory.createForClass(Concept);
