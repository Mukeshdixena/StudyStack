import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConceptsController } from './concepts.controller';
import { ConceptsService } from './concepts.service';
import { Concept, ConceptSchema } from './schemas/concept.schema';
import { Topic, TopicSchema } from '../topics/schemas/topic.schema';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Concept.name, schema: ConceptSchema },
            { name: Topic.name, schema: TopicSchema }
        ])
    ],
    controllers: [ConceptsController],
    providers: [ConceptsService],
    exports: [ConceptsService],
})
export class ConceptsModule { }
