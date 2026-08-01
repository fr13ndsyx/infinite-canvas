"use client";

import { useMemo } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";

import { ALL_PROMPTS_OPTION, fetchPrompts, type PromptSourceOption } from "@/services/api/prompts";

export const PROMPT_PAGE_SIZE = 20;

const ALL_SOURCE_OPTION: PromptSourceOption = { source: ALL_PROMPTS_OPTION, name: "全部" };

export function usePromptList({ keyword, tags, source, enabled = true }: { keyword: string; tags: string[]; source: string; enabled?: boolean }) {
    const query = useInfiniteQuery({
        queryKey: ["prompts", keyword, tags, source],
        queryFn: ({ pageParam }) => fetchPrompts({ keyword, tag: tags, source, page: pageParam, pageSize: PROMPT_PAGE_SIZE }),
        initialPageParam: 1,
        getNextPageParam: (lastPage, pages) => (pages.reduce((total, page) => total + page.items.length, 0) < lastPage.total ? pages.length + 1 : undefined),
        enabled,
    });
    const firstPage = query.data?.pages[0];
    return {
        query,
        items: useMemo(() => query.data?.pages.flatMap((page) => page.items) || [], [query.data?.pages]),
        tags: useMemo(() => [ALL_PROMPTS_OPTION, ...(firstPage?.tags || [])], [firstPage?.tags]),
        sources: useMemo(() => [ALL_SOURCE_OPTION, ...(firstPage?.sources || [])], [firstPage?.sources]),
        total: firstPage?.total || 0,
    };
}
