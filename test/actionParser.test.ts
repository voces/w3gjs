import { ActionParser } from "../src/parsers/ActionParser";

const consoleErrorSpy = jest.spyOn(console, "error");

const cstr = (s: string) => Buffer.from(s + "\0", "utf-8");
const u32 = (n: number) => {
  const b = Buffer.alloc(4);
  b.writeUInt32LE(n);
  return b;
};
const w3mmd = (key: string) =>
  Buffer.concat([
    Buffer.from([0x6b]),
    cstr("MMD.Dat"),
    cstr("val:0"),
    cstr(key),
    u32(0),
  ]);

beforeEach(() => consoleErrorSpy.mockClear());

it("parses raw 0x77 as the identifier/value action in post-2.0.2 replays", () => {
  const input = Buffer.concat([
    Buffer.from([0x77]),
    cstr("autocontrol"),
    cstr("true"),
    u32(0),
    w3mmd("init version 1 1"),
  ]);
  const actions = new ActionParser().parse(input, true);
  expect(actions).toEqual([
    { id: 0x78, identifier: "autocontrol", value: "true" },
    expect.objectContaining({
      id: 0x6b,
      cache: expect.objectContaining({ key: "init version 1 1" }),
    }),
  ]);
  expect(consoleErrorSpy).not.toHaveBeenCalled();
});

it("skips the payload of third-party 0x50 actions with slot 0xff", () => {
  const input = Buffer.concat([
    Buffer.from([0x50, 0xff]),
    u32(8),
    Buffer.from("RHTW\0\0\0\0", "latin1"),
    w3mmd("init pid 0 a"),
  ]);
  const actions = new ActionParser().parse(input);
  expect(actions).toHaveLength(1);
  expect(actions[0]).toMatchObject({ id: 0x6b });
  expect(consoleErrorSpy).not.toHaveBeenCalled();
});

it("does not consume a payload byte for pause (0x01)", () => {
  const mouse = (eventId: number) =>
    Buffer.concat([
      Buffer.from([0x76, eventId]),
      Buffer.alloc(8), // position
      Buffer.from([0x01]), // button
    ]);
  const input = Buffer.concat([mouse(0x2d), Buffer.from([0x01]), mouse(0x2e)]);
  const actions = new ActionParser().parse(input, true);
  expect(actions.map((a) => a.id)).toEqual([0x76, 0x76]);
  expect(consoleErrorSpy).not.toHaveBeenCalled();
});
