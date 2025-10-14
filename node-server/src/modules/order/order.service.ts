import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryResult, ResponseResult } from 'src/utils';
import { Repository } from 'typeorm';
import { Contact } from '../contact/contact.entity';
import { Product } from '../product/product.entity';
import { Order, OrderStats } from './order.entity';

@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(Contact)
    private readonly contactRepository: Repository<Contact>,
  ) {}

  async findAll(): Promise<QueryResult<Order>> {
    const queryResult = await this.orderRepository.findAndCount();
    return ResponseResult.page<Order>(queryResult);
  }

  async findOne(id: number): Promise<QueryResult<Order | null>> {
    const queryResult = await this.orderRepository.findOne({ where: { id } });
    return ResponseResult.success<Order | null>(queryResult);
  }

  async create(order: Partial<Order>): Promise<Order> {
    const newOrder = this.orderRepository.create(order);
    return this.orderRepository.save(newOrder);
  }

  async update(
    id: number,
    order: Partial<Order>,
  ): Promise<QueryResult<Order | null>> {
    await this.orderRepository.update(id, order);
    const queryResult = await this.orderRepository.findOne({ where: { id } });
    return ResponseResult.success<Order | null>(queryResult);
  }

  async remove(id: number): Promise<QueryResult<any>> {
    await this.orderRepository.delete(id);
    return ResponseResult.success<any>({});
  }

  async products(): Promise<QueryResult<string[]>> {
    const queryResult = await this.productRepository.find();
    return ResponseResult.success<string[]>(
      queryResult.map((item) => item.name),
    );
  }

  async contacts(): Promise<QueryResult<string[]>> {
    const queryResult = await this.contactRepository.find();
    return ResponseResult.success<string[]>(
      queryResult.map((item) => item.realname),
    );
  }

  async statistics(): Promise<QueryResult<OrderStats>> {
    // const queryResult = await this.orderRepository.findAndCount();
    const result = (await this.orderRepository
      .createQueryBuilder('t')
      .select([
        'IFNULL(SUM(t.buyPrice * t.number), 0) AS buyMoney',
        'IFNULL(SUM(t.sellPrice * t.number), 0) AS sellMoney',
        'IFNULL(SUM(t.number), 0) AS number',
        'IFNULL(SUM(t.otherCost), 0) AS otherCost',
      ])
      .getRawOne<OrderStats>()) || {
      buyMoney: '0',
      sellMoney: '0',
      number: '0',
      otherCost: '0',
    };
    return ResponseResult.success<OrderStats>(result);
  }
}
