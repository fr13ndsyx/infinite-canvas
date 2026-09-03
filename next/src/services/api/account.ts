import { apiGet, apiPost, compactApiParams } from "@/services/api/request";
import type { AuthUser } from "@/services/api/auth";

export type UserProfile = AuthUser & {
    email: string;
    affCode: string;
    affCount: number;
    inviterId: string;
    githubId: string;
    wechatId: string;
    status: "active" | "ban";
    lastLoginAt: string;
};

export type CreditLog = {
    id: string;
    userId: string;
    type: "admin_adjust" | "ai_consume" | "ai_refund" | string;
    amount: number;
    balance: number;
    relatedId: string;
    remark: string;
    extra: string;
    createdAt: string;
};

export type CreditLogList = { items: CreditLog[]; total: number };

export type CreditLogQuery = { keyword?: string; page?: number; pageSize?: number };

export async function fetchUserProfile(token: string) {
    return apiGet<UserProfile>("/api/v1/profile", undefined, token);
}

export async function saveUserProfile(token: string, patch: { displayName?: string; email?: string }) {
    return apiPost<UserProfile>("/api/v1/profile", patch, token);
}

export async function changePassword(token: string, payload: { oldPassword: string; newPassword: string }) {
    return apiPost<boolean>("/api/v1/auth/change-password", payload, token);
}

export async function fetchCreditLogs(token: string, query: CreditLogQuery = {}) {
    return apiGet<CreditLogList>("/api/v1/credit-logs", compactApiParams(query), token);
}
