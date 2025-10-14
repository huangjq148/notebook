import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Stock, StockStatus } from './stock.entity';
import { ResponseResult, QueryResult } from 'src/utils';

@Injectable()
export class StockService {
  async statistics(): Promise<QueryResult<StockStatus>> {
    const result = (await this.stockRepository
      .createQueryBuilder('t')
      .select([
        'IFNULL(SUM(t.buyPrice * t.number), 0) AS buyMoney',
        'IFNULL(SUM(t.sellPrice * t.number), 0) AS sellMoney',
      ])
      .getRawOne<StockStatus>()) || {
      buyMoney: 0,
      sellMoney: 0,
    };
    return ResponseResult.success<StockStatus>(result);
  }
  constructor(
    @InjectRepository(Stock)
    private readonly stockRepository: Repository<Stock>,
  ) {}

  async findAll(): Promise<QueryResult<Stock>> {
    const queryResult = await this.stockRepository.findAndCount();
    return ResponseResult.page<Stock>(queryResult);
  }

  async findOne(id: number): Promise<QueryResult<Stock | null>> {
    const queryResult = await this.stockRepository.findOne({ where: { id } });
    return ResponseResult.success<Stock | null>(queryResult);
  }

  async create(stock: Partial<Stock>): Promise<QueryResult<Stock>> {
    const newStock = this.stockRepository.create(stock);
    const queryResult = await this.stockRepository.save(newStock);
    return ResponseResult.success<Stock>(queryResult);
  }

  async update(
    id: number,
    stock: Partial<Stock>,
  ): Promise<QueryResult<Stock | null>> {
    await this.stockRepository.update(id, stock);
    const queryResult = await this.stockRepository.findOne({ where: { id } });
    return ResponseResult.success<Stock | null>(queryResult);
  }

  async remove(id: number): Promise<QueryResult<string>> {
    await this.stockRepository.delete(id);
    return ResponseResult.successMessage('删除成功');
  }
}
