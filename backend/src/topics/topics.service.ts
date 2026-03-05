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

    async addMaterial(id: string, material: any): Promise<Topic> {
        const topic = await this.topicModel.findByIdAndUpdate(
            id,
            { $push: { materials: material } },
            { new: true }
        ).exec() as any as Topic;
        if (!topic) throw new NotFoundException('Topic not found');
        return topic;
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

        // Delete all PDFs if exists
        if (topic.materials && topic.materials.length > 0) {
            for (const material of topic.materials) {
                if (material.key) {
                    try {
                        await this.storageService.deleteFile(material.key);
                    } catch (e) {
                        console.error('Failed to delete PDF from storage:', e);
                    }
                }
            }
        }

        return this.topicModel.findByIdAndDelete(id).exec();
    }

    async removeMaterial(id: string, materialId: string): Promise<Topic> {
        const topic = await this.findOne(id);
        const material = topic.materials.find(m => m._id.toString() === materialId);

        if (material && material.key) {
            await this.storageService.deleteFile(material.key);
        }

        const updatedTopic = await this.topicModel.findByIdAndUpdate(
            id,
            { $pull: { materials: { _id: materialId } } },
            { new: true }
        ).exec() as any as Topic;

        if (!updatedTopic) throw new NotFoundException('Topic not found');
        return updatedTopic;
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
