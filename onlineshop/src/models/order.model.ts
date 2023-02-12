import {belongsTo, Entity, model, property} from '@loopback/repository';
import {User, UserWithRelations} from './user.model';

@model({
  settings: {
    foreignKeys: {
      fk_todo_todoListId: {
        name: 'fk_order_userId',
        entity: 'User',
        entityKey: 'id',
        foreignKey: 'userId',
      },
    },
  },
})


export class Order extends Entity {
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
  status: string;

  @property({
    type: 'number',
  })
  total?: number;

  @property({
    type: 'string',
    required: true,
  })
  shippingAddress: string;

  @property({
    type: 'array',
    itemType: 'object',
  })
  products?: object[];

  @belongsTo(() => User)
  userId: number;

  constructor(data?: Partial<Order>) {
    super(data);
  }
}

export interface OrderRelations {
  // describe navigational properties here
  user?: UserWithRelations;
}

export type OrderWithRelations = Order & OrderRelations;
