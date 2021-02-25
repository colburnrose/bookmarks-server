const BookmarksServices = {
  getAllBookmarks(db) {
    return db.select("*").from("bookmarks");
  },
  insertBookmarks(db, bookmark) {
    return db
      .insert(bookmark)
      .into("bookmarks")
      .returning("*")
      .then((rows) => {
        return rows[0];
      });
  },
  getById(db, id) {
    return db("bookmarks").select("*").where({ id }).first();
  },
  deleteBookmark(db, id) {
    return db("bookmarks").where({ id }).delete();
  },
  updateBookmark(db, id, data) {
    return db("bookmarks").where({ id }).update(data);
  },
};

module.exports = BookmarksServices;
