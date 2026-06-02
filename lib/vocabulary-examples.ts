import { vietnameseVocabularyTerms } from "@/lib/vietnamese-vocabulary-dictionary"
import type { VocabularyItem } from "@/lib/data/nihongo-study"

const naturalExamples: Record<string, { japanese: string; vietnamese: string }> = {
  学生: { japanese: "私は学生です。", vietnamese: "Tôi là học sinh." },
  先生: { japanese: "先生に質問します。", vietnamese: "Tôi hỏi giáo viên." },
  日本: { japanese: "日本へ行きます。", vietnamese: "Tôi đi Nhật Bản." },
  本: { japanese: "本を読みます。", vietnamese: "Tôi đọc sách." },
  水: { japanese: "水を飲みます。", vietnamese: "Tôi uống nước." },
  食べる: { japanese: "ご飯を食べます。", vietnamese: "Tôi ăn cơm." },
  大きい: { japanese: "この部屋は大きいです。", vietnamese: "Căn phòng này rộng." },
  父: { japanese: "父は会社員です。", vietnamese: "Bố tôi là nhân viên công ty." },
  電話: { japanese: "友だちに電話します。", vietnamese: "Tôi gọi điện cho bạn." },
  赤: { japanese: "赤い花があります。", vietnamese: "Có bông hoa màu đỏ." },
  雨: { japanese: "今日は雨です。", vietnamese: "Hôm nay trời mưa." },
  飴: { japanese: "飴を食べます。", vietnamese: "Tôi ăn kẹo." },
  姉: { japanese: "姉は大学生です。", vietnamese: "Chị gái tôi là sinh viên đại học." },
  青: { japanese: "空は青いです。", vietnamese: "Bầu trời màu xanh." },
  朝: { japanese: "朝に勉強します。", vietnamese: "Tôi học vào buổi sáng." },
  足: { japanese: "足が痛いです。", vietnamese: "Chân tôi đau." },
  明日: { japanese: "明日学校へ行きます。", vietnamese: "Ngày mai tôi đi học." },
  頭: { japanese: "頭が痛いです。", vietnamese: "Tôi đau đầu." },
  新しい: { japanese: "新しい本を買いました。", vietnamese: "Tôi đã mua sách mới." },
  勉強: { japanese: "日本語を勉強します。", vietnamese: "Tôi học tiếng Nhật." },
  帽子: { japanese: "帽子をかぶります。", vietnamese: "Tôi đội mũ." },
  豚肉: { japanese: "豚肉を食べます。", vietnamese: "Tôi ăn thịt heo." },
  病院: { japanese: "病院へ行きます。", vietnamese: "Tôi đi bệnh viện." },
  病気: { japanese: "今日は病気です。", vietnamese: "Hôm nay tôi bị bệnh." },
  茶色: { japanese: "これは茶色のかばんです。", vietnamese: "Đây là cái cặp màu nâu." },
  茶碗: { japanese: "茶碗を洗います。", vietnamese: "Tôi rửa bát." },
  地下鉄: { japanese: "地下鉄に乗ります。", vietnamese: "Tôi đi tàu điện ngầm." },
  地図: { japanese: "地図を見ます。", vietnamese: "Tôi xem bản đồ." },
  台所: { japanese: "台所で料理します。", vietnamese: "Tôi nấu ăn trong bếp." },
  大学: { japanese: "大学で勉強します。", vietnamese: "Tôi học ở đại học." },
  誰: { japanese: "あの人は誰ですか。", vietnamese: "Người kia là ai?" },
  電気: { japanese: "電気をつけます。", vietnamese: "Tôi bật đèn." },
  電車: { japanese: "電車で行きます。", vietnamese: "Tôi đi bằng tàu điện." },
  出る: { japanese: "家を出ます。", vietnamese: "Tôi ra khỏi nhà." },
  動物: { japanese: "動物が好きです。", vietnamese: "Tôi thích động vật." },
  土曜日: { japanese: "土曜日に休みます。", vietnamese: "Tôi nghỉ vào thứ Bảy." },
  映画: { japanese: "映画を見ます。", vietnamese: "Tôi xem phim." },
  映画館: { japanese: "映画館へ行きます。", vietnamese: "Tôi đi rạp chiếu phim." },
  英語: { japanese: "英語を話します。", vietnamese: "Tôi nói tiếng Anh." },
  駅: { japanese: "駅で待ちます。", vietnamese: "Tôi đợi ở nhà ga." },
  鉛筆: { japanese: "鉛筆で書きます。", vietnamese: "Tôi viết bằng bút chì." },
  冬: { japanese: "冬は寒いです。", vietnamese: "Mùa đông lạnh." },
  学校: { japanese: "学校へ行きます。", vietnamese: "Tôi đi học." },
  月曜日: { japanese: "月曜日に働きます。", vietnamese: "Tôi làm việc vào thứ Hai." },
  銀行: { japanese: "銀行へ行きます。", vietnamese: "Tôi đi ngân hàng." },
  牛肉: { japanese: "牛肉を食べます。", vietnamese: "Tôi ăn thịt bò." },
  花: { japanese: "花を買います。", vietnamese: "Tôi mua hoa." },
  話す: { japanese: "日本語を話します。", vietnamese: "Tôi nói tiếng Nhật." },
  春: { japanese: "春は暖かいです。", vietnamese: "Mùa xuân ấm áp." },
  箸: { japanese: "箸で食べます。", vietnamese: "Tôi ăn bằng đũa." },
  走る: { japanese: "公園で走ります。", vietnamese: "Tôi chạy ở công viên." },
  部屋: { japanese: "部屋を掃除します。", vietnamese: "Tôi dọn phòng." },
  飛行機: { japanese: "飛行機に乗ります。", vietnamese: "Tôi lên máy bay." },
  犬: { japanese: "犬がいます。", vietnamese: "Có một con chó." },
  猫: { japanese: "猫が好きです。", vietnamese: "Tôi thích mèo." },
  飲む: { japanese: "お茶を飲みます。", vietnamese: "Tôi uống trà." },
  読む: { japanese: "本を読みます。", vietnamese: "Tôi đọc sách." },
  見る: { japanese: "テレビを見ます。", vietnamese: "Tôi xem tivi." },
  買う: { japanese: "野菜を買います。", vietnamese: "Tôi mua rau." },
  作る: { japanese: "料理を作ります。", vietnamese: "Tôi nấu món ăn." },
  使う: { japanese: "辞書を使います。", vietnamese: "Tôi dùng từ điển." },
}

function looksGeneratedExample(example?: VocabularyItem["example"]) {
  if (!example) return true

  return (
    example.japanese.endsWith("を勉強します。") ||
    /^[\x00-\x7F]+$/.test(example.vietnamese)
  )
}

export function getVocabularyExample(item: VocabularyItem) {
  const natural = naturalExamples[item.japanese]
  if (natural) return natural
  if (!looksGeneratedExample(item.example)) return item.example

  const meaning = vietnameseVocabularyTerms[item.japanese] ?? item.vietnamese

  return {
    japanese: `${item.japanese}があります。`,
    vietnamese: `Có ${meaning}.`,
  }
}
