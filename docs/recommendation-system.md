# Hệ Khuyến Nghị Lộ Trình Học

## Mục tiêu

Recommendation trong Nihongo AI Study đề xuất nội dung học tiếp theo dựa trên hồ sơ người học, kết quả placement test, tiến độ từ vựng, lịch sử quiz và activity log.

Mỗi đề xuất có:

- `type`: vocabulary, grammar, quiz hoặc review.
- `priority`: điểm ưu tiên 0-100.
- `reason`: lý do hiển thị cho người học.
- `explanation`: các yếu tố đóng góp theo mô hình BKT+SM2.

## Thuật toán hiện tại

Hệ thống dùng rule-based recommendation có giải thích:

- BKT ước lượng mức nắm kiến thức từ điểm quiz.
- SM-2 ở mức MVP ưu tiên các từ nằm trong danh sách review và các phiên học ngắn khi người học lâu không hoạt động.
- Cold-start dùng onboarding và placement test để đề xuất bước đầu.
- Nội dung tiếp theo lấy từ từ vựng/ngữ pháp chưa học hoặc chưa hoàn thành.

## Scenario đánh giá

| Scenario | Dữ liệu đầu vào | Gợi ý mong đợi |
|---|---|---|
| User chưa onboarding | Không có `LearnerProfile.completedOnboarding` | Ưu tiên tạo hồ sơ học tập |
| Đã onboarding nhưng chưa placement | Có profile, chưa có placement | Ưu tiên làm kiểm tra đầu vào |
| Placement yếu kana | `recommendedStart = kana-basics` | Gợi ý kana/từ vựng nền tảng |
| Có từ cần ôn | `reviewVocabularyIds.length > 0` | Gợi ý ôn tập từ vựng |
| Quiz điểm thấp | `quizMastery < 0.65` | Gợi ý làm quiz củng cố |
| Còn từ chưa học | Có vocabulary chưa nằm trong `learnedVocabularyIds` | Gợi ý học từ mới |
| Lâu không học | Không có activity hoặc activity cách >= 2 ngày | Gợi ý phiên học ngắn |

## Tiêu chí đạt khi bảo vệ

- Dashboard hoặc Learning Path hiển thị được danh sách đề xuất.
- Mỗi đề xuất có lý do dễ hiểu.
- Có thể giải thích được các yếu tố BKT+SM2 trong báo cáo.
- Có test hoặc checklist chứng minh các scenario chính hoạt động.

## Giới hạn MVP

- Mastery đang tính ở mức tổng quát, chưa theo từng topic nhỏ.
- SM-2 chưa lưu easiness/repetition interval chi tiết.
- Chưa có collaborative filtering vì dữ liệu người dùng ít.

## Hướng nâng cấp

- Tính mastery theo topic/từ vựng/ngữ pháp.
- Lưu lịch ôn chi tiết theo SM-2.
- Dùng dữ liệu chat để phát hiện chủ đề người học quan tâm.
- Tối ưu tham số BKT khi có nhiều dữ liệu quiz thực tế.
