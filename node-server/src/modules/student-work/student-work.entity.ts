import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  UpdateDateColumn,
  CreateDateColumn,
} from 'typeorm';

@Entity('t_student_work')
export class StudentWork {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 50, nullable: true })
  date: string;

  @Column('text', { nullable: true })
  content: string;

  @Column({ nullable: true })
  createUser: number;

  @Column({ nullable: true })
  updateUser: number;

  @CreateDateColumn()
  createTime: Date;

  @UpdateDateColumn()
  updateTime: Date;
}
