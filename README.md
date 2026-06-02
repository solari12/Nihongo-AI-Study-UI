# Nihongo AI Study UI

Ung dung hoc tieng Nhat co module tu vung, ngu phap, quiz va Reading/TODAII.

## Reading/TODAII

Module Reading cho phep import bai doc tu TODAII, luu vao database, hien thi bai doc trong app, nghe mp3, loc theo JLPT level/category, bat tat furigana, highlight theo trinh do, lam cau hoi doc hieu va luu tu vung/ngu phap de on tap.

Tai lieu bao cao chi tiet:
- `docs/reading-feature-report.md`

## Path chuc nang chinh

- Crawler extension: `extension/todaii-crawler/`
- Import TODAII API: `app/api/admin/todaii-news/import/route.ts`
- Reading API: `app/api/reading/route.ts`
- Reading UI: `app/(app)/reading/reading-page-client.tsx`
- Saved study items API: `app/api/saved-study-items/route.ts`
- Admin delete news article API: `app/api/admin/news-articles/[id]/route.ts`
- Database schema: `prisma/schema.prisma`
- Database migrations: `prisma/migrations/`

## Ghi chu bao cao

- TODAII chi render mot card cau hoi tai mot thoi diem, nen crawler phai bam previous/next de thu thap du cau hoi that.
- Furigana duoc crawl tu DOM `ruby/rt` va co toggle trong Reading UI.
- Audio mp3 duoc crawl tu `audio[src]`, `source[src]` hoac URL `.mp3` trong HTML.
- Level color mac dinh: N1 do, N2 cam, N3 xanh la, N4 xanh duong, N5 tim.
