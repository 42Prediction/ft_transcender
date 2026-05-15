import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExamRankController } from './examrank.controller';
import { ExamRank } from './examrank.entity';
import { ExamRankService } from './examrank.service';

@Module({
	imports: [TypeOrmModule.forFeature([ExamRank])],
	controllers: [ExamRankController],
	providers: [ExamRankService],
	exports: [ExamRankService],
})
export class ExamRankModule {}
