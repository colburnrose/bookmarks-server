require("dotenv").config();
const { expect } = require("chai");
const knex = require("knex");
const supertest = require("supertest");
const app = require("../src/app");

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

  context("Given there are Bookmarks saved in the database", () => {
    const bookmarks = [
      {
        id: 1,
        title: "First Bookmark",
        url: "https://www.google.com",
        description: "Some bookmark description",
        rating: 3,
      },
      {
        id: 2,
        title: "Second Bookmark",
        url: "https://www.google.com",
        description: "Some bookmark description",
        rating: 4,
      },
      {
        id: 3,
        title: "Third Bookmark",
        url: "https://www.google.com",
        description: "Some bookmark description",
        rating: 1,
      },
      {
        id: 4,
        title: "Fourth Bookmark",
        url: "https://www.google.com",
        description: "Some bookmark description",
        rating: 5,
      },
      {
        id: 5,
        title: "Fifth Bookmark",
        url: "https://www.google.com",
        description: "Some bookmark description",
        rating: 4,
      },
    ];

    beforeEach("insert bookmarks", () => {
      return db.into("bookmarks").insert(bookmarks);
    });

    it("GET /bookmarks responds with 200 and all of the bookmarks", () => {
      return supertest(app).get("/bookmarks").expect(200);
      //TODO: add more assertions about the body
    });
  });
});
