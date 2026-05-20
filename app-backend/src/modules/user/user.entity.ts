import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
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
}