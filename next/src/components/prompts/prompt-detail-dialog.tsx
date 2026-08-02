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
            width={1100}
            styles={{ body: { height: "80vh", maxHeight: "80vh", padding: 0, display: "flex", flexDirection: "column", overflow: "hidden" } }}
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
                    <div className="flex min-h-0 flex-1 gap-3">
                        {prompt.coverUrl ? (
                            <div className="flex min-w-0 flex-1 items-center justify-center overflow-hidden rounded-lg bg-stone-100 dark:bg-stone-900">
                                <Image
                                    src={prompt.coverUrl}
                                    alt={prompt.title}
                                    preview={{ mask: "点击放大查看" }}
                                    className="max-h-full max-w-full h-auto w-auto object-contain"
                                    wrapperClassName="flex items-center justify-center"
                                />
                            </div>
                        ) : null}
                        <div className="flex w-[360px] shrink-0 flex-col gap-2">
                            <div className="thin-scrollbar min-h-0 flex-1 overflow-y-auto rounded-lg border border-stone-200 dark:border-stone-800">
                                <pre className="whitespace-pre-wrap p-3 text-sm leading-6 text-stone-800 dark:text-stone-200">{prompt.prompt}</pre>
                            </div>
                            <div className="flex shrink-0 items-center gap-2">
                                <Button block icon={<FolderPlus className="size-4" />} onClick={() => onSaveAsset?.(prompt)}>
                                    加入我的素材
                                </Button>
                                <Button block type="primary" icon={<Copy className="size-4" />} onClick={() => onCopy(prompt.prompt)}>
                                    复制提示词
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            ) : null}
        </Modal>
    );
}
