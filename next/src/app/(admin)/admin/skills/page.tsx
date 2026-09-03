"use client";

import { DeleteOutlined, EditOutlined, PlusOutlined, ReloadOutlined } from "@ant-design/icons";
import { ProTable, type ProColumns } from "@ant-design/pro-components";
import { Button, Flex, Form, Image, Input, InputNumber, Modal, Select, Space, Switch, Tag, Tooltip, Typography } from "antd";
import { useEffect, useState } from "react";

import { SKILL_NODE_TYPE_OPTIONS, skillNodeTypeLabel, type Skill, type SkillNodeType } from "@/services/api/skills";
import { useAdminSkills } from "./use-admin-skills";

export default function AdminSkillsPage() {
    const { skills, isLoading, refreshSkills, saveSkill, deleteSkill } = useAdminSkills();
    const [form] = Form.useForm<Partial<Skill>>();
    const [editingSkill, setEditingSkill] = useState<Partial<Skill> | null>(null);
    const [deletingSkill, setDeletingSkill] = useState<Skill | null>(null);

    useEffect(() => {
        if (editingSkill) {
            form.resetFields();
            form.setFieldsValue(editingSkill);
        }
    }, [editingSkill, form]);

    const saveSkillItem = async () => {
        const value = await form.validateFields();
        await saveSkill({ ...editingSkill, ...value });
        setEditingSkill(null);
    };

    const toggleSkill = async (item: Skill, enabled: boolean) => {
        await saveSkill({ ...item, enabled });
    };

    const columns: ProColumns<Skill>[] = [
        {
            title: "封面",
            dataIndex: "coverUrl",
            width: 88,
            render: (_, item) => <Image src={item.coverUrl || "/logo.svg"} alt={item.name} width={56} height={42} style={{ objectFit: "cover", borderRadius: 6 }} preview={{ mask: "放大" }} fallback="/logo.svg" />,
        },
        {
            title: "名称",
            dataIndex: "name",
            width: 180,
            render: (_, item) => (
                <Typography.Text strong ellipsis style={{ maxWidth: 180, display: "block" }}>
                    {item.name}
                </Typography.Text>
            ),
        },
        {
            title: "节点类型",
            dataIndex: "nodeType",
            width: 110,
            render: (_, item) => <Tag>{skillNodeTypeLabel(item.nodeType)}</Tag>,
        },
        {
            title: "说明",
            dataIndex: "description",
            ellipsis: true,
        },
        {
            title: "排序",
            dataIndex: "sortOrder",
            width: 80,
            align: "center",
        },
        {
            title: "上架",
            dataIndex: "enabled",
            width: 90,
            align: "center",
            render: (_, item) => <Switch size="small" checked={item.enabled} onChange={(checked) => void toggleSkill(item, checked)} />,
        },
        {
            title: "操作",
            key: "actions",
            width: 96,
            align: "right",
            render: (_, item) => (
                <Space size={4}>
                    <Tooltip title="编辑">
                        <Button type="text" size="small" icon={<EditOutlined />} onClick={() => setEditingSkill(item)} />
                    </Tooltip>
                    <Tooltip title="删除">
                        <Button danger type="text" size="small" icon={<DeleteOutlined />} onClick={() => setDeletingSkill(item)} />
                    </Tooltip>
                </Space>
            ),
        },
    ];

    return (
        <main style={{ padding: 24 }}>
            <ProTable<Skill>
                rowKey="id"
                columns={columns}
                dataSource={skills}
                loading={isLoading}
                search={false}
                defaultSize="middle"
                tableLayout="fixed"
                cardProps={{ variant: "borderless" }}
                headerTitle={
                    <Space>
                        <Typography.Text strong>技能列表</Typography.Text>
                        <Tag>{skills.length} 条</Tag>
                    </Space>
                }
                options={{ density: true, setting: true, reload: () => void refreshSkills() }}
                toolBarRender={() => [
                    <Button key="add" type="primary" icon={<PlusOutlined />} onClick={() => setEditingSkill({ nodeType: "text", enabled: true, sortOrder: 0 })}>
                        新增
                    </Button>,
                ]}
                pagination={false}
            />

            <Modal title={editingSkill?.id ? "编辑技能" : "新增技能"} open={Boolean(editingSkill)} width={640} onCancel={() => setEditingSkill(null)} onOk={() => void saveSkillItem()} okText="保存" cancelText="取消" destroyOnHidden>
                <Form form={form} layout="vertical" requiredMark={false}>
                    <Form.Item name="name" label="名称" rules={[{ required: true, message: "请输入技能名称" }]}>
                        <Input placeholder="如：运镜 - 轨道右移" />
                    </Form.Item>
                    <Form.Item name="nodeType" label="节点类型" rules={[{ required: true, message: "请选择节点类型" }]}>
                        <Select options={SKILL_NODE_TYPE_OPTIONS} />
                    </Form.Item>
                    <Form.Item name="description" label="一句话说明">
                        <Input placeholder="如：设备沿轨道匀速水平向右平稳移动" />
                    </Form.Item>
                    <Form.Item name="prompt" label="提示词模板" rules={[{ required: true, message: "请输入提示词模板" }]}>
                        <Input.TextArea rows={5} placeholder="用户点击技能后注入节点输入框，可再修改" />
                    </Form.Item>
                    <Form.Item name="coverUrl" label="封面 URL">
                        <Input />
                    </Form.Item>
                    <Space size="large">
                        <Form.Item name="sortOrder" label="排序（小的靠前）">
                            <InputNumber min={0} style={{ width: 120 }} />
                        </Form.Item>
                        <Form.Item name="enabled" label="上架" valuePropName="checked">
                            <Switch />
                        </Form.Item>
                    </Space>
                </Form>
            </Modal>

            <Modal
                title="删除技能"
                open={Boolean(deletingSkill)}
                onCancel={() => setDeletingSkill(null)}
                onOk={async () => {
                    if (!deletingSkill) return;
                    await deleteSkill(deletingSkill.id);
                    setDeletingSkill(null);
                }}
                okText="删除"
                okButtonProps={{ danger: true }}
                cancelText="取消"
            >
                确定删除「{deletingSkill?.name}」吗？
            </Modal>
        </main>
    );
}
