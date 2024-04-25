import { ConfigService } from '@nestjs/config'
import { TypeOrmModuleOptions } from '@nestjs/typeorm'
import { SnakeNamingStrategy } from 'typeorm-naming-strategies'

export const getORMConfig = async (
  configService: ConfigService,
): Promise<TypeOrmModuleOptions> => {
  return {
    type: 'postgres',
    host: configService.get<string>('DB_HOSTNAME') || 'localhost',
    port: parseInt(configService.get<string>('DB_PORT')) || 5432,
    username: configService.get<string>('DB_USERNAME') || 'postgres',
    password: configService.get<string>('DB_PASSWORD') || '0000',
    database: configService.get<string>('DB_DATABASE') || 'postgres',
    ssl: false, // SSL 활성화
    entities: [__dirname + '/../**/*.entity.{js,ts}'],
    synchronize: configService.get<boolean>('DB_SYNCHRONIZE') || false,
    namingStrategy: new SnakeNamingStrategy(),
    // dropSchema: true,
    // logging: true,
  }
}

export const getTestOrmConfig = async (): Promise<TypeOrmModuleOptions> => {
  return {
    type: 'postgres',
    host: 'localhost',
    port: 5432,
    username: 'postgres',
    password: '0000',
    database: 'test_db',
    entities: [__dirname + '/../**/*.entity.{js,ts}'],
    synchronize: true,
    namingStrategy: new SnakeNamingStrategy(),
  }
}
