const express = require("express");
const { v4: uuid } = require("uuid");
const store = require("../../store");

const bookmarkRouter = express.Router();
const bodyParser = express.json();

bookmarkRouter
  .route("/bookmarks")
  .get((req, res) => {
    res.json(store.bookmarks);
  })
  .post((req, res) => {
    const { title, url, description, rating } = req.body;

    if (!title) {
      logger.error(`Title is required`);
      return res.status(400).send("Invalid data");
    }
    if (!isWebUri(url)) {
      logger.error(`Invalid url ${url} supplied.`);
      return res.status(400).send("Invalid data");
    }
    if (!description) {
      logger.error(`Description is required`);
      return res.status(400).send("Invalid data");
    }
    if (!Number(rating) || rating < 0 || rating > 5) {
      logger.error(`Rating must be a number.`);
      return res.status(400).send("Rating must be between 0 and 5.");
    }

    const bookmark = {
      id: uuid(),
      title,
      url,
      description,
      rating,
    };

    store.bookmarks.push(bookmark);
    logger.info(`Bookmark with id ${bookmark.id} has been created.`);

    res
      .status(201)
      .location(`http://localhost:8000/bookmarks/${bookmark.id}`)
      .json(bookmark);
  });

bookmarkRouter
  .route("/bookmarks/:id")
  .get((req, res) => {
    const { id } = req.params;
    const bookmark = store.bookmarks.find((c) => c.id == id);
    if (!bookmark) {
      logger.error(`Bookmark with id ${id} does not exist.`);
      return res.status(404).send("Bookmark Not Found.");
    }
    res.json(bookmark);
  })
  .delete(bodyParser, (req, res) => {
    const { id } = req.params;
    const bookmarkIndex = store.bookmarks.findIndex((bid) => bid.id == id);
    if (bookmarkIndex === -1) {
      logger.error(`Bookmark with id ${id} not found.`);
      return res.status(404).send("Not Found!");
    }
    store.bookmarks.splice(bookmarkIndex, 1);
    logger.info(`Bookmark with id ${id} deleted.`);
    res.status(204).end();
  });

module.exports = bookmarkRouter;
