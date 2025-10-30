import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Like, Repository } from 'typeorm';
import { Stock, StockStatus } from './stock.entity';

@Injectable()
export class StockService {
  constructor(
    @InjectRepository(Stock)
    private readonly stockRepository: Repository<Stock>,
  ) {}

  async statistics(query: { name: string }): Promise<StockStatus> {
    const result = (await this.stockRepository
      .createQueryBuilder('t')
      .select([
        'IFNULL(SUM(t.buyPrice * t.number), 0) AS buyMoney',
        'IFNULL(SUM(t.sellPrice * t.number), 0) AS sellMoney',
      ])
      .where({ name: Like(`%${query.name ?? ''}%`) })
      .getRawOne<StockStatus>()) || {
      buyMoney: 0,
      sellMoney: 0,
    };
    return result;
  }

  async queryPage(query: {
    name: string;
    current: number;
    pageSize: number;
  }): Promise<[Stock[], number]> {
    const queryResult = await this.stockRepository.findAndCount({
      where: { name: Like(`%${query.name ?? ''}%`) },
      skip: (query.current - 1) * query.pageSize,
      take: query.pageSize,
    });
    return queryResult;
  }

  async findOne(id: number): Promise<Stock | null> {
    const queryResult = await this.stockRepository.findOne({ where: { id } });
    return queryResult;
  }

  async create(stock: Partial<Stock>): Promise<Stock> {
    const newStock = this.stockRepository.create(stock);
    return await this.stockRepository.save(newStock);
  }

  async update(id: number, stock: Partial<Stock>): Promise<Stock | null> {
    await this.stockRepository.update(id, stock);
    return this.stockRepository.findOne({ where: { id } });
  }

  async remove(id: number): Promise<number> {
    const result = await this.stockRepository.delete(id);
    return result?.affected ?? 0;
  }
}
