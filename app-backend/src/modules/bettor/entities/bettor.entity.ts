import { Column, CreateDateColumn, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { User } from "../../user/entities/user.entity";

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

    @CreateDateColumn({name: 'created_at'})
    createdAt!: Date;

    @UpdateDateColumn({name: 'updated_at'})
    updatedAt!: Date;
}
