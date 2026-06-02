# Todaii Crawler Extension

This local Chrome extension crawls the currently open TODAII news page and sends it to the Next.js API at `http://localhost:3000/api/admin/todaii-news/import`.

## Setup

1. Add this value to `.env.local`:

```env
TODAII_IMPORT_TOKEN="Tuandaito"
```

2. Run the app:

```bash
pnpm dev
```

3. Open Chrome and go to `chrome://extensions`.
4. Enable `Developer mode`.
5. Click `Load unpacked`.
6. Select this folder: `extension/todaii-crawler`.
7. Open a TODAII article page and click the extension icon.

The API stores the article in `news_articles` and also writes a `todaii-news` chunk into `knowledge_chunks` for RAG retrieval.
