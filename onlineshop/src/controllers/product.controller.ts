import {Count, CountSchema, Filter, FilterExcludingWhere, IsolationLevel, repository, Where} from '@loopback/repository';
import {post, param, get, getModelSchemaRef, patch, put, del, requestBody, response, RestBindings, Request, Response, HttpErrors} from '@loopback/rest';
import multer from 'multer';
import {Product, User} from '../models';
import {ProductRepository} from '../repositories';
import {inject} from '@loopback/core';
import { uploudFiles } from '../bindings/interfaces/Files.interface';
import { FILE_UPLOAD_SERVICE, STORAGE_DIRECTORY } from '../bindings/keys/fileUploadKeys';
import { FileUploadHandler } from '../bindings/types/fileUploadTypes';
import path from 'path';

import fs from 'fs'
import Ajv from 'ajv';
import ajvErrors from 'ajv-errors';
import addFormats from 'ajv-formats';
import { productSchema } from '../validators/product/schema';



export class ProductController {
  constructor(
    @repository(ProductRepository)
    public productRepository: ProductRepository,
    @inject(FILE_UPLOAD_SERVICE) private handler: FileUploadHandler, // 50%
    @inject(STORAGE_DIRECTORY) private storageDirectory: string,
  ) {}

  private static getFilesAndFields(request: Request) {
    const uploadedFiles = request.files;
    const mapper = (f: globalThis.Express.Multer.File) => ({
      fieldname: f.fieldname,
      originalname: f.originalname,
      encoding: f.encoding,
      mimetype: f.mimetype,
      size: f.size,
    });
    let files: object[] = [];
    if (Array.isArray(uploadedFiles)) {
      files = uploadedFiles.map(mapper);
    } else {
      for (const filename in uploadedFiles) {
        files.push(...uploadedFiles[filename].map(mapper));
      }
    }
    return {files, fields: request.body};
  }
  private validate(fields: any) {
    const ajv = new Ajv({allErrors: true});
    addFormats(ajv);
    ajvErrors(ajv);
    const validate = ajv.compile(productSchema);

    const res =  validate(fields)
    return res
  }

  @post('/products')
  @response(200, {
    description: 'Product model instance',
    content: {'application/json': {schema: getModelSchemaRef(Product)}},
  })
  async create(
    // @inject(AuthenticationBindings.CURRENT_USER) currentUserProfile: any, //??
    @inject(RestBindings.Http.RESPONSE) response: Response, //??
    @requestBody.file()
    request: Request,
  ) {
    // Begin a new transaction.
    // do i need to create it to the db ?
    const transaction =
      await this.productRepository.dataSource.beginTransaction({
        isolationLevel: IsolationLevel.READ_COMMITTED,
        timeout: 3000,
      });

    try {
      const uploudedFiles = await new Promise<uploudFiles>(
        (resolve, reject) => {
          this.handler(request, response, (err: unknown) => {
            if (err) reject(err);
            else {
              resolve(ProductController.getFilesAndFields(request));
            }
          });
        },
      );

      const fields: {title: string; price: string} = Object(
        uploudedFiles.fields,
      );

      const fileData = Object(uploudedFiles.files[0]);
      const image_url = path.resolve(
        this.storageDirectory,
        fileData.originalname,
      );

      if (!this.validate(fields)) {
        // unlink the file
        fs.unlink(image_url, err => {
          if (err) console.log(err);
          else {
            console.log('file deleted');
          }
        });
        throw new HttpErrors.UnprocessableEntity('This is errors in data');
      }

      const createdProduct = await this.productRepository.create({
        title: fields.title,
        price: parseInt(fields.price),
        image: image_url,
        // user_id: parseInt(currentUserProfile[securityId]),
      });

      await transaction.commit();
      return createdProduct;
      
    } catch (err) {
      await transaction.rollback();
    }
  }



 
  @get('/products/count')
  @response(200, {
    description: 'Product model count',
    content: {'application/json': {schema: CountSchema}},
  })
  async count(@param.where(Product) where?: Where<Product>): Promise<Count> {
    return this.productRepository.count(where);
  }

  @get('/products')
  @response(200, {
    description: 'Array of Product model instances',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(Product, {includeRelations: true}),
        },
      },
    },
  })
  async find(@param.filter(Product) filter?: Filter<Product>): Promise<Product[]> {
    return this.productRepository.find(filter);
  }

  @patch('/products')
  @response(200, {
    description: 'Product PATCH success count',
    content: {'application/json': {schema: CountSchema}},
  })
  async updateAll(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Product, {partial: true}),
        },
      },
    })
    product: Product,
    @param.where(Product) where?: Where<Product>,
  ): Promise<Count> {
    return this.productRepository.updateAll(product, where);
  }

  @get('/products/{id}')
  @response(200, {
    description: 'Product model instance',
    content: {
      'application/json': {
        schema: getModelSchemaRef(Product, {includeRelations: true}),
      },
    },
  })
  async findById(
    @param.path.number('id') id: number,
    @param.filter(Product, {exclude: 'where'})
    filter?: FilterExcludingWhere<Product>,
  ): Promise<Product> {
    return this.productRepository.findById(id, filter);
  }

  // try to limit accecss

  @patch('/products/{id}')
  @response(204, {
    description: 'Product PATCH success',
  })
  async updateById(
    @param.path.number('id') id: number,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Product, {partial: true}),
        },
      },
    })
    product: Product,
  ): Promise<void> {
    await this.productRepository.updateById(id, product);
  }

  @put('/products/{id}')
  @response(204, {
    description: 'Product PUT success',
  })
  async replaceById(@param.path.number('id') id: number, @requestBody() product: Product): Promise<void> {
    await this.productRepository.replaceById(id, product);
  }

  @del('/products/{id}')
  @response(204, {
    description: 'Product DELETE success',
  })
  async deleteById(@param.path.number('id') id: number): Promise<void> {
    await this.productRepository.deleteById(id);
  }

  // Get user who owns this product
  @get('/products/{id}/user', {
    responses: {
      '200': {
        description: 'User belonging to Product',
        content: {
          'application/json': {
            schema: {type: 'array', items: getModelSchemaRef(User)},
          },
        },
      },
    },
  })
  async getUser(@param.path.number('id') id: typeof Product.prototype.id): Promise<User> {
    return this.productRepository.user(id);
  }
}


