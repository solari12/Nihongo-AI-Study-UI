"use client"

import Link from "next/link"
import type { ComponentType } from "react"
import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import {
  ArrowLeft,
  BookOpen,
  CalendarDays,
  Clock,
  GraduationCap,
  HelpCircle,
  Mail,
  ShieldAlert,
  Sparkles,
  Target,
  UserRound,
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { useAuth } from "@/hooks/use-auth"
import {
  activityTypeLabels,
  goalLabels,
  initialLevelLabels,
  statusLabels,
  type LearnerAdminDetail,
  type LearnerStatus,
} from "@/lib/admin/learner-management"

const adminButtonClass =
  "rounded-full border-[#f0c4c0] bg-white/80 text-[#7a3f45] shadow-sm hover:bg-[#fff0ef] hover:text-[#c94955]"

const adminPanelClass = "border-[#f0c4c0] bg-white/90 shadow-sm shadow-[#e96f78]/10"

function formatDate(value?: string) {
  if (!value) return "Chưa có"

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value))
}

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(-2)
    .map((part) => part[0])
    .join("")
    .toUpperCase()
}

function statusBadgeClass(status: LearnerStatus) {
  if (status === "active") return "border-emerald-200 bg-emerald-50 text-emerald-700"
  if (status === "inactive") return "border-amber-200 bg-amber-50 text-amber-700"
  return "border-[#f2c3d0] bg-[#fff0f4] text-[#c94967]"
}

export default function AdminLearnerDetailPage() {
  const { activeUser } = useAuth()
  const params = useParams<{ id: string }>()
  const [learner, setLearner] = useState<LearnerAdminDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    if (activeUser?.role !== "admin") return

    let cancelled = false

    fetch(`/api/admin/learners/${params.id}`)
      .then(async (response) => {
        if (!response.ok) throw new Error("Không tải được dữ liệu học viên.")
        return response.json() as Promise<{ learner: LearnerAdminDetail }>
      })
      .then((data) => {
        if (!cancelled) {
          setLearner(data.learner)
          setError("")
        }
      })
      .catch(() => {
        if (!cancelled) setError("Không tìm thấy hoặc không tải được dữ liệu học viên.")
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [activeUser?.role, params.id])

  if (activeUser?.role !== "admin") {
    return (
      <div className="space-y-6">
        <Card className="border-amber-200 bg-amber-50/70">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-amber-600" />
              Cần quyền admin
            </CardTitle>
            <CardDescription>Trang này dùng để xem chi tiết hồ sơ học tập của học viên.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" asChild>
              <Link href="/dashboard">Quay lại dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (isLoading) {
    return (
      <Card className={adminPanelClass}>
        <CardHeader>
          <CardTitle className="text-[#3b2426]">Đang tải học viên</CardTitle>
          <CardDescription className="text-[#9a7472]">Hệ thống đang lấy hồ sơ, tiến độ và hoạt động từ database.</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  if (!learner || error) {
    return (
      <Card className={adminPanelClass}>
        <CardHeader>
          <CardTitle className="text-[#3b2426]">Không tìm thấy học viên</CardTitle>
          <CardDescription className="text-[#9a7472]">{error || "Học viên này chưa có trong database."}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" className={adminButtonClass} asChild>
            <Link href="/admin/learners">Quay lại danh sách</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Button variant="outline" className={adminButtonClass} asChild>
        <Link href="/admin/learners">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Quay lại học viên
        </Link>
      </Button>

      <section className="overflow-hidden rounded-[2rem] border border-[#f0c4c0] bg-[#fff7f5] p-6 shadow-sm shadow-[#e96f78]/10">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 border border-[#f0c4c0] bg-[#ffe5e2]">
              <AvatarImage src={learner.avatar} alt={learner.name} />
              <AvatarFallback className="bg-[#ffe5e2] text-lg font-semibold text-[#c94955]">
                {initials(learner.name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <Badge variant="outline" className={statusBadgeClass(learner.status)}>
                  {statusLabels[learner.status]}
                </Badge>
                <Badge className="rounded-full bg-[#ffe2e0] text-[#c94955] hover:bg-[#ffe2e0]">
                  {goalLabels[learner.goal]}
                </Badge>
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-[#3b2426]">{learner.name}</h1>
              <p className="mt-1 flex items-center gap-2 text-[#8f6260]">
                <Mail className="h-4 w-4" />
                {learner.email}
              </p>
            </div>
          </div>
          <div className="rounded-2xl border border-[#f0c4c0] bg-white/70 px-4 py-3 text-sm text-[#7a3f45]">
            <p className="font-semibold">Role</p>
            <p>{learner.role === "admin" ? "Admin" : "Learner"}</p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <InfoCard icon={CalendarDays} label="Ngày tạo tài khoản" value={formatDate(learner.createdAt)} />
        <InfoCard icon={Clock} label="Thời gian học mỗi ngày" value={`${learner.dailyMinutes} phút/ngày`} />
        <InfoCard icon={GraduationCap} label="Trình độ ban đầu" value={learner.initialLevel ? initialLevelLabels[learner.initialLevel] : "Chưa rõ"} />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className={adminPanelClass}>
          <CardHeader>
            <CardTitle className="text-[#3b2426]">Tiến độ học tập</CardTitle>
            <CardDescription className="text-[#9a7472]">Tổng quan tiến độ N5, từ vựng, ngữ pháp và quiz.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="rounded-2xl border border-[#f3d3cf] bg-[#fff7f5] p-4">
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="font-semibold text-[#3b2426]">N5 progress</span>
                <span className="text-[#d94f5b]">{learner.n5Progress}%</span>
              </div>
              <Progress value={learner.n5Progress} className="h-3 bg-[#ffe2e0] [&>div]:bg-[#e96f78]" />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Metric label="Từ đã học" value={`${learner.learnedVocabulary}/${learner.totalVocabulary}`} />
              <Metric label="Ngữ pháp đã học" value={`${learner.completedGrammar}/${learner.totalGrammar}`} />
              <Metric label="Lượt quiz" value={learner.quizAttempts.toString()} />
              <Metric label="Quiz TB" value={learner.quizAttempts ? `${learner.averageQuizScore}%` : "Chưa có"} />
              <Metric label="Từ nên ôn" value={Math.max(0, Math.round(learner.learnedVocabulary * 0.08)).toString()} />
              <Metric label="Hoạt động gần nhất" value={formatDate(learner.lastActiveAt)} />
            </div>
          </CardContent>
        </Card>

        <Card className={adminPanelClass}>
          <CardHeader>
            <CardTitle className="text-[#3b2426]">Hồ sơ học</CardTitle>
            <CardDescription className="text-[#9a7472]">Mục tiêu và nhịp học hiện tại.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <ProfileLine icon={Target} label="Mục tiêu học" value={goalLabels[learner.goal]} />
            <ProfileLine icon={Clock} label="Thời lượng mỗi ngày" value={`${learner.dailyMinutes} phút`} />
            <ProfileLine
              icon={BookOpen}
              label="Nền tảng ban đầu"
              value={learner.initialLevel ? initialLevelLabels[learner.initialLevel] : "Chưa rõ"}
            />
            <ProfileLine icon={HelpCircle} label="Lượt làm quiz" value={`${learner.quizAttempts} lần`} />
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className={adminPanelClass}>
          <CardHeader>
            <CardTitle className="text-[#3b2426]">Hoạt động gần đây</CardTitle>
            <CardDescription className="text-[#9a7472]">Các hoạt động học tập mới nhất được ghi nhận.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto rounded-2xl border border-[#f3d3cf] bg-white/80">
              <table className="w-full min-w-[680px] text-sm">
                <thead className="bg-[#fff0ef] text-left text-[#8f4742]">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Loại</th>
                    <th className="px-4 py-3 font-semibold">Chủ đề</th>
                    <th className="px-4 py-3 font-semibold">Kết quả</th>
                    <th className="px-4 py-3 font-semibold">Ngày</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f3d3cf] text-[#4f3a38]">
                  {learner.recentActivities.map((activity) => (
                    <tr key={activity.id} className="transition hover:bg-[#fff7f5]">
                      <td className="px-4 py-3">
                        <Badge variant="outline" className="border-[#f0c4c0] bg-[#fff7f5] text-[#c94955]">
                          {activityTypeLabels[activity.type]}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 font-medium text-[#3b2426]">{activity.topic}</td>
                      <td className="px-4 py-3">{activity.result}</td>
                      <td className="px-4 py-3">{formatDate(activity.date)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card className={adminPanelClass}>
          <CardHeader>
            <CardTitle className="text-[#3b2426]">Gợi ý bước tiếp theo</CardTitle>
            <CardDescription className="text-[#9a7472]">Các đề xuất phù hợp với tiến độ hiện tại.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {learner.recommendations.map((recommendation) => (
              <div key={recommendation.id} className="rounded-2xl border border-[#f3d3cf] bg-[#fff7f5] p-4">
                <div className="mb-2 flex items-center gap-2 text-[#d94f5b]">
                  <Sparkles className="h-4 w-4" />
                  <p className="font-semibold">{recommendation.title}</p>
                </div>
                <p className="text-sm leading-6 text-[#7a5b58]">{recommendation.description}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
    </div>
  )
}

function InfoCard({
  icon: Icon,
  label,
  value,
}: {
  icon: ComponentType<{ className?: string }>
  label: string
  value: string
}) {
  return (
    <Card className={adminPanelClass}>
      <CardContent className="flex items-center gap-4 p-5">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#ffe2e0] text-[#d94f5b]">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm text-[#9a7472]">{label}</p>
          <p className="font-semibold text-[#3b2426]">{value}</p>
        </div>
      </CardContent>
    </Card>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[#f3d3cf] bg-white/80 p-4">
      <p className="text-sm text-[#9a7472]">{label}</p>
      <p className="mt-1 text-xl font-bold text-[#3b2426]">{value}</p>
    </div>
  )
}

function ProfileLine({
  icon: Icon,
  label,
  value,
}: {
  icon: ComponentType<{ className?: string }>
  label: string
  value: string
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-[#f3d3cf] bg-[#fff7f5] p-4">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[#d94f5b]">
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <p className="text-sm text-[#9a7472]">{label}</p>
        <p className="font-semibold text-[#3b2426]">{value}</p>
      </div>
    </div>
  )
}
