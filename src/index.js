import { extractUrlsAndTitles } from "./convertToBookmarks";

extractUrlsAndTitles(
  "data/raw/browser_sessions.json",
  "data/transformed/bookmarks.html"
);
