import { AuditableEntity } from 'src/common/auditable/auditable.entity';
import { Column, Entity } from 'typeorm';

@Entity('t_order')
export class Order extends AuditableEntity {
  @Column({ length: 100, nullable: true })
  name: string;

  @Column({ length: 100, nullable: true })
  contact: string;

  @Column({ length: 100, nullable: true })
  address: string;

  @Column({ length: 15, nullable: true })
  phone: string;

  @Column({ length: 20, nullable: true, default: '0' })
  buyPrice: string;

  @Column({ length: 20, nullable: true, default: '0' })
  sellPrice: string;

  @Column({ nullable: false })
  number: number;

  @Column({ length: 255, nullable: true })
  remark: string;

  @Column({ length: 1, nullable: true })
  status: string;

  @Column({ nullable: true })
  stockId: number;

  @Column({ length: 10, nullable: true })
  otherCost: string;

  @Column({ length: 40, nullable: true })
  orderTime: string;
}

export interface OrderStats {
  buyMoney: string; // SUM 函数通常返回字符串
  sellMoney: string;
  number: string;
  otherCost: string;
}
