import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('t_stock')
export class Stock {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 255, nullable: true })
  name: string;

  @Column({ length: 255, nullable: true })
  buyPrice: string;

  @Column({ length: 255, nullable: true })
  sellPrice: string;

  @Column({ nullable: true })
  number: number;

  @Column({ nullable: true })
  createUser: number;

  @Column({ nullable: true })
  updateUser: number;

  @Column({ length: 20, nullable: true })
  createTime: string;

  @Column({ length: 20, nullable: true })
  updateTime: string;
}

export interface StockStatus {
  buyMoney: number;
  sellMoney: number;
}
