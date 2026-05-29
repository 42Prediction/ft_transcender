import { Column, CreateDateColumn, Entity, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Role } from "../../../shared/enums/roles.enum";
import { Bettor } from "../../bettor/entities/bettor.entity";
import { Exclude } from "class-transformer";

@Entity('users')
export class User {
    @PrimaryGeneratedColumn('uuid')
    id!:         string;

    @Column({
        unique: true,
        nullable: false,
    })
    email!:      string;

    @Column({type:'text', nullable:true})
    @Exclude({ toPlainOnly: true })
    password!:   string;
    @Column({
        type: 'enum',
        enum: Role,
        default: Role.USER,
    })
    role!:       Role;

    @Column({
        default: false,
    })
    state!:      boolean;

    @CreateDateColumn({name: 'created_at'})
    createdAt!: Date;

    @UpdateDateColumn({name: 'updated_at'})
    updatedAt!: Date;
}