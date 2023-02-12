import {belongsTo, Entity, model, property} from '@loopback/repository';
import { User, UserWithRelations } from './user.model';

@model({
  settings: {
    foreignKeys: {
      fk_todo_todoListId: {
        name: 'fk_product_userId',
        entity: 'User',
        entityKey: 'id',
        foreignKey: 'userId',
      },
    },
  },
})

export class Product extends Entity {
  @property({
    type: 'number',
    id: true,
    generated: true,
  })
  id?: number;

  @property({
    type: 'string',
    required: true,
  })
  title: string;

  @property({
    type: 'string',
  })
  image?: string;

  @property({
    type: 'number',
    required: true,
  })
  price: number;


  @belongsTo(() => User)
  userId: number;

  constructor(data?: Partial<Product>) {
    super(data);
  }
}

export interface ProductRelations {
  // describe navigational properties here
  user?: UserWithRelations;
}



export type ProductWithRelations = Product & ProductRelations;



