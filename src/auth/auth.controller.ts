import {
 Body,
 Controller,
 Get,
 HttpCode,
 Optional,
 Patch,
 Post,
 Req,
 Res,
 UseGuards,
} from '@nestjs/common';
import { CreateUserDto, LoginDto } from './dto/auth.dto.js';
import { AuthService } from './auth.service.js';
import { type Request, type Response } from 'express';
import { config } from 'dotenv';
import { UserRole } from '../users/enums/users.enum.js';
import { JwtAuthGuard } from './guards/jwt-auth.guard.js';

config();

@Controller('auth')
export class AuthController {
 constructor(@Optional() private readonly authService?: AuthService) {}

 @Post('register')
 @HttpCode(201)
 async register(@Body() user: CreateUserDto) {
   return this.authService!.create(user);
 }

 @Post('login')
 @HttpCode(200)
 async login(
   @Body() data: LoginDto,
   @Res({ passthrough: true }) response: Response,
 ) {
   const accessToken = await this.authService!.login(data);

   response.cookie('accessToken', accessToken, {
     httpOnly: true,
     secure: process.env.NODE_ENV === 'production',
     sameSite: 'strict',
     maxAge: 24 * 60 * 60 * 1000,
   });

   return {
     success: true,
     message: 'Login successful',
     token: accessToken,
   };
 }

 @Post('logout')
 @HttpCode(200)
 @UseGuards(JwtAuthGuard)
 async logout(
   @Res({ passthrough: true }) response: Response,
   @Req() request: Request,
 ) {
   response.clearCookie('accessToken');
   return {
     success: true,
     message: 'Logout successful',
     user: (request as any).user ?? null,
   };
 }

 @Get('me')
 @UseGuards(JwtAuthGuard)
 async me(@Req() request: Request) {
   const user = (request as any).user;
   return {
     success: true,
     user,
   };
 }

 @Patch()
 async updateRole() {
   return this.authService!.updateRole(UserRole.ADMIN);
 }
}
