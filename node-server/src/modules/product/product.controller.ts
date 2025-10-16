import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
} from '@nestjs/common';
import { ProductService } from './product.service';
import { Product } from './product.entity';
import { QueryResult, ResponseResult } from 'src/utils';

@Controller('product')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Get()
  async queryPage(): Promise<QueryResult<Product>> {
    const queryResult = await this.productService.queryPage();
    return ResponseResult.page<Product>(queryResult);
  }

  @Get(':id')
  async findOne(
    @Param('id') id: string,
  ): Promise<QueryResult<Product | string>> {
    const queryResult = await this.productService.findOne(+id);
    if (queryResult) {
      return ResponseResult.success<Product>(queryResult);
    } else {
      return ResponseResult.error('未找到该商品');
    }
  }

  @Post()
  create(@Body() product: Partial<Product>): Promise<Product> {
    return this.productService.create(product);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() product: Partial<Product>,
  ): Promise<QueryResult<Product | string>> {
    const queryResult = await this.productService.update(+id, product);
    if (queryResult) {
      return ResponseResult.success<Product>(queryResult);
    } else {
      return ResponseResult.error('更新失败');
    }
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<QueryResult<string>> {
    const queryResult = await this.productService.remove(+id);
    if (queryResult) {
      return ResponseResult.successMessage<string>('删除成功');
    } else {
      return ResponseResult.error('删除失败，数据不存在');
    }
  }
}
