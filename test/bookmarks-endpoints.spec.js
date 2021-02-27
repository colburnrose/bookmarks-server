require("dotenv").config();
const { expect } = require("chai");
const knex = require("knex");
const supertest = require("supertest");
const app = require("../src/app");
const { makeBookmarksArray } = require("./bookmarks.fixtures");

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

  describe(`GET: /bookmarks`, () => {
    context("Given there are Bookmarks saved in the database", () => {
      const bookmarks = makeBookmarksArray();

      beforeEach("insert bookmarks", () => {
        return db.into("bookmarks").insert(bookmarks);
      });

      it("responds with 200 and all of the bookmarks", () => {
        return supertest(app).get("/bookmarks").expect(200, bookmarks);
      });
    });
  });

  describe(`GET /bookmarks/:bookmarkId`, () => {
    context("Given there are Bookmarks saved in the database", () => {
      const bookmarks = makeBookmarksArray();

      beforeEach("insert bookmarks", () => {
        return db.into("bookmarks").insert(bookmarks);
      });

      it("GET /bookmarks/:bookmarkId responds with 200 and the specific bookmark", () => {
        const bookmarkId = 2;
        const bookmark = bookmarks[bookmarkId - 1];
        return supertest(app)
          .get(`/bookmarks/${bookmarkId}`)
          .expect(200, bookmark);
      });
    });
  });

  describe(`GET /articles`, () => {
    context(`Given no bookmarks`, () => {
      it(`responds with 200 and an empty list`, () => {
        return supertest(app).get("/bookmarks").expect(200, []);
      });
    });
  });

  describe(`GET /bookmarks/:bookmarkId`, () => {
    context(`Given no bookmarks`, () => {
      it(`responds with 404`, () => {
        const bookmarkId = 123456;
        return supertest(app)
          .get(`/bookmarks/${bookmarkId}`)
          .expect(404, { error: { message: `Bookmark does not exist` } });
      });
    });
  });

  describe(`POST /bookmarks`, () => {
    it(`creates an bookmark, responding with 201 and the and the new bookmark`, function () {
      return supertest(app)
        .post("/bookmarks")
        .send({
          title: "New Bookmark",
          url: "https://www.bookmarks.com",
          description: "Test new bookmark content",
          rating: 4,
        })
        .expect(201);
    });
  });

  describe(`POST /bookmarks`, () => {
    it(`creates an bookmark, responding with 201 and the and the new bookmark`, function () {
      const bookmark = {
        title: "New Bookmark",
        url: "https://www.bookmarks.com",
        description: "Test new bookmark content",
        rating: 4,
      };

      return supertest(app)
        .post("/bookmarks")
        .send(bookmark)
        .expect(201)
        .expect((res) => {
          expect(res.body.title).to.eql(bookmark.title);
          expect(res.body.url).to.eql(bookmark.url);
          expect(res.body.description).to.eql(bookmark.description);
          expect(res.body.rating).to.eql(bookmark.rating);
          expect(res.headers.location).to.eql(`/bookmarks/${res.body.id}`);
        })
        .then((postReq) => {
          supertest(app)
            .get(`/bookmarks/${postReq.body.id}`)
            .expect(postReq.body);
        });
    });
  });
});
