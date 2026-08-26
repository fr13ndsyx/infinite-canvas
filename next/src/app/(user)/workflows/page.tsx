"use client";

import { CreativeWorkflowWorkspace } from "@/components/workflows/creative-workflow-workspace";
import { useModuleGuard } from "@/hooks/use-module-guard";

export default function WorkflowsPage() {
    const moduleEnabled = useModuleGuard("workflows");
    if (!moduleEnabled) return null;
    return <CreativeWorkflowWorkspace />;
}
