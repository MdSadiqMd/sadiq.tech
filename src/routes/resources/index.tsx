import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, type FormEvent } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { PlusIcon, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTRPC } from "@/integrations/trpc/react";

interface Resource {
  id?: string;
  name: string;
  resource: string;
  tag: string;
  color: string;
}

interface Tag {
  name: string;
  color: string;
}

const COLORS = [
  "#F87171", // red
  "#FB923C", // orange
  "#FBBF24", // amber
  "#34D399", // emerald
  "#22D3EE", // cyan
  "#818CF8", // indigo
  "#A78BFA", // violet
  "#F472B6", // pink
  "#EC4899", // pink-600
  "#14B8A6", // teal-500
  "#6366F1", // indigo-500
  "#8B5CF6", // violet-500
  "#10B981", // emerald-500
  "#6EE7B7", // emerald-300
  "#93C5FD", // blue-300
  "#60A5FA", // blue-400
  "#A855F7", // purple-500
  "#F43F5E", // rose-500
  "#2DD4BF", // teal-400
  "#4ADE80", // green-400
  "#FB7185", // rose-400
  "#C084FC", // purple-400
  "#F9FAFB", // gray-50
  "#F3F4F6", // gray-100
  "#E5E7EB", // gray-200
  "#D1D5DB", // gray-300
  "#9CA3AF", // gray-400
  "#6B7280", // gray-500
  "#4B5563", // gray-600
  "#374151", // gray-700
  "#1F2937", // gray-800
  "#111827", // gray-900
  "#BFDBFE", // blue-200
  "#3B82F6", // blue-500
  "#2563EB", // blue-600
  "#1D4ED8", // blue-700
  "#FDE68A", // amber-200
  "#F59E0B", // amber-500
  "#D97706", // amber-600
  "#B45309", // amber-700
  "#A7F3D0", // emerald-200
  "#059669", // emerald-600
  "#047857", // emerald-700
  "#DDD6FE", // violet-200
  "#7C3AED", // violet-600
  "#6D28D9", // violet-700
  "#FCA5A5", // red-200
  "#EF4444", // red-500
  "#DC2626", // red-600
  "#B91C1C", // red-700
];

export const Route = createFileRoute("/resources/")({
  component: ResourcesPage,
  head: () => ({
    meta: [
      {
        title: "MdSadiqMd | Resources",
      },
    ],
  }),
  loader: async ({ context }) => {
    // Prefetch resources and tags on server
    await Promise.all([
      context.queryClient.prefetchQuery(
        context.trpc.resources.list.queryOptions(),
      ),
      context.queryClient.prefetchQuery(context.trpc.tags.list.queryOptions()),
    ]);
  },
});

function ResourcesPage() {
  const trpc = useTRPC();

  // Queries
  const { data: resourcesData, refetch: refetchResources } = useQuery(
    trpc.resources.list.queryOptions(),
  );
  const { data: tagsData, refetch: refetchTags } = useQuery(
    trpc.tags.list.queryOptions(),
  );

  const resources = (resourcesData as Resource[] | undefined) ?? [];
  const tags = (tagsData as Tag[] | undefined) ?? [];

  // Mutations
  const { mutateAsync: addResource } = useMutation({
    ...trpc.resources.add.mutationOptions(),
    onSuccess: () => {
      refetchResources();
    },
  });

  const { mutateAsync: deleteResource } = useMutation({
    ...trpc.resources.delete.mutationOptions(),
    onSuccess: () => {
      refetchResources();
    },
  });

  const { mutateAsync: addTag } = useMutation({
    ...trpc.tags.add.mutationOptions(),
    onSuccess: () => {
      refetchTags();
    },
  });

  const [newTag, setNewTag] = useState("");
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [resourceToDelete, setResourceToDelete] = useState<Resource | null>(
    null,
  );
  const [formData, setFormData] = useState({
    name: "",
    resource: "",
    tag: "",
  });

  const handleAddTag = async () => {
    if (newTag && !tags.find((t) => t.name === newTag)) {
      await addTag({
        name: newTag,
        color: selectedColor,
      });
      setNewTag("");
    }
  };

  const handleAddResource = async (e: FormEvent) => {
    e.preventDefault();
    const { name, resource, tag } = formData;
    if (!name || !resource || !tag) {
      alert("Please fill all fields");
      return;
    }

    const tagColor = tags.find((t) => t.name === tag)?.color || COLORS[0];
    await addResource({
      name: name.trim(),
      resource: resource.trim(),
      tag: tag.trim(),
      color: tagColor,
    });
    setFormData({ name: "", resource: "", tag: "" });
  };

  const handleDeleteConfirm = async () => {
    if (resourceToDelete?.id) {
      await deleteResource({ id: resourceToDelete.id });
      setDeleteDialogOpen(false);
      setResourceToDelete(null);
    }
  };

  const handleDeleteClick = (resource: Resource) => {
    setResourceToDelete(resource);
    setDeleteDialogOpen(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const groupedResources = useMemo(() => {
    return resources.reduce(
      (acc, resource) => {
        if (!acc[resource.tag]) {
          acc[resource.tag] = [];
        }
        acc[resource.tag].push(resource);
        return acc;
      },
      {} as Record<string, Resource[]>,
    );
  }, [resources]);

  const ensureValidUrl = (url: string) => {
    if (!/^https?:\/\//i.test(url)) {
      return `https://${url}`;
    }
    return url;
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-4 sm:p-6 max-w-screen-2xl mx-auto">
      <div className="space-y-4 sm:space-y-6">
        <div className="flex items-center space-x-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-9 border-zinc-700 bg-zinc-900 hover:bg-zinc-900 hover:text-white focus:ring-2 focus:ring-violet-500/20"
              >
                <div
                  className="w-4 h-4 rounded-full mr-2"
                  style={{ backgroundColor: selectedColor }}
                />
                Add label
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-3 bg-zinc-900 border-zinc-700">
              <div className="space-y-4">
                <div className="flex space-x-2">
                  <Input
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    className="h-9 text-white bg-zinc-800 border-zinc-700 focus:ring-2 focus:ring-violet-500/20 hover:border-zinc-600"
                    placeholder="Enter label name..."
                  />
                  <Button
                    size="sm"
                    onClick={handleAddTag}
                    className="h-9 px-3 bg-violet-600 hover:bg-violet-700 focus:ring-2 focus:ring-violet-500/20"
                  >
                    <PlusIcon className="h-4 w-4" />
                  </Button>
                </div>
                <div className="grid grid-cols-6 gap-2">
                  {COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      className={`w-8 h-8 rounded-full transition-all ${
                        selectedColor === color
                          ? "ring-2 ring-violet-400 scale-110"
                          : "hover:scale-110 hover:ring-2 hover:ring-violet-500/50"
                      }`}
                      style={{ backgroundColor: color }}
                      onClick={() => setSelectedColor(color)}
                    />
                  ))}
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        <form
          onSubmit={handleAddResource}
          className="flex flex-col sm:flex-row gap-3"
        >
          <Input
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            className="h-9 bg-zinc-900 border-zinc-700 focus:ring-2 focus:ring-violet-500/20 hover:border-zinc-600"
            placeholder="Description"
            required
          />
          <Input
            name="resource"
            value={formData.resource}
            onChange={handleInputChange}
            className="h-9 bg-zinc-900 border-zinc-700 focus:ring-2 focus:ring-violet-500/20 hover:border-zinc-600"
            placeholder="Resource"
            required
          />
          <Select
            value={formData.tag}
            onValueChange={(value) => setFormData({ ...formData, tag: value })}
            required
          >
            <SelectTrigger className="h-9 text-white bg-zinc-900 border-zinc-700 focus:ring-2 focus:ring-violet-500/20 hover:border-zinc-600">
              <SelectValue placeholder="Select tag" />
            </SelectTrigger>
            <SelectContent className="bg-zinc-900 border-zinc-700">
              {tags.map((tag) => (
                <SelectItem
                  key={tag.name}
                  value={tag.name}
                  className="hover:bg-zinc-800 focus:bg-zinc-800 cursor-pointer"
                >
                  <div className="flex text-white items-center">
                    <div
                      className="w-2 h-2 rounded-full mr-2"
                      style={{
                        backgroundColor: tag.color,
                      }}
                    />
                    {tag.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button type="submit" className="h-9 px-4" variant="secondary">
            Add Resource
          </Button>
        </form>

        <div className="space-y-6">
          {Object.entries(groupedResources).map(([tag, tagResources]) => (
            <div key={tag} className="mb-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center text-zinc-100">
                <div
                  className="w-3 h-3 rounded-full mr-2"
                  style={{
                    backgroundColor:
                      tags.find((t) => t.name === tag)?.color || COLORS[0],
                  }}
                />
                {tag}
              </h2>
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {tagResources.map((resource) => (
                  <div
                    key={resource.id}
                    className="bg-zinc-900 border border-zinc-800 p-4 rounded-lg hover:bg-zinc-800/50 transition-colors hover:border-zinc-700"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{
                            backgroundColor: resource.color,
                          }}
                        />
                        <span className="text-sm text-zinc-400">
                          {resource.tag}
                        </span>
                      </div>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="h-8 px-2 bg-red-500/10 hover:bg-red-500/20 text-red-500"
                        onClick={() => handleDeleteClick(resource)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <h3 className="font-medium mb-1 text-zinc-100">
                      {resource.name}
                    </h3>
                    <p className="text-sm text-zinc-400">
                      <a
                        href={ensureValidUrl(resource.resource)}
                        target="_blank"
                        rel="noreferrer"
                        className="cursor-pointer hover:underline"
                      >
                        {resource.resource}
                      </a>
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-700">
          <DialogHeader>
            <DialogTitle className="text-zinc-100">Delete Resource</DialogTitle>
            <DialogDescription className="text-zinc-400">
              Are you sure you want to delete this resource? This action cannot
              be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-start">
            <Button
              type="button"
              variant="destructive"
              onClick={handleDeleteConfirm}
              className="bg-red-500 hover:bg-red-600"
            >
              Delete
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              className="text-white hover:text-white bg-zinc-800 hover:bg-zinc-700 border-zinc-700"
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
