import { Octokit } from '@octokit/rest';

const octokit = new Octokit({
    auth: process.env.GITHUB_TOKEN,
});

export const runtime = 'edge';

export async function getGistContent(gistId: string): Promise<any> {
    try {
        const response = await octokit.gists.get({ gist_id: gistId });
        const files = response.data.files;
        if (!files) {
            return null;
        }
        const firstFile = Object.values(files)[0];

        if (firstFile?.content) {
            return {
                data: JSON.parse(firstFile.content),
                filename: firstFile.filename
            };
        }
        return null;
    } catch (error) {
        console.error('Error fetching gist:', error);
        throw error;
    }
}

export async function updateGist(gistId: string, content: any, filename: string) {
    try {
        await octokit.gists.update({
            gist_id: gistId,
            files: {
                [filename]: {
                    content: JSON.stringify(content, null, 2)
                }
            }
        });
    } catch (error) {
        console.error('Error updating gist:', error);
        throw error;
    }
}
