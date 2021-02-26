require("dotenv").config();
const { expect } = require("chai");
const knex = require("knex");
const supertest = require("supertest");
const app = require("../src/app");
const { makeBookmarksArray } = require("./bookmarks.fixtures");

describe.only("Bookmarks Endpoints", function () {
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
});
