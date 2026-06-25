import { EmptyState, PanelLoading } from "@/components/layout/workspace-ui";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { RotateCcw, ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { isImagePath, isPdfPath, resolveMediaUrl } from "@/lib/media-url";
import { getPdfDisplayHeight } from "@/lib/pdf-template";
import { cn } from "@/lib/utils";

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 2;
const ZOOM_STEP = 0.1;
const FIT_ZOOM = 1;
/** Comfortable reading width — form stays this size, centered with side margins. */
const MAX_DOCUMENT_WIDTH_PX = 720;

type ViewOnlyDocumentViewerProps = {
  src?: string | null;
  blobLoader?: () => Promise<Blob>;
  enabled?: boolean;
  alt?: string;
  fileLabel?: string;
  overlay?: ReactNode;
  className?: string;
  viewportClassName?: string;
  emptyMessage?: string;
  /** Use all available height (e.g. inside a dialog). */
  fillHeight?: boolean;
};

function clampZoom(value: number) {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Math.round(value * 10) / 10));
}

function fileNameFromPath(path: string) {
  return path.split("/").pop()?.replace(/^\d+-/, "") || "Document";
}

function useDocumentLayout(enabled: boolean) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const [baseWidth, setBaseWidth] = useState(MAX_DOCUMENT_WIDTH_PX);

  useEffect(() => {
    const el = viewportRef.current;
    if (!el || !enabled) return;

    const update = () => {
      const padding = 48;
      const available = Math.max(280, el.clientWidth - padding);
      setBaseWidth(Math.min(MAX_DOCUMENT_WIDTH_PX, available));
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, [enabled]);

  return { viewportRef, baseWidth };
}

function ZoomToolbar({
  zoom,
  fitZoom,
  fileLabel,
  onZoomOut,
  onZoomIn,
  onReset,
}: {
  zoom: number;
  fitZoom: number;
  fileLabel?: string;
  onZoomOut: () => void;
  onZoomIn: () => void;
  onReset: () => void;
}) {
  return (
    <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-border/80 bg-muted/25 px-4 py-3 sm:px-5">
      {fileLabel ? (
        <p className="min-w-0 truncate text-xs font-semibold text-foreground sm:text-sm">
          {fileLabel}
        </p>
      ) : (
        <span />
      )}
      <div className="flex items-center gap-1 rounded-xl border border-border/80 bg-background p-1 shadow-sm">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          disabled={zoom <= MIN_ZOOM}
          onClick={onZoomOut}
          aria-label="Zoom out"
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
        <span className="min-w-[3rem] text-center text-xs font-medium tabular-nums text-muted-foreground">
          {Math.round(zoom * 100)}%
        </span>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          disabled={zoom >= MAX_ZOOM}
          onClick={onZoomIn}
          aria-label="Zoom in"
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 px-2 text-xs"
          disabled={Math.abs(zoom - fitZoom) < 0.05}
          onClick={onReset}
          aria-label="Reset zoom"
        >
          <RotateCcw className="mr-1 h-3.5 w-3.5" />
          Reset
        </Button>
      </div>
    </div>
  );
}

function DocumentViewport({
  viewportRef,
  fillHeight,
  children,
  viewportClassName,
}: {
  viewportRef: React.RefObject<HTMLDivElement | null>;
  fillHeight?: boolean;
  children: ReactNode;
  viewportClassName?: string;
}) {
  return (
    <div
      ref={viewportRef}
      className={cn(
        "document-preview-viewport min-w-0 overflow-auto bg-muted/25 p-4 sm:p-6",
        fillHeight ? "min-h-0 flex-1" : "max-h-[min(70vh,720px)]",
        viewportClassName,
      )}
    >
      {children}
    </div>
  );
}

function LoadingState() {
  return <PanelLoading label="Loading document…" />;
}

function ImageDocument({
  src,
  alt,
  zoom,
  baseWidth,
  viewportRef,
  fillHeight,
  overlay,
  viewportClassName,
}: {
  src: string;
  alt: string;
  zoom: number;
  baseWidth: number;
  viewportRef: React.RefObject<HTMLDivElement | null>;
  fillHeight?: boolean;
  overlay?: ReactNode;
  viewportClassName?: string;
}) {
  const [failed, setFailed] = useState(false);
  const displayWidth = Math.round(baseWidth * zoom);

  if (failed) {
    return (
      <EmptyState
        title="Could not load image"
        description="The document image failed to load. Try refreshing the page."
      />
    );
  }

  return (
    <DocumentViewport
      viewportRef={viewportRef}
      fillHeight={fillHeight}
      viewportClassName={viewportClassName}
    >
      <div className="mx-auto" style={{ width: displayWidth, maxWidth: "100%" }}>
        <div className="relative overflow-hidden rounded-md bg-white shadow-sm ring-1 ring-border/80">
          <img
            src={src}
            alt={alt}
            className="block h-auto w-full select-none"
            draggable={false}
            onError={() => setFailed(true)}
          />
          {overlay ? (
            <div className="pointer-events-none absolute inset-0 z-10">{overlay}</div>
          ) : null}
        </div>
      </div>
    </DocumentViewport>
  );
}

async function loadDocumentBlob(src: string, blobLoader?: () => Promise<Blob>) {
  if (blobLoader) {
    return blobLoader();
  }
  const response = await fetch(src);
  if (!response.ok) {
    throw new Error(`Could not load document (${response.status}).`);
  }
  const blob = await response.blob();
  if (!blob.size) {
    throw new Error("Document file is empty.");
  }
  return blob;
}

function PdfEmbedDocument({
  src,
  blobLoader,
  alt,
  zoom,
  baseWidth,
  viewportRef,
  fillHeight,
  overlay,
  viewportClassName,
}: {
  src?: string | null;
  blobLoader?: () => Promise<Blob>;
  alt: string;
  zoom: number;
  baseWidth: number;
  viewportRef: React.RefObject<HTMLDivElement | null>;
  fillHeight?: boolean;
  overlay?: ReactNode;
  viewportClassName?: string;
}) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const [frameHeight, setFrameHeight] = useState(960);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let objectUrl: string | null = null;

    async function load() {
      setLoading(true);
      setError(null);
      setBlobUrl(null);
      setPdfBlob(null);

      try {
        const resolved = src ? resolveMediaUrl(src) : null;
        if (!resolved && !blobLoader) {
          throw new Error("No document source.");
        }
        const blob = await loadDocumentBlob(resolved ?? "", blobLoader);
        objectUrl = URL.createObjectURL(blob);
        if (!cancelled) {
          setPdfBlob(blob);
          setBlobUrl(objectUrl);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Could not load document.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [src, blobLoader]);

  const displayWidth = Math.round(baseWidth * zoom);

  useEffect(() => {
    if (!pdfBlob || displayWidth <= 0) return;
    let cancelled = false;

    void getPdfDisplayHeight(pdfBlob, displayWidth)
      .then((height) => {
        if (!cancelled) setFrameHeight(Math.max(height, 480));
      })
      .catch(() => {
        if (!cancelled) setFrameHeight(Math.round(displayWidth * (11 / 8.5)));
      });

    return () => {
      cancelled = true;
    };
  }, [pdfBlob, displayWidth]);

  if (loading) return <LoadingState />;
  if (error) {
    return (
      <EmptyState
        title="Could not load document"
        description={error}
      />
    );
  }
  if (!blobUrl) return null;

  return (
    <DocumentViewport
      viewportRef={viewportRef}
      fillHeight={fillHeight}
      viewportClassName={viewportClassName}
    >
      <div className="mx-auto" style={{ width: displayWidth, maxWidth: "100%" }}>
        <div className="relative overflow-hidden rounded-md bg-white shadow-sm ring-1 ring-border/80">
          <iframe
            src={`${blobUrl}#toolbar=0&navpanes=0&scrollbar=1&view=FitH`}
            title={alt}
            className={cn("block w-full border-0 bg-white", overlay && "pointer-events-none")}
            style={{ height: frameHeight, minHeight: frameHeight }}
          />
          {overlay ? (
            <div className="pointer-events-none absolute inset-0 z-10">{overlay}</div>
          ) : null}
        </div>
      </div>
    </DocumentViewport>
  );
}

export function ViewOnlyDocumentViewer({
  src,
  blobLoader,
  enabled = true,
  alt = "Document",
  fileLabel,
  overlay,
  className,
  viewportClassName,
  emptyMessage = "No document is available.",
  fillHeight = false,
}: ViewOnlyDocumentViewerProps) {
  const [zoom, setZoom] = useState(FIT_ZOOM);
  const { viewportRef, baseWidth } = useDocumentLayout(enabled);
  const resolvedSrc = src ? resolveMediaUrl(src) : null;
  const isImage = resolvedSrc ? isImagePath(resolvedSrc) : false;
  const isPdf = resolvedSrc ? isPdfPath(resolvedSrc) : Boolean(blobLoader);
  const label = fileLabel ?? (src ? fileNameFromPath(src) : undefined);

  useEffect(() => {
    setZoom(FIT_ZOOM);
  }, [src, blobLoader]);

  if (!enabled) return null;

  if (!blobLoader && !resolvedSrc) {
    return <EmptyState title="No document" description={emptyMessage} />;
  }

  const toolbar = (
    <ZoomToolbar
      zoom={zoom}
      fitZoom={FIT_ZOOM}
      fileLabel={label}
      onZoomOut={() => setZoom((value) => clampZoom(value - ZOOM_STEP))}
      onZoomIn={() => setZoom((value) => clampZoom(value + ZOOM_STEP))}
      onReset={() => setZoom(FIT_ZOOM)}
    />
  );

  const shellClass = cn("min-w-0", fillHeight && "flex h-full min-h-0 flex-col", className);

  if (isImage && resolvedSrc) {
    return (
      <div className={shellClass}>
        {toolbar}
        <ImageDocument
          src={resolvedSrc}
          alt={alt}
          zoom={zoom}
          baseWidth={baseWidth}
          viewportRef={viewportRef}
          fillHeight={fillHeight}
          overlay={overlay}
          viewportClassName={viewportClassName}
        />
      </div>
    );
  }

  if (isPdf) {
    return (
      <div className={shellClass}>
        {toolbar}
        <PdfEmbedDocument
          src={resolvedSrc}
          blobLoader={blobLoader}
          alt={alt}
          zoom={zoom}
          baseWidth={baseWidth}
          viewportRef={viewportRef}
          fillHeight={fillHeight}
          overlay={overlay}
          viewportClassName={viewportClassName}
        />
      </div>
    );
  }

  return <EmptyState title="Unsupported document" description={emptyMessage} />;
}
