import {Count, CountSchema, Filter, FilterExcludingWhere, repository, Where} from '@loopback/repository';
import {post, param, get, getModelSchemaRef, patch, put, del, requestBody, response, HttpErrors} from '@loopback/rest';
import {User} from '../models';
import {RoleRepository, UserRepository} from '../repositories';
import {inject} from '@loopback/core';
import {PasswordHasher, PasswordHasherBindings} from '../services/hash.password.bcryptjs';
import {Credentials, JWT_SECRET, secured, SecuredType} from '../bindings/authentications/jwt.auth';
import {promisify} from 'util';
import {sign} from 'jsonwebtoken';
import {roles, rolesId} from '../bindings/interfaces/Types.interface';
import {AuthenticationBindings} from '@loopback/authentication';
const signAsync = promisify(sign);

import {securityId, UserProfile, SecurityBindings} from '@loopback/security';

export class UserController {
  constructor(
    @inject(SecurityBindings.USER, {optional: true}) public user: UserProfile,
    
    @repository(UserRepository) public userRepository: UserRepository,
    @repository(RoleRepository) public roleRepository: RoleRepository,
    @inject(PasswordHasherBindings.PASSWORD_HASHER) public passwordHasher: PasswordHasher,
  ) {}

  @post('/users/signup')
  @response(200, {
    description: 'User model instance',
    content: {'application/json': {schema: getModelSchemaRef(User)}},
  })
  async signup(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(User, {
            title: 'NewUser',
            exclude: ['id'],
          }),
        },
      },
    })
    user: Omit<User, 'id'>,
  ): Promise<User> {
    // - check if user exist
    const userExist = await this.userRepository.findOne({
      where: {email: user.email},
    });
    if (userExist) throw new HttpErrors.Conflict('Email already exist');

    const hashPassword = await this.passwordHasher.hashPassword(user.password);
    user['password'] = hashPassword;
    user['roleId'] = rolesId.userRole;

    return this.userRepository.create(user);
  }

  @post('/users/login')
  @response(200, {
    description: 'User Info ',
    content: {'application/json': {schema: getModelSchemaRef(User)}},
  })
  async login(@requestBody() credentials: Credentials) {
    if (!credentials.email || !credentials.password) throw new HttpErrors.BadRequest('Missing Email or Password');

    const user = await this.userRepository.findOne({where: {email: credentials.email}});
    if (!user) throw new HttpErrors.Unauthorized('Invalid email or password');

    const correctPassword = await this.passwordHasher.comparePassword(credentials.password, user.password);
    if (!correctPassword) throw new HttpErrors.Unauthorized('Invalid password');

    // create a token
    const tolenPayload = {email: credentials.email};
    const token = await signAsync(tolenPayload, JWT_SECRET);

    const {id, email, roleId} = user;
    let roles: any;
    roles = roleId ? await this.roleRepository.findById(roleId) : [];
    if (roles.permissions) roles.permissions = JSON.parse(roles.permissions);

    return {
      token,
      id: id as number,
      email,
      roles,
    };
  }

  // User profile
  @secured(SecuredType.HAS_ANY_ROLE, [roles.user])
  @get('/users/profile', {
    responses: {
      '200': {
        description: 'The current user profile',
        content: {
          'application/json': {
            schema: {
              type: 'array',
              items: getModelSchemaRef(User, {includeRelations: true}),
            },
          },
        },
      },
    },
  })
  async getProfile(
    @inject(AuthenticationBindings.CURRENT_USER)
    currentUserProfile: UserProfile,
  ): Promise<UserProfile> {
    //lets get user id from token and set it as it
    currentUserProfile.id = currentUserProfile[securityId];
    //and delete security id
    delete currentUserProfile?.securityId;
    //return user data
    return currentUserProfile;
  }

  @get('/users/count')
  @response(200, {
    description: 'User model count',
    content: {'application/json': {schema: CountSchema}},
  })
  async count(@param.where(User) where?: Where<User>): Promise<Count> {
    return this.userRepository.count(where);
  }

  @get('/users')
  @response(200, {
    description: 'Array of User model instances',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(User, {includeRelations: true}),
        },
      },
    },
  })
  async find(@param.filter(User) filter?: Filter<User>): Promise<User[]> {
    return this.userRepository.find(filter);
  }

  @patch('/users')
  @response(200, {
    description: 'User PATCH success count',
    content: {'application/json': {schema: CountSchema}},
  })
  async updateAll(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(User, {partial: true}),
        },
      },
    })
    user: User,
    @param.where(User) where?: Where<User>,
  ): Promise<Count> {
    return this.userRepository.updateAll(user, where);
  }

  @get('/users/{id}')
  @response(200, {
    description: 'User model instance',
    content: {
      'application/json': {
        schema: getModelSchemaRef(User, {includeRelations: true}),
      },
    },
  })
  async findById(@param.path.number('id') id: number, @param.filter(User, {exclude: 'where'}) filter?: FilterExcludingWhere<User>): Promise<User> {
    return this.userRepository.findById(id, filter);
  }

  @patch('/users/{id}')
  @response(204, {
    description: 'User PATCH success',
  })
  async updateById(
    @param.path.number('id') id: number,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(User, {partial: true}),
        },
      },
    })
    user: User,
  ): Promise<void> {
    await this.userRepository.updateById(id, user);
  }

  @put('/users/{id}')
  @response(204, {
    description: 'User PUT success',
  })
  async replaceById(@param.path.number('id') id: number, @requestBody() user: User): Promise<void> {
    await this.userRepository.replaceById(id, user);
  }

  @del('/users/{id}')
  @response(204, {
    description: 'User DELETE success',
  })
  async deleteById(@param.path.number('id') id: number): Promise<void> {
    await this.userRepository.deleteById(id);
  }
}
