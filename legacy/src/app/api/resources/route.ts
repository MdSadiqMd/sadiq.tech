import { NextRequest, NextResponse } from 'next/server';
import { getGistContent, updateGist } from '../github';

export const runtime = 'edge';

export async function GET() {
    try {
        const gistContent = await getGistContent(process.env.RESOURCES_GIST_ID!);
        return NextResponse.json(gistContent?.data || []);
    } catch (error) {
        return NextResponse.json({ error: `Failed to fetch resources: ${error}` }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const resource: any = await request.json();
        const gistContent = await getGistContent(process.env.RESOURCES_GIST_ID!);
        const resources = gistContent?.data || [];
        if (!resource.name || !resource.resource || !resource.tag || !resource.color) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        const newResource = {
            id: Math.random().toString(36).substr(2, 9),
            name: resource.name,
            resource: resource.resource,
            tag: resource.tag,
            color: resource.color
        };

        resources.push(newResource);
        await updateGist(
            process.env.RESOURCES_GIST_ID!,
            resources,
            gistContent?.filename || 'resources.json'
        );
        return NextResponse.json(newResource);
    } catch (error) {
        console.error('Error in POST /api/resources:', error);
        return NextResponse.json(
            { error: 'Failed to create resource' },
            { status: 500 }
        );
    }
}
