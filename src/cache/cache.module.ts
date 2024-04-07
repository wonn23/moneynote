import { Module, Global } from '@nestjs/common'
import * as redisStore from 'cache-manager-ioredis'
import { CacheModule } from '@nestjs/cache-manager'
import { ConfigService } from '@nestjs/config'
import { CacheProvider } from './cache.provider'

@Global()
@Module({
  imports: [
    CacheModule.registerAsync({
      useFactory: async (configService: ConfigService) => ({
        store: redisStore,
        host: configService.get('REDIS_HOST', 'localhost'),
        port: +configService.get('REDIS_PORT', '6379'),
        password: configService.get('REDIS_PASSWORD', '0000'),
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [...CacheProvider],
  exports: [...CacheProvider],
})
export class RedisCacheModule {}
