import assert from "node:assert/strict";
import test from "node:test";
import { feetToPixels, pointAhead, sceneGrid, toFeet } from "../scripts/geometry.js";

test("area and scene units convert to feet and pixels", () => {
    assert.equal(toFeet(30, "ft"), 30);
    assert.ok(Math.abs(toFeet(10, "m") - 32.80839895) < 1e-9);
    assert.ok(Math.abs(toFeet(1, "mi") - 5280) < 0.001);
    assert.equal(toFeet("not a number", "ft"), null);

    const metric = sceneGrid({ grid: { units: "m", distance: 1.5 } }, { sizeX: 120 });
    assert.deepEqual(metric, { units: "m", distance: 1.5, size: 120 });
    assert.equal(feetToPixels(30, { units: "ft", distance: 5, size: 100 }), 600);
    assert.ok(Math.abs(feetToPixels(5, { units: "m", distance: 1.5, size: 120 }) - 121.92) < 1e-6);
});

test("facing follows Foundry clockwise-from-north", () => {
    const center = { x: 100, y: 100 };
    const north = pointAhead(center, 0, 5, { distance: 5, size: 100, units: "ft" });
    assert.ok(Math.abs(north.x - 100) < 0.001);
    assert.ok(Math.abs(north.y - 0) < 0.001);

    const east = pointAhead(center, 90, 5, { distance: 5, size: 100, units: "ft" });
    assert.ok(Math.abs(east.x - 200) < 0.001);
    assert.ok(Math.abs(east.y - 100) < 0.001);

    const south = pointAhead(center, 180, 5, { distance: 5, size: 100, units: "ft" });
    assert.ok(Math.abs(south.x - 100) < 0.001);
    assert.ok(Math.abs(south.y - 200) < 0.001);

    const west = pointAhead(center, 270, 5, { distance: 5, size: 100, units: "ft" });
    assert.ok(Math.abs(west.x - 0) < 0.001);
    assert.ok(Math.abs(west.y - 100) < 0.001);
});
