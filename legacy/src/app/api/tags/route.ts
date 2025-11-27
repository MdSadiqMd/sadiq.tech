import { NextRequest, NextResponse } from 'next/server';
import { getGistContent, updateGist } from '../github';

export const runtime = 'edge';

export async function GET() {
    try {
        const gistContent = await getGistContent(process.env.TAGS_GIST_ID!);
        return NextResponse.json(gistContent?.data || []);
    } catch (error) {
        return NextResponse.json({ error: `Failed to fetch tags: ${error}` }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const tag: { name: string; } = await request.json();
        const gistContent = await getGistContent(process.env.TAGS_GIST_ID!);
        const tags = gistContent?.data || [];

        if (!tags.find((t: any) => t.name === tag.name as any)) {
            tags.push(tag);
            await updateGist(
                process.env.TAGS_GIST_ID!,
                tags,
                gistContent?.filename || 'tags.json'
            );
        }
        return NextResponse.json(tag);
    } catch (error) {
        return NextResponse.json({ error: `Failed to create tag: ${error}` }, { status: 500 });
    }
}