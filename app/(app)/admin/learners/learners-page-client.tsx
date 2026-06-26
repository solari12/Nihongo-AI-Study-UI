"use client"

import Link from "next/link"
import type { ComponentType } from "react"
import { useEffect, useMemo, useState } from "react"
import { ArrowUpRight, Search, Sparkles, UserCheck, UserRound, UsersRound, X } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  getLearnerAdminStats,
  goalLabels,
  initialLevelLabels,
  statusLabels,
  type LearnerAdminSummary,
  type LearnerGoal,
  type LearnerStatus,
} from "@/lib/admin/learner-management"

type StatusFilter = "all" | LearnerStatus
type GoalFilter = "all" | LearnerGoal

const adminButtonClass =
  "rounded-full border-[#f0c4c0] bg-white/80 text-[#7a3f45] shadow-sm hover:bg-[#fff0ef] hover:text-[#c94955]"

const adminPrimaryButtonClass =
  "rounded-full bg-[#e96f78] text-white shadow-sm shadow-[#e96f78]/25 hover:bg-[#d94f5b]"

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

export function LearnersPageClient({ learners }: { learners: LearnerAdminSummary[] }) {
  const [query, setQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")
  const [goalFilter, setGoalFilter] = useState<GoalFilter>("all")

  const filteredLearners = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    return learners.filter((learner) => {
      const matchesQuery =
        !normalizedQuery ||
        learner.name.toLowerCase().includes(normalizedQuery) ||
        learner.email.toLowerCase().includes(normalizedQuery)
      const matchesStatus = statusFilter === "all" || learner.status === statusFilter
      const matchesGoal = goalFilter === "all" || learner.goal === goalFilter

      return matchesQuery && matchesStatus && matchesGoal
    })
  }, [goalFilter, learners, query, statusFilter])

  useEffect(() => {
    if (learners.length && !filteredLearners.length && !query.trim() && statusFilter !== "all") {
      setStatusFilter("all")
    }
  }, [filteredLearners.length, learners.length, query, statusFilter])

  const hasFilters = Boolean(query.trim()) || statusFilter !== "all" || goalFilter !== "all"
  const visibleLearners = filteredLearners.length || hasFilters ? filteredLearners : learners
  const stats = useMemo(() => getLearnerAdminStats(learners), [learners])

  const resetFilters = () => {
    setQuery("")
    setStatusFilter("all")
    setGoalFilter("all")
  }

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[2rem] border border-[#f0c4c0] bg-[#fff7f5] p-6 shadow-sm shadow-[#e96f78]/10">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <Badge className="mb-3 rounded-full bg-[#ffe2e0] px-3 py-1 text-[#c94955] hover:bg-[#ffe2e0]">
              Admin
            </Badge>
            <h1 className="text-3xl font-bold tracking-tight text-[#3b2426]">Quản lý học viên</h1>
            <p className="mt-2 max-w-2xl text-[#8f6260]">
              Theo dõi hồ sơ, tiến độ và kết quả học tập của học viên.
            </p>
          </div>
          <Button className={adminPrimaryButtonClass} asChild>
            <Link href="/admin">Quản trị nội dung</Link>
          </Button>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard icon={UsersRound} label="Tổng học viên" value={stats.totalLearners.toString()} />
        <SummaryCard icon={UserCheck} label="Đang học" value={stats.activeCount.toString()} />
        <SummaryCard icon={UserRound} label="Ít hoạt động" value={stats.lowActivityCount.toString()} />
        <SummaryCard icon={Sparkles} label="Điểm quiz trung bình" value={`${stats.averageQuizScore}%`} />
      </section>

      <Card className={adminPanelClass}>
        <CardHeader className="gap-4">
          <div>
            <CardTitle className="text-[#3b2426]">Danh sách học viên</CardTitle>
            <CardDescription className="text-[#9a7472]">
              Đang hiển thị dữ liệu học tập thật từ database.
            </CardDescription>
          </div>
          <div className="grid gap-3 lg:grid-cols-[minmax(220px,1fr)_190px_220px_auto]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#b98582]" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Tìm tên hoặc email"
                className="rounded-full border-[#f0c4c0] bg-white/80 pl-9 text-[#3b2426] placeholder:text-[#b98582]"
              />
            </div>
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as StatusFilter)}>
              <SelectTrigger className="w-full rounded-full border-[#f0c4c0] bg-white/80 text-[#7a3f45]">
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả trạng thái</SelectItem>
                <SelectItem value="active">Đang học</SelectItem>
                <SelectItem value="inactive">Ít hoạt động</SelectItem>
                <SelectItem value="new">Mới</SelectItem>
              </SelectContent>
            </Select>
            <Select value={goalFilter} onValueChange={(value) => setGoalFilter(value as GoalFilter)}>
              <SelectTrigger className="w-full rounded-full border-[#f0c4c0] bg-white/80 text-[#7a3f45]">
                <SelectValue placeholder="Mục tiêu học" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả mục tiêu</SelectItem>
                <SelectItem value="JLPT_N5">JLPT N5</SelectItem>
                <SelectItem value="COMMUNICATION">Giao tiếp</SelectItem>
                <SelectItem value="FROM_ZERO">Bắt đầu từ số 0</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" className={adminButtonClass} onClick={resetFilters}>
              <X className="mr-2 h-4 w-4" />
              Bỏ lọc
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-2xl border border-[#f3d3cf] bg-white/80">
            <table className="w-full min-w-[1120px] text-sm">
              <thead className="bg-[#fff0ef] text-left text-[#8f4742]">
                <tr>
                  <th className="px-4 py-3 font-semibold">Học viên</th>
                  <th className="px-4 py-3 font-semibold">Mục tiêu học</th>
                  <th className="px-4 py-3 font-semibold">Trình độ hiện tại</th>
                  <th className="px-4 py-3 font-semibold">Tiến độ N5</th>
                  <th className="px-4 py-3 font-semibold">Từ đã học</th>
                  <th className="px-4 py-3 font-semibold">Ngữ pháp đã học</th>
                  <th className="px-4 py-3 font-semibold">Quiz TB</th>
                  <th className="px-4 py-3 font-semibold">Ngày học gần nhất</th>
                  <th className="px-4 py-3 font-semibold">Trạng thái</th>
                  <th className="px-4 py-3 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f3d3cf] text-[#4f3a38]">
                {visibleLearners.map((learner) => (
                  <tr key={learner.id} className="transition hover:bg-[#fff7f5]">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 border border-[#f0c4c0] bg-[#ffe5e2]">
                          <AvatarImage src={learner.avatar} alt={learner.name} />
                          <AvatarFallback className="bg-[#ffe5e2] text-xs font-semibold text-[#c94955]">
                            {initials(learner.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold text-[#3b2426]">{learner.name}</p>
                          <p className="text-xs text-[#9a7472]">{learner.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">{goalLabels[learner.goal]}</td>
                    <td className="px-4 py-4">{learner.initialLevel ? initialLevelLabels[learner.initialLevel] : "Chưa rõ"}</td>
                    <td className="px-4 py-4">
                      <div className="min-w-[120px] space-y-2">
                        <div className="flex justify-between text-xs text-[#9a7472]">
                          <span>N5</span>
                          <span>{learner.n5Progress}%</span>
                        </div>
                        <Progress value={learner.n5Progress} className="h-2 bg-[#ffe2e0] [&>div]:bg-[#e96f78]" />
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      {learner.learnedVocabulary}/{learner.totalVocabulary}
                    </td>
                    <td className="px-4 py-4">
                      {learner.completedGrammar}/{learner.totalGrammar}
                    </td>
                    <td className="px-4 py-4">{learner.quizAttempts ? `${learner.averageQuizScore}%` : "Chưa có"}</td>
                    <td className="px-4 py-4">{formatDate(learner.lastActiveAt)}</td>
                    <td className="px-4 py-4">
                      <Badge variant="outline" className={statusBadgeClass(learner.status)}>
                        {statusLabels[learner.status]}
                      </Badge>
                    </td>
                    <td className="px-4 py-4">
                      <Button size="sm" variant="outline" className={adminButtonClass} asChild>
                        <Link href={`/admin/learners/${learner.id}`}>
                          Xem chi tiết
                          <ArrowUpRight className="ml-2 h-4 w-4" />
                        </Link>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {hasFilters && !filteredLearners.length && (
            <div className="mt-4 rounded-2xl border border-dashed border-[#f0c4c0] bg-[#fff7f5] p-8 text-center text-[#8f6260]">
              Không có học viên khớp bộ lọc hiện tại.
              <Button variant="outline" className={`${adminButtonClass} ml-3`} onClick={resetFilters}>
                Bỏ lọc
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function SummaryCard({
  icon: Icon,
  label,
  value,
}: {
  icon: ComponentType<{ className?: string }>
  label: string
  value: string
}) {
  return (
    <Card className="border-[#f0c4c0] bg-white/90 shadow-sm shadow-[#e96f78]/10">
      <CardContent className="flex items-center gap-4 p-5">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#ffe2e0] text-[#d94f5b]">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm text-[#9a7472]">{label}</p>
          <p className="text-2xl font-bold text-[#3b2426]">{value}</p>
        </div>
      </CardContent>
    </Card>
  )
}
