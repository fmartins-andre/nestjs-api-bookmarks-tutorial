import { Test } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { HttpStatus, INestApplication, ValidationPipe } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import * as pactum from 'pactum';
import { AuthDto } from '@/auth/dto';
import { EditUserDto } from '@/user/dto';
import { CreateBookmarkDto, EditBookmarkDto } from '@/bookmark/dto';

describe('App e2e', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
      }),
    );

    await app.init();
    await app.listen(3333);

    prisma = app.get(PrismaService);
    await prisma.cleanDb();
    pactum.request.setBaseUrl('http://localhost:3333');
  });

  afterAll(async () => {
    app.close();
  });

  describe('Auth', () => {
    const payload: AuthDto = {
      email: 'fmartins.andre@gmail.com',
      password: '123',
    };

    describe('Sign up', () => {
      it('Should throw if email is empty', () => {
        return pactum
          .spec()
          .post('/auth/signup')
          .withBody({ password: payload.password })
          .expectStatus(HttpStatus.BAD_REQUEST);
      });

      it('Should throw if password is empty', () => {
        return pactum
          .spec()
          .post('/auth/signup')
          .withBody({ email: payload.email })
          .expectStatus(HttpStatus.BAD_REQUEST);
      });

      it('Should sign up', () => {
        return pactum
          .spec()
          .post('/auth/signup')
          .withBody(payload)
          .expectStatus(HttpStatus.CREATED);
      });
    });

    describe('Sign in', () => {
      it('Should sign in', () => {
        return pactum
          .spec()
          .post('/auth/signin')
          .withBody(payload)
          .expectStatus(HttpStatus.OK)
          .stores('accessToken', 'access_token');
      });
    });
  });

  describe('User', () => {
    describe('Get me', () => {
      it('Should get current user', () => {
        return pactum
          .spec()
          .get('/users/me')
          .withHeaders({ Authorization: 'Bearer $S{accessToken}' })
          .expectStatus(HttpStatus.OK);
      });
    });
    describe('Edit user', () => {
      it('Should edit user', () => {
        const payload: EditUserDto = {
          firstName: 'André',
          lastName: 'Martins',
        };

        return pactum
          .spec()
          .patch('/users')
          .withHeaders({ Authorization: 'Bearer $S{accessToken}' })
          .withBody(payload)
          .expectStatus(HttpStatus.OK)
          .expectBodyContains(payload.lastName)
          .expectBodyContains(payload.firstName);
      });
    });
  });

  describe('Bookmarks', () => {
    describe('Get empty bookmarks', () => {
      it('Should get no bookmarks', () => {
        return pactum
          .spec()
          .get('/bookmarks')
          .withHeaders({ Authorization: 'Bearer $S{accessToken}' })
          .expectStatus(HttpStatus.OK)
          .expectBody([]);
      });
    });

    describe('Create bookmark', () => {
      const dto: CreateBookmarkDto = {
        title: 'First bookmark',
        link: 'https://youtu.be/GHTA143_b-s',
      };

      it('Should create bookmark', () => {
        return pactum
          .spec()
          .post('/bookmarks')
          .withHeaders({ Authorization: 'Bearer $S{accessToken}' })
          .withBody(dto)
          .expectStatus(HttpStatus.CREATED)
          .stores('bookmarkId', 'id');
      });
    });

    describe('Get bookmarks', () => {
      it('Should get bookmarks', () => {
        return pactum
          .spec()
          .get('/bookmarks')
          .withHeaders({ Authorization: 'Bearer $S{accessToken}' })
          .expectStatus(HttpStatus.OK)
          .expectJsonLength(1);
      });
    });

    describe('Get bookmark by id', () => {
      it('Should return 404 if no bookmark was found by id', () => {
        return pactum
          .spec()
          .get('/bookmarks/{id}')
          .withHeaders({ Authorization: 'Bearer $S{accessToken}' })
          .withPathParams('id', '$S{bookmarkId}999')
          .expectStatus(HttpStatus.NOT_FOUND);
      });

      it('Should get bookmark by id', () => {
        return pactum
          .spec()
          .get('/bookmarks/{id}')
          .withHeaders({ Authorization: 'Bearer $S{accessToken}' })
          .withPathParams('id', '$S{bookmarkId}')
          .expectStatus(HttpStatus.OK)
          .expectBodyContains('$S{bookmarkId}');
      });
    });

    describe('Edit bookmark by id', () => {
      it('Should return 404 trying to edit a bookmark with an invalid id', () => {
        return pactum
          .spec()
          .patch('/bookmarks/{id}')
          .withHeaders({ Authorization: 'Bearer $S{accessToken}' })
          .withPathParams('id', '$S{bookmarkId}999')
          .expectStatus(HttpStatus.NOT_FOUND);
      });

      it('BUG: Should return 400 if any given value is null', () => {
        const dto: EditBookmarkDto = {
          title: null,
          description: null,
          link: null,
        };
        const dtoKeys = Object.keys(dto);

        return pactum
          .spec()
          .patch('/bookmarks/{id}')
          .withHeaders({ Authorization: 'Bearer $S{accessToken}' })
          .withPathParams('id', '$S{bookmarkId}')
          .withBody(dto)
          .expectStatus(HttpStatus.BAD_REQUEST)
          .expectBodyContains(dtoKeys[0])
          .expectBodyContains(dtoKeys[1])
          .expectBodyContains(dtoKeys[2]);
      });

      it('Should edit bookmark by id', () => {
        const dto: EditBookmarkDto = {
          title: 'Edit bookmark test title',
          description: 'Edit bookmark test description',
        };

        return pactum
          .spec()
          .patch('/bookmarks/{id}')
          .withHeaders({ Authorization: 'Bearer $S{accessToken}' })
          .withPathParams('id', '$S{bookmarkId}')
          .withBody(dto)
          .expectStatus(HttpStatus.OK)
          .expectBodyContains(dto.title)
          .expectBodyContains(dto.description);
      });
    });
    describe('Delete bookmark by id', () => {
      it('Should receive 404 trying to delete a bookmark with an invalid id', () => {
        return pactum
          .spec()
          .delete('/bookmarks/{id}')
          .withHeaders({ Authorization: 'Bearer $S{accessToken}' })
          .withPathParams('id', '$S{bookmarkId}999')
          .expectStatus(HttpStatus.NOT_FOUND);
      });

      it('Should delete bookmark by id', () => {
        return pactum
          .spec()
          .delete('/bookmarks/{id}')
          .withHeaders({ Authorization: 'Bearer $S{accessToken}' })
          .withPathParams('id', '$S{bookmarkId}')
          .expectStatus(HttpStatus.NO_CONTENT);
      });

      it('Should get no bookmarks', () => {
        return pactum
          .spec()
          .get('/bookmarks')
          .withHeaders({ Authorization: 'Bearer $S{accessToken}' })
          .expectStatus(HttpStatus.OK)
          .expectBody([]);
      });
    });
  });
});
