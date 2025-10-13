import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('t_alarm')
export class Alarm {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 255, nullable: true })
  title: string;

  @Column({ length: 255, nullable: true })
  date: string;

  @Column({ length: 255, nullable: true })
  time: string;

  @Column({ length: 255, nullable: true })
  description: string;

  @Column({ length: 1, nullable: true })
  isEnable: string;

  @Column({ length: 1, nullable: true })
  isRepeat: string;

  @Column({ nullable: true })
  createUser: number;

  @Column({ nullable: true })
  updateUser: number;

  @Column({ length: 20, nullable: true })
  createTime: string;

  @Column({ length: 20, nullable: true })
  updateTime: string;
}
