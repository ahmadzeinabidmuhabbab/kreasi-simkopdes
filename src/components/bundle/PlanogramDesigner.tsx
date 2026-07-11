"use client";

import {
  closestCenter,
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { useMemo, useState } from "react";

interface InventoryItem {
  id: number;
  name: string;
  unit: string;
  stock: number;
  minStock: number;
  reorderPoint: number;
  velocity: number;
  restock: number;
  status: string;
  category: string;
  price?: number;
  associationCount?: number;
  associationRank?: number;
}

interface PlanogramSlotItem {
  scenarioId: string;
  scenarioName: string;
  slot: string;
  shelf: number;
  row: number;
  rowPosition: string;
  column: number;
  produk: string;
  kategori: string;
  hargaRupiah: number;
  weightClass: string;
  adjacentReference?: string | null;
  ruleTheme?: string | null;
  ruleConfidence: number;
  ruleLift: number;
  ruleSupportCount: number;
  sourceRule?: string | null;
  placementReason: string;
}

interface PlanogramScenario {
  scenarioId: string;
  name: string;
  objective: string;
  editable: boolean;
  layoutSlots: PlanogramSlotItem[];
}

interface PlanogramPayload {
  success: boolean;
  scenarios: PlanogramScenario[];
}

interface PlanogramDesignerProps {
  inventory: InventoryItem[];
  loading: boolean;
  onToast?: (message: string) => void;
  planogram?: PlanogramPayload | null;
}

const rackIds = ["A", "B"] as const;
type RackId = (typeof rackIds)[number];
type SlotId = `${RackId}-${number}`;

type DragData =
  | { type: "catalog"; productId: number }
  | { type: "slot"; productId: number; slotId: SlotId };

interface DropValidationResponse {
  success: boolean;
  correlated: boolean;
  slotRecommended: boolean;
  requiresConfirmation: boolean;
  resetRequired: boolean;
  message: string;
  activeProducts: string[];
  activeSlots: SlotId[];
}

interface PendingPlacement {
  data: DragData;
  targetSlot: SlotId;
  product: InventoryItem;
  message: string;
}

const slotIndexes = Array.from({ length: 18 }, (_, index) => index + 1);
const rowIndexes = [0, 1, 2] as const;
const columnIndexes = [0, 1, 2, 3, 4, 5] as const;

const productTones = [
  {
    swatch: "bg-emerald-500",
    card: "border-emerald-200 bg-emerald-50 text-emerald-950",
    pack: "border-emerald-200 bg-emerald-50 text-emerald-950 shadow-emerald-900/10",
    strip: "bg-emerald-500",
    cap: "bg-emerald-100",
  },
  {
    swatch: "bg-amber-500",
    card: "border-amber-200 bg-amber-50 text-amber-950",
    pack: "border-amber-200 bg-amber-50 text-amber-950 shadow-amber-900/10",
    strip: "bg-amber-500",
    cap: "bg-amber-100",
  },
  {
    swatch: "bg-sky-500",
    card: "border-sky-200 bg-sky-50 text-sky-950",
    pack: "border-sky-200 bg-sky-50 text-sky-950 shadow-sky-900/10",
    strip: "bg-sky-500",
    cap: "bg-sky-100",
  },
  {
    swatch: "bg-rose-500",
    card: "border-rose-200 bg-rose-50 text-rose-950",
    pack: "border-rose-200 bg-rose-50 text-rose-950 shadow-rose-900/10",
    strip: "bg-rose-500",
    cap: "bg-rose-100",
  },
  {
    swatch: "bg-violet-500",
    card: "border-violet-200 bg-violet-50 text-violet-950",
    pack: "border-violet-200 bg-violet-50 text-violet-950 shadow-violet-900/10",
    strip: "bg-violet-500",
    cap: "bg-violet-100",
  },
  {
    swatch: "bg-lime-500",
    card: "border-lime-200 bg-lime-50 text-lime-950",
    pack: "border-lime-200 bg-lime-50 text-lime-950 shadow-lime-900/10",
    strip: "bg-lime-500",
    cap: "bg-lime-100",
  },
] as const;

const rackMeta: Record<
  RackId,
  {
    label: string;
    frame: string;
    badge: string;
    check: boolean;
    shelf: string;
    side: string;
    foot: string;
  }
> = {
  A: {
    label: "Rak A",
    frame: "border-violet-300 shadow-violet-500/10",
    badge: "bg-violet-500 text-white shadow-violet-500/25",
    check: true,
    shelf: "from-violet-100 via-white to-violet-200",
    side: "from-violet-100 via-violet-200 to-violet-300",
    foot: "from-violet-300 to-violet-500",
  },
  B: {
    label: "Rak B",
    frame: "border-outline-variant/50 shadow-stone-900/5",
    badge: "bg-violet-500 text-white shadow-violet-500/25",
    check: true,
    shelf: "from-stone-100 via-white to-stone-200",
    side: "from-stone-100 via-stone-200 to-stone-300",
    foot: "from-stone-300 to-stone-500",
  },
};

function makeSlotId(rackId: RackId, slotIndex: number) {
  return `${rackId}-${slotIndex}` as SlotId;
}

function createEmptyPlacements() {
  const placements = {} as Record<SlotId, number | null>;

  rackIds.forEach((rackId) => {
    slotIndexes.forEach((slotIndex) => {
      placements[makeSlotId(rackId, slotIndex)] = null;
    });
  });

  return placements;
}

function buildInitialPlacements() {
  return createEmptyPlacements();
}

function getProductTone(productId: number) {
  return productTones[Math.abs(productId - 1) % productTones.length];
}

function compactProductName(name: string) {
  return name
    .replace("Subsidi", "")
    .replace("Cianjur", "")
    .replace("Kita", "")
    .replace("Lokal", "")
    .replace(/\s+/g, " ")
    .trim();
}

function scenarioCardCopy(scenario: PlanogramScenario) {
  const copy: Record<string, { title: string; description: string }> = {
    "SCN-01": {
      title: "Sembako Harian #1",
      description: "Prioritas kebutuhan pokok",
    },
    "SCN-02": {
      title: "Sembako Harian #2",
      description: "Prioritas kebutuhan pokok",
    },
    "SCN-03": {
      title: "Sembako Harian #3",
      description: "Prioritas kebutuhan pokok",
    },
    CUSTOM: {
      title: "Sembako Harian #4",
      description: "Prioritas kebutuhan pokok",
    },
  };

  return copy[scenario.scenarioId] ?? {
    title: scenario.name,
    description: scenario.objective,
  };
}

function getSlotIdsForRow(rackId: RackId, rowIndex: number) {
  return columnIndexes.map((columnIndex) => makeSlotId(rackId, rowIndex * 6 + columnIndex + 1));
}

export default function PlanogramDesigner({
  inventory,
  loading,
  onToast,
  planogram,
}: PlanogramDesignerProps) {
  const [selectedScenarioId, setSelectedScenarioId] = useState("CUSTOM");
  const [placementOverrides, setPlacementOverrides] = useState<
    Partial<Record<SlotId, number | null>>
  >({});
  const [activePreview, setActivePreview] = useState<InventoryItem | null>(null);
  const [associationContext, setAssociationContext] = useState<string[]>([]);
  const [lastPlacedSlot, setLastPlacedSlot] = useState<SlotId | null>(null);
  const [activeProducts, setActiveProducts] = useState<Set<string>>(new Set());
  const [activeSlots, setActiveSlots] = useState<Set<SlotId>>(new Set());
  const [pendingPlacement, setPendingPlacement] = useState<PendingPlacement | null>(null);

  const scenarios = planogram?.scenarios ?? [];
  const selectedScenario =
    scenarios.find((scenario) => scenario.scenarioId === selectedScenarioId) ??
    scenarios.find((scenario) => scenario.editable) ??
    null;

  const initialPlacements = useMemo(() => buildInitialPlacements(), []);
  const placements = useMemo(
    () => ({ ...initialPlacements, ...placementOverrides }) as Record<SlotId, number | null>,
    [initialPlacements, placementOverrides]
  );
  const productsById = useMemo(
    () => new Map(inventory.map((product) => [product.id, product] as const)),
    [inventory]
  );
  const filledSlots = useMemo(
    () => Object.values(placements).filter((productId) => productId !== null).length,
    [placements]
  );
  const placedProductIds = useMemo(
    () =>
      new Set(
        Object.values(placements).filter(
          (productId): productId is number => productId !== null
        )
      ),
    [placements]
  );
  const availableInventory = useMemo(
    () => inventory.filter((product) => !placedProductIds.has(product.id)),
    [inventory, placedProductIds]
  );
  const hasActiveAssociation = associationContext.length > 0;
  const criticalProducts = useMemo(
    () => inventory.filter((product) => product.status === "Kritis").length,
    [inventory]
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor)
  );

  const handleDragStart = (event: DragStartEvent) => {
    const data = event.active.data.current as DragData | undefined;
    if (!data) return;
    setActivePreview(productsById.get(data.productId) ?? null);
  };

  const applyPlacement = (data: DragData, targetSlot: SlotId) => {
    if (data.type === "catalog") {
      setPlacementOverrides((current) => ({ ...current, [targetSlot]: data.productId }));
      return;
    }

    if (data.slotId === targetSlot) return;

    setPlacementOverrides((current) => ({
      ...current,
      [targetSlot]: placements[data.slotId],
      [data.slotId]: placements[targetSlot],
    }));
  };

  const validateDrop = async (
    product: InventoryItem,
    targetSlot: SlotId
  ): Promise<DropValidationResponse | null> => {
    try {
      const response = await fetch("/api/bundle?resource=validate-planogram-drop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          selectedProducts: associationContext,
          candidateProduct: product.name,
          targetSlot,
          lastSlot: lastPlacedSlot,
        }),
      });
      if (!response.ok) return null;
      return (await response.json()) as DropValidationResponse;
    } catch {
      return null;
    }
  };

  const acceptPlacement = (
    data: DragData,
    targetSlot: SlotId,
    product: InventoryItem,
    validation: DropValidationResponse | null
  ) => {
    applyPlacement(data, targetSlot);
    setLastPlacedSlot(targetSlot);

    if (validation) {
      setAssociationContext((current) => {
        if (current.includes(product.name)) return current;
        return [...current, product.name];
      });
      setActiveProducts(new Set(validation.activeProducts.map(normalizeName)));
      setActiveSlots(new Set(validation.activeSlots));
      onToast?.(`${product.name} ditempatkan di ${targetSlot}.`);
      return;
    }

    setAssociationContext([product.name]);
    onToast?.(`${product.name} ditempatkan di ${targetSlot}.`);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const data = event.active.data.current as DragData | undefined;
    const overId = event.over?.id ? String(event.over.id) : "";
    setActivePreview(null);

    if (!data || !overId.startsWith("slot:")) return;

    const targetSlot = overId.replace("slot:", "") as SlotId;
    const product = productsById.get(data.productId);
    if (!product) return;
    const validation = await validateDrop(product, targetSlot);

    if (validation?.requiresConfirmation) {
      setActiveProducts(new Set(validation.activeProducts.map(normalizeName)));
      setActiveSlots(new Set(validation.activeSlots));
      setPendingPlacement({
        data,
        targetSlot,
        product,
        message: validation.message,
      });
      return;
    }

    acceptPlacement(data, targetSlot, product, validation);
  };

  const confirmPendingPlacement = () => {
    if (!pendingPlacement) return;
    setPlacementOverrides({ [pendingPlacement.targetSlot]: pendingPlacement.product.id });
    setAssociationContext([pendingPlacement.product.name]);
    setLastPlacedSlot(pendingPlacement.targetSlot);
    setActiveProducts(new Set());
    setActiveSlots(new Set());
    onToast?.(`${pendingPlacement.product.name} ditempatkan sebagai awal susunan baru.`);
    setPendingPlacement(null);
  };

  const clearManualFlow = () => {
    setPlacementOverrides({});
    setAssociationContext([]);
    setLastPlacedSlot(null);
    setActiveProducts(new Set());
    setActiveSlots(new Set());
    setPendingPlacement(null);
    onToast?.("Seluruh susunan rak dan rekomendasi produk direset.");
  };

  return (
    <section className="@container/planogram space-y-md">
      {scenarios.length > 0 && (
          <div className="grid gap-xs md:grid-cols-4">
            {scenarios.map((scenario) => {
              const active = selectedScenario?.scenarioId === scenario.scenarioId;
              const cardCopy = scenarioCardCopy(scenario);
              return (
                <button
                  key={scenario.scenarioId}
                  type="button"
                  onClick={() => setSelectedScenarioId(scenario.scenarioId)}
                  className={`min-h-16 rounded-2xl border p-sm text-left shadow-sm transition ${
                    active
                      ? "border-primary/25 bg-primary/10 text-primary"
                      : "border-outline-variant/25 bg-surface-container-lowest text-on-surface hover:bg-surface-container-low"
                  }`}
                >
                <span className="text-[11px] font-extrabold uppercase tracking-wider">
                  {scenario.editable ? "Manual" : scenario.scenarioId}
                </span>
                  <span className="mt-1 block truncate text-sm font-extrabold text-on-surface">
                    {cardCopy.title}
                  </span>
                  <span className="mt-0.5 block truncate text-xs font-semibold text-on-surface-variant">
                    {cardCopy.description}
                  </span>
                </button>
              );
            })}
        </div>
      )}

      {selectedScenario && !selectedScenario.editable ? (
        <ScenarioPreview scenario={selectedScenario} />
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={() => setActivePreview(null)}
        >
          <div className="grid gap-gutter xl:grid-cols-[18rem_minmax(0,1fr)]">
          <aside className="rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-md shadow-sm">
            <div className="mb-md flex items-center justify-between gap-sm">
              <div>
                <h2 className="text-base font-extrabold text-on-surface">Katalog SKU</h2>
                <p className="text-xs font-semibold text-on-surface-variant">
                  {availableInventory.length} dari {inventory.length} produk belum disusun
                </p>
              </div>
              <span
                className="material-symbols-outlined rounded-xl bg-primary/10 p-2 text-primary"
                style={{ fontVariationSettings: "'FILL' 1" }}
                aria-hidden="true"
              >
                drag_indicator
              </span>
            </div>

            <div className="grid max-h-[520px] gap-xs overflow-y-auto pr-1 custom-scrollbar">
              {loading
                ? [1, 2, 3, 4, 5, 6].map((item) => (
                    <div key={item} className="h-16 rounded-xl shimmer" />
                  ))
                : availableInventory.map((product) => (
                    <ProductTile
                      key={product.id}
                      product={product}
                      active={activeProducts.has(normalizeName(product.name))}
                      dimmed={
                        hasActiveAssociation && !activeProducts.has(normalizeName(product.name))
                      }
                    />
                  ))}
            </div>
          </aside>

          <div className="min-w-0">
            <div className="mb-sm flex flex-wrap items-center justify-between gap-sm">
              <div>
                <h2 className="text-lg font-extrabold text-on-surface">Visual Planogram</h2>
                <p className="text-sm text-on-surface-variant">
                  Susun produk secara manual dengan panduan keterkaitan produk.
                </p>
              </div>

              <div className="flex flex-wrap gap-xs">
                <MetricPill icon="view_module" value={`${filledSlots}/36`} label="slot terisi" />
                <MetricPill icon="priority_high" value={String(criticalProducts)} label="SKU kritis" />
                {associationContext.length > 0 && (
                  <button
                    type="button"
                    onClick={clearManualFlow}
                    className="inline-flex min-h-11 items-center gap-xs rounded-full border border-outline-variant/30 bg-surface-container-lowest px-md py-2 text-xs font-bold text-on-surface-variant shadow-sm transition hover:bg-surface-container"
                  >
                    <span className="material-symbols-outlined text-[16px] text-primary" aria-hidden="true">
                      restart_alt
                    </span>
                    Reset susunan rak
                  </button>
                )}
              </div>
            </div>

            {associationContext.length > 0 && (
              <div className="mb-sm rounded-2xl border border-primary/15 bg-primary/8 p-sm">
                <p className="text-[11px] font-extrabold uppercase tracking-wider text-primary">
                  Rekomendasi produk terkait
                </p>
                <p className="mt-xs text-sm font-semibold text-on-surface-variant">
                  {associationContext.join(" + ")}
                </p>
              </div>
            )}

            <div className="grid gap-md">
              {rackIds.map((rackId) => (
                <RackPlanogram
                  key={rackId}
                  rackId={rackId}
                  placements={placements}
                  productsById={productsById}
                  activeSlots={activeSlots}
                />
              ))}
            </div>
          </div>
        </div>
        {pendingPlacement && (
          <div className="fixed inset-x-4 bottom-4 z-50 mx-auto max-w-xl rounded-2xl border border-error/25 bg-error-container p-md text-error shadow-2xl">
            <div className="flex items-start gap-sm">
              <span className="material-symbols-outlined text-[22px]" aria-hidden="true">
                warning
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-extrabold">Produk atau slot tidak berkorelasi</p>
                <p className="mt-xs text-sm leading-relaxed">{pendingPlacement.message}</p>
                <div className="mt-sm flex flex-wrap gap-xs">
                  <button
                    type="button"
                    onClick={confirmPendingPlacement}
                    className="inline-flex min-h-10 items-center justify-center rounded-xl bg-error px-md py-2 text-sm font-extrabold text-white"
                  >
                    Tetap tempatkan dan reset
                  </button>
                  <button
                    type="button"
                    onClick={() => setPendingPlacement(null)}
                    className="inline-flex min-h-10 items-center justify-center rounded-xl border border-error/25 bg-surface-container-lowest px-md py-2 text-sm font-extrabold text-error"
                  >
                    Batalkan
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      <DragOverlay>
        {activePreview && (
          <div
            className={`max-w-56 rounded-xl border px-sm py-2 text-xs font-extrabold shadow-xl ${getProductTone(activePreview.id).card}`}
          >
            {compactProductName(activePreview.name)}
          </div>
        )}
      </DragOverlay>
        </DndContext>
      )}
    </section>
  );
}

function normalizeName(value: string) {
  return value.replace(/\s+/g, " ").trim().toLowerCase();
}

function ScenarioPreview({ scenario }: { scenario: PlanogramScenario }) {
  const slotsByRack = new Map<RackId, PlanogramSlotItem[]>();
  scenario.layoutSlots.forEach((slot) => {
    const rackId: RackId = slot.shelf === 1 ? "A" : "B";
    slotsByRack.set(rackId, [...(slotsByRack.get(rackId) ?? []), slot]);
  });

  return (
    <section className="rounded-2xl border border-outline-variant/25 bg-surface-container-lowest p-md shadow-sm">
      <div className="mb-md flex flex-col gap-sm lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-[11px] font-extrabold uppercase tracking-wider text-primary">
            Skenario rekomendasi AI
          </p>
          <h2 className="mt-xs text-lg font-extrabold text-on-surface">{scenario.name}</h2>
          <p className="mt-xs max-w-4xl text-sm leading-relaxed text-on-surface-variant">
            {scenario.objective}
          </p>
        </div>
        <span className="inline-flex min-h-10 items-center gap-xs rounded-full border border-primary/15 bg-primary/10 px-md py-2 text-xs font-extrabold text-primary">
          <span className="material-symbols-outlined text-[16px]" aria-hidden="true">
            lock
          </span>
          Pratinjau terkunci
        </span>
      </div>

      <div className="grid gap-md">
        {rackIds.map((rackId) => (
          <ScenarioRack
            key={rackId}
            rackId={rackId}
            slots={(slotsByRack.get(rackId) ?? []).sort((a, b) => {
              if (a.row !== b.row) return a.row - b.row;
              return a.column - b.column;
            })}
          />
        ))}
      </div>
    </section>
  );
}

function ScenarioRack({ rackId, slots }: { rackId: RackId; slots: PlanogramSlotItem[] }) {
  const meta = rackMeta[rackId];
  const slotMap = new Map(slots.map((slot) => [slot.slot, slot]));

  return (
    <article
      className={`relative h-[340px] overflow-visible rounded-[24px] border-2 bg-transparent px-7 pb-10 pt-14 shadow-xl sm:h-[370px] ${meta.frame}`}
      aria-label={`Preview ${meta.label}`}
    >
      <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2">
        <div className={`inline-flex min-h-11 items-center gap-xs rounded-full px-lg py-2 text-sm font-extrabold shadow-lg ${meta.badge}`}>
          {meta.label}
        </div>
      </div>
      <div className={`pointer-events-none absolute bottom-7 left-3 top-7 w-5 rounded-l-[24px] bg-gradient-to-b ${meta.side} shadow-inner`} />
      <div className={`pointer-events-none absolute bottom-7 right-3 top-7 w-5 rounded-r-[24px] bg-gradient-to-b ${meta.side} shadow-inner`} />
      <div className="relative z-10 grid h-full grid-rows-3 gap-3">
        {rowIndexes.map((rowIndex) => (
          <div key={rowIndex} className="relative grid grid-cols-6 gap-1.5 px-3 sm:gap-2 sm:px-5">
            <div className={`pointer-events-none absolute bottom-0 left-0 right-0 h-3 rounded-md bg-gradient-to-r ${meta.shelf} shadow-[0_8px_14px_-12px_rgba(26,28,23,0.75)]`} />
            {columnIndexes.map((columnIndex) => {
              const slotId = `S${rackId === "A" ? 1 : 2}R${rowIndex + 1}C${columnIndex + 1}`;
              const slot = slotMap.get(slotId);
              const tone = getProductTone(columnIndex + rowIndex * 6 + (rackId === "A" ? 1 : 19));
              return (
                <div
                  key={slotId}
                  className="relative z-10 flex min-h-0 items-end justify-center rounded-xl border-2 border-dashed border-outline-variant/45 bg-white/45 p-1 shadow-[inset_0_1px_10px_rgba(255,255,255,0.8)]"
                  title={slot?.placementReason}
                >
                  {slot ? (
                    <div className={`flex h-full max-h-[72px] w-full flex-col justify-between rounded-[10px] border px-1.5 py-1 text-center shadow-lg sm:px-2 ${tone.pack}`}>
                      <span className={`mx-auto h-1.5 w-8 rounded-full ${tone.cap}`} />
                      <span className="line-clamp-3 text-[8px] font-black leading-[1.05] sm:text-[9px]">
                        {compactProductName(slot.produk)}
                      </span>
                      <span className={`mx-auto h-1 w-8 rounded-full ${tone.strip}`} />
                    </div>
                  ) : (
                    <span className="mb-3 text-[10px] font-bold text-on-surface-variant/50">
                      {slotId}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
      <div className={`pointer-events-none absolute bottom-6 left-5 right-5 h-3 rounded-md bg-gradient-to-r ${meta.shelf} shadow-[0_12px_18px_-16px_rgba(26,28,23,0.8)]`} />
      <div className={`pointer-events-none absolute bottom-3 left-3 right-3 h-5 rounded-md bg-gradient-to-r ${meta.foot} shadow-lg`} />
    </article>
  );
}

function MetricPill({ icon, value, label }: { icon: string; value: string; label: string }) {
  return (
    <div className="inline-flex min-h-11 items-center gap-xs rounded-full border border-outline-variant/30 bg-surface-container-lowest px-md py-2 text-xs font-bold text-on-surface-variant shadow-sm">
      <span className="material-symbols-outlined text-[16px] text-primary" aria-hidden="true">
        {icon}
      </span>
      <span className="text-on-surface">{value}</span>
      <span>{label}</span>
    </div>
  );
}

function ProductTile({
  product,
  active,
  dimmed,
}: {
  product: InventoryItem;
  active: boolean;
  dimmed: boolean;
}) {
  const tone = getProductTone(product.id);
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `product:${product.id}`,
    data: { type: "catalog", productId: product.id } satisfies DragData,
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.48 : 1,
  };

  return (
    <button
      ref={setNodeRef}
      type="button"
      style={style}
      {...listeners}
      {...attributes}
      aria-label={`Pindahkan ${product.name}`}
      className={`flex min-h-14 w-full items-center gap-sm rounded-xl border p-sm text-left transition-all hover:shadow-md focus-visible:ring-2 focus-visible:ring-primary/40 motion-reduce:transition-none ${
        active
          ? "animate-pulse ring-2 ring-primary/55 ring-offset-2 ring-offset-surface-container-lowest shadow-md"
          : ""
      } ${dimmed ? "opacity-40 saturate-50 hover:opacity-70" : "opacity-100"} ${tone.card}`}
    >
      <span className={`h-9 w-2 rounded-full ${tone.swatch}`} aria-hidden="true" />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-xs font-extrabold">
          {compactProductName(product.name)}
        </span>
        <span className="block truncate text-[10px] font-semibold opacity-70">
          {product.category} - {product.stock} {product.unit}
        </span>
      </span>
      <span className="material-symbols-outlined text-[18px] opacity-55" aria-hidden="true">
        open_with
      </span>
    </button>
  );
}

function RackPlanogram({
  rackId,
  placements,
  productsById,
  activeSlots,
}: {
  rackId: RackId;
  placements: Record<SlotId, number | null>;
  productsById: Map<number, InventoryItem>;
  activeSlots: Set<SlotId>;
}) {
  const meta = rackMeta[rackId];

  return (
    <article
      className={`relative h-[340px] overflow-visible rounded-[24px] border-2 bg-transparent px-7 pb-10 pt-14 shadow-xl motion-reduce:transition-none sm:h-[370px] ${meta.frame}`}
      aria-label={meta.label}
    >
      <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2">
        <div
          className={`inline-flex min-h-11 items-center gap-xs rounded-full px-lg py-2 text-sm font-extrabold shadow-lg ${meta.badge}`}
        >
          <span
            className={`flex h-6 w-6 items-center justify-center rounded-full border-2 ${
              meta.check ? "border-white bg-white text-violet-600" : "border-outline-variant"
            }`}
            aria-hidden="true"
          >
            {meta.check && <span className="material-symbols-outlined text-[17px]">check</span>}
          </span>
          {meta.label}
        </div>
      </div>

      <div
        className={`pointer-events-none absolute bottom-7 left-3 top-7 w-5 rounded-l-[24px] bg-gradient-to-b ${meta.side} shadow-inner`}
        aria-hidden="true"
      />
      <div
        className={`pointer-events-none absolute bottom-7 right-3 top-7 w-5 rounded-r-[24px] bg-gradient-to-b ${meta.side} shadow-inner`}
        aria-hidden="true"
      />

      <div className="relative z-10 grid h-full grid-rows-3 gap-3">
        {rowIndexes.map((rowIndex) => (
          <ShelfRow
            key={rowIndex}
            rackId={rackId}
            rowIndex={rowIndex}
            placements={placements}
            productsById={productsById}
            shelfClass={meta.shelf}
            activeSlots={activeSlots}
          />
        ))}
      </div>

      <div
        className={`pointer-events-none absolute bottom-6 left-5 right-5 h-3 rounded-md bg-gradient-to-r ${meta.shelf} shadow-[0_12px_18px_-16px_rgba(26,28,23,0.8)]`}
        aria-hidden="true"
      />
      <div
        className={`pointer-events-none absolute bottom-3 left-3 right-3 h-5 rounded-md bg-gradient-to-r ${meta.foot} shadow-lg`}
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute bottom-0 left-8 h-3 w-8 rounded-b-lg bg-on-surface/20"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute bottom-0 right-8 h-3 w-8 rounded-b-lg bg-on-surface/20"
        aria-hidden="true"
      />
    </article>
  );
}

function ShelfRow({
  rackId,
  rowIndex,
  placements,
  productsById,
  shelfClass,
  activeSlots,
}: {
  rackId: RackId;
  rowIndex: number;
  placements: Record<SlotId, number | null>;
  productsById: Map<number, InventoryItem>;
  shelfClass: string;
  activeSlots: Set<SlotId>;
}) {
  return (
    <div className="relative grid grid-cols-6 gap-1.5 px-3 sm:gap-2 sm:px-5">
      <div
        className={`pointer-events-none absolute bottom-0 left-0 right-0 h-3 rounded-md bg-gradient-to-r ${shelfClass} shadow-[0_8px_14px_-12px_rgba(26,28,23,0.75)]`}
        aria-hidden="true"
      />

      {getSlotIdsForRow(rackId, rowIndex).map((slotId) => {
        const productId = placements[slotId];
        const product = productId ? productsById.get(productId) ?? null : null;

        return (
          <PlanogramSlot
            key={slotId}
            slotId={slotId}
            product={product}
            active={activeSlots.has(slotId)}
          />
        );
      })}
    </div>
  );
}

function PlanogramSlot({
  slotId,
  product,
  active,
}: {
  slotId: SlotId;
  product: InventoryItem | null;
  active: boolean;
}) {
  const { isOver, setNodeRef } = useDroppable({
    id: `slot:${slotId}`,
    data: { type: "slot", slotId },
  });

  return (
    <div
      ref={setNodeRef}
      data-planogram-slot={slotId}
      className={`relative z-10 flex min-h-0 items-end justify-center rounded-xl border-2 border-dashed bg-white/45 p-1 shadow-[inset_0_1px_10px_rgba(255,255,255,0.8)] transition-all motion-reduce:transition-none ${
        isOver
          ? "border-primary bg-primary/10 shadow-[0_12px_22px_-16px_rgba(46,89,31,0.8)]"
          : active
            ? "border-primary/70 bg-primary/8 shadow-[0_12px_22px_-16px_rgba(46,89,31,0.55)]"
          : "border-outline-variant/45"
      }`}
    >
      {product ? (
        <PlacedProduct product={product} slotId={slotId} />
      ) : (
        <span className="mb-3 text-[10px] font-bold text-on-surface-variant/50">{slotId}</span>
      )}
    </div>
  );
}

function PlacedProduct({ product, slotId }: { product: InventoryItem; slotId: SlotId }) {
  const tone = getProductTone(product.id);
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `slot:${slotId}`,
    data: { type: "slot", slotId, productId: product.id } satisfies DragData,
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.45 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`flex h-full max-h-[72px] w-full cursor-grab touch-none select-none flex-col justify-between rounded-[10px] border px-1.5 py-1 text-center shadow-lg active:cursor-grabbing sm:px-2 ${tone.pack}`}
      aria-label={`${product.name} di ${slotId}`}
      title={product.name}
    >
      <span className={`mx-auto h-1.5 w-8 rounded-full ${tone.cap}`} aria-hidden="true" />
      <span className="line-clamp-3 text-[8px] font-black leading-[1.05] sm:text-[9px]">
        {compactProductName(product.name)}
      </span>
      <span className={`mx-auto h-1 w-8 rounded-full ${tone.strip}`} aria-hidden="true" />
    </div>
  );
}
