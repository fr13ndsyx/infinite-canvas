import { apiGet, compactApiParams } from "@/services/api/request";

export type SkillNodeType = "text" | "image" | "video";

export type Skill = {
    id: string;
    nodeType: SkillNodeType;
    name: string;
    description: string;
    prompt: string;
    coverUrl: string;
    sortOrder: number;
    enabled: boolean;
    createdAt: string;
    updatedAt: string;
};

export const SKILL_NODE_TYPE_OPTIONS: { value: SkillNodeType; label: string }[] = [
    { value: "text", label: "文本" },
    { value: "image", label: "图片" },
    { value: "video", label: "视频" },
];

export function skillNodeTypeLabel(nodeType: string) {
    return SKILL_NODE_TYPE_OPTIONS.find((item) => item.value === nodeType)?.label || nodeType;
}

// fetchSkills 获取已上架技能，画布节点按类型过滤。
export async function fetchSkills(nodeType: SkillNodeType) {
    return apiGet<Skill[]>("/api/skills", compactApiParams({ nodeType }));
}
