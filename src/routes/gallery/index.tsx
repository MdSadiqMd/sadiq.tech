import { createFileRoute } from "@tanstack/react-router";
import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { MasonryGrid } from "@/components/gallery/masonry-grid";
import { PrimeButton } from "@/components/satisui/prime-button";
import { X, Trash2, UploadCloud } from "lucide-react";
import { sileo } from "sileo";
import Upscaler from "upscaler";
import { useTRPC } from "@/integrations/trpc/react";
import { Loader } from "@/components/ui/loader";
import { githubAxios, githubRawAxios, workerAxios } from "@/lib/axios";

export const Route = createFileRoute("/gallery/")({
  component: GalleryPage,
  loader: async () => {
    // Pre-load to ensure data is available
    return { images: [] };
  },
  head: () => ({
    meta: [
      {
        title: "Gallery | Sadiq.tech",
      },
      {
        name: "description",
        content: "My personal Gallery",
      },
    ],
  }),
});

interface UploadedImage {
  id: string;
  url: string;
  fileName: string;
  gistId: string;
  uploadedAt: number;
  width?: number;
  height?: number;
  aspectRatio?: number;
  gistDbUuid?: string;
}

const GITHUB_TOKEN =
  import.meta.env.VITE_GITHUB_TOKEN || import.meta.env.GITHUB_TOKEN || "";
const GITHUB_USERNAME =
  import.meta.env.VITE_GITHUB_USERNAME || import.meta.env.GITHUB_USERNAME || "";

function GalleryPage() {
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadState, setUploadState] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [selectedImage, setSelectedImage] = useState<UploadedImage | null>(
    null,
  );
  const [isDragging, setIsDragging] = useState(false);
  const [hoveredImageId, setHoveredImageId] = useState<string | null>(null);
  const [enableUpscale, setEnableUpscale] = useState(true);
  const [isLoadingImages, setIsLoadingImages] = useState(true);
  const [columns, setColumns] = useState(4);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const upscalerRef = useRef<any>(null);

  const trpc = useTRPC();
  const { mutateAsync: initCollectionMutation } = useMutation({
    ...trpc.gistDB.initCollection.mutationOptions(),
  });

  const { data: listImagesData = [], refetch: refetchImages } = useQuery(
    trpc.gistDB.listImages.queryOptions(),
  );

  const dataKey = useMemo(() => {
    if (!listImagesData || !Array.isArray(listImagesData)) return "";
    return listImagesData
      .map((obj: any) => obj.uuid)
      .sort()
      .join(",");
  }, [listImagesData]);

  const { mutateAsync: saveImageMutation } = useMutation({
    ...trpc.gistDB.saveImage.mutationOptions(),
    onSuccess: () => {
      refetchImages();
    },
  });

  const { mutateAsync: deleteImageMutation } = useMutation({
    ...trpc.gistDB.deleteImage.mutationOptions(),
    onSuccess: () => {
      refetchImages();
    },
  });

  useEffect(() => {
    const updateColumns = () => {
      const width = window.innerWidth;
      if (width < 640) {
        setColumns(2); // Mobile
      } else if (width < 1024) {
        setColumns(3); // Tablet
      } else if (width < 1536) {
        setColumns(4); // Desktop
      } else {
        setColumns(4); // Large screens
      }
    };

    updateColumns();
    window.addEventListener("resize", updateColumns);
    return () => window.removeEventListener("resize", updateColumns);
  }, []);

  useEffect(() => {
    const initUpscaler = async () => {
      try {
        const upscaler = new Upscaler();
        upscalerRef.current = upscaler;
      } catch (error) {
        console.error("Failed to initialize upscaler:", error);
      }
    };
    initUpscaler();

    return () => {
      if (upscalerRef.current?.dispose) {
        upscalerRef.current.dispose();
      }
    };
  }, []);

  useEffect(() => {
    initCollectionMutation();
  }, []);

  useEffect(() => {
    const loadImagesFromGistDB = async () => {
      if (!dataKey) {
        setIsLoadingImages(false);
        setImages([]);
        return;
      }

      setIsLoadingImages(true);

      const loadedImages = await Promise.allSettled(
        listImagesData.map(async (obj: any) => {
          const img = obj.data;
          const { data: gistData } = await githubAxios.get<any>(
            `/gists/${img.gistId}`,
          );

          const fileData = gistData.files[img.fileName];
          if (!fileData?.raw_url) {
            throw new Error(`No raw_url for: ${img.fileName}`);
          }

          const { data: imageData } = await githubRawAxios.get<any>(
            fileData.raw_url,
          );
          const byteCharacters = atob(imageData.data);
          const byteNumbers = new Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);
          const blob = new Blob([byteArray], { type: imageData.mimeType });
          const blobUrl = URL.createObjectURL(blob);

          return { ...img, url: blobUrl, gistDbUuid: obj.uuid };
        }),
      );

      const validImages = loadedImages
        .filter((result) => result.status === "fulfilled")
        .map(
          (result) => (result as PromiseFulfilledResult<UploadedImage>).value,
        );
      validImages.sort((a, b) => b.uploadedAt - a.uploadedAt);

      setImages(validImages);
      setIsLoadingImages(false);
    };

    loadImagesFromGistDB();
  }, [dataKey]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && selectedImage) {
        setSelectedImage(null);
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "u") {
        e.preventDefault();
        fileInputRef.current?.click();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedImage]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const saveToStorage = useCallback(
    async (newImage: UploadedImage) => {
      try {
        const result = await saveImageMutation({
          id: newImage.id,
          fileName: newImage.fileName,
          gistId: newImage.gistId,
          uploadedAt: newImage.uploadedAt,
          width: newImage.width,
          height: newImage.height,
          aspectRatio: newImage.aspectRatio,
        });

        if (result && (result as any).uuid) {
          newImage.gistDbUuid = (result as any).uuid;
        }
      } catch (error) {
        console.error("Failed to save to GistDB:", error);
        sileo.error({ title: "Failed to persist image" });
      }
    },
    [saveImageMutation],
  );

  const handleUpload = useCallback(
    async (file: File) => {
      if (!file.type.startsWith("image/")) {
        sileo.error({ title: "Invalid file type" });
        return;
      }

      if (!GITHUB_TOKEN || !GITHUB_USERNAME) {
        sileo.error({ title: "GitHub credentials not configured" });
        console.error("Missing credentials:", {
          hasToken: !!GITHUB_TOKEN,
          hasUsername: !!GITHUB_USERNAME,
        });
        return;
      }

      setUploading(true);
      setUploadState("loading");

      const getImageDimensions = (
        file: File,
      ): Promise<{ width: number; height: number }> => {
        return new Promise((resolve) => {
          const img = new Image();
          img.onload = () => {
            resolve({ width: img.width, height: img.height });
          };
          img.src = URL.createObjectURL(file);
        });
      };

      try {
        const originalDimensions = await getImageDimensions(file);
        let processedFile = file;
        let finalDimensions = originalDimensions;

        if (enableUpscale && upscalerRef.current) {
          let imageUrl: string | null = null;
          let upscaledSrc: string | null = null;
          let img: HTMLImageElement | null = null;
          let canvas: HTMLCanvasElement | null = null;

          try {
            imageUrl = URL.createObjectURL(file);
            upscaledSrc = await upscalerRef.current.upscale(imageUrl);

            img = new Image();
            await new Promise((resolve, reject) => {
              img!.onload = resolve;
              img!.onerror = reject;
              img!.src = upscaledSrc!;
            });

            canvas = document.createElement("canvas");
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext("2d", {
              alpha: false,
              willReadFrequently: false,
            });

            if (!ctx) throw new Error("Failed to get canvas context");

            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = "high";
            ctx.drawImage(img, 0, 0);

            // Convert to blob with maximum quality (1.0 for PNG, 0.98 for JPEG)
            const quality = file.type === "image/png" ? 1.0 : 0.98;
            const upscaledBlob = await new Promise<Blob>((resolve) => {
              canvas!.toBlob((b) => resolve(b!), file.type, quality);
            });

            processedFile = new File([upscaledBlob], file.name, {
              type: file.type,
            });
            finalDimensions = await getImageDimensions(processedFile);
          } catch (upscaleError) {
            console.warn("Upscale failed, using original:", upscaleError);
          } finally {
            if (imageUrl) URL.revokeObjectURL(imageUrl);
            if (upscaledSrc) URL.revokeObjectURL(upscaledSrc);
            if (img) {
              img.onload = null;
              img.onerror = null;
              img.src = "";
              img = null;
            }
            if (canvas) {
              const ctx = canvas.getContext("2d");
              if (ctx) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
              }
              canvas.width = 0;
              canvas.height = 0;
              canvas = null;
            }

            // Dispose and reinitialize upscaler to free GPU memory
            try {
              if (upscalerRef.current?.dispose) {
                await upscalerRef.current.dispose();
              }
              upscalerRef.current = new Upscaler();
            } catch (e) {
              console.warn("Failed to reinitialize upscaler:", e);
            }
          }
        }

        const formData = new FormData();
        formData.append("image", processedFile);
        formData.append("githubAccessToken", GITHUB_TOKEN);
        formData.append("githubUsername", GITHUB_USERNAME);

        const { data } = await workerAxios.post<any>("/", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
        if (!data.success || !data.gistId) {
          throw new Error("Invalid response from server");
        }

        const { data: gistData } = await githubAxios.get<any>(
          `/gists/${data.gistId}`,
        );
        const fileData = gistData.files[data.fileName];
        if (!fileData || !fileData.raw_url) {
          throw new Error("Could not get image URL from gist");
        }

        const { data: imageData } = await githubRawAxios.get<any>(
          fileData.raw_url,
        );

        const base64Data = imageData.data;
        const mimeType = imageData.mimeType || processedFile.type;
        const byteCharacters = atob(base64Data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: mimeType });
        const blobUrl = URL.createObjectURL(blob);

        const newImage: UploadedImage = {
          id: data.gistId + "_" + Date.now(),
          url: blobUrl, // Use blob URL for display
          fileName: data.fileName,
          gistId: data.gistId,
          uploadedAt: Date.now(),
          width: finalDimensions.width,
          height: finalDimensions.height,
          aspectRatio: finalDimensions.width / finalDimensions.height,
        };

        setImages((prev) => [newImage, ...prev]);
        await saveToStorage(newImage);

        setUploadState("success");
        sileo.success({
          title: "Uploaded",
        });
      } catch (error) {
        console.error("Upload error:", error);
        setUploadState("error");
        const errorMessage =
          error instanceof Error ? error.message : "Upload failed";
        sileo.error({ title: errorMessage });
      } finally {
        setUploading(false);
        setTimeout(() => setUploadState("idle"), 2500);
      }
    },
    [images, saveToStorage],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith("image/")) {
        handleUpload(file);
      } else {
        sileo.error({ title: "Please drop a valid image file" });
      }
    },
    [handleUpload],
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleUpload(file);
      }
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    [handleUpload],
  );

  const handleDelete = useCallback(
    async (imageId: string) => {
      const imageToDelete = images.find((img) => img.id === imageId);

      setImages((prev) => prev.filter((img) => img.id !== imageId));
      setSelectedImage(null);

      if (imageToDelete?.gistDbUuid) {
        try {
          await deleteImageMutation({ id: imageToDelete.gistDbUuid });
          sileo.success({ title: "Image deleted" });
        } catch (error) {
          console.error("Failed to delete from GistDB:", error);
          sileo.error({ title: "Failed to delete from storage" });
        }
      } else {
        sileo.success({ title: "Image deleted" });
      }
    },
    [images, deleteImageMutation],
  );

  return (
    <div
      className="min-h-screen bg-black text-white"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {isDragging && (
        <div className="fixed inset-0 bg-white/5 backdrop-blur-sm z-40 flex items-center justify-center pointer-events-none">
          <div className="border border-white/20 rounded-lg p-8">
            <UploadCloud className="h-12 w-12 mx-auto text-white/60" />
          </div>
        </div>
      )}

      <div className="container mx-auto px-px pt-12 pb-0 max-w-7xl">
        <div className="flex items-center justify-end gap-4 mb-2 px-6">
          <div className="relative group">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={enableUpscale}
                  onChange={(e) => setEnableUpscale(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-white/10 rounded-full peer-checked:bg-white/20 transition-all border border-white/20 peer-checked:border-white/30"></div>
                <div className="absolute left-0.5 top-0.5 w-5 h-5 bg-white/60 rounded-full transition-all peer-checked:translate-x-5 peer-checked:bg-white shadow-sm"></div>
              </div>
            </label>
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-gray-400 text-black text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-lg">
              {enableUpscale ? "2x upscaling enabled" : "Upscaling disabled"}
              <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px border-4 border-transparent border-t-white"></div>
            </div>
          </div>

          <PrimeButton
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            actionState={uploadState}
            loadingText="Uploading"
            successText="Uploaded"
            errorText="Failed"
            variant="outline"
            className="border-white/20 hover:border-white/40 bg-transparent text-white"
          >
            <UploadCloud className="mr-2 h-4 w-4" />
            Upload
          </PrimeButton>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>

        {isLoadingImages ? (
          <div className="flex items-center justify-center h-[calc(100vh-180px)]">
            <div className="flex flex-col items-center gap-4">
              <Loader className="size-10" />
            </div>
          </div>
        ) : images.length === 0 ? (
          <div className="flex items-center justify-center h-[calc(100vh-180px)] text-white/40">
            <p>No images yet</p>
          </div>
        ) : (
          <MasonryGrid
            images={images}
            columns={columns}
            gap={12}
            onImageClick={(image) => setSelectedImage(image)}
            onImageHover={(id) => setHoveredImageId(id)}
            hoveredImageId={hoveredImageId}
            onDelete={handleDelete}
          >
            {(item) => (
              <div
                className="relative w-full h-full cursor-pointer overflow-hidden group rounded-lg"
                onClick={() => setSelectedImage(item)}
                onMouseEnter={() => setHoveredImageId(item.id)}
                onMouseLeave={() => setHoveredImageId(null)}
              >
                <img
                  src={item.url}
                  alt={item.fileName}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  loading="lazy"
                  decoding="async"
                  onError={(e) => {
                    e.currentTarget.src =
                      'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23000" width="100" height="100"/%3E%3C/svg%3E';
                  }}
                />

                <div
                  className="absolute inset-x-0 bottom-0 h-1/3 bg-linear-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none backdrop-blur-[2px]"
                  style={{
                    maskImage:
                      "linear-gradient(to top, black 0%, transparent 100%)",
                    WebkitMaskImage:
                      "linear-gradient(to top, black 0%, transparent 100%)",
                  }}
                />

                {hoveredImageId === item.id && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(item.id);
                    }}
                    className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-red-600/80 rounded backdrop-blur-sm transition-colors z-10"
                    title="Delete image"
                  >
                    <Trash2 className="h-3.5 w-3.5 text-white" />
                  </button>
                )}
              </div>
            )}
          </MasonryGrid>
        )}

        {selectedImage && (
          <div
            className="fixed inset-0 bg-black/95 backdrop-blur-xl z-50 flex items-center justify-center p-8 animate-in fade-in duration-200"
            onClick={() => setSelectedImage(null)}
          >
            <div
              className="relative w-full h-full flex items-center justify-center animate-in zoom-in-95 duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setSelectedImage(null)}
                className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded transition-colors"
              >
                <X className="h-4 w-4" />
              </button>

              <img
                src={selectedImage.url}
                alt={selectedImage.fileName}
                className="max-w-full max-h-full object-contain"
                style={{
                  maxHeight: "calc(100vh - 100px)",
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
