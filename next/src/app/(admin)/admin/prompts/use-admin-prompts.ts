"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { App } from "antd";

import { deleteAdminPrompt, deleteAdminPrompts, fetchAdminPrompts, saveAdminPrompt } from "@/services/api/admin";
import { fetchAdminPromptSources } from "@/services/api/admin-prompt-sources";
import type { Prompt } from "@/services/api/prompts";
import { useUserStore } from "@/stores/use-user-store";

const defaultPageSize = 10;

export function useAdminPrompts() {
    const { message } = App.useApp();
    const queryClient = useQueryClient();
    const token = useUserStore((state) => state.token);
    const clearSession = useUserStore((state) => state.clearSession);
    const [keyword, setKeyword] = useState("");
    const [source, setSource] = useState("");
    const [tag, setTag] = useState<string[]>([]);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(defaultPageSize);

    const sourcesQuery = useQuery({
        queryKey: ["admin", "prompt-sources", token],
        queryFn: () => fetchAdminPromptSources(token),
        enabled: Boolean(token),
        retry: false,
    });

    const promptsQuery = useQuery({
        queryKey: ["admin", "prompts", token, keyword, source, tag, page, pageSize],
        queryFn: () => fetchAdminPrompts(token, { keyword, source, tag, page, pageSize }),
        enabled: Boolean(token),
        retry: false,
    });

    const saveMutation = useMutation({
        mutationFn: (prompt: Partial<Prompt>) => saveAdminPrompt(token, prompt),
        onSuccess: async (_, prompt) => {
            await queryClient.invalidateQueries({ queryKey: ["admin", "prompt-sources"] });
            await queryClient.invalidateQueries({ queryKey: ["admin", "prompts"] });
            message.success(prompt.id ? "提示词已保存" : "提示词已新增");
        },
        onError: (error) => {
            message.error(error instanceof Error ? error.message : "保存失败");
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => deleteAdminPrompt(token, id),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ["admin", "prompt-sources"] });
            await queryClient.invalidateQueries({ queryKey: ["admin", "prompts"] });
            message.success("提示词已删除");
        },
        onError: (error) => {
            message.error(error instanceof Error ? error.message : "删除失败");
        },
    });

    const batchDeleteMutation = useMutation({
        mutationFn: (ids: string[]) => deleteAdminPrompts(token, ids),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ["admin", "prompt-sources"] });
            await queryClient.invalidateQueries({ queryKey: ["admin", "prompts"] });
            message.success("提示词已批量删除");
        },
        onError: (error) => {
            message.error(error instanceof Error ? error.message : "批量删除失败");
        },
    });

    useEffect(() => {
        const error = sourcesQuery.error || promptsQuery.error;
        if (!error) return;
        const errorMessage = error instanceof Error ? error.message : "读取提示词失败";
        message.error(errorMessage);
        if (errorMessage.includes("未登录") || errorMessage.includes("权限不足") || errorMessage.includes("登录状态无效")) clearSession();
    }, [sourcesQuery.error, clearSession, message, promptsQuery.error]);

    const updateFilters = (next: Partial<{ keyword: string; source: string; tag: string[]; page: number; pageSize: number }>) => {
        const queryState = { keyword, source, tag, page, pageSize, ...next };
        if (next.keyword !== undefined || next.source !== undefined || next.tag !== undefined || next.pageSize !== undefined) queryState.page = 1;
        setKeyword(queryState.keyword);
        setSource(queryState.source);
        setTag(queryState.tag);
        setPage(queryState.page);
        setPageSize(queryState.pageSize);
    };

    const data = promptsQuery.data;

    return {
        sources: sourcesQuery.data || [],
        prompts: data?.items || [],
        tags: data?.tags || [],
        keyword,
        source,
        tag,
        page,
        pageSize,
        total: data?.total || 0,
        isLoading: sourcesQuery.isFetching || promptsQuery.isFetching || saveMutation.isPending || deleteMutation.isPending || batchDeleteMutation.isPending,
        searchPrompts: (value = keyword) => updateFilters({ keyword: value }),
        changeSource: (value: string) => updateFilters({ source: value, tag: [] }),
        changeTag: (value: string[]) => updateFilters({ tag: value }),
        changePage: (value: number) => updateFilters({ page: value }),
        changePageSize: (value: number) => updateFilters({ pageSize: value }),
        resetFilters: () => updateFilters({ keyword: "", source: "", tag: [], page: 1, pageSize: defaultPageSize }),
        refreshPrompts: async () => {
            await sourcesQuery.refetch();
            await promptsQuery.refetch();
        },
        savePrompt: (prompt: Partial<Prompt>) => saveMutation.mutateAsync(prompt),
        deletePrompt: (id: string) => deleteMutation.mutateAsync(id),
        deletePrompts: (ids: string[]) => batchDeleteMutation.mutateAsync(ids),
    };
}
