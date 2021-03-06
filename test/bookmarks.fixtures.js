function makeBookmarksArray() {
  return [
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
}

function makeMaliciousBookmark() {
  const maliciousBookmark = {
    id: 911,
    title: 'Naughty naughty very naughty <script>alert("xss");</script>',
    url: "https://www.hackers.com",
    description: `Bad image <img src="https://url.to.file.which/does-not.exist" onerror="alert(document.cookie);">. But not <strong>all</strong> bad.`,
    rating: 1,
  };
  const expectedBookmark = {
    ...maliciousBookmark,
    title:
      'Naughty naughty very naughty &lt;script&gt;alert("xss");&lt;/script&gt;',
    description: `Bad image <img src="https://url.to.file.which/does-not.exist">. But not <strong>all</strong> bad.`,
  };
  return {
    maliciousBookmark,
    expectedBookmark,
  };
}

module.exports = {
  makeBookmarksArray,
  makeMaliciousBookmark,
};
