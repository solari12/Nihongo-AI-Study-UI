# Reading/TODAII Feature Report

## Muc tieu

Module Reading dung de import bai doc song ngu tu TODAII, luu vao PostgreSQL, hien thi bai doc trong app, phat audio, loc theo trinh do/chu de, hien furigana, highlight theo JLPT level, lam cau hoi doc hieu va luu tu vung/ngu phap de on tap.

## Chuc nang va path

### 1. TODAII crawler extension

Path:
- `extension/todaii-crawler/manifest.json`
- `extension/todaii-crawler/background.js`
- `extension/todaii-crawler/content.js`

Chuc nang:
- Chay tren trang `japanese.todaiinews.com`.
- Lay title, source URL, provider, ngay dang, anh dai dien.
- Crawl `level` N1-N5.
- Crawl `category`/chu de TODAII neu DOM co thong tin.
- Crawl article text tieng Nhat.
- Crawl `articleBlocks` tu DOM `ruby/rt` de render furigana.
- Crawl audio mp3 tu `audio[src]`, `audio source[src]` hoac URL `.mp3` trong raw HTML.
- Crawl cau hoi doc hieu tu card visible TODAII:
  - Doc counter dang `x/total`.
  - Doc cau hoi hien tai va 4 dap an A/B/C/D.
  - Tu bam previous/next trong carousel de gom du bo cau hoi that.
  - Sap xep lai theo thu tu 1..total.
- Crawl highlight tu DOM TODAII de lay text, level va type neu co.
- Crawl danh sach vocabulary va grammar.
- Gui payload ve API import bang Chrome runtime message.

Note bao cao:
- `content.js` duoc boc trong IIFE de tranh loi redeclare khi bam extension nhieu lan tren cung tab.
- Cau hoi TODAII chi render mot card tai mot thoi diem, nen crawler phai bam prev/next, khong duoc parse body text tong.

### 2. Import API

Path:
- `app/api/admin/todaii-news/import/route.ts`

Chuc nang:
- Nhan payload tu extension.
- Bao ve bang header `x-import-token` so voi `TODAII_IMPORT_TOKEN`.
- Validate payload bang Zod.
- Upsert `NewsArticle` theo `sourceUrl`.
- Luu raw payload de fallback/cai tien parser sau nay.
- Upsert `KnowledgeChunk` source `todaii-news` de chatbot/RAG truy xuat.

Payload chinh:
- `sourceUrl`
- `provider`
- `title`
- `level`
- `category`
- `articleText`
- `articleBlocks`
- `imageUrl`
- `audioUrl`
- `publishedAt`
- `questions`
- `levelStats`
- `highlights`
- `vocabulary`
- `grammar`
- `rawText`
- `rawHtml`

### 3. Reading API

Path:
- `app/api/reading/route.ts`

Chuc nang:
- Tra danh sach bai doc tu `news_articles`.
- Fallback article text/questions/audio/category/furigana tu `rawPayload` neu can.
- Normalize `levelStats`.
- Parse lai questions tu `rawText` neu saved questions it hon ket qua parser.
- Tra data cho Reading page.

### 4. Reading UI

Path:
- `app/(app)/reading/page.tsx`
- `app/(app)/reading/reading-page-client.tsx`

Chuc nang:
- Sidebar danh sach bai doc.
- Tim kiem bai doc.
- Loc theo trinh do N1-N5.
- Loc theo chu de/category.
- Hien anh, title, source TODAII, ngay dang.
- Audio player cho mp3 TODAII.
- Nut bat/tat Furigana.
- Render `ruby/rt` tu `articleBlocks`.
- Highlight text theo DOM TODAII neu co, fallback theo vocabulary/grammar.
- Mau level mac dinh:
  - N1: do
  - N2: cam
  - N3: xanh la
  - N4: xanh duong
  - N5: tim
- Hien tat ca cau hoi doc hieu theo danh sach, moi cau co 4 dap an.
- Luu vocabulary/grammar vao saved study items.
- Admin co nut xoa bai doc.

### 5. Saved study items

Path:
- `app/api/saved-study-items/route.ts`
- `prisma/migrations/20260601001000_add_saved_study_items/migration.sql`
- `prisma/schema.prisma` model `SavedStudyItem`

Chuc nang:
- User luu tu vung/ngu phap tu bai doc.
- Upsert theo unique key `[userId, type, itemKey]`.
- Tra danh sach item da luu de UI disable nut luu.

### 6. Admin delete article

Path:
- `app/api/admin/news-articles/[id]/route.ts`
- `app/(app)/reading/reading-page-client.tsx`

Chuc nang:
- Chi admin moi xoa duoc.
- Check role bang `requireAdminUser()`.
- Xoa `NewsArticle`.
- Xoa `KnowledgeChunk` lien quan theo source URL/id.
- UI confirm truoc khi xoa.

## Database

Path:
- `prisma/schema.prisma`
- `prisma/migrations/20260601000000_add_news_articles/migration.sql`
- `prisma/migrations/20260601001000_add_saved_study_items/migration.sql`
- `prisma/migrations/20260602001000_add_news_article_level_stats/migration.sql`
- `prisma/migrations/20260602002000_add_news_article_audio_url/migration.sql`
- `prisma/migrations/20260602003000_add_news_article_category/migration.sql`

Bang/fields chinh:
- `news_articles`
  - `source_url`
  - `provider`
  - `title`
  - `level`
  - `category`
  - `article_text`
  - `image_url`
  - `audio_url`
  - `published_at`
  - `questions`
  - `level_stats`
  - `vocabulary`
  - `grammar`
  - `raw_payload`
- `saved_study_items`
  - `user_id`
  - `type`
  - `source_type`
  - `source_id`
  - `item_key`
  - `title`
  - `reading`
  - `level`
  - `meaning`
  - `note`
  - `example`
  - `raw_payload`

## Cach test nhanh

1. Chay app:
   - `npm run dev`
2. Reload extension:
   - Vao `chrome://extensions`
   - Reload `todaii-crawler`
3. Mo mot bai TODAII.
4. Bam extension de import.
5. Vao `/reading`:
   - Kiem tra bai moi xuat hien.
   - Kiem tra audio player.
   - Kiem tra filter level/category.
   - Kiem tra furigana toggle.
   - Kiem tra highlight.
   - Kiem tra so cau hoi dung voi TODAII.
6. Dang nhap admin:
   - Kiem tra nut xoa.
   - Xoa bai va refresh danh sach.

## Lenh verify da chay

- `pnpm.cmd db:generate`
- `pnpm.cmd exec prisma db execute --file prisma\migrations\20260602002000_add_news_article_audio_url\migration.sql`
- `pnpm.cmd exec prisma db execute --file prisma\migrations\20260602003000_add_news_article_category\migration.sql`
- `node --check extension\todaii-crawler\content.js`
- `pnpm.cmd build`

Note:
- `pnpm build` pass.
- `npx tsc --noEmit` hien con fail o mot so loi cu ngoai module Reading: JSON typing trong saved-study-items, `lib/i18n.tsx` locale `en`, va script import grammar.

## Ruu ro va viec can theo doi

- TODAII co the doi DOM class/structure, lam crawler can cap nhat selector.
- Question carousel chi render mot cau, crawler dang bam prev/next. Neu TODAII doi button DOM, can cap nhat `questionNavigationButtons()`.
- Furigana phu thuoc DOM `ruby/rt`; neu TODAII render bang span custom, can bo sung parser.
- Audio dang phat truc tiep tu `audio.mazii.net`, chua download file mp3 ve local.
- Import API dung token rieng, khong phai session admin. Nen de demo extension local thi du, con production nen doi sang auth/session hoac token manh hon.

## Goi y noi dung bao cao

- Neu trinh bay luong du lieu:
  1. TODAII page
  2. Chrome extension crawler
  3. Import API
  4. PostgreSQL `news_articles`
  5. Reading API
  6. Reading UI
  7. Saved study items / RAG knowledge chunks
- Neu trinh bay diem ky thuat:
  - DOM crawler co xu ly carousel cau hoi.
  - Raw payload duoc luu de debug/fallback.
  - Furigana render bang `ruby/rt`.
  - Highlight theo JLPT level va mau mac dinh.
  - Admin delete co xoa knowledge chunk lien quan.
