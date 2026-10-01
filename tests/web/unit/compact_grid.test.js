"use strict";
const { test } = require("node:test");
const assert = require("node:assert/strict");
const { loadTypescriptTest } = require("./helpers/load_typescript_test");
const grid = loadTypescriptTest("src/webserver/model/grid.ts");
const subpage = loadTypescriptTest("src/webserver/model/subpage.ts");
const placement = loadTypescriptTest("src/webserver/features/preview_grid.ts");
test("legacy home layouts keep normal tile positions and serialization", () => {
  const order = "1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20";
  const parsed = grid.parseGridOrder(order, 20, 5, {}, 2);
  assert.equal(parsed.grid.length, 40);
  assert.equal(parsed.grid[10], 6);
  assert.equal(parsed.grid[35], -1);
  assert.equal(grid.serializeGridOrder(parsed.grid, parsed.sizes, 5, 2), order);
});
test("two compact buttons occupy one normal row and survive reopening", () => {
  const parsed = grid.parseGridOrder("1,2", 20, 5, {}, 2);
  const resized = placement.resizeGridSlot(parsed.grid, parsed.sizes, 1, 0, grid.CARD_SIZE_COMPACT, 40, 5, false, 2);
  assert.equal(resized.accepted, true);
  assert.equal(resized.grid[5], 0);
  placement.placeSlotAt(resized.grid, 3, 5, grid.CARD_SIZE_COMPACT, 5, 2);
  resized.sizes[3] = grid.CARD_SIZE_COMPACT;
  const order = grid.serializeGridOrder(resized.grid, resized.sizes, 5, 2);
  assert.ok(order.startsWith("H:"));
  const reopened = grid.parseGridOrder(order, 20, 5, {}, 2);
  assert.deepEqual(reopened, {grid: resized.grid, sizes: resized.sizes});
  assert.equal(placement.resizeGridSlot(reopened.grid, reopened.sizes, 1, 0, 1, 40, 5, false, 2).accepted, false);
});
test("subpage legacy Back and compact buttons preserve order", () => {
  const parsed = subpage.buildSubpageGrid({order: ["B", "1", "2"], buttons: [{}, {}]}, 20, 5, 2);
  assert.deepEqual(subpage.serializeSubpageGrid(parsed.grid, parsed.sizes, "Back", 5, 2), ["B", "1", "2"]);
  const compact = subpage.buildSubpageGrid({order: ["H:B", "1c", "", "", "", "", "2c"], buttons: [{}, {}]}, 20, 5, 2);
  assert.equal(compact.grid[1], 1);
  assert.equal(compact.grid[6], 2);
  const order = subpage.serializeSubpageGrid(compact.grid, compact.sizes, "Back", 5, 2);
  assert.deepEqual(subpage.buildSubpageGrid({order, buttons: [{}, {}]}, 20, 5, 2), compact);
});
test("compact subpages keep custom Back labels through export codecs", () => {
  const parsed = subpage.parseSubpageOrder("H:B=Home,1c,,,,,2c");
  assert.equal(parsed.backLabel, "Home");
  assert.equal(parsed.order[0], "H:B");
  assert.equal(subpage.subpageOrderForSerialize(parsed.order, parsed.backLabel)[0], "H:B=Home");
});
test("compact fits the last half-row but normal tiles cannot overflow it", () => {
  assert.equal(grid.sizeFitsAt(39, grid.CARD_SIZE_COMPACT, 40, 5, 2), true);
  assert.equal(grid.sizeFitsAt(39, grid.CARD_SIZE_SINGLE, 40, 5, 2), false);
  const parsed = grid.parseGridOrder("H:" + ",".repeat(39) + "20c", 20, 5, {}, 2);
  assert.equal(parsed.grid[39], 20);
  assert.equal(grid.serializeGridOrder(parsed.grid, parsed.sizes, 5, 2), "H:" + ",".repeat(39) + "20c");
});
