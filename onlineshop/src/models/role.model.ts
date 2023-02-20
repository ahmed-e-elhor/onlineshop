import {Entity, model, property} from '@loopback/repository';

@model()
export class Role extends Entity {
  @property({
    type: 'number',
    id: true,
    generated: true,
    precision: 10,
    scale: 0
  })
  id?: number;

  @property({
    type: 'string',
    required: true,
    length: 512
  })
  name_ar: string;

  @property({
    type: 'string',
    required: true,
    length: 512,
  })
  name_en: string;

  @property({
    type: 'string',
    length: 512,
  })
  description_ar: string;

  @property({
    type: 'string',
    length: 512,
  })
  description_en: string;


  //text type
  @property({
    type: 'string',
    default: "[]",
    length: 1200,
  })
  permissions: string;

  @property({
    type: 'number',
    default: 0,
    precision: 3,
    scale: 0,
  })
  mainRole: number;

  @property({
    type: 'number',
    default: 0,
    precision: 3,
    scale: 0,
  })
  adminRole: number;


  constructor(data?: Partial<Role>) {
    super(data);
  }
}

export interface RoleRelations {
  // describe navigational properties here
}

export type RoleWithRelations = Role & RoleRelations;
