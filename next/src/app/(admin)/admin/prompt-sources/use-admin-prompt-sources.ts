"use client";

import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { App } from "antd";

import {
    createAdminPromptSource,
    deleteAdminPromptSource,
    fetchAdminPromptSources,
    syncAdminPromptSource,
    syncAdminPromptSourcesAll,
    updateAdminPromptSource,
    type PromptSource,
    type PromptSourceInput,
    type PromptSourceUpdate,
} from "@/services/api/admin-prompt-sources";
import { useUserStore } from "@/stores/use-user-store";

export function useAdminPromptSources() {
    const { message } = App.useApp();
    const queryClient = useQueryClient();
    const token = useUserStore((state) => state.token);
    const clearSession = useUserStore((state) => state.clearSession);

    const query = useQuery({
        queryKey: ["admin", "prompt-sources", token],
        queryFn: () => fetchAdminPromptSources(token),
        enabled: Boolean(token),
        retry: false,
    });

    const invalidate = () => queryClient.invalidateQueries({ queryKey: ["admin", "prompt-sources"] });

    const createMutation = useMutation({
        mutationFn: (data: PromptSourceInput) => createAdminPromptSource(token, data),
        onSuccess: async () => {
            await invalidate();
            message.success("来源已新增");
        },
        onError: (error) => message.error(error instanceof Error ? error.message : "新增失败"),
    });

    const updateMutation = useMutation({
        mutationFn: ({ source, data }: { source: string; data: PromptSourceUpdate }) => updateAdminPromptSource(token, source, data),
        onSuccess: async () => {
            await invalidate();
            message.success("来源已更新");
        },
        onError: (error) => message.error(error instanceof Error ? error.message : "更新失败"),
    });

    const deleteMutation = useMutation({
        mutationFn: (source: string) => deleteAdminPromptSource(token, source),
        onSuccess: async () => {
            await invalidate();
            message.success("来源已删除");
        },
        onError: (error) => message.error(error instanceof Error ? error.message : "删除失败"),
    });

    const syncMutation = useMutation({
        mutationFn: (source: string) => syncAdminPromptSource(token, source),
        onSuccess: async (sources) => {
            queryClient.setQueryData<PromptSource[]>(["admin", "prompt-sources", token], sources);
            await queryClient.invalidateQueries({ queryKey: ["admin", "prompts"] });
            message.success("远程提示词源已同步");
        },
        onError: (error) => message.error(error instanceof Error ? error.message : "同步失败"),
    });

    const syncAllMutation = useMutation({
        mutationFn: () => syncAdminPromptSourcesAll(token),
        onSuccess: async (sources) => {
            queryClient.setQueryData<PromptSource[]>(["admin", "prompt-sources", token], sources);
            await queryClient.invalidateQueries({ queryKey: ["admin", "prompts"] });
            message.success("全部远程提示词源已同步");
        },
        onError: (error) => message.error(error instanceof Error ? error.message : "同步失败"),
    });

    useEffect(() => {
        if (query.isError) {
            const errorMessage = query.error instanceof Error ? query.error.message : "读取来源失败";
            message.error(errorMessage);
            if (errorMessage.includes("未登录") || errorMessage.includes("权限不足") || errorMessage.includes("登录状态无效")) clearSession();
        }
    }, [clearSession, message, query.error, query.isError]);

    return {
        sources: query.data || [],
        isLoading: query.isFetching || createMutation.isPending || updateMutation.isPending || deleteMutation.isPending,
        isSyncing: syncMutation.isPending || syncAllMutation.isPending,
        createSource: (data: PromptSourceInput) => createMutation.mutateAsync(data),
        updateSource: (source: string, data: PromptSourceUpdate) => updateMutation.mutateAsync({ source, data }),
        deleteSource: (source: string) => deleteMutation.mutateAsync(source),
        syncSource: (source: string) => syncMutation.mutateAsync(source),
        syncAllSources: () => syncAllMutation.mutateAsync(),
        refresh: () => query.refetch(),
    };
}
