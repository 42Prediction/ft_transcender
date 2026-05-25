import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToMany,
  JoinTable,
} from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  username: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column({
    default: 'https://i.imgur.com/6VBx3io.png', // avatar default
  })
  avatar_url: string;

  @Column({ default: false })
  is_online: boolean;

  @CreateDateColumn()
  update_at: Date;

  @CreateDateColumn()
  created_at: Date;

  @ManyToMany(() => User)
  @JoinTable({
    name: 'user_friends', // Tabela que guarda a relação
    joinColumn: { name: 'user_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'friend_id', referencedColumnName: 'id' },
  })
  friends: User[];
}