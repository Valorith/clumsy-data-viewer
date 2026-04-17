<template>
  <section class="stats-overview">
    <div class="stats-frame">
      <!-- Header strip -->
      <div class="stats-header">
        <span class="hdr-glyph" aria-hidden="true">✦</span>
        <div class="hdr-title-block">
          <div class="eyebrow">Arcane Compendium</div>
          <h2>Database Reliquary</h2>
        </div>
        <span class="hdr-glyph right" aria-hidden="true">✦</span>
      </div>

      <!-- Hero row: total items + max total DPS radial -->
      <div class="hero-row">
        <div class="hero-card total-items">
          <div class="hero-label">Indexed Artifacts</div>
          <div class="hero-value">{{ formatNumber(stats.totalItems) }}</div>
          <div class="hero-sub">weapons parsed &amp; chronicled</div>
          <div class="hero-bar">
            <div class="hero-bar-fill" :style="{ width: '100%' }"></div>
          </div>
        </div>

        <div class="hero-card max-dps" :style="{ '--accent': 'var(--rune-jade)' }">
          <svg class="gauge" viewBox="0 0 120 120" aria-hidden="true">
            <circle class="gauge-track" cx="60" cy="60" r="52" />
            <circle
              class="gauge-arc"
              cx="60"
              cy="60"
              r="52"
              :style="{ strokeDashoffset: gaugeOffset(100) }"
            />
          </svg>
          <div class="gauge-center">
            <div class="gauge-label">Peak Total DPS</div>
            <div class="gauge-value">{{ formatDPS(stats.maxTotalDps) }}</div>
            <div class="gauge-hint">highest recorded parse</div>
          </div>
        </div>

        <div class="hero-card prowess">
          <div class="prowess-label">Combat Ratios</div>
          <div class="ratio-row" v-if="stats.totalItems">
            <span class="ratio-label"><span class="dot" :style="{ background: 'var(--rune-flame)' }"></span> Bane-touched</span>
            <div class="ratio-track">
              <div class="ratio-fill flame" :style="{ width: banePercent + '%' }"></div>
            </div>
            <span class="ratio-value">{{ banePercent }}%</span>
          </div>
          <div class="ratio-row" v-if="stats.totalItems">
            <span class="ratio-label"><span class="dot" :style="{ background: 'var(--rune-violet)' }"></span> Backstab</span>
            <div class="ratio-track">
              <div class="ratio-fill violet" :style="{ width: backstabPercent + '%' }"></div>
            </div>
            <span class="ratio-value">{{ backstabPercent }}%</span>
          </div>
        </div>
      </div>

      <!-- Secondary radial gauges -->
      <div class="gauges-row">
        <div
          v-for="gauge in gauges"
          :key="gauge.key"
          class="mini-gauge"
          :style="{ '--accent': gauge.color }"
        >
          <svg viewBox="0 0 80 80" class="mini-gauge-svg" aria-hidden="true">
            <circle class="mg-track" cx="40" cy="40" r="34" />
            <circle
              class="mg-arc"
              cx="40"
              cy="40"
              r="34"
              :style="{ strokeDashoffset: miniGaugeOffset(gauge.percent) }"
            />
          </svg>
          <div class="mg-glyph">{{ gauge.glyph }}</div>
          <div class="mg-body">
            <div class="mg-value">{{ gauge.display }}</div>
            <div class="mg-label">{{ gauge.label }}</div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script>
import { formatDPS, formatNumber } from '../utils/formatters';

export default {
  name: 'StatsOverview',
  props: {
    stats: {
      type: Object,
      required: true
    }
  },
  computed: {
    banePercent() {
      if (!this.stats.totalItems) return 0;
      return Math.min(100, Math.round((this.stats.baneItems / this.stats.totalItems) * 100));
    },
    backstabPercent() {
      if (!this.stats.totalItems) return 0;
      return Math.min(100, Math.round((this.stats.backstabItems / this.stats.totalItems) * 100));
    },
    gauges() {
      const maxTotal = Math.max(this.stats.maxTotalDps || 1, 1);
      return [
        {
          key: 'melee',
          label: 'Max Melee DPS',
          display: formatDPS(this.stats.maxMeleeDps),
          percent: Math.round(((this.stats.maxMeleeDps || 0) / maxTotal) * 100),
          glyph: '⚔',
          color: 'var(--rune-flame)'
        },
        {
          key: 'spell',
          label: 'Max Spell DPS',
          display: formatDPS(this.stats.maxSpellDps),
          percent: Math.round(((this.stats.maxSpellDps || 0) / maxTotal) * 100),
          glyph: '✶',
          color: 'var(--rune-mana)'
        },
        {
          key: 'bane',
          label: 'Bane Items',
          display: formatNumber(this.stats.baneItems),
          percent: this.banePercent,
          glyph: '☠',
          color: 'var(--rune-amber)'
        },
        {
          key: 'backstab',
          label: 'Backstab Items',
          display: formatNumber(this.stats.backstabItems),
          percent: this.backstabPercent,
          glyph: '⚡',
          color: 'var(--rune-violet)'
        }
      ];
    }
  },
  methods: {
    formatDPS,
    formatNumber,
    gaugeOffset(percent) {
      const circumference = 2 * Math.PI * 52;
      const clamped = Math.max(0, Math.min(100, percent));
      return circumference - (clamped / 100) * circumference;
    },
    miniGaugeOffset(percent) {
      const circumference = 2 * Math.PI * 34;
      const clamped = Math.max(0, Math.min(100, percent));
      return circumference - (clamped / 100) * circumference;
    }
  }
};
</script>

<style scoped>
.stats-overview {
  position: relative;
}

.stats-frame {
  background:
    radial-gradient(ellipse 600px 200px at 50% 0%, rgba(230, 193, 104, 0.05), transparent 70%),
    linear-gradient(180deg, rgba(19, 19, 37, 0.86) 0%, rgba(13, 13, 25, 0.9) 100%);
  border: 1px solid var(--line-gold);
  border-radius: var(--r-lg);
  padding: 28px 32px 32px;
  box-shadow: var(--shadow-card);
  position: relative;
  overflow: hidden;
}

.stats-frame::before,
.stats-frame::after {
  content: '';
  position: absolute;
  width: 22px;
  height: 22px;
  border: 1px solid var(--gold);
  opacity: 0.5;
}

.stats-frame::before {
  top: 10px; left: 10px;
  border-right: none;
  border-bottom: none;
}

.stats-frame::after {
  bottom: 10px; right: 10px;
  border-left: none;
  border-top: none;
}

.stats-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 18px;
  margin-bottom: 24px;
}

.hdr-glyph {
  color: var(--gold);
  font-size: 1.2rem;
  animation: rune-pulse 3.5s ease-in-out infinite;
}

.hdr-title-block {
  text-align: center;
}

.eyebrow {
  font-family: var(--font-display);
  font-size: 0.7rem;
  letter-spacing: 0.5em;
  color: var(--gold);
  text-transform: uppercase;
  opacity: 0.75;
}

.stats-header h2 {
  font-family: var(--font-display);
  font-size: 1.6rem;
  font-weight: 700;
  color: var(--ink-primary);
  letter-spacing: 0.08em;
  margin: 2px 0 0;
}

/* ------ hero row ------ */
.hero-row {
  display: grid;
  grid-template-columns: 1.1fr 1fr 1.3fr;
  gap: 18px;
  margin-bottom: 22px;
}

.hero-card {
  position: relative;
  background: linear-gradient(180deg, rgba(7, 7, 13, 0.65), rgba(13, 13, 25, 0.55));
  border: 1px solid var(--line-soft);
  border-radius: var(--r-md);
  padding: 22px 22px;
  overflow: hidden;
  transition: border-color 0.3s, transform 0.3s, box-shadow 0.3s;
}

.hero-card:hover {
  border-color: var(--line-gold);
  transform: translateY(-2px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.24);
}

.hero-card::after {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 2px;
  background: linear-gradient(90deg, transparent, var(--accent, var(--gold)) 50%, transparent);
  opacity: 0.6;
}

.total-items { --accent: var(--gold); }

.hero-label {
  font-family: var(--font-display);
  font-size: 0.72rem;
  letter-spacing: 0.3em;
  text-transform: uppercase;
  color: var(--ink-muted);
  margin-bottom: 6px;
}

.hero-value {
  font-family: var(--font-display);
  font-size: 2.6rem;
  font-weight: 700;
  color: var(--gold-bright);
  line-height: 1.05;
  letter-spacing: 0.04em;
  text-shadow: 0 0 10px rgba(230, 193, 104, 0.1);
}

.hero-sub {
  color: var(--ink-muted);
  font-size: 0.85rem;
  font-style: italic;
  margin-top: 6px;
}

.hero-bar {
  margin-top: 14px;
  height: 3px;
  background: rgba(255, 255, 255, 0.04);
  border-radius: 3px;
  overflow: hidden;
}

.hero-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--gold-deep), var(--gold), var(--gold-bright));
}

/* Max DPS gauge card */
.max-dps {
  display: grid;
  grid-template-columns: 120px 1fr;
  align-items: center;
  gap: 16px;
  padding: 18px 22px;
}

.gauge {
  width: 120px;
  height: 120px;
  transform: rotate(-90deg);
}

.gauge-track {
  fill: none;
  stroke: rgba(255, 255, 255, 0.06);
  stroke-width: 6;
}

.gauge-arc {
  fill: none;
  stroke: url(#gaugeGrad);
  stroke: var(--accent, var(--gold));
  stroke-width: 6;
  stroke-linecap: round;
  stroke-dasharray: 326.726;
  filter: drop-shadow(0 0 3px var(--accent, var(--gold)));
  transition: stroke-dashoffset 0.8s ease;
}

.gauge-center {
  text-align: left;
}

.gauge-label {
  font-family: var(--font-display);
  font-size: 0.68rem;
  letter-spacing: 0.3em;
  text-transform: uppercase;
  color: var(--ink-muted);
}

.gauge-value {
  font-family: var(--font-mono);
  font-weight: 600;
  font-size: 1.8rem;
  color: var(--rune-jade);
  margin-top: 4px;
  text-shadow: 0 0 8px rgba(143, 182, 155, 0.18);
}

.gauge-hint {
  color: var(--ink-muted);
  font-size: 0.8rem;
  font-style: italic;
  margin-top: 2px;
}

/* Prowess ratio card */
.prowess { --accent: var(--rune-violet); }

.prowess-label {
  font-family: var(--font-display);
  font-size: 0.72rem;
  letter-spacing: 0.3em;
  text-transform: uppercase;
  color: var(--ink-muted);
  margin-bottom: 14px;
}

.ratio-row {
  display: grid;
  grid-template-columns: 130px 1fr 48px;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.ratio-row:last-child { margin-bottom: 0; }

.ratio-label {
  color: var(--ink-secondary);
  font-size: 0.85rem;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  box-shadow: 0 0 4px currentColor;
  display: inline-block;
}

.ratio-track {
  position: relative;
  height: 8px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 4px;
  overflow: hidden;
}

.ratio-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.8s ease;
}

.ratio-fill.flame {
  background: linear-gradient(90deg, rgba(239, 107, 107, 0.4), var(--rune-flame));
  box-shadow: 0 0 4px rgba(202, 133, 120, 0.2);
}

.ratio-fill.violet {
  background: linear-gradient(90deg, rgba(180, 140, 255, 0.4), var(--rune-violet));
  box-shadow: 0 0 4px rgba(162, 146, 200, 0.2);
}

.ratio-value {
  font-family: var(--font-mono);
  color: var(--ink-primary);
  font-size: 0.9rem;
  font-weight: 600;
  text-align: right;
}

/* ------ mini gauges row ------ */
.gauges-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 14px;
}

.mini-gauge {
  display: grid;
  grid-template-columns: 72px 1fr;
  align-items: center;
  gap: 14px;
  padding: 14px 16px;
  background: rgba(7, 7, 13, 0.5);
  border: 1px solid var(--line-dim);
  border-radius: var(--r-md);
  position: relative;
  transition: all 0.3s;
}

.mini-gauge:hover {
  border-color: var(--accent, var(--gold));
  box-shadow: 0 10px 18px color-mix(in srgb, var(--accent, var(--gold)) 12%, transparent);
  transform: translateY(-2px);
}

.mini-gauge-svg {
  position: relative;
  width: 72px;
  height: 72px;
  transform: rotate(-90deg);
  grid-row: 1;
  grid-column: 1;
}

.mg-track {
  fill: none;
  stroke: rgba(255, 255, 255, 0.06);
  stroke-width: 5;
}

.mg-arc {
  fill: none;
  stroke: var(--accent, var(--gold));
  stroke-width: 5;
  stroke-linecap: round;
  stroke-dasharray: 213.628;
  filter: drop-shadow(0 0 2px var(--accent, var(--gold)));
  transition: stroke-dashoffset 0.8s ease;
}

.mg-glyph {
  grid-row: 1;
  grid-column: 1;
  place-self: center;
  font-size: 1.5rem;
  color: var(--accent, var(--gold));
  text-shadow: 0 0 6px currentColor;
  animation: rune-pulse 4s ease-in-out infinite;
}

.mg-body {
  grid-row: 1;
  grid-column: 2;
}

.mg-value {
  font-family: var(--font-mono);
  color: var(--ink-primary);
  font-size: 1.2rem;
  font-weight: 600;
}

.mg-label {
  font-family: var(--font-display);
  color: var(--ink-muted);
  font-size: 0.7rem;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  margin-top: 2px;
}

@media (max-width: 1100px) {
  .hero-row {
    grid-template-columns: 1fr;
  }
  .max-dps {
    grid-template-columns: 100px 1fr;
  }
}

@media (max-width: 600px) {
  .stats-frame { padding: 22px 18px 24px; }
  .stats-header { gap: 12px; }
  .eyebrow {
    letter-spacing: 0.28em;
  }
  .stats-header h2 {
    font-size: 1.2rem;
    letter-spacing: 0.04em;
  }
  .ratio-row {
    grid-template-columns: 1fr;
    gap: 6px;
  }
  .ratio-value { text-align: left; }
  .max-dps {
    grid-template-columns: 1fr;
    justify-items: center;
    text-align: center;
  }
  .gauge-center {
    text-align: center;
  }
  .gauges-row {
    grid-template-columns: 1fr;
  }
}
</style>
