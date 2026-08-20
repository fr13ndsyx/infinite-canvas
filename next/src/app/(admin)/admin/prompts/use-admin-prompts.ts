"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { App } from "antd";

import { deleteAdminPrompt, deleteAdminPrompts, fetchAdminPrompts, importAdminPrompts, saveAdminPrompt } from "@/services/api/admin";
import type { Prompt } from "@/services/api/prompts";
import { useUserStore } from "@/stores/use-user-store";

const defaultPageSize = 10;

export function useAdminPrompts() {
    const { message } = App.useApp();
    const queryClient = useQueryClient();
    const token = useUserStore((state) => state.token);
    const clearSession = useUserStore((state) => state.clearSession);
    const [keyword, setKeyword] = useState("");
    const [category, setCategory] = useState("");
    const [tag, setTag] = useState<string[]>([]);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(defaultPageSize);

    const promptsQuery = useQuery({
        queryKey: ["admin", "prompts", token, keyword, category, tag, page, pageSize],
        queryFn: () => fetchAdminPrompts(token, { keyword, category, tag, page, pageSize }),
        enabled: Boolean(token),
        retry: false,
    });

    const invalidatePrompts = async () => {
        await queryClient.invalidateQueries({ queryKey: ["admin", "prompts"] });
    };

    const saveMutation = useMutation({
        mutationFn: (prompt: Partial<Prompt>) => saveAdminPrompt(token, prompt),
        onSuccess: async (_, prompt) => {
            await invalidatePrompts();
            message.success(prompt.id ? "提示词已保存" : "提示词已新增");
        },
        onError: (error) => {
            message.error(error instanceof Error ? error.message : "保存失败");
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => deleteAdminPrompt(token, id),
        onSuccess: async () => {
            await invalidatePrompts();
            message.success("提示词已删除");
        },
        onError: (error) => {
            message.error(error instanceof Error ? error.message : "删除失败");
        },
    });

    const batchDeleteMutation = useMutation({
        mutationFn: (ids: string[]) => deleteAdminPrompts(token, ids),
        onSuccess: async () => {
            await invalidatePrompts();
            message.success("提示词已批量删除");
        },
        onError: (error) => {
            message.error(error instanceof Error ? error.message : "批量删除失败");
        },
    });

    const [isImporting, setIsImporting] = useState(false);

    // 分批顺序导入，避免单请求超出后端 multipart 限制。
    const importPrompts = async (batches: { items: Prompt[]; media: File[] }[], onProgress?: (imported: number) => void) => {
        let imported = 0;
        setIsImporting(true);
        try {
            for (const batch of batches) {
                const jsonFile = new File([JSON.stringify(batch.items)], "prompts.json", { type: "application/json" });
                imported += (await importAdminPrompts(token, jsonFile, batch.media)).count;
                onProgress?.(imported);
            }
            await invalidatePrompts();
            message.success(`成功导入 ${imported} 条提示词`);
            return imported;
        } catch (error) {
            if (imported > 0) await invalidatePrompts();
            const reason = error instanceof Error ? error.message : "导入失败";
            message.error(imported > 0 ? `导入中断，已成功 ${imported} 条：${reason}` : reason);
            throw error;
        } finally {
            setIsImporting(false);
        }
    };

    useEffect(() => {
        const error = promptsQuery.error;
        if (!error) return;
        const errorMessage = error instanceof Error ? error.message : "读取提示词失败";
        message.error(errorMessage);
        if (errorMessage.includes("未登录") || errorMessage.includes("权限不足") || errorMessage.includes("登录状态无效")) clearSession();
    }, [promptsQuery.error, clearSession, message]);

    const updateFilters = (next: Partial<{ keyword: string; category: string; tag: string[]; page: number; pageSize: number }>) => {
        const queryState = { keyword, category, tag, page, pageSize, ...next };
        if (next.keyword !== undefined || next.category !== undefined || next.tag !== undefined || next.pageSize !== undefined) queryState.page = 1;
        setKeyword(queryState.keyword);
        setCategory(queryState.category);
        setTag(queryState.tag);
        setPage(queryState.page);
        setPageSize(queryState.pageSize);
    };

    const data = promptsQuery.data;

    return {
        prompts: data?.items || [],
        tags: data?.tags || [],
        keyword,
        category,
        tag,
        page,
        pageSize,
        total: data?.total || 0,
        isLoading: promptsQuery.isFetching || saveMutation.isPending || deleteMutation.isPending || batchDeleteMutation.isPending || isImporting,
        searchPrompts: (value = keyword) => updateFilters({ keyword: value }),
        changeCategory: (value: string) => updateFilters({ category: value, tag: [] }),
        changeTag: (value: string[]) => updateFilters({ tag: value }),
        changePage: (value: number) => updateFilters({ page: value }),
        changePageSize: (value: number) => updateFilters({ pageSize: value }),
        resetFilters: () => updateFilters({ keyword: "", category: "", tag: [], page: 1, pageSize: defaultPageSize }),
        refreshPrompts: async () => {
            await promptsQuery.refetch();
        },
        savePrompt: (prompt: Partial<Prompt>) => saveMutation.mutateAsync(prompt),
        deletePrompt: (id: string) => deleteMutation.mutateAsync(id),
        deletePrompts: (ids: string[]) => batchDeleteMutation.mutateAsync(ids),
        importPrompts,
        isImporting,
    };
}
