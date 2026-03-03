import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Concept extends Document {
    @Prop({ type: Types.ObjectId, ref: 'Topic', required: true })
    topicId: Types.ObjectId;

    @Prop({ required: true, trim: true })
    title: string;

    @Prop({ required: true })
    explanation: string;

    @Prop()
    keyPoints: string;  // The forgettable / crucial bits
}

export const ConceptSchema = SchemaFactory.createForClass(Concept);
