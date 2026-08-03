"use client";

import { DeleteOutlined, EyeOutlined, ReloadOutlined, SaveOutlined, SearchOutlined } from "@ant-design/icons";
import { App, Button, Card, Col, Flex, Form, Input, InputNumber, Modal, Row, Space, Switch, Table, Tag, Typography } from "antd";
import { useEffect, useMemo, useState } from "react";

import { deleteAdminAICallLogs, fetchAdminAICallLogs, fetchAdminSettings, saveAdminSettings, type AdminAICallLog, type AdminSettings } from "@/services/api/admin";
import { useUserStore } from "@/stores/use-user-store";

type LogSettingsFormValues = {
    localDirectReportEnabled: boolean;
    cleanupEnabled: boolean;
    retentionDays: number;
    cron: string;
};

export default function AdminAICallLogsPage() {
    const token = useUserStore((state) => state.token);
    const { message } = App.useApp();
    const [keyword, setKeyword] = useState("");
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(20);
    const [total, setTotal] = useState(0);
    const [logs, setLogs] = useState<AdminAICallLog[]>([]);
    const [loading, setLoading] = useState(false);
    const [clearDays, setClearDays] = useState(7);
    const [clearing, setClearing] = useState(false);
    const [detail, setDetail] = useState<{ title: string; value: string } | null>(null);
    const [logSettingsForm] = Form.useForm<LogSettingsFormValues>();
    const [logSettingsLoading, setLogSettingsLoading] = useState(false);
    const [logSettingsSaving, setLogSettingsSaving] = useState(false);

    const loadLogs = async () => {
        if (!token) return;
        setLoading(true);
        try {
            const result = await fetchAdminAICallLogs(token, { keyword, page, pageSize });
            setLogs(result.items);
            setTotal(result.total);
        } catch (error) {
            message.error(error instanceof Error ? error.message : "读取 AI 调用日志失败");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void loadLogs();
    }, [token, page, pageSize]);

    const loadLogSettings = async () => {
        if (!token) return;
        setLogSettingsLoading(true);
        try {
            const settings = await fetchAdminSettings(token);
            logSettingsForm.setFieldsValue({
                localDirectReportEnabled: settings.private.aiLog?.localDirectReportEnabled === true,
                cleanupEnabled: settings.private.aiLog?.cleanup?.enabled === true,
                retentionDays: Number(settings.private.aiLog?.cleanup?.retentionDays) || 14,
                cron: settings.private.aiLog?.cleanup?.cron || "0 3 * * *",
            });
        } catch {
            // 忽略，主表格仍可用
        } finally {
            setLogSettingsLoading(false);
        }
    };

    useEffect(() => {
        void loadLogSettings();
    }, [token]);

    const saveLogSettings = async () => {
        if (!token) return;
        const value = await logSettingsForm.validateFields();
        setLogSettingsSaving(true);
        try {
            const settings = await fetchAdminSettings(token);
            const nextSettings: AdminSettings = {
                ...settings,
                private: {
                    ...settings.private,
                    aiLog: {
                        localDirectReportEnabled: value.localDirectReportEnabled,
                        cleanup: {
                            enabled: value.cleanupEnabled,
                            retentionDays: value.retentionDays,
                            cron: value.cron,
                        },
                    },
                },
            };
            await saveAdminSettings(token, nextSettings);
            message.success("已保存");
        } catch (error) {
            message.error(error instanceof Error ? error.message : "保存日志设置失败");
        } finally {
            setLogSettingsSaving(false);
        }
    };

    const clearLogs = async () => {
        if (!token) return;
        setClearing(true);
        try {
            const result = await deleteAdminAICallLogs(token, clearDays);
            message.success(`已清理 ${result.removedFiles} 个日志文件`);
            setPage(1);
            await loadLogs();
        } catch (error) {
            message.error(error instanceof Error ? error.message : "清理 AI 调用日志失败");
        } finally {
            setClearing(false);
        }
    };

    const columns = useMemo(
        () => [
            { title: "时间", dataIndex: "createdAt", width: 170, render: (value: string) => formatTime(value) },
            { title: "用户", dataIndex: "userDisplayName", width: 150, render: (_: string, item: AdminAICallLog) => item.userDisplayName || item.userId || "-" },
            { title: "接口", dataIndex: "endpoint", width: 170 },
            { title: "模型", dataIndex: "model", width: 180, ellipsis: true },
            { title: "渠道", dataIndex: "channelName", width: 150, ellipsis: true, render: (_: string, item: AdminAICallLog) => item.channelName || item.channelId || "-" },
            { title: "状态", dataIndex: "status", width: 90, render: (status: number) => <Tag color={status >= 200 && status < 400 ? "success" : "error"}>{status || "失败"}</Tag> },
            { title: "耗时", dataIndex: "durationMs", width: 110, render: (value: number) => formatDuration(value) },
            { title: "扣点", dataIndex: "credits", width: 80 },
            {
                title: "操作",
                key: "actions",
                width: 180,
                fixed: "right" as const,
                render: (_: unknown, item: AdminAICallLog) => (
                    <Space size={6}>
                        <Button size="small" icon={<EyeOutlined />} onClick={() => setDetail({ title: "请求详情", value: item.requestBody })}>
                            请求详情
                        </Button>
                        <Button size="small" icon={<EyeOutlined />} onClick={() => setDetail({ title: "返回详情", value: item.responseBody || item.error })}>
                            返回详情
                        </Button>
                    </Space>
                ),
            },
        ],
        [],
    );

    return (
        <main className="p-3 md:p-6">
            <Flex vertical gap={16} className="w-full">
                <Card variant="borderless">
                    <Flex justify="space-between" align="center" gap={16} wrap style={{ marginBottom: 16 }}>
                        <Typography.Text strong>日志设置</Typography.Text>
                        <Space>
                            <Button icon={<ReloadOutlined />} loading={logSettingsLoading} onClick={() => void loadLogSettings()}>
                                刷新
                            </Button>
                            <Button type="primary" icon={<SaveOutlined />} loading={logSettingsSaving} onClick={() => void saveLogSettings()}>
                                保存
                            </Button>
                        </Space>
                    </Flex>
                    <Form form={logSettingsForm} layout="vertical" requiredMark={false}>
                        <Row gutter={16}>
                            <Col xs={24} md={6}>
                                <Form.Item name="localDirectReportEnabled" label="本地直连日志上报" valuePropName="checked" extra="关闭后本地直连不上报；云端渠道仍默认记录。">
                                    <Switch />
                                </Form.Item>
                            </Col>
                            <Col xs={24} md={6}>
                                <Form.Item name="cleanupEnabled" label="开启自动清理" valuePropName="checked" extra="日志按天写入本地文件，不保存到 SQLite。">
                                    <Switch />
                                </Form.Item>
                            </Col>
                            <Col xs={24} md={6}>
                                <Form.Item name="retentionDays" label="保留天数" extra="默认保留 14 天，超过后定时删除对应日期日志文件。">
                                    <InputNumber min={1} precision={0} className="!w-full" />
                                </Form.Item>
                            </Col>
                            <Col xs={24} md={6}>
                                <Form.Item name="cron" label="清理 Cron">
                                    <Input placeholder="0 3 * * *" />
                                </Form.Item>
                            </Col>
                        </Row>
                    </Form>
                </Card>
                <Card variant="borderless">
                    <Form
                        layout="vertical"
                        onFinish={() => {
                            setPage(1);
                            void loadLogs();
                        }}
                    >
                        <div className="flex flex-wrap items-center gap-3">
                            <Input className="min-w-[280px] flex-1 lg:max-w-[460px]" value={keyword} placeholder="搜索用户、模型、渠道、接口或错误" onChange={(event) => setKeyword(event.target.value)} />
                            <Button htmlType="submit" type="primary" icon={<SearchOutlined />}>
                                查询
                            </Button>
                            <Button icon={<ReloadOutlined />} onClick={() => { setKeyword(""); setPage(1); void loadLogs(); }}>
                                重置
                            </Button>
                            <div className="flex h-8 items-center gap-2">
                                <Typography.Text className="whitespace-nowrap text-sm">清理超过</Typography.Text>
                                <InputNumber min={1} value={clearDays} className="!w-24" onChange={(value) => setClearDays(Number(value) || 7)} />
                                <Typography.Text type="secondary" className="shrink-0">天前</Typography.Text>
                            </div>
                            <Button danger icon={<DeleteOutlined />} loading={clearing} onClick={() => void clearLogs()} className="ml-0 lg:ml-auto">
                                清理旧日志
                            </Button>
                        </div>
                    </Form>
                </Card>
                <Card variant="borderless" title={<span>AI 调用日志 <Tag>{total} 条</Tag></span>}>
                    <Table
                        rowKey="id"
                        size="small"
                        loading={loading}
                        columns={columns}
                        dataSource={logs}
                        scroll={{ x: 1280 }}
                        pagination={{
                            current: page,
                            pageSize,
                            total,
                            showSizeChanger: true,
                            onChange: (nextPage, nextPageSize) => {
                                setPage(nextPage);
                                setPageSize(nextPageSize);
                            },
                        }}
                    />
                </Card>
            </Flex>
            <Modal title={detail?.title || "AI 调用详情"} open={Boolean(detail)} width="min(1100px, 92vw)" footer={null} onCancel={() => setDetail(null)} destroyOnHidden>
                <LogBlock value={detail?.value || ""} />
            </Modal>
        </main>
    );
}

function LogBlock({ value }: { value: string }) {
    return (
        <pre
            className="max-h-[72vh] whitespace-pre-wrap break-words overflow-auto rounded-lg p-3 text-xs leading-5"
            style={{
                border: "1px solid var(--ant-color-border)",
                background: "var(--ant-color-fill-quaternary)",
                color: "var(--ant-color-text)",
            }}
        >
            {value || "-"}
        </pre>
    );
}

function formatTime(value: string) {
    if (!value) return "-";
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

function formatDuration(value: number) {
    if (!Number.isFinite(value) || value <= 0) return "-";
    return value >= 1000 ? `${(value / 1000).toFixed(2)}s` : `${value}ms`;
}
