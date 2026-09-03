import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { UsersService } from '../services/users.service.js';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) { } 
}
