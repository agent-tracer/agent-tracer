import { TAG_COLOR_PALETTE, TAG_COLOR_PATTERN } from "@agent-tracer/kernel";
import { Input } from "~tracer-web/shared/ui/index.js";
import { cn } from "~tracer-web/shared/ui/lib/cn.js";

interface TagColorPickerProps {
  readonly color: string;
  readonly onChange: (color: string) => void;
  readonly disabled?: boolean;
}

/** 팔레트 스와치와 자유 hex 입력을 함께 주는 태그 색 선택기다. */
export function TagColorPicker({ color, onChange, disabled }: TagColorPickerProps) {
  const isValidHex = TAG_COLOR_PATTERN.test(color);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-1.5 flex-wrap" role="group" aria-label="Color palette">
        {TAG_COLOR_PALETTE.map((swatch) => (
          <button
            key={swatch}
            type="button"
            onClick={() => onChange(swatch)}
            disabled={disabled}
            aria-label={`Use color ${swatch}`}
            aria-pressed={swatch === color}
            className={cn(
              "h-6 w-6 rounded-full border-2 transition-transform",
              swatch === color ? "border-ink scale-110" : "border-transparent",
            )}
            style={{ backgroundColor: swatch }}
          />
        ))}
      </div>
      <div className="flex items-center gap-2">
        <span
          aria-hidden
          className="h-6 w-6 shrink-0 rounded-xs border border-hair"
          style={{ backgroundColor: isValidHex ? color : "transparent" }}
        />
        <Input
          value={color}
          onChange={(e) => onChange(e.target.value.trim().toLowerCase())}
          disabled={disabled}
          placeholder="#rrggbb"
          className="w-28 font-mono text-meta py-1"
        />
        {!isValidHex && (
          <span className="text-mini text-err">Use #rrggbb</span>
        )}
      </div>
    </div>
  );
}
