import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Concept } from './schemas/concept.schema';
import { Topic } from '../topics/schemas/topic.schema';

@Injectable()
export class ConceptsService {
    constructor(
        @InjectModel(Concept.name) private conceptModel: Model<Concept>,
        @InjectModel(Topic.name) private topicModel: Model<Topic>,
    ) { }

    async create(data: any): Promise<Concept> {
        const c = await new this.conceptModel(data).save();
        if (data.topicId) {
            await this.topicModel.findByIdAndUpdate(data.topicId, { $inc: { totalConcepts: 1 } }).exec();
        }
        return c;
    }

    async findByTopic(topicId: string): Promise<Concept[]> {
        return this.conceptModel.find({ topicId }).sort({ createdAt: -1 }).exec();
    }

    async findAll(): Promise<Concept[]> {
        return this.conceptModel.find().populate('topicId', 'name').sort({ createdAt: -1 }).exec();
    }

    async findOne(id: string): Promise<Concept> {
        const c = await this.conceptModel.findById(id).exec();
        if (!c) throw new NotFoundException('Concept not found');
        return c;
    }

    async update(id: string, data: any): Promise<Concept> {
        const c = await this.conceptModel.findByIdAndUpdate(id, data, { new: true }).exec();
        if (!c) throw new NotFoundException('Concept not found');
        return c;
    }

    async remove(id: string): Promise<any> {
        const c = await this.conceptModel.findByIdAndDelete(id).exec();
        if (!c) throw new NotFoundException('Concept not found');
        if (c.topicId) {
            await this.topicModel.findByIdAndUpdate(c.topicId, { $inc: { totalConcepts: -1 } }).exec();
        }
        return c;
    }
}
