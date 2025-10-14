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
import { QueryResult } from 'src/utils';

@Controller('product')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Get()
  findAll(): Promise<QueryResult<Product>> {
    return this.productService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<QueryResult<Product | null>> {
    return this.productService.findOne(+id);
  }

  @Post()
  create(@Body() product: Partial<Product>): Promise<Product> {
    return this.productService.create(product);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() product: Partial<Product>,
  ): Promise<QueryResult<Product | null>> {
    return this.productService.update(+id, product);
  }

  @Delete(':id')
  remove(@Param('id') id: string): Promise<QueryResult<string>> {
    return this.productService.remove(+id);
  }
}
