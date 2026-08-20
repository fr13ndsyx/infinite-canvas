import type { Prompt, PromptCategory } from "@/services/api/prompts";

export type ImportedFile = { file: File; path: string };
export type PairedPrompt = { item: Prompt; media?: File };
export type ImportBatch = { items: Prompt[]; media: File[] };

const MEDIA_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".gif", ".mp4", ".webm", ".mov"];
const PROMPT_EXTENSIONS = [".json", ".txt"];
const MAX_BATCH_ITEMS = 20;
const MAX_BATCH_BYTES = 24 * 1024 * 1024;

const hasExtension = (name: string, extensions: string[]) => extensions.some((ext) => name.toLowerCase().endsWith(ext));
const baseName = (name: string) => name.replace(/\.[^.]+$/, "");

/** 从拖拽事件收集文件，支持文件夹递归展开。 */
export async function collectDroppedFiles(dataTransfer: DataTransfer): Promise<ImportedFile[]> {
    const entries = Array.from(dataTransfer.items)
        .map((item) => item.webkitGetAsEntry?.())
        .filter(Boolean) as FileSystemEntry[];
    if (!entries.length) return Array.from(dataTransfer.files).map((file) => ({ file, path: file.name }));
    const files: ImportedFile[] = [];
    await Promise.all(entries.map((entry) => walkEntry(entry, "", files)));
    return files;
}

async function walkEntry(entry: FileSystemEntry, parentPath: string, files: ImportedFile[]): Promise<void> {
    if (entry.isFile) {
        const file = await new Promise<File | null>((resolve) => (entry as FileSystemFileEntry).file(resolve, () => resolve(null)));
        if (file) files.push({ file, path: parentPath ? `${parentPath}/${file.name}` : file.name });
        return;
    }
    const reader = (entry as FileSystemDirectoryEntry).createReader();
    const children: FileSystemEntry[] = [];
    // readEntries 每次最多返回 100 条，需循环读到空为止
    for (;;) {
        const batch = await new Promise<FileSystemEntry[]>((resolve) => reader.readEntries(resolve, () => resolve([])));
        if (!batch.length) break;
        children.push(...batch);
    }
    const path = parentPath ? `${parentPath}/${entry.name}` : entry.name;
    await Promise.all(children.map((child) => walkEntry(child, path, files)));
}

/** 从 input[type=file]（含 webkitdirectory 文件夹选择）收集文件。 */
export function filesFromFileList(fileList: FileList): ImportedFile[] {
    return Array.from(fileList).map((file) => ({ file, path: file.webkitRelativePath || file.name }));
}

function categoryFromPath(path: string): PromptCategory | "" {
    const lower = path.toLowerCase();
    if (lower.includes("cinematic") || path.includes("电影")) return "cinematic";
    if (lower.includes("video") || path.includes("视频")) return "video";
    if (lower.includes("image") || path.includes("图片")) return "image";
    return "";
}

/** 配对提示词文件与同名媒体文件，生成待导入条目。 */
export async function pairPromptFiles(files: ImportedFile[], defaultCategory: PromptCategory): Promise<{ pairs: PairedPrompt[]; invalidCount: number; unmatchedMediaCount: number }> {
    const allMedia = files.filter((entry) => hasExtension(entry.file.name, MEDIA_EXTENSIONS));
    const mediaByName = new Map<string, ImportedFile>();
    for (const media of allMedia) {
        if (!mediaByName.has(media.file.name)) mediaByName.set(media.file.name, media);
        if (!mediaByName.has(baseName(media.file.name))) mediaByName.set(baseName(media.file.name), media);
    }
    const pairs: PairedPrompt[] = [];
    const usedMedia = new Set<ImportedFile>();
    let invalidCount = 0;
    for (const entry of files) {
        if (!hasExtension(entry.file.name, PROMPT_EXTENSIONS)) continue;
        const base = baseName(entry.file.name);
        const text = await entry.file.text();
        let records: Record<string, unknown>[] = [];
        let parsed = false;
        if (entry.file.name.toLowerCase().endsWith(".json")) {
            try {
                const raw: unknown = JSON.parse(text);
                if (Array.isArray(raw)) {
                    records = raw.filter((item) => item && typeof item === "object") as Record<string, unknown>[];
                    parsed = true;
                } else if (raw && typeof raw === "object") {
                    records = [raw as Record<string, unknown>];
                    parsed = true;
                }
            } catch {
                // 非 JSON 结构按纯文本处理
            }
        }
        if (!parsed) records = [{ prompt: text.trim() }];
        for (const record of records) {
            // 兼容字段别名：prompt_text / image_filename / type（如 gpt-image-2-prompts 导出格式）
            const media = mediaByName.get(String(record.coverUrl || record.image_filename || "")) || mediaByName.get(base);
            const promptText = String(record.prompt || record.prompt_text || "").trim() || (parsed ? "" : text.trim());
            if (!promptText) {
                invalidCount++;
                continue;
            }
            const recordCategory = String(record.category || "");
            const recordType = String(record.type || "");
            const explicitCategory = [recordType, recordCategory].find((value) => value === "image" || value === "video" || value === "cinematic");
            const category: PromptCategory = (explicitCategory as PromptCategory) || categoryFromPath(entry.path) || categoryFromPath(media?.path || "") || defaultCategory;
            // 中文细分分类（如"人像摄影"）不是枚举时转存为标签
            const tags = Array.isArray(record.tags) ? record.tags.map(String) : recordCategory && recordCategory !== explicitCategory ? [recordCategory] : [];
            if (media) usedMedia.add(media);
            pairs.push({
                item: {
                    id: "",
                    title: String(record.title || "").trim() || base,
                    coverUrl: media ? media.file.name : String(record.coverUrl || record.image_filename || ""),
                    prompt: promptText,
                    tags,
                    category,
                    source: String(record.source || ""),
                    preview: String(record.preview || ""),
                    createdAt: "",
                    updatedAt: "",
                },
                media: media?.file,
            });
        }
    }
    return { pairs, invalidCount, unmatchedMediaCount: allMedia.filter((media) => !usedMedia.has(media)).length };
}

/** 按条数和媒体体积拆分批次，避免单请求超过后端 multipart 限制。 */
export function buildImportBatches(pairs: PairedPrompt[]): ImportBatch[] {
    const batches: ImportBatch[] = [];
    let current: ImportBatch = { items: [], media: [] };
    let bytes = 0;
    for (const pair of pairs) {
        const size = pair.media?.size || 0;
        if (current.items.length && (current.items.length >= MAX_BATCH_ITEMS || bytes + size > MAX_BATCH_BYTES)) {
            batches.push(current);
            current = { items: [], media: [] };
            bytes = 0;
        }
        current.items.push(pair.item);
        if (pair.media) {
            current.media.push(pair.media);
            bytes += size;
        }
    }
    if (current.items.length) batches.push(current);
    return batches;
}
