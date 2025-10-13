import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from './order.entity';

@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
  ) {}

  async findAll(): Promise<Order[]> {
    return this.orderRepository.find();
  }

  async findOne(id: number): Promise<Order | null> {
    return this.orderRepository.findOne({ where: { id } });
  }

  async create(order: Partial<Order>): Promise<Order> {
    const newOrder = this.orderRepository.create(order);
    return this.orderRepository.save(newOrder);
  }

  async update(id: number, order: Partial<Order>): Promise<Order | null> {
    await this.orderRepository.update(id, order);
    return this.orderRepository.findOne({ where: { id } });
  }

  async remove(id: number): Promise<void> {
    await this.orderRepository.delete(id);
  }
}
