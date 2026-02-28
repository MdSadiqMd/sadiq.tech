import { useQuery } from "@tanstack/react-query";
import { githubAxios } from "@/lib/axios";

interface GistFile {
  raw_url: string;
  filename?: string;
}

interface GistData {
  files: Record<string, GistFile>;
}

interface ImageData {
  data: string;
  mimeType: string;
}

export const useGistData = (gistId: string, enabled = true) => {
  return useQuery({
    queryKey: ["gist", gistId],
    queryFn: async () => {
      const { data } = await githubAxios.get<GistData>(`/gists/${gistId}`);
      return data;
    },
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useImageData = (rawUrl: string, enabled = true) => {
  return useQuery({
    queryKey: ["imageData", rawUrl],
    queryFn: async () => {
      const { data } = await githubAxios.get<ImageData>(rawUrl);
      return data;
    },
    enabled,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};
