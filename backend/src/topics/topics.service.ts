import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Topic } from './schemas/topic.schema';
import { StorageService } from '../storage/storage.service';
import { Question } from '../questions/schemas/question.schema';
import { Concept } from '../concepts/schemas/concept.schema';

@Injectable()
export class TopicsService {
    constructor(
        @InjectModel(Topic.name) private topicModel: Model<Topic>,
        @InjectModel(Question.name) private questionModel: Model<Question>,
        @InjectModel(Concept.name) private conceptModel: Model<Concept>,
        private readonly storageService: StorageService
    ) { }

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

    async updatePdf(id: string, pdfUrl: string, pdfKey: string): Promise<Topic> {
        const topic = await this.findOne(id);

        // Delete old PDF if exists
        if (topic.pdfKey) {
            try {
                await this.storageService.deleteFile(topic.pdfKey);
            } catch (e) {
                console.error('Failed to delete old PDF:', e);
            }
        }

        return this.update(id, { pdfUrl, pdfKey });
    }

    async remove(id: string): Promise<any> {
        const topic = await this.topicModel.findById(id).exec();
        if (!topic) throw new NotFoundException('Topic not found');

        // If it's a folder, delete all children recursively
        if (topic.isFolder) {
            const children = await this.topicModel.find({ parentId: id }).exec();
            for (const child of children) {
                await this.remove(child._id.toString());
            }
        } else {
            // If it's a topic, remove related questions and concepts
            await this.questionModel.deleteMany({ topicId: id }).exec();
            await this.conceptModel.deleteMany({ topicId: id }).exec();
        }

        // Delete PDF if exists
        if (topic.pdfKey) {
            try {
                await this.storageService.deleteFile(topic.pdfKey);
            } catch (e) {
                console.error('Failed to delete PDF from storage:', e);
            }
        }

        return this.topicModel.findByIdAndDelete(id).exec();
    }

    async removePdf(id: string): Promise<Topic> {
        const topic = await this.findOne(id);
        if (topic.pdfKey) {
            await this.storageService.deleteFile(topic.pdfKey);
        }
        return this.update(id, { pdfUrl: null, pdfKey: null });
    }

    async move(id: string, parentId: string): Promise<Topic> {
        return this.update(id, { parentId: parentId || null });
    }

    async search(query: string): Promise<any> {
        const regex = new RegExp(query, 'i');
        const [topics, questions, concepts] = await Promise.all([
            this.topicModel.find({ name: regex, isFolder: false }).limit(10).exec(),
            this.questionModel.find({ text: regex }).populate('topicId', 'name').limit(10).exec(),
            this.conceptModel.find({ explanation: regex }).populate('topicId', 'name').limit(10).exec(),
        ]);

        return { topics, questions, concepts };
    }
}
