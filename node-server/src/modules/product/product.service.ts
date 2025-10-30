import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Like, Repository } from 'typeorm';
import { Product } from './product.entity';

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  async queryPage(query: {
    name: string;
    current: number;
    pageSize: number;
  }): Promise<[Product[], number]> {
    const queryResult = await this.productRepository.findAndCount({
      where: {
        name: Like(`%${query.name}%`),
      },
      skip: (query.current - 1) * query.pageSize,
      take: query.pageSize,
    });
    return queryResult;
  }

  async findOne(id: number): Promise<Product | null> {
    const queryResult = await this.productRepository.findOne({ where: { id } });
    return queryResult;
  }

  async create(product: Partial<Product>): Promise<Product> {
    const newProduct = this.productRepository.create(product);
    return this.productRepository.save(newProduct);
  }

  async update(id: number, product: Partial<Product>): Promise<Product | null> {
    await this.productRepository.update(id, product);
    const queryResult = await this.productRepository.findOne({ where: { id } });
    return queryResult;
  }

  async remove(id: number): Promise<number> {
    const result = await this.productRepository.delete(id);
    return result?.affected ?? 0;
  }
}
