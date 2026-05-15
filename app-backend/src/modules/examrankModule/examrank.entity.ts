import {
Entity,
PrimaryGeneratedColumn,
Column,
CreateDateColumn,
UpdateDateColumn,
} from 'typeorm';

@Entity('examrank')
export class ExamRank{

    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ type: 'varchar', length: 20, unique: true})
    name!: string;

    @Column({ type: 'int'})
    min_score!: number;

    @Column({type: 'int'})
    max_score!: number;

    @CreateDateColumn()
    created_at!: Date;

    @UpdateDateColumn()
    updated_at!: Date;

}