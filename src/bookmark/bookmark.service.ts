import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Bookmark, User } from '@prisma/client';
import { CreateBookmarkDto, EditBookmarkDto } from './dto';
import { PrismaService } from '@/prisma/prisma.service';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime';

const NOT_FOUND_ERROR_MSG = 'Bookmark not found';
const FORBIDDEN_ERROR_MSG = 'Access denied to bookmark';

@Injectable()
export class BookmarkService {
  constructor(private prisma: PrismaService) {}

  async getBookmarks(userId: User['id']) {
    return await this.prisma.bookmark.findMany({
      where: {
        userId,
      },
    });
  }

  async createBookmark(userId: User['id'], dto: CreateBookmarkDto) {
    try {
      return await this.prisma.bookmark.create({
        data: {
          ...dto,
          userId,
        },
      });
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        // "Unique constraint failed on the {constraint}"
        // https://www.prisma.io/docs/reference/api-reference/error-reference
        const UNIQUE_CONSTRAINT = 'P2002';

        if (error.code === UNIQUE_CONSTRAINT) {
          throw new ForbiddenException('Bookmark already exists');
        }
      }
      throw error;
    }
  }

  async getBookmarkById(userId: User['id'], bookmarkId: Bookmark['id']) {
    return await this.prisma.bookmark
      .findFirstOrThrow({
        where: {
          userId,
          id: bookmarkId,
        },
      })
      .catch(() => {
        throw new NotFoundException(NOT_FOUND_ERROR_MSG);
      });
  }

  async editBookmarkById(
    userId: User['id'],
    bookmarkId: Bookmark['id'],
    dto: EditBookmarkDto,
  ) {
    const bookmark = await this.prisma.bookmark
      .findUniqueOrThrow({
        where: {
          id: bookmarkId,
        },
      })
      .catch(() => {
        throw new NotFoundException(NOT_FOUND_ERROR_MSG);
      });

    if (bookmark.userId !== userId)
      throw new ForbiddenException(FORBIDDEN_ERROR_MSG);

    return this.prisma.bookmark.update({
      where: {
        id: bookmarkId,
      },
      data: { ...dto },
    });
  }

  async deleteBookmarkById(userId: User['id'], bookmarkId: Bookmark['id']) {
    const bookmark = await this.prisma.bookmark
      .findUniqueOrThrow({
        where: {
          id: bookmarkId,
        },
      })
      .catch(() => {
        throw new NotFoundException(NOT_FOUND_ERROR_MSG);
      });

    if (bookmark.userId !== userId)
      throw new ForbiddenException(FORBIDDEN_ERROR_MSG);

    await this.prisma.bookmark.delete({
      where: {
        id: bookmarkId,
      },
    });
  }
}
