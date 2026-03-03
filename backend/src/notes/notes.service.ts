import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { DsaNote } from './schemas/note.schema';

@Injectable()
export class NotesService {
    constructor(
        @InjectModel(DsaNote.name) private noteModel: Model<DsaNote>,
    ) { }

    async create(noteData: any): Promise<DsaNote> {
        const newNote = new this.noteModel(noteData);
        return newNote.save();
    }

    async findAll(topic?: string): Promise<DsaNote[]> {
        const filter = topic ? { topic } : {};
        return this.noteModel.find(filter).sort({ createdAt: -1 }).exec();
    }

    async findOne(id: string): Promise<DsaNote> {
        const note = await this.noteModel.findById(id).exec();
        if (!note) throw new NotFoundException('Note not found');
        return note;
    }

    async update(id: string, noteData: any): Promise<DsaNote> {
        const updated = await this.noteModel
            .findByIdAndUpdate(id, noteData, { new: true })
            .exec();
        if (!updated) throw new NotFoundException('Note not found');
        return updated;
    }

    async remove(id: string): Promise<any> {
        const result = await this.noteModel.findByIdAndDelete(id).exec();
        if (!result) throw new NotFoundException('Note not found');
        return result;
    }

    async getTopics(): Promise<string[]> {
        return this.noteModel.distinct('topic').exec();
    }
}
