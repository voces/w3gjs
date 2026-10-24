// Checked by `tsc -p tsconfig.json`; ts-jest alone does not report type errors here.
import { ReplayParser } from "../src";

it("types event listener arguments", () => {
  const parser = new ReplayParser();
  parser.on("gamedatablock", (block) => {
    // @ts-expect-error block is a GameDataBlock, not any
    const n: number = block;
    return n;
  });
  parser.on("basic_replay_information", (info) => {
    // @ts-expect-error info is BasicReplayInformation, not any
    const n: number = info;
    return n;
  });
  expect(parser.listenerCount("gamedatablock")).toBe(1);
});
