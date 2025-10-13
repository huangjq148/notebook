import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

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

  @Column({ length: 50, nullable: true })
  createTime: string;

  @Column({ length: 50, nullable: true })
  updateTime: string;
}
