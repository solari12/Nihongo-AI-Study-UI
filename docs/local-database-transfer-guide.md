# Huong dan chuyen database local sang may khac

Tai lieu nay dung khi can tiep tuc lam project tren may khac hoac can sao luu database PostgreSQL local.

## 1. Khi nao can export database?

Khong phai luc nao cung can export database.

### Truong hop khong can export

Neu du lieu hien tai chu yeu la du lieu seed/demo co san trong code, chi can mang source code sang may khac va chay lai migration + seed.

Can dam bao cac file sau co trong source code:

```text
prisma/schema.prisma
prisma/migrations/
prisma/seed.ts
prisma.config.ts
package.json
pnpm-lock.yaml
```

Tren may moi:

```powershell
corepack pnpm install
corepack pnpm prisma migrate dev
corepack pnpm run db:seed
```

Cach nay phu hop nhat cho giai doan hien tai cua do an.

### Truong hop can export

Can export database neu:

- Da nhap nhieu du lieu thu cong bang pgAdmin.
- Da tao du lieu trong admin panel ma seed script chua co.
- Muon giu nguyen lich su hoc, activity log, chat log hien tai.
- Muon backup dung trang thai database tai mot thoi diem cu the.

## 2. Cau hinh database local mac dinh

Thong tin dang dung:

```text
Host: localhost
Port: 5432
Database: nihongo_ai
User: postgres
```

Bien moi truong trong `.env.local`:

```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/nihongo_ai?schema=public"
```

Luu y:

- Khong commit `.env.local`.
- Tren may khac phai tao lai `.env.local`.
- Neu password co ky tu dac biet nhu `@`, `#`, `%`, `/`, `:`, can URL encode password.

## 3. Cach 1: Chuyen may bang migration va seed

Cach nay nen dung khi chi can du lieu demo co san.

### Buoc 1: Cai PostgreSQL tren may moi

Cai PostgreSQL for Windows, nen dung cung version hoac gan version hien tai:

```text
PostgreSQL 17
```

Kiem tra:

```powershell
psql --version
```

Neu `psql` chua co trong PATH, dung duong dan day du:

```powershell
& "C:\Program Files\PostgreSQL\17\bin\psql.exe" --version
```

### Buoc 2: Tao database

```powershell
& "C:\Program Files\PostgreSQL\17\bin\createdb.exe" -h localhost -U postgres nihongo_ai
```

Neu database da ton tai thi co the bo qua buoc nay.

### Buoc 3: Tao `.env.local`

Trong thu muc project tren may moi, tao `.env.local`:

```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/nihongo_ai?schema=public"
OPENROUTER_API_KEY="YOUR_OPENROUTER_KEY"
OPENROUTER_MODEL="google/gemma-4-31b-it:free"
OPENROUTER_FALLBACK_MODELS="qwen/qwen3-next-80b-a3b-instruct:free,openrouter/free"
OPENROUTER_MODEL_TIMEOUT_MS="30000"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### Buoc 4: Cai dependencies

```powershell
corepack pnpm install
```

### Buoc 5: Chay migration

```powershell
corepack pnpm prisma migrate dev
```

### Buoc 6: Seed du lieu

```powershell
corepack pnpm run db:seed
```

### Buoc 7: Kiem tra

```powershell
corepack pnpm prisma migrate status
corepack pnpm run build
```

Neu build thanh cong la moi truong da san sang.

## 4. Cach 2: Export va restore toan bo database

Cach nay dung khi muon giu nguyen du lieu hien tai trong database local.

### Export tren may hien tai

Chay lenh:

```powershell
& "C:\Program Files\PostgreSQL\17\bin\pg_dump.exe" -h localhost -U postgres -d nihongo_ai -F c -f nihongo_ai.dump
```

Lenh se hoi password cua user `postgres`.

File tao ra:

```text
nihongo_ai.dump
```

Co the copy file nay sang may khac bang USB, cloud drive hoac git ignored artifact.

Khong nen commit file dump vao git neu co du lieu nhay cam.

### Restore tren may moi

Tao database neu chua co:

```powershell
& "C:\Program Files\PostgreSQL\17\bin\createdb.exe" -h localhost -U postgres nihongo_ai
```

Restore:

```powershell
& "C:\Program Files\PostgreSQL\17\bin\pg_restore.exe" -h localhost -U postgres -d nihongo_ai nihongo_ai.dump
```

Neu database da co bang cu va restore bi trung, co the tao database moi hoac drop database cu truoc khi restore.

## 5. Kiem tra du lieu sau khi restore/seed

Chay:

```powershell
& "C:\Program Files\PostgreSQL\17\bin\psql.exe" -h localhost -U postgres -d nihongo_ai -c "select 'users' as table_name, count(*) from users union all select 'vocabulary', count(*) from vocabulary union all select 'grammar', count(*) from grammar union all select 'quiz_questions', count(*) from quiz_questions union all select 'quiz_answers', count(*) from quiz_answers union all select 'knowledge_chunks', count(*) from knowledge_chunks order by table_name;"
```

Du lieu seed hien tai ky vong:

```text
users: 2
auth_sessions: 0 hoac nhieu hon tuy so phien dang nhap
vocabulary: 9
grammar: 8
quiz_questions: 5
quiz_answers: 20
knowledge_chunks: 22
```

## 6. Khuyen nghi cho project hien tai

Trong giai doan nay nen uu tien cach 1:

```text
Migration + seed
```

Ly do:

- Sach hon export/restore.
- De tai tao moi truong tren may khac.
- Phu hop voi du lieu demo dang nam trong source code.
- Tranh mang theo du lieu cu/loi trong database local.

Chi dung cach 2 khi da co du lieu thu cong quan trong ma seed script chua bao gom.
