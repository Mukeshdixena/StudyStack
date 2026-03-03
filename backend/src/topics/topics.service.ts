import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Topic } from './schemas/topic.schema';

@Injectable()
export class TopicsService {
    constructor(@InjectModel(Topic.name) private topicModel: Model<Topic>) { }

    async create(data: any): Promise<Topic> {
        return new this.topicModel(data).save();
    }

    async findAll(): Promise<Topic[]> {
        return this.topicModel.find().sort({ name: 1 }).exec();
    }

    async findOne(id: string): Promise<Topic> {
        const topic = await this.topicModel.findById(id).exec();
        if (!topic) throw new NotFoundException('Topic not found');
        return topic;
    }

    async update(id: string, data: any): Promise<Topic> {
        const t = await this.topicModel.findByIdAndUpdate(id, data, { new: true }).exec();
        if (!t) throw new NotFoundException('Topic not found');
        return t;
    }

    async remove(id: string): Promise<any> {
        const t = await this.topicModel.findByIdAndDelete(id).exec();
        if (!t) throw new NotFoundException('Topic not found');
        return t;
    }
}
