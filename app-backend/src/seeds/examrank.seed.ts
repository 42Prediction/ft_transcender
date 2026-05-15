import { ExamRank } from '../modules/examrankModule/examrank.entity';
import { DataSource } from 'typeorm';

const examRanks = [
    { name: 'Exam Rank 02', min_score: 0, max_score: 100 },
    { name: 'Exam Rank 03', min_score: 0, max_score: 100 },
    { name: 'Exam Rank 04', min_score: 0, max_score: 100 },
    { name: 'Exam Rank 05', min_score: 0, max_score: 100 },
    { name: 'Exam Rank 06', min_score: 0, max_score: 100 },
];

export async function seedExamRanks(dataSource: DataSource) {

    const repo = dataSource.getRepository(ExamRank);

    for(const rank of examRanks){
        const exists = await repo.findOneBy({ name: rank.name});
        if (!exists)
            await repo.save(repo.create(rank));
    }
    console.log('ExamRank seed concluído\n');
}