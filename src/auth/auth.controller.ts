import { Body, Controller, HttpCode, Post, Res } from '@nestjs/common';
import { CreateUserDto, LoginDto } from './dto/auth.dto.js';
import { AuthService } from './auth.service.js';
import { type Response } from 'express';
import { config } from 'dotenv';

config()
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) { }

  @Post('register')
  @HttpCode(201)
  async register(@Body() user: CreateUserDto) {
    return this.authService.create(user);
  }
  
  @Post('login')
  @HttpCode(200)
  async login(@Body() data: LoginDto, @Res({ passthrough: true }) response: Response) {
    
    const accessToken = await this.authService.login(data);
    
    response.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000
    })
    
    return {
          success: true,
          message: 'Login successful',
        };
  }
}
