"use client";

import { useState } from "react";
import Cropper from "react-easy-crop";
import { RotateCcw, RotateCw, ZoomIn, ZoomOut } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cropLogo, type PixelCrop } from "@/features/company/crop-logo";

interface LogoCropDialogProps {
  /** The picture the person chose, ready to show. The dialog is open while this is set. */
  src: string | null;
  onCancel: () => void;
  /** Called with the finished square PNG. */
  onConfirm: (logo: Blob) => void;
}

/** Lets the person frame a logo before it is saved: drag to move, zoom, and turn. */
export function LogoCropDialog({ src, onCancel, onConfirm }: LogoCropDialogProps) {
  return (
    <Dialog open={src !== null} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="sm:max-w-md p-6 rounded-2xl bg-white border border-slate-200 shadow-2xl">
        {src && <CropBody src={src} onCancel={onCancel} onConfirm={onConfirm} />}
      </DialogContent>
    </Dialog>
  );
}

/** Holds the crop state, so every picture starts centred, unzoomed and unturned. */
function CropBody({ src, onCancel, onConfirm }: { src: string; onCancel: () => void; onConfirm: (logo: Blob) => void }) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [area, setArea] = useState<PixelCrop | null>(null);
  const [isWorking, setIsWorking] = useState(false);

  const handleConfirm = async () => {
    if (!area) return;
    setIsWorking(true);
    try {
      onConfirm(await cropLogo(src, area, rotation));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not crop that image.");
    } finally {
      setIsWorking(false);
    }
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle className="text-base font-bold text-slate-900 sm:text-lg">Position your logo</DialogTitle>
        <p className="mt-0.5 text-xs text-slate-500">
          Drag to move it and zoom to fit. Zoom out to leave empty space around a wide logo.
        </p>
      </DialogHeader>

      <div className="relative h-72 overflow-hidden rounded-xl bg-slate-100 sm:h-80">
        {src && (
          <Cropper
            image={src}
            crop={crop}
            zoom={zoom}
            rotation={rotation}
            aspect={1}
            minZoom={0.4}
            maxZoom={4}
            objectFit="contain"
            restrictPosition={false}
            showGrid={false}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={(_, pixels) => setArea(pixels)}
          />
        )}
      </div>

      <div className="flex items-center gap-3">
        <ZoomOut className="h-4 w-4 shrink-0 text-slate-400" />
        <input
          type="range"
          min={0.4}
          max={4}
          step={0.01}
          value={zoom}
          onChange={(e) => setZoom(Number(e.target.value))}
          aria-label="Zoom"
          className="h-1.5 flex-1 cursor-pointer accent-brand"
        />
        <ZoomIn className="h-4 w-4 shrink-0 text-slate-400" />
        <div className="ml-1 flex items-center gap-1 border-l border-slate-200 pl-3">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Turn left"
            onClick={() => setRotation((r) => r - 90)}
            className="cursor-pointer text-slate-500"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Turn right"
            onClick={() => setRotation((r) => r + 90)}
            className="cursor-pointer text-slate-500"
          >
            <RotateCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-end gap-2.5 border-t border-slate-100 pt-4">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onCancel}
          className="h-9 cursor-pointer px-4 text-xs font-semibold"
        >
          Cancel
        </Button>
        <Button
          type="button"
          variant="brand"
          size="sm"
          disabled={!area || isWorking}
          onClick={handleConfirm}
          className="h-9 cursor-pointer px-5 text-xs font-semibold"
        >
          {isWorking ? "Saving..." : "Use this logo"}
        </Button>
      </div>
    </>
  );
}
