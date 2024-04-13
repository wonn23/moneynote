import { CustomRepository } from 'src/common/decorator/typeorm-ex.decorator'
import { Repository } from 'typeorm'
import { Category } from './entities/category.entity'

@CustomRepository(Category)
export class CategoryRepository extends Repository<Category> {}
