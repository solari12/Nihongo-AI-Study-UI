import { readFile } from "node:fs/promises"
import path from "node:path"
import { createHash } from "node:crypto"
import { config } from "dotenv"
import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "../lib/generated/prisma/client"

config({ path: ".env.local" })

type ImportedGrammar = {
  pattern: string
  meaning: string
  structure: string
  usageNote: string
  difficulty: "easy" | "medium" | "hard"
  example: {
    japanese: string
    vietnamese: string
  }
}

type ImportFile = {
  grammar: ImportedGrammar[]
}

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  throw new Error("DATABASE_URL is not configured")
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
})

const inputPath = path.join(process.cwd(), "data", "imports", "n5-grammar.json")

type GrammarOverride = Omit<Partial<ImportedGrammar>, "example"> & {
  example?: Partial<ImportedGrammar["example"]>
}

const polishedVietnameseByPattern: Record<string, GrammarOverride> = {
  "N は N です": {
    meaning: "N là N",
    usageNote: "Dùng để giới thiệu, định danh hoặc nói một cách lịch sự về chủ đề.",
    example: {
      vietnamese: "Tôi là học sinh.",
    },
  },
  "N ではありません": {
    meaning: "Không phải là N",
    usageNote: "Dạng phủ định lịch sự của です. じゃありません thân mật hơn ではありません.",
    example: {
      vietnamese: "Anh Tanaka không phải là giáo viên.",
    },
  },
  "N でした": {
    meaning: "Đã từng là N",
    usageNote: "Dạng quá khứ lịch sự của です.",
    example: {
      vietnamese: "Hôm qua là ngày nghỉ.",
    },
  },
  "N ではありませんでした": {
    meaning: "Đã không phải là N",
    usageNote: "Dạng phủ định quá khứ lịch sự của です.",
    example: {
      vietnamese: "Hôm qua không phải là ngày mưa.",
    },
  },
  "これ / それ / あれ": {
    meaning: "Cái này / cái đó / cái kia",
    usageNote: "これ dùng cho vật gần người nói, それ gần người nghe, あれ xa cả hai.",
    example: {
      vietnamese: "Đây là sách.",
    },
  },
  "この / その / あの N": {
    meaning: "N này / N đó / N kia",
    usageNote: "Đứng trước danh từ để chỉ vị trí của vật hoặc người.",
    example: {
      vietnamese: "Quyển sách này mới.",
    },
  },
  "ここ / そこ / あそこ": {
    meaning: "Chỗ này / chỗ đó / chỗ kia",
    usageNote: "Dùng để chỉ địa điểm gần người nói, gần người nghe hoặc xa cả hai.",
    example: {
      vietnamese: "Đây là phòng học.",
    },
  },
  "だれ / 何 / どこ": {
    meaning: "Ai / cái gì / ở đâu",
    usageNote: "Các từ nghi vấn cơ bản trong câu hỏi lịch sự.",
    example: {
      vietnamese: "Người kia là ai?",
    },
  },
  "か": {
    meaning: "Trợ từ câu hỏi",
    usageNote: "Đặt ở cuối câu để biến câu trần thuật thành câu hỏi lịch sự.",
    example: {
      vietnamese: "Bạn là học sinh phải không?",
    },
  },
  "も": {
    meaning: "Cũng, cũng vậy",
    usageNote: "Thay cho は, が hoặc を để diễn tả ý 'cũng'.",
    example: {
      vietnamese: "Tôi cũng là học sinh.",
    },
  },
  "の": {
    meaning: "Của, thuộc về",
    usageNote: "Nối hai danh từ để chỉ sở hữu, nguồn gốc, loại hoặc mối quan hệ.",
    example: {
      vietnamese: "Đây là sách của tôi.",
    },
  },
  "と": {
    meaning: "Và, cùng với",
    usageNote: "Nối các danh từ hoặc chỉ người cùng thực hiện hành động.",
    example: {
      vietnamese: "Tôi xem phim với bạn.",
    },
  },
  "や": {
    meaning: "Và, nhưng không liệt kê hết",
    usageNote: "Dùng khi nêu một vài ví dụ trong danh sách, không phải tất cả.",
    example: {
      vietnamese: "Trên bàn có sách, bút và những thứ khác.",
    },
  },
  "を": {
    meaning: "Đánh dấu tân ngữ trực tiếp",
    usageNote: "Dùng với danh từ bị tác động trực tiếp bởi động từ.",
    example: {
      vietnamese: "Tôi uống nước.",
    },
  },
  "に": {
    meaning: "Thời điểm, điểm đến, đối tượng",
    usageNote: "Dùng cho thời điểm cụ thể, nơi đến, nơi tồn tại hoặc người nhận hành động.",
    example: {
      vietnamese: "Tôi thức dậy lúc 7 giờ.",
    },
  },
  "で": {
    meaning: "Nơi xảy ra hành động, phương tiện",
    usageNote: "Dùng cho địa điểm hành động diễn ra hoặc công cụ/phương tiện được sử dụng.",
    example: {
      vietnamese: "Tôi học ở thư viện.",
    },
  },
  "い-adjective です": {
    meaning: "Tính từ đuôi い ở hiện tại",
    usageNote: "Dùng tính từ đuôi い với です để câu lịch sự hơn.",
    example: {
      vietnamese: "Cái cặp này to.",
    },
  },
  "Verb ています": {
    meaning: "Đang làm, đang ở trong trạng thái",
    usageNote: "Diễn tả hành động đang diễn ra hoặc trạng thái kéo dài sau một hành động.",
    example: {
      vietnamese: "Bây giờ tôi đang học tiếng Nhật.",
    },
  },
}

const vietnameseReplacements: Array<[RegExp, string]> = [
  [/\bDung\b/g, "Dùng"],
  [/\bdung\b/g, "dùng"],
  [/\bde\b/g, "để"],
  [/\bDe\b/g, "Để"],
  [/\bgioi thieu\b/g, "giới thiệu"],
  [/\bdinh danh\b/g, "định danh"],
  [/\bmot\b/g, "một"],
  [/\bdieu\b/g, "điều"],
  [/\blich su\b/g, "lịch sự"],
  [/\bchu de\b/g, "chủ đề"],
  [/\bDang\b/g, "Dạng"],
  [/\bdang\b/g, "dạng"],
  [/\bphu dinh\b/g, "phủ định"],
  [/\bqua khu\b/g, "quá khứ"],
  [/\bthan mat\b/g, "thân mật"],
  [/\btruoc\b/g, "trước"],
  [/\bsau\b/g, "sau"],
  [/\bdanh tu\b/g, "danh từ"],
  [/\btinh tu\b/g, "tính từ"],
  [/\bdong tu\b/g, "động từ"],
  [/\btro tu\b/g, "trợ từ"],
  [/\btan ngu\b/g, "tân ngữ"],
  [/\btruc tiep\b/g, "trực tiếp"],
  [/\bso huu\b/g, "sở hữu"],
  [/\bnguon goc\b/g, "nguồn gốc"],
  [/\bloai\b/g, "loại"],
  [/\bmoi quan he\b/g, "mối quan hệ"],
  [/\bchi\b/g, "chỉ"],
  [/\bvi tri\b/g, "vị trí"],
  [/\bvat\b/g, "vật"],
  [/\bnguoi\b/g, "người"],
  [/\bdia diem\b/g, "địa điểm"],
  [/\bgan\b/g, "gần"],
  [/\bxa\b/g, "xa"],
  [/\bCac\b/g, "Các"],
  [/\bcac\b/g, "các"],
  [/\btu nghi van\b/g, "từ nghi vấn"],
  [/\bcau hoi\b/g, "câu hỏi"],
  [/\bDat\b/g, "Đặt"],
  [/\bdat\b/g, "đặt"],
  [/\bcuoi cau\b/g, "cuối câu"],
  [/\bbien\b/g, "biến"],
  [/\bcau tran thuat\b/g, "câu trần thuật"],
  [/\bdien ta\b/g, "diễn tả"],
  [/\by\b/g, "ý"],
  [/\bNoi\b/g, "Nối"],
  [/\bnoi\b/g, "nối"],
  [/\bhanh dong\b/g, "hành động"],
  [/\bLiet ke\b/g, "Liệt kê"],
  [/\bliet ke\b/g, "liệt kê"],
  [/\bday du\b/g, "đầy đủ"],
  [/\bnhieu\b/g, "nhiều"],
  [/\bDung voi\b/g, "Dùng với"],
  [/\bbi tac dong\b/g, "bị tác động"],
  [/\bThoi diem\b/g, "Thời điểm"],
  [/\bthoi diem\b/g, "thời điểm"],
  [/\bdiem den\b/g, "điểm đến"],
  [/\bdoi tuong\b/g, "đối tượng"],
  [/\bnoi den\b/g, "nơi đến"],
  [/\bnoi ton tai\b/g, "nơi tồn tại"],
  [/\bnguoi nhan\b/g, "người nhận"],
  [/\bTai noi\b/g, "Tại nơi"],
  [/\bxay ra\b/g, "xảy ra"],
  [/\bbang phuong tien\b/g, "bằng phương tiện"],
  [/\bcong cu\b/g, "công cụ"],
  [/\bduoc su dung\b/g, "được sử dụng"],
  [/\bHuong den\b/g, "Hướng đến"],
  [/\bhuong\b/g, "hướng"],
  [/\bdi chuyen\b/g, "di chuyển"],
  [/\bthuong\b/g, "thường"],
  [/\bbat dau\b/g, "bắt đầu"],
  [/\bket thuc\b/g, "kết thúc"],
  [/\bCo\b/g, "Có"],
  [/\bco\b/g, "có"],
  [/\bton tai\b/g, "tồn tại"],
  [/\bdo vat\b/g, "đồ vật"],
  [/\bsu viec\b/g, "sự việc"],
  [/\bcay coi\b/g, "cây cối"],
  [/\bsu kien\b/g, "sự kiện"],
  [/\btu di chuyen\b/g, "tự di chuyển"],
  [/\bdong vat\b/g, "động vật"],
  [/\bThich\b/g, "Thích"],
  [/\bthich\b/g, "thích"],
  [/\bGhet\b/g, "Ghét"],
  [/\bghet\b/g, "ghét"],
  [/\bkhong\b/g, "không"],
  [/\bKhong\b/g, "Không"],
  [/\bGioi\b/g, "Giỏi"],
  [/\bgioi\b/g, "giỏi"],
  [/\bkem\b/g, "kém"],
  [/\bkha nang\b/g, "khả năng"],
  [/\bban than\b/g, "bản thân"],
  [/\bcan than\b/g, "cẩn thận"],
  [/\btranh\b/g, "tránh"],
  [/\btu khen\b/g, "tự khen"],
  [/\bhien tai\b/g, "hiện tại"],
  [/\bvoi\b/g, "với"],
  [/\bhon\b/g, "hơn"],
  [/\bLam\b/g, "Làm"],
  [/\blam\b/g, "làm"],
  [/\btuong lai\b/g, "tương lai"],
  [/\bHay\b/g, "Hãy"],
  [/\bcung\b/g, "cùng"],
  [/\bru re\b/g, "rủ rê"],
  [/\bde xuat\b/g, "đề xuất"],
  [/\bBan\b/g, "Bạn"],
  [/\bban\b/g, "bạn"],
  [/\bmuon\b/g, "muốn"],
  [/\bLoi moi\b/g, "Lời mời"],
  [/\bloi moi\b/g, "lời mời"],
  [/\bmem\b/g, "mềm"],
  [/\bnhu cau\b/g, "nhu cầu"],
  [/\bmong muon\b/g, "mong muốn"],
  [/\bye[uê]u cau\b/g, "yêu cầu"],
  [/\bnho ai\b/g, "nhờ ai"],
  [/\bxin phep\b/g, "xin phép"],
  [/\bchap nhan\b/g, "chấp nhận"],
  [/\bbi cam\b/g, "bị cấm"],
  [/\bnen\b/g, "nên"],
  [/\btrang thai\b/g, "trạng thái"],
  [/\bkeo dai\b/g, "kéo dài"],
  [/\bkinh nghiem\b/g, "kinh nghiệm"],
  [/\btrai qua\b/g, "trải qua"],
  [/\btieu bieu\b/g, "tiêu biểu"],
  [/\bly do\b/g, "lý do"],
  [/\bnguyen nhan\b/g, "nguyên nhân"],
  [/\bmenh de\b/g, "mệnh đề"],
  [/\bNhung\b/g, "Nhưng"],
  [/\bnhung\b/g, "nhưng"],
  [/\btuy nhien\b/g, "tuy nhiên"],
  [/\btrai nguoc\b/g, "trái ngược"],
  [/\btrang trong\b/g, "trang trọng"],
  [/\bso sanh\b/g, "so sánh"],
  [/\btinh chat\b/g, "tính chất"],
  [/\bmuc do\b/g, "mức độ"],
  [/\bcao nhat\b/g, "cao nhất"],
  [/\bnhom\b/g, "nhóm"],
  [/\bChi\b/g, "Chỉ"],
  [/\bgioi han\b/g, "giới hạn"],
  [/\bpham vi\b/g, "phạm vi"],
  [/\bso luong\b/g, "số lượng"],
  [/\bduy nhat\b/g, "duy nhất"],
  [/\bnhan manh\b/g, "nhấn mạnh"],
  [/\bit\b/g, "ít"],
  [/\blua chon\b/g, "lựa chọn"],
  [/\bluon\b/g, "luôn"],
  [/\bKhoang\b/g, "Khoảng"],
  [/\bkhoang\b/g, "khoảng"],
  [/\btam\b/g, "tầm"],
  [/\buoc chung\b/g, "ước chừng"],
  [/\bluc\b/g, "lúc"],
  [/\bNhieu\b/g, "Nhiều"],
  [/\bdon gian\b/g, "đơn giản"],
  [/\bnhe\b/g, "nhẹ"],
  [/\bcao\b/g, "cao"],
  [/\bHoan toan\b/g, "Hoàn toàn"],
  [/\bhoan toan\b/g, "hoàn toàn"],
  [/\bDa\b/g, "Đã"],
  [/\bda\b/g, "đã"],
  [/\broi\b/g, "rồi"],
  [/\bVan\b/g, "Vẫn"],
  [/\bvan\b/g, "vẫn"],
  [/\bchua\b/g, "chưa"],
  [/\btiep tuc\b/g, "tiếp tục"],
  [/\bCach\b/g, "Cách"],
  [/\bcach\b/g, "cách"],
  [/\btao\b/g, "tạo"],
  [/\bthuc hien\b/g, "thực hiện"],
  [/\bVua\b/g, "Vừa"],
  [/\bvua\b/g, "vừa"],
  [/\bdong thoi\b/g, "đồng thời"],
  [/\bcung mot\b/g, "cùng một"],
  [/\bchu the\b/g, "chủ thể"],
  [/\bmuc dich\b/g, "mục đích"],
  [/\bdau do\b/g, "đâu đó"],
  [/\bToi nghi la\b/g, "Tôi nghĩ là"],
  [/\bsuy nghi\b/g, "suy nghĩ"],
  [/\by kien\b/g, "ý kiến"],
  [/\bdu doan\b/g, "dự đoán"],
  [/\bCo le\b/g, "Có lẽ"],
  [/\bchac la\b/g, "chắc là"],
  [/\bdung\b/g, "đúng"],
  [/\bcach mem hon\b/g, "cách mềm hơn"],
  [/\bgiup ai\b/g, "giúp ai"],
  [/\bsac thai\b/g, "sắc thái"],
  [/\bXin dung\b/g, "Xin đừng"],
  [/\bdung chup\b/g, "đừng chụp"],
  [/\bKhong can\b/g, "Không cần"],
  [/\bbat buoc\b/g, "bắt buộc"],
  [/\bPhai\b/g, "Phải"],
  [/\bnghia vu\b/g, "nghĩa vụ"],
  [/\bviec can\b/g, "việc cần"],
  [/\bdua ra\b/g, "đưa ra"],
  [/\bloi khuyen\b/g, "lời khuyên"],
  [/\bCo the\b/g, "Có thể"],
  [/\bSau khi\b/g, "Sau khi"],
  [/\bthu tu\b/g, "thứ tự"],
  [/\bxong\b/g, "xong"],
  [/\bDu\b/g, "Dù"],
  [/\bdu\b/g, "dù"],
  [/\bbat chap\b/g, "bất chấp"],
  [/\bdieu kien\b/g, "điều kiện"],
  [/\bVi\b/g, "Vì"],
  [/\bvi\b/g, "vì"],
  [/\bdanh tu hoa\b/g, "danh từ hóa"],
  [/\bso thich\b/g, "sở thích"],
  [/\bgiai thich\b/g, "giải thích"],
  [/\bboi canh\b/g, "bối cảnh"],
  [/\bhoi\b/g, "hỏi"],
  [/\bcam giac\b/g, "cảm giác"],
  [/\bbiet\b/g, "biết"],
  [/\bxac nhan\b/g, "xác nhận"],
  [/\bRu\b/g, "Rủ"],
  [/\bmoi ai\b/g, "mời ai"],
  [/\btu nhien\b/g, "tự nhiên"],
  [/\bToi\b/g, "Tôi"],
  [/\btoi\b/g, "tôi"],
  [/\bHoc\b/g, "Học"],
  [/\bhoc\b/g, "học"],
  [/\btieng Nhat\b/g, "tiếng Nhật"],
  [/\bNhat Ban\b/g, "Nhật Bản"],
  [/\bHom qua\b/g, "Hôm qua"],
  [/\bhom qua\b/g, "hôm qua"],
  [/\bngay mai\b/g, "ngày mai"],
  [/\bBay gio\b/g, "Bây giờ"],
  [/\bbay gio\b/g, "bây giờ"],
]

function normalizeVietnameseText(value: string) {
  const normalized = vietnameseReplacements.reduce((text, [pattern, replacement]) => text.replace(pattern, replacement), value)

  return normalized
    .replace(/\bcua\b/g, "của")
    .replace(/\bCua\b/g, "Của")
    .replace(/\bla\b/g, "là")
    .replace(/\bLa\b/g, "Là")
    .replace(/\bphai\b/g, "phải")
    .replace(/\bPhai\b/g, "Phải")
    .replace(/\bve\b/g, "về")
    .replace(/\bVe\b/g, "Về")
    .replace(/\bhoac\b/g, "hoặc")
    .replace(/\bHoac\b/g, "Hoặc")
    .replace(/\bca\b/g, "cả")
    .replace(/\bCa\b/g, "Cả")
    .replace(/\bcai\b/g, "cái")
    .replace(/\bCai\b/g, "Cái")
    .replace(/\bnay\b/g, "này")
    .replace(/\bNay\b/g, "Này")
    .replace(/\bdo\b/g, "đó")
    .replace(/\bDo\b/g, "Đó")
    .replace(/\bkia\b/g, "kia")
    .replace(/\bo dau\b/g, "ở đâu")
    .replace(/\bO\b/g, "Ở")
    .replace(/\bDay\b/g, "Đây")
    .replace(/\bday\b/g, "đây")
    .replace(/\bsach\b/g, "sách")
    .replace(/\bSach\b/g, "Sách")
    .replace(/\bquyen\b/g, "quyển")
    .replace(/\bQuyen\b/g, "Quyển")
    .replace(/\bmoi\b/g, "mới")
    .replace(/\bMoi\b/g, "Mỗi")
    .replace(/\bphong\b/g, "phòng")
    .replace(/\bNguoi\b/g, "Người")
    .replace(/\bnguoi\b/g, "người")
    .replace(/\bco ban\b/g, "cơ bản")
    .replace(/\bco bạn\b/g, "cơ bản")
    .replace(/\bthanh\b/g, "thành")
    .replace(/\bneu\b/g, "nêu")
    .replace(/\bvai\b/g, "vài")
    .replace(/\bvi dù\b/g, "ví dụ")
    .replace(/\bhet\b/g, "hết")
    .replace(/\btat\b/g, "tất")
    .replace(/\bkhac\b/g, "khác")
    .replace(/\bbang\b/g, "bằng")
    .replace(/\bcu the\b/g, "cụ thể")
    .replace(/\bcụ the\b/g, "cụ thể")
    .replace(/\brang\b/g, "rằng")
    .replace(/\bminh\b/g, "mình")
    .replace(/\bnau\b/g, "nấu")
    .replace(/\bdat\b/g, "đắt")
    .replace(/\bđặt\b/g, "đắt")
    .replace(/\btrang\b/g, "trang")
    .replace(/\bkhang dinh\b/g, "khẳng định")
    .replace(/\bthi\b/g, "thì")
    .replace(/\bthem\b/g, "thêm")
    .replace(/\bket cau\b/g, "kết câu")
    .replace(/\bviec\b/g, "việc")
    .replace(/\btinh huong\b/g, "tình huống")
    .replace(/\btinh hướng\b/g, "tình huống")
    .replace(/\bgi\b/g, "gì")
    .replace(/\bHãy làm on\b/g, "Hãy làm ơn")
    .replace(/\bDuoc\b/g, "Được")
    .replace(/\bduoc\b/g, "được")
    .replace(/\bDang làm\b/g, "Đang làm")
    .replace(/\bDạng làm\b/g, "Đang làm")
    .replace(/\bdạng học\b/g, "đang học")
    .replace(/\bdạng trong\b/g, "đang trong")
    .replace(/\bdạng dien\b/g, "đang diễn")
    .replace(/\bDạng trong lúc\b/g, "Đang trong lúc")
    .replace(/\bve kinh nghiệm\b/g, "về kinh nghiệm")
    .replace(/\btung\b/g, "từng")
    .replace(/\bTung\b/g, "Từng")
    .replace(/\bTruoc\b/g, "Trước")
    .replace(/\bngu\b/g, "ngủ")
    .replace(/\bdanh rang\b/g, "đánh răng")
    .replace(/\ban\b/g, "ăn")
    .replace(/\bAn\b/g, "Ăn")
    .replace(/\btrua\b/g, "trưa")
    .replace(/\btroi\b/g, "trời")
    .replace(/\blanh\b/g, "lạnh")
    .replace(/\bmac\b/g, "mặc")
    .replace(/\bao khoac\b/g, "áo khoác")
    .replace(/\bmenh để\b/g, "mệnh đề")
    .replace(/\btuong\b/g, "tưởng")
    .replace(/\bNhat\b/g, "Nhất")
    .replace(/\bnhat\b/g, "nhất")
    .replace(/\bmua\b/g, "mưa")
    .replace(/\bMua\b/g, "Mùa")
    .replace(/\bxuan\b/g, "xuân")
    .replace(/\bgiỏi han\b/g, "giới hạn")
    .replace(/\bbi giỏi han\b/g, "bị giới hạn")
    .replace(/\bmanh\b/g, "mạnh")
    .replace(/\bhieu\b/g, "hiểu")
    .replace(/\bthuc\b/g, "thức")
    .replace(/\bdoc\b/g, "đọc")
    .replace(/\bdau\b/g, "đau")
    .replace(/\bse\b/g, "sẽ")
    .replace(/\bve dùng\b/g, "vẻ đúng")
    .replace(/\bdung một cách\b/g, "đúng một cách")
    .replace(/\bmo\b/g, "mở")
    .replace(/\bcua so\b/g, "cửa sổ")
    .replace(/\bnhe\b/g, "nhé")
    .replace(/\bXin dùng\b/g, "Xin đừng")
    .replace(/\bdung chup\b/g, "đừng chụp")
    .replace(/\bchup\b/g, "chụp")
    .replace(/\bkhong can\b/g, "không cần")
    .replace(/\bcan\b/g, "cần")
    .replace(/\bden\b/g, "đến")
    .replace(/\bphai\b/g, "phải")
    .replace(/\bthe\b/g, "thể")
    .replace(/\brua\b/g, "rửa")
    .replace(/\bdoi\b/g, "đổi")
    .replace(/\bket qua\b/g, "kết quả")
    .replace(/\bkien\b/g, "kiện")
    .replace(/\bsang\b/g, "sáng")
    .replace(/\blen\b/g, "lên")
    .replace(/\bhoa\b/g, "hóa")
    .replace(/\bGiai thích\b/g, "Giải thích")
    .replace(/\bgiai thích\b/g, "giải thích")
    .replace(/\bphai\.\.\./g, "phải...")
    .replace(/\bve một\b/g, "về một")
    .replace(/\bngười nối\b/g, "người nói")
    .replace(/\bnối một\b/g, "nói một")
    .replace(/\bnối rằng\b/g, "nói rằng")
    .replace(/\bnối rang\b/g, "nói rằng")
    .replace(/\bnối điều\b/g, "nói điều")
    .replace(/\bnối số lượng\b/g, "nói số lượng")
    .replace(/\bnối trạng thái\b/g, "nói trạng thái")
    .replace(/\bnối A\b/g, "nói A")
    .replace(/\bnối ve\b/g, "nói về")
    .replace(/\bnối mong\b/g, "nói mong")
    .replace(/\bnối mục\b/g, "nói mục")
    .replace(/\bnối lý do\b/g, "nói lý do")
    .replace(/\bnối hai ý\b/g, "nối hai ý")
    .replace(/\bve chu để\b/g, "về chủ đề")
    .replace(/\bcau lịch sự\b/g, "câu lịch sự")
}

function chunkIdFor(item: ImportedGrammar) {
  const hash = createHash("sha1").update(item.pattern).digest("hex").slice(0, 16)
  return `n5-grammar-${hash}`
}

function buildKnowledgeContent(item: ImportedGrammar) {
  const polished = polishGrammarItem(item)

  return [
    `${polished.pattern}: ${polished.meaning}.`,
    `Structure: ${polished.structure}.`,
    `Usage: ${polished.usageNote}.`,
    `Example: ${polished.example.japanese} - ${polished.example.vietnamese}.`,
    "JLPT level: N5.",
  ].join(" ")
}

function polishGrammarItem(item: ImportedGrammar): ImportedGrammar {
  const override = polishedVietnameseByPattern[item.pattern]

  return {
    ...item,
    meaning: override?.meaning ?? normalizeVietnameseText(item.meaning),
    usageNote: override?.usageNote ?? normalizeVietnameseText(item.usageNote),
    example: {
      japanese: override?.example?.japanese ?? item.example.japanese,
      vietnamese: override?.example?.vietnamese ?? normalizeVietnameseText(item.example.vietnamese),
    },
  }
}

async function main() {
  const raw = await readFile(inputPath, "utf8")
  const parsed = JSON.parse(raw) as ImportFile
  const maxId = await prisma.grammar.aggregate({ _max: { id: true } })
  let nextId = (maxId._max.id ?? 0) + 1
  let createdCount = 0
  let updatedCount = 0

  for (const item of parsed.grammar) {
    const polishedItem = polishGrammarItem(item)
    const existingChunk = await prisma.knowledgeChunk.findFirst({
      where: {
        id: chunkIdFor(item),
      },
      select: {
        grammarId: true,
      },
    })

    const existingGrammar =
      existingChunk?.grammarId != null
        ? await prisma.grammar.findUnique({ where: { id: existingChunk.grammarId } })
        : await prisma.grammar.findFirst({
            where: {
              pattern: item.pattern,
            },
          })

    const id = existingGrammar?.id ?? nextId++

    await prisma.$transaction(async (tx) => {
      await tx.grammar.upsert({
        where: { id },
        update: {
          pattern: item.pattern,
          meaning: polishedItem.meaning,
          structure: polishedItem.structure,
          usageNote: polishedItem.usageNote,
          exampleJapanese: polishedItem.example.japanese,
          exampleVietnamese: polishedItem.example.vietnamese,
          difficulty: item.difficulty,
          status: "not_started",
        },
        create: {
          id,
          pattern: item.pattern,
          meaning: polishedItem.meaning,
          structure: polishedItem.structure,
          usageNote: polishedItem.usageNote,
          exampleJapanese: polishedItem.example.japanese,
          exampleVietnamese: polishedItem.example.vietnamese,
          difficulty: item.difficulty,
          status: "not_started",
        },
      })

      await tx.knowledgeChunk.upsert({
        where: { id: chunkIdFor(item) },
        update: {
          sourceType: "n5-grammar",
          sourceId: item.pattern,
          title: item.pattern,
          content: buildKnowledgeContent(item),
          grammarId: id,
        },
        create: {
          id: chunkIdFor(item),
          sourceType: "n5-grammar",
          sourceId: item.pattern,
          title: item.pattern,
          content: buildKnowledgeContent(item),
          grammarId: id,
        },
      })
    })

    if (existingGrammar) updatedCount += 1
    else createdCount += 1
  }

  console.log(`Imported ${parsed.grammar.length} JLPT N5 grammar items`)
  console.log(`Created: ${createdCount}`)
  console.log(`Updated: ${updatedCount}`)
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (error) => {
    console.error(error)
    await prisma.$disconnect()
    process.exit(1)
  })
