require("dotenv").config;
const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const helmet = require("helmet");
const logger = require("../logger");
const { NODE_ENV } = require("./config");

const bookmarkRouter = require("./routes/bookmark-router");

const app = express();
const morganConfiguration = NODE_ENV === "production" ? "tiny" : "common";
// middleware
app.use(morgan(morganConfiguration));
app.use(helmet());
app.use(cors());
app.use(express.json());

// authorization
app.use(function validateBearerToken(req, res, next) {
  const apiToken = process.env.API_TOKEN;
  const authToken = req.get("Authorization");

  if (!authToken || authToken.split(" ")[1] !== apiToken) {
    logger.error(`Unauthorized request to path: ${req.path}`);
    return res.status(401).json({ error: "Unauthorized Request!" });
  }
  next();
});

// routes
app.use(bookmarkRouter);

module.exports = app;
