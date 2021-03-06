const express = require("express");
const { isWebUri } = require("valid-url");
const logger = require("../../logger");
const BookmarksServices = require("./bookmarks-service");
const bookmarkRouter = express.Router();
const jsonParser = express.json();
const xss = require("xss");

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
          .location(`/bookmarks/${bookmark.id}`)
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
  });

module.exports = bookmarkRouter;
