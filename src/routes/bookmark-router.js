const express = require("express");
const logger = require("../../logger");
const BookmarksServices = require("./bookmarks-service");
const bookmarkRouter = express.Router();
const jsonParser = express.json();

bookmarkRouter
  .route("/")
  .get((req, res, next) => {
    BookmarksServices.getAllBookmarks(req.app.get("db"))
      .then((bookmarks) => {
        res.json(bookmarks);
      })
      .catch(next);
  })
  .post(jsonParser, (req, res, next) => {
    const { title, url, description, rating } = req.body;
    const bookmark = { title, url, description, rating };

    if (!title) {
      return res.status(400).json({
        error: { message: `Missing 'title' in request body` },
      });
    }

    if (!url) {
      return res.status(400).json({
        error: { message: `Missing 'url' in request body` },
      });
    }

    if (!rating) {
      return res.status(400).json({
        error: { message: `Missing 'rating' in request body` },
      });
    }

    BookmarksServices.insertBookmarks(req.app.get("db"), bookmark)
      .then((bookmark) => {
        res.status(201).location(`/bookmarks/${bookmark.id}`).json(bookmark);
      })
      .catch(next);
  });

bookmarkRouter
  .route("/bookmarks/:bookmarkId")
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
        res.json(bookmark);
      })
      .catch(next);
  })
  .delete(jsonParser, (req, res) => {
    const { id } = req.params;
    const bookmarkIndex = store.bookmarks.findIndex((bid) => bid.id == id);
    if (bookmarkIndex === -1) {
      logger.error(`Bookmark with id ${id} not found.`);
      return res.status(404).send("Bookmark Not Found!");
    }
    store.bookmarks.splice(bookmarkIndex, 1);
    logger.info(`Bookmark with id ${id} deleted.`);
    res.status(204).end();
  });

module.exports = bookmarkRouter;
