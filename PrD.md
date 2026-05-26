## TRƯỜNG ĐẠI HỌC CÔNG NGHỆ THÔNG TIN
## VÀ TRUYỀN THÔNG VIỆT - HÀN
## KHOA KHOA HỌC MÁY TÍNH
## CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT
## NAM
Độc lập - Tự do - Hạnh phúc

## ĐỀ CƯƠNG CHI TIẾT ĐỒ ÁN, KHÓA LUẬN TỐT NGHIỆP

Tên đề tài: Xây dựng ứng dụng web học tiếng Nhật sơ cấp tích hợp chatbot
AI (RAG) và hệ thống gợi ý lộ trình học dựa trên hành vi người dùng
Sinh viên thực hiện:
TT Họ tên sinh viên MSV Lớp Ngành
Nguyễn Văn Tuấn 22CE089 22SE1B Kỹ thuật phần mềm
Người hướng dẫn: ThS.Ngô Lê Quân
- Lý do chọn đề tài
Trong bối cảnh hội nhập quốc tế và nhu cầu học ngoại ngữ ngày càng gia tăng,
tiếng Nhật đang trở thành một trong những ngôn ngữ được nhiều sinh viên Việt Nam
lựa chọn, đặc biệt là những người có định hướng học tập và làm việc tại Nhật Bản. Tuy
nhiên, các phương pháp học truyền thống thường thiếu tính cá nhân hóa và tương tác,
khiến người học gặp khó khăn trong việc duy trì động lực và cải thiện hiệu quả học
tập.

Hiện nay, các ứng dụng học ngoại ngữ chủ yếu tập trung vào việc cung cấp nội
dung học cố định như từ vựng, ngữ pháp và bài tập, chưa tận dụng hiệu quả các công
nghệ trí tuệ nhân tạo để hỗ trợ người học một cách thông minh. Trong khi đó, sự phát
triển của các mô hình ngôn ngữ lớn (LLM) đã mở ra khả năng xây dựng các hệ thống
chatbot có thể hiểu và phản hồi bằng ngôn ngữ tự nhiên, hỗ trợ người học trong quá
trình học tập.

Bên cạnh đó, kỹ thuật Retrieval-Augmented Generation (RAG) cho phép kết hợp giữa
khả năng sinh ngôn ngữ của mô hình AI và dữ liệu tri thức cụ thể, giúp nâng cao độ
chính xác và giảm thiểu thông tin sai lệch. Ngoài ra, việc phân tích hành vi người dùng
để cá nhân hóa nội dung học tập cũng là một hướng đi quan trọng nhằm tối ưu hiệu
quả học.

Từ những lý do trên, đề tài được lựa chọn nhằm xây dựng một ứng dụng học
tiếng Nhật tích hợp chatbot AI và hệ thống gợi ý học, góp phần nâng cao trải nghiệm
và hiệu quả học tập cho người dùng.
- Mục tiêu và nhiệm vụ đề tài
2.1. Mục tiêu nghiên cứu



Mục tiêu chính của đề tài là nghiên cứu và xây dựng một ứng dụng web học
tiếng Nhật trình độ sơ cấp có tích hợp trí tuệ nhân tạo nhằm hỗ trợ người học hiệu quả,
tăng tính tương tác và cá nhân hóa quá trình học tập.
Cụ thể, đề tài hướng đến các mục tiêu sau:

● Về mặt công nghệ:
Nghiên cứu nguyên lý hoạt động của mô hình ngôn ngữ lớn (LLM) và kỹ
thuật Retrieval-Augmented Generation (RAG).
Triển khai thành công chatbot AI có khả năng hiểu và phản hồi ngôn ngữ
tự nhiên, đồng thời tận dụng dữ liệu học tiếng Nhật để cung cấp câu trả lời
chính xác và có ngữ cảnh.
Thực hiện tích hợp mô hình AI vào hệ thống web thông qua API.
● Về mặt hệ thống:
Xây dựng một hệ thống web hoàn chỉnh bao gồm frontend và backend,
đảm bảo khả năng tương tác giữa người dùng và hệ thống AI.
Thiết kế kiến trúc hệ thống đảm bảo khả năng mở rộng và dễ bảo trì.
● Về mặt ứng dụng:
Phát triển các chức năng học tiếng Nhật cơ bản như học từ vựng, ngữ pháp
và làm bài tập trắc nghiệm.
Cho phép người dùng tương tác trực tiếp với chatbot để hỏi đáp và hỗ trợ
học tập.
● Về mặt cá nhân hóa:
Xây dựng cơ chế thu thập và phân tích dữ liệu hành vi người dùng (lịch sử
học, kết quả bài tập).
Từ đó, đề xuất lộ trình học phù hợp với từng người dùng nhằm nâng cao
hiệu quả học tập.

2.2. Nhiệm vụ nghiên cứu
Để đạt được các mục tiêu trên, đề tài cần thực hiện các nhiệm vụ sau:
● Nghiên cứu lý thuyết và công nghệ liên quan:
o Tìm hiểu về mô hình ngôn ngữ lớn (LLM) và khả năng ứng dụng
trong xử lý ngôn ngữ tự nhiên
o Nghiên cứu kỹ thuật RAG và cách kết hợp với dữ liệu tri thức để cải
thiện độ chính xác của chatbot
o Tìm hiểu các phương pháp xây dựng hệ thống gợi ý
(recommendation system)
o Khảo sát các ứng dụng học ngoại ngữ hiện có để phân tích ưu
nhược điểm
● Phân tích và thiết kế hệ thống:
o Xác định yêu cầu chức năng và phi chức năng của hệ thống
o Thiết kế kiến trúc tổng thể (frontend, backend, AI module)
o Xây dựng sơ đồ UML (Use Case, Activity, Sequence Diagram)
o Thiết kế cơ sở dữ liệu phục vụ lưu trữ thông tin người dùng và dữ
liệu học tập
● Xây dựng và triển khai hệ thống:
o Phát triển giao diện web cho người dùng

o Xây dựng backend API để xử lý dữ liệu và kết nối các thành phần
o Triển khai chatbot AI sử dụng kỹ thuật RAG
o Xây dựng module gợi ý học dựa trên hành vi người dùng
● Kiểm thử, đánh giá và hoàn thiện:
o Thực hiện kiểm thử các chức năng của hệ thống
o Đánh giá độ chính xác và tính phù hợp của chatbot
o Đánh giá hiệu quả của hệ thống gợi ý
o Hoàn thiện hệ thống và viết báo cáo đồ án
- Đối tượng và phạm vi đề tài
3.1. Đối tượng nghiên cứu
Đề tài tập trung nghiên cứu và ứng dụng các công nghệ sau:
● Mô hình ngôn ngữ lớn (LLM):
Nghiên cứu khả năng xử lý ngôn ngữ tự nhiên, sinh văn bản và ứng dụng
trong việc xây dựng chatbot hỗ trợ học tập.
● Kỹ thuật Retrieval-Augmented Generation (RAG):
Tìm hiểu cách kết hợp giữa mô hình sinh ngôn ngữ và cơ sở dữ liệu tri
thức để nâng cao độ chính xác và tính liên quan của câu trả lời.
● Hệ thống gợi ý (Recommendation System):
Nghiên cứu phương pháp phân tích hành vi người dùng để đưa ra các gợi
ý học tập phù hợp, giúp cá nhân hóa trải nghiệm.
● Công nghệ phát triển web:
Bao gồm frontend (giao diện người dùng), backend (xử lý dữ liệu) và API
kết nối với hệ thống AI.
3.2. Đối tượng sử dụng
Hệ thống sẽ hướng đến các đối tượng người dùng sau:
● Người học tiếng Nhật ở trình độ sơ cấp (người mới bắt đầu)
● Sinh viên hoặc người đi làm có nhu cầu học tiếng Nhật cơ bản
● Người muốn ôn tập từ vựng, ngữ pháp và luyện tập thông qua bài tập
3.3. Phạm vi nghiên cứu
Đề tài được giới hạn trong các phạm vi sau:
● Nội dung học tập:
Tập trung vào chương trình tiếng Nhật sơ cấp, tương đương trình độ N5, bao
gồm:
o Từ vựng cơ bản
o Ngữ pháp cơ bản
o Bài tập trắc nghiệm

● Chức năng hệ thống:
Hệ thống cung cấp các chức năng chính:
o Học từ vựng và ngữ pháp
o Làm bài tập (quiz)
o Chatbot AI hỗ trợ hỏi đáp
o Gợi ý lộ trình học
● Nền tảng triển khai:
Hệ thống được xây dựng dưới dạng ứng dụng web, có thể truy cập thông
qua trình duyệt.
3.4. Giới hạn của đề tài
Do hạn chế về thời gian và nguồn lực, đề tài có một số giới hạn như sau:
● Không phát triển ứng dụng trên nền tảng mobile (Android/iOS)
● Không bao phủ toàn bộ các cấp độ tiếng Nhật (chỉ tập trung sơ cấp)
● Dữ liệu học tập được xây dựng ở mức cơ bản, chưa đầy đủ như các hệ thống
thương mại
- Phương pháp thực hiện
Để triển khai đề tài, các phương pháp sau sẽ được áp dụng:
4.1. Phương pháp nghiên cứu lý thuyết
● Nghiên cứu các tài liệu, bài báo khoa học liên quan đến:
o Mô hình ngôn ngữ lớn (LLM)
o Kỹ thuật Retrieval-Augmented Generation (RAG)
o Hệ thống gợi ý (Recommendation System)
● Tìm hiểu cách hoạt động của chatbot AI và khả năng ứng dụng trong lĩnh vực
giáo dục
● Khảo sát và phân tích một số hệ thống học ngoại ngữ hiện có để rút ra ưu điểm
và hạn chế
4.2. Phương pháp phân tích và thiết kế hệ thống
● Phân tích yêu cầu hệ thống:
o Xác định yêu cầu chức năng (học, quiz, chatbot, gợi ý)
o Xác định yêu cầu phi chức năng (hiệu năng, bảo mật, khả năng mở rộng)
● Thiết kế hệ thống:
o Xây dựng kiến trúc tổng thể gồm frontend, backend và AI module
o Thiết kế các sơ đồ UML:
## ▪ Use Case Diagram
## ▪ Activity Diagram

## ▪ Sequence Diagram
● Thiết kế cơ sở dữ liệu:
o Xây dựng cấu trúc lưu trữ người dùng, lịch sử học tập và dữ liệu học
o Đảm bảo khả năng mở rộng và truy xuất dữ liệu hiệu quả

4.3. Phương pháp xây dựng và phát triển hệ thống
● Phát triển frontend:
o Xây dựng giao diện web cho người dùng
o Đảm bảo dễ sử dụng và hỗ trợ các chức năng học tập
● Phát triển backend:
o Xây dựng API xử lý dữ liệu người dùng và nội dung học
o Quản lý đăng nhập, đăng ký và lịch sử học
● Triển khai chatbot AI:
o Xây dựng pipeline RAG:
▪ Tiền xử lý dữ liệu
▪ Chuyển đổi dữ liệu thành vector (embedding)
▪ Lưu trữ trong vector database
o Kết nối với mô hình LLM để sinh câu trả lời
● Xây dựng hệ thống gợi ý:
o Thu thập dữ liệu hành vi người dùng
o Phân tích kết quả học tập (đúng/sai)
o Đề xuất nội dung học phù hợp
4.4. Phương pháp kiểm thử và đánh giá
● Kiểm thử hệ thống:
o Kiểm thử chức năng (Functional Testing)
o Kiểm thử tích hợp (Integration Testing)
● Đánh giá chatbot:
o Đánh giá độ chính xác câu trả lời
o Đánh giá khả năng hiểu ngữ cảnh
● Đánh giá hệ thống gợi ý:
o Kiểm tra mức độ phù hợp của gợi ý
o So sánh với phương pháp học thông thường
● Hoàn thiện hệ thống:

o Sửa lỗi phát sinh
o Tối ưu hiệu năng và trải nghiệm người dùng

- Dự kiến kết quả
Sau khi hoàn thành đề tài, hệ thống dự kiến đạt được các kết quả sau:
● Về mặt sản phẩm:
Xây dựng được một ứng dụng web học tiếng Nhật sơ cấp hoạt động ổn định, hỗ
trợ người dùng học từ vựng, ngữ pháp và làm bài tập trắc nghiệm.
● Về mặt trí tuệ nhân tạo:
Triển khai thành công chatbot AI sử dụng kỹ thuật RAG, có khả năng trả lời
câu hỏi về tiếng Nhật bằng ngôn ngữ tự nhiên, cung cấp ví dụ và hỗ trợ học tập
hiệu quả.
● Về mặt cá nhân hóa:
Xây dựng được hệ thống gợi ý lộ trình học dựa trên hành vi và kết quả học tập
của người dùng, giúp nâng cao hiệu quả học tập.
● Về mặt hệ thống:
Hoàn thiện kiến trúc hệ thống bao gồm frontend, backend và module AI, đảm
bảo khả năng hoạt động ổn định và mở rộng.
● Về mặt tài liệu:
Hoàn thành đầy đủ báo cáo đồ án, tài liệu thiết kế hệ thống và video demo minh
họa sản phẩm.

- Ý nghĩa khoa học và thực tiễn
6.1. Ý nghĩa khoa học
Đề tài góp phần nghiên cứu và ứng dụng các công nghệ trí tuệ nhân tạo hiện đại,
đặc biệt là mô hình ngôn ngữ lớn (LLM) và kỹ thuật Retrieval-Augmented Generation
(RAG), trong lĩnh vực giáo dục.
Thông qua việc xây dựng chatbot hỗ trợ học tiếng Nhật, đề tài giúp làm rõ khả
năng ứng dụng của AI trong xử lý ngôn ngữ tự nhiên, đồng thời nâng cao độ chính xác
của hệ thống thông qua việc kết hợp giữa mô hình sinh ngôn ngữ và dữ liệu tri thức.
Ngoài ra, đề tài cũng góp phần nghiên cứu cơ chế cá nhân hóa trong học tập
thông qua việc phân tích hành vi người dùng và áp dụng hệ thống gợi ý.
6.2. Ý nghĩa thực tiễn

Về mặt thực tiễn, đề tài cung cấp một giải pháp hỗ trợ học tiếng Nhật hiệu quả,
giúp người học tiếp cận phương pháp học hiện đại và tương tác hơn so với phương
pháp truyền thống.
Hệ thống cho phép người dùng học tập linh hoạt, chủ động thông qua chatbot AI
và nhận được các gợi ý học phù hợp với trình độ và nhu cầu cá nhân.
Bên cạnh đó, đề tài có tiềm năng phát triển thành sản phẩm thực tế trong lĩnh vực
giáo dục trực tuyến, góp phần nâng cao chất lượng học tập và trải nghiệm người dùng.

- Dự kiến nội dung đồ án/khóa luận tốt nghiệp
Chương 1: Cơ sở lý thuyết và công nghệ
Chương 2: Phân tích và thiết kế hệ thống
Chương 3: Triển khai, kiểm thử và đánh giá
Kết luận và hướng phát triển
- Dự kiến tiến độ thực hiện:
## T
## T
Thời gian Nội dung thực hiện
1 Từ 16/03 đến
## 25/03
Khảo sát yêu cầu hệ thống, tìm hiểu các công nghệ
liên quan như mô hình ngôn ngữ lớn (LLM), kỹ thuật
RAG và hệ thống gợi ý. Xác định phạm vi và chức
năng chính của đề tài.
2 Từ 26/03 đến
## 05/04
Phân tích yêu cầu và thiết kế hệ thống, bao gồm thiết
kế kiến trúc tổng thể, cơ sở dữ liệu và các sơ đồ
UML (Use Case, Activity, Sequence Diagram).
3 Từ 06/04 đến
## 28/04
Tiến hành xây dựng hệ thống: phát triển giao diện
web, xây dựng backend API, tích hợp chatbot AI và
triển khai hệ thống gợi ý học tập.
4 Từ 29/04 đến
## 10/05
Thực hiện kiểm thử hệ thống (chức năng, tích hợp),
sửa lỗi và tối ưu hiệu năng, cải thiện trải nghiệm
người dùng.
5 Từ 11/05 đến
## 20/05
Viết báo cáo, tối ưu hoá hệ thống.

Người hướng dẫn
(ký và ghi rõ họ tên)
Đà Nẵng, ngày    tháng    năm
Sinh viên/đại diện nhóm sinh viên
(ký và ghi rõ họ tên)