import { Module } from '@nestjs/common';
import { School42Service } from './school42.service';

@Module({
  providers: [School42Service],
  exports: [School42Service],
})
export class School42Module {}
