import { describe, it, expect } from "vitest";
import { formatOutput, type VibesResponse } from "./index.js";

describe("formatOutput", () => {
  it("shows empty state when no others vibing and no drops", () => {
    const response: VibesResponse = {
      drops: [],
      n: 1, // just self
      ok: false,
      w: 0,
    };

    const output = formatOutput(response, false);

    expect(output).toContain("Quiet right now...");
    expect(output).toContain("Drop a vibe to start the conversation!");
  });

  it("shows others vibing count", () => {
    const response: VibesResponse = {
      drops: [],
      n: 5, // 4 others + self
      ok: false,
      w: 0,
    };

    const output = formatOutput(response, false);

    expect(output).toContain("4 others vibing");
  });

  it("shows singular 'other' for 1 person", () => {
    const response: VibesResponse = {
      drops: [],
      n: 2, // 1 other + self
      ok: false,
      w: 0,
    };

    const output = formatOutput(response, false);

    expect(output).toContain("1 other vibing");
    expect(output).not.toContain("others");
  });

  it("shows weekly drop count", () => {
    const response: VibesResponse = {
      drops: [],
      n: 1,
      ok: false,
      w: 47,
    };

    const output = formatOutput(response, false);

    expect(output).toContain("47 drops this week");
  });

  it("shows singular 'drop' for 1 weekly drop", () => {
    const response: VibesResponse = {
      drops: [],
      n: 1,
      ok: false,
      w: 1,
    };

    const output = formatOutput(response, false);

    expect(output).toContain("1 drop this week");
    expect(output).not.toContain("drops this week");
  });

  it("hides weekly count when 0", () => {
    const response: VibesResponse = {
      drops: [],
      n: 3,
      ok: false,
      w: 0,
    };

    const output = formatOutput(response, false);

    expect(output).not.toContain("this week");
  });

  it("shows dropped confirmation when posting succeeded", () => {
    const response: VibesResponse = {
      drops: [{ m: "test message", t: "now" }],
      n: 1,
      ok: true,
      w: 1,
    };

    const output = formatOutput(response, true);

    expect(output).toContain("📤 dropped");
  });

  it("does not show dropped when ok is false", () => {
    const response: VibesResponse = {
      drops: [],
      n: 1,
      ok: false,
      w: 0,
    };

    const output = formatOutput(response, true);

    expect(output).not.toContain("📤 dropped");
  });

  it("displays drops with messages and times", () => {
    const response: VibesResponse = {
      drops: [
        { m: "shipping at 2am", t: "3m" },
        { m: "it works", t: "8m" },
      ],
      n: 5,
      ok: false,
      w: 10,
    };

    const output = formatOutput(response, false);

    expect(output).toContain('"shipping at 2am"');
    expect(output).toContain("3m");
    expect(output).toContain('"it works"');
    expect(output).toContain("8m");
  });

  it("combines all elements correctly", () => {
    const response: VibesResponse = {
      drops: [{ m: "hello world", t: "now" }],
      n: 10,
      ok: true,
      w: 25,
    };

    const output = formatOutput(response, true);

    expect(output).toContain("📤 dropped");
    expect(output).toContain("9 others vibing");
    expect(output).toContain("25 drops this week");
    expect(output).toContain('"hello world"');
  });
});
