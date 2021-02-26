require("dotenv").config;
const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const helmet = require("helmet");
const { NODE_ENV } = require("./config");

const validateBearerToken = require("./validateBearerToken");
// const bookmarkRouter = require("./routes/bookmark-router");
const BookmarksServices = require("./services/bookmarks-service");

const app = express();
const morganConfiguration = NODE_ENV === "production" ? "tiny" : "common";
// middleware
app.use(morgan(morganConfiguration));
app.use(helmet());
app.use(cors());
app.use(express.json());

// authorization
// app.use(validateBearerToken);

// routes
// app.use(bookmarkRouter);

// GET: Return a list of books
app.get("/bookmarks", (req, res, next) => {
  const knexInstance = req.app.get("db");
  BookmarksServices.getAllBookmarks(knexInstance)
    .then((bookmarks) => {
      res.json(bookmarks);
    })
    .catch(next);
});

app.get("/bookmarks/:bookmarkId", (req, res, next) => {
  const knexInstance = req.app.get("db");
  BookmarksServices.getById(knexInstance, req.params.bookmarkId)
    .then((bookmark) => {
      if (!bookmark) {
        return res.status(404).json({
          error: { message: `Bookmark does not exist` },
        });
      }
      res.json(bookmark);
    })
    .catch(next);
});

module.exports = app;
