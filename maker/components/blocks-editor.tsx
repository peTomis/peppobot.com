"use client";

import { closestCenter, DndContext, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useRef } from "react";
import type { Accent, ReportBlock, ReportImage } from "@/content/games";
import type { KeyedBlock } from "../lib/draft";
import { buttonClass, Field, labelClass, Select, TextInput, TranslatedInput } from "./fields";

type BlockType = ReportBlock["type"];

const TYPES: { type: BlockType; label: string }[] = [
  { type: "heading", label: "Heading" },
  { type: "paragraph", label: "Paragraph" },
  { type: "image", label: "Image" },
  { type: "pair", label: "Image pair" },
  { type: "quote", label: "Quote" },
  { type: "facts", label: "Facts" },
];

const LABELS = Object.fromEntries(TYPES.map(({ type, label }) => [type, label])) as Record<BlockType, string>;

function newBlock(type: BlockType): ReportBlock {
  switch (type) {
    case "heading":
      return { type, text: [] };
    case "paragraph":
      return { type, text: [] };
    case "image":
      return { type, image: { alt: [] } };
    case "pair":
      return { type, images: [{ alt: [] }, { alt: [] }] };
    case "quote":
      return { type, text: [] };
    case "facts":
      return { type, facts: [{ label: [], value: "" }] };
  }
}

/** The report's blocks: drag by the handle to reorder, add new ones at the end. */
export function BlocksEditor({ blocks, onChange }: { blocks: KeyedBlock[]; onChange: (blocks: KeyedBlock[]) => void }) {
  // New keys never collide with the positional ones given on load.
  const counter = useRef(0);
  const nextKey = () => `n${++counter.current}`;
  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const from = blocks.findIndex((entry) => entry.key === active.id);
    const to = blocks.findIndex((entry) => entry.key === over.id);
    onChange(arrayMove(blocks, from, to));
  };

  const update = (key: string, block: ReportBlock) => onChange(blocks.map((entry) => (entry.key === key ? { key, block } : entry)));

  return (
    <div className="flex flex-col gap-3">
      {/* A fixed id keeps dnd-kit's accessibility ids the same on server and client. */}
      <DndContext id="blocks" sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={blocks.map((entry) => entry.key)} strategy={verticalListSortingStrategy}>
          {blocks.map((entry, index) => (
            <SortableBlock
              key={entry.key}
              entry={entry}
              onChange={(block) => update(entry.key, block)}
              onDuplicate={() => onChange([...blocks.slice(0, index + 1), { key: nextKey(), block: structuredClone(entry.block) }, ...blocks.slice(index + 1)])}
              onRemove={() => onChange(blocks.filter((other) => other.key !== entry.key))}
            />
          ))}
        </SortableContext>
      </DndContext>
      <div className="flex flex-wrap gap-2">
        {TYPES.map(({ type, label }) => (
          <button key={type} type="button" className={buttonClass} onClick={() => onChange([...blocks, { key: nextKey(), block: newBlock(type) }])}>
            + {label}
          </button>
        ))}
      </div>
    </div>
  );
}

function SortableBlock({ entry, onChange, onDuplicate, onRemove }: { entry: KeyedBlock; onChange: (block: ReportBlock) => void; onDuplicate: () => void; onRemove: () => void }) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id: entry.key });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={`flex flex-col gap-3 border border-line bg-surface p-3 ${isDragging ? "relative z-10 border-acc shadow-2xl" : ""}`}
    >
      <div className="flex items-center gap-2">
        <button
          type="button"
          ref={setActivatorNodeRef}
          {...attributes}
          {...listeners}
          aria-label={`Move ${LABELS[entry.block.type]} block`}
          className="cursor-grab touch-none px-1.5 font-mono text-base leading-none text-fg-dim hover:text-acc active:cursor-grabbing"
        >
          ⠿
        </button>
        <span className={`${labelClass} flex-1 text-acc!`}>{LABELS[entry.block.type]}</span>
        <button type="button" className={buttonClass} onClick={onDuplicate}>
          Duplicate
        </button>
        <button type="button" className={`${buttonClass} hover:border-acc3!`} onClick={onRemove}>
          Remove
        </button>
      </div>
      <BlockFields block={entry.block} onChange={onChange} />
    </div>
  );
}

const ACCENT_OPTIONS: { value: Accent | ""; label: string }[] = [
  { value: "", label: "Auto (in turn)" },
  { value: "acc", label: "Green" },
  { value: "acc2", label: "Purple" },
  { value: "acc3", label: "Pink" },
];

function AccentSelect({ value, onChange }: { value: Accent | undefined; onChange: (value: Accent | undefined) => void }) {
  return (
    <Field label="Accent" className="max-w-48">
      <Select value={value ?? ""} options={ACCENT_OPTIONS} onChange={(next) => onChange(next || undefined)} />
    </Field>
  );
}

function ImageFields({ image, onChange, label }: { image: ReportImage; onChange: (image: ReportImage) => void; label: string }) {
  return (
    <div className="flex flex-col gap-2">
      <Field label={`${label} URL`}>
        <TextInput value={image.src ?? ""} placeholder="https://… (empty shows a placeholder)" onChange={(src) => onChange({ ...image, src: src || undefined })} />
      </Field>
      <Field label={`${label} alt text`}>
        <TranslatedInput value={image.alt} onChange={(alt) => onChange({ ...image, alt })} />
      </Field>
    </div>
  );
}

function BlockFields({ block, onChange }: { block: ReportBlock; onChange: (block: ReportBlock) => void }) {
  switch (block.type) {
    case "heading":
      return (
        <>
          <TranslatedInput value={block.text} onChange={(text) => onChange({ ...block, text })} placeholder="Heading" />
          <AccentSelect value={block.accent} onChange={(accent) => onChange({ ...block, accent })} />
        </>
      );
    case "paragraph":
      return <TranslatedInput multiline value={block.text} onChange={(text) => onChange({ ...block, text })} placeholder="Paragraph" />;
    case "quote":
      return (
        <>
          <TranslatedInput multiline value={block.text} onChange={(text) => onChange({ ...block, text })} placeholder="Quote" />
          <AccentSelect value={block.accent} onChange={(accent) => onChange({ ...block, accent })} />
        </>
      );
    case "image":
      return (
        <>
          <ImageFields label="Image" image={block.image} onChange={(image) => onChange({ ...block, image })} />
          <Field label="Caption">
            <TranslatedInput value={block.caption ?? []} onChange={(caption) => onChange({ ...block, caption })} />
          </Field>
          <AccentSelect value={block.accent} onChange={(accent) => onChange({ ...block, accent })} />
        </>
      );
    case "pair":
      return (
        <>
          <ImageFields label="Left image" image={block.images[0]} onChange={(image) => onChange({ ...block, images: [image, block.images[1]] })} />
          <ImageFields label="Right image" image={block.images[1]} onChange={(image) => onChange({ ...block, images: [block.images[0], image] })} />
          <Field label="Caption">
            <TranslatedInput value={block.caption ?? []} onChange={(caption) => onChange({ ...block, caption })} />
          </Field>
        </>
      );
    case "facts":
      return (
        <div className="flex flex-col gap-2">
          {block.facts.map((fact, index) => {
            const set = (next: typeof fact) => onChange({ ...block, facts: block.facts.map((other, i) => (i === index ? next : other)) });
            return (
              <div key={index} className="flex items-start gap-2">
                <div className="w-24 shrink-0">
                  <TextInput value={fact.value} placeholder="Value" onChange={(value) => set({ ...fact, value })} />
                </div>
                <div className="flex-1 min-w-0">
                  <TranslatedInput value={fact.label} placeholder="Label" onChange={(label) => set({ ...fact, label })} />
                </div>
                <button type="button" className={buttonClass} aria-label="Remove fact" onClick={() => onChange({ ...block, facts: block.facts.filter((_, i) => i !== index) })}>
                  ✕
                </button>
              </div>
            );
          })}
          <button type="button" className={`${buttonClass} self-start`} onClick={() => onChange({ ...block, facts: [...block.facts, { label: [], value: "" }] })}>
            + Fact
          </button>
        </div>
      );
  }
}
