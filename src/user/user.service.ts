import { PrismaService } from '@/prisma/prisma.service';
import { Injectable } from '@nestjs/common';
import { User } from '@prisma/client';
import { EditUserDto } from './dto';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async editUser(userId: User['id'], dto: EditUserDto) {
    const user = await this.prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        ...dto,
      },
    });

    delete user.hash;

    return user;
  }
}
