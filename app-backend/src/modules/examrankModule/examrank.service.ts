import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ExamRank } from './examrank.entity';

@Injectable()
export class ExamRankService {
	constructor(
		@InjectRepository(ExamRank)
		private readonly examRankRepository: Repository<ExamRank>,
	) {}

	findAll(): Promise<ExamRank[]> {
		return this.examRankRepository.find({
			order: { min_score: 'ASC' },
		});
	}
}
