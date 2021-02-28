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
    context(`Given no bookmarks`, () => {
      it(`responds with 200 and an empty list`, () => {
        return supertest(app).get("/bookmarks").expect(200, []);
      });
    });

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
    context(`Given no bookmarks`, () => {
      it(`responds with 404`, () => {
        const bookmarkId = 123456;
        return supertest(app)
          .get(`/articles/${bookmarkId}`)
          .expect(404, { error: { message: `Bookmark doesn't exist` } });
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
          .get(`/bookmarks/${bookmarkId}`)
          .expect(200, bookmark);
      });
    });
  });

  describe(`POST /bookmarks`, () => {
    it(`creates an bookmark, responding with 201 and the and the new bookmark`, function () {
      this.retries(3);
      const bookmark = {
        title: "New Bookmark",
        url: "https://www.bookmarks.com",
        rating: 4,
      };

      return supertest(app)
        .post("/bookmarks")
        .send(bookmark)
        .expect(201)
        .expect((res) => {
          expect(res.body.title).to.eql(bookmark.title);
          expect(res.body.url).to.eql(bookmark.url);
          expect(res.body.rating).to.eql(bookmark.rating);
          expect(res.headers.location).to.eql(`/bookmarks/${res.body.id}`);
        })
        .then((res) => {
          supertest(app).get(`/bookmarks/${res.body.id}`).expect(res.body);
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
          .post("/bookmarks")
          .send(bookmark)
          .expect(400, {
            error: { message: `Missing '${field}' in request body` },
          });
      });
    });
  });
});
