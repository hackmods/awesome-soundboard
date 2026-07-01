"use client";

import { useCallback, useState } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Clip, Category } from "@/lib/db/schema";
import { ClipButton } from "./clip-button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";

function SortableClip({
  clip,
  isPlaying,
  editable,
  onPlay,
  onEdit,
}: {
  clip: Clip;
  isPlaying: boolean;
  editable?: boolean;
  onPlay: () => void;
  onEdit?: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: clip.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <ClipButton clip={clip} isPlaying={isPlaying} editable={editable} onPlay={onPlay} onEdit={onEdit} />
    </div>
  );
}

type ClipGridProps = {
  clips: Clip[];
  categories: Category[];
  playingIds: string[];
  editable?: boolean;
  onPlay: (clip: Clip) => void;
  onEdit?: (clip: Clip) => void;
  onReorder?: (orderedIds: string[]) => void;
  search?: string;
  onSearchChange?: (value: string) => void;
};

export function ClipGrid({
  clips,
  categories,
  playingIds,
  editable,
  onPlay,
  onEdit,
  onReorder,
  search,
  onSearchChange,
}: ClipGridProps) {
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const filteredClips = clips.filter((clip) => {
    const matchesCategory =
      activeCategory === "all" ||
      (activeCategory === "uncategorized" ? !clip.categoryId : clip.categoryId === activeCategory);
    const matchesSearch =
      !search?.trim() ||
      clip.name.toLowerCase().includes(search.toLowerCase()) ||
      (clip.hotkey?.toLowerCase().includes(search.toLowerCase()) ?? false);
    return matchesCategory && matchesSearch;
  });

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id || !onReorder) return;

      const oldIndex = filteredClips.findIndex((c) => c.id === active.id);
      const newIndex = filteredClips.findIndex((c) => c.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return;

      const reordered = arrayMove(filteredClips, oldIndex, newIndex);
      onReorder(reordered.map((c) => c.id));
    },
    [filteredClips, onReorder]
  );

  const grid = (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={filteredClips.map((c) => c.id)} strategy={rectSortingStrategy}>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {filteredClips.map((clip) => (
            <SortableClip
              key={clip.id}
              clip={clip}
              isPlaying={playingIds.includes(clip.id)}
              editable={editable}
              onPlay={() => onPlay(clip)}
              onEdit={onEdit ? () => onEdit(clip) : undefined}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );

  if (categories.length === 0) {
    return (
      <div className="space-y-4">
        {onSearchChange && (
          <Input
            placeholder="Search clips..."
            value={search ?? ""}
            onChange={(e) => onSearchChange(e.target.value)}
            className="max-w-sm"
          />
        )}
        {filteredClips.length === 0 ? (
          <p className="py-12 text-center text-muted-foreground">No clips yet. Upload some audio to get started.</p>
        ) : (
          grid
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {onSearchChange && (
        <Input
          placeholder="Search clips..."
          value={search ?? ""}
          onChange={(e) => onSearchChange(e.target.value)}
          className="max-w-sm"
        />
      )}
      <Tabs value={activeCategory} onValueChange={setActiveCategory}>
        <TabsList className="flex-wrap">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="uncategorized">Uncategorized</TabsTrigger>
          {categories.map((cat) => (
            <TabsTrigger key={cat.id} value={cat.id}>
              {cat.name}
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value={activeCategory} className="mt-4">
          {filteredClips.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">No clips in this category.</p>
          ) : (
            grid
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
