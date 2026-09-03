import { Module } from '@nestjs/common';
import { LabelsService } from './labels.service.js';
import { LabelsController } from './labels.controller.js';
import { Label, LabelSchema } from './schemas/label.schema.js';
import { TaskLabel, TaskLabelSchema } from './schemas/task-label.schema.js';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module.js';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Label.name, schema: LabelSchema }]),
    MongooseModule.forFeature([{ name: TaskLabel.name, schema: TaskLabelSchema }]),
    AuthModule
  ],
  
  providers: [LabelsService],
  controllers: [LabelsController]
})
export class LabelsModule {}
