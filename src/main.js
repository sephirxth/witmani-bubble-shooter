import './style.css'
import { createBubbleShooter } from './game.js'

document.querySelector('#app').innerHTML = `
  <main class="shell">
    <header class="hero">
      <div>
        <div class="eyebrow">Standalone arcade puzzler for the WitMani homepage</div>
        <h1>Bubble Shooter</h1>
        <p class="hero__copy">
          Aim, bank, and burst through handcrafted bubble fields. Chain same-color pops, drop floating stragglers,
          manage your reserve shot, and clear a 10-level campaign built to feel homepage-worthy instead of prototype-loose.
        </p>
      </div>
      <div class="hero__actions">
        <button id="btn-hint" class="btn btn--ghost">Hint</button>
        <button id="btn-swap" class="btn btn--ghost">Swap bubble</button>
        <button id="btn-restart" class="btn btn--ghost">Restart</button>
        <button id="btn-next" class="btn">Next level</button>
      </div>
    </header>

    <section class="statusbar">
      <div class="metric">
        <span class="metric__label">Campaign</span>
        <strong id="metric-level">Level 1 / 10</strong>
      </div>
      <div class="metric">
        <span class="metric__label">Shots left</span>
        <strong id="metric-shots">18</strong>
      </div>
      <div class="metric">
        <span class="metric__label">Bubbles left</span>
        <strong id="metric-bubbles">0</strong>
      </div>
      <div class="metric">
        <span class="metric__label">Best</span>
        <strong id="metric-best">—</strong>
      </div>
      <div class="metric">
        <span class="metric__label">Stars</span>
        <strong id="metric-stars">☆☆☆</strong>
      </div>
    </section>

    <section class="workspace">
      <div class="workspace__main">
        <div class="board-card">
          <div class="board-card__topline">
            <div>
              <div class="board-card__eyebrow">Live gameplay</div>
              <div id="level-name" class="board-card__title">Level 1 · Warm-Up Bank</div>
            </div>
            <div id="level-pill" class="board-card__pill">Easy</div>
          </div>

          <div id="message" class="message"></div>

          <section class="stage-shell">
            <div class="stage-shell__canvas-wrap">
              <canvas id="stage" width="440" height="720" aria-label="Bubble Shooter playfield"></canvas>
            </div>
            <div class="shooter-panel">
              <div class="bubble-card">
                <div class="bubble-card__label">Current</div>
                <div id="current-bubble" class="bubble-chip"></div>
                <strong id="current-label">Coral</strong>
              </div>
              <div class="bubble-card bubble-card--reserve">
                <div class="bubble-card__label">Reserve</div>
                <div id="reserve-bubble" class="bubble-chip"></div>
                <strong id="reserve-label">Sky</strong>
              </div>
              <div class="goal-card">
                <div class="bubble-card__label">Round plan</div>
                <strong id="goal-title">Clear every bubble</strong>
                <p id="goal-copy">Use your reserve bubble to finish same-color groups faster.</p>
              </div>
            </div>
          </section>
        </div>
      </div>

      <aside class="sidebar">
        <section class="panel">
          <div class="panel__eyebrow">Level ladder</div>
          <div id="level-list" class="level-list"></div>
        </section>

        <section class="panel">
          <div class="panel__eyebrow">How to win</div>
          <ul class="tips">
            <li>Launch bubbles into groups of 3 or more of the same color.</li>
            <li>Bank shots off the walls to reach hard corners.</li>
            <li>Popping the anchor can drop disconnected floaters for bonus clears.</li>
            <li>Swap to your reserve bubble before firing if the current color is awkward.</li>
          </ul>
        </section>
      </aside>
    </section>

    <div id="overlay" class="overlay hidden" role="dialog" aria-modal="true">
      <div class="overlay__card">
        <div class="overlay__eyebrow">Bubble control</div>
        <h2 id="overlay-title">Board cleared</h2>
        <p id="overlay-desc"></p>
        <div class="overlay__actions">
          <button id="overlay-restart" class="btn btn--ghost">Replay level</button>
          <button id="overlay-next" class="btn">Next level</button>
        </div>
      </div>
    </div>
  </main>
`

const game = createBubbleShooter({
  canvasEl: document.querySelector('#stage'),
  messageEl: document.querySelector('#message'),
  levelNameEl: document.querySelector('#level-name'),
  levelPillEl: document.querySelector('#level-pill'),
  metricLevelEl: document.querySelector('#metric-level'),
  metricShotsEl: document.querySelector('#metric-shots'),
  metricBubblesEl: document.querySelector('#metric-bubbles'),
  metricBestEl: document.querySelector('#metric-best'),
  metricStarsEl: document.querySelector('#metric-stars'),
  currentBubbleEl: document.querySelector('#current-bubble'),
  reserveBubbleEl: document.querySelector('#reserve-bubble'),
  currentLabelEl: document.querySelector('#current-label'),
  reserveLabelEl: document.querySelector('#reserve-label'),
  goalTitleEl: document.querySelector('#goal-title'),
  goalCopyEl: document.querySelector('#goal-copy'),
  levelListEl: document.querySelector('#level-list'),
  overlayEl: document.querySelector('#overlay'),
  overlayTitleEl: document.querySelector('#overlay-title'),
  overlayDescEl: document.querySelector('#overlay-desc'),
  overlayRestartEl: document.querySelector('#overlay-restart'),
  overlayNextEl: document.querySelector('#overlay-next'),
  hintBtn: document.querySelector('#btn-hint'),
  swapBtn: document.querySelector('#btn-swap'),
  restartBtn: document.querySelector('#btn-restart'),
  nextBtn: document.querySelector('#btn-next')
})

window.__bubbleShooter = game
