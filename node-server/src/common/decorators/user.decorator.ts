import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const User = createParamDecorator(
  (data: string, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    console.log('export const User = createParamDecorator(', user);
    debugger;
    return data ? user?.[data] : 111;
  },
);
