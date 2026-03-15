/**
 * Flat-top hex grid layout. Used for classic paint-by-numbers.
 */

const SQ3 = Math.sqrt(3);

export interface HexLayout {
  rows: number;
  cols: number;
  radius: number;
  /** Width of the hex (flat to flat) = 2 * radius */
  width: number;
  /** Height of the hex = sqrt(3) * radius */
  height: number;
  /** Total content size */
  contentWidth: number;
  contentHeight: number;
}

export function getHexLayout(
  rows: number,
  cols: number,
  fitWidth: number,
  fitHeight: number
): HexLayout {
  const widthPerHex = 2;   // 2*r per hex horizontally (with overlap)
  const heightPerHex = SQ3; // sqrt(3)*r per hex vertically
  const rByWidth = fitWidth / (cols * widthPerHex + 1);
  const rByHeight = fitHeight / (rows * heightPerHex);
  const radius = Math.min(rByWidth, rByHeight);
  return {
    rows,
    cols,
    radius,
    width: 2 * radius,
    height: SQ3 * radius,
    contentWidth: cols * 2 * radius + radius,
    contentHeight: rows * SQ3 * radius,
  };
}

/** Center position of hex at (row, col) in pixel coordinates. */
export function hexCenter(layout: HexLayout, row: number, col: number): { x: number; y: number } {
  const { radius } = layout;
  const x = col * 2 * radius + (row % 2) * radius;
  const y = row * SQ3 * radius;
  return { x, y };
}

/** Flat-top hex: 6 corners relative to center (0,0). Order: right, bottom-right, bottom-left, left, top-left, top-right. */
export function hexCorners(radius: number): { x: number; y: number }[] {
  const h = SQ3 * radius;
  return [
    { x: radius, y: 0 },
    { x: radius / 2, y: h / 2 },
    { x: -radius / 2, y: h / 2 },
    { x: -radius, y: 0 },
    { x: -radius / 2, y: -h / 2 },
    { x: radius / 2, y: -h / 2 },
  ];
}

/** Hit-test: return (row, col) of hex containing (px, py), or null. */
export function hexAtPoint(
  layout: HexLayout,
  px: number,
  py: number
): { row: number; col: number } | null {
  const { radius, rows, cols } = layout;
  const h = SQ3 * radius;
  const row = Math.floor(py / h);
  const col = Math.floor((px - (row % 2) * radius) / (2 * radius));
  const { x: cx, y: cy } = hexCenter(layout, row, col);
  if (!pointInHex(px - cx, py - cy, radius)) {
    const candidates: [number, number][] = [
      [row, col],
      [row, col - 1],
      [row, col + 1],
      [row - 1, col],
      [row + 1, col],
      [row - 1, col + (row % 2)],
      [row + 1, col + (row % 2)],
      [row - 1, col - 1 + (row % 2)],
      [row + 1, col - 1 + (row % 2)],
    ];
    for (const [r, c] of candidates) {
      if (r >= 0 && r < rows && c >= 0 && c < cols) {
        const { x: cx2, y: cy2 } = hexCenter(layout, r, c);
        if (pointInHex(px - cx2, py - cy2, radius))
          return { row: r, col: c };
      }
    }
    return null;
  }
  if (row >= 0 && row < rows && col >= 0 && col < cols) return { row, col };
  return null;
}

function pointInHex(dx: number, dy: number, radius: number): boolean {
  const h = SQ3 * radius;
  if (Math.abs(dy) > h / 2) return false;
  const xAtY = radius * (1 - (2 * Math.abs(dy)) / h);
  return Math.abs(dx) <= xAtY;
}
