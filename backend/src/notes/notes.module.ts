import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { NotesController } from './notes.controller';
import { NotesService } from './notes.service';
import { DsaNote, DsaNoteSchema } from './schemas/note.schema';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: DsaNote.name, schema: DsaNoteSchema }]),
    ],
    controllers: [NotesController],
    providers: [NotesService],
    exports: [NotesService],
})
export class NotesModule { }
