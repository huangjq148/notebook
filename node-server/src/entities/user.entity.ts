import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('t_user')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 50 })
  realname: string;

  @Column({ length: 100 })
  sex: string;

  @Column({ length: 100, nullable: true })
  createUser: string;

  @CreateDateColumn()
  createTime: Date;

  @UpdateDateColumn()
  updateTime: Date;
}
