# Ghi chu trien khai

Tai lieu nay ghi lai cac quyet dinh ky thuat va cac buoc trien khai de phuc vu bao cao do an.

## 1. Tinh trang hien tai

- Ung dung dang la MVP chay duoc bang Next.js App Router.
- Cac man hinh chinh da co: landing page, login/register demo, dashboard, vocabulary, grammar, quiz, history, learning path, placement test, profile, admin va chatbot.
- Cac API route da co: `/api/vocabulary`, `/api/grammar`, `/api/quiz`, `/api/quiz/submit`, `/api/chat`.
- Du lieu hien tai dang dung seed data trong `lib/data/nihongo-study.ts` va luu tien do hoc tap bang `localStorage`.
- Build production da chay thanh cong bang lenh `corepack pnpm run build`.
- Script lint hien tai chua chay duoc vi project co script `lint` nhung chua cai dependency `eslint`.
- Da cai PostgreSQL 17 local tren Windows.
- Da tao database local `nihongo_ai`.
- Da them Prisma, migration dau tien va seed script.
- Da seed du lieu vao PostgreSQL: 2 users, 9 vocabulary, 8 grammar, 5 quiz questions, 20 quiz answers va 22 knowledge chunks.
- Da nang cap authentication tu demo localStorage sang auth that bang PostgreSQL:
  - Password duoc hash bang `scrypt`.
  - Session duoc luu trong bang `auth_sessions`.
  - Cookie session la `httpOnly`, `sameSite=lax`.
  - Layout trong `app/(app)` kiem tra session tren server va redirect ve `/login` neu chua dang nhap.
  - Role `admin`/`learner` lay tu bang `users`.

## 2. Quyet dinh ve database

Ban dau co xem xet cac lua chon:

- Supabase PostgreSQL.
- Neon PostgreSQL qua Vercel Marketplace.
- PostgreSQL tu host tren VPS.
- PostgreSQL cai truc tiep tren Windows.

Ket luan cho giai doan demo do an:

- Chon PostgreSQL local cai truc tiep tren Windows.
- Truoc mat luu embedding bang cot JSONB de migration PostgreSQL local chay on dinh.
- `pgvector` duoc de thanh buoc nang cap rieng sau khi cai duoc extension phu hop voi phien ban PostgreSQL tren Windows.
- Chay ung dung va database truc tiep tren laptop khi demo.

Ly do:

- Khong ton chi phi VPS hoac cloud database.
- Khong phu thuoc gioi han free tier cua Supabase/Neon.
- Van dap ung yeu cau SQL/PostgreSQL trong do an.
- Co the demo embedding va vector search bang `pgvector` sau khi cai extension.
- De kiem soat du lieu demo, tranh rui ro mang/server khi bao ve.

Huong mo rong sau do:

- Frontend/API co the deploy len Vercel.
- Database co the dua len VPS rieng hoac Supabase/Neon.
- Neu dung Prisma va `DATABASE_URL`, viec doi database chi can doi connection string va migration.

## 3. Kien truc demo local

```text
Laptop demo
  -> Next.js app chay local
  -> PostgreSQL cai truc tiep tren Windows
  -> bang knowledge_chunks luu embedding dang JSONB
  -> pgvector extension neu nang cap vector search that
  -> API embedding/LLM ben ngoai neu co mang
  -> fallback answer neu API loi hoac mat mang
```

Database local du kien:

```text
Host: localhost
Port: 5432
Database: nihongo_ai
User: postgres
Password: postgres
```

## 4. Cac bang du kien

Nhom nguoi dung:

```text
users
- id
- full_name
- email
- password_hash
- role
- created_at
- updated_at
```

```text
auth_sessions
- id
- user_id
- token_hash
- expires_at
- created_at
```

Nhom noi dung hoc:

```text
vocabulary
- id
- japanese
- hiragana
- romaji
- vietnamese
- type
- topic
- example_japanese
- example_vietnamese
- created_at
- updated_at
```

```text
grammar
- id
- pattern
- meaning
- structure
- usage_note
- example_japanese
- example_vietnamese
- difficulty
- status
- created_at
- updated_at
```

```text
quiz_questions
- id
- question
- type
- difficulty
- topic
- correct_answer
- explanation
- created_at
- updated_at
```

```text
quiz_answers
- id
- question_id
- answer_key
- answer_text
```

Nhom tien do va hanh vi hoc:

```text
user_vocabulary_progress
- user_id
- vocabulary_id
- status
- last_reviewed_at
- next_review_at
```

```text
quiz_attempts
- id
- user_id
- quiz_type
- score
- total
- percentage
- created_at
```

```text
activity_logs
- id
- user_id
- type
- content
- topic
- result
- score
- duration_minutes
- created_at
```

Nhom chatbot/RAG:

```text
chat_logs
- id
- user_id
- message
- answer
- provider
- sources_json
- created_at
```

```text
knowledge_chunks
- id
- source_type
- source_id
- title
- content
- embedding
- created_at
```

## 5. Embedding va RAG

Muc tieu:

- Tach noi dung vocabulary, grammar va quiz thanh cac knowledge chunk.
- Tao embedding cho moi chunk.
- Luu embedding vao PostgreSQL. Giai doan dau dung JSONB de dam bao cai dat local don gian.
- Khi cai duoc `pgvector`, co the doi cot embedding sang `vector(1536)` va them index vector.
- Khi nguoi dung hoi chatbot, tao embedding cho cau hoi, tim cac chunk gan nghia nhat, dua vao prompt va sinh cau tra loi.

Mo hinh embedding du kien:

```text
text-embedding-3-small
```

Ly do:

- Chi phi thap.
- Du chat luong cho du lieu hoc N5 nho.
- Vector 1536 chieu, phu hop de demo RAG.

Truy van vector search mau:

```sql
select
  id,
  title,
  content,
  1 - (embedding <=> query_embedding) as similarity
from knowledge_chunks
order by embedding <=> query_embedding
limit 5;
```

## 6. Cac buoc can lam tiep

1. Cai PostgreSQL truc tiep tren Windows.
2. Tao database local `nihongo_ai`.
3. Cai Prisma vao project.
4. Tao `prisma/schema.prisma`.
5. Tao migration cho cac bang chinh.
6. Seed du lieu tu `lib/data/nihongo-study.ts` vao PostgreSQL.
7. Thay cac API route doc seed data/localStorage bang truy van database.
8. Luu knowledge chunk va embedding dang JSONB de demo RAG co nguon du lieu.
9. Cai `pgvector` cho PostgreSQL local neu can vector search that.
10. Tao bang `knowledge_chunks` va script generate embedding.
11. Nang cap chatbot tu keyword retrieval sang vector retrieval.
12. Them fallback khi API embedding/LLM loi hoac mat mang.
13. Cap nhat tai lieu bao cao va test plan.

## 7. Ghi chu cai dat moi truong local

Cai PostgreSQL truc tiep tren Windows bang installer chinh thuc hoac package manager.

Thong tin database local du kien:

```text
Host: localhost
Port: 5432
Database: nihongo_ai
User: postgres
Password: postgres
```

Sau khi cai PostgreSQL, can kiem tra:

```powershell
psql --version
```

Neu `psql` chua co trong PATH, them thu muc `bin` cua PostgreSQL vao PATH. Vi du:

```text
C:\Program Files\PostgreSQL\16\bin
```

Bien moi truong ung dung:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/nihongo_ai?schema=public"
```

Lenh da dung trong project:

```powershell
corepack pnpm prisma validate
corepack pnpm prisma migrate status
corepack pnpm prisma generate
corepack pnpm run db:seed
corepack pnpm run build
```

Trang thai hien tai:

```text
Prisma schema valid.
Database schema is up to date.
Seed thanh cong.
Build production thanh cong.
```

Tai khoan seed hien tai:

```text
learner@example.com / password123
admin@example.com / password123
```

## 8. Ghi chu cho bao cao

Doan mo ta co the dua vao bao cao:

```text
Trong pham vi do an, he thong duoc trien khai va demo tren moi truong local. Co so du lieu su dung PostgreSQL cai truc tiep tren Windows de luu tru du lieu nguoi dung, noi dung hoc tap, lich su hoc va du lieu phuc vu chatbot. Embedding co the duoc luu tam bang JSONB trong giai doan MVP de dam bao kha nang cai dat on dinh. Khi can tim kiem ngu nghia chuyen sau cho RAG, he thong co the kich hoat extension pgvector va chuyen cot embedding sang kieu vector. Cach trien khai nay giup he thong van dam bao co co so du lieu quan he that, co kha nang mo rong sang vector search, nhung khong phu thuoc vao gioi han cua cac nen tang cloud mien phi. Khi trien khai thuc te, ung dung co the dua len Vercel va database co the chuyen sang VPS rieng, Supabase hoac Neon ma khong thay doi nhieu ve kien truc.
```
