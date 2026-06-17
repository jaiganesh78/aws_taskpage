import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface CurrentUserDto {
  id: string;
  role: 'core' | 'crew';
  name: string;
}

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): CurrentUserDto => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
