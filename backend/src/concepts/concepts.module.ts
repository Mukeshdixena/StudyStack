import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConceptsController } from './concepts.controller';
import { ConceptsService } from './concepts.service';
import { Concept, ConceptSchema } from './schemas/concept.schema';

@Module({
    imports: [MongooseModule.forFeature([{ name: Concept.name, schema: ConceptSchema }])],
    controllers: [ConceptsController],
    providers: [ConceptsService],
    exports: [ConceptsService],
})
export class ConceptsModule { }
