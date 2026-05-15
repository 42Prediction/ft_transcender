import { Controller, Get } from '@nestjs/common';
import { ExamRank } from './examrank.entity';
import { ExamRankService } from './examrank.service';

@Controller('examrank')
export class ExamRankController {
	constructor(private readonly examRankService: ExamRankService) {}

	@Get()
	findAll(): Promise<ExamRank[]> {
		return this.examRankService.findAll();
	}
}
