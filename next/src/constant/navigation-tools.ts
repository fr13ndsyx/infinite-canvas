import { FileText, ImagePlus, Images, Maximize2, Video, WandSparkles, Workflow, type LucideIcon } from "lucide-react";

type NavLink = {
    kind: "link";
    slug: string;
    label: string;
    icon: LucideIcon;
};

type NavDropdown = {
    kind: "dropdown";
    slug: string;
    label: string;
    icon: LucideIcon;
    children: NavLink[];
};

export type NavigationTool = NavLink | NavDropdown;

export const navigationTools: NavigationTool[] = [
    { kind: "link", slug: "canvas", label: "我的画布", icon: Maximize2 },
    { kind: "link", slug: "image", label: "生图工作台", icon: ImagePlus },
    { kind: "link", slug: "video", label: "视频创作台", icon: Video },
    {
        kind: "dropdown",
        slug: "workflows",
        label: "工作流",
        icon: Workflow,
        children: [{ kind: "link", slug: "workflows", label: "生图工作流", icon: WandSparkles }],
    },
    { kind: "link", slug: "prompts", label: "提示词库", icon: FileText },
    { kind: "link", slug: "assets", label: "我的素材", icon: Images },
];

// 所有 link 项与 dropdown 子项的 slug 集合，用于 active 判断
export const navigationSlugs: string[] = navigationTools.flatMap((tool) =>
    tool.kind === "link" ? [tool.slug] : tool.children.map((child) => child.slug),
);

// slug → 功能模块可见性配置 key 映射，用于按后台开关过滤导航项
export type NavigationModuleKey = "imageWorkbench" | "videoWorkbench" | "workflows";
export const navigationModuleKeys: Record<string, NavigationModuleKey | undefined> = {
    image: "imageWorkbench",
    video: "videoWorkbench",
    workflows: "workflows",
};

// 按后台功能模块开关过滤导航项；modules 为空（未加载完成）时不过滤。
export function filterNavigationTools(
    tools: NavigationTool[],
    modules: Partial<Record<NavigationModuleKey, boolean>> | undefined | null,
): NavigationTool[] {
    if (!modules) return tools;
    return tools.filter((tool) => {
        const key = navigationModuleKeys[tool.slug];
        return !key || modules[key] !== false;
    });
}

export type NavigationSlug = (typeof navigationSlugs)[number];
