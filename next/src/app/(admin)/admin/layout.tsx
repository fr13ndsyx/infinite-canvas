"use client";

import { ApiOutlined, AuditOutlined, CloudOutlined, DollarOutlined, FileTextOutlined, HomeOutlined, LogoutOutlined, PictureOutlined, SettingOutlined, TransactionOutlined, UserOutlined } from "@ant-design/icons";
import { Button, Flex, Layout, Menu, Typography, theme } from "antd";
import type { MenuProps } from "antd";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect } from "react";

import { UserStatusActions } from "@/components/layout/user-status-actions";
import { adminLayoutStyle } from "@/lib/app-theme";
import { useUserStore } from "@/stores/use-user-store";

type MenuItem = Required<MenuProps>["items"][number];

const adminMenus: MenuItem[] = [
    { type: "group", label: "用户与资费", children: [
        { key: "/admin/users", icon: <UserOutlined />, label: "用户管理" },
        { key: "/admin/credit-logs", icon: <TransactionOutlined />, label: "算力点日志" },
    ]},
    { type: "group", label: "模型服务", children: [
        { key: "/admin/channels", icon: <ApiOutlined />, label: "模型管理" },
        { key: "/admin/model-pricing", icon: <DollarOutlined />, label: "开放与定价" },
        { key: "/admin/ai-logs", icon: <AuditOutlined />, label: "AI 调用日志" },
    ]},
    { type: "group", label: "内容库", children: [
        { key: "/admin/prompts", icon: <FileTextOutlined />, label: "提示词管理" },
        { key: "/admin/assets", icon: <PictureOutlined />, label: "素材库" },
    ]},
    { type: "group", label: "系统", children: [
        { key: "/admin/storage", icon: <CloudOutlined />, label: "存储设置" },
        { key: "/admin/preferences", icon: <SettingOutlined />, label: "系统偏好" },
        { key: "/admin/advanced", icon: <SettingOutlined />, label: "高级配置" },
    ]},
];

export default function AdminLayout({ children }: { children: ReactNode }) {
    const { token: antToken } = theme.useToken();
    const router = useRouter();
    const pathname = usePathname();
    const token = useUserStore((state) => state.token);
    const user = useUserStore((state) => state.user);
    const isReady = useUserStore((state) => state.isReady);
    const logout = useUserStore((state) => state.clearSession);
    const routeMeta = [
        { prefix: "/admin/users", key: "/admin/users", title: "用户管理" },
        { prefix: "/admin/credit-logs", key: "/admin/credit-logs", title: "算力点日志" },
        { prefix: "/admin/channels", key: "/admin/channels", title: "模型管理" },
        { prefix: "/admin/model-pricing", key: "/admin/model-pricing", title: "开放与定价" },
        { prefix: "/admin/prompts", key: "/admin/prompts", title: "提示词管理" },
        { prefix: "/admin/assets", key: "/admin/assets", title: "素材库管理" },
        { prefix: "/admin/storage", key: "/admin/storage", title: "存储设置" },
        { prefix: "/admin/preferences", key: "/admin/preferences", title: "系统偏好" },
        { prefix: "/admin/ai-logs", key: "/admin/ai-logs", title: "AI 调用日志" },
        { prefix: "/admin/advanced", key: "/admin/advanced", title: "高级配置" },
        { prefix: "/admin/settings", key: "/admin/settings", title: "系统设置" },
    ];
    const matched = routeMeta.find((item) => pathname.startsWith(item.prefix));
    const activeKey = matched?.key || "";
    const pageTitle = matched?.title || "用户管理";

    const wrapMenuLink = (item: { key: string; icon?: ReactNode; label: ReactNode }) => ({
        key: item.key,
        icon: item.icon,
        label: (
            <Link href={item.key} style={{ color: "inherit" }}>
                {item.label}
            </Link>
        ),
        style: adminLayoutStyle.menuItem,
    });

    useEffect(() => {
        if (!isReady) return;
        if (!token) {
            router.replace("/login?redirect=/admin");
            return;
        }
        if (user?.role !== "admin") {
            router.replace("/");
        }
    }, [isReady, router, token, user?.role]);

    if (!isReady || !token || user?.role !== "admin") {
        return (
            <div style={{ display: "flex", minHeight: "100vh", alignItems: "center", justifyContent: "center", background: antToken.colorBgLayout }}>
                <span />
            </div>
        );
    }

    return (
        <Layout hasSider style={{ height: "100vh", overflow: "hidden", background: antToken.colorBgLayout }}>
            <Layout.Sider width={adminLayoutStyle.siderWidth} style={{ height: "100vh", overflow: "hidden", background: antToken.colorBgContainer, borderRight: `1px solid ${antToken.colorBorder}` }}>
                <Flex align="center" gap={12} style={{ height: adminLayoutStyle.brandHeight, padding: "0 20px", borderBottom: `1px solid ${antToken.colorBorderSecondary}`, cursor: "pointer" }} onClick={() => router.push("/")}>
                    <span aria-hidden style={{ display: "inline-block", width: 30, height: 30, background: antToken.colorText, WebkitMask: "url(/logo.svg) center / contain no-repeat", mask: "url(/logo.svg) center / contain no-repeat" }} />
                    <Typography.Text strong style={{ fontSize: 18, letterSpacing: 0 }}>
                        无限画布
                    </Typography.Text>
                </Flex>
                <Menu
                    mode="inline"
                    selectedKeys={[activeKey]}
                    style={adminLayoutStyle.menu}
                    items={adminMenus.map((item) => {
                        if (item.type === "group") {
                            return {
                                type: "group" as const,
                                label: item.label,
                                children: (item.children || []).map((child: any) => wrapMenuLink(child)),
                            };
                        }
                        return wrapMenuLink(item as any);
                    })}
                />
                <Flex vertical gap={8} style={{ position: "absolute", bottom: 0, insetInline: 0, padding: 12, borderTop: `1px solid ${antToken.colorBorder}`, background: antToken.colorBgContainer }}>
                    <Button block icon={<HomeOutlined />} onClick={() => router.push("/")}>
                        前往画布
                    </Button>
                    <Button block icon={<LogoutOutlined />} onClick={logout}>
                        退出登录
                    </Button>
                </Flex>
            </Layout.Sider>
            <Layout style={{ background: antToken.colorBgLayout }}>
                <Layout.Header
                    style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: adminLayoutStyle.headerHeight, padding: "0 24px", background: antToken.colorBgContainer, borderBottom: `1px solid ${antToken.colorBorder}` }}
                >
                    <Typography.Title level={5} style={{ margin: 0 }}>
                        {pageTitle}
                    </Typography.Title>
                    <Flex align="center" gap={4}>
                        <UserStatusActions variant="admin" />
                    </Flex>
                </Layout.Header>
                <Layout.Content style={{ minHeight: 0, overflow: "auto" }}>{children}</Layout.Content>
            </Layout>
        </Layout>
    );
}
