import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { estimateDriveMinutes } from "@/features/orders/server/drive-time";
import { previousBlock } from "@/features/orders/travel";

const reply = (body: unknown, ok = true) => Promise.resolve({ ok, json: () => Promise.resolve(body) } as Response);

describe("estimateDriveMinutes", () => {
  beforeEach(() => {
    vi.stubEnv("GOOGLE_PLACES_API_KEY", "test-key");
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("rounds Google's drive time up to the next 5 minutes", async () => {
    vi.stubGlobal("fetch", vi.fn(() => reply({ routes: [{ duration: "1081s" }] })));
    expect(await estimateDriveMinutes("1 Shop Rd, Warren, ME", "2 Site St, Camden, ME")).toBe(20);
  });

  it("asks Google once for the same two places", async () => {
    const fetchMock = vi.fn(() => reply({ routes: [{ duration: "600s" }] }));
    vi.stubGlobal("fetch", fetchMock);
    await estimateDriveMinutes("A Road, Town, ME", "B Road, Town, ME");
    await estimateDriveMinutes("a road, town, me", "B Road, Town, ME");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("returns null when Google refuses or finds no route", async () => {
    vi.stubGlobal("fetch", vi.fn(() => reply({ error: {} }, false)));
    expect(await estimateDriveMinutes("C Road, Town, ME", "D Road, Town, ME")).toBeNull();
    vi.stubGlobal("fetch", vi.fn(() => reply({})));
    expect(await estimateDriveMinutes("E Road, Town, ME", "F Road, Town, ME")).toBeNull();
  });

  it("returns null without a key", async () => {
    vi.stubEnv("GOOGLE_PLACES_API_KEY", "");
    expect(await estimateDriveMinutes("G Road, Town, ME", "H Road, Town, ME")).toBeNull();
  });
});

describe("previousBlock", () => {
  const blocks = [
    { id: "a", pumpId: "p1", startHour: 6 },
    { id: "b", pumpId: "p1", startHour: 10 },
    { id: "c", pumpId: "p2", startHour: 8 },
  ];
  it("picks the latest earlier job on the same pump, or null for the shop", () => {
    expect(previousBlock(blocks, "p1", 12)?.id).toBe("b");
    expect(previousBlock(blocks, "p1", 7)?.id).toBe("a");
    expect(previousBlock(blocks, "p1", 5)).toBeNull();
    expect(previousBlock(blocks, "p1", 12, "b")?.id).toBe("a");
  });
});
