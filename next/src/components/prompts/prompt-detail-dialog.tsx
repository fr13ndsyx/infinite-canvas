"use client";

import { Copy, FolderPlus } from "lucide-react";
import { Button, Image, Modal, Tag } from "antd";

import { formatPromptDate, type Prompt } from "@/services/api/prompts";

export function PromptDetailDialog({ prompt, onClose, onCopy, onSaveAsset }: { prompt: Prompt | null; onClose: () => void; onCopy: (prompt: string) => void; onSaveAsset?: (prompt: Prompt) => void }) {
    return (
        <Modal
            title={<div className="pr-8 text-base font-semibold">{prompt?.title}</div>}
            open={Boolean(prompt)}
            onCancel={onClose}
            footer={null}
            width={720}
            styles={{ body: { height: "70vh", maxHeight: "70vh", padding: 0, display: "flex", flexDirection: "column", overflow: "hidden" } }}
            destroyOnHidden
        >
            {prompt ? (
                <div className="flex h-full min-h-0 flex-col gap-3 p-4">
                    <div className="flex shrink-0 items-center gap-2 text-xs text-stone-500 dark:text-stone-400">
                        <span>{formatPromptDate(prompt.updatedAt)}</span>
                        <span>·</span>
                        <div className="flex flex-wrap gap-1.5">
                            {prompt.tags.map((tag) => (
                                <Tag key={tag} className="m-0 text-[11px]">
                                    {tag}
                                </Tag>
                            ))}
                        </div>
                    </div>
                    {prompt.coverUrl ? (
                        <div className="flex shrink-0 justify-center overflow-hidden rounded-lg bg-stone-100 dark:bg-stone-900">
                            <Image
                                src={prompt.coverUrl}
                                alt={prompt.title}
                                preview={{ mask: "点击放大查看" }}
                                className="max-h-[260px] w-auto max-w-full object-contain"
                                wrapperClassName="flex items-center"
                            />
                        </div>
                    ) : null}
                    <div className="min-h-0 flex-1 overflow-hidden rounded-lg border border-stone-200 dark:border-stone-800">
                        <pre className="thin-scrollbar h-full overflow-y-auto whitespace-pre-wrap p-3 text-sm leading-6 text-stone-800 dark:text-stone-200">{prompt.prompt}</pre>
                    </div>
                    <div className="flex shrink-0 items-center justify-end gap-2 pt-1">
                        <Button icon={<FolderPlus className="size-4" />} onClick={() => onSaveAsset?.(prompt)}>
                            加入我的素材
                        </Button>
                        <Button type="primary" icon={<Copy className="size-4" />} onClick={() => onCopy(prompt.prompt)}>
                            复制提示词
                        </Button>
                    </div>
                </div>
            ) : null}
        </Modal>
    );
}
