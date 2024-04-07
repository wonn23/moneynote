import { ICACHE_SERVICE } from 'src/common/utils/constants'
import { CacheService } from './cache.service'

export const CacheProvider = [
  {
    provide: ICACHE_SERVICE,
    useClass: CacheService,
  },
]
