import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Multi-Tenant Kanban API is running! 🚀';
  }
}
