require("dotenv").config();
const { expect } = require("chai");
const knex = require("knex");
const supertest = require("supertest");
const app = require("../src/app");
const {
  makeBookmarksArray,
  makeMaliciousBookmark,
} = require("./bookmarks.fixtures");

describe("Bookmarks Endpoints", function () {
  let db;

  before("make knex instance", () => {
    db = knex({
      client: "pg",
      connection: process.env.TEST_DB_URL,
    });
    app.set("db", db);
  });

  after("disconnect from db", () => db.destroy());

  before("clean the table", () => db("bookmarks").truncate());

  afterEach("cleanup", () => db("bookmarks").truncate());

  describe(`Unauthorized Requests.`, () => {
    const testBookmarks = makeBookmarksArray();

    beforeEach("insert bookmarks", () => {
      return db.into("bookmarks").insert(testBookmarks);
    });

    it(`responds with 401 Unauthorized for GET /bookmarks`, () => {
      return supertest(app)
        .get("/api/bookmarks")
        .expect(401, { error: "Unauthorized Request!" });
    });

    it(`responds with 401 Unauthorized for POST /bookmarks`, () => {
      return supertest(app)
        .post("/api/bookmarks")
        .send({ title: "test-title", url: "http://some.thing.com", rating: 1 })
        .expect(401, { error: "Unauthorized Request!" });
    });

    it(`responds with 401 Unauthorized for GET /bookmarks/:id`, () => {
      const secondBookmark = testBookmarks[1];
      return supertest(app)
        .get(`/api/bookmarks/${secondBookmark.id}`)
        .expect(401, { error: "Unauthorized Request!" });
    });

    it(`responds with 401 Unauthorized for DELETE /bookmarks/:id`, () => {
      const aBookmark = testBookmarks[1];
      return supertest(app)
        .delete(`/api/bookmarks/${aBookmark.id}`)
        .expect(401, { error: "Unauthorized Request!" });
    });
  });

  describe(`GET: /api/bookmarks`, () => {
    context(`Given no bookmarks`, () => {
      it(`responds with 200 and an empty list`, () => {
        return supertest(app)
          .get("/api/bookmarks")
          .set("Authorization", `Bearer ${process.env.API_TOKEN}`)
          .expect(200, []);
      });
    });

    context("Given there are Bookmarks saved in the database", () => {
      const bookmarks = makeBookmarksArray();

      beforeEach("insert bookmarks", () => {
        return db.into("bookmarks").insert(bookmarks);
      });

      it("gets the bookmarks from the store", () => {
        return supertest(app)
          .get("/api/bookmarks")
          .set("Authorization", `Bearer ${process.env.API_TOKEN}`)
          .expect(200, bookmarks);
      });
    });

    context("Given an  XSS attack bookmark", () => {
      const { maliciousBookmark, expectedBookmark } = makeMaliciousBookmark();
      beforeEach("insert malicious bookmark", () => {
        return db.into("bookmarks").insert([maliciousBookmark]);
      });

      it("removes XSS attack content", () => {
        return supertest(app)
          .get(`/api/bookmarks`)
          .set("Authorization", `Bearer ${process.env.API_TOKEN}`)
          .expect(200)
          .expect((res) => {
            expect(res.body[0].title).to.eql(expectedBookmark.title);
            expect(res.body[0].description).to.eql(
              expectedBookmark.description
            );
          });
      });
    });
  });

  describe(`GET /bookmarks/:bookmarkId`, () => {
    context(`Given no bookmarks`, () => {
      it(`responds with 404`, () => {
        const bookmarkId = 123456;
        return supertest(app)
          .get(`/api/bookmarks/${bookmarkId}`)
          .set("Authorization", `Bearer ${process.env.API_TOKEN}`)
          .expect(404, { error: { message: `Bookmark Not Found` } });
      });
    });
    context("Given there are Bookmarks saved in the database", () => {
      const bookmarks = makeBookmarksArray();

      beforeEach("insert bookmarks", () => {
        return db.into("bookmarks").insert(bookmarks);
      });

      it("responds with 200 and the specified bookmarks", () => {
        const bookmarkId = 2;
        const bookmark = bookmarks[bookmarkId - 1];
        return supertest(app)
          .get(`/api/bookmarks/${bookmarkId}`)
          .set("Authorization", `Bearer ${process.env.API_TOKEN}`)
          .expect(200, bookmark);
      });
    });
    context(`Given an XSS attack bookmark`, () => {
      const { maliciousBookmark, expectedBookmark } = makeMaliciousBookmark();

      beforeEach("insert malicious bookmark", () => {
        return db.into("bookmarks").insert([maliciousBookmark]);
      });

      it("removes XSS attack content", () => {
        return supertest(app)
          .get(`/api/bookmarks/${maliciousBookmark.id}`)
          .set("Authorization", `Bearer ${process.env.API_TOKEN}`)
          .expect(200)
          .expect((res) => {
            expect(res.body.title).to.eql(expectedBookmark.title);
            expect(res.body.description).to.eql(expectedBookmark.description);
          });
      });
    });
  });

  describe.only(`POST /api/bookmarks`, () => {
    it(`creates an bookmark, responding with 201 and the and the new bookmark`, function () {
      this.retries(3);
      const bookmark = {
        title: "New Bookmark",
        url: "https://www.bookmarks.com",
        rating: 4,
      };

      return supertest(app)
        .post("/api/bookmarks")
        .send(bookmark)
        .set("Authorization", `Bearer ${process.env.API_TOKEN}`)
        .expect(201)
        .expect((res) => {
          expect(res.body.title).to.eql(bookmark.title);
          expect(res.body.url).to.eql(bookmark.url);
          expect(res.body.rating).to.eql(bookmark.rating);
          expect(res.body).to.have.property("id");
          expect(res.headers.location).to.eql(`/api/bookmarks/${res.body.id}`);
        })
        .then((res) => {
          supertest(app).get(`/api/bookmarks/${res.body.id}`).expect(res.body);
        });
    });
    const requiredFields = ["title", "url", "rating"];

    requiredFields.forEach((field) => {
      const bookmark = {
        title: "Test title",
        url: "https://www.bookmarks.com",
        rating: 4,
      };

      it(`responds with 400 and an error message when the '${field}' is missing`, () => {
        delete bookmark[field];
        return supertest(app)
          .post("/api/bookmarks")
          .send(bookmark)
          .expect(400, {
            error: { message: `Missing '${field}' in the request body` },
          });
      });

      it("removes XSS attack content from response", () => {
        const { maliciousBookmark, expectedBookmark } = makeMaliciousBookmark();

        return supertest(app)
          .post(`/api/bookmarks`)
          .send(maliciousBookmark)
          .expect(201)
          .expect((res) => {
            expect(res.body.title).to.eql(expectedBookmark.title);
            expect(res.body.url).to.eql(expectedBookmark.url);
            expect(res.body.rating).to.eql(expectedBookmark.rating);
          });
      });
    });
  });

  describe.only(`DELETE /api/bookmarks/:bookmarkId`, () => {
    context("Given no bookmarks", () => {
      it(`responds 404 when bookmarks does not exist`, () => {
        const bookmarkId = 123456;
        return supertest(app)
          .delete(`/api/bookmarks/${bookmarkId}`)
          .set("Authorization", `Bearer ${process.env.API_TOKEN}`)
          .expect(404, {
            error: { message: `Bookmark Not Found` },
          });
      });
    });

    context("Given there are no bookmarks", () => {
      const testBookmarks = makeBookmarksArray();
      beforeEach("insert bookmarks", () => {
        return db.into("bookmarks").insert(testBookmarks);
      });

      it(`responds 204 and removes the bookmark`, () => {
        const idToRemove = 2;
        const expectedBookmark = testBookmarks.filter(
          (bookmark) => bookmark.id !== idToRemove
        );
        return supertest(app)
          .delete(`/api/bookmarks/${idToRemove}`)
          .set("Authorization", `Bearer ${process.env.API_TOKEN}`)
          .expect(204)
          .then((res) => {
            supertest(app).get(`/api/bookmarks`).expect(expectedBookmark);
          });
      });
    });
  });

  describe.only(`PATCH /api/bookmarks/:bookmarkId`, () => {
    context(`Given no bookmarks`, () => {
      const bookmarkId = 123456;
      return supertest(app)
        .patch(`/api/bookmarks/${bookmarkId}`)
        .expect(404, { error: { message: `Article does not exist` } });
    });

    context("Given there are bookmarks in the database", () => {
      const testBookmarks = makeBookmarksArray();
      beforeEach("insert bookmarks", () => {
        return db.into("bookmarks").insert(testBookmarks);
      });

      it("responds with 204 and updates the bookmark", () => {
        const idToUpdate = 2;
        const updateBookmark = {
          title: "updated bookmark",
          url: "https://www.google.com",
          rating: 4,
        };
        const expectedBookmark = {
          ...testBookmarks[idToUpdate - 1],
          ...updateBookmark,
        };
        return supertest(app)
          .patch(`/api/bookmarks/${idToUpdate}`)
          .send(updateBookmark)
          .expect(204)
          .then((res) => {
            supertest(app)
              .get(`/api/articles/${idToUpdate}`)
              .expect(expectedBookmark);
          });
      });

      it(`responds with 400 when no required fields supplied`, () => {
        const idToUpdate = 2;
        return supertest(app)
          .patch(`/api/bookmarks/${idToUpdate}`)
          .send({ irrelevantField: "foo" })
          .expect(400, {
            error: {
              message: `Request body must contain either 'title', 'url', or 'rating'`,
            },
          });
      });

      it(`responds with 204 when updating only a subset of fields`, () => {
        const idToUpdate = 2;
        const updateBookmark = {
          rating: 4,
        };
        const expectedBookmark = {
          ...testBookmarks[idToUpdate - 1],
          ...updateBookmark,
        };

        return supertest(app)
          .patch(`/api/bookmarks/${idToUpdate}`)
          .send({
            ...updateBookmark,
            fieldToIgnore: "should not be in GET response",
          })
          .expect(204)
          .then((res) => {
            supertest(app)
              .get(`/api/bookmarks/${idToUpdate}`)
              .expect(expectedBookmark);
          });
      });
    });
  });
});
