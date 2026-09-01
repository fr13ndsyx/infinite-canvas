export const dynamic = "force-dynamic";

function readReleases() {
    try {
        return JSON.parse(process.env.NEXT_PUBLIC_APP_RELEASES || "[]");
    } catch {
        return [];
    }
}

export function GET() {
    return Response.json(
        {
            version: process.env.NEXT_PUBLIC_APP_VERSION || "dev",
            releases: readReleases().slice(0, 8),
        },
        { headers: { "Cache-Control": "no-store" } },
    );
}
