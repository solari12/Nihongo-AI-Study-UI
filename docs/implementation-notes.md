# Ghi chu trien khai

Tai lieu nay ghi lai cac quyet dinh ky thuat va cac buoc trien khai de phuc vu bao cao do an.

## 1. Tinh trang hien tai

- Ung dung dang la MVP chay duoc bang Next.js App Router.
- Cac man hinh chinh da co: landing page, login/register that, dashboard, vocabulary, grammar, quiz, history, learning path, placement test, profile, admin va chatbot.
- Cac API route da co: `/api/vocabulary`, `/api/grammar`, `/api/quiz`, `/api/quiz/submit`, `/api/chat`.
- Du lieu hoc tap, tai khoan, session, tien do, activity va chat log da duoc chuyen sang PostgreSQL; mot so hook van giu fallback localStorage khi API loi.
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
- Da chuyen cac API noi dung hoc sang doc PostgreSQL thong qua Prisma:
  - `GET /api/vocabulary` doc bang `vocabulary`.
  - `GET /api/grammar` doc bang `grammar`.
  - `GET /api/quiz` doc bang `quiz_questions` va `quiz_answers`.
  - `POST /api/quiz/submit` cham diem dua tren dap an trong database.
- Da chuyen `useAdminContent` sang load du lieu ban dau tu cac API tren, nen cac man Vocabulary, Grammar, Quiz va danh sach Admin bat dau doc noi dung tu PostgreSQL thay vi chi doc seed/localStorage.
- Da them Admin CRUD ghi PostgreSQL:
  - `POST/PUT/DELETE /api/vocabulary`
  - `POST/PUT/DELETE /api/grammar`
  - `POST/PUT/DELETE /api/quiz`
  - Cac mutation kiem tra session va role `admin` tren server.
  - Khi them/sua noi dung, bang `knowledge_chunks` duoc tao/cap nhat de phuc vu RAG.
- Da chuyen progress, quiz attempt va activity log sang PostgreSQL:
  - `GET/POST /api/progress` doc/ghi `user_vocabulary_progress` va `quiz_attempts` theo user dang dang nhap.
  - `GET/POST/DELETE /api/activity` doc/ghi/xoa `activity_logs` theo user dang dang nhap.
  - `useStudyProgress` va `useActivityLog` load tu API DB, fallback localStorage neu API loi.
  - Seed script tao progress mau cho user hoc thu nghiem.
- Da nang cap chatbot/RAG sang PostgreSQL:
  - `/api/chat` truy xuat nguon tu bang `knowledge_chunks`.
  - Neu DB khong co nguon phu hop, route fallback ve retriever seed cu.
  - Chat request khong con gui toan bo content tu client.
  - Cau hoi, cau tra loi, provider va source metadata duoc luu vao `chat_logs` theo user dang dang nhap.
- Da tang cuong API protection va xu ly loi client:
  - `/api/chat` va `/api/quiz/submit` yeu cau user dang nhap.
  - Cac API admin mutation da yeu cau role `admin`.
  - Them helper `readJsonResponse` de client khong bi loi `Unexpected end of JSON input` khi response loi/rong.

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
8. UI loading/error polish cho cac man hoc tap va admin.
9. Cai `pgvector` cho PostgreSQL local neu can vector search that.
10. Tao script generate embedding.
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

Kiem tra moi nhat:

```text
TypeScript noEmit thanh cong.
Next production build thanh cong.
```

Cap nhat UI moi nhat:

```text
- Them component hien thi trang thai loading/error dung chung cho du lieu hoc tap.
- Vocabulary, Grammar, Quiz hien thong bao khi dang tai du lieu hoac khi API/DB loi.
- Admin hien loading/error rieng, khoa nut import/export/reset/them moi khi du lieu chua tai xong.
- Admin khoa nut luu/xoa trong luc request dang chay de tranh bam lap.
```

Cap nhat auth moi nhat:

```text
- Bo prefill tai khoan demo va nut chon tai khoan mau tren trang dang nhap.
- Bo thong bao mat khau demo mac dinh tren UI dang nhap.
- Dang ky tao tai khoan that, validate ho ten/email/mat khau va xac nhan mat khau o client.
- API login/register validate input bang Zod, tra loi JSON loi ro rang va khong crash khi body JSON rong/sai.
- Database bat buoc user phai co password_hash, migration da apply tren PostgreSQL local.
- Nut dang xuat trong sidebar da goi API logout that thay vi chi chuyen ve trang chu.
```

Cap nhat da ngon ngu moi nhat:

```text
- Them i18n provider client-side voi 3 ngon ngu: tieng Viet, English va 日本語.
- Da chuyen provider/hook sang thu vien `i18next` va `react-i18next` de quan ly resources va language state on dinh hon.
- Lua chon ngon ngu duoc luu vao localStorage va cap nhat `document.documentElement.lang`.
- Them language switcher vao login, register, header trong app va sidebar.
- Da ap dung dich cho auth flow, header, sidebar/navigation va cac thong diep thao tac chinh.
- Bo sung lop dich DOM toan cuc de phu cac text tinh con sot tren dashboard, vocabulary, grammar, quiz, chatbot, profile, admin va cac man phu.
- Noi dung hoc trong database khong dich tu dong vi do la hoc lieu tieng Nhat/Viet, khong phai nhan UI.
```

Cap nhat onboarding/cold-start moi nhat:

```text
- Ho so hoc tap va placement result duoc scope theo userId de tai khoan moi khong bi dinh du lieu onboarding cua tai khoan cu tren cung trinh duyet.
- Onboarding tinh cold-start point dua tren kinh nghiem, kana level, muc tieu, thoi gian hoc moi ngay va chu de uu tien.
- Man onboarding hien huong dan cho tai khoan moi: tao cold-start profile, lam placement test, sinh lo trinh dau tien.
- Placement test hien lai cold-start point de giai thich vi sao recommendation uu tien bai nen tang.
- Recommendation engine dung cold-start boost khi user moi chua co lich su hoc/activity.
```

Cap nhat dashboard user moi:

```text
- Bo du lieu dashboard hard-code cu nhu weekly minutes, weak topics, recent activities va recommended lessons mau.
- Default progress cua user moi duoc dua ve rong thay vi co san 4 tu da hoc va 2 tu can review.
- Dashboard hien 0/trong voi tai khoan moi va huong dan onboarding -> placement test -> learning path.
- Tong so tu vung/ngu phap van lay tu database content, nhung tien do hoc/quiz/activity lay theo user hien tai.
```

Cap nhat learner profile/cold-start DB:

```text
- Them bang `learner_profiles` luu goal, kana level, kinh nghiem, thoi gian hoc, chu de uu tien, cold-start score/reasons va onboarding status theo user.
- Them bang `placement_results` luu ket qua placement test theo user.
- Them API `/api/learner-profile` de doc/ghi profile va placement bang PostgreSQL.
- `useLearnerProfile` da chuyen sang doc/ghi API DB, localStorage chi con la fallback offline/cache theo userId.
- Migration `20260528010000_add_learner_profile` da apply tren PostgreSQL local.
```

Cap nhat onboarding gate:

```text
- Them `OnboardingGate` boc ben trong app layout de learner moi khong vao thang dashboard/learning path khi chua tao ho so.
- Neu learner chua completed onboarding, cac man hoc chinh se chuyen ve `/onboarding`.
- Neu learner da co ho so nhung chua lam placement test, cac man hoc chinh se chuyen ve `/placement-test`.
- Admin duoc bo qua onboarding gate de van vao duoc man quan tri.
- Onboarding va placement test cho loading state trong luc doc profile tu DB, tranh hien sai du lieu mac dinh truoc khi API tra ve.
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
