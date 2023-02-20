import {belongsTo, Entity, hasMany, model, property} from '@loopback/repository';
import {Order, OrderWithRelations} from './order.model';
import {Product, ProductWithRelations} from './product.model';
import { Role } from './role.model';

@model()
export class User extends Entity {
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
  email: string;

  @property({
    type: 'string',
    required: true,
  })
  password: string;

  @hasMany(() => Product)
  products: Product[];

  @hasMany(() => Order)
  orders: Order[];

  @belongsTo(() => Role, {name: 'roles'})
  roleId: number;

  constructor(data?: Partial<User>) {
    super(data);
  }
}

export interface UserRelations {
  // describe navigational properties here
  orders?: OrderWithRelations[];

  product?: ProductWithRelations[];
}

export type UserWithRelations = User & UserRelations;
