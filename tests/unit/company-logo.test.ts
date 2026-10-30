import { describe, expect, it } from "vitest";

import { detectLogoType } from "@/features/company/logo";

const bytes = (...values: number[]) => new Uint8Array([...values, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
const ascii = (text: string) => [...text].map((c) => c.charCodeAt(0));

describe("detectLogoType", () => {
  it("accepts PNG, JPG and WebP by their first bytes", () => {
    expect(detectLogoType(bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a))?.extension).toBe("png");
    expect(detectLogoType(bytes(0xff, 0xd8, 0xff, 0xe0))?.extension).toBe("jpg");
    expect(detectLogoType(bytes(...ascii("RIFF"), 1, 2, 3, 4, ...ascii("WEBP")))?.extension).toBe("webp");
  });

  it("rejects SVG, HTML and other files even when renamed", () => {
    expect(detectLogoType(bytes(...ascii("<svg xmlns")))).toBeNull();
    expect(detectLogoType(bytes(...ascii("<script>alert(1)")))).toBeNull();
    expect(detectLogoType(bytes(...ascii("GIF89a")))).toBeNull();
  });

  it("rejects a RIFF file that is not WebP", () => {
    expect(detectLogoType(bytes(...ascii("RIFF"), 1, 2, 3, 4, ...ascii("WAVE")))).toBeNull();
  });

  it("rejects empty input", () => {
    expect(detectLogoType(new Uint8Array())).toBeNull();
  });
});
