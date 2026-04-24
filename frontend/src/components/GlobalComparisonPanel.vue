<template>
  <section class="comparison-panel">
    <div class="comparison-head">
      <div>
        <h2>Global DPS</h2>
        <p v-if="displayedBars.length">Showing top {{ displayedBars.length }} of {{ items.length }} items by active DPS</p>
        <p v-else>{{ loading ? 'Loading comparison...' : 'No comparison rows available' }}</p>
      </div>
      <div class="comparison-legend" aria-label="DPS component legend">
        <button
          v-for="segment in segments"
          :key="segment.key"
          type="button"
          :class="['legend-key', `segment-${segment.key}`]"
          :aria-pressed="isSegmentActive(segment.key)"
          @click="toggleSegment(segment.key)"
        >
          {{ segment.label }}
        </button>
      </div>
    </div>

    <div class="chart-frame">
      <div class="y-axis">
        <span>{{ formatDPS(maxValue) }}</span>
        <span>{{ formatDPS(maxValue / 2) }}</span>
        <span>0.00</span>
      </div>
      <div class="bar-field" :class="{ loading }">
        <button
          v-for="(bar, index) in displayedBars"
          :key="bar.item.item_id"
          type="button"
          :class="['dps-bar', { selected: bar.item.item_id === selectedItemId }]"
          :style="{ height: bar.height }"
          :title="bar.title"
          @click="$emit('select', bar.item)"
        >
          <span class="sr-only">{{ index + 1 }}</span>
          <span
            v-for="segment in bar.segments"
            :key="segment.key"
            :class="['bar-segment', `segment-${segment.key}`]"
            :style="{ height: segment.height }"
            aria-hidden="true"
          ></span>
        </button>
        <div v-if="!displayedBars.length" class="empty-chart">
          {{ loading ? 'Loading...' : 'No items match the current filters.' }}
        </div>
      </div>
      <div class="average-line" :style="{ bottom: averageLineBottom }">
        <span>Avg: {{ formatDPS(averageValue) }}</span>
      </div>
    </div>
  </section>
</template>

<script>
import { formatDPS } from '../utils/formatters';

const DEFAULT_SEGMENT_KEYS = ['main', 'spell', 'bane', 'backstab'];

export default {
  name: 'GlobalComparisonPanel',
  props: {
    items: {
      type: Array,
      default: () => []
    },
    loading: {
      type: Boolean,
      default: false
    },
    selectedItemId: {
      type: [Number, String],
      default: null
    }
  },
  emits: ['select'],
  data() {
    return {
      activeSegmentKeys: [...DEFAULT_SEGMENT_KEYS]
    };
  },
  computed: {
    segments() {
      return [
        { key: 'main', label: 'MH', field: 'mh_dps' },
        { key: 'spell', label: 'Spell', field: 'mh_spell_dps' },
        { key: 'bane', label: 'Bane', field: 'bane_dps' },
        { key: 'backstab', label: 'Backstab', field: 'bs_dps' }
      ];
    },
    activeSegments() {
      return this.segments.filter((segment) => this.isSegmentActive(segment.key));
    },
    displayedItems() {
      return [...this.items]
        .filter((item) => this.getValue(item) > 0)
        .sort((a, b) => {
          const activeDifference = this.getValue(b) - this.getValue(a);
          if (activeDifference !== 0) return activeDifference;
          return Number(b.total_dps || 0) - Number(a.total_dps || 0);
        })
        .slice(0, 50);
    },
    displayedBars() {
      const entries = this.displayedItems.map((item) => ({
        item,
        value: this.getValue(item)
      }));
      const maxValue = Math.max(...entries.map((entry) => entry.value), 0);

      return entries.map((entry) => this.createBar(entry.item, entry.value, maxValue));
    },
    maxValue() {
      return Math.max(...this.displayedBars.map((bar) => bar.value), 0);
    },
    averageValue() {
      if (!this.displayedBars.length) return 0;
      return this.displayedBars.reduce((sum, bar) => sum + bar.value, 0) / this.displayedBars.length;
    },
    averageLineBottom() {
      if (!this.maxValue) return '0%';
      return `${Math.min(96, Math.max(2, (this.averageValue / this.maxValue) * 100))}%`;
    }
  },
  methods: {
    formatDPS,
    getValue(item) {
      return this.activeSegments.reduce((sum, segment) => sum + this.getScaledSegmentValue(item, segment), 0);
    },
    getTotalValue(item) {
      return Math.max(0, Number(item?.total_dps || 0));
    },
    getSegmentValue(item, segment) {
      return Math.max(0, Number(item?.[segment.field] || 0));
    },
    segmentTotal(item, segments = this.segments) {
      return segments.reduce((sum, segment) => sum + this.getSegmentValue(item, segment), 0);
    },
    getScaledSegmentValue(item, segment) {
      const rawValue = this.getSegmentValue(item, segment);
      const rawTotal = this.segmentTotal(item);
      const targetTotal = this.getTotalValue(item) || rawTotal;

      if (rawTotal > 0 && targetTotal > 0) {
        return rawValue * (targetTotal / rawTotal);
      }

      return segment.key === 'main' ? targetTotal : 0;
    },
    isSegmentActive(key) {
      return this.activeSegmentKeys.includes(key);
    },
    toggleSegment(key) {
      this.activeSegmentKeys = this.isSegmentActive(key)
        ? this.activeSegmentKeys.filter((activeKey) => activeKey !== key)
        : [...this.activeSegmentKeys, key];
    },
    resetSegments() {
      this.activeSegmentKeys = [...DEFAULT_SEGMENT_KEYS];
    },
    createBar(item, activeTotal, maxValue) {
      const segments = activeTotal ? this.activeSegments
        .map((segment) => ({
          key: segment.key,
          value: this.getScaledSegmentValue(item, segment)
        }))
        .filter((segment) => segment.value > 0)
        .map((segment) => ({
          ...segment,
          height: `${Math.max(2, (segment.value / activeTotal) * 100)}%`
        })) : [];

      return {
        item,
        value: activeTotal,
        height: maxValue ? `${Math.max(5, (activeTotal / maxValue) * 100)}%` : '0%',
        segments,
        title: this.getBarTitle(item, activeTotal)
      };
    },
    getBarTitle(item, activeTotal) {
      const lines = [
        `${item.name || `Item #${item.item_id}`}: ${formatDPS(activeTotal)} active DPS`,
        `Original total: ${formatDPS(this.getTotalValue(item))}`,
        `MH contribution: ${formatDPS(this.getScaledSegmentValue(item, this.segments[0]))}`,
        `Spell contribution: ${formatDPS(this.getScaledSegmentValue(item, this.segments[1]))}`,
        `Bane contribution: ${formatDPS(this.getScaledSegmentValue(item, this.segments[2]))}`,
        `Backstab contribution: ${formatDPS(this.getScaledSegmentValue(item, this.segments[3]))}`
      ];

      return lines.join('\n');
    }
  }
};
</script>

<style scoped>
.comparison-panel {
  min-width: 0;
  min-height: 250px;
  padding: 18px 20px 16px;
  border-bottom: 1px solid var(--line-strong);
}

.comparison-head {
  display: flex;
  justify-content: space-between;
  align-items: start;
  gap: 16px;
  margin-bottom: 14px;
}

.comparison-head p {
  margin: 5px 0 0;
  color: var(--text-muted);
  font-size: 0.78rem;
}

.comparison-legend {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 6px;
  max-width: 320px;
}

.legend-key {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 0;
  border: 0;
  border-radius: 0;
  background: transparent;
  color: var(--text-secondary);
  font-family: var(--font-display);
  font-size: 0.74rem;
  transition: color 0.16s ease, opacity 0.16s ease;
}

.legend-key:hover,
.legend-key[aria-pressed='true'] {
  color: var(--text-primary);
}

.legend-key[aria-pressed='false'] {
  color: var(--text-faint);
  opacity: 0.52;
}

.legend-key::before {
  content: '';
  width: 9px;
  height: 9px;
  border: 1px solid rgba(0, 0, 0, 0.22);
}

.chart-frame {
  position: relative;
  min-width: 0;
  display: grid;
  grid-template-columns: 54px 1fr;
  height: 170px;
  border: 1px solid var(--line-strong);
  background:
    linear-gradient(rgba(214, 194, 153, 0.08) 1px, transparent 1px),
    rgba(18, 18, 16, 0.72);
  background-size: 100% 25%;
}

.y-axis {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 8px 8px;
  border-right: 1px solid var(--line-strong);
  color: var(--text-muted);
  font-family: var(--font-mono);
  font-size: 0.72rem;
  text-align: right;
}

.bar-field {
  position: relative;
  display: flex;
  align-items: end;
  gap: 4px;
  min-width: 0;
  padding: 16px 10px 8px;
  overflow: hidden;
}

.dps-bar {
  flex: 1 1 8px;
  min-width: 4px;
  max-width: 16px;
  align-self: end;
  padding: 0;
  border: 1px solid rgba(16, 16, 14, 0.62);
  border-radius: 0;
  opacity: 0.85;
  overflow: hidden;
  display: flex;
  flex-direction: column-reverse;
  transition: opacity 0.16s ease, outline-color 0.16s ease;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
}

.bar-segment {
  display: block;
  min-height: 2px;
  width: 100%;
}

.bar-segment.segment-main,
.legend-key.segment-main::before {
  background: #d78269;
}

.bar-segment.segment-spell,
.legend-key.segment-spell::before {
  background: #77a8c4;
}

.bar-segment.segment-bane,
.legend-key.segment-bane::before {
  background: #8fa96c;
}

.bar-segment.segment-backstab,
.legend-key.segment-backstab::before {
  background: #d7aa5f;
}

.dps-bar:hover,
.dps-bar.selected {
  opacity: 1;
  outline: 1px solid var(--brass-bright);
  outline-offset: 1px;
}

.average-line {
  position: absolute;
  left: 54px;
  right: 0;
  border-top: 1px dashed rgba(214, 194, 153, 0.45);
  pointer-events: none;
}

.average-line span {
  position: absolute;
  right: 10px;
  bottom: 2px;
  color: var(--text-secondary);
  font-size: 0.72rem;
}

.empty-chart {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  color: var(--text-muted);
}
</style>
