// entities/base.entity.ts
import {
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Column,
} from 'typeorm';

export abstract class AuditableEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  createUser: number;

  @Column({ nullable: true, default: 0 })
  updateUser: number;

  @CreateDateColumn()
  createTime: Date;

  @UpdateDateColumn()
  updateTime: Date;
}
