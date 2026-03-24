const STORAGE_KEY = 'witmani-bubble-shooter-progress'

const COLORS = {
  O: { name: 'Coral', fill: '#f97316', soft: '#fdba74', glow: 'rgba(249, 115, 22, 0.3)' },
  B: { name: 'Sky', fill: '#38bdf8', soft: '#7dd3fc', glow: 'rgba(56, 189, 248, 0.28)' },
  G: { name: 'Mint', fill: '#34d399', soft: '#86efac', glow: 'rgba(52, 211, 153, 0.26)' },
  Y: { name: 'Gold', fill: '#f59e0b', soft: '#fde68a', glow: 'rgba(245, 158, 11, 0.28)' },
  P: { name: 'Violet', fill: '#8b5cf6', soft: '#c4b5fd', glow: 'rgba(139, 92, 246, 0.28)' },
  R: { name: 'Rose', fill: '#f43f5e', soft: '#fda4af', glow: 'rgba(244, 63, 94, 0.28)' }
}

const GRID_COLS = 8
const MAX_ROWS = 15
const STAGE_WIDTH = 440
const STAGE_HEIGHT = 720
const BOARD_TOP = 88
const BOARD_LEFT = 48
const RADIUS = 20
const DIAMETER = RADIUS * 2
const ROW_STEP = 34
const BOARD_RIGHT = BOARD_LEFT + GRID_COLS * DIAMETER + RADIUS
const DANGER_LINE = 574
const SHOOTER_X = STAGE_WIDTH / 2
const SHOOTER_Y = 658
const FIRE_SPEED = 700
const AIM_MIN = -Math.PI + 0.2
const AIM_MAX = -0.2

const RAW_LEVELS = [
  {
    id: 'warm-up-bank',
    name: 'Warm-Up Bank',
    difficulty: 'Easy',
    shots: 20,
    par: 8,
    rows: ['OO..BB..', '.OO..BB.', 'GG..YY..', '.GG..YY.']
  },
  {
    id: 'split-bank',
    name: 'Split Bank',
    difficulty: 'Easy',
    shots: 22,
    par: 10,
    rows: ['OOYYBB..', '.OOYYBB.', 'GGPP..BB', '.GGPP..BB', 'YYGGPP..']
  },
  {
    id: 'bridge-drop',
    name: 'Bridge Drop',
    difficulty: 'Easy+',
    shots: 22,
    par: 11,
    rows: ['OO..BB..', '.RRGG..B', 'RRGGYY..', '.PPYYOO.', 'PP..OO..']
  },
  {
    id: 'triad-tunnels',
    name: 'Triad Tunnels',
    difficulty: 'Medium',
    shots: 24,
    par: 13,
    rows: ['OOBBYY..', '.OOBBYY.', 'GGRRPP..', '.GGRRPP.', 'YY..OOBB', '.PP..GGR']
  },
  {
    id: 'pinwheel-pocket',
    name: 'Pinwheel Pocket',
    difficulty: 'Medium',
    shots: 24,
    par: 14,
    rows: ['..OOBB..', '.OOGGBB.', 'YYPPRR..', '.YYPPRR.', '..GGOO..', '.BBYYPP.']
  },
  {
    id: 'zigzag-shelf',
    name: 'Zigzag Shelf',
    difficulty: 'Medium+',
    shots: 26,
    par: 16,
    rows: ['OOBBYYPP', '.OOBBYYP', 'GGRROOBB', '.GGRROOB', 'YYPPGGRR', '.YYPPGGR']
  },
  {
    id: 'color-fan',
    name: 'Color Fan',
    difficulty: 'Hard',
    shots: 26,
    par: 17,
    rows: ['OOYYBBPP', '.OOYYBBP', 'RRGGYYBB', '.RRGGYYB', 'PPOORRGG', '.PPOORRG', '..YYGG..']
  },
  {
    id: 'crisscross-core',
    name: 'Crisscross Core',
    difficulty: 'Hard',
    shots: 28,
    par: 18,
    rows: ['OOBB..YY', '.OOBB..Y', 'GGRRPP..', '.GGRRPP.', '..YYOOBB', '.PPRRGG.', 'BB..YYOO', '.BB..YYO']
  },
  {
    id: 'crown-breaker',
    name: 'Crown Breaker',
    difficulty: 'Hard+',
    shots: 28,
    par: 19,
    rows: ['..OOBB..', '.YYPPRR.', 'OOBBYYPP', '.GGRROOB', 'YYPPGGRR', '.OOBBYYP', 'RRGGPP..', '.RRGGPP.']
  },
  {
    id: 'night-finale',
    name: 'Night Finale',
    difficulty: 'Expert',
    shots: 30,
    par: 21,
    rows: ['OOBBYYPP', '.OOBBYYP', 'GGRROOBB', '.GGRROOB', 'YYPPGGRR', '.YYPPGGR', 'RROOBBYY', '.RROOBBY', 'PPGGRROO']
  }
]

let bubbleId = 0

const LEVELS = RAW_LEVELS.map((level, index) => normalizeLevel(level, index))

function normalizeLevel(level, index) {
  const bubbles = buildBoard(level.rows)
  return {
    ...level,
    index,
    initialBubbleCount: bubbles.size
  }
}

function buildBoard(rows) {
  const board = new Map()
  rows.forEach((rowString, row) => {
    rowString
      .padEnd(GRID_COLS, '.')
      .slice(0, GRID_COLS)
      .split('')
      .forEach((token, col) => {
        if (token === '.' || !COLORS[token]) return
        const point = cellToPoint(row, col)
        board.set(keyOf(row, col), {
          id: `bubble-${bubbleId += 1}`,
          row,
          col,
          color: token,
          x: point.x,
          y: point.y
        })
      })
  })
  return board
}

function cellToPoint(row, col) {
  const offset = row % 2 ? RADIUS : 0
  return {
    x: BOARD_LEFT + offset + col * DIAMETER + RADIUS,
    y: BOARD_TOP + row * ROW_STEP + RADIUS
  }
}

function pointToApproxCell(x, y) {
  const row = clamp(Math.round((y - BOARD_TOP - RADIUS) / ROW_STEP), 0, MAX_ROWS - 1)
  const offset = row % 2 ? RADIUS : 0
  const col = clamp(Math.round((x - BOARD_LEFT - offset - RADIUS) / DIAMETER), 0, GRID_COLS - 1)
  return { row, col }
}

function getNeighbors(row, col) {
  return row % 2 === 0
    ? [[row, col - 1], [row, col + 1], [row - 1, col - 1], [row - 1, col], [row + 1, col - 1], [row + 1, col]]
    : [[row, col - 1], [row, col + 1], [row - 1, col], [row - 1, col + 1], [row + 1, col], [row + 1, col + 1]]
}

function inBounds(row, col) {
  return row >= 0 && row < MAX_ROWS && col >= 0 && col < GRID_COLS
}

function keyOf(row, col) {
  return `${row}:${col}`
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

function distance(ax, ay, bx, by) {
  return Math.hypot(ax - bx, ay - by)
}

function loadProgress() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}')
    return {
      unlocked: Math.max(0, Number(parsed.unlocked ?? 0)),
      bests: typeof parsed.bests === 'object' && parsed.bests ? parsed.bests : {}
    }
  } catch {
    return { unlocked: 0, bests: {} }
  }
}

function saveProgress(progress) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress))
}

function countColors(board) {
  const counts = {}
  board.forEach((bubble) => {
    counts[bubble.color] = (counts[bubble.color] ?? 0) + 1
  })
  return counts
}

function chooseNextColor(counts, preferred = []) {
  const entries = Object.entries(counts).sort((a, b) => b[1] - a[1])
  if (!entries.length) return null
  const bag = []
  entries.forEach(([color, count]) => {
    const weight = clamp(Math.ceil(count / 2), 1, 6)
    for (let index = 0; index < weight; index += 1) bag.push(color)
  })
  preferred.forEach((color) => {
    if (counts[color]) bag.push(color, color)
  })
  let picked = bag[Math.floor(Math.random() * bag.length)]
  if (preferred.length && Object.keys(counts).length > 1 && picked === preferred[0]) {
    const alternatives = bag.filter((color) => color !== preferred[0])
    if (alternatives.length) picked = alternatives[Math.floor(Math.random() * alternatives.length)]
  }
  return picked
}

function computeStars(level, usedShots) {
  if (usedShots <= level.par) return 3
  if (usedShots <= level.par + 3) return 2
  return 1
}

function formatStars(stars) {
  return `${'★'.repeat(stars)}${'☆'.repeat(3 - stars)}`
}

function formatBest(best) {
  if (!best) return '—'
  return `${formatStars(best.stars)} · ${best.usedShots} shots`
}

function findCluster(board, startRow, startCol, color) {
  const start = board.get(keyOf(startRow, startCol))
  if (!start || start.color !== color) return []
  const queue = [start]
  const visited = new Set([keyOf(start.row, start.col)])
  const cluster = []
  while (queue.length) {
    const bubble = queue.shift()
    cluster.push(bubble)
    getNeighbors(bubble.row, bubble.col).forEach(([row, col]) => {
      if (!inBounds(row, col)) return
      const key = keyOf(row, col)
      if (visited.has(key)) return
      const neighbor = board.get(key)
      if (!neighbor || neighbor.color !== color) return
      visited.add(key)
      queue.push(neighbor)
    })
  }
  return cluster
}

function findFloatingBubbles(board) {
  const reachable = new Set()
  const queue = []
  board.forEach((bubble) => {
    if (bubble.row === 0) {
      reachable.add(keyOf(bubble.row, bubble.col))
      queue.push(bubble)
    }
  })
  while (queue.length) {
    const bubble = queue.shift()
    getNeighbors(bubble.row, bubble.col).forEach(([row, col]) => {
      if (!inBounds(row, col)) return
      const key = keyOf(row, col)
      if (reachable.has(key)) return
      const neighbor = board.get(key)
      if (!neighbor) return
      reachable.add(key)
      queue.push(neighbor)
    })
  }
  const detached = []
  board.forEach((bubble) => {
    const key = keyOf(bubble.row, bubble.col)
    if (!reachable.has(key)) detached.push(bubble)
  })
  return detached
}

function removeBubbles(board, bubbles) {
  bubbles.forEach((bubble) => board.delete(keyOf(bubble.row, bubble.col)))
}

function boardTouchesDanger(board) {
  for (const bubble of board.values()) {
    if (bubble.y + RADIUS >= DANGER_LINE) return true
  }
  return false
}

function createParticles(x, y, color, amount = 8) {
  const particles = []
  for (let index = 0; index < amount; index += 1) {
    particles.push({
      x,
      y,
      radius: 2 + Math.random() * 4,
      vx: Math.cos((Math.PI * 2 * index) / amount + Math.random() * 0.4) * (60 + Math.random() * 120),
      vy: Math.sin((Math.PI * 2 * index) / amount + Math.random() * 0.4) * (60 + Math.random() * 120) - 20,
      color,
      life: 0.55 + Math.random() * 0.25,
      maxLife: 0.55 + Math.random() * 0.25
    })
  }
  return particles
}

function roundRect(ctx, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2)
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + width, y, x + width, y + height, r)
  ctx.arcTo(x + width, y + height, x, y + height, r)
  ctx.arcTo(x, y + height, x, y, r)
  ctx.arcTo(x, y, x + width, y, r)
  ctx.closePath()
}

function bestHintForColor(board, color) {
  const seen = new Set()
  let best = null
  board.forEach((bubble) => {
    getNeighbors(bubble.row, bubble.col).forEach(([row, col]) => {
      if (!inBounds(row, col)) return
      const key = keyOf(row, col)
      if (seen.has(key) || board.has(key)) return
      seen.add(key)
      const supported = row === 0 || getNeighbors(row, col).some(([nr, nc]) => board.has(keyOf(nr, nc)))
      if (!supported) return
      const neighbors = getNeighbors(row, col)
        .map(([nr, nc]) => board.get(keyOf(nr, nc)))
        .filter(Boolean)
      const sameCount = neighbors.filter((neighbor) => neighbor.color === color).length
      if (!sameCount) return
      const point = cellToPoint(row, col)
      const score = sameCount * 120 + neighbors.length * 12 - row * 4 - Math.abs(point.x - SHOOTER_X) * 0.05
      if (!best || score > best.score) {
        best = { row, col, x: point.x, y: point.y, sameCount, score, color }
      }
    })
  })
  return best
}

function findSnapCell(board, x, y) {
  const guess = pointToApproxCell(x, y)
  const candidates = []
  for (let row = Math.max(0, guess.row - 2); row <= Math.min(MAX_ROWS - 1, guess.row + 2); row += 1) {
    for (let col = Math.max(0, guess.col - 2); col <= Math.min(GRID_COLS - 1, guess.col + 2); col += 1) {
      const key = keyOf(row, col)
      if (board.has(key)) continue
      const supported = row === 0 || getNeighbors(row, col).some(([nr, nc]) => board.has(keyOf(nr, nc)))
      if (!supported) continue
      const point = cellToPoint(row, col)
      const score = distance(point.x, point.y, x, y) + row * 0.35
      candidates.push({ row, col, x: point.x, y: point.y, score })
    }
  }
  if (!candidates.length) {
    for (let row = 0; row < MAX_ROWS; row += 1) {
      for (let col = 0; col < GRID_COLS; col += 1) {
        const key = keyOf(row, col)
        if (board.has(key)) continue
        const supported = row === 0 || getNeighbors(row, col).some(([nr, nc]) => board.has(keyOf(nr, nc)))
        if (!supported) continue
        const point = cellToPoint(row, col)
        const score = distance(point.x, point.y, x, y) + row * 0.35
        candidates.push({ row, col, x: point.x, y: point.y, score })
      }
    }
  }
  candidates.sort((a, b) => a.score - b.score)
  return candidates[0] ?? null
}

function setBubbleChip(element, color) {
  const entry = color ? COLORS[color] : null
  element.style.background = entry
    ? `radial-gradient(circle at 30% 28%, ${entry.soft}, ${entry.fill} 62%, #0f172a 180%)`
    : 'linear-gradient(180deg, rgba(148,163,184,0.35), rgba(148,163,184,0.12))'
}

export function createBubbleShooter(elements) {
  const ctx = elements.canvasEl.getContext('2d')
  const progress = loadProgress()

  const state = {
    levelIndex: 0,
    board: new Map(),
    shotsLeft: 0,
    currentColor: null,
    reserveColor: null,
    pointer: { x: SHOOTER_X, y: 160 },
    activeShot: null,
    particles: [],
    popped: 0,
    message: '',
    status: 'playing',
    hintCell: null,
    hintUntil: 0,
    progress,
    lastFrame: performance.now()
  }

  function getLevel() {
    return LEVELS[state.levelIndex]
  }

  function syncHUD() {
    const level = getLevel()
    const best = state.progress.bests[level.id]
    const usedShots = level.shots - state.shotsLeft
    const previewStars = computeStars(level, Math.max(0, usedShots))

    elements.levelNameEl.textContent = `Level ${state.levelIndex + 1} · ${level.name}`
    elements.levelPillEl.textContent = level.difficulty
    elements.metricLevelEl.textContent = `Level ${state.levelIndex + 1} / ${LEVELS.length}`
    elements.metricShotsEl.textContent = `${state.shotsLeft}`
    elements.metricBubblesEl.textContent = `${state.board.size}`
    elements.metricBestEl.textContent = formatBest(best)
    elements.metricStarsEl.textContent = formatStars(previewStars)
    elements.messageEl.textContent = state.message
    setBubbleChip(elements.currentBubbleEl, state.currentColor)
    setBubbleChip(elements.reserveBubbleEl, state.reserveColor)
    elements.currentLabelEl.textContent = state.currentColor ? COLORS[state.currentColor].name : '—'
    elements.reserveLabelEl.textContent = state.reserveColor ? COLORS[state.reserveColor].name : '—'
    elements.goalTitleEl.textContent = `Clear ${level.initialBubbleCount} bubbles`
    elements.goalCopyEl.textContent = `Three stars if you finish in ${level.par} shots or fewer. Bank the walls when the center is clogged.`

    const canInteract = state.status === 'playing' && !state.activeShot
    elements.hintBtn.disabled = !canInteract
    elements.swapBtn.disabled = !canInteract || !state.currentColor || !state.reserveColor
    elements.restartBtn.disabled = Boolean(state.activeShot)
    elements.nextBtn.disabled = state.levelIndex >= LEVELS.length - 1
    elements.overlayNextEl.disabled = state.status !== 'won' || state.levelIndex >= LEVELS.length - 1
  }

  function renderLevelList() {
    elements.levelListEl.innerHTML = ''
    LEVELS.forEach((level, index) => {
      const button = document.createElement('button')
      const locked = index > state.progress.unlocked
      button.className = `level-chip${index === state.levelIndex ? ' level-chip--current' : ''}`
      button.disabled = locked
      const best = state.progress.bests[level.id]
      button.innerHTML = `
        <div class="level-chip__index">${index + 1}</div>
        <div class="level-chip__body">
          <strong>${level.name}</strong>
          <small>${locked ? 'Locked' : `${level.difficulty} · ${best ? formatStars(best.stars) : 'Uncleared'}`}</small>
        </div>
      `
      button.addEventListener('click', () => loadLevel(index))
      elements.levelListEl.appendChild(button)
    })
  }

  function defaultMessage() {
    const level = getLevel()
    return `Clear every bubble in ${level.shots} shots. ${formatStars(3)} if you finish in ${level.par} shots or fewer.`
  }

  function refillShooter(initial = false) {
    const counts = countColors(state.board)
    if (!Object.keys(counts).length) {
      state.currentColor = null
      state.reserveColor = null
      return
    }
    if (initial || !state.currentColor) {
      state.currentColor = chooseNextColor(counts)
    }
    if (initial || !state.reserveColor) {
      state.reserveColor = chooseNextColor(counts, [state.currentColor])
      if (!state.reserveColor) state.reserveColor = state.currentColor
    }
  }

  function hideOverlay() {
    elements.overlayEl.classList.add('hidden')
  }

  function showOverlay(title, description) {
    elements.overlayTitleEl.textContent = title
    elements.overlayDescEl.textContent = description
    elements.overlayEl.classList.remove('hidden')
  }

  function persistBest(stars, usedShots) {
    const level = getLevel()
    const previous = state.progress.bests[level.id]
    const shouldReplace = !previous || stars > previous.stars || (stars === previous.stars && usedShots < previous.usedShots)
    if (shouldReplace) {
      state.progress.bests[level.id] = { stars, usedShots }
    }
    state.progress.unlocked = Math.max(state.progress.unlocked, Math.min(LEVELS.length - 1, state.levelIndex + 1))
    saveProgress(state.progress)
  }

  function loadLevel(index) {
    state.levelIndex = clamp(index, 0, LEVELS.length - 1)
    const level = getLevel()
    state.board = buildBoard(level.rows)
    state.shotsLeft = level.shots
    state.popped = 0
    state.activeShot = null
    state.particles = []
    state.status = 'playing'
    state.hintCell = null
    state.hintUntil = 0
    state.message = defaultMessage()
    refillShooter(true)
    hideOverlay()
    renderLevelList()
    syncHUD()
    render(performance.now())
  }

  function prepareNextBubble() {
    const counts = countColors(state.board)
    if (!Object.keys(counts).length) {
      state.currentColor = null
      state.reserveColor = null
      return
    }
    state.currentColor = state.reserveColor && counts[state.reserveColor]
      ? state.reserveColor
      : chooseNextColor(counts)
    state.reserveColor = chooseNextColor(counts, [state.currentColor]) ?? state.currentColor
  }

  function finishWin() {
    const level = getLevel()
    const usedShots = level.shots - state.shotsLeft
    const stars = computeStars(level, usedShots)
    state.status = 'won'
    persistBest(stars, usedShots)
    state.message = `Board cleared in ${usedShots} shots. ${formatStars(stars)} locked for ${level.name}.`
    showOverlay('Board cleared', `You finished ${level.name} in ${usedShots} shots and locked ${formatStars(stars)}. Open the next stage or replay for a cleaner route.`)
    renderLevelList()
    syncHUD()
  }

  function finishLose(reason) {
    state.status = 'lost'
    state.message = reason
    showOverlay('Out of room', `${reason} Replay the level or use your reserve bubble earlier to keep the field cleaner.`)
    syncHUD()
  }

  function applyShotResult(placedBubble) {
    const board = state.board
    const cluster = findCluster(board, placedBubble.row, placedBubble.col, placedBubble.color)
    let poppedCount = 0
    let floatingCount = 0

    if (cluster.length >= 3) {
      removeBubbles(board, cluster)
      poppedCount += cluster.length
      cluster.forEach((bubble) => {
        state.particles.push(...createParticles(bubble.x, bubble.y, bubble.color, 8))
      })

      const floating = findFloatingBubbles(board)
      if (floating.length) {
        floatingCount = floating.length
        removeBubbles(board, floating)
        floating.forEach((bubble) => {
          state.particles.push(...createParticles(bubble.x, bubble.y, bubble.color, 6))
        })
      }

      state.popped += poppedCount + floatingCount
      state.message = floatingCount
        ? `Popped ${COLORS[placedBubble.color].name} ×${cluster.length} and dropped ${floatingCount} floaters.`
        : `Popped ${COLORS[placedBubble.color].name} cluster ×${cluster.length}.`
    } else {
      state.message = `No burst. Build a 3-match with ${COLORS[placedBubble.color].name} or swap before your next shot.`
    }

    if (!state.board.size) {
      finishWin()
      return
    }

    if (boardTouchesDanger(state.board)) {
      finishLose('The bubble stack reached the danger line.')
      return
    }

    if (state.shotsLeft <= 0) {
      finishLose('No shots left before the board was cleared.')
      return
    }

    prepareNextBubble()
    syncHUD()
  }

  function attachShot(shot) {
    const snap = findSnapCell(state.board, shot.x, shot.y)
    if (!snap) {
      finishLose('No legal snap cell remained on the board.')
      return
    }

    const bubble = {
      id: `bubble-${bubbleId += 1}`,
      row: snap.row,
      col: snap.col,
      color: shot.color,
      x: snap.x,
      y: snap.y
    }
    state.board.set(keyOf(snap.row, snap.col), bubble)
    state.activeShot = null
    applyShotResult(bubble)
  }

  function fire() {
    if (state.status !== 'playing' || state.activeShot || !state.currentColor || state.shotsLeft <= 0) return
    const rawAngle = Math.atan2(state.pointer.y - SHOOTER_Y, state.pointer.x - SHOOTER_X)
    const angle = clamp(rawAngle, AIM_MIN, AIM_MAX)
    state.activeShot = {
      x: SHOOTER_X,
      y: SHOOTER_Y - 18,
      vx: Math.cos(angle) * FIRE_SPEED,
      vy: Math.sin(angle) * FIRE_SPEED,
      color: state.currentColor
    }
    state.shotsLeft -= 1
    prepareNextBubble()
    state.message = `Shot out. ${state.shotsLeft} bubble${state.shotsLeft === 1 ? '' : 's'} remaining in the rack.`
    syncHUD()
  }

  function swap() {
    if (state.status !== 'playing' || state.activeShot || !state.currentColor || !state.reserveColor) return
    ;[state.currentColor, state.reserveColor] = [state.reserveColor, state.currentColor]
    state.message = `Swapped in ${COLORS[state.currentColor].name}. Use it to finish the better lane.`
    state.hintCell = null
    syncHUD()
  }

  function hint() {
    if (state.status !== 'playing' || state.activeShot || !state.currentColor) return
    const current = bestHintForColor(state.board, state.currentColor)
    const reserve = state.reserveColor ? bestHintForColor(state.board, state.reserveColor) : null
    const pick = reserve && (!current || reserve.score > current.score + 18) ? reserve : current

    if (!pick) {
      state.message = `No obvious burst line yet. Use a wall bank to set up a ${COLORS[state.currentColor].name} pair near the ceiling.`
      syncHUD()
      return
    }

    state.hintCell = pick
    state.hintUntil = performance.now() + 1800
    if (reserve && pick.color === state.reserveColor && (!current || reserve.score > current.score + 18)) {
      state.message = `Best line is your reserve: swap to ${COLORS[pick.color].name} and aim for the highlighted pocket.`
    } else {
      state.message = pick.sameCount >= 2
        ? `Aim ${COLORS[pick.color].name} at the highlighted pocket for an instant burst.`
        : `Use the highlighted pocket to build a better ${COLORS[pick.color].name} chain.`
    }
    syncHUD()
  }

  function update(dt, now) {
    if (state.hintCell && now > state.hintUntil) {
      state.hintCell = null
    }

    if (state.activeShot) {
      const shot = state.activeShot
      shot.x += shot.vx * dt
      shot.y += shot.vy * dt

      if (shot.x <= BOARD_LEFT + RADIUS) {
        shot.x = BOARD_LEFT + RADIUS
        shot.vx *= -1
      } else if (shot.x >= BOARD_RIGHT - RADIUS) {
        shot.x = BOARD_RIGHT - RADIUS
        shot.vx *= -1
      }

      if (shot.y <= BOARD_TOP + RADIUS) {
        shot.y = BOARD_TOP + RADIUS
        attachShot(shot)
      } else if (state.activeShot) {
        for (const bubble of state.board.values()) {
          if (distance(shot.x, shot.y, bubble.x, bubble.y) <= DIAMETER - 2) {
            attachShot(shot)
            break
          }
        }
      }
    }

    state.particles = state.particles.filter((particle) => {
      particle.life -= dt
      if (particle.life <= 0) return false
      particle.x += particle.vx * dt
      particle.y += particle.vy * dt
      particle.vy += 260 * dt
      return true
    })
  }

  function drawBackdrop() {
    const gradient = ctx.createLinearGradient(0, 0, 0, STAGE_HEIGHT)
    gradient.addColorStop(0, '#11264a')
    gradient.addColorStop(0.5, '#0b1732')
    gradient.addColorStop(1, '#090f1f')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, STAGE_WIDTH, STAGE_HEIGHT)

    const halo = ctx.createRadialGradient(STAGE_WIDTH / 2, 100, 24, STAGE_WIDTH / 2, 100, 200)
    halo.addColorStop(0, 'rgba(125, 211, 252, 0.22)')
    halo.addColorStop(1, 'rgba(125, 211, 252, 0)')
    ctx.fillStyle = halo
    ctx.fillRect(0, 0, STAGE_WIDTH, STAGE_HEIGHT)

    roundRect(ctx, 18, 24, STAGE_WIDTH - 36, 580, 28)
    ctx.fillStyle = 'rgba(7, 12, 24, 0.22)'
    ctx.fill()
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)'
    ctx.lineWidth = 1
    ctx.stroke()

    ctx.save()
    ctx.setLineDash([8, 8])
    ctx.strokeStyle = 'rgba(251, 191, 36, 0.32)'
    ctx.beginPath()
    ctx.moveTo(28, DANGER_LINE)
    ctx.lineTo(STAGE_WIDTH - 28, DANGER_LINE)
    ctx.stroke()
    ctx.restore()

    ctx.fillStyle = 'rgba(251, 191, 36, 0.88)'
    ctx.font = '700 12px Inter, sans-serif'
    ctx.fillText('Danger line', 32, DANGER_LINE - 10)

    roundRect(ctx, 128, 610, STAGE_WIDTH - 256, 84, 28)
    ctx.fillStyle = 'rgba(6, 11, 21, 0.76)'
    ctx.fill()
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.07)'
    ctx.stroke()
  }

  function drawAimGuide() {
    if (state.status !== 'playing' || state.activeShot || !state.currentColor) return
    const rawAngle = Math.atan2(state.pointer.y - SHOOTER_Y, state.pointer.x - SHOOTER_X)
    const angle = clamp(rawAngle, AIM_MIN, AIM_MAX)
    let x = SHOOTER_X
    let y = SHOOTER_Y - 20
    let vx = Math.cos(angle) * 12
    let vy = Math.sin(angle) * 12

    ctx.save()
    for (let step = 0; step < 28; step += 1) {
      x += vx
      y += vy
      if (x <= BOARD_LEFT + RADIUS || x >= BOARD_RIGHT - RADIUS) {
        vx *= -1
      }
      ctx.globalAlpha = 0.28 + step * 0.015
      ctx.fillStyle = '#f8fafc'
      ctx.beginPath()
      ctx.arc(x, y, 2.1, 0, Math.PI * 2)
      ctx.fill()
      if (y <= BOARD_TOP + RADIUS) break
    }
    ctx.restore()
  }

  function drawBubble(bubble, scale = 1, alpha = 1) {
    const entry = COLORS[bubble.color]
    ctx.save()
    ctx.globalAlpha = alpha
    ctx.translate(bubble.x, bubble.y)
    ctx.scale(scale, scale)

    ctx.beginPath()
    ctx.arc(0, 4, RADIUS, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(2, 6, 23, 0.28)'
    ctx.fill()

    const fill = ctx.createRadialGradient(-8, -8, 4, 0, 0, RADIUS + 4)
    fill.addColorStop(0, entry.soft)
    fill.addColorStop(0.58, entry.fill)
    fill.addColorStop(1, '#0f172a')

    ctx.beginPath()
    ctx.arc(0, 0, RADIUS, 0, Math.PI * 2)
    ctx.fillStyle = fill
    ctx.fill()
    ctx.lineWidth = 2
    ctx.strokeStyle = 'rgba(255,255,255,0.2)'
    ctx.stroke()

    ctx.beginPath()
    ctx.arc(-6, -8, 8, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(255,255,255,0.22)'
    ctx.fill()
    ctx.restore()
  }

  function drawHint() {
    if (!state.hintCell) return
    ctx.save()
    ctx.translate(state.hintCell.x, state.hintCell.y)
    ctx.beginPath()
    ctx.arc(0, 0, RADIUS + 6, 0, Math.PI * 2)
    ctx.strokeStyle = 'rgba(250, 204, 21, 0.95)'
    ctx.lineWidth = 3
    ctx.stroke()
    ctx.beginPath()
    ctx.arc(0, 0, RADIUS + 12, 0, Math.PI * 2)
    ctx.strokeStyle = 'rgba(250, 204, 21, 0.3)'
    ctx.lineWidth = 2
    ctx.stroke()
    ctx.restore()
  }

  function drawParticles() {
    state.particles.forEach((particle) => {
      const entry = COLORS[particle.color]
      const life = particle.life / particle.maxLife
      ctx.save()
      ctx.globalAlpha = life
      ctx.fillStyle = entry.fill
      ctx.beginPath()
      ctx.arc(particle.x, particle.y, particle.radius * life, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
    })
  }

  function drawShooter() {
    ctx.save()
    const rawAngle = Math.atan2(state.pointer.y - SHOOTER_Y, state.pointer.x - SHOOTER_X)
    const angle = clamp(rawAngle, AIM_MIN, AIM_MAX)
    ctx.translate(SHOOTER_X, SHOOTER_Y)
    ctx.rotate(angle + Math.PI / 2)
    roundRect(ctx, -16, -56, 32, 64, 16)
    const barrel = ctx.createLinearGradient(0, -56, 0, 8)
    barrel.addColorStop(0, '#cbd5e1')
    barrel.addColorStop(1, '#64748b')
    ctx.fillStyle = barrel
    ctx.fill()
    ctx.restore()

    ctx.beginPath()
    ctx.arc(SHOOTER_X, SHOOTER_Y, 32, 0, Math.PI * 2)
    ctx.fillStyle = '#18263f'
    ctx.fill()
    ctx.strokeStyle = 'rgba(255,255,255,0.14)'
    ctx.lineWidth = 2
    ctx.stroke()

    if (state.currentColor) {
      drawBubble({ x: SHOOTER_X, y: SHOOTER_Y, color: state.currentColor }, 1)
    }
  }

  function render(now) {
    ctx.clearRect(0, 0, STAGE_WIDTH, STAGE_HEIGHT)
    drawBackdrop()
    drawAimGuide()
    drawHint()
    state.board.forEach((bubble) => drawBubble(bubble))
    if (state.activeShot) drawBubble(state.activeShot)
    drawParticles()
    drawShooter()

    ctx.fillStyle = 'rgba(255,255,255,0.84)'
    ctx.font = '700 16px Inter, sans-serif'
    ctx.fillText(`Shots ${state.shotsLeft}`, 34, 52)
    ctx.fillText(`Board ${state.board.size}`, STAGE_WIDTH - 122, 52)

    const level = getLevel()
    const best = state.progress.bests[level.id]
    ctx.font = '700 12px Inter, sans-serif'
    ctx.fillStyle = 'rgba(199, 210, 254, 0.8)'
    ctx.fillText(best ? `Best ${formatStars(best.stars)}` : 'Best uncleared', 34, 72)
  }

  function frame(now) {
    const dt = Math.min(0.032, (now - state.lastFrame) / 1000)
    state.lastFrame = now
    update(dt, now)
    render(now)
    requestAnimationFrame(frame)
  }

  function updatePointer(event) {
    const rect = elements.canvasEl.getBoundingClientRect()
    state.pointer.x = ((event.clientX - rect.left) / rect.width) * STAGE_WIDTH
    state.pointer.y = ((event.clientY - rect.top) / rect.height) * STAGE_HEIGHT
  }

  elements.canvasEl.addEventListener('pointermove', updatePointer)
  elements.canvasEl.addEventListener('pointerdown', (event) => {
    updatePointer(event)
    fire()
  })
  elements.canvasEl.addEventListener('contextmenu', (event) => event.preventDefault())

  elements.hintBtn.addEventListener('click', hint)
  elements.swapBtn.addEventListener('click', swap)
  elements.restartBtn.addEventListener('click', () => loadLevel(state.levelIndex))
  elements.nextBtn.addEventListener('click', () => loadLevel(Math.min(LEVELS.length - 1, state.levelIndex + 1)))
  elements.overlayRestartEl.addEventListener('click', () => loadLevel(state.levelIndex))
  elements.overlayNextEl.addEventListener('click', () => {
    if (state.levelIndex < LEVELS.length - 1) loadLevel(state.levelIndex + 1)
  })

  loadLevel(0)
  requestAnimationFrame(frame)

  return {
    getState: () => ({
      levelIndex: state.levelIndex,
      shotsLeft: state.shotsLeft,
      boardSize: state.board.size,
      currentColor: state.currentColor,
      reserveColor: state.reserveColor,
      status: state.status
    }),
    loadLevel,
    hint,
    swap,
    fire
  }
}
