import {
  ArrowRightIcon,
  ArrowUpIcon,
  ArrowsRightLeftIcon,
  BookOpenIcon,
  ChartBarIcon,
  CheckIcon,
  ClipboardDocumentIcon,
  CpuChipIcon,
  DocumentTextIcon,
  FlagIcon,
  HandThumbDownIcon,
  HandThumbUpIcon,
  MicrophoneIcon,
  PaperClipIcon,
  PlusIcon,
  SparklesIcon,
  WalletIcon,
  XMarkIcon,
} from "@heroicons/react/20/solid";
import { useEffect, useId, useState, type ComponentType, type KeyboardEvent, type ReactNode } from "react";
import { Disclosure } from "../../ui/Accordion";
import { Banner } from "../../ui/Banner";
import { Button, IconButton } from "../../ui/Button";
import { ActionMenu } from "../../ui/Dropdown";
import { FieldMessage } from "../../ui/Field";
import { fieldFrame } from "../../ui/InputField";
import { Popover } from "../../ui/Modal";
import { LiveDot, Skeleton, Spinner } from "../../ui/Spinner";
import { FilterTabs } from "../../ui/Table";

/* Vivid AI — WorldStreet's assistant, as components. Every colour is a v5 token: Vivid's
   identity (the mark, the launcher, the orb) is its domain accent, --ws-domain-vivid-accent;
   primary actions inside an answer stay gold, like everywhere else; surfaces, borders and
   text are the neutral semantic tokens. Motion is the system's: panels open on
   .ws-collapse, new messages arrive on duration-slow / ease-entrance, thinking is the
   Spinner's pulse, listening its bounce.

   One rule from the PRD (journey 4.5) shapes all of it: Vivid reads and explains; it never
   moves money inside an answer. Anything financially consequential is a button that opens
   the real screen, where the person confirms. */

type Glyph = ComponentType<{ className?: string }>;

/* ------------------------------------------------------------ Identity ---- */

/** Vivid's mark — the sparkle on its domain accent. Used wherever Vivid speaks. */
export function VividMark({ size = "md" }: { size?: "sm" | "md" }) {
  return (
    <span aria-hidden="true" className={`grid shrink-0 place-items-center rounded-full bg-domain-vivid/15 text-domain-vivid ${size === "sm" ? "size-7" : "size-9"}`}>
      <SparklesIcon className={size === "sm" ? "size-4" : "size-5"} />
    </span>
  );
}

/** The trading agent's mark — a chip on the same accent. The agent is Vivid's, but it is a
 *  different voice in the conversation (it acts; Vivid answers), so it gets its own glyph. */
export function AgentMark({ size = "md" }: { size?: "xs" | "sm" | "md" }) {
  const box = size === "xs" ? "size-6" : size === "sm" ? "size-7" : "size-9";
  const icon = size === "xs" ? "size-3.5" : size === "sm" ? "size-4" : "size-5";
  return (
    <span aria-hidden="true" className={`grid shrink-0 place-items-center rounded-full bg-domain-vivid/15 text-domain-vivid ${box}`}>
      <CpuChipIcon className={icon} />
    </span>
  );
}

/** Vivid's orb: its accent ramp as one lit, glossy sphere — a soft highlight up and to the
 *  left, the accent through the body, the deep end of the ramp at the rim, and a glow of the
 *  accent around it. The launcher button, the avatar beside an answer, and the empty
 *  state's hero are all this one sphere at different sizes. Vivid ramp primitives only. */
export function VividOrb({ size = 56, glow = true, className = "" }: { size?: number; glow?: boolean; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`block shrink-0 rounded-full bg-[radial-gradient(circle_at_30%_26%,var(--ws-prim-vivid-200)_0%,var(--ws-prim-vivid-400)_24%,var(--ws-domain-vivid-accent)_58%,var(--ws-prim-vivid-700)_100%)] ${
        glow ? "shadow-[0_0_0_1px_color-mix(in_srgb,var(--ws-prim-vivid-300)_18%,transparent),0_6px_28px_-4px_color-mix(in_srgb,var(--ws-domain-vivid-accent)_60%,transparent)]" : ""
      } ${className}`}
      style={{ width: size, height: size }}
    />
  );
}

/* The voice level while listening: bars in the vivid accent rising and falling out of step.
   Heights and timings are fixed per bar so it never looks like a loop; under reduced motion
   the bars hold at their heights — still clearly a waveform (app.css .ws-wave). */
const bars = [0.4, 0.75, 0.5, 1, 0.65, 0.3, 0.9, 0.55, 0.35, 0.8, 0.5, 0.95, 0.6, 0.3, 0.7, 0.5, 1, 0.45, 0.65, 0.35, 0.55, 0.85, 0.45, 0.75, 0.4, 0.6, 0.3, 0.5];

function Waveform() {
  return (
    <span aria-hidden="true" className="ws-wave flex h-5 items-center gap-[3px] text-domain-vivid">
      {bars.map((h, i) => (
        <span
          key={i}
          className="block w-[3px] shrink-0 rounded-full bg-current"
          style={{ height: `${h * 100}%`, animationDelay: `${-((i * 137) % 900)}ms`, animationDuration: `${620 + ((i * 53) % 420)}ms` }}
        />
      ))}
    </span>
  );
}

/* ------------------------------------------------------------ Composer ---- */

export type VividTopic = "general" | "wallet" | "trading" | "navigation";

export const vividPlaceholders: Record<VividTopic, string> = {
  general: "Ask Vivid anything…",
  wallet: "Ask about your balance, transactions or limits…",
  trading: "Ask about markets, positions or risk…",
  navigation: "Ask where something is, or how to do it…",
};

export type ComposerStatus = "idle" | "sending" | "listening";

/** Where you talk to Vivid. Three states, one component:
 *  - plain: one line that grows to four, and the icon actions beside it;
 *  - with the quick-action row open under it (`actions`; Ctrl+/ toggles it);
 *  - with context above the text (`context`) — a quoted message, attached files, a wallet
 *    or transaction chip — each removable.
 *  Enter sends, Shift+Enter breaks a line, Escape cancels a reply in progress or closes the
 *  quick actions. The box is the system's field frame: gold ring on focus, red on error. */
export function VividComposer({
  topic = "general",
  placeholder,
  value,
  onChange,
  onSend,
  context,
  tools,
  actions,
  defaultActionsOpen = false,
  status = "idle",
  error,
  onRetry,
  onVoice,
  onVoiceDone,
  onCancel,
  onAttach,
  size = "md",
  variant = "box",
  className = "",
}: {
  /** `pill`: the launcher panel's one-line field — rounded, the mic inside, the round send
   *  button outside. `box`: everywhere else. */
  variant?: "box" | "pill";
  topic?: VividTopic;
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  onSend?: (text: string) => void;
  /** Above the text, inside the box — VividQuote, VividAttachments, chips, compact cards. */
  context?: ReactNode;
  /** Extra controls in the action row, after attach — a topic menu. */
  tools?: ReactNode;
  /** The collapsible quick-action row under the box. */
  actions?: ReactNode;
  defaultActionsOpen?: boolean;
  /** `sending`: the send button turns into the Spinner and the text is read-only.
   *  `listening`: the voice recorder replaces the text. */
  status?: ComposerStatus;
  error?: string;
  onRetry?: () => void;
  onVoice?: () => void;
  onVoiceDone?: () => void;
  onCancel?: () => void;
  onAttach?: () => void;
  /** `lg` for the dedicated Vivid page's hero; `md` everywhere else. */
  size?: "md" | "lg";
  className?: string;
}) {
  const id = useId();
  const [own, setOwn] = useState("");
  const text = value ?? own;
  const set = (t: string) => {
    if (value === undefined) setOwn(t);
    onChange?.(t);
  };
  const [actionsOpen, setActionsOpen] = useState(defaultActionsOpen);
  const busy = status === "sending";
  const submit = () => {
    const t = text.trim();
    if (!t || busy) return;
    onSend?.(t);
    set("");
  };
  const onKeyDown = (e: KeyboardEvent<HTMLElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      submit();
    } else if (e.key === "Escape") {
      if (busy) onCancel?.();
      else if (actionsOpen) setActionsOpen(false);
    } else if (e.key === "/" && (e.ctrlKey || e.metaKey) && actions) {
      e.preventDefault();
      setActionsOpen((o) => !o);
    }
  };
  const lg = size === "lg";

  if (variant === "pill")
    return (
      <div className={`min-w-0 ${className}`}>
        {context ? <div className="mb-2 flex flex-wrap items-start gap-2">{context}</div> : null}
        <div className="flex items-center gap-2">
          <div className={`flex h-10 min-w-0 flex-1 items-center rounded-full border bg-surface-base pr-1 transition-[border-color,box-shadow] duration-[var(--ws-duration-fast)] ${fieldFrame(Boolean(error))}`}>
            {status === "listening" ? (
              <Listening compact onCancel={onCancel} onDone={onVoiceDone} />
            ) : (
              <>
                <label htmlFor={`${id}-input`} className="sr-only">
                  Message Vivid
                </label>
                <input
                  id={`${id}-input`}
                  value={text}
                  readOnly={busy}
                  placeholder={placeholder ?? vividPlaceholders[topic]}
                  aria-invalid={Boolean(error)}
                  aria-describedby={error ? `${id}-error` : undefined}
                  onChange={(e) => set(e.target.value)}
                  onKeyDown={onKeyDown}
                  className="h-full min-w-0 flex-1 bg-transparent pl-4 text-[13px] text-text-primary outline-none placeholder:text-text-tertiary read-only:opacity-60"
                />
                <IconButton icon={MicrophoneIcon} label="Speak to Vivid" size="sm" shape="pill" onClick={onVoice} disabled={busy} />
              </>
            )}
          </div>
          {status === "listening" ? null : (
            <IconButton icon={ArrowUpIcon} label={busy ? "Vivid is answering" : "Send"} variant="secondary" shape="pill" size="md" loading={busy} disabled={!busy && !text.trim()} onClick={submit} />
          )}
        </div>
        {error ? (
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <FieldMessage id={`${id}-error`} error={error} />
            {onRetry ? (
              <Button variant="ghost" size="sm" onClick={onRetry}>
                Try again
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>
    );

  return (
    <div className={`min-w-0 ${className}`}>
      <div className={`rounded-2xl border bg-surface-base transition-[border-color,box-shadow] duration-[var(--ws-duration-fast)] ${fieldFrame(Boolean(error))}`}>
        {context ? <div className="flex flex-wrap items-start gap-2 px-3 pt-3">{context}</div> : null}
        {status === "listening" ? (
          <Listening onCancel={onCancel} onDone={onVoiceDone} />
        ) : (
          <>
            <label htmlFor={`${id}-input`} className="sr-only">
              Message Vivid
            </label>
            <textarea
              id={`${id}-input`}
              rows={lg ? 2 : 1}
              value={text}
              readOnly={busy}
              placeholder={placeholder ?? vividPlaceholders[topic]}
              aria-invalid={Boolean(error)}
              aria-describedby={error ? `${id}-error` : undefined}
              onChange={(e) => set(e.target.value)}
              onKeyDown={onKeyDown}
              // field-sizing grows the box with the text, capped at four lines, then scrolls.
              className={`block w-full resize-none bg-transparent px-4 text-text-primary outline-none [field-sizing:content] placeholder:text-text-tertiary read-only:opacity-60 ${
                lg ? "max-h-[calc(4lh+16px)] pt-4 pb-2 text-[15px] leading-[1.5]" : "max-h-[calc(4lh+12px)] pt-3 pb-1.5 text-[13.5px] leading-[1.5]"
              }`}
            />
            <div className="flex flex-wrap items-center gap-1 px-2 pb-2">
              <IconButton icon={PaperClipIcon} label="Attach a file" size="sm" onClick={onAttach} disabled={busy} />
              {actions ? (
                <IconButton
                  icon={PlusIcon}
                  label={actionsOpen ? "Hide quick actions" : "Quick actions"}
                  shortcut="Ctrl+/"
                  size="sm"
                  aria-expanded={actionsOpen}
                  aria-controls={`${id}-actions`}
                  onClick={() => setActionsOpen((o) => !o)}
                  className={`[&_svg]:transition-transform [&_svg]:duration-[var(--ws-duration-base)] ${actionsOpen ? "[&_svg]:rotate-45" : ""}`}
                />
              ) : null}
              {tools}
              <span className="flex-1" />
              <IconButton icon={MicrophoneIcon} label="Speak to Vivid" size="sm" onClick={onVoice} disabled={busy} />
              <IconButton icon={ArrowUpIcon} label={busy ? "Vivid is answering" : "Send"} variant="primary" shape="pill" size="sm" loading={busy} disabled={!busy && !text.trim()} onClick={submit} />
            </div>
          </>
        )}
      </div>
      {error ? (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <FieldMessage id={`${id}-error`} error={error} />
          {onRetry ? (
            <Button variant="ghost" size="sm" onClick={onRetry}>
              Try again
            </Button>
          ) : null}
        </div>
      ) : null}
      {actions ? (
        <div id={`${id}-actions`} className="ws-collapse" data-open={actionsOpen} inert={!actionsOpen}>
          <div className="min-h-0 overflow-hidden">
            <div className="pt-2.5">{actions}</div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

/** Voice capture in place of the text: a live dot, the waveform, and the elapsed time.
 *  The real recorder plugs in behind onDone; nothing here fakes audio. */
function Listening({ onCancel, onDone, compact = false }: { onCancel?: () => void; onDone?: () => void; compact?: boolean }) {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <div role="status" className={`flex min-w-0 flex-1 items-center gap-3 ${compact ? "pl-3.5" : "px-4 py-3"}`}>
      <LiveDot tone="success" label="Recording" />
      <span className={compact ? "sr-only" : "shrink-0 text-[13.5px] text-text-primary"}>Listening…</span>
      <span className="min-w-0 flex-1 overflow-hidden">
        <Waveform />
      </span>
      <span className="shrink-0 font-mono text-[12px] tabular-nums text-text-tertiary">
        {Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, "0")}
      </span>
      {compact ? (
        <IconButton icon={XMarkIcon} label="Cancel" size="sm" shape="pill" onClick={onCancel} />
      ) : (
        <Button variant="ghost" size="sm" onClick={onCancel}>
          Cancel
        </Button>
      )}
      <IconButton icon={CheckIcon} label="Stop and send" variant="primary" shape="pill" size="sm" onClick={onDone} />
    </div>
  );
}

/** A quoted message pinned above the text — "about this". */
export function VividQuote({ author, at, avatar, children, onRemove }: { author: string; at: string; avatar?: ReactNode; children: ReactNode; onRemove?: () => void }) {
  return (
    <div className="relative w-full rounded-lg bg-text-primary/[0.05] py-2 pr-10 pl-3">
      <p className="flex items-center gap-1.5 text-[12px] text-text-tertiary">
        {avatar}
        <span className="font-medium text-text-secondary">{author}</span> · {at}
      </p>
      <div className="mt-0.5 line-clamp-2 text-[12.5px] leading-snug text-text-secondary">{children}</div>
      {onRemove ? <IconButton icon={XMarkIcon} label={`Remove quote from ${author}`} size="sm" tooltip={false} className="absolute top-1 right-1" onClick={onRemove} /> : null}
    </div>
  );
}

export type VividFile = { name: string; size: string };

/** Attached files as tiles — three inline, the rest behind one "more". */
export function VividAttachments({ files, onRemove, max = 3 }: { files: VividFile[]; onRemove?: (name: string) => void; max?: number }) {
  const [all, setAll] = useState(false);
  const shown = all ? files : files.slice(0, max);
  return (
    <div className="flex w-full flex-wrap items-center gap-2">
      {shown.map((f) => (
        <span key={f.name} className="flex max-w-[220px] items-center gap-2 rounded-lg bg-text-primary/[0.05] py-1.5 pr-1 pl-2.5 text-[12.5px]">
          <DocumentTextIcon aria-hidden="true" className="size-4 shrink-0 text-text-tertiary" />
          <span className="min-w-0 truncate text-text-primary">{f.name}</span>
          <span className="shrink-0 text-text-tertiary">{f.size}</span>
          {onRemove ? <IconButton icon={XMarkIcon} label={`Remove ${f.name}`} size="sm" tooltip={false} onClick={() => onRemove(f.name)} /> : null}
        </span>
      ))}
      {files.length > max && !all ? (
        <Button variant="ghost" size="sm" onClick={() => setAll(true)}>
          View {files.length - max} more
        </Button>
      ) : null}
    </div>
  );
}

/* -------------------------------------------------------------- Thread ---- */

export type VividMessage = {
  id: string;
  /** `agent` is the trading agent reporting into the conversation — what it did, not an
   *  answer — in its own voice, so its actions are never mistaken for Vivid's words. */
  from: "user" | "vivid" | "agent";
  at: string;
  content: ReactNode;
  /** Context the person attached to their message. */
  quote?: ReactNode;
  /** Plain text for Copy — an answer that is still thinking has none. */
  copyText?: string;
};

/** The conversation. Consecutive messages from one side are grouped: the name and time
 *  show once, the gaps close up. Your messages are the inverted bubble on the right;
 *  Vivid's sit on the page beside its mark, at a reading measure. New ones arrive on the
 *  entrance curve; the list is a polite live region. */
export function VividThread({ messages, variant = "page", className = "" }: { messages: VividMessage[]; variant?: "page" | "compact"; className?: string }) {
  return (
    <div role="log" aria-label="Conversation with Vivid" aria-live="polite" className={className}>
      {messages.map((m, i) =>
        variant === "compact" ? (
          <CompactRow key={m.id} m={m} first={i === 0 || messages[i - 1].from !== m.from} top={i === 0} last={i === messages.length - 1 || messages[i + 1].from !== m.from} />
        ) : (
          <MessageRow key={m.id} m={m} first={i === 0 || messages[i - 1].from !== m.from} top={i === 0} />
        ),
      )}
    </div>
  );
}

const arrive = "transition-[opacity,translate] duration-[var(--ws-duration-slow)] ease-[var(--ws-ease-entrance)] starting:translate-y-1 starting:opacity-0";

/* The launcher panel's conversation, from the reference: both sides in bubbles, yours tinted
   in Vivid's accent on the right, Vivid's on a neutral tint on the left with the orb beside
   the last bubble of each of its turns. No names or times — the panel is a quick exchange. */
function CompactRow({ m, first, top, last }: { m: VividMessage; first: boolean; top: boolean; last: boolean }) {
  const gap = top ? "" : first ? "pt-3" : "pt-1";
  if (m.from === "user")
    return (
      <div className={`flex flex-col items-end ${gap} ${arrive}`}>
        {m.quote ? <div className="mb-1 flex max-w-[85%] flex-wrap justify-end gap-1.5">{m.quote}</div> : null}
        <div className="max-w-[82%] rounded-2xl rounded-br-md bg-domain-vivid/15 px-3.5 py-2 text-[12.5px] leading-relaxed whitespace-pre-wrap text-text-primary">{m.content}</div>
      </div>
    );
  return (
    <div className={`flex items-end gap-2 ${gap} ${arrive}`}>
      <span className="w-6 shrink-0">{last ? m.from === "agent" ? <AgentMark size="xs" /> : <VividOrb size={24} glow={false} /> : null}</span>
      <div className="max-w-[84%] min-w-0 space-y-2.5 rounded-2xl rounded-bl-md bg-text-primary/[0.06] px-3.5 py-2.5 text-[12.5px] leading-relaxed text-text-secondary [&_strong]:font-medium [&_strong]:text-text-primary">
        {m.from === "agent" ? <span className="sr-only">Vivid agent: </span> : null}
        {m.content}
      </div>
    </div>
  );
}

function MessageRow({ m, first, top }: { m: VividMessage; first: boolean; top: boolean }) {
  const gap = top ? "" : first ? "pt-5" : "pt-1.5";
  if (m.from === "user")
    return (
      <div className={`group flex flex-col items-end ${gap} ${arrive}`}>
        {first ? <p className="mb-1 text-[11.5px] text-text-tertiary">You · {m.at}</p> : null}
        {m.quote ? <div className="mb-1.5 flex max-w-[85%] flex-wrap justify-end gap-1.5">{m.quote}</div> : null}
        <div className="max-w-[85%] rounded-2xl rounded-br-md bg-text-primary px-3.5 py-2 text-[13.5px] leading-relaxed whitespace-pre-wrap text-surface-canvas">{m.content}</div>
        {m.copyText ? <MessageActions text={m.copyText} /> : null}
      </div>
    );
  return (
    <div className={`group grid grid-cols-[28px_minmax(0,1fr)] gap-x-2.5 ${gap} ${arrive}`}>
      <div>{first ? m.from === "agent" ? <AgentMark size="sm" /> : <VividMark size="sm" /> : null}</div>
      <div className="min-w-0">
        {first ? (
          <p className="mb-1 text-[11.5px] leading-7 text-text-tertiary">
            <span className="font-medium text-text-secondary">{m.from === "agent" ? "Vivid agent" : "Vivid"}</span> · {m.at}
          </p>
        ) : m.from === "agent" ? (
          <span className="sr-only">Vivid agent:</span>
        ) : null}
        <div className="max-w-[70ch] space-y-3 text-[13.5px] leading-relaxed text-text-secondary [&_strong]:font-medium [&_strong]:text-text-primary">{m.content}</div>
        {m.copyText ? <MessageActions text={m.copyText} feedback /> : null}
      </div>
    </div>
  );
}

/** Copy, and for an answer: good, not good, and a menu with Report. Shown on hover or focus,
 *  always on touch. */
function MessageActions({ text, feedback = false }: { text: string; feedback?: boolean }) {
  const [copied, setCopied] = useState(false);
  const [vote, setVote] = useState<"up" | "down" | null>(null);
  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 1600);
    return () => clearTimeout(t);
  }, [copied]);
  return (
    <div className="mt-1 flex items-center gap-0.5 opacity-0 transition-opacity duration-[var(--ws-duration-fast)] group-focus-within:opacity-100 group-hover:opacity-100 [@media(hover:none)]:opacity-100">
      <IconButton icon={copied ? CheckIcon : ClipboardDocumentIcon} label={copied ? "Copied" : "Copy"} size="sm" onClick={() => navigator.clipboard?.writeText(text).then(() => setCopied(true))} />
      {feedback ? (
        <>
          <IconButton icon={HandThumbUpIcon} label="Good answer" size="sm" aria-pressed={vote === "up"} className="aria-pressed:text-action-primary-text" onClick={() => setVote((v) => (v === "up" ? null : "up"))} />
          <IconButton icon={HandThumbDownIcon} label="Not a good answer" size="sm" aria-pressed={vote === "down"} className="aria-pressed:text-action-primary-text" onClick={() => setVote((v) => (v === "down" ? null : "down"))} />
          <ActionMenu label="More for this answer" items={[{ label: "Report this answer", icon: FlagIcon, onSelect: () => undefined }]} />
        </>
      ) : null}
    </div>
  );
}

/** Before the first token: three shimmer lines where the answer will be. */
export function VividResponseSkeleton() {
  return (
    <div aria-busy="true" className="space-y-2 pt-1">
      <span role="status" className="sr-only">
        Vivid is answering
      </span>
      <Skeleton className="h-2.5 w-[92%] rounded-full" />
      <Skeleton className="h-2.5 w-[80%] rounded-full" />
      <Skeleton className="h-2.5 w-[56%] rounded-full" />
    </div>
  );
}

/* ------------------------------------------------------------- Thinking ---- */

export type ThinkStep = { icon: Glyph; label: string; detail?: ReactNode };

/** The work behind an answer, shown as it happens — what Vivid read, what it compared —
 *  then folded into one line once the answer lands, where anyone who wants to check it
 *  can open it again (the Accordion's Disclosure). `current` is the step in progress;
 *  leave it undefined when done. */
export function VividThinking({ steps, current, seconds }: { steps: ThinkStep[]; current?: number; seconds?: number }) {
  const done = current === undefined;
  const list = (
    <ol className="space-y-2.5">
      {(done ? steps : steps.slice(0, current + 1)).map((s, i) => {
        const active = !done && i === current;
        return (
          <li key={s.label} className={`flex gap-2.5 text-[13px] ${arrive}`}>
            <s.icon aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-text-tertiary" />
            <div className="min-w-0">
              <p className={`flex flex-wrap items-center gap-2 ${active ? "text-text-primary" : "text-text-secondary"}`}>
                {s.label}
                {active ? <Spinner variant="pulse" size="sm" accent="vivid" label={null} /> : null}
              </p>
              {s.detail ? <div className="mt-1.5 text-[12.5px] leading-relaxed text-text-tertiary">{s.detail}</div> : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
  if (!done)
    return (
      <div aria-busy="true">
        <span className="sr-only">Vivid is thinking</span>
        {list}
      </div>
    );
  return <Disclosure label={`Thought for ${seconds ?? steps.length}s · ${steps.length} step${steps.length === 1 ? "" : "s"}`}>{list}</Disclosure>;
}

/** When an answer cannot be given: what happened, that nothing changed, and a retry. */
export function VividError({ children, onRetry }: { children: ReactNode; onRetry?: () => void }) {
  return (
    <Banner
      tone="error"
      action={
        onRetry ? (
          <Button variant="secondary" size="sm" onClick={onRetry}>
            Try again
          </Button>
        ) : undefined
      }
    >
      {children}
    </Banner>
  );
}

/* --------------------------------------------------------- Context card ---- */

export type VividContextKind = "wallet" | "transaction" | "market" | "guide";

const kindIcon: Record<VividContextKind, Glyph> = { wallet: WalletIcon, transaction: ArrowsRightLeftIcon, market: ChartBarIcon, guide: BookOpenIcon };
const kindName: Record<VividContextKind, string> = { wallet: "Wallet", transaction: "Transaction", market: "Market data", guide: "How-to" };

/** Something Vivid is talking about, shown as the thing itself: a balance, a transaction,
 *  a market. `compact` is the chip-sized version for the composer's context row. */
export function VividContextCard({
  kind,
  title,
  children,
  footer,
  compact = false,
  onRemove,
  className = "",
}: {
  kind: VividContextKind;
  title: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  compact?: boolean;
  onRemove?: () => void;
  className?: string;
}) {
  const Icon = kindIcon[kind];
  if (compact)
    return (
      <div className={`relative flex w-[240px] max-w-full items-center gap-2.5 rounded-lg bg-surface-base py-2 pr-9 pl-2.5 ring-1 ring-text-primary/[0.08] ring-inset ${className}`}>
        <span className="grid size-7 shrink-0 place-items-center rounded-md bg-text-primary/[0.06] text-text-secondary">
          <Icon aria-hidden="true" className="size-4" />
        </span>
        <span className="min-w-0">
          <span className="block text-[11px] text-text-tertiary">{kindName[kind]}</span>
          <span className="block truncate text-[12.5px] text-text-primary">{title}</span>
        </span>
        {onRemove ? <IconButton icon={XMarkIcon} label={`Remove ${kindName[kind].toLowerCase()} context`} size="sm" tooltip={false} className="absolute top-1/2 right-1 -translate-y-1/2" onClick={onRemove} /> : null}
      </div>
    );
  return (
    <section className={`max-w-[440px] rounded-xl bg-surface-base p-4 ring-1 ring-text-primary/[0.08] ring-inset ${className}`}>
      <p className="flex items-center gap-1.5 text-[12px] text-text-tertiary">
        <Icon aria-hidden="true" className="size-4" />
        {kindName[kind]}
      </p>
      <h4 className="mt-1 text-[14px] font-medium text-text-primary">{title}</h4>
      {children ? <div className="mt-3 text-[13px] text-text-secondary">{children}</div> : null}
      {footer ? <div className="mt-3 flex flex-wrap items-center gap-2 text-[12px] text-text-tertiary">{footer}</div> : null}
    </section>
  );
}

/* -------------------------------------------------------- Quick actions ---- */

export type QuickAction = { label: string; icon: Glyph; prompt: string };

/** The common asks, one tap from the composer. `grid` is the phone sheet — pills in three
 *  columns; `row` is the desktop toolbar — icon and label, dropping to icons alone when its
 *  container is narrow (the label stays for screen readers). */
export function VividQuickActions({ actions, layout = "row", onPick, className = "" }: { actions: QuickAction[]; layout?: "grid" | "row"; onPick?: (a: QuickAction) => void; className?: string }) {
  if (layout === "grid")
    return (
      <div className={`grid grid-cols-2 gap-2 sm:grid-cols-3 ${className}`}>
        {actions.map((a) => (
          <Button key={a.label} variant="secondary" size="sm" shape="pill" prefixIcon={a.icon} className="w-full" onClick={() => onPick?.(a)}>
            <span className="truncate">{a.label}</span>
          </Button>
        ))}
      </div>
    );
  return (
    <div className={`@container ${className}`}>
      <div role="toolbar" aria-label="Quick actions" className="flex flex-wrap gap-1.5">
        {actions.map((a) => (
          <Button key={a.label} variant="secondary" size="sm" prefixIcon={a.icon} onClick={() => onPick?.(a)}>
            <span className="@max-[30rem]:sr-only">{a.label}</span>
          </Button>
        ))}
      </div>
    </div>
  );
}

export type SuggestionGroup = { id: string; label: string; items: { icon: Glyph; text: string }[] };

/** The dedicated page's suggestions: tabs of starting points — a plan, an explanation, a
 *  lookup. Picking one fills the composer rather than sending, so it can be edited first. */
export function VividSuggestions({ groups, onPick }: { groups: SuggestionGroup[]; onPick: (text: string) => void }) {
  const [tab, setTab] = useState(groups[0].id);
  const group = groups.find((g) => g.id === tab) ?? groups[0];
  return (
    <div>
      <FilterTabs label="Suggestions" value={tab} onChange={setTab} options={groups.map((g) => ({ value: g.id, label: g.label }))} />
      <ul className="mt-2 space-y-0.5">
        {group.items.map((s) => (
          <li key={s.text}>
            <button
              type="button"
              onClick={() => onPick(s.text)}
              className="group flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-[13px] text-text-secondary transition-colors duration-[var(--ws-duration-fast)] hover:bg-text-primary/[0.05] hover:text-text-primary"
            >
              <s.icon aria-hidden="true" className="size-4 shrink-0 text-text-tertiary" />
              <span className="min-w-0 flex-1">{s.text}</span>
              <ArrowRightIcon aria-hidden="true" className="size-4 shrink-0 text-text-tertiary opacity-0 transition-opacity duration-[var(--ws-duration-fast)] group-hover:opacity-100 group-focus-visible:opacity-100" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* -------------------------------------------------------------- Surfaces ---- */

/** The first thing in an empty conversation: the orb, who Vivid is, what it can and can't
 *  do, and somewhere to start. */
export function VividEmptyState({ name, children }: { name?: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col items-center px-2 py-6 text-center">
      <VividOrb size={56} />
      <p className="mt-4 text-[15px] font-medium text-text-primary">{name ? `Hi ${name}, I'm Vivid` : "I'm Vivid"}</p>
      <p className="mt-1 max-w-[36ch] text-[13px] leading-relaxed text-text-tertiary">
        I can read your wallet, explain a charge, catch you up on markets and find where things are. I never move money — you confirm that yourself.
      </p>
      {children ? <div className="mt-5 w-full">{children}</div> : null}
    </div>
  );
}

/** A panel for Vivid in any surface — header, the conversation, the composer pinned
 *  underneath. The launcher's popover and the wallet's Ask Vivid both frame it. */
export function VividPanel({
  title = "Ask Vivid",
  onClose,
  children,
  composer,
  banner,
  className = "",
}: {
  title?: string;
  onClose?: () => void;
  children: ReactNode;
  composer: ReactNode;
  /** Pinned under the header, outside the scrolling conversation — the agent's strip. */
  banner?: ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex max-h-[min(540px,calc(100dvh-120px))] flex-col ${className}`}>
      <header className="flex shrink-0 items-center gap-2 pt-3 pr-2.5 pb-1 pl-4">
        <p className="flex-1 text-[13px] font-semibold text-text-primary">{title}</p>
        {onClose ? <IconButton icon={XMarkIcon} label="Close" size="sm" shape="pill" onClick={onClose} /> : null}
      </header>
      {banner ? <div className="shrink-0 px-3 pt-1.5">{banner}</div> : null}
      <div className="ws-scroll-y min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-3 [--ws-scroll-surface:var(--ws-surface-raised)]">{children}</div>
      <div className="shrink-0 px-4 pt-1 pb-4">{composer}</div>
    </div>
  );
}

/** The floating Vivid button and the panel it opens — anchored to it, non-blocking: the
 *  page stays usable, Escape or a click outside closes it, focus returns to the button. */
export function VividLauncher({ children, inline }: { children: (close: () => void) => ReactNode; inline?: boolean }) {
  return (
    <Popover
      label="Vivid"
      align="end"
      inline={inline}
      className="w-[min(340px,calc(100vw-32px))]"
      trigger={(p) => (
        // The orb itself is the button — no glyph on it, as in the reference.
        <button
          type="button"
          aria-label="Ask Vivid"
          {...p}
          className="block rounded-full transition-[scale] duration-[var(--ws-duration-fast)] ease-[var(--ws-ease-standard)] hover:scale-105 active:scale-95"
        >
          <VividOrb size={56} />
        </button>
      )}
    >
      {(close) => children(close)}
    </Popover>
  );
}
