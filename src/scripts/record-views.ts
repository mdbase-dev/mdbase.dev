// Where twelve records sit in each view of the "Build your own" picture on the
// apps page. The page renders the first view with these, and the same functions
// drive the animation, so the picture is whole before any script runs.

export const VIEWS = ["list", "board", "calendar", "timeline", "graph"] as const;
export type View = (typeof VIEWS)[number];
/** 0 open, 1 doing, 2 done. */
export type Status = 0 | 1 | 2;

export const STAGE = { width: 640, height: 360 };
export const COUNT = 12;
export const INITIAL_STATUS: Status[] = [0, 1, 2, 0, 2, 1, 0, 2, 0, 1, 2, 0];
export const BAR_HEIGHT = 6;

/** One record's drawing: its card, two text bars and its status dot. */
export type Tile = {
  x: number; y: number; w: number; h: number; r: number;
  ax: number; ay: number; aw: number; ao: number;
  bx: number; by: number; bw: number; bo: number;
  dx: number; dy: number; dr: number;
};
export const TILE_KEYS = ["x", "y", "w", "h", "r", "ax", "ay", "aw", "ao", "bx", "by", "bw", "bo", "dx", "dy", "dr"] as const;

const TITLE = [150, 118, 176, 96, 140, 164, 108, 132, 186, 92, 124, 158];
const LEFT = 28;
const ROW = 27;

export const BOARD = { columns: [28, 232, 436], width: 176, top: 48, gap: 8 };
export const CALENDAR = { columns: 7, rows: 4, left: 28, top: 20, stepX: 84, stepY: 82, width: 80, height: 76, today: 9 };
const DAY = [1, 3, 4, 8, 9, 9, 12, 15, 17, 17, 22, 25];
export const TIMELINE = { step: 84, lines: 8, today: 262 };
const START = [0, 40, 90, 20, 150, 200, 120, 260, 300, 230, 360, 410];
const SPAN = [120, 150, 90, 180, 110, 140, 200, 100, 160, 190, 150, 130];
const NODE = [[320, 180, 23], [212, 112, 17], [430, 104, 18], [196, 236, 16], [448, 258, 18], [318, 62, 13], [326, 300, 14], [110, 170, 13], [540, 176, 14], [120, 290, 11], [520, 60, 11], [560, 300, 11]];
export const EDGES = [[0, 1], [0, 2], [0, 3], [0, 4], [0, 5], [0, 6], [1, 7], [1, 5], [2, 8], [2, 10], [3, 9], [3, 7], [4, 8], [4, 11], [4, 6], [1, 3]];

function list(i: number): Tile {
  const x = LEFT, y = 18 + i * ROW, w = 584, h = 21;
  return {
    x, y, w, h, r: 5,
    ax: x + 30, ay: y + 7.5, aw: TITLE[i], ao: 1,
    bx: x + w - 58, by: y + 7.5, bw: 44, bo: 0.55,
    dx: x + 15, dy: y + 10.5, dr: 4
  };
}

function board(i: number, status: Status[]): Tile {
  const column = status[i];
  const inColumn = status.filter((value) => value === column).length;
  const place = status.slice(0, i).filter((value) => value === column).length;
  const room = STAGE.height - BOARD.top - 14 - (inColumn - 1) * BOARD.gap;
  const h = Math.min(50, room / inColumn);
  const x = BOARD.columns[column], y = BOARD.top + place * (h + BOARD.gap);
  const tall = h >= 44;
  return {
    x, y, w: BOARD.width, h, r: 7,
    ax: x + 28, ay: tall ? y + 12 : y + h / 2 - 3, aw: Math.min(TITLE[i] * 0.62, 130), ao: 1,
    bx: x + 14, by: y + 30, bw: TITLE[i] * 0.5, bo: tall ? 0.55 : 0,
    dx: x + 15, dy: tall ? y + 15 : y + h / 2, dr: 4
  };
}

function calendar(i: number): Tile {
  const day = DAY[i];
  const slot = DAY.slice(0, i).filter((value) => value === day).length;
  const x = CALENDAR.left + (day % CALENDAR.columns) * CALENDAR.stepX + 5;
  const y = CALENDAR.top + Math.floor(day / CALENDAR.columns) * CALENDAR.stepY + 22 + slot * 19;
  return {
    x, y, w: 70, h: 15, r: 4,
    ax: x + 16, ay: y + 4.5, aw: 40, ao: 0.9,
    bx: x + 16, by: y + 4.5, bw: 0, bo: 0,
    dx: x + 8, dy: y + 7.5, dr: 3
  };
}

function timeline(i: number): Tile {
  const x = LEFT + START[i], y = 20 + i * ROW, w = SPAN[i], h = 17;
  return {
    x, y, w, h, r: 8.5,
    ax: x + 24, ay: y + 5.5, aw: Math.min(TITLE[i] * 0.5, w - 36), ao: 0.9,
    bx: x + 24, by: y + 5.5, bw: 0, bo: 0,
    dx: x + 11, dy: y + 8.5, dr: 3.5
  };
}

function graph(i: number): Tile {
  const [cx, cy, r] = NODE[i];
  return {
    x: cx - r, y: cy - r, w: r * 2, h: r * 2, r,
    ax: cx, ay: cy - 3, aw: 0, ao: 0,
    bx: cx, by: cy - 3, bw: 0, bo: 0,
    dx: cx, dy: cy, dr: Math.max(3, r * 0.34)
  };
}

/** Every record's place in a view. Only the board depends on status. */
export function layout(view: View, status: Status[]): Tile[] {
  return Array.from({ length: COUNT }, (_, i) =>
    view === "list" ? list(i)
    : view === "board" ? board(i, status)
    : view === "calendar" ? calendar(i)
    : view === "timeline" ? timeline(i)
    : graph(i));
}
