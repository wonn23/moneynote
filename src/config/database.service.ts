import { DataSource } from 'typeorm'
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common'
import { InjectDataSource } from '@nestjs/typeorm'

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  constructor(@InjectDataSource() private dataSource: DataSource) {}

  async onModuleInit() {
    if (!this.dataSource.isInitialized) {
      await this.dataSource.initialize()
    }
  }

  async onModuleDestroy() {
    if (this.dataSource.isInitialized) {
      await this.dataSource.destroy()
    }
  }
}
