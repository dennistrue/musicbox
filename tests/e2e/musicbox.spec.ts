import path from "node:path";
import { expect, test } from "@playwright/test";

const sampleFixture = path.resolve(
  process.cwd(),
  "public/samples/electronic/snare.wav",
);

async function gotoApp(page: Parameters<typeof test>[0]["page"]) {
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => {
    pageErrors.push(error.message);
  });

  await page.goto("/");
  await expect(
    page.getByRole("heading", {
      name: "Build beats, blocks, fills, and song motion in one surface.",
    }),
  ).toBeVisible();
  await expect(page.getByText("Musicbox / macOS sequencer")).toBeVisible();

  return {
    pageErrors,
  };
}

test("human flow: edit steps, arrange, generate AI beat, and persist imported samples", async ({
  page,
}) => {
  const { pageErrors } = await gotoApp(page);

  await expect(page.getByRole("button", { name: "Play" })).toBeVisible();
  await expect(page.getByText("Loaded Samples").locator("..").getByText("8/8")).toBeVisible();

  const kickLane = page.locator(".lane-row").filter({ hasText: "Kick" });
  const kickStepTwo = kickLane.locator(".step-button").nth(1);

  await kickStepTwo.click();
  await expect(kickStepTwo).toHaveClass(/velocity-72/);

  await page.getByRole("button", { name: "Duplicate Variation" }).click();
  await expect(page.getByRole("button", { name: /Pocket Room Var/ })).toBeVisible();

  await page.getByRole("button", { name: "Song Blocks" }).click();
  await page.getByRole("button", { name: "Add Block" }).click();
  await expect(page.locator(".arranger-card")).toHaveCount(3);

  const newestBlock = page.locator(".arranger-card").nth(2);
  await newestBlock.getByRole("spinbutton").fill("3");
  await expect(newestBlock.getByRole("spinbutton")).toHaveValue("3");

  const aiPrompt = page.getByPlaceholder("Describe the beat, feel, groove, and transition shape.");
  await aiPrompt.fill(
    "Make it faster, broken, with a punchy fill and a short hook section.",
  );
  await page.getByRole("button", { name: "Generate Beat Idea" }).click();
  await expect(page.getByText(/Generated a broken-beat pocket|Generated a balanced groove/)).toBeVisible();

  await page.getByRole("button", { name: "Apply to Sequencer" }).click();
  await expect(page.locator(".pattern-chip")).toHaveCount(5);
  await expect(page.getByRole("button", { name: /Broken Orbit|Night Pulse|Warehouse Drive|Dust Pocket/ })).toBeVisible();

  await page.getByRole("button", { name: "Custom Vault" }).click();
  const snareImportCard = page.locator(".import-card").filter({ hasText: "Snare" });
  await snareImportCard.locator('input[type="file"]').setInputFiles(sampleFixture);
  await expect(page.getByText("snare.wav / MIDI 38")).toBeVisible();

  await page.reload();
  await expect(page.getByRole("button", { name: "Custom Vault" })).toHaveClass(/active/);
  await expect(page.getByText("snare.wav / MIDI 38")).toBeVisible();
  await expect(page.getByText("Loaded Samples").locator("..").getByText("1/1")).toBeVisible();

  expect(pageErrors).toEqual([]);
});
