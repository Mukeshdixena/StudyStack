import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class DsaNote extends Document {
    @Prop({ required: true })
    topic: string; // e.g., Arrays, Trees, DP

    @Prop({ required: true })
    title: string; // Question title/Note title

    @Prop()
    questionLink: string;

    @Prop({ type: [String], default: [] })
    tags: string[];

    @Prop({ required: true })
    detailedNotes: string; // Markdown supported

    @Prop()
    forgettables: string; // The "Important & Forgettable" section as requested

    @Prop({ default: false })
    isFavorite: boolean;
}

export const DsaNoteSchema = SchemaFactory.createForClass(DsaNote);
