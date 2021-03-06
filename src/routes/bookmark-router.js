const express = require("express");
const BookmarksServices = require("./bookmarks-service");
const bookmarkRouter = express.Router();
const jsonParser = express.json();
const xss = require("xss");
const path = require("path");

const serializeBookmark = (bookmark) => ({
  id: bookmark.id,
  title: xss(bookmark.title),
  url: bookmark.url,
  description: xss(bookmark.description),
  rating: Number(bookmark.rating),
});

bookmarkRouter
  .route("/")
  .get((req, res, next) => {
    BookmarksServices.getAllBookmarks(req.app.get("db"))
      .then((bookmarks) => {
        res.json(bookmarks.map(serializeBookmark));
      })
      .catch(next);
  })
  .post(jsonParser, (req, res, next) => {
    const { title, url, rating } = req.body;
    const bookmark = { title, url, rating };

    for (const [key, value] of Object.entries(bookmark)) {
      if (value == null) {
        return res.status(400).send({
          error: { message: `Missing '${key}' in the request body` },
        });
      }
    }

    BookmarksServices.insertBookmarks(req.app.get("db"), bookmark)
      .then((bookmark) => {
        res
          .status(201)
          .location(path.posix.join(req.originalUrl + `/${bookmark.id}`))
          .json(serializeBookmark(bookmark));
      })
      .catch(next);
  });

bookmarkRouter
  .route("/:bookmarkId")
  .get((req, res, next) => {
    const id = req.params.bookmarkId;
    const knexInstance = req.app.get("db");
    BookmarksServices.getById(knexInstance, id)
      .then((bookmark) => {
        if (!bookmark) {
          return res.status(404).json({
            error: { message: `Bookmark Not Found` },
          });
        }
        res.json(serializeBookmark(bookmark));
      })
      .catch(next);
  })
  .delete((req, res, next) => {
    BookmarksServices.deleteBookmark(req.app.get("db"), req.params.bookmarkId)
      .then(() => {
        res.status(204).end();
      })
      .catch(next);
  })
  .patch(jsonParser, (req, res, next) => {
    const db = req.app.get("db");
    const { title, url, rating } = req.body;
    const bookmarkToUpdate = { title, url, rating };

    const numberOfValues = Object.values(bookmarkToUpdate).filter(Boolean)
      .length;
    if (numberOfValues === 0) {
      return res.status(400).json({
        error: {
          message: `Request body must contain either 'title', 'url', or 'rating'`,
        },
      });
    }
    BookmarksServices.updateBookmark(
      db,
      req.params.bookmarkId,
      bookmarkToUpdate
    )
      .then((rowsAffected) => {
        res.status(204).end();
      })
      .catch(next);
  });

module.exports = bookmarkRouter;
