import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET() {
    return NextResponse.json({
        githubToken: process.env.GITHUB_TOKEN?.slice(0, 5) + '...',
        gistId: process.env.RESOURCES_GIST_ID,
        tagsGistId: process.env.TAGS_GIST_ID
    });
}