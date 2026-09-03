"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, Card, Col, Descriptions, Divider, Empty, Form, Input, Modal, Pagination, Row, Segmented, Statistic, Table, Tag, Tooltip, Typography } from "antd";
import { ArrowRight, Check, Copy, ExternalLink, LogOut, Pencil, Sparkles, Video } from "lucide-react";

import { useCopyText } from "@/hooks/use-copy-text";
import { useUserStore } from "@/stores/use-user-store";
import { usePasswordDialogStore } from "@/stores/use-password-dialog-store";
import { resolveImageUrl } from "@/services/image-storage";
import { resolveMediaUrl } from "@/services/file-storage";
import type { CreditLog } from "@/services/api/account";
import { useAccount } from "./use-account";

const creditTypeLabels: Record<string, string> = { admin_adjust: "后台调整", ai_consume: "模型消费", ai_refund: "失败返还" };

export default function AccountPage() {
    const router = useRouter();
    const copyText = useCopyText();
    const user = useUserStore((state) => state.user);
    const clearSession = useUserStore((state) => state.clearSession);
    const openPasswordDialog = usePasswordDialogStore((state) => state.openPasswordDialog);
    const { profile, logs, summaryLogs, totalLogs, imageCount, videoCount, canvasRecords, canvasImageCount, canvasVideoCount, page, pageSize, isLoading, isSavingProfile, saveProfile, changePage } = useAccount();
    const [profileForm] = Form.useForm();
    const [profileOpen, setProfileOpen] = useState(false);
    const [activeCanvasId, setActiveCanvasId] = useState("");
    const account = profile || user;

    useEffect(() => {
        if (profile) profileForm.setFieldsValue({ displayName: profile.displayName, email: profile.email });
    }, [profile, profileForm]);

    const summary = useMemo(() => {
        const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
        return summaryLogs.reduce((result, log) => {
            if (!log.createdAt || Date.parse(log.createdAt) < cutoff) return result;
            if (log.type === "ai_consume") result.consumed += Math.abs(log.amount);
            if (log.type === "ai_refund") result.refunded += Math.max(0, log.amount);
            if (log.type === "admin_adjust") result.adjusted += log.amount;
            return result;
        }, { consumed: 0, refunded: 0, adjusted: 0 });
    }, [summaryLogs]);

    const canvasGroups = useMemo(() => {
        const groups = new Map<string, { projectId: string; projectTitle: string; records: CanvasMediaRecord[] }>();
        canvasRecords.forEach((record) => {
            const group = groups.get(record.projectId) || { projectId: record.projectId, projectTitle: record.projectTitle, records: [] };
            group.records.push(record);
            groups.set(record.projectId, group);
        });
        return Array.from(groups.values());
    }, [canvasRecords]);

    useEffect(() => {
        if (!canvasGroups.length) {
            setActiveCanvasId("");
            return;
        }
        if (!canvasGroups.some((group) => group.projectId === activeCanvasId)) setActiveCanvasId(canvasGroups[0].projectId);
    }, [activeCanvasId, canvasGroups]);

    if (!account) return null;
    const displayName = account.displayName || account.username;
    const roleLabel = account.role === "admin" ? "管理员" : "创作者";
    const hasCanvasImages = canvasImageCount > 0;
    const hasCanvasVideos = canvasVideoCount > 0;
    const recordCards = [
        ...(!hasCanvasImages ? [{ icon: <Sparkles className="size-5" />, title: "图片历史", count: imageCount, href: "/image" }] : []),
        ...(!hasCanvasVideos ? [{ icon: <Video className="size-5" />, title: "视频历史", count: videoCount, href: "/video" }] : []),
        { icon: <ExternalLink className="size-5" />, title: "我的素材", href: "/asset-library" },
        { icon: <ArrowRight className="size-5" />, title: "我的画布", href: "/canvas" },
    ];
    const recordColSpan = recordCards.length === 3 ? 8 : recordCards.length <= 2 ? 12 : 6;
    const inviteUrl = typeof window === "undefined" ? "" : `${window.location.origin}/?aff=${encodeURIComponent(profile?.affCode || "")}`;
    const profileItems = [
        { key: "username", label: "用户名", children: account.username || "-" },
        { key: "email", label: "邮箱", children: profile?.email || "未填写" },
        { key: "role", label: "账号角色", children: <Tag color={account.role === "admin" ? "gold" : undefined}>{roleLabel}</Tag> },
        { key: "created", label: "注册时间", children: formatDate(profile?.createdAt || account.createdAt) },
        { key: "lastLogin", label: "最近登录", children: formatDate(profile?.lastLoginAt) },
        { key: "binding", label: "第三方绑定", children: <span className="inline-flex flex-wrap items-center gap-2"><Tag icon={profile?.githubId ? <Check className="size-3" /> : undefined}>GitHub {profile?.githubId ? "已绑定" : "未绑定"}</Tag><Tag icon={profile?.wechatId ? <Check className="size-3" /> : undefined}>微信 {profile?.wechatId ? "已绑定" : "未绑定"}</Tag></span> },
    ];
    const creditColumns = [
        { title: "时间", dataIndex: "createdAt", width: 170, render: (value: string) => <Typography.Text type="secondary">{formatDate(value, true)}</Typography.Text> },
        { title: "类型", dataIndex: "type", width: 120, render: (value: string) => <Tag>{creditTypeLabels[value] || value || "-"}</Tag> },
        { title: "变动", dataIndex: "amount", width: 90, render: (value: number) => <Typography.Text type={value >= 0 ? "success" : "danger"} strong>{value > 0 ? `+${value}` : value}</Typography.Text> },
        { title: "余额", dataIndex: "balance", width: 100, render: (value: number) => <span className="tabular-nums">{value.toLocaleString()}</span> },
        { title: "备注", dataIndex: "remark", ellipsis: true, render: (value: string) => <Typography.Text type="secondary">{value || "-"}</Typography.Text> },
        { title: <Tooltip title="预留的业务追踪编号；业务写入后可关联生成任务、订单或后台操作，未关联时显示“-”，不是账号 ID。"><span className="cursor-help border-b border-dashed border-border">关联 ID</span></Tooltip>, dataIndex: "relatedId", width: 170, ellipsis: true, render: (value: string) => value ? <Typography.Text copyable={{ text: value }} ellipsis>{value}</Typography.Text> : "-" },
    ];
    const submitProfile = async () => {
        const values = await profileForm.validateFields();
        await saveProfile(values);
        setProfileOpen(false);
    };
    const logout = () => {
        clearSession();
        router.push("/");
    };

    return (
        <main className="h-full overflow-y-auto bg-background text-foreground">
            <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-8 lg:py-10">
                <header className="flex flex-wrap items-end justify-between gap-4 border-b border-border pb-6"><div><p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">ACCOUNT</p><h1 className="mt-3 text-3xl font-semibold tracking-tight">个人中心</h1><p className="mt-2 text-sm text-muted-foreground">管理你的创作身份、算力点与账户记录。</p></div><div className="flex items-center gap-2"><Button onClick={openPasswordDialog}>修改密码</Button><Button icon={<LogOut className="size-4" />} onClick={logout}>退出登录</Button></div></header>
                <Card variant="borderless" className="overflow-hidden !bg-card shadow-sm"><div className="flex flex-wrap items-start justify-between gap-5"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h2 className="truncate text-xl font-semibold">{displayName}</h2><Tag>{roleLabel}</Tag></div><p className="mt-1 text-sm text-muted-foreground">@{account.username}</p></div><Button icon={<Pencil className="size-4" />} onClick={() => setProfileOpen(true)}>编辑资料</Button></div><Divider className="!my-5" /><Descriptions className="account-descriptions" column={{ xs: 1, sm: 2, lg: 3 }} items={profileItems} />{profile?.affCode ? <div className="mt-5 rounded-xl border border-border bg-muted p-4"><div className="flex flex-wrap items-center justify-between gap-3"><div><div className="text-xs text-muted-foreground">我的邀请码</div><div className="mt-1 flex items-center gap-2 text-lg font-semibold tracking-[0.16em]">{profile.affCode}<Button type="text" size="small" icon={<Copy className="size-3.5" />} onClick={() => copyText(profile.affCode, "邀请码已复制")} /></div></div><div className="text-right"><div className="text-xs text-muted-foreground">已邀请</div><div className="mt-1 text-lg font-semibold tabular-nums">{profile.affCount} 人</div></div></div>{inviteUrl ? <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground"><span className="min-w-0 flex-1 truncate">{inviteUrl}</span><Button type="text" size="small" icon={<Copy className="size-3.5" />} onClick={() => copyText(inviteUrl, "邀请链接已复制")} /></div> : null}</div> : null}</Card>
                <section><div className="mb-3"><h2 className="text-lg font-semibold">算力概览</h2><p className="mt-1 text-xs text-muted-foreground">统计最近 30 天的账户变动</p></div><Row gutter={[12, 12]}><Col xs={24} sm={12} lg={6}><Card variant="borderless" className="h-full !bg-accent !text-accent-foreground"><Statistic title={<span className="text-accent-foreground/65">当前余额</span>} value={account.credits} suffix="点" valueStyle={{ color: "var(--accent-foreground)", fontWeight: 650 }} /></Card></Col><Col xs={24} sm={12} lg={6}><Card variant="borderless" className="h-full !bg-card"><Statistic title="模型消耗" value={summary.consumed} suffix="点" /></Card></Col><Col xs={24} sm={12} lg={6}><Card variant="borderless" className="h-full !bg-card"><Statistic title="失败返还" value={summary.refunded} suffix="点" /></Card></Col><Col xs={24} sm={12} lg={6}><Card variant="borderless" className="h-full !bg-card"><Statistic title="后台调整" value={summary.adjusted} suffix="点" /></Card></Col></Row></section>
                <Card variant="borderless" className="!bg-card" title={<div><span className="font-semibold">算力流水</span><span className="ml-2 text-xs font-normal text-muted-foreground">共 {totalLogs} 条</span></div>}><Table<CreditLog> rowKey="id" columns={creditColumns} dataSource={logs} loading={isLoading} pagination={false} scroll={{ x: 760 }} locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无算力流水" /> }} />{totalLogs ? <div className="mt-5 flex justify-end"><Pagination current={page} pageSize={pageSize} total={totalLogs} showSizeChanger={false} onChange={changePage} /></div> : null}<p className="mt-3 text-xs text-muted-foreground">关联 ID 是预留的业务追踪编号；具体业务写入后才会显示，未关联时为“-”。</p></Card>
                <section><div className="mb-3"><h2 className="text-lg font-semibold">创作记录</h2><p className="mt-1 text-xs text-muted-foreground">按画布切换查看已生成的图片和视频。</p></div><Row gutter={[12, 12]}>{recordCards.map((card) => <Col key={card.title} xs={24} sm={12} lg={recordColSpan}><RecordCard {...card} /> </Col>)}</Row>{canvasGroups.length ? <div className="mt-4 space-y-3"><Segmented block value={activeCanvasId || canvasGroups[0].projectId} onChange={(value) => setActiveCanvasId(String(value))} options={canvasGroups.map((group) => ({ label: <span className="inline-flex max-w-full items-center gap-2"><span className="max-w-[14rem] truncate" title={group.projectTitle}>{group.projectTitle || "未命名画布"}</span><span className="text-xs opacity-60">{group.records.length}</span></span>, value: group.projectId }))} />{(() => { const group = canvasGroups.find((item) => item.projectId === activeCanvasId) || canvasGroups[0]; return <div className="rounded-xl border border-border bg-card p-4"><button type="button" onClick={() => router.push(`/canvas/${group.projectId}`)} className="group flex w-full items-center justify-between gap-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><span className="min-w-0"><span className="block truncate text-sm font-semibold" title={group.projectTitle}>{group.projectTitle || "未命名画布"}</span><span className="mt-1 block text-xs text-muted-foreground">{group.records.length} 条媒体记录，点击标题进入画布</span></span><ArrowRight className="size-4 shrink-0 text-muted-foreground transition group-hover:translate-x-0.5" /></button><div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{group.records.map((record) => <CanvasMediaCard key={record.id} record={record} />)}</div></div>; })()}</div> : <div className="mt-4 rounded-xl border border-dashed border-border bg-card py-10"><Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="画布中还没有生成的图片或视频" /></div>}</section>
            </div>

            <Modal title="编辑资料" open={profileOpen} onCancel={() => setProfileOpen(false)} onOk={() => void submitProfile()} okText="保存" cancelText="取消" confirmLoading={isSavingProfile} destroyOnHidden><Form form={profileForm} layout="vertical" className="pt-3"><Form.Item name="displayName" label="昵称" rules={[{ max: 40, message: "昵称不能超过 40 个字符" }]}><Input placeholder="请输入昵称" /></Form.Item><Form.Item name="email" label="邮箱" rules={[{ type: "email", message: "请输入有效邮箱" }]}><Input placeholder="用于接收账户通知" /></Form.Item></Form></Modal>
        </main>
    );
}

type CanvasMediaRecord = { id: string; projectId: string; projectTitle: string; type: "image" | "video"; title: string; content: string; storageKey: string; updatedAt: string };

function CanvasMediaCard({ record }: { record: CanvasMediaRecord }) {
    const [src, setSrc] = useState(record.content);
    useEffect(() => {
        let active = true;
        const resolve = record.type === "video" ? resolveMediaUrl(record.storageKey, record.content) : resolveImageUrl(record.storageKey, record.content);
        void resolve.then((url) => { if (active && url) setSrc(url); }).catch(() => undefined);
        return () => { active = false; };
    }, [record.content, record.storageKey, record.type]);
    return <div className="overflow-hidden rounded-lg border border-border bg-muted/40"><div className="relative aspect-[4/3] overflow-hidden bg-muted">{record.type === "video" ? <video src={src} muted preload="metadata" className="h-full w-full object-cover" /> : <img src={src} alt={record.title} className="h-full w-full object-cover" />}<span className="absolute left-2 top-2 rounded-md bg-background/80 px-2 py-1 text-[10px] text-foreground backdrop-blur">{record.type === "video" ? "视频" : "图片"}</span></div><div className="min-w-0 p-3"><p className="truncate text-sm font-medium" title={record.title}>{record.title}</p></div></div>;
}

function RecordCard({ icon, title, count, href }: { icon: ReactNode; title: string; count?: number; href: string }) {
    return <Link href={href} className="group block h-full rounded-xl border border-border bg-card p-4 transition hover:-translate-y-0.5 hover:border-foreground/40 hover:shadow-md"><div className="flex items-center justify-between gap-3"><span className="grid size-9 place-items-center rounded-lg bg-muted text-muted-foreground">{icon}</span><ArrowRight className="size-4 text-muted-foreground transition group-hover:translate-x-0.5" /></div><div className="mt-5 flex items-end justify-between gap-2"><span className="font-medium">{title}</span>{count !== undefined ? <span className="text-xs text-muted-foreground">{count} 条</span> : null}</div></Link>;
}

function formatDate(value?: string, withTime = false) {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";
    return date.toLocaleString("zh-CN", withTime ? { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" } : { year: "numeric", month: "2-digit", day: "2-digit" });
}
