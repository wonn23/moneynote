import { SetMetadata } from '@nestjs/common'

export const TYPEORM_EX_CUSTOM_REPOSITORY = 'TYPEORM_EX_CUSTOM_REPOSITORY'

type Constructor<T> = new (...args: any[]) => T

export function CustomRepository<T>(entity: Constructor<T>): ClassDecorator {
  return SetMetadata(TYPEORM_EX_CUSTOM_REPOSITORY, entity)
}
