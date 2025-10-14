import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('t_contact')
export class Contact {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 255, nullable: true })
  realname: string;

  @Column({ length: 15, nullable: true })
  phone: string;

  @Column({ length: 255, nullable: true })
  address: string;

  @Column({ nullable: true })
  createUser: number;

  @Column({ nullable: true })
  updateUser: number;

  @Column({ length: 20, nullable: true })
  createTime: string;

  @Column({ length: 20, nullable: true })
  updateTime: string;
}
