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
