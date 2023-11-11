import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  PipeTransform,
} from '@nestjs/common'

@Injectable()
export class getBudgetValidationPipe implements PipeTransform<any> {
  async transform(value: any, metadata: ArgumentMetadata) {
    if (metadata.type !== 'query')
      throw new BadRequestException('잘못된 파라미터입니다.')

    const regex = /^\d{4}-(1[0-2]|0[1-9])$/

    if (!regex.test(value)) {
      throw new BadRequestException('유효하지 않은 yearMonth 형식입니다.')
    }

    return value
  }
}
