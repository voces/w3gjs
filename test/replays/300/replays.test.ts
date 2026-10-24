import W3GReplay, { ReplayParser } from "../../../src";
import { readFileSync } from "node:fs";
import path from "node:path";
import type { HeroInfo } from "../../../src/Player";
const Parser = new W3GReplay();

const consoleLogSpy = jest.spyOn(console, "log");
const consoleErrorSpy = jest.spyOn(console, "error");

const heroSummary = (heroes: Omit<HeroInfo, "order">[]) =>
  heroes.map((hero) => ({
    id: hero.id,
    level: hero.level,
    abilities: hero.abilities,
  }));

it("identifies game version 3 and sets the version number to 3.00", async () => {
  const test = await Parser.parse(
    path.resolve(__dirname, "1723789209_Jens_FoCuS_Hammerfall.w3g"),
  );
  expect(test.version).toBe("3.00");
  expect(test.buildNumber).toBe(7000);
  expect(consoleLogSpy).not.toHaveBeenCalled();
  expect(consoleErrorSpy).not.toHaveBeenCalled();
});

describe("winner detection", () => {
  it("detects FoCuS#31324 as winner of 1723789209_Jens_FoCuS_Hammerfall.w3g", async () => {
    const test = await Parser.parse(
      path.resolve(__dirname, "1723789209_Jens_FoCuS_Hammerfall.w3g"),
    );
    expect(test.matchup).toBe("NvO");
    expect(test.winningTeamId).toBe(1);
    expect(
      test.players.find((player) => player.teamid === test.winningTeamId)!.name,
    ).toBe("FoCuS#31324");
  });

  it("detects noname#114787 as winner of 2969930621_Fortitude_FoCuS_Northern Isles 13.w3g", async () => {
    const test = await Parser.parse(
      path.resolve(
        __dirname,
        "2969930621_Fortitude_FoCuS_Northern Isles 13.w3g",
      ),
    );
    expect(test.matchup).toBe("HvO");
    expect(test.winningTeamId).toBe(0);
    expect(
      test.players.find((player) => player.teamid === test.winningTeamId)!.name,
    ).toBe("noname#114787");
  });

  it("detects SooooK#31962 as winner of 4139392965_FoCuS_Sok_Hammerfall.w3g", async () => {
    const test = await Parser.parse(
      path.resolve(__dirname, "4139392965_FoCuS_Sok_Hammerfall.w3g"),
    );
    expect(test.matchup).toBe("HvO");
    expect(test.winningTeamId).toBe(1);
    expect(
      test.players.find((player) => player.teamid === test.winningTeamId)!.name,
    ).toBe("SooooK#31962");
  });
});

describe("hero detection", () => {
  it("detects the heroes of both players in 1723789209_Jens_FoCuS_Hammerfall.w3g, including the new Npal hero", async () => {
    const test = await Parser.parse(
      path.resolve(__dirname, "1723789209_Jens_FoCuS_Hammerfall.w3g"),
    );
    expect(heroSummary(test.players[0].heroes)).toEqual([
      { id: "Ekee", level: 4, abilities: { AEfn: 2, AEer: 2 } },
      { id: "Npal", level: 3, abilities: { ANcp: 1, AHcr: 2 } },
    ]);
    expect(heroSummary(test.players[1].heroes)).toEqual([
      { id: "Obla", level: 4, abilities: { AOwk: 2, AOcr: 2 } },
      { id: "Oshd", level: 3, abilities: { AOhw: 1, AOsw: 2 } },
    ]);
  });

  it("detects the heroes of both players in 2969930621_Fortitude_FoCuS_Northern Isles 13.w3g, including the new Npal hero", async () => {
    const test = await Parser.parse(
      path.resolve(
        __dirname,
        "2969930621_Fortitude_FoCuS_Northern Isles 13.w3g",
      ),
    );
    expect(heroSummary(test.players[0].heroes)).toEqual([
      { id: "Hamg", level: 4, abilities: { AHwe: 2, AHab: 2 } },
      { id: "Npal", level: 4, abilities: { ANcp: 2, AHpa: 2 } },
    ]);
    expect(heroSummary(test.players[1].heroes)).toEqual([
      { id: "Ofar", level: 4, abilities: { AOsf: 2, AOcl: 2 } },
      { id: "Otch", level: 3, abilities: { AOws: 2, AOae: 1 } },
    ]);
  });

  it("detects the heroes of both players in 4139392965_FoCuS_Sok_Hammerfall.w3g", async () => {
    const test = await Parser.parse(
      path.resolve(__dirname, "4139392965_FoCuS_Sok_Hammerfall.w3g"),
    );
    expect(heroSummary(test.players[0].heroes)).toEqual([
      { id: "Ofar", level: 4, abilities: { AOsf: 2, AOcl: 2 } },
      { id: "Oshd", level: 3, abilities: { AOhx: 1, AOhw: 2 } },
      { id: "Otch", level: 3, abilities: { AOws: 2, AOae: 1 } },
    ]);
    expect(heroSummary(test.players[1].heroes)).toEqual([
      { id: "Hamg", level: 5, abilities: { AHwe: 3, AHab: 2 } },
      { id: "Hmkg", level: 5, abilities: { AHtb: 3, AHbh: 2 } },
    ]);
  });
});

it("uses 2.0.2 action ids for builds after 6115 without the 0x38 marker", async () => {
  // A fresh parser, so no earlier replay can leave the post-2.0.2 flag set.
  const test = await new W3GReplay().parse(
    path.resolve(__dirname, "849510_buildno7003_no_post202_marker.w3g"),
  );
  expect(test.buildNumber).toBe(7003);
  expect(consoleLogSpy).not.toHaveBeenCalled();
  expect(consoleErrorSpy).not.toHaveBeenCalled();
});

it("keeps W3MMD actions that follow a raw 0x77 action", async () => {
  const parser = new ReplayParser();
  const keys: string[] = [];
  parser.on("gamedatablock", (block) => {
    if (block.id !== 0x1f && block.id !== 0x1e) return;
    for (const commandBlock of block.commandBlocks) {
      for (const action of commandBlock.actions) {
        if (action.id === 0x6b && action.cache.filename === "MMD.dat") {
          keys.push(action.cache.key);
        }
      }
    }
  });
  await parser.parse(
    readFileSync(path.resolve(__dirname, "844092_sheeptag_w3mmd.w3g")),
  );
  expect(keys).toHaveLength(29);
  expect(keys[0]).toBe("init version 1 1");
  expect(consoleErrorSpy).not.toHaveBeenCalled();
});
