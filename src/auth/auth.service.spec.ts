import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service.js';
import { UnauthorizedException } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { User } from '../users/schemas/user.schema.js';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { vi } from 'vitest';

describe('AuthService', () => {
  let service: AuthService;
  let mockUserModel: any;
  let mockJwtService: any;

  beforeEach(async () => {
    mockUserModel = {
      findOne: vi.fn(),
      create: vi.fn(),
    };
    mockJwtService = {
      sign: vi.fn().mockReturnValue('mock-jwt-token'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getModelToken(User.name),
          useValue: mockUserModel,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('login verification', () => {
    it('should throw UnauthorizedException when password is incorrect', async () => {
      const hashedPassword = await bcrypt.hash('correctPassword123', 10);
      mockUserModel.findOne.mockResolvedValue({
        _id: '507f1f77bcf86cd799439011',
        email: 'test@example.com',
        password: hashedPassword,
        role: 'member',
      });

      await expect(
        service.login({ email: 'test@example.com', password: 'wrongPassword456' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when email does not exist', async () => {
      mockUserModel.findOne.mockResolvedValue(null);

      await expect(
        service.login({ email: 'nonexistent@example.com', password: 'somePassword' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should successfully log in and return token and user when credentials match', async () => {
      const hashedPassword = await bcrypt.hash('correctPassword123', 10);
      mockUserModel.findOne.mockResolvedValue({
        _id: '507f1f77bcf86cd799439011',
        email: 'test@example.com',
        name: 'Test User',
        password: hashedPassword,
        role: 'member',
        organization_id: 'org123',
      });

      const result = await service.login({ email: 'test@example.com', password: 'correctPassword123' });
      expect(result.token).toBe('mock-jwt-token');
      expect(result.user.email).toBe('test@example.com');
      expect(result.user.name).toBe('Test User');
    });
  });
});
