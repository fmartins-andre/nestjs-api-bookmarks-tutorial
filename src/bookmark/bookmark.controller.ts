import { JwtGuard } from '@/auth/guard';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { BookmarkService } from './bookmark.service';
import { GetUser } from '@/auth/decorator';
import { CreateBookmarkDto, EditBookmarkDto } from './dto';
import { Bookmark, User } from '@prisma/client';

@UseGuards(JwtGuard)
@Controller('bookmarks')
export class BookmarkController {
  constructor(private bookmarkService: BookmarkService) {}

  @Get()
  getBookmarks(@GetUser('id') userId: User['id']) {
    return this.bookmarkService.getBookmarks(userId);
  }

  @Post()
  createBookmark(
    @GetUser('id') userId: User['id'],
    @Body() dto: CreateBookmarkDto,
  ) {
    return this.bookmarkService.createBookmark(userId, dto);
  }

  @Get(':id')
  getBookmarkById(
    @GetUser('id') userId: User['id'],
    @Param('id', ParseIntPipe) bookmarkId: Bookmark['id'],
  ) {
    return this.bookmarkService.getBookmarkById(userId, bookmarkId);
  }

  @Patch(':id')
  editBookmarkById(
    @GetUser('id') userId: User['id'],
    @Param('id', ParseIntPipe) bookmarkId: Bookmark['id'],
    @Body() dto: EditBookmarkDto,
  ) {
    return this.bookmarkService.editBookmarkById(userId, bookmarkId, dto);
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':id')
  deleteBookmarkById(
    @GetUser('id') userId: User['id'],
    @Param('id', ParseIntPipe) bookmarkId: Bookmark['id'],
  ) {
    return this.bookmarkService.deleteBookmarkById(userId, bookmarkId);
  }
}
