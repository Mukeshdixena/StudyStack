import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TopicsController } from './topics.controller';
import { TopicsService } from './topics.service';
import { Topic, TopicSchema } from './schemas/topic.schema';
import { StorageModule } from '../storage/storage.module';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: Topic.name, schema: TopicSchema }]),
        StorageModule,
    ],
    controllers: [TopicsController],
    providers: [TopicsService],
    exports: [TopicsService],
})
export class TopicsModule { }
