<template>
  <article
    class="item-card"
    :class="{
      'has-bane': item.bane_dps > 0,
      'has-backstab': item.bs_dps > 0,
      'is-expanded': expanded
    }"
    :style="{ '--type-color': typeColor }"
  >
    <button
      type="button"
      class="card-toggle"
      @click="toggleExpanded"
      :aria-expanded="expanded.toString()"
    >
      <span class="type-spine" aria-hidden="true"></span>

      <div class="card-topline">
        <span class="type-badge">
          <span class="type-glyph" :style="{ color: typeColor }" aria-hidden="true">{{ typeGlyph }}</span>
          <span class="type-label">{{ getTypeName() }}</span>
        </span>
        <span class="toggle-icon" :class="{ open: expanded }" aria-hidden="true">▾</span>
      </div>

      <div class="card-head">
        <ItemIcon
          :icon="item.icon"
          :name="item.name || `Item #${item.item_id}`"
          size="md"
          :title="item.name || `Item #${item.item_id}`"
        />
        <div class="card-head-copy">
          <h3 class="item-name">{{ item.name || `Item #${item.item_id}` }}</h3>
          <div class="item-subhead">
            <span>Item #{{ item.item_id }}</span>
            <span v-if="item.damage && item.delay">DMG {{ item.damage }} / DLY {{ item.delay }}</span>
            <span v-if="item.reqlevel">Req {{ item.reqlevel }}</span>
          </div>
        </div>
      </div>

      <div class="primary-stat">
        <div class="primary-stat-label">Total DPS</div>
        <div class="primary-stat-value">{{ formatDPS(item.total_dps) }}</div>
      </div>

      <div class="stat-grid">
        <div class="stat-chip">
          <span class="stat-chip-label">MH</span>
          <span class="stat-chip-value">{{ formatDPS(item.mh_dps) }}</span>
        </div>
        <div class="stat-chip">
          <span class="stat-chip-label">Spell</span>
          <span class="stat-chip-value">{{ formatDPS(item.mh_spell_dps) }}</span>
        </div>
        <div v-if="item.bane_dps > 0" class="stat-chip optional">
          <span class="stat-chip-label">Bane</span>
          <span class="stat-chip-value">{{ formatDPS(item.bane_dps) }}</span>
        </div>
        <div v-if="item.bs_dps > 0" class="stat-chip optional">
          <span class="stat-chip-label">BS</span>
          <span class="stat-chip-value">{{ formatDPS(item.bs_dps) }}</span>
        </div>
      </div>
    </button>

    <transition name="card-expand">
      <section v-if="expanded" class="item-details-wrapper">
        <div v-if="spectrumTotal > 0" class="spectrum-block">
          <div class="spectrum" aria-label="Damage spectrum">
            <div
              v-for="seg in spectrumSegments"
              :key="seg.key"
              class="spectrum-seg"
              :style="{
                width: seg.pct + '%',
                background: seg.color
              }"
              :title="`${seg.label}: ${formatDPS(seg.value)}`"
            ></div>
          </div>

          <div class="spectrum-legend">
            <span
              v-for="seg in spectrumSegments"
              :key="`lg-${seg.key}`"
              class="legend-chip"
              :style="{ '--chip-color': seg.color }"
            >
              <span class="legend-dot" :style="{ background: seg.color }"></span>
              <span class="legend-label">{{ seg.short }}</span>
              <span class="legend-value">{{ formatDPS(seg.value) }}</span>
            </span>
          </div>
        </div>

        <div class="item-details" v-if="item.damage || item.delay || item.ac">
          <div class="detail" v-if="item.damage">
            <span class="detail-label">DMG</span>
            <span class="detail-value">{{ item.damage }}</span>
          </div>
          <div class="detail" v-if="item.delay">
            <span class="detail-label">DLY</span>
            <span class="detail-value">{{ item.delay }}</span>
          </div>
          <div class="detail" v-if="item.ac">
            <span class="detail-label">AC</span>
            <span class="detail-value">{{ item.ac }}</span>
          </div>
        </div>

        <div class="item-requirements" v-if="item.classes || item.reqlevel">
          <div class="requirement" v-if="item.classes">
            <span class="req-label">Classes</span>
            <div class="class-chips">
              <span v-for="cls in classList" :key="cls" class="class-chip">{{ cls }}</span>
            </div>
          </div>
          <div class="requirement req-inline" v-if="item.reqlevel">
            <span class="req-label">Req Lvl</span>
            <span class="req-value">{{ item.reqlevel }}</span>
          </div>
        </div>

        <div class="item-notes" v-if="item.notes">
          <span class="notes-label">Notes</span>
          <span class="notes-text">{{ item.notes }}</span>
        </div>

        <div class="item-actions">
          <button type="button" class="detail-btn" @click.stop="handleOpen">
            <span class="btn-glyph">✦</span>
            View Full Artifact
          </button>
          <a
            :href="`${allaBaseUrl}${item.item_id}`"
            target="_blank"
            rel="noopener noreferrer"
            class="view-link"
            @click.stop
          >
            Alla ↗
          </a>
        </div>
      </section>
    </transition>
  </article>
</template>

<script>
import config from '../config';
import ItemIcon from './ItemIcon.vue';
import { formatDPS, getClassNames, getItemTypeColor, getItemTypeName } from '../utils/formatters';

const SPECTRUM_DEFS = [
  { key: 'mh', field: 'mh_dps', label: 'Main Hand', short: 'MH', color: '#c57f7c' },
  { key: 'oh', field: 'oh_dps', label: 'Off Hand', short: 'OH', color: '#b79064' },
  { key: 'spell', field: 'mh_spell_dps', label: 'Spell (MH)', short: 'Spell', color: '#7f9dc5' },
  { key: 'spellOh', field: 'oh_spell_dps', label: 'Spell (OH)', short: 'Sp-OH', color: '#7caeb8' },
  { key: 'bane', field: 'bane_dps', label: 'Bane', short: 'Bane', color: '#c6a06a' },
  { key: 'bs', field: 'bs_dps', label: 'Backstab', short: 'BS', color: '#998bc3' }
];

const TYPE_GLYPHS = {
  0: '⚔', 1: '🗡', 2: '🗡', 3: '🔨',
  4: '🔨', 5: '🏹', 7: '🏹', 8: '🛡',
  10: '👕', 11: '✦', 20: '✦', 21: '🧪',
  27: '💡', 35: '⚔', 45: '👊'
};

export default {
  name: 'ItemCard',
  components: {
    ItemIcon
  },
  props: {
    item: {
      type: Object,
      required: true
    }
  },
  emits: ['open'],
  data() {
    return {
      allaBaseUrl: config.ALLA_BASE_URL,
      expanded: false
    };
  },
  computed: {
    typeColor() {
      return getItemTypeColor(this.item.itemtype);
    },
    typeGlyph() {
      return TYPE_GLYPHS[this.item.itemtype] ?? '✦';
    },
    spectrumSegments() {
      const segs = SPECTRUM_DEFS
        .map((def) => ({
          key: def.key,
          label: def.label,
          short: def.short,
          value: Number(this.item[def.field] ?? 0),
          color: def.color
        }))
        .filter((segment) => Number.isFinite(segment.value) && segment.value > 0);

      const total = segs.reduce((sum, segment) => sum + segment.value, 0);
      if (total <= 0) return [];

      return segs.map((segment) => ({
        ...segment,
        pct: Math.max(2, (segment.value / total) * 100)
      }));
    },
    spectrumTotal() {
      return this.spectrumSegments.reduce((sum, segment) => sum + segment.value, 0);
    },
    classList() {
      const str = getClassNames(this.item.classes);
      if (!str || str === 'ALL') return ['ALL'];
      return str.split(' ').filter(Boolean);
    }
  },
  watch: {
    item() {
      this.expanded = false;
    }
  },
  methods: {
    formatDPS,
    getTypeName() {
      return getItemTypeName(this.item.itemtype);
    },
    toggleExpanded() {
      this.expanded = !this.expanded;
    },
    handleOpen() {
      this.$emit('open', this.item);
    }
  }
};
</script>

<style scoped>
.item-card {
  position: relative;
  background: linear-gradient(180deg, rgba(24, 24, 40, 0.96) 0%, rgba(13, 13, 25, 0.96) 100%);
  border: 1px solid var(--line-soft);
  border-radius: var(--r-md);
  padding: 14px 14px 14px 18px;
  transition: all 0.25s ease;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.item-card::before {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at 100% 0%, color-mix(in srgb, var(--type-color) 8%, transparent), transparent 44%);
  opacity: 0;
  transition: opacity 0.25s ease;
  pointer-events: none;
}

.item-card:hover {
  border-color: color-mix(in srgb, var(--type-color) 48%, var(--line-soft));
  transform: translateY(-2px);
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.42);
}

.item-card:hover::before {
  opacity: 1;
}

.item-card.is-expanded {
  border-color: color-mix(in srgb, var(--type-color) 56%, var(--line-soft));
}

.type-spine {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  width: 2px;
  background: linear-gradient(180deg, var(--type-color), transparent 120%);
}

.card-toggle {
  all: unset;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.card-topline {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.card-head {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 12px;
  align-items: center;
}

.card-head-copy {
  min-width: 0;
}

.type-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px 4px 8px;
  border: 1px solid color-mix(in srgb, var(--type-color) 28%, transparent);
  background: color-mix(in srgb, var(--type-color) 10%, transparent);
  border-radius: var(--r-pill);
  font-family: var(--font-display);
  font-size: 0.65rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--ink-secondary);
}

.type-glyph {
  font-size: 0.8rem;
}

.toggle-icon {
  font-size: 0.95rem;
  color: var(--ink-muted);
  transition: transform 0.25s ease, color 0.25s ease;
  flex-shrink: 0;
}

.toggle-icon.open {
  transform: rotate(180deg);
  color: var(--gold);
}

.item-name {
  font-family: var(--font-display);
  font-size: 1.02rem;
  font-weight: 600;
  color: var(--ink-primary);
  margin: 0;
  letter-spacing: 0.02em;
  line-height: 1.25;
  word-break: break-word;
}

.item-subhead {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 12px;
  margin-top: 5px;
  color: var(--ink-muted);
  font-size: 0.76rem;
  font-family: var(--font-mono);
}

.primary-stat {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 12px;
  border-radius: var(--r-sm);
  background: rgba(255, 255, 255, 0.025);
  border: 1px solid var(--line-dim);
}

.primary-stat-label {
  font-family: var(--font-display);
  font-size: 0.62rem;
  letter-spacing: 0.24em;
  text-transform: uppercase;
  color: var(--ink-muted);
}

.primary-stat-value {
  font-family: var(--font-mono);
  color: var(--rune-jade);
  font-size: 1.3rem;
  font-weight: 700;
}

.stat-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.stat-chip {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 10px 12px;
  border-radius: var(--r-sm);
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid var(--line-dim);
}

.stat-chip.optional {
  background: rgba(230, 193, 104, 0.03);
}

.stat-chip-label {
  font-family: var(--font-display);
  font-size: 0.62rem;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--ink-muted);
}

.stat-chip-value {
  font-family: var(--font-mono);
  font-size: 0.92rem;
  font-weight: 600;
  color: var(--ink-primary);
}

.item-details-wrapper {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-top: 14px;
  border-top: 1px dashed var(--line-soft);
}

.spectrum-block {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.spectrum {
  display: flex;
  height: 8px;
  width: 100%;
  border-radius: var(--r-pill);
  overflow: hidden;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--line-dim);
  gap: 2px;
  padding: 1px;
}

.spectrum-seg {
  height: 100%;
  border-radius: var(--r-pill);
  opacity: 0.92;
}

.spectrum-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.legend-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 3px 8px;
  border-radius: var(--r-pill);
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid color-mix(in srgb, var(--chip-color) 25%, transparent);
  font-size: 0.68rem;
  color: var(--ink-secondary);
}

.legend-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
}

.legend-label {
  font-family: var(--font-display);
  letter-spacing: 0.1em;
  text-transform: uppercase;
  font-size: 0.66rem;
  color: var(--ink-secondary);
}

.legend-value {
  font-family: var(--font-mono);
  color: var(--ink-primary);
  font-weight: 600;
  font-size: 0.7rem;
}

.item-details {
  display: flex;
  gap: 14px;
  flex-wrap: wrap;
}

.detail {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--line-dim);
  border-radius: var(--r-sm);
}

.detail-label {
  font-family: var(--font-display);
  color: var(--gold);
  font-size: 0.65rem;
  letter-spacing: 0.25em;
}

.detail-value {
  font-family: var(--font-mono);
  color: var(--ink-primary);
  font-size: 0.82rem;
  font-weight: 600;
}

.item-requirements {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  align-items: center;
}

.requirement {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.req-inline {
  flex-direction: row;
  align-items: center;
  gap: 8px;
}

.req-label {
  font-family: var(--font-display);
  color: var(--ink-muted);
  font-size: 0.62rem;
  letter-spacing: 0.25em;
  text-transform: uppercase;
}

.class-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.class-chip {
  font-family: var(--font-mono);
  font-size: 0.7rem;
  font-weight: 600;
  padding: 2px 7px;
  border-radius: var(--r-xs);
  background: rgba(110, 167, 255, 0.12);
  color: var(--rune-mana);
  border: 1px solid rgba(110, 167, 255, 0.3);
}

.req-value {
  font-family: var(--font-mono);
  color: var(--ink-primary);
  font-size: 0.82rem;
  font-weight: 600;
}

.item-notes {
  padding: 8px 12px;
  background: rgba(230, 193, 104, 0.06);
  border-left: 2px solid var(--gold);
  border-radius: 0 var(--r-sm) var(--r-sm) 0;
}

.notes-label {
  font-family: var(--font-display);
  color: var(--gold);
  font-size: 0.62rem;
  letter-spacing: 0.3em;
  text-transform: uppercase;
  margin-right: 8px;
}

.notes-text {
  color: var(--ink-secondary);
  font-size: 0.82rem;
  font-style: italic;
}

.item-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  margin-top: 4px;
}

.detail-btn {
  all: unset;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border: 1px solid var(--line-gold);
  background: var(--gold-faint);
  color: var(--gold);
  border-radius: var(--r-pill);
  padding: 6px 14px;
  font-family: var(--font-display);
  font-size: 0.7rem;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  transition: all 0.2s;
}

.detail-btn:hover {
  background: var(--gold);
  color: var(--bg-void);
  box-shadow: 0 0 10px var(--gold-glow);
}

.btn-glyph {
  font-size: 0.8rem;
}

.view-link {
  color: var(--ink-muted);
  font-family: var(--font-mono);
  font-size: 0.75rem;
  padding: 4px 10px;
  border-radius: var(--r-sm);
  transition: all 0.2s;
}

.view-link:hover {
  color: var(--rune-mana);
  background: rgba(110, 167, 255, 0.1);
}

.card-expand-enter-active,
.card-expand-leave-active {
  transition: opacity 0.22s ease, transform 0.22s ease, max-height 0.22s ease;
  overflow: hidden;
}

.card-expand-enter-from,
.card-expand-leave-to {
  opacity: 0;
  transform: translateY(-4px);
  max-height: 0;
}

@media (max-width: 640px) {
  .item-card {
    padding: 14px 12px 12px 16px;
  }

  .card-head {
    grid-template-columns: 1fr;
    align-items: flex-start;
  }

  .stat-grid {
    grid-template-columns: 1fr 1fr;
  }

  .item-actions {
    flex-direction: column;
    align-items: stretch;
  }

  .detail-btn,
  .view-link {
    justify-content: center;
    text-align: center;
  }
}
</style>
