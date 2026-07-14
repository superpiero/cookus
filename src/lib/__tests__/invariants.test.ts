import { describe, expect, it } from "vitest";
import { canonicalPair } from "../conversations";
import { slugifyHandle, isValidHandle } from "../handles";
import { sniffImageMime } from "../images";
import { formatSalary } from "../format";

describe("canonicalPair (unikátnost konverzace, docs/02 §2)", () => {
  it("řadí dvojici deterministicky bez ohledu na pořadí argumentů", () => {
    expect(canonicalPair("abc", "xyz")).toEqual({ userAId: "abc", userBId: "xyz" });
    expect(canonicalPair("xyz", "abc")).toEqual({ userAId: "abc", userBId: "xyz" });
  });
  it("stejný pár → stejný klíč (DB unique pak drží 1 konverzaci)", () => {
    const a = canonicalPair("cku1", "cku2");
    const b = canonicalPair("cku2", "cku1");
    expect(`${a.userAId}:${a.userBId}`).toBe(`${b.userAId}:${b.userBId}`);
  });
});

describe("slugifyHandle (česká diakritika)", () => {
  it("převádí diakritiku a mezery", () => {
    expect(slugifyHandle("Šéf Pepa Novák")).toBe("sef-pepa-novak");
    expect(slugifyHandle("Kavárna Pomáda")).toBe("kavarna-pomada");
  });
  it("drží limit 30 znaků a nevrací prázdný handle", () => {
    expect(slugifyHandle("Ž".repeat(100)).length).toBeLessThanOrEqual(30);
    expect(slugifyHandle("A").startsWith("ucet-")).toBe(true);
  });
});

describe("isValidHandle (rezervovaná slova, docs/03 §1.1)", () => {
  it("odmítá rezervované handly", () => {
    for (const reserved of ["admin", "jobs", "feed", "login", "p", "api"]) {
      expect(isValidHandle(reserved)).toBe(false);
    }
  });
  it("přijímá běžné handly a odmítá nevalidní znaky", () => {
    expect(isValidHandle("karel-dvorak")).toBe(true);
    expect(isValidHandle("Karel")).toBe(false);
    expect(isValidHandle("ab")).toBe(false);
  });
});

describe("sniffImageMime (magic bytes, docs/04 #18)", () => {
  it("rozpozná JPEG/PNG/WebP", () => {
    expect(sniffImageMime(Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 0]))).toBe("image/jpeg");
    expect(
      sniffImageMime(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0]))
    ).toBe("image/png");
    const webp = Buffer.concat([Buffer.from("RIFF"), Buffer.alloc(4), Buffer.from("WEBP"), Buffer.alloc(4)]);
    expect(sniffImageMime(webp)).toBe("image/webp");
  });
  it("odmítá spoofnutý mime (SVG/HTML payload)", () => {
    expect(sniffImageMime(Buffer.from("<svg xmlns='...'>"))).toBeNull();
    expect(sniffImageMime(Buffer.from("<!doctype html>"))).toBeNull();
  });
});

describe("formatSalary", () => {
  it("formátuje rozsahy a jednostranné hodnoty", () => {
    // cs-CZ používá jako oddělovač tisíců nezlomitelnou mezeru (U+00A0)
    expect(formatSalary(45000, 60000, "MESIC")).toBe("45 000–60 000 Kč/měs");
    expect(formatSalary(200, null, "HODINA")).toBe("od 200 Kč/hod");
    expect(formatSalary(null, null, null)).toBeNull();
  });
});
