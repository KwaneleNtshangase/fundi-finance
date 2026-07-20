import { test, expect } from "@playwright/test";
import { signIn, openFirstLesson } from "./helpers";

test("debug lesson open", async ({ page }) => {
  page.on("console", msg => console.log("PAGE LOG:", msg.text()));
  await signIn(page);
  await openFirstLesson(page);
  console.log("Lesson opened successfully!");
});
