import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Question } from './schemas/question.schema';

@Injectable()
export class QuestionsService {
    constructor(@InjectModel(Question.name) private questionModel: Model<Question>) { }

    async create(data: any): Promise<Question> {
        return new this.questionModel(data).save();
    }

    async findByTopic(topicId: string): Promise<Question[]> {
        return this.questionModel.find({ topicId }).sort({ createdAt: -1 }).exec();
    }

    async findOne(id: string): Promise<Question> {
        const q = await this.questionModel.findById(id).exec();
        if (!q) throw new NotFoundException('Question not found');
        return q;
    }

    async update(id: string, data: any): Promise<Question> {
        const q = await this.questionModel.findByIdAndUpdate(id, data, { new: true }).exec();
        if (!q) throw new NotFoundException('Question not found');
        return q;
    }

    async remove(id: string): Promise<any> {
        const q = await this.questionModel.findByIdAndDelete(id).exec();
        if (!q) throw new NotFoundException('Question not found');
        return q;
    }

    async getNeedsRevision(): Promise<Question[]> {
        return this.questionModel.find({ needsRevision: true }).sort({ updatedAt: -1 }).exec();
    }
}
