"use client";

import { Check, Search } from "lucide-react";
import { type UIEvent, useEffect, useState } from "react";
import { App, Empty, Input, Modal, Spin, Tag } from "antd";

import { PROMPT_CATEGORY_OPTIONS, type PromptCategory } from "@/services/api/prompts";
import { cn } from "@/lib/utils";
import { PromptCard } from "./prompt-card";
import { usePromptList } from "./use-prompt-list";

export function PromptSelectDialog({ open, onOpenChange, onSelect, defaultCategory = "image" }: { open: boolean; onOpenChange: (open: boolean) => void; onSelect: (prompt: string) => void; defaultCategory?: PromptCategory }) {
    const { message } = App.useApp();
    const [keyword, setKeyword] = useState("");
    const [category, setCategory] = useState<PromptCategory>(defaultCategory);
    const { query, items } = usePromptList({ keyword, tags: [], category, enabled: open });

    useEffect(() => setCategory(defaultCategory), [defaultCategory]);

    const selectPrompt = (prompt: string) => {
        onSelect(prompt);
        onOpenChange(false);
    };

    useEffect(() => {
        if (query.isError) message.error(query.error instanceof Error ? query.error.message : "获取提示词失败");
    }, [message, query.error, query.isError]);

    const handleListScroll = (event: UIEvent<HTMLDivElement>) => {
        const target = event.currentTarget;
        if (query.hasNextPage && !query.isFetchingNextPage && target.scrollTop + target.clientHeight >= target.scrollHeight - 160) void query.fetchNextPage();
    };

    return (
        <Modal title="提示词库" open={open} onCancel={() => onOpenChange(false)} footer={null} width={1040} centered>
            <div data-canvas-no-zoom onWheelCapture={(event) => event.stopPropagation()}>
                <div className="mx-auto max-w-2xl">
                    <Input size="large" prefix={<Search className="size-4 text-stone-400" />} value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="按标题查询" />
                </div>
                <div className="mt-5">
                    <div className="grid gap-2 sm:grid-cols-[64px_minmax(0,1fr)] sm:items-start">
                        <div className="pt-[5px] text-sm leading-none font-medium text-stone-500 dark:text-stone-400">分类</div>
                        <div className="flex flex-wrap gap-2">
                            {PROMPT_CATEGORY_OPTIONS.map((option) => (
                                <Tag.CheckableTag key={option.value} checked={category === option.value} className={cn("prompt-filter-tag", category === option.value && "is-active")} onChange={() => setCategory(option.value)}>
                                    {option.label}
                                </Tag.CheckableTag>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="thin-scrollbar mt-6 max-h-[720px] overflow-y-auto pr-2" data-canvas-no-zoom onScroll={handleListScroll} onWheelCapture={(event) => event.stopPropagation()}>
                    {query.isLoading ? (
                        <div className="flex h-40 items-center justify-center">
                            <Spin />
                        </div>
                    ) : null}
                    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                        {items.map((item) => (
                            <PromptCard key={item.id} item={item} onOpen={() => selectPrompt(item.prompt)} onCopy={() => selectPrompt(item.prompt)} actionLabel="使用此提示词" actionIcon={<Check className="size-3.5" />} actionType="primary" />
                        ))}
                    </div>
                    {!query.isLoading && items.length === 0 ? <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="没有找到匹配的提示词" className="py-8" /> : null}
                    {query.isFetchingNextPage ? (
                        <div className="py-4 text-center">
                            <Spin size="small" />
                        </div>
                    ) : null}
                </div>
            </div>
        </Modal>
    );
}
