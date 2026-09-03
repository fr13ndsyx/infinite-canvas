"use client";

import { useEffect, useState } from "react";
import { App } from "antd";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { fetchImageGenerationLogs, fetchVideoGenerationLogs } from "@/services/api/generation-logs";
import { fetchCreditLogs, fetchUserProfile, saveUserProfile, type CreditLog } from "@/services/api/account";
import { useUserStore } from "@/stores/use-user-store";
import { useCanvasStore } from "@/app/(user)/canvas/stores/use-canvas-store";
import { CanvasNodeType } from "@/app/(user)/canvas/types";

const creditPageSize = 10;

export function useAccount() {
    const { message } = App.useApp();
    const queryClient = useQueryClient();
    const token = useUserStore((state) => state.token);
    const updateUser = useUserStore((state) => state.updateUser);
    const clearSession = useUserStore((state) => state.clearSession);
    const projects = useCanvasStore((state) => state.projects);
    const [page, setPage] = useState(1);
    const profileQuery = useQuery({ queryKey: ["account", "profile", token], queryFn: () => fetchUserProfile(token), enabled: Boolean(token), retry: false });
    const creditQuery = useQuery({ queryKey: ["account", "credit-logs", token, page], queryFn: () => fetchCreditLogs(token, { page, pageSize: creditPageSize }), enabled: Boolean(token), retry: false });
    const summaryQuery = useQuery({ queryKey: ["account", "credit-summary", token], queryFn: () => fetchCreditLogs(token, { page: 1, pageSize: 500 }), enabled: Boolean(token), retry: false, staleTime: 60_000 });
    const imageQuery = useQuery({ queryKey: ["account", "image-history", token], queryFn: () => fetchImageGenerationLogs<unknown>(token), enabled: Boolean(token), retry: false, staleTime: 60_000 });
    const videoQuery = useQuery({ queryKey: ["account", "video-history", token], queryFn: () => fetchVideoGenerationLogs<unknown>(token), enabled: Boolean(token), retry: false, staleTime: 60_000 });
    const profileMutation = useMutation({
        mutationFn: (patch: { displayName?: string; email?: string }) => saveUserProfile(token, patch),
        onSuccess: async (profile) => { updateUser(profile); await queryClient.invalidateQueries({ queryKey: ["account", "profile", token] }); message.success("个人资料已保存"); },
        onError: (error) => message.error(error instanceof Error ? error.message : "保存资料失败"),
    });
    const queryError = profileQuery.error || creditQuery.error || summaryQuery.error || imageQuery.error || videoQuery.error;
    const allCanvasRecords = projects
        .flatMap((project) => project.nodes
            .filter((node) => (node.type === CanvasNodeType.Image || node.type === CanvasNodeType.Panorama || node.type === CanvasNodeType.Video) && Boolean(node.metadata?.content || node.metadata?.storageKey) && node.metadata?.status !== "loading" && node.metadata?.status !== "error")
            .map((node) => ({
                id: `${project.id}:${node.id}`,
                projectId: project.id,
                projectTitle: project.title,
                nodeId: node.id,
                type: node.type === CanvasNodeType.Video ? "video" as const : "image" as const,
                title: node.title || (node.type === CanvasNodeType.Video ? "画布视频" : "画布图片"),
                content: node.metadata?.content || "",
                storageKey: node.metadata?.storageKey || "",
                updatedAt: node.metadata?.startedAt ? new Date(node.metadata.startedAt).toISOString() : project.updatedAt,
            })))
        .sort((a, b) => Date.parse(b.updatedAt || "") - Date.parse(a.updatedAt || ""));
    const canvasRecords = allCanvasRecords;

    useEffect(() => {
        if (profileQuery.data) updateUser(profileQuery.data);
    }, [profileQuery.data, updateUser]);

    useEffect(() => {
        if (!queryError) return;
        const text = queryError instanceof Error ? queryError.message : "读取账户信息失败";
        message.error(text);
        if (text.includes("未登录") || text.includes("权限不足") || text.includes("登录状态无效")) clearSession();
    }, [clearSession, message, queryError]);

    return {
        profile: profileQuery.data,
        logs: creditQuery.data?.items || [],
        totalLogs: creditQuery.data?.total || 0,
        summaryLogs: summaryQuery.data?.items || ([] as CreditLog[]),
        imageCount: imageQuery.data?.length || 0,
        videoCount: videoQuery.data?.length || 0,
        canvasRecords,
        canvasImageCount: allCanvasRecords.filter((record) => record.type === "image").length,
        canvasVideoCount: allCanvasRecords.filter((record) => record.type === "video").length,
        page,
        pageSize: creditPageSize,
        isLoading: profileQuery.isLoading || creditQuery.isFetching,
        isSavingProfile: profileMutation.isPending,
        saveProfile: (patch: { displayName?: string; email?: string }) => profileMutation.mutateAsync(patch),
        changePage: setPage,
    };
}
