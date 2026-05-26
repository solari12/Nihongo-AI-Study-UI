# Hệ khuyến nghị lộ trình học

## 1. Mục tiêu

Hệ khuyến nghị trong Nihongo AI Study có nhiệm vụ đề xuất nội dung học tiếp theo dựa trên hành vi và kết quả học tập của người dùng.

Mục tiêu chính:

- Cá nhân hóa lộ trình học.
- Ưu tiên nội dung người học cần ôn.
- Gợi ý quiz khi điểm thấp.
- Giải thích được lý do mỗi gợi ý.

## 2. Dữ liệu đầu vào

Hệ khuyến nghị sử dụng các dữ liệu sau:

- Danh sách từ đã học.
- Danh sách từ cần ôn.
- Lịch sử quiz.
- Điểm quiz gần nhất.
- Điểm quiz trung bình.
- Activity log: học từ, ôn tập, làm quiz.
- Số ngày từ lần học gần nhất.

Các dữ liệu này được quản lý trong:

```text
hooks/use-study-progress.ts
hooks/use-activity-log.ts
hooks/use-admin-content.ts
```

## 3. Thuật toán sử dụng

### 3.1. Bayesian Knowledge Tracing

Bayesian Knowledge Tracing (BKT) được dùng để ước lượng khả năng người học đã nắm một kiến thức dựa trên kết quả quiz.

Các tham số MVP:

```text
priorMastery = 0.35
learnRate = 0.18
slip = 0.10
guess = 0.25
```

Ý nghĩa:

- priorMastery: xác suất ban đầu người học đã nắm kiến thức.
- learnRate: xác suất học được sau một lần tương tác.
- slip: xác suất trả lời sai dù đã biết.
- guess: xác suất trả lời đúng nhờ đoán.

Nếu mức mastery ước lượng thấp hơn ngưỡng, hệ thống ưu tiên gợi ý quiz hoặc ôn tập.

### 3.2. SM-2 / Spaced Repetition

SM-2 là thuật toán lặp lại ngắt quãng được dùng trong các hệ thống học ghi nhớ.

Trong MVP, ý tưởng SM-2 được áp dụng bằng cách:

- Nếu từ được đưa vào danh sách review, hệ thống tăng độ ưu tiên ôn tập.
- Nếu đã lâu không học, hệ thống tăng priority cho phiên học ngắn.
- Nội dung cần ôn được xếp trước nội dung mới khi review load cao.

### 3.3. Explanation

Mỗi recommendation có trường explanation:

```ts
{
  method: "BKT+SM2",
  factors: [
    { label: "Số từ cần ôn", contribution: 30 },
    { label: "Khoảng cách từ lần học gần nhất", contribution: 16 }
  ]
}
```

Cách này giúp hệ thống giải thích được vì sao một bài học được đề xuất.

## 4. Output

Mỗi gợi ý có cấu trúc:

```ts
{
  id: string
  type: "vocabulary" | "grammar" | "quiz" | "review"
  title: string
  reason: string
  priority: number
  estimatedTime: string
  targetUrl: string
  explanation: {
    method: "BKT+SM2"
    factors: { label: string; contribution: number }[]
  }
}
```

## 5. Các rule chính

### Rule 1: Ưu tiên ôn tập

Nếu có từ trong danh sách review:

```text
priority = 45 + recencyBoost + reviewBoost
```

### Rule 2: Ưu tiên quiz khi mastery thấp

Nếu BKT mastery thấp hơn 0.65:

```text
priority = 55 + masteryGap
```

### Rule 3: Gợi ý từ mới

Nếu còn từ chưa học:

```text
priority = 35 + vocabularyGap
```

### Rule 4: Gợi ý ngữ pháp tiếp theo

Nếu còn mẫu ngữ pháp chưa hoàn thành:

```text
priority = 30 + grammarGap
```

### Rule 5: Duy trì thói quen học

Nếu chưa có hoạt động gần đây:

```text
priority = 40 + inactivityBoost
```

## 6. Hiển thị trên UI

Recommendation được dùng ở:

- Dashboard: bài học đề xuất hôm nay.
- Learning Path: timeline học tập cá nhân hóa.

## 7. Đánh giá

Có thể đánh giá hệ khuyến nghị theo:

- Tính phù hợp của gợi ý.
- Khả năng phản ứng với điểm quiz thấp.
- Khả năng ưu tiên từ cần ôn.
- Khả năng giải thích lý do gợi ý.

## 8. Hướng nâng cấp

- Lưu dữ liệu học tập vào database.
- Tính mastery theo từng topic thay vì toàn bộ quiz.
- Dùng collaborative filtering nếu có nhiều người dùng.
- Kết hợp kết quả chatbot để phát hiện chủ đề người học quan tâm.
- Tối ưu tham số BKT bằng dữ liệu thực tế.
