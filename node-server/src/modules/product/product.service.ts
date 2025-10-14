import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './product.entity';
import { ResponseResult, QueryResult } from 'src/utils';

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  async findAll(): Promise<QueryResult<Product>> {
    const queryResult = await this.productRepository.findAndCount();
    return ResponseResult.page<Product>(queryResult);
  }

  async findOne(id: number): Promise<QueryResult<Product | null>> {
    const queryResult = await this.productRepository.findOne({ where: { id } });
    return ResponseResult.success<Product | null>(queryResult);
  }

  async create(product: Partial<Product>): Promise<Product> {
    const newProduct = this.productRepository.create(product);
    return this.productRepository.save(newProduct);
  }

  async update(
    id: number,
    product: Partial<Product>,
  ): Promise<QueryResult<Product | null>> {
    await this.productRepository.update(id, product);
    const queryResult = await this.productRepository.findOne({ where: { id } });
    return ResponseResult.success<Product | null>(queryResult);
  }

  async remove(id: number): Promise<QueryResult<string>> {
    await this.productRepository.delete(id);
    return ResponseResult.successMessage<string>('删除成功');
  }
}
