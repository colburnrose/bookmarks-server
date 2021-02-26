module.exports = {
  PORT: process.env.PORT || 8000,
  NODE_ENV: process.env.NODE_ENV || "development",
  API_TOKEN: process.env.API_TOKEN || "super-secret-api-tokens",
  DB_URL:
    process.env.DB_URL || "postgresql://colburnsanders@localhost/bookmarks",
  TEST_DB_URL:
    process.env.TEST_DB_URL ||
    "postgresql://colburnsanders@localhost/bookmarks-test",
};
