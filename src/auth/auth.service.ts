import { ForbiddenException, Injectable } from '@nestjs/common';
import { AuthDto } from './dto';
import * as argon from 'argon2';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AccessToken } from './auth.types';
import { PrismaService } from '@/prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
  ) {}

  async signup(dto: AuthDto) {
    const hash = await argon.hash(dto.password);

    try {
      const user = await this.prisma.user.create({
        data: {
          email: dto.email,
          hash,
        },
      });
      delete user.hash;
      return user;
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        // "Unique constraint failed on the {constraint}"
        // https://www.prisma.io/docs/reference/api-reference/error-reference
        const UNIQUE_CONSTRAINT = 'P2002';

        if (error.code === UNIQUE_CONSTRAINT) {
          throw new ForbiddenException('Credentials taken');
        }
      }
      throw error;
    }
  }

  async signin(dto: AuthDto): Promise<AccessToken> {
    const user = await this.prisma.user.findUnique({
      where: {
        email: dto.email,
      },
    });

    if (!user) throw new ForbiddenException('Credentials incorrect');

    const passwordMatches = await argon.verify(user.hash, dto.password);

    if (!passwordMatches) throw new ForbiddenException('Credentials incorrect');

    return this.signToken(user.id, user.email);
  }

  async signToken(userId: number, email: string): Promise<AccessToken> {
    const payload = {
      sub: userId,
      email,
    };

    const secret = this.config.get('JWT_SECRET');
    const token = await this.jwt.signAsync(payload, {
      expiresIn: '15m',
      secret,
    });

    return {
      access_token: token,
    };
  }
}
