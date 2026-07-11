"use client";

import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";

type AssistantSource = "text" | "voice";

interface DraftItem {
  kopdes_name: string | null;
  kopdes_id: string | null;
  item_produk: string;
  kategori: string | null;
  spesifikasi: string[];
  jumlah: number | null;
  satuan: string;
  target_harga: number | null;
  mata_uang: string;
  batas_akhir: string | null;
  catatan: string | null;
  missing_fields: string[];
}

interface DraftResponse {
  draft_id: string;
  assistant_message: string;
  source_message: string;
  transcript: string | null;
  items: DraftItem[];
}

interface ActiveDraft extends DraftResponse {
  source: AssistantSource;
}

interface ConfirmResponse {
  success: boolean;
  assistant_message: string;
  rfq_ids: string[];
}

interface ChatMessage {
  id: string;
  role: "assistant" | "user";
  text: string;
}

const initialMessages: ChatMessage[] = [
  {
    id: "welcome",
    role: "assistant",
    text: "Sampaikan kebutuhan pengadaan Anda. Saya akan menyusunnya menjadi draft RFQ yang bisa diperiksa sebelum disimpan.",
  },
];

const suggestions = [
  "Butuh beras medium 2 ton sebelum Jumat, harga maksimal Rp13.000 per kg.",
  "Ajukan 500 liter minyak goreng untuk stok bulan depan.",
];

const fieldClass =
  "min-h-10 w-full rounded-lg border border-outline-variant/35 bg-surface-container-lowest px-sm py-2 text-sm text-on-surface outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15";
const labelClass = "text-[11px] font-extrabold uppercase text-on-surface-variant";

function MaterialIcon({ children, className = "" }: { children: string; className?: string }) {
  return (
    <span className={`material-symbols-outlined ${className}`} aria-hidden="true">
      {children}
    </span>
  );
}

async function readApiError(response: Response) {
  try {
    const body = (await response.json()) as { detail?: string };
    return body.detail ?? "Permintaan belum dapat diproses.";
  } catch {
    return "Permintaan belum dapat diproses.";
  }
}

export default function RfqAssistant() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [recording, setRecording] = useState(false);
  const [draft, setDraft] = useState<ActiveDraft | null>(null);
  const [senderName, setSenderName] = useState("");
  const [senderPhone, setSenderPhone] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    if (open) window.setTimeout(() => inputRef.current?.focus(), 120);
  }, [open]);

  useEffect(() => {
    messagesRef.current?.scrollTo({
      top: messagesRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [draft, loading, messages]);

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  const appendMessage = (role: ChatMessage["role"], text: string) => {
    setMessages((current) => [
      ...current,
      { id: `${role}-${Date.now()}-${current.length}`, role, text },
    ]);
  };

  const resetConversation = () => {
    setMessages(initialMessages);
    setDraft(null);
    setInput("");
    setFormError(null);
  };

  const requestDraft = async (message: string) => {
    const normalized = message.trim();
    if (!normalized || loading) return;

    appendMessage("user", normalized);
    setInput("");
    setDraft(null);
    setFormError(null);
    setLoading(true);
    try {
      const response = await fetch("/api/rfq-assistant?action=draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: normalized,
          sender_name: senderName || undefined,
          sender_phone: senderPhone || undefined,
        }),
      });
      if (!response.ok) throw new Error(await readApiError(response));
      const data = (await response.json()) as DraftResponse;
      appendMessage("assistant", data.assistant_message);
      if (data.items.length > 0) setDraft({ ...data, source: "text" });
    } catch (error) {
      appendMessage(
        "assistant",
        error instanceof Error ? error.message : "Draft RFQ belum dapat dibuat.",
      );
    } finally {
      setLoading(false);
    }
  };

  const requestVoiceDraft = async (file: File) => {
    if (loading) return;
    setDraft(null);
    setFormError(null);
    setLoading(true);
    appendMessage("user", `Voice note: ${file.name}`);
    const body = new FormData();
    body.append("file", file);
    if (senderName) body.append("sender_name", senderName);
    if (senderPhone) body.append("sender_phone", senderPhone);

    try {
      const response = await fetch("/api/rfq-assistant?action=voice", {
        method: "POST",
        body,
      });
      if (!response.ok) throw new Error(await readApiError(response));
      const data = (await response.json()) as DraftResponse;
      appendMessage("assistant", `Transkrip: “${data.transcript ?? data.source_message}”`);
      appendMessage("assistant", data.assistant_message);
      if (data.items.length > 0) setDraft({ ...data, source: "voice" });
    } catch (error) {
      appendMessage(
        "assistant",
        error instanceof Error ? error.message : "Voice note belum dapat diproses.",
      );
    } finally {
      setLoading(false);
    }
  };

  const startRecording = async () => {
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setFormError("Perekaman suara tidak didukung browser ini. Gunakan tombol unggah audio.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];
      const recorder = new MediaRecorder(stream);
      recorderRef.current = recorder;
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        const mimeType = recorder.mimeType || "audio/webm";
        const blob = new Blob(chunksRef.current, { type: mimeType });
        stream.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
        void requestVoiceDraft(new File([blob], `voice-note-${Date.now()}.webm`, { type: mimeType }));
      };
      recorder.start();
      setFormError(null);
      setRecording(true);
    } catch {
      setFormError("Izin mikrofon diperlukan untuk merekam voice note.");
    }
  };

  const stopRecording = () => {
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
    setRecording(false);
  };

  const handleAudioUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) void requestVoiceDraft(file);
    event.target.value = "";
  };

  const updateDraftItem = (index: number, patch: Partial<DraftItem>) => {
    setDraft((current) => {
      if (!current) return current;
      return {
        ...current,
        items: current.items.map((item, itemIndex) =>
          itemIndex === index ? { ...item, ...patch } : item,
        ),
      };
    });
  };

  const confirmDraft = async () => {
    if (!draft || loading) return;
    if (!senderName.trim()) {
      setFormError("Nama pengaju wajib diisi sebelum RFQ disimpan.");
      return;
    }
    const incomplete = draft.items.some(
      (item) => !item.item_produk.trim() || !item.jumlah || !item.satuan.trim(),
    );
    if (incomplete) {
      setFormError("Lengkapi nama produk, jumlah, dan satuan pada setiap RFQ.");
      return;
    }

    setFormError(null);
    setLoading(true);
    try {
      const response = await fetch("/api/rfq-assistant?action=confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          draft_id: draft.draft_id,
          source: draft.source,
          source_message: draft.source_message,
          transcript: draft.transcript,
          sender_name: senderName.trim(),
          sender_phone: senderPhone.trim() || null,
          items: draft.items,
        }),
      });
      if (!response.ok) throw new Error(await readApiError(response));
      const data = (await response.json()) as ConfirmResponse;
      appendMessage("assistant", data.assistant_message);
      setDraft(null);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "RFQ belum dapat disimpan.");
    } finally {
      setLoading(false);
    }
  };

  const submitMessage = (event: FormEvent) => {
    event.preventDefault();
    void requestDraft(input);
  };

  return (
    <>
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="fixed bottom-5 right-5 z-[60] grid size-14 place-items-center rounded-full bg-primary text-white shadow-xl transition duration-200 hover:-translate-y-1 hover:bg-primary-container focus:outline-none focus:ring-4 focus:ring-primary/25"
          aria-label="Buka Asisten RFQ AI"
          title="Asisten RFQ AI"
        >
          <MaterialIcon className="text-[28px]">auto_awesome</MaterialIcon>
        </button>
      )}

      {open && (
        <section
          role="dialog"
          aria-modal="false"
          aria-labelledby="rfq-assistant-title"
          className="fixed inset-3 z-[60] flex flex-col overflow-hidden rounded-2xl border border-outline-variant/35 bg-surface-container-lowest shadow-2xl sm:inset-auto sm:bottom-5 sm:right-5 sm:h-[min(46rem,calc(100dvh-2.5rem))] sm:w-[27rem]"
        >
          <header className="flex items-center justify-between gap-sm border-b border-white/15 bg-primary px-md py-sm text-white">
            <div className="flex min-w-0 items-center gap-sm">
              <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-white/15">
                <MaterialIcon className="text-[22px]">smart_toy</MaterialIcon>
              </div>
              <div className="min-w-0">
                <h2 id="rfq-assistant-title" className="text-sm font-extrabold leading-tight sm:text-base">
                  Asisten RFQ KREASI
                </h2>
                <p className="text-xs text-white/80">Teks dan voice note menjadi draft RFQ</p>
              </div>
            </div>
            <div className="flex shrink-0 gap-xs">
              <button
                type="button"
                onClick={resetConversation}
                className="grid size-11 place-items-center rounded-lg text-white/80 transition hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/50"
                aria-label="Mulai ulang percakapan"
                title="Mulai ulang"
              >
                <MaterialIcon className="text-[20px]">restart_alt</MaterialIcon>
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="grid size-11 place-items-center rounded-lg text-white/80 transition hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/50"
                aria-label="Tutup Asisten RFQ"
              >
                <MaterialIcon className="text-[20px]">close</MaterialIcon>
              </button>
            </div>
          </header>

          <div ref={messagesRef} className="flex min-h-0 flex-1 flex-col gap-sm overflow-y-auto bg-surface-container-low p-md">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`max-w-[88%] rounded-xl px-sm py-2.5 text-sm leading-relaxed ${
                  message.role === "user"
                    ? "ml-auto bg-primary text-white"
                    : "border border-outline-variant/25 bg-surface-container-lowest text-on-surface"
                }`}
              >
                {message.text}
              </div>
            ))}

            {messages.length === 1 && !draft && (
              <div className="flex flex-col gap-xs">
                {suggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => void requestDraft(suggestion)}
                    className="min-h-11 rounded-xl border border-outline-variant/25 bg-surface-container-lowest px-sm py-2 text-left text-xs font-semibold leading-relaxed text-on-surface-variant transition hover:border-primary/30 hover:text-primary"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}

            {draft && (
              <div className="rounded-xl border border-primary/25 bg-surface-container-lowest shadow-sm">
                <div className="border-b border-outline-variant/20 px-md py-sm">
                  <p className="text-[11px] font-extrabold uppercase text-primary">Konfirmasi RFQ</p>
                  <p className="mt-1 text-xs leading-relaxed text-on-surface-variant">
                    Edit field yang belum tepat. RFQ baru disimpan setelah Anda mengonfirmasi.
                  </p>
                </div>

                <div className="flex flex-col gap-md p-md">
                  <div className="grid gap-sm sm:grid-cols-2">
                    <label className="flex flex-col gap-1 sm:col-span-2">
                      <span className={labelClass}>Nama pengaju *</span>
                      <input
                        value={senderName}
                        onChange={(event) => setSenderName(event.target.value)}
                        className={fieldClass}
                        placeholder="Nama PIC koperasi"
                        autoComplete="name"
                      />
                    </label>
                    <label className="flex flex-col gap-1 sm:col-span-2">
                      <span className={labelClass}>Nomor WhatsApp</span>
                      <input
                        value={senderPhone}
                        onChange={(event) => setSenderPhone(event.target.value)}
                        className={fieldClass}
                        placeholder="Contoh: 628123456789"
                        inputMode="tel"
                        autoComplete="tel"
                      />
                    </label>
                  </div>

                  {draft.items.map((item, index) => (
                    <fieldset key={`${draft.draft_id}-${index}`} className="flex flex-col gap-sm border-t border-outline-variant/20 pt-md">
                      <legend className="pr-sm text-xs font-extrabold text-on-surface">
                        Item RFQ {index + 1}
                      </legend>
                      <label className="flex flex-col gap-1">
                        <span className={labelClass}>Nama koperasi</span>
                        <input
                          value={item.kopdes_name ?? ""}
                          onChange={(event) => updateDraftItem(index, { kopdes_name: event.target.value || null })}
                          className={fieldClass}
                          placeholder="Nama koperasi desa"
                        />
                      </label>
                      <label className="flex flex-col gap-1">
                        <span className={labelClass}>Produk *</span>
                        <input
                          value={item.item_produk}
                          onChange={(event) => updateDraftItem(index, { item_produk: event.target.value })}
                          className={fieldClass}
                          aria-invalid={!item.item_produk.trim()}
                        />
                      </label>
                      <div className="grid grid-cols-2 gap-sm">
                        <label className="flex flex-col gap-1">
                          <span className={labelClass}>Jumlah *</span>
                          <input
                            type="number"
                            min="0.01"
                            step="any"
                            value={item.jumlah ?? ""}
                            onChange={(event) => updateDraftItem(index, { jumlah: event.target.value ? Number(event.target.value) : null })}
                            className={fieldClass}
                            aria-invalid={!item.jumlah}
                          />
                        </label>
                        <label className="flex flex-col gap-1">
                          <span className={labelClass}>Satuan *</span>
                          <input
                            value={item.satuan}
                            onChange={(event) => updateDraftItem(index, { satuan: event.target.value })}
                            className={fieldClass}
                            placeholder="kg, liter, unit"
                            aria-invalid={!item.satuan.trim()}
                          />
                        </label>
                      </div>
                      <div className="grid grid-cols-2 gap-sm">
                        <label className="flex flex-col gap-1">
                          <span className={labelClass}>Target harga</span>
                          <input
                            type="number"
                            min="0"
                            value={item.target_harga ?? ""}
                            onChange={(event) => updateDraftItem(index, { target_harga: event.target.value ? Number(event.target.value) : null })}
                            className={fieldClass}
                            placeholder="Rupiah"
                          />
                        </label>
                        <label className="flex flex-col gap-1">
                          <span className={labelClass}>Batas akhir</span>
                          <input
                            type="date"
                            value={item.batas_akhir ?? ""}
                            onChange={(event) => updateDraftItem(index, { batas_akhir: event.target.value || null })}
                            className={fieldClass}
                          />
                        </label>
                      </div>
                      <label className="flex flex-col gap-1">
                        <span className={labelClass}>Spesifikasi</span>
                        <input
                          value={item.spesifikasi.join(", ")}
                          onChange={(event) => updateDraftItem(index, {
                            spesifikasi: event.target.value.split(",").map((value) => value.trim()).filter(Boolean),
                          })}
                          className={fieldClass}
                          placeholder="Pisahkan dengan koma"
                        />
                      </label>
                      <label className="flex flex-col gap-1">
                        <span className={labelClass}>Catatan</span>
                        <textarea
                          value={item.catatan ?? ""}
                          onChange={(event) => updateDraftItem(index, { catatan: event.target.value || null })}
                          className={`${fieldClass} min-h-20 resize-y`}
                        />
                      </label>
                    </fieldset>
                  ))}

                  {formError && (
                    <p role="alert" className="rounded-lg border border-error/25 bg-error-container/50 px-sm py-2 text-xs font-semibold text-error">
                      {formError}
                    </p>
                  )}

                  <button
                    type="button"
                    onClick={() => void confirmDraft()}
                    disabled={loading}
                    className="inline-flex min-h-11 items-center justify-center gap-xs rounded-lg bg-primary px-md py-2 text-sm font-extrabold text-white transition hover:bg-primary-container disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <MaterialIcon className="text-[18px]">check_circle</MaterialIcon>
                    {loading ? "Menyimpan RFQ..." : "Konfirmasi dan Simpan RFQ"}
                  </button>
                </div>
              </div>
            )}

            {loading && !draft && (
              <div className="flex max-w-[80%] items-center gap-xs rounded-xl border border-outline-variant/25 bg-surface-container-lowest px-sm py-2.5 text-sm text-on-surface-variant" role="status">
                <MaterialIcon className="animate-spin text-[18px] text-primary">progress_activity</MaterialIcon>
                Menyusun draft RFQ...
              </div>
            )}
          </div>

          <form onSubmit={submitMessage} className="border-t border-outline-variant/25 bg-surface-container-lowest p-sm">
            {formError && !draft && (
              <p role="alert" className="mb-xs text-xs font-semibold text-error">{formError}</p>
            )}
            <div className="flex items-end gap-xs rounded-xl border border-outline-variant/35 bg-surface-container-low px-xs py-xs focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/15">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={loading || recording}
                className="grid size-11 shrink-0 place-items-center rounded-lg text-on-surface-variant transition hover:bg-surface-container hover:text-primary disabled:opacity-40"
                aria-label="Unggah voice note"
                title="Unggah audio"
              >
                <MaterialIcon className="text-[20px]">attach_file</MaterialIcon>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/mpeg,audio/webm,audio/wav,audio/mp4,audio/ogg"
                onChange={handleAudioUpload}
                className="sr-only"
                tabIndex={-1}
              />
              <button
                type="button"
                onClick={recording ? stopRecording : () => void startRecording()}
                disabled={loading}
                className={`grid size-11 shrink-0 place-items-center rounded-lg transition disabled:opacity-40 ${
                  recording
                    ? "animate-pulse bg-error text-white"
                    : "text-on-surface-variant hover:bg-surface-container hover:text-primary"
                }`}
                aria-label={recording ? "Selesai merekam voice note" : "Rekam voice note"}
                title={recording ? "Selesai merekam" : "Rekam voice note"}
              >
                <MaterialIcon className="text-[20px]">{recording ? "stop" : "mic"}</MaterialIcon>
              </button>
              <textarea
                ref={inputRef}
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    event.currentTarget.form?.requestSubmit();
                  }
                }}
                rows={1}
                className="max-h-28 min-h-11 min-w-0 flex-1 resize-none bg-transparent px-xs py-2.5 text-sm text-on-surface outline-none placeholder:text-on-surface-variant/70"
                placeholder={recording ? "Sedang merekam..." : "Tulis RFQ..."}
                disabled={loading || recording}
                aria-label="Pesan kebutuhan pengadaan"
              />
              <button
                type="submit"
                disabled={loading || recording || !input.trim()}
                className="grid size-11 shrink-0 place-items-center rounded-lg bg-primary text-white transition hover:bg-primary-container disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Kirim pesan"
              >
                <MaterialIcon className="text-[20px]">send</MaterialIcon>
              </button>
            </div>
            <p className="mt-xs text-center text-[10px] text-on-surface-variant">
              Periksa kembali seluruh detail sebelum menyimpan RFQ.
            </p>
          </form>
        </section>
      )}
    </>
  );
}
