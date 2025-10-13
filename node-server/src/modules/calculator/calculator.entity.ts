import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('t_calculator')
export class Calculator {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  count: number;

  @Column({ nullable: true })
  answerRange: number;

  @Column({ length: 255, nullable: true })
  operations: string;

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
