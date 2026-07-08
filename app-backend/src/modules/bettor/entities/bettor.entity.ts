import { Column, CreateDateColumn, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn, ManyToMany, JoinTable } from "typeorm";
import { User } from "../../user/entities/user.entity";
import { Wallet } from "../../wallet/entities/wallet.entity";

@Entity('bettors')
export class Bettor {
    @PrimaryGeneratedColumn('uuid')
    id!: string;
    
    @Column({
        unique: true,
        length: 36,
    })
    nick!: string;

    @Column({
        type: 'text',
        nullable: true,
    })
    bio!: string;

    @Column()
    avatar!: string;

    @Column({
        name: 'is_nick_setted',
        default: false,
    })
    isNickSetted!: boolean;

    @Column({
        type: 'text',
        nullable: true
    })
    campus?: string;

    // 42 intra login of the cadet behind this account (null for non-42 users).
    @Column({ name: 'school42_login', type: 'varchar', nullable: true })
    school42Login?: string;

    // Snapshot of the cadet's 42 cursus level. Set at signup; the source of the
    // level welcome bonus and (Phase 2) the baseline for crediting level-ups.
    @Column({ name: 'school42_level', type: 'decimal', precision: 6, scale: 2, nullable: true })
    school42Level?: number;

    // Daily-bonus engagement: consecutive-day counter and the last claim time.
    @Column({ name: 'daily_streak', type: 'int', default: 0 })
    dailyStreak!: number;

    @Column({ name: 'last_daily_claim_at', type: 'timestamptz', nullable: true })
    lastDailyClaimAt?: Date;

    @OneToOne(()=> User, {onDelete: 'CASCADE'})
    @JoinColumn({ name: 'user_id' })
    user!: User;

    @ManyToMany(() => Bettor)
    @JoinTable({
        name: 'bettor_friends',
        joinColumn: { name: 'bettor_id', referencedColumnName: 'id' },
        inverseJoinColumn: { name: 'friend_id', referencedColumnName: 'id' }
    })
    friends!: Bettor[];

    @OneToOne(() => Wallet, (wallet) => wallet.bettor)
    wallet!: Wallet;

    @CreateDateColumn({name: 'created_at'})
    createdAt!: Date;

    @UpdateDateColumn({name: 'updated_at'})
    updatedAt!: Date;
}
