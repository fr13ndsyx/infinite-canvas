"use client";

import { Check, Download, ImageIcon, Layers3, Pencil, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input } from "antd";

import { resolveMediaUrl } from "@/services/file-storage";
import { resolveImageUrl } from "@/services/image-storage";
import { useCanvasStore, type CanvasProject } from "../stores/use-canvas-store";
import { useCanvasUiStore } from "../stores/use-canvas-ui-store";
import { CanvasNodeType } from "../types";
import { exportCanvasProjects } from "../utils/canvas-export";

export function CanvasProjectCard({ project }: { project: CanvasProject }) {
    const router = useRouter();
    const renameProject = useCanvasStore((state) => state.renameProject);
    const selectedIds = useCanvasUiStore((state) => state.selectedProjectIds);
    const editingId = useCanvasUiStore((state) => state.editingProjectId);
    const editingTitle = useCanvasUiStore((state) => state.editingProjectTitle);
    const startEditing = useCanvasUiStore((state) => state.startEditingProject);
    const setEditingTitle = useCanvasUiStore((state) => state.setEditingProjectTitle);
    const stopEditing = useCanvasUiStore((state) => state.stopEditingProject);
    const toggleSelected = useCanvasUiStore((state) => state.toggleSelectedProjectId);
    const setDeleteIds = useCanvasUiStore((state) => state.setDeleteProjectIds);
    const editing = editingId === project.id;
    const selected = selectedIds.includes(project.id);
    const open = () => router.push(`/canvas/${project.id}`);
    const saveTitle = () => {
        renameProject(project.id, editingTitle);
        stopEditing();
    };

    return (
        <article className="group flex min-h-44 cursor-pointer flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white/70 transition hover:-translate-y-0.5 hover:border-stone-400 hover:bg-white/75 hover:shadow-lg dark:border-stone-800 dark:bg-white/[0.04] dark:hover:border-stone-600 dark:hover:bg-white/[0.07]" onClick={() => !editing && open()}>
            <CanvasProjectPreview project={project} />
            <div className="flex flex-1 flex-col justify-between p-5">
                <div className="flex items-start gap-3">
                    <input
                        type="checkbox"
                        checked={selected}
                        onClick={(event) => event.stopPropagation()}
                        onChange={(event) => toggleSelected(project.id, event.target.checked)}
                        className="mt-1 size-4 accent-stone-950 dark:accent-stone-100"
                        aria-label={`选择 ${project.title}`}
                    />
                    {editing ? (
                        <div className="min-w-0 flex-1">
                            <Input className="min-w-0" value={editingTitle} onClick={(event) => event.stopPropagation()} onChange={(event) => setEditingTitle(event.target.value)} onKeyDown={(event) => event.key === "Enter" && saveTitle()} autoFocus />
                            <p className="mt-2 text-xs text-stone-500 dark:text-stone-400">更新于 {new Date(project.updatedAt).toLocaleString("zh-CN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })}</p>
                        </div>
                    ) : (
                        <button
                            type="button"
                            className="min-w-0 cursor-pointer text-left"
                            onClick={(event) => {
                                event.stopPropagation();
                                open();
                            }}
                        >
                            <h2 className="truncate text-sm font-medium text-stone-800 dark:text-stone-200">{project.title || "未命名画布"}</h2>
                            <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">更新于 {new Date(project.updatedAt).toLocaleString("zh-CN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })}</p>
                        </button>
                    )}
                </div>
                <div className="mt-5 flex items-end justify-end gap-3">
                    <div className="flex items-center gap-1" onClick={(event) => event.stopPropagation()}>
                        {editing ? (
                            <>
                                <Button type="text" size="small" shape="circle" icon={<Check className="size-4" />} onClick={saveTitle} aria-label="保存名称" />
                                <Button type="text" size="small" shape="circle" icon={<X className="size-4" />} onClick={stopEditing} aria-label="取消重命名" />
                            </>
                        ) : (
                            <>
                                <Button type="text" size="small" shape="circle" icon={<Download className="size-4" />} onClick={() => void exportCanvasProjects([project], project.title || "无限画布")} aria-label="导出" />
                                <Button type="text" size="small" shape="circle" icon={<Pencil className="size-4" />} onClick={() => startEditing(project.id, project.title)} aria-label="重命名" />
                                <Button type="text" size="small" shape="circle" icon={<Trash2 className="size-4" />} onClick={() => setDeleteIds([project.id])} aria-label="删除" />
                            </>
                        )}
                    </div>
                </div>
            </div>
        </article>
    );
}

function CanvasProjectPreview({ project }: { project: CanvasProject }) {
    const previewNode = [...project.nodes].reverse().find((node) => (node.type === CanvasNodeType.Video || node.type === CanvasNodeType.Image || node.type === CanvasNodeType.Panorama) && (node.metadata?.content || node.metadata?.storageKey));
    const previewContent = previewNode?.metadata?.content || "";
    const previewStorageKey = previewNode?.metadata?.storageKey;
    const isVideo = previewNode?.type === CanvasNodeType.Video;
    const [previewUrl, setPreviewUrl] = useState(previewContent);

    useEffect(() => {
        let mounted = true;
        setPreviewUrl(previewContent);
        if (!previewContent && !previewStorageKey) return () => { mounted = false; };
        const resolvePreview = isVideo ? resolveMediaUrl(previewStorageKey, previewContent) : resolveImageUrl(previewStorageKey, previewContent);
        void resolvePreview.then((url) => {
            if (mounted && url) setPreviewUrl(url);
        }).catch(() => undefined);
        return () => { mounted = false; };
    }, [isVideo, previewContent, previewStorageKey]);

    return (
        <div className="relative h-36 overflow-hidden rounded-t-2xl bg-stone-200 dark:bg-stone-900">
            {previewUrl ? isVideo ? <video src={previewUrl} muted preload="metadata" className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]" /> : <img src={previewUrl} alt="" className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]" /> : <div className="flex h-full flex-col items-center justify-center gap-2 text-stone-400 dark:text-stone-600">{isVideo ? <Layers3 className="size-8" /> : <ImageIcon className="size-8" />}<span className="text-xs">暂无媒体预览</span></div>}
            <span className="absolute bottom-3 right-3 rounded-md bg-black/45 px-2 py-1 text-[10px] text-white backdrop-blur">{project.nodes.length} 个节点 · {project.connections.length} 条连线</span>
        </div>
    );
}
