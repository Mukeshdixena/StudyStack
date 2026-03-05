import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TopicsController } from './topics.controller';
import { TopicsService } from './topics.service';
import { Topic, TopicSchema } from './schemas/topic.schema';
import { StorageModule } from '../storage/storage.module';
import { Question, QuestionSchema } from '../questions/schemas/question.schema';
import { Concept, ConceptSchema } from '../concepts/schemas/concept.schema';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Topic.name, schema: TopicSchema },
            { name: Question.name, schema: QuestionSchema },
            { name: Concept.name, schema: ConceptSchema },
        ]),
        StorageModule,
    ],
    controllers: [TopicsController],
    providers: [TopicsService],
    exports: [TopicsService],
})
export class TopicsModule { }
