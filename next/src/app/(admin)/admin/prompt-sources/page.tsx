"use client";

import { DeleteOutlined, EditOutlined, ExportOutlined, PlusOutlined, ReloadOutlined, SaveOutlined, SyncOutlined } from "@ant-design/icons";
import { ProTable, type ProColumns } from "@ant-design/pro-components";
import { App, Button, Card, Col, Flex, Form, Input, InputNumber, Modal, Row, Space, Switch, Tag, Tooltip, Typography } from "antd";
import dayjs from "dayjs";
import { useEffect, useState } from "react";

import type { PromptSource, PromptSourceInput, PromptSourceUpdate } from "@/services/api/admin-prompt-sources";
import { fetchAdminSettings, saveAdminSettings } from "@/services/api/admin";
import { useUserStore } from "@/stores/use-user-store";
import { useAdminPromptSources } from "./use-admin-prompt-sources";

type SourceFormValues = PromptSourceInput & { sortOrder: number };

const defaultFormValues: SourceFormValues = {
    source: "",
    name: "",
    description: "",
    githubUrl: "",
    remote: false,
    enabled: true,
    sortOrder: 0,
};

function formatTime(value: string) {
    return value ? dayjs(value).format("YYYY-MM-DD HH:mm:ss") : "-";
}

export default function AdminPromptSourcesPage() {
    const { sources, isLoading, isSyncing, createSource, updateSource, deleteSource, syncSource, syncAllSources, refresh } = useAdminPromptSources();
    const token = useUserStore((state) => state.token);
    const { message } = App.useApp();
    const [form] = Form.useForm<SourceFormValues>();
    const [editingSource, setEditingSource] = useState<PromptSource | null>(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [deletingSource, setDeletingSource] = useState<PromptSource | null>(null);
    const isEditing = Boolean(editingSource?.source);
    const [promptSyncForm] = Form.useForm<{ enabled: boolean; cron: string }>();
    const [promptSyncLoading, setPromptSyncLoading] = useState(false);
    const [promptSyncSaving, setPromptSyncSaving] = useState(false);

    const loadPromptSync = async () => {
        if (!token) return;
        setPromptSyncLoading(true);
        try {
            const settings = await fetchAdminSettings(token);
            promptSyncForm.setFieldsValue({
                enabled: settings.private.promptSync?.enabled !== false,
                cron: settings.private.promptSync?.cron || "0 0 * * *",
            });
        } catch {
            // 忽略，主表格仍可用
        } finally {
            setPromptSyncLoading(false);
        }
    };

    const savePromptSync = async () => {
        if (!token) return;
        const value = await promptSyncForm.validateFields();
        setPromptSyncSaving(true);
        try {
            const settings = await fetchAdminSettings(token);
            await saveAdminSettings(token, {
                ...settings,
                private: {
                    ...settings.private,
                    promptSync: { enabled: value.enabled, cron: value.cron },
                },
            });
            message.success("已保存");
        } catch (error) {
            message.error(error instanceof Error ? error.message : "保存失败");
        } finally {
            setPromptSyncSaving(false);
        }
    };

    useEffect(() => {
        void loadPromptSync();
    }, [token]);

    useEffect(() => {
        if (!isFormOpen) return;
        if (editingSource) {
            form.setFieldsValue({
                source: editingSource.source,
                name: editingSource.name,
                description: editingSource.description,
                githubUrl: editingSource.githubUrl,
                remote: editingSource.remote,
                enabled: editingSource.enabled,
                sortOrder: editingSource.sortOrder,
            });
        } else {
            form.setFieldsValue(defaultFormValues);
        }
    }, [editingSource, form, isFormOpen]);

    const openCreate = () => {
        setEditingSource(null);
        setIsFormOpen(true);
    };

    const openEdit = (item: PromptSource) => {
        setEditingSource(item);
        setIsFormOpen(true);
    };

    const submitForm = async () => {
        const value = await form.validateFields();
        if (isEditing && editingSource) {
            const payload: PromptSourceUpdate = {
                name: value.name,
                description: value.description,
                enabled: value.enabled,
                sortOrder: value.sortOrder,
            };
            await updateSource(editingSource.source, payload);
        } else {
            await createSource(value);
        }
        setIsFormOpen(false);
    };

    const toggleEnabled = async (item: PromptSource, enabled: boolean) => {
        await updateSource(item.source, {
            name: item.name,
            description: item.description,
            enabled,
            sortOrder: item.sortOrder,
        });
    };

    const columns: ProColumns<PromptSource>[] = [
        {
            title: "来源 ID",
            dataIndex: "source",
            width: 220,
            render: (_, item) => <Typography.Text code>{item.source}</Typography.Text>,
        },
        {
            title: "显示名称",
            dataIndex: "name",
            width: 200,
            render: (_, item) => <Typography.Text strong>{item.name}</Typography.Text>,
        },
        {
            title: "类型",
            dataIndex: "remote",
            width: 80,
            render: (_, item) => (item.remote ? <Tag color="blue">远程</Tag> : <Tag>本地</Tag>),
        },
        {
            title: "GitHub",
            dataIndex: "githubUrl",
            width: 80,
            render: (_, item) =>
                item.githubUrl ? (
                    <Tooltip title={item.githubUrl}>
                        <Button type="link" icon={<ExportOutlined />} href={item.githubUrl} target="_blank" />
                    </Tooltip>
                ) : (
                    <Typography.Text type="secondary">-</Typography.Text>
                ),
        },
        {
            title: "状态",
            dataIndex: "enabled",
            width: 90,
            render: (_, item) => <Switch checked={item.enabled} size="small" onChange={(checked) => void toggleEnabled(item, checked)} />,
        },
        {
            title: "排序",
            dataIndex: "sortOrder",
            width: 70,
            align: "right",
        },
        {
            title: "最后同步",
            dataIndex: "lastSyncedAt",
            width: 180,
            render: (_, item) => <Typography.Text type="secondary">{formatTime(item.lastSyncedAt)}</Typography.Text>,
        },
        {
            title: "操作",
            key: "actions",
            width: 160,
            align: "right",
            render: (_, item) => (
                <Space size={4}>
                    {item.remote ? (
                        <Tooltip title="同步">
                            <Button type="text" size="small" icon={<SyncOutlined />} loading={isSyncing} onClick={() => void syncSource(item.source)} />
                        </Tooltip>
                    ) : null}
                    <Tooltip title="编辑">
                        <Button type="text" size="small" icon={<EditOutlined />} onClick={() => openEdit(item)} />
                    </Tooltip>
                    <Tooltip title="删除">
                        <Button danger type="text" size="small" icon={<DeleteOutlined />} onClick={() => setDeletingSource(item)} />
                    </Tooltip>
                </Space>
            ),
        },
    ];

    return (
        <main style={{ padding: 24 }}>
            <Flex vertical gap={16}>
                <Card variant="borderless">
                    <Flex justify="space-between" align="center" gap={16} wrap style={{ marginBottom: 16 }}>
                        <Typography.Text strong>定时同步</Typography.Text>
                        <Space>
                            <Button icon={<ReloadOutlined />} loading={promptSyncLoading} onClick={() => void loadPromptSync()}>
                                刷新
                            </Button>
                            <Button type="primary" icon={<SaveOutlined />} loading={promptSyncSaving} onClick={() => void savePromptSync()}>
                                保存
                            </Button>
                        </Space>
                    </Flex>
                    <Form form={promptSyncForm} layout="vertical" requiredMark={false}>
                        <Row gutter={16} align="middle">
                            <Col xs={24} md={8}>
                                <Form.Item name="enabled" label="开启定时同步" valuePropName="checked">
                                    <Switch />
                                </Form.Item>
                            </Col>
                            <Col xs={24} md={16}>
                                <Form.Item name="cron" label="Cron 表达式" extra="默认每天 0 点同步内置 GitHub 远程提示词源">
                                    <Input placeholder="0 0 * * *" />
                                </Form.Item>
                            </Col>
                        </Row>
                    </Form>
                </Card>
            <ProTable<PromptSource>
                rowKey="source"
                columns={columns}
                dataSource={sources}
                loading={isLoading}
                search={false}
                defaultSize="middle"
                tableLayout="fixed"
                cardProps={{ variant: "borderless" }}
                headerTitle={
                    <Space>
                        <Typography.Text strong>提示词来源</Typography.Text>
                        <Tag>{sources.length} 个</Tag>
                    </Space>
                }
                options={{ density: true, setting: true, reload: () => void refresh() }}
                pagination={false}
                toolBarRender={() => [
                    <Button key="sync-all" icon={<SyncOutlined />} loading={isSyncing} onClick={() => void syncAllSources()}>
                        同步所有
                    </Button>,
                    <Button key="add" type="primary" icon={<PlusOutlined />} onClick={openCreate}>
                        新增来源
                    </Button>,
                ]}
            />

            <Modal
                title={isEditing ? "编辑来源" : "新增来源"}
                open={isFormOpen}
                width={620}
                onCancel={() => setIsFormOpen(false)}
                onOk={() => void submitForm()}
                okText="保存"
                cancelText="取消"
                destroyOnHidden
            >
                <Form form={form} layout="vertical" requiredMark={false}>
                    <Form.Item name="source" label="来源 ID" rules={[{ required: true, message: "请输入来源 ID" }]}>
                        <Input placeholder="如 my-custom-prompts" disabled={isEditing} />
                    </Form.Item>
                    <Form.Item name="name" label="显示名称" rules={[{ required: true, message: "请输入显示名称" }]}>
                        <Input placeholder="如 我的自定义提示词" />
                    </Form.Item>
                    <Form.Item name="description" label="描述">
                        <Input.TextArea rows={2} placeholder="来源描述" />
                    </Form.Item>
                    {!isEditing ? (
                        <>
                            <Form.Item name="githubUrl" label="GitHub 仓库地址">
                                <Input placeholder="远程来源必填，本地来源留空" />
                            </Form.Item>
                            <Form.Item name="remote" label="远程同步" valuePropName="checked">
                                <Switch checkedChildren="远程" unCheckedChildren="本地" />
                            </Form.Item>
                            <Form.Item name="enabled" label="启用" valuePropName="checked">
                                <Switch />
                            </Form.Item>
                        </>
                    ) : (
                        <Form.Item name="enabled" label="启用" valuePropName="checked">
                            <Switch />
                        </Form.Item>
                    )}
                    <Form.Item name="sortOrder" label="排序权重（越小越靠前）">
                        <InputNumber min={0} style={{ width: "100%" }} />
                    </Form.Item>
                </Form>
            </Modal>

            <Modal
                title="删除来源"
                open={Boolean(deletingSource)}
                onCancel={() => setDeletingSource(null)}
                onOk={async () => {
                    if (!deletingSource) return;
                    await deleteSource(deletingSource.source);
                    setDeletingSource(null);
                }}
                okText="删除"
                okButtonProps={{ danger: true }}
                cancelText="取消"
            >
                确定删除来源「{deletingSource?.name}」吗？
                <br />
                <Typography.Text type="secondary">该来源下的提示词将保留在数据库中，但用户端不再展示。</Typography.Text>
            </Modal>
            </Flex>
        </main>
    );
}
