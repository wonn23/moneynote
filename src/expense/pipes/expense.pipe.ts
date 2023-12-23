import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  BadRequestException,
} from '@nestjs/common'

@Injectable()
export class ExpenseValidationPipe implements PipeTransform<any> {
  private isValidDate(date: string): boolean {
    return /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(date)
  }

  transform(value: any, metadata: ArgumentMetadata) {
    const date =
      value.date === undefined || '' ? new Date().toString() : value.date

    if (!this.isValidDate(date)) {
      throw new BadRequestException(`날짜를 확인해 주세요.`)
    }

    return value
  }
}
