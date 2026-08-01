import { apiDelete, apiGet, apiPost, apiPut } from "@/services/api/request";

export type PromptSource = {
    source: string;
    name: string;
    description: string;
    githubUrl: string;
    remote: boolean;
    enabled: boolean;
    sortOrder: number;
    lastSyncedAt: string;
    createdAt: string;
    updatedAt: string;
};

export type PromptSourceInput = {
    source: string;
    name: string;
    description: string;
    githubUrl: string;
    remote: boolean;
    enabled: boolean;
    sortOrder: number;
};

export type PromptSourceUpdate = {
    name: string;
    description: string;
    enabled: boolean;
    sortOrder: number;
};

export async function fetchAdminPromptSources(token: string) {
    return apiGet<PromptSource[]>("/api/admin/prompt-sources", undefined, token);
}

export async function createAdminPromptSource(token: string, data: PromptSourceInput) {
    return apiPost<PromptSource>("/api/admin/prompt-sources", data, token);
}

export async function updateAdminPromptSource(token: string, source: string, data: PromptSourceUpdate) {
    return apiPut<PromptSource>(`/api/admin/prompt-sources/${encodeURIComponent(source)}`, data, token);
}

export async function deleteAdminPromptSource(token: string, source: string) {
    return apiDelete<boolean>(`/api/admin/prompt-sources/${encodeURIComponent(source)}`, token);
}

export async function syncAdminPromptSource(token: string, source: string) {
    return apiPost<PromptSource[]>("/api/admin/prompt-sources/sync", { source }, token);
}

export async function syncAdminPromptSourcesAll(token: string) {
    return apiPost<PromptSource[]>("/api/admin/prompt-sources/sync-all", {}, token);
}
