/**
 * Distance and facing math, kept free of Foundry globals so it can be tested.
 *
 * Foundry token rotation is clockwise from up/north:
 *   0 = north, 90 = east, 180 = south, 270 = west.
 */

export const FEET_PER_UNIT = {
    ft: 1,
    foot: 1,
    feet: 1,
    m: 3.280839895,
    meter: 3.280839895,
    meters: 3.280839895,
    mi: 5280,
    mile: 5280,
    miles: 5280,
    km: 3280.839895,
    yd: 3,
    yard: 3,
    yards: 3
};

function unitKey(units) {
    return String(units ?? "ft").trim().toLowerCase();
}

/** Convert a value in an item or scene unit to feet. Unknown units are treated as feet. */
export function toFeet(value, units = "ft") {
    const number = Number(value);
    if (!Number.isFinite(number)) return null;
    return number * (FEET_PER_UNIT[unitKey(units)] ?? 1);
}

/**
 * Normalize the three grid values used by playback.
 * @param {{ grid?: { units?: string, distance?: number } }} [scene]
 * @param {{ sizeX?: number, size?: number }} [grid]
 */
export function sceneGrid(scene = {}, grid = {}) {
    return {
        units: scene?.grid?.units ?? "ft",
        distance: Number(scene?.grid?.distance),
        size: Number(grid?.sizeX ?? grid?.size ?? 100)
    };
}

/** Convert feet to pixels using the scene's units, distance per square, and pixel size. */
export function feetToPixels(feet, { units = "ft", distance = 5, size = 100 } = {}) {
    const value = Number(feet);
    if (!Number.isFinite(value)) return 0;
    const feetPerUnit = FEET_PER_UNIT[unitKey(units)] ?? 1;
    const safeDistance = Number.isFinite(distance) && distance > 0 ? distance : 5;
    const safeSize = Number.isFinite(size) && size > 0 ? size : 100;
    const feetPerSquare = safeDistance * feetPerUnit;
    return (value / feetPerSquare) * safeSize;
}

/** A point one distance ahead of a token, using Foundry's clockwise-from-north facing. */
export function pointAhead(center, rotationDegrees, feet, grid) {
    const pixels = feetToPixels(feet, grid);
    const rotation = Number(rotationDegrees);
    const radians = (Number.isFinite(rotation) ? rotation : 0) * (Math.PI / 180);
    const x = Number(center?.x) || 0;
    const y = Number(center?.y) || 0;
    return {
        x: x + Math.sin(radians) * pixels,
        y: y - Math.cos(radians) * pixels
    };
}
