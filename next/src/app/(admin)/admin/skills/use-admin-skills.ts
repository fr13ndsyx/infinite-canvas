"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { App } from "antd";

import { deleteAdminSkill, fetchAdminSkills, saveAdminSkill } from "@/services/api/admin";
import type { Skill } from "@/services/api/skills";
import { useUserStore } from "@/stores/use-user-store";

export function useAdminSkills() {
    const { message } = App.useApp();
    const queryClient = useQueryClient();
    const token = useUserStore((state) => state.token);
    const clearSession = useUserStore((state) => state.clearSession);

    const skillsQuery = useQuery({
        queryKey: ["admin", "skills", token],
        queryFn: () => fetchAdminSkills(token),
        enabled: Boolean(token),
        retry: false,
    });

    const invalidateSkills = async () => {
        await queryClient.invalidateQueries({ queryKey: ["admin", "skills"] });
    };

    const saveMutation = useMutation({
        mutationFn: (skill: Partial<Skill>) => saveAdminSkill(token, skill),
        onSuccess: async (_, skill) => {
            await invalidateSkills();
            message.success(skill.id ? "技能已保存" : "技能已新增");
        },
        onError: (error) => {
            message.error(error instanceof Error ? error.message : "保存失败");
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => deleteAdminSkill(token, id),
        onSuccess: async () => {
            await invalidateSkills();
            message.success("技能已删除");
        },
        onError: (error) => {
            message.error(error instanceof Error ? error.message : "删除失败");
        },
    });

    const error = skillsQuery.error;
    if (error) {
        const errorMessage = error instanceof Error ? error.message : "读取技能失败";
        if (errorMessage.includes("未登录") || errorMessage.includes("权限不足") || errorMessage.includes("登录状态无效")) clearSession();
    }

    return {
        skills: skillsQuery.data || [],
        isLoading: skillsQuery.isLoading,
        refreshSkills: async () => {
            await skillsQuery.refetch();
        },
        saveSkill: (skill: Partial<Skill>) => saveMutation.mutateAsync(skill),
        deleteSkill: (id: string) => deleteMutation.mutateAsync(id),
        isSaving: saveMutation.isPending,
        isDeleting: deleteMutation.isPending,
    };
}
