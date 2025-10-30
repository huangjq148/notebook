import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, Like } from 'typeorm';
import { Contact } from '../contact/contact.entity';
import { Product } from '../product/product.entity';
import { Stock } from '../stock/stock.entity';
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
    @InjectRepository(Stock)
    private readonly stockRepository: Repository<Stock>,
  ) {}

  async revokeStock(id: number): Promise<string> {
    const order = await this.orderRepository.findOne({ where: { id } });
    if (!order) {
      throw new Error('订单不存在');
    }
    await this.stockRepository.increment(
      { id: order.stockId },
      'number',
      order.number,
    );
    await this.orderRepository.delete(id);
    return '订单已撤销';
  }

  getQueryParams = (queryParams) => {
    const params: Record<string, any> = {};
    if (queryParams.name) {
      params.name = Like(`%${queryParams.name}%`);
    }
    if (queryParams.contact) {
      params.contact = Like(`%${queryParams.contact}%`);
    }
    if (queryParams.startCreateDate && queryParams.endCreateDate) {
      params.orderTime = Between(
        queryParams.startCreateDate,
        queryParams.endCreateDate,
      );
    }
    return params;
  };

  async statistics(params): Promise<OrderStats> {
    const result = (await this.orderRepository
      .createQueryBuilder('t')
      .select([
        'IFNULL(SUM(t.buyPrice * t.number), 0) AS buyMoney',
        'IFNULL(SUM(t.sellPrice * t.number), 0) AS sellMoney',
        'IFNULL(SUM(t.number), 0) AS number',
        'IFNULL(SUM(t.otherCost), 0) AS otherCost',
      ])
      .where(this.getQueryParams(params))
      .getRawOne<OrderStats>()) || {
      buyMoney: '0',
      sellMoney: '0',
      number: '0',
      otherCost: '0',
    };
    return result;
  }

  async queryPage(params: {
    name: string;
    contact: string;
    startCreateDate: string;
    endCreateDate: string;
    current: number;
    pageSize: number;
  }): Promise<[Order[], number]> {
    const queryParams: Record<string, any> = this.getQueryParams(params);
    const queryResult = await this.orderRepository.findAndCount({
      where: queryParams,
      take: params.pageSize,
      skip: (params.current - 1) * params.pageSize,
      order: { id: 'DESC' },
    });
    return queryResult;
  }

  async findOne(id: number): Promise<Order | null> {
    const queryResult = await this.orderRepository.findOne({ where: { id } });
    return queryResult;
  }

  async create(order: Partial<Order>): Promise<Order | string> {
    if (!order.number) {
      throw new Error('请输入购买数量');
    }
    if (order.stockId) {
      const stock = await this.stockRepository.findOne({
        where: { id: order.stockId },
      });
      if (!stock) {
        throw new Error('无此商品');
      }
      if (stock.number < order.number) {
        throw new Error('库存不足');
      }
      await this.stockRepository.decrement(
        { id: order.stockId },
        'number',
        +order.number,
      );
    }
    const newOrder = this.orderRepository.create(order);
    const queryResult = await this.orderRepository.save(newOrder);
    return queryResult;
  }

  async update(id: number, order: Partial<Order>): Promise<Order | null> {
    await this.orderRepository.update(id, order);
    const queryResult = await this.orderRepository.findOne({ where: { id } });
    return queryResult;
  }

  async remove(id: number): Promise<string> {
    await this.orderRepository.delete(id);
    return '操作成功';
  }

  async productNames(): Promise<string[]> {
    const queryResult = await this.productRepository.find();
    return queryResult.map((item) => item.name);
  }

  async contactNames(): Promise<string[]> {
    const queryResult = await this.contactRepository.find();
    return queryResult.map((item) => item.realname);
  }
}
