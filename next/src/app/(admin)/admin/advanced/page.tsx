"use client";

import { CheckCircleOutlined, FormatPainterOutlined, ReloadOutlined, SaveOutlined } from "@ant-design/icons";
import { json } from "@codemirror/lang-json";
import { Alert, App, Button, Card, Col, Flex, Row, Space, Tag, Typography } from "antd";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { EditorView } from "@uiw/react-codemirror";

import { fetchAdminSettings, saveAdminSettings, type AdminSettings } from "@/services/api/admin";
import { useUserStore } from "@/stores/use-user-store";

import { normalizePrivateSetting, normalizePublicSetting, normalizeSettings } from "../settings-shared";

const CodeMirror = dynamic(() => import("@uiw/react-codemirror"), { ssr: false });
const jsonEditorTheme = EditorView.theme({
    "&": { backgroundColor: "var(--ant-color-bg-container)", color: "var(--ant-color-text)" },
    ".cm-content": { caretColor: "var(--ant-color-text)", padding: "12px 0" },
    ".cm-line": { padding: "0 18px" },
    ".cm-gutters": { backgroundColor: "var(--ant-color-fill-quaternary)", borderRight: "1px solid var(--ant-color-border)", color: "var(--ant-color-text-tertiary)" },
    ".cm-activeLine": { backgroundColor: "var(--ant-color-fill-quaternary)" },
    ".cm-activeLineGutter": { backgroundColor: "var(--ant-color-fill-quaternary)", color: "var(--ant-color-text)" },
    ".cm-cursor": { borderLeftColor: "var(--ant-color-text)" },
    ".cm-selectionBackground, &.cm-focused .cm-selectionBackground": { backgroundColor: "var(--ant-control-item-bg-active)" },
    ".cm-foldPlaceholder": { backgroundColor: "var(--ant-color-fill-quaternary)", border: "1px solid var(--ant-color-border)", color: "var(--ant-color-text-tertiary)" },
    "&.cm-focused": { outline: "none" },
});

type TabKey = "public" | "private";

export default function AdminAdvancedPage() {
    const token = useUserStore((state) => state.token);
    const { message } = App.useApp();
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [jsonText, setJsonText] = useState<Record<TabKey, string>>({ public: "", private: "" });

    const loadSettings = async () => {
        if (!token) return;
        setIsLoading(true);
        try {
            const data = normalizeSettings(await fetchAdminSettings(token));
            setJsonText({
                public: JSON.stringify(data.public, null, 2),
                private: JSON.stringify(data.private, null, 2),
            });
        } catch (error) {
            message.error(error instanceof Error ? error.message : "读取设置失败");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        void loadSettings();
    }, [token]);

    const saveSettings = async () => {
        if (!token) return;
        const publicSetting = parseJson("public", jsonText.public);
        const privateSetting = parseJson("private", jsonText.private);
        if (!publicSetting || !privateSetting) {
            message.error("JSON 格式不正确，无法保存");
            return;
        }
        setIsSaving(true);
        try {
            const values: AdminSettings = normalizeSettings({ public: publicSetting, private: privateSetting });
            const saved = normalizeSettings(await saveAdminSettings(token, values));
            setJsonText({
                public: JSON.stringify(saved.public, null, 2),
                private: JSON.stringify(saved.private, null, 2),
            });
            message.success("已保存");
        } catch (error) {
            message.error(error instanceof Error ? error.message : "保存失败");
        } finally {
            setIsSaving(false);
        }
    };

    const formatJson = (tab: TabKey) => {
        const parsed = parseJson(tab, jsonText[tab]);
        if (!parsed) {
            message.error("JSON 格式不正确");
            return;
        }
        setJsonText((current) => ({ ...current, [tab]: JSON.stringify(parsed, null, 2) }));
    };

    return (
        <main className="p-3 md:p-6">
            <Flex vertical gap={16}>
                <Card variant="borderless">
                    <Flex justify="space-between" align="center" gap={16} wrap>
                        <Typography.Title level={5} style={{ margin: 0 }}>
                            高级配置
                        </Typography.Title>
                        <Space>
                            <Button icon={<ReloadOutlined />} loading={isLoading} onClick={() => void loadSettings()}>
                                刷新
                            </Button>
                            <Button type="primary" icon={<SaveOutlined />} loading={isSaving} onClick={() => void saveSettings()}>
                                保存设置
                            </Button>
                        </Space>
                    </Flex>
                </Card>

                <Alert type="warning" showIcon title="仅供排障与迁移使用，常规配置请使用前面页面" description="此处直接编辑公开/私有配置原始 JSON，保存时仍走全量 POST /api/admin/settings。" />

                <Row gutter={16}>
                    <Col xs={24} lg={12}>
                        <Card
                            variant="borderless"
                            title={
                                <Space>
                                    <Typography.Text strong>公开配置</Typography.Text>
                                    <Typography.Text type="secondary">对外暴露</Typography.Text>
                                </Space>
                            }
                            extra={
                                <Space>
                                    {getJsonError(jsonText.public) ? (
                                        <Tag color="error">JSON 错误</Tag>
                                    ) : (
                                        <Tag color="success" icon={<CheckCircleOutlined />}>
                                            格式正确
                                        </Tag>
                                    )}
                                    <Button size="small" icon={<FormatPainterOutlined />} onClick={() => formatJson("public")}>
                                        格式化
                                    </Button>
                                </Space>
                            }
                        >
                            <div style={{ overflow: "hidden", border: "1px solid var(--ant-color-border)", borderRadius: 6 }}>
                                <CodeMirror
                                    value={jsonText.public}
                                    height="560px"
                                    extensions={[json(), jsonEditorTheme]}
                                    basicSetup={{ foldGutter: true, lineNumbers: true, highlightActiveLine: true, highlightActiveLineGutter: true }}
                                    theme="none"
                                    onChange={(value) => setJsonText((current) => ({ ...current, public: value }))}
                                    style={{ fontSize: 13 }}
                                />
                            </div>
                        </Card>
                    </Col>
                    <Col xs={24} lg={12}>
                        <Card
                            variant="borderless"
                            title={
                                <Space>
                                    <Typography.Text strong>私有配置</Typography.Text>
                                    <Typography.Text type="secondary">不对外暴露</Typography.Text>
                                </Space>
                            }
                            extra={
                                <Space>
                                    {getJsonError(jsonText.private) ? (
                                        <Tag color="error">JSON 错误</Tag>
                                    ) : (
                                        <Tag color="success" icon={<CheckCircleOutlined />}>
                                            格式正确
                                        </Tag>
                                    )}
                                    <Button size="small" icon={<FormatPainterOutlined />} onClick={() => formatJson("private")}>
                                        格式化
                                    </Button>
                                </Space>
                            }
                        >
                            <div style={{ overflow: "hidden", border: "1px solid var(--ant-color-border)", borderRadius: 6 }}>
                                <CodeMirror
                                    value={jsonText.private}
                                    height="560px"
                                    extensions={[json(), jsonEditorTheme]}
                                    basicSetup={{ foldGutter: true, lineNumbers: true, highlightActiveLine: true, highlightActiveLineGutter: true }}
                                    theme="none"
                                    onChange={(value) => setJsonText((current) => ({ ...current, private: value }))}
                                    style={{ fontSize: 13 }}
                                />
                            </div>
                        </Card>
                    </Col>
                </Row>
            </Flex>
        </main>
    );
}

function parseJson(tab: TabKey, value: string): AdminSettings[TabKey] | null {
    try {
        const parsed = JSON.parse(value);
        return tab === "public" ? normalizePublicSetting(parsed) : normalizePrivateSetting(parsed);
    } catch {
        return null;
    }
}

function getJsonError(value: string) {
    try {
        JSON.parse(value);
        return "";
    } catch (error) {
        return error instanceof Error ? error.message : "JSON 格式不正确";
    }
}
