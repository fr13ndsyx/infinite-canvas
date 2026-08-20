"use client";

import { CopyOutlined, DeleteOutlined, EditOutlined, EyeOutlined, PlusOutlined, ReloadOutlined, SearchOutlined, UploadOutlined } from "@ant-design/icons";
import { ProTable, type ProColumns } from "@ant-design/pro-components";
import { Button, Card, Col, Flex, Form, Image, Input, Modal, Progress, Row, Select, Space, Tag, Tooltip, Typography, theme } from "antd";
import { type ChangeEvent, type DragEvent as ReactDragEvent, useEffect, useRef, useState } from "react";

import { useCopyText } from "@/hooks/use-copy-text";
import { PROMPT_CATEGORY_OPTIONS, promptCategoryLabel, type Prompt, type PromptCategory } from "@/services/api/prompts";
import { buildImportBatches, collectDroppedFiles, filesFromFileList, pairPromptFiles, type ImportedFile, type PairedPrompt } from "./prompt-import";
import { useAdminPrompts } from "./use-admin-prompts";

const categoryOptions = [{ label: "全部分类", value: "" }, ...PROMPT_CATEGORY_OPTIONS.map((item) => ({ label: item.label, value: item.value }))];

export default function AdminPromptsPage() {
    const {
        prompts,
        tags,
        keyword,
        category,
        tag,
        page,
        pageSize,
        total,
        isLoading,
        searchPrompts,
        changeCategory,
        changeTag,
        changePage,
        changePageSize,
        resetFilters,
        refreshPrompts,
        savePrompt: saveAdminPrompt,
        deletePrompt,
        deletePrompts,
        importPrompts,
        isImporting,
    } = useAdminPrompts();
    const copyText = useCopyText();
    const { token } = theme.useToken();
    const [form] = Form.useForm<Partial<Prompt> & { tagText?: string }>();
    const [keywordText, setKeywordText] = useState(keyword);
    const [editingPrompt, setEditingPrompt] = useState<Partial<Prompt> | null>(null);
    const [detailPrompt, setDetailPrompt] = useState<Prompt | null>(null);
    const [deletingPrompt, setDeletingPrompt] = useState<Prompt | null>(null);
    const [selectedPromptIds, setSelectedPromptIds] = useState<string[]>([]);
    const [isBatchDeleteOpen, setIsBatchDeleteOpen] = useState(false);
    const [isImportOpen, setIsImportOpen] = useState(false);
    const [importCategory, setImportCategory] = useState<PromptCategory>("image");
    const [importFiles, setImportFiles] = useState<ImportedFile[]>([]);
    const [importPairs, setImportPairs] = useState<PairedPrompt[]>([]);
    const [importSummary, setImportSummary] = useState<{ invalidCount: number; unmatchedMediaCount: number } | null>(null);
    const [importDone, setImportDone] = useState(0);
    const [importTotal, setImportTotal] = useState(0);
    const [isDragOver, setIsDragOver] = useState(false);
    const folderInputRef = useRef<HTMLInputElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const tagOptions = tags.map((item) => ({ label: item, value: item }));

    useEffect(() => {
        if (editingPrompt) {
            form.resetFields();
            form.setFieldsValue({ ...editingPrompt, tagText: editingPrompt.tags?.join(", ") || "" });
        }
    }, [editingPrompt, form]);

    useEffect(() => setKeywordText(keyword), [keyword]);

    useEffect(() => {
        if (!importFiles.length) {
            setImportPairs([]);
            setImportSummary(null);
            return;
        }
        let cancelled = false;
        void pairPromptFiles(importFiles, importCategory).then((result) => {
            if (cancelled) return;
            setImportPairs(result.pairs);
            setImportSummary({ invalidCount: result.invalidCount, unmatchedMediaCount: result.unmatchedMediaCount });
        });
        return () => {
            cancelled = true;
        };
    }, [importCategory, importFiles]);

    const savePrompt = async () => {
        const value = await form.validateFields();
        await saveAdminPrompt({
            ...editingPrompt,
            ...value,
            category: value.category || "image",
            tags: (value.tagText || "")
                .split(",")
                .map((item) => item.trim())
                .filter(Boolean),
        });
        setEditingPrompt(null);
    };

    const batchDeletePrompts = async () => {
        await deletePrompts(selectedPromptIds);
        setSelectedPromptIds([]);
        setIsBatchDeleteOpen(false);
    };

    const onImportDrop = async (event: ReactDragEvent<HTMLDivElement>) => {
        event.preventDefault();
        setIsDragOver(false);
        const dropped = await collectDroppedFiles(event.dataTransfer);
        setImportFiles((current) => [...current, ...dropped]);
    };

    const onImportInputChange = (event: ChangeEvent<HTMLInputElement>) => {
        if (!event.target.files?.length) return;
        setImportFiles((current) => [...current, ...filesFromFileList(event.target.files)]);
        event.target.value = "";
    };

    const clearImportFiles = () => {
        setImportFiles([]);
        setImportPairs([]);
        setImportSummary(null);
    };

    const submitImport = async () => {
        if (!importPairs.length) return;
        setImportTotal(importPairs.length);
        setImportDone(0);
        try {
            await importPrompts(buildImportBatches(importPairs), setImportDone);
            setIsImportOpen(false);
            clearImportFiles();
            setImportTotal(0);
            setImportDone(0);
        } catch {
            // 错误提示在 hook 中统一处理，弹窗保持打开便于重试
        }
    };

    const columns: ProColumns<Prompt>[] = [
        {
            title: "封面",
            dataIndex: "coverUrl",
            width: 88,
            render: (_, item) => <Image src={item.coverUrl || "/logo.svg"} alt={item.title} width={56} height={42} style={{ objectFit: "cover", borderRadius: 6 }} preview={{ mask: "放大" }} fallback="/logo.svg" />,
        },
        {
            title: "标题",
            dataIndex: "title",
            width: 260,
            render: (_, item) => (
                <Typography.Link strong ellipsis style={{ maxWidth: 260, display: "block" }} onClick={() => setDetailPrompt(item)}>
                    {item.title}
                </Typography.Link>
            ),
        },
        {
            title: "分类",
            dataIndex: "category",
            width: 110,
            render: (_, item) => <Tag>{promptCategoryLabel(item.category)}</Tag>,
        },
        {
            title: "标签",
            dataIndex: "tags",
            width: 180,
            render: (_, item) => (
                <Space size={[4, 4]} wrap>
                    {(item.tags || []).slice(0, 3).map((tag) => (
                        <Tag key={tag}>{tag}</Tag>
                    ))}
                </Space>
            ),
        },
        {
            title: "操作",
            key: "actions",
            width: 112,
            align: "right",
            render: (_, item) => (
                <Space size={4}>
                    <Tooltip title="详情">
                        <Button type="text" size="small" icon={<EyeOutlined />} onClick={() => setDetailPrompt(item)} />
                    </Tooltip>
                    <Tooltip title="编辑">
                        <Button type="text" size="small" icon={<EditOutlined />} onClick={() => setEditingPrompt(item)} />
                    </Tooltip>
                    <Tooltip title="删除">
                        <Button danger type="text" size="small" icon={<DeleteOutlined />} onClick={() => setDeletingPrompt(item)} />
                    </Tooltip>
                </Space>
            ),
        },
    ];

    return (
        <main style={{ padding: 24 }}>
            <Flex vertical gap={16}>
                <Card variant="borderless">
                    <Form layout="vertical">
                        <Row gutter={16} align="bottom">
                            <Col flex="360px">
                                <Form.Item label="关键词">
                                    <Input.Search value={keywordText} placeholder="搜索标题或提示词" allowClear enterButton={<SearchOutlined />} onSearch={() => searchPrompts(keywordText)} onChange={(event) => setKeywordText(event.target.value)} />
                                </Form.Item>
                            </Col>
                            <Col flex="220px">
                                <Form.Item label="分类">
                                    <Select value={category} onChange={changeCategory} options={categoryOptions} />
                                </Form.Item>
                            </Col>
                            <Col flex="220px">
                                <Form.Item label="标签">
                                    <Select mode="multiple" allowClear maxTagCount="responsive" value={tag} onChange={changeTag} options={tagOptions} placeholder="全部标签" />
                                </Form.Item>
                            </Col>
                            <Col flex="none">
                                <Form.Item>
                                    <Space>
                                        <Button
                                            onClick={() => {
                                                setKeywordText("");
                                                resetFilters();
                                            }}
                                        >
                                            重置
                                        </Button>
                                        <Button type="primary" icon={<ReloadOutlined />} onClick={() => searchPrompts(keywordText)}>
                                            查询
                                        </Button>
                                    </Space>
                                </Form.Item>
                            </Col>
                        </Row>
                    </Form>
                </Card>
                <ProTable<Prompt>
                    rowKey="id"
                    columns={columns}
                    dataSource={prompts}
                    loading={isLoading}
                    search={false}
                    defaultSize="middle"
                    tableLayout="fixed"
                    cardProps={{ variant: "borderless" }}
                    headerTitle={
                        <Space>
                            <Typography.Text strong>提示词列表</Typography.Text>
                            <Tag>{total} 条</Tag>
                        </Space>
                    }
                    options={{ density: true, setting: true, reload: () => void refreshPrompts() }}
                    rowSelection={{ selectedRowKeys: selectedPromptIds, onChange: (keys) => setSelectedPromptIds(keys.map(String)) }}
                    toolBarRender={() => [
                        <Button key="batch-delete" danger icon={<DeleteOutlined />} disabled={!selectedPromptIds.length} onClick={() => setIsBatchDeleteOpen(true)}>
                            批量删除{selectedPromptIds.length ? ` ${selectedPromptIds.length}` : ""}
                        </Button>,
                        <Button key="import" icon={<UploadOutlined />} onClick={() => setIsImportOpen(true)}>
                            批量导入
                        </Button>,
                        <Button key="add" type="primary" icon={<PlusOutlined />} onClick={() => setEditingPrompt({ category: "image", tags: [] })}>
                            新增
                        </Button>,
                    ]}
                    pagination={{
                        current: page,
                        pageSize,
                        total,
                        showSizeChanger: true,
                        pageSizeOptions: [10, 20, 50, 100],
                        showTotal: (value) => `共 ${value} 条`,
                        onChange: (nextPage, nextPageSize) => (nextPageSize !== pageSize ? changePageSize(nextPageSize) : changePage(nextPage)),
                    }}
                />
            </Flex>

            <Modal title={editingPrompt?.id ? "编辑提示词" : "新增提示词"} open={Boolean(editingPrompt)} width={720} onCancel={() => setEditingPrompt(null)} onOk={() => void savePrompt()} okText="保存" cancelText="取消" destroyOnHidden>
                <Form form={form} layout="vertical" requiredMark={false}>
                    <Form.Item name="title" label="标题" rules={[{ required: true, message: "请输入标题" }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item name="category" label="分类">
                        <Select options={PROMPT_CATEGORY_OPTIONS} />
                    </Form.Item>
                    <Form.Item name="coverUrl" label="封面 URL">
                        <Input />
                    </Form.Item>
                    <Form.Item name="tagText" label="标签，用逗号分隔">
                        <Input />
                    </Form.Item>
                    <Form.Item name="prompt" label="提示词" rules={[{ required: true, message: "请输入提示词" }]}>
                        <Input.TextArea rows={6} />
                    </Form.Item>
                </Form>
            </Modal>

            <Modal title="提示词详情" open={Boolean(detailPrompt)} width={760} onCancel={() => setDetailPrompt(null)} footer={<Button onClick={() => setDetailPrompt(null)}>关闭</Button>}>
                {detailPrompt ? (
                    <Flex vertical gap={14}>
                        <Flex gap={14} align="start">
                            <Image src={detailPrompt.coverUrl || "/logo.svg"} alt={detailPrompt.title} width={116} height={84} style={{ objectFit: "cover", borderRadius: 8 }} preview={{ mask: "放大" }} fallback="/logo.svg" />
                            <Flex vertical gap={8} style={{ minWidth: 0 }}>
                                <Typography.Title level={5} style={{ margin: 0 }}>
                                    {detailPrompt.title}
                                </Typography.Title>
                                <Space wrap>
                                    <Tag>{promptCategoryLabel(detailPrompt.category)}</Tag>
                                    {(detailPrompt.tags || []).map((tag) => (
                                        <Tag key={tag}>{tag}</Tag>
                                    ))}
                                </Space>
                            </Flex>
                        </Flex>
                        {detailPrompt.preview ? (
                            <Typography.Paragraph type="secondary" style={{ margin: 0 }}>
                                {detailPrompt.preview}
                            </Typography.Paragraph>
                        ) : null}
                        <Input.TextArea value={detailPrompt.prompt} rows={8} readOnly />
                        <Button icon={<CopyOutlined />} onClick={() => copyText(detailPrompt.prompt)}>
                            复制提示词
                        </Button>
                    </Flex>
                ) : null}
            </Modal>

            <Modal title="批量导入提示词" open={isImportOpen} width={640} onCancel={() => setIsImportOpen(false)} onOk={() => void submitImport()} okText="导入" okButtonProps={{ loading: isImporting, disabled: !importPairs.length }} cancelText="取消" destroyOnHidden>
                <Flex vertical gap={12}>
                    <Typography.Paragraph type="secondary" style={{ margin: 0 }}>
                        拖入或选择文件夹：提示词支持 .json（对象或数组）和 .txt，媒体支持 jpg / png / webp / mp4 等，按同名文件或 JSON 内 coverUrl / image_filename 自动配对；正文取 prompt / prompt_text 字段；type / category 字段或文件夹名（含 image / video / 电影）决定分类，中文细分分类自动转为标签；文件较多时自动分批上传。
                    </Typography.Paragraph>
                    <Flex align="center" gap={8}>
                        <Typography.Text>默认分类：</Typography.Text>
                        <Select value={importCategory} onChange={setImportCategory} options={PROMPT_CATEGORY_OPTIONS} style={{ width: 120 }} />
                    </Flex>
                    <div
                        style={{ border: `1px dashed ${isDragOver ? token.colorPrimary : token.colorBorder}`, background: isDragOver ? token.colorPrimaryBg : "transparent", borderRadius: token.borderRadiusLG, padding: "28px 16px", textAlign: "center", cursor: "pointer", transition: "border-color 0.2s" }}
                        onDragOver={(event) => {
                            event.preventDefault();
                            setIsDragOver(true);
                        }}
                        onDragLeave={() => setIsDragOver(false)}
                        onDrop={(event) => void onImportDrop(event)}
                        onClick={() => folderInputRef.current?.click()}
                    >
                        <UploadOutlined style={{ fontSize: 22 }} />
                        <div style={{ marginTop: 8 }}>把 image / video 等文件夹拖到这里，或点击选择文件夹</div>
                        <Button size="small" style={{ marginTop: 8 }} onClick={(event) => { event.stopPropagation(); fileInputRef.current?.click(); }}>
                            选择单个文件
                        </Button>
                        <input ref={folderInputRef} type="file" multiple hidden {...({ webkitdirectory: "true" } as Record<string, string>)} onChange={onImportInputChange} />
                        <input ref={fileInputRef} type="file" multiple hidden onChange={onImportInputChange} />
                    </div>
                    {importFiles.length ? (
                        <Flex align="center" justify="space-between">
                            <Typography.Text type="secondary">
                                已识别 {importPairs.length} 条提示词{importSummary?.invalidCount ? `，${importSummary.invalidCount} 条内容为空已跳过` : ""}{importSummary?.unmatchedMediaCount ? `，${importSummary.unmatchedMediaCount} 个媒体文件未配对` : ""}
                            </Typography.Text>
                            <Button size="small" type="text" disabled={isImporting} onClick={clearImportFiles}>
                                清空
                            </Button>
                        </Flex>
                    ) : null}
                    {importTotal ? <Progress percent={Math.round((importDone / importTotal) * 100)} size="small" status={isImporting ? "active" : "success"} format={() => `${importDone} / ${importTotal}`} /> : null}
                </Flex>
            </Modal>

            <Modal
                title="删除提示词"
                open={Boolean(deletingPrompt)}
                onCancel={() => setDeletingPrompt(null)}
                onOk={async () => {
                    if (!deletingPrompt) return;
                    await deletePrompt(deletingPrompt.id);
                    setDeletingPrompt(null);
                }}
                okText="删除"
                okButtonProps={{ danger: true }}
                cancelText="取消"
            >
                确定删除「{deletingPrompt?.title}」吗？
            </Modal>

            <Modal title="批量删除提示词" open={isBatchDeleteOpen} onCancel={() => setIsBatchDeleteOpen(false)} onOk={() => void batchDeletePrompts()} okText="删除" okButtonProps={{ danger: true }} cancelText="取消">
                确定删除已选中的 {selectedPromptIds.length} 条提示词吗？
            </Modal>
        </main>
    );
}
