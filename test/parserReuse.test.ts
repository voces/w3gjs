import { ReplayParser } from "../src";
import path from "node:path";
import { readFileSync } from "node:fs";

const consoleErrorSpy = jest.spyOn(console, "error");

it("does not carry the post-2.0.2 flag over to the next replay", async () => {
  const parser = new ReplayParser();
  // Has the 0x38 marker, then a 2.0.1 replay from the same build without it.
  await parser.parse(
    readFileSync(
      path.resolve(__dirname, "replays/200/2.0.2-FloTVSavedByWc3.w3g"),
    ),
  );
  await parser.parse(
    readFileSync(path.resolve(__dirname, "replays/200/TempReplay.w3g")),
  );
  expect(consoleErrorSpy).not.toHaveBeenCalled();
});
