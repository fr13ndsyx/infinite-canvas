import { apiGet, compactApiParams } from "@/services/api/request";

export type Prompt = {
    id: string;
    title: string;
    coverUrl: string;
    prompt: string;
    tags: string[];
    category: PromptCategory;
    source: string;
    preview: string;
    createdAt: string;
    updatedAt: string;
};

export type PromptCategory = "image" | "video" | "cinematic";

export const PROMPT_CATEGORY_OPTIONS: { value: PromptCategory; label: string }[] = [
    { value: "image", label: "图片" },
    { value: "video", label: "视频" },
    { value: "cinematic", label: "电影级" },
];

export function promptCategoryLabel(category: string) {
    return PROMPT_CATEGORY_OPTIONS.find((item) => item.value === category)?.label || "图片";
}

export const ALL_PROMPTS_OPTION = "全部";

export type PromptListResponse = {
    items: Prompt[];
    tags: string[];
    sources: string[];
    total: number;
};

export async function fetchPrompts({ keyword = "", tag = [], category = "", source = "", page, pageSize }: { keyword?: string; tag?: string[]; category?: string; source?: string; page?: number; pageSize?: number } = {}) {
    return apiGet<PromptListResponse>(
        "/api/prompts",
        compactApiParams({
            ...(keyword ? { keyword } : {}),
            ...(tag.length ? { tag } : {}),
            ...(category ? { category } : {}),
            ...(source ? { source } : {}),
            ...(page ? { page } : {}),
            ...(pageSize ? { pageSize } : {}),
        }),
    );
}

export function formatPromptDate(value: string) {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "" : new Intl.DateTimeFormat("zh-CN", { year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
}
