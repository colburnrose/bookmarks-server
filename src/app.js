require("dotenv").config;
const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const helmet = require("helmet");
const { NODE_ENV } = require("./config");

const validateBearerToken = require("./validateBearerToken");
const bookmarkRouter = require("./routes/bookmark-router");

const app = express();
const morganConfiguration = NODE_ENV === "production" ? "tiny" : "common";
// const morganConfiguration = NODE_ENV;
// middleware
app.use(morgan(morganConfiguration));
app.use(helmet());
app.use(cors());
app.use(express.json());

// authorization
// app.use(validateBearerToken);

// routes
app.use("/api/bookmarks", bookmarkRouter);

app.get("/xss", (req, res) => {
  res.cookie("secretToken", "1234567890");
  res.sendFile(__dirname + "/xss-example.html");
});

module.exports = app;
