<template>
  <section class="global-comparison">
    <div class="panel-frame">
      <header class="panel-header">
        <div class="title-group">
          <span class="title-icon" aria-hidden="true">
            <svg viewBox="0 0 40 40" width="34" height="34">
              <path d="M20 4 L24 16 L36 20 L24 24 L20 36 L16 24 L4 20 L16 16 Z" fill="#e6c168" opacity="0.9" />
              <circle cx="20" cy="20" r="3" fill="#f5d98a" />
            </svg>
          </span>
          <div>
            <div class="eyebrow">Battle Ledger</div>
            <h2>Global DPS Comparison</h2>
            <p class="subtitle">Chart how the filtered artifacts line up against one another</p>
          </div>
        </div>
        <div class="chart-controls">
          <label>
            <span>View</span>
            <select v-model="chartType">
              <option value="total">Total DPS</option>
              <option value="breakdown">DPS Breakdown</option>
              <option value="top20">Top 20 Items</option>
            </select>
          </label>
          <label>
            <span>Sort</span>
            <select v-model="sortOrder">
              <option value="desc">Highest First</option>
              <option value="asc">Lowest First</option>
            </select>
          </label>
        </div>
      </header>

    <section class="stats-cards">
      <article class="stat-card">
        <span class="stat-label">Total Items</span>
        <span class="stat-value">{{ filteredItems.length }}</span>
      </article>
      <article class="stat-card">
        <span class="stat-label">Average DPS</span>
        <span class="stat-value">{{ formatDPS(averageDPS) }}</span>
      </article>
      <article class="stat-card">
        <span class="stat-label">Max DPS</span>
        <span class="stat-value highlight">{{ formatDPS(maxDPS) }}</span>
      </article>
      <article class="stat-card">
        <span class="stat-label">Min DPS</span>
        <span class="stat-value">{{ formatDPS(minDPS) }}</span>
      </article>
    </section>

    <section class="hand-toggle">
      <span class="section-label">Hand</span>
      <div class="hand-options">
        <button
          type="button"
          :class="['hand-chip', { active: handMode === 'mh' }]"
          @click="setHandMode('mh')"
        >
          Main Hand
        </button>
        <button
          type="button"
          :class="['hand-chip', { active: handMode === 'oh' }]"
          @click="setHandMode('oh')"
        >
          Off Hand
        </button>
      </div>
    </section>

    <section class="component-controls">
      <span class="section-label">Include DPS sources</span>
      <div class="component-options">
        <button
          v-for="component in componentOptions"
          :key="component.key"
          type="button"
          :class="['component-chip', { active: isComponentActive(component.key) }]"
          @click="toggleComponent(component.key)"
        >
          <span class="color-dot" :style="{ backgroundColor: component.dotColor }"></span>
          <span
            v-if="isComponentActive(component.key)"
            class="chip-check"
            aria-hidden="true"
          >✓</span>
          {{ component.label }}
        </button>
      </div>
    </section>

    <section class="chart-section">
      <div class="chart-header">
        <h3 class="chart-title">{{ getChartTitle() }}</h3>
        <span v-if="displayedItems.length" class="item-count">
          Showing {{ displayedItems.length }} items
        </span>
      </div>
      <div class="chart-wrapper" :class="{ loading }">
        <div v-if="loading" class="chart-status">Loading comparison…</div>
        <div v-else-if="!displayedItems.length" class="chart-status">
          No items match the current filters.
        </div>
        <div v-else class="chart-scroll" ref="chartScroll">
          <div class="chart-stage" :style="{ height: chartHeight + 'px' }">
            <div
              v-for="(item, index) in displayedItems"
              :key="`anchor-${item.item_id}`"
              class="chart-anchor"
              :style="{ top: index * anchorHeight + 'px', height: anchorHeight + 'px' }"
              :data-index="index"
            ></div>
            <div class="chart-canvas-layer">
              <ChartContainer
                ref="chart"
                canvas-id="global-comparison-chart"
                :chart-data="chartData"
                :chart-options="chartOptions"
                :width="chartWidth"
                :height="chartHeight"
                :on-element-click="handleChartElementClick"
                :on-label-hover="handleChartLabelHover"
              />
            </div>
          </div>
        </div>
      </div>
    </section>

    <section v-if="chartType === 'top20' && displayedItems.length" class="top-items">
      <h3>Top Performing Items</h3>
      <div class="top-items-grid">
        <article
          v-for="(item, index) in displayedItems"
          :key="item.item_id"
          class="top-item-card"
        >
          <div class="rank-badge">#{{ index + 1 }}</div>
          <ItemIcon
            :icon="item.icon"
            :name="item.name || `Item #${item.item_id}`"
            size="sm"
            :title="item.name || `Item #${item.item_id}`"
          />
          <div class="item-info">
            <div
              class="item-name"
                :style="{ color: getTypeColor(item.itemtype) }"
                :class="{ hovered: hoveredLabelIndex === index, highlighted: shouldHighlight && isHighlightMatch(item) }"
            >
              {{ item.name || `Item #${item.item_id}` }}
            </div>
              <div class="item-stats">
                <span class="dps-value">{{ formatDPS(getHandTotal(item)) }}</span>
              <span class="item-type" :style="{ color: getTypeColor(item.itemtype) }">
                {{ getTypeName(item.itemtype) }}
              </span>
            </div>
          </div>
          <a
            :href="`https://alla.clumsysworld.com/?a=item&id=${item.item_id}`"
            target="_blank"
            rel="noopener noreferrer"
            class="link-icon"
            title="View on Allakhazam"
          >
            🔗
          </a>
        </article>
      </div>
    </section>

    </div>
  </section>
</template>

<script>
import ChartContainer from './ChartContainer.vue'
import ItemIcon from './ItemIcon.vue'

const HAND_COMPONENTS = {
  mh: [
    {
      key: 'mh',
      label: 'MH DPS',
      field: 'mh_dps',
      backgroundColor: 'rgba(197, 127, 124, 0.62)',
      borderColor: '#c57f7c',
      dotColor: '#c57f7c'
    },
    {
      key: 'spell',
      label: 'Spell DPS',
      field: 'mh_spell_dps',
      backgroundColor: 'rgba(127, 157, 197, 0.58)',
      borderColor: '#7f9dc5',
      dotColor: '#7f9dc5'
    },
    {
      key: 'bane',
      label: 'Bane DPS',
      field: 'bane_dps',
      backgroundColor: 'rgba(198, 160, 106, 0.58)',
      borderColor: '#c6a06a',
      dotColor: '#c6a06a'
    },
    {
      key: 'backstab',
      label: 'Backstab DPS',
      field: 'bs_dps',
      backgroundColor: 'rgba(153, 139, 195, 0.58)',
      borderColor: '#998bc3',
      dotColor: '#998bc3'
    }
  ],
  oh: [
    {
      key: 'oh',
      label: 'OH DPS',
      field: 'oh_dps',
      backgroundColor: 'rgba(183, 144, 100, 0.58)',
      borderColor: '#b79064',
      dotColor: '#b79064'
    },
    {
      key: 'spell',
      label: 'Spell DPS',
      field: 'oh_spell_dps',
      backgroundColor: 'rgba(124, 174, 184, 0.56)',
      borderColor: '#7caeb8',
      dotColor: '#7caeb8'
    },
    {
      key: 'bane',
      label: 'Bane DPS',
      field: 'bane_dps',
      backgroundColor: 'rgba(198, 160, 106, 0.58)',
      borderColor: '#c6a06a',
      dotColor: '#c6a06a'
    }
  ]
};

const TYPE_LABELS = {
  0: '1H Slash',
  1: '2H Slash',
  2: '1H Blunt',
  3: '2H Blunt',
  4: 'Piercing',
  5: 'Archery',
  10: 'Armor',
  14: 'Martial',
  35: '2H Pierce',
  45: 'Hand to Hand',
  51: 'Throwing'
};

const TYPE_COLORS = {
  0: '#b67d74',
  1: '#728fb6',
  2: '#84a28f',
  3: '#b6a16a',
  4: '#8d80b5',
  5: '#78aab5',
  10: '#918fc1',
  14: '#b88179',
  35: '#7d95c3',
  45: '#c08a5d',
  51: '#8ea79b'
};

export default {
  name: 'GlobalComparisonPanel',
  components: {
    ChartContainer,
    ItemIcon
  },
  props: {
    items: {
      type: Array,
      default: () => []
    },
    loading: {
      type: Boolean,
      default: false
    },
    onItemSelect: {
      type: Function,
      default: null
    },
    highlightTerm: {
      type: String,
      default: ''
    }
  },
  data() {
    return {
      chartType: 'total',
      sortOrder: 'desc',
      handMode: 'mh',
      activeComponents: HAND_COMPONENTS.mh.map(component => component.key),
      chartWidth: 1100,
      hoveredLabelIndex: null,
      activeHighlightIndex: null,
      highlightQueuePending: false,
      highlightQueueScroll: false,
      highlightQueueTarget: null
    };
  },
  computed: {
    componentOptions() {
      return HAND_COMPONENTS[this.handMode] || [];
    },
    filteredItems() {
      const items = [...this.items];
      items.sort((a, b) => {
        const diff = this.getHandTotal(a) - this.getHandTotal(b);
        return this.sortOrder === 'asc' ? diff : -diff;
      });
      return items.filter(item => {
        if (this.handMode === 'oh') {
          return (item.oh_dps ?? 0) > 0 || (item.oh_spell_dps ?? 0) > 0;
        }
        return this.getHandTotal(item) > 0;
      });
    },
    displayedItems() {
      if (this.chartType === 'top20') {
        return this.filteredItems.slice(0, 20);
      }
      return this.filteredItems;
    },
    chartHeight() {
      const rows = this.displayedItems.length || 1;
      return Math.max(rows * 40, 420);
    },
    anchorHeight() {
      const rows = this.displayedItems.length || 1;
      return this.chartHeight / rows;
    },
    maxDisplayedDps() {
      if (!this.displayedItems.length) return 0;
      return Math.max(...this.displayedItems.map(item => this.getHandTotal(item)));
    },
    averageDPS() {
      if (!this.filteredItems.length) return 0;
      const sum = this.filteredItems.reduce((acc, item) => acc + this.getHandTotal(item), 0);
      return sum / this.filteredItems.length;
    },
    maxDPS() {
      if (!this.filteredItems.length) return 0;
      return Math.max(...this.filteredItems.map(item => this.getHandTotal(item)));
    },
    minDPS() {
      if (!this.filteredItems.length) return 0;
      return Math.min(...this.filteredItems.map(item => this.getHandTotal(item)));
    },
    highlightMatches() {
      if (!this.highlightQuery) {
        return this.displayedItems.map(() => false);
      }
      return this.displayedItems.map(item => this.isHighlightMatch(item));
    },
    highlightQuery() {
      return (this.highlightTerm || '').trim().toLowerCase();
    },
    shouldHighlight() {
      return this.highlightQuery.length > 0 && this.highlightMatches.some(Boolean);
    },
    chartData() {
      const items = this.displayedItems;
      const labels = items.map(i => i.name || `Item #${i.item_id}`);

      if (!items.length) {
        return { labels, datasets: [] };
      }

      const highlightMatches = this.highlightMatches;
      const shouldHighlight = this.shouldHighlight;

      if (this.chartType === 'breakdown') {
        const datasets = this.componentOptions.map(component => {
          const active = this.isComponentActive(component.key);
          const baseColor = component.backgroundColor || this.getComponentColor(component.key, 'background');
          const highlightColor = component.highlightBackground || this.getComponentColor(component.key, 'highlightBackground');
          const dimmedColor = this.fadeColor(baseColor, 0.35);

          return {
            label: component.label,
            data: items.map(item => Math.max(item?.[component.field] ?? 0, 0)),
            backgroundColor: items.map((_, idx) => {
              if (!shouldHighlight) {
                return baseColor;
              }
              return highlightMatches[idx] ? highlightColor : dimmedColor;
            }),
            borderColor: component.borderColor,
            borderWidth: 1,
            borderRadius: 4,
            hidden: !active
          };
        });

        return { labels, datasets };
      }

      const activeSet = new Set(this.activeComponents);
      const metricsList = items.map(item => this.getComponentMetrics(item));
      const datasets = this.componentOptions.map(component => {
        const active = activeSet.has(component.key);
        const baseBackground = component.backgroundColor || this.getComponentColor(component.key, 'background');
        const highlightBackground = component.highlightBackground || this.getComponentColor(component.key, 'highlightBackground');
        const baseBorder = component.borderColor || this.getComponentColor(component.key, 'border');
        const highlightBorder = component.highlightBorder || this.getComponentColor(component.key, 'highlightBorder');
        const dimmedBackground = this.fadeColor(baseBackground, 0.3);
        const dimmedBorder = this.fadeColor(baseBorder, 0.3);

        return {
          label: component.label,
          data: metricsList.map(metrics => metrics.scaled[component.key] ?? 0),
          backgroundColor: metricsList.map((_, idx) => {
            if (shouldHighlight) {
              return highlightMatches[idx] ? highlightBackground : dimmedBackground;
            }
            return baseBackground;
          }),
          borderColor: metricsList.map((_, idx) => {
            if (shouldHighlight) {
              return highlightMatches[idx] ? highlightBorder : dimmedBorder;
            }
            return baseBorder;
          }),
          borderWidth: 1,
          borderRadius: 4,
          stack: 'total',
          hidden: !active
        };
      });

      return { labels, datasets };
    },
    chartOptions() {
      const usingStacking = this.chartType !== 'breakdown';
      const vm = this;

      return {
        indexAxis: 'y',
        plugins: {
          legend: {
            display: true,
            position: 'top',
            onClick: (event, legendItem, legend) => this.handleLegendClick(event, legendItem, legend),
            labels: {
              color: '#ece3c8',
              padding: 15,
              font: {
                size: 12,
                family: "'Cinzel', serif",
                weight: '600'
              }
            }
          },
          tooltip: {
            backgroundColor: 'rgba(7, 7, 13, 0.95)',
            titleColor: '#e6c168',
            bodyColor: '#ece3c8',
            borderColor: '#e6c168',
            borderWidth: 1,
            padding: 12,
            cornerRadius: 8,
            displayColors: true,
            callbacks: {
              label: (context) => {
                const value = this.formatDPS(context.raw);
                return `${context.dataset.label}: ${value}`;
              },
              footer: (items) => {
                if (!items.length) return '';
                const index = items[0].dataIndex;
                const item = this.displayedItems?.[index];
                if (!item) return '';
                const total = this.getDisplayTotal(item);
                return `Total DPS: ${this.formatDPS(total)}`;
              }
            }
          }
        },
        scales: {
          x: {
            stacked: usingStacking,
            grid: {
              color: 'rgba(230, 193, 104, 0.08)'
            },
            ticks: {
              color: '#b8b399',
              font: { family: "'JetBrains Mono', monospace" },
              callback: (value) => this.formatDPS(value)
            },
            beginAtZero: true,
            max: this.maxDisplayedDps || undefined
          },
          y: {
            stacked: usingStacking,
            afterFit(scale) {
              scale.width = Math.max(scale.width, vm.chartWidth < 768 ? 170 : 230);
            },
            grid: {
              color: 'rgba(230, 193, 104, 0.06)',
              display: false
            },
            ticks: {
              color(context) {
                const item = vm.displayedItems?.[context.index];
                if (!item) return '#ece3c8';
                if (context.index === vm.hoveredLabelIndex) {
                  return '#f5d98a';
                }
                if (vm.shouldHighlight) {
                  return vm.isHighlightMatch(item) ? '#f3e4bb' : 'rgba(184, 179, 153, 0.48)';
                }
                return '#ece3c8';
              },
              font(context) {
                const size = vm.chartWidth < 768 ? 11 : 12;
                if (context.index === vm.hoveredLabelIndex) {
                  return { size, weight: '700', family: "'Inter', sans-serif" };
                }
                if (vm.shouldHighlight && vm.displayedItems?.[context.index] && !vm.isHighlightMatch(vm.displayedItems[context.index])) {
                  return { size, weight: '500', family: "'Inter', sans-serif" };
                }
                return { size, weight: '600', family: "'Inter', sans-serif" };
              },
              autoSkip: false,
              maxRotation: 0,
              padding: 10,
              callback(value, index) {
                const label = this.getLabelForValue(value);
                return vm.formatChartLabel(label, index);
              }
            }
          }
        }
      };
    }
  },
  mounted() {
    this.updateChartDimensions();
    this.queueHighlight();
    window.addEventListener('resize', this.updateChartDimensions);
  },
  beforeUnmount() {
    window.removeEventListener('resize', this.updateChartDimensions);
  },
  watch: {
    items: {
      immediate: true,
      flush: 'post',
      handler() {
        this.hoveredLabelIndex = null;
        this.activeHighlightIndex = null;
        this.$nextTick(() => {
          this.updateChartDimensions();
          if (this.highlightQuery) {
            this.queueHighlight({ scroll: true });
          }
        });
      }
    },
    sortOrder: {
      flush: 'post',
      handler() {
        this.hoveredLabelIndex = null;
        this.$nextTick(() => {
          this.updateChartDimensions();
          if (this.highlightQuery) {
            this.queueHighlight({ scroll: true });
          }
        });
      }
    },
    chartType: {
      flush: 'post',
      handler() {
        this.hoveredLabelIndex = null;
        this.$nextTick(() => {
          this.updateChartDimensions();
          if (this.highlightQuery) {
            this.queueHighlight({ scroll: true });
          }
        });
      }
    },
    handMode: {
      flush: 'post',
      handler() {
        const options = HAND_COMPONENTS[this.handMode] || [];
        this.activeComponents = options.map(option => option.key);
        this.hoveredLabelIndex = null;
        this.activeHighlightIndex = null;
        this.$nextTick(() => {
          this.updateChartDimensions();
          if (this.highlightQuery) {
            this.queueHighlight({ scroll: true });
          }
        });
      }
    },
    componentOptions: {
      immediate: true,
      flush: 'post',
      handler(options) {
        const validKeys = options.map(option => option.key);
        this.activeComponents = this.activeComponents.filter(key => validKeys.includes(key));
        if (this.activeComponents.length === 0) {
          this.activeComponents = [...validKeys];
        }
        this.hoveredLabelIndex = null;
        this.activeHighlightIndex = null;
        this.$nextTick(() => {
          this.updateChartDimensions();
          if (this.highlightQuery) {
            this.queueHighlight({ scroll: true });
          }
        });
      }
    },
    highlightTerm: {
      flush: 'post',
      handler() {
        this.hoveredLabelIndex = null;
        this.activeHighlightIndex = null;
        this.queueHighlight({ scroll: true });
      }
    }
  },
  methods: {
    queueHighlight({ index = null, scroll = false } = {}) {
      if (typeof index === 'number') {
        this.highlightQueueTarget = index;
      }
      if (scroll) {
        this.highlightQueueScroll = true;
      }
      if (this.highlightQueuePending) {
        return;
      }
      this.highlightQueuePending = true;
      this.$nextTick(() => {
        requestAnimationFrame(() => {
          const target = this.highlightQueueTarget;
          const shouldScroll = this.highlightQueueScroll;
          this.highlightQueueTarget = null;
          this.highlightQueueScroll = false;
          this.highlightQueuePending = false;
          this.performHighlight({ index: target, scroll: shouldScroll });
        });
      });
    },
    performHighlight({ index = null, scroll = false } = {}) {
      const matches = this.highlightMatches;
      if (!this.highlightQuery || !matches.some(Boolean)) {
        this.clearHighlightState();
        return;
      }

      let target = typeof index === 'number' ? index : this.activeHighlightIndex;
      if (
        target == null ||
        target < 0 ||
        target >= matches.length ||
        !matches[target]
      ) {
        target = matches.findIndex(Boolean);
      }

      if (target == null || target === -1) {
        this.clearHighlightState();
        return;
      }

      if (this.activeHighlightIndex !== target) {
        this.activeHighlightIndex = target;
      }
      if (this.hoveredLabelIndex !== target) {
        this.hoveredLabelIndex = target;
      }
      if (scroll) {
        this.scrollChartToIndex(target);
      }
    },
    setHandMode(mode) {
      if (mode === this.handMode) return;
      this.handMode = mode;
    },
    handleLegendClick(event, legendItem, legend) {
      const dataset = legend.chart.data.datasets[legendItem.datasetIndex];
      if (!dataset) return;

      const component = this.componentOptions.find(option => option.label === dataset.label);
      if (component) {
        this.toggleComponent(component.key);
        return;
      }

      const meta = legend.chart.getDatasetMeta(legendItem.datasetIndex);
      meta.hidden = meta.hidden === null
        ? !legend.chart.isDatasetVisible(legendItem.datasetIndex)
        : null;
      legend.chart.update();
    },
    handleChartElementClick({ index }) {
      if (index == null) return;
      const item = this.displayedItems[index];
      if (item && this.onItemSelect) {
        this.onItemSelect(item);
      }
    },
    handleChartLabelHover(index) {
      if (this.hoveredLabelIndex === index) return;
      this.hoveredLabelIndex = index;
    },
    focusFirstHighlight() {
      const matches = this.highlightMatches;
      if (!this.highlightQuery || !matches.some(Boolean)) {
        this.clearHighlightState();
        return false;
      }
      const index = matches.findIndex(Boolean);
      if (index === -1) {
        this.clearHighlightState();
        return false;
      }
      this.queueHighlight({ index, scroll: true });
      return true;
    },
    clearHighlightState() {
      if (this.activeHighlightIndex !== null) {
        this.activeHighlightIndex = null;
      }
      if (this.hoveredLabelIndex !== null) {
        this.hoveredLabelIndex = null;
      }
    },
    scrollChartToIndex(index) {
      const scrollEl = this.$refs.chartScroll;
      if (!scrollEl) return;
      const anchor = scrollEl.querySelector(`.chart-anchor[data-index="${index}"]`);
      if (anchor) {
        const anchorTop = anchor.offsetTop;
        const anchorHeight = anchor.offsetHeight || this.anchorHeight;
        const desired = Math.max(anchorTop + anchorHeight / 2 - scrollEl.clientHeight / 2, 0);
        scrollEl.scrollTop = desired;
        if (scrollEl.scrollTo) {
          scrollEl.scrollTo({ top: desired, behavior: 'smooth' });
        }
        return;
      }
      const chart = this.$refs.chart;
      if (chart && typeof chart.getElementBounds === 'function') {
        const bounds = chart.getElementBounds(index);
        if (bounds && Number.isFinite(bounds.center)) {
          const desired = Math.max(bounds.center - scrollEl.clientHeight / 2, 0);
          scrollEl.scrollTop = desired;
          if (scrollEl.scrollTo) {
            scrollEl.scrollTo({ top: desired, behavior: 'smooth' });
          }
          return;
        }
      }

      const total = Math.max(this.displayedItems.length - 1, 1);
      const ratio = Math.max(Math.min(index / total, 1), 0);
      const target = ratio * Math.max(scrollEl.scrollHeight - scrollEl.clientHeight, 0);
      scrollEl.scrollTop = target;
      if (scrollEl.scrollTo) {
        scrollEl.scrollTo({ top: target, behavior: 'smooth' });
      }
    },
    toggleComponent(key) {
      if (this.isComponentActive(key)) {
        if (this.activeComponents.length === 1) {
          return;
        }
        this.activeComponents = this.activeComponents.filter(component => component !== key);
      } else {
        this.activeComponents = Array.from(new Set([...this.activeComponents, key]));
      }
      this.$nextTick(() => {
        this.updateChartDimensions();
      });
    },
    isComponentActive(key) {
      return this.activeComponents.includes(key);
    },
    formatDPS(value) {
      return value ? value.toFixed(1) : '0.0';
    },
    getComponentMetrics(item) {
      const result = {
        scaled: {},
        raw: {},
        rawTotal: 0,
        targetTotal: 0
      };

      if (!item) {
        return result;
      }

      const rawValues = this.componentOptions.map(component => {
        const value = Number(item?.[component.field] ?? 0);
        return Number.isFinite(value) && value > 0 ? value : 0;
      });

      const rawTotal = rawValues.reduce((sum, value) => sum + value, 0);
      let targetTotal = Number(item.total_dps ?? 0);
      if (!Number.isFinite(targetTotal) || targetTotal < 0) {
        targetTotal = 0;
      }

      if (this.handMode === 'oh') {
        if (rawTotal > targetTotal) {
          targetTotal = rawTotal;
        }
        if (targetTotal <= 0) {
          targetTotal = rawTotal;
        }
      } else {
        if (targetTotal <= 0) {
          targetTotal = rawTotal;
        }
      }

      let scaledValues = [];

      if (rawTotal > 0 && targetTotal > 0) {
        const scale = targetTotal / rawTotal;
        scaledValues = rawValues.map(value => value * scale);
      } else if (targetTotal > 0 && this.componentOptions.length > 0) {
        scaledValues = this.componentOptions.map((_, index) => (index === 0 ? targetTotal : 0));
      } else {
        scaledValues = rawValues.map(() => 0);
      }

      this.componentOptions.forEach((component, index) => {
        result.raw[component.key] = rawValues[index];
        result.scaled[component.key] = scaledValues[index];
      });

      result.rawTotal = rawTotal;
      result.targetTotal = targetTotal;
      return result;
    },
    getHandTotal(item) {
      if (!item) return 0;
      const metrics = this.getComponentMetrics(item);
      let total = 0;
      this.componentOptions.forEach(component => {
        if (this.isComponentActive(component.key)) {
          total += metrics.scaled[component.key] ?? 0;
        }
      });
      return total;
    },
    getDisplayTotal(item) {
      const metrics = this.getComponentMetrics(item);
      return metrics.targetTotal;
    },
    isHighlightMatch(item) {
      if (!this.highlightQuery || !item) return false;
      const name = String(item?.name || '').toLowerCase();
      return name.includes(this.highlightQuery);
    },
    getTypeName(typeId) {
      return TYPE_LABELS[typeId] || `Type ${typeId}`;
    },
    getTypeColor(typeId) {
      return TYPE_COLORS[typeId] || '#cdd6f4';
    },
    getHoverColor(typeId) {
      return this.mixColors(this.getTypeColor(typeId), '#ffffff', 0.35);
    },
    getComponentColor(key, variant = 'background') {
      const palette = {
        mh: {
          background: 'rgba(197, 127, 124, 0.52)',
          highlightBackground: 'rgba(197, 127, 124, 0.82)',
          border: 'rgba(197, 127, 124, 0.72)',
          highlightBorder: '#c57f7c'
        },
        spell: {
          background: 'rgba(127, 157, 197, 0.5)',
          highlightBackground: 'rgba(127, 157, 197, 0.82)',
          border: 'rgba(127, 157, 197, 0.72)',
          highlightBorder: '#7f9dc5'
        },
        bane: {
          background: 'rgba(198, 160, 106, 0.5)',
          highlightBackground: 'rgba(198, 160, 106, 0.82)',
          border: 'rgba(198, 160, 106, 0.72)',
          highlightBorder: '#c6a06a'
        },
        backstab: {
          background: 'rgba(153, 139, 195, 0.5)',
          highlightBackground: 'rgba(153, 139, 195, 0.82)',
          border: 'rgba(153, 139, 195, 0.72)',
          highlightBorder: '#998bc3'
        },
        oh: {
          background: 'rgba(183, 144, 100, 0.5)',
          highlightBackground: 'rgba(183, 144, 100, 0.82)',
          border: 'rgba(183, 144, 100, 0.72)',
          highlightBorder: '#b79064'
        }
      };

      const entry = palette[key] || palette.mh;
      if (entry && entry[variant]) {
        return entry[variant];
      }
      if (entry && entry.background) {
        return entry.background;
      }
      return '#89b4fa';
    },
    mixColors(colorA, colorB = '#ffffff', weight = 0.5) {
      const toRgb = (hex) => {
        if (!hex || typeof hex !== 'string') return null;
        let value = hex.trim();
        if (value.startsWith('#')) {
          value = value.slice(1);
        }
        if (value.length === 3) {
          value = value.split('').map((ch) => ch + ch).join('');
        }
        if (value.length !== 6) return null;
        const intValue = Number.parseInt(value, 16);
        return {
          r: (intValue >> 16) & 0xff,
          g: (intValue >> 8) & 0xff,
          b: intValue & 0xff
        };
      };

      const rgbA = toRgb(colorA);
      const rgbB = toRgb(colorB);
      if (!rgbA || !rgbB) {
        return colorA;
      }

      const mix = (channelA, channelB) => {
        return Math.round(channelA + (channelB - channelA) * weight);
      };

      const r = mix(rgbA.r, rgbB.r);
      const g = mix(rgbA.g, rgbB.g);
      const b = mix(rgbA.b, rgbB.b);

      return `rgb(${r}, ${g}, ${b})`;
    },
    fadeColor(color, factor = 0.5) {
      if (!color) return color;
      const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
      const safeFactor = clamp(factor, 0, 1);

      const rgbaMatch = color.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([0-9.]+))?\)$/i);
      if (rgbaMatch) {
        const [, r, g, b, a] = rgbaMatch;
        const alpha = a !== undefined ? parseFloat(a) : 1;
        const nextAlpha = clamp(alpha * safeFactor, 0, 1);
        return `rgba(${r}, ${g}, ${b}, ${nextAlpha})`;
      }

      if (color.startsWith('#')) {
        const normalized = color.length === 4
          ? `#${color[1]}${color[1]}${color[2]}${color[2]}${color[3]}${color[3]}`
          : color;
        const intValue = Number.parseInt(normalized.slice(1), 16);
        const r = (intValue >> 16) & 0xff;
        const g = (intValue >> 8) & 0xff;
        const b = intValue & 0xff;
        const alpha = clamp(safeFactor, 0, 1);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
      }

      return color;
    },
    getChartTitle() {
      switch (this.chartType) {
        case 'breakdown':
          return 'DPS Breakdown by Component';
        case 'top20':
          return 'Top 20 Items by Total DPS';
        default:
          return 'Total DPS Comparison';
      }
    },
    formatChartLabel(label, index) {
      const raw = String(label || '').trim();
      if (!raw) {
        return `Item #${index + 1}`;
      }

      const maxChars = this.chartWidth < 768 ? 20 : 28;
      if (raw.length <= maxChars) {
        return raw;
      }

      const words = raw.split(/\s+/);
      const lines = [];
      let current = '';

      for (const word of words) {
        const candidate = current ? `${current} ${word}` : word;
        if (candidate.length <= maxChars) {
          current = candidate;
          continue;
        }

        if (current) {
          lines.push(current);
        }

        if (lines.length === 1) {
          current = word;
        } else {
          const remaining = word.length > maxChars ? `${word.slice(0, maxChars - 1)}…` : word;
          lines.push(remaining);
          current = '';
          break;
        }
      }

      if (current && lines.length < 2) {
        lines.push(current);
      }

      if (lines.length === 0) {
        return raw.length > maxChars ? `${raw.slice(0, maxChars - 1)}…` : raw;
      }

      if (lines.length === 1) {
        return lines[0];
      }

      const second = lines[1];
      lines[1] = second.length > maxChars ? `${second.slice(0, maxChars - 1)}…` : second;
      return lines.slice(0, 2);
    },
    updateChartDimensions() {
      this.$nextTick(() => {
        const viewportWidth = window.innerWidth || 1024;
        const gutter = viewportWidth > 1280 ? 120 : 40;
        const scrollEl = this.$refs.chartScroll;
        const containerWidth = scrollEl ? scrollEl.clientWidth : 0;
        if (viewportWidth < 768) {
          const mobileBaseWidth = containerWidth || Math.max(viewportWidth - 32, 280);
          this.chartWidth = Math.max(mobileBaseWidth, 540);
          return;
        }
        const desiredWidth = Math.max(containerWidth, viewportWidth - gutter);
        const minWidth = 560;
        const maxWidth = 2000;
        this.chartWidth = Math.min(Math.max(desiredWidth, minWidth), maxWidth);
      });
    }
  }
};
</script>

<style scoped>
.global-comparison {
  position: relative;
}

.panel-frame {
  padding: 30px 34px 34px;
  background:
    radial-gradient(ellipse 700px 240px at 50% 0%, rgba(230, 193, 104, 0.08), transparent 70%),
    linear-gradient(180deg, rgba(19, 19, 37, 0.85) 0%, rgba(13, 13, 25, 0.9) 100%);
  border: 1px solid var(--line-gold);
  border-radius: var(--r-lg);
  box-shadow: var(--shadow-card);
  position: relative;
  overflow: hidden;
}

.panel-frame::before {
  content: '';
  position: absolute;
  top: 0; left: 30px; right: 30px; height: 1px;
  background: linear-gradient(90deg, transparent, var(--gold) 50%, transparent);
}

/* ===== Header ===== */
.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 20px;
  margin-bottom: 22px;
}

.title-group {
  display: flex;
  align-items: center;
  gap: 16px;
}

.title-icon {
  filter: drop-shadow(0 0 8px var(--gold-glow));
  animation: rune-pulse 4s ease-in-out infinite;
}

.title-group h2 {
  font-family: var(--font-display);
  font-size: 1.6rem;
  font-weight: 700;
  margin: 4px 0 0;
  color: var(--ink-primary);
  letter-spacing: 0.05em;
}

.eyebrow {
  font-family: var(--font-display);
  font-size: 0.7rem;
  letter-spacing: 0.4em;
  color: var(--gold);
  text-transform: uppercase;
  opacity: 0.85;
}

.subtitle {
  color: var(--ink-muted);
  font-size: 0.88rem;
  font-style: italic;
  margin-top: 4px;
}

.chart-controls {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
}

.chart-controls label {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: var(--ink-secondary);
  font-size: 0.9rem;
}

.chart-controls label > span {
  font-family: var(--font-display);
  font-size: 0.65rem;
  letter-spacing: 0.3em;
  text-transform: uppercase;
  color: var(--ink-muted);
}

.chart-controls select {
  background: rgba(7, 7, 13, 0.6);
  border: 1px solid var(--line-gold);
  border-radius: var(--r-sm);
  padding: 7px 14px;
  color: var(--ink-primary);
  font-family: var(--font-mono);
  font-size: 0.88rem;
  cursor: pointer;
}

.chart-controls select:hover {
  border-color: var(--gold);
  box-shadow: 0 0 0 2px var(--gold-faint);
}

/* ===== Stats strip ===== */
.stats-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 10px;
  margin-bottom: 20px;
}

.stat-card {
  background: rgba(7, 7, 13, 0.55);
  border-radius: var(--r-sm);
  border: 1px solid var(--line-dim);
  padding: 10px 14px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  position: relative;
  overflow: hidden;
}

.stat-card::before {
  content: '';
  position: absolute;
  left: 0; top: 0; bottom: 0;
  width: 2px;
  background: var(--gold);
  opacity: 0.35;
}

.stat-label {
  color: var(--ink-muted);
  font-family: var(--font-display);
  font-size: 0.62rem;
  letter-spacing: 0.28em;
  text-transform: uppercase;
}

.stat-value {
  font-family: var(--font-mono);
  font-size: 1.15rem;
  color: var(--ink-primary);
  font-weight: 600;
  line-height: 1.2;
}

.stat-value.highlight {
  color: var(--rune-jade);
  text-shadow: 0 0 6px rgba(143, 182, 155, 0.16);
}

/* ===== Hand toggle ===== */
.hand-toggle {
  margin-bottom: 18px;
  display: flex;
  align-items: center;
  gap: 14px;
  flex-wrap: wrap;
}

.hand-options {
  display: inline-flex;
  gap: 4px;
  background: rgba(7, 7, 13, 0.6);
  border: 1px solid var(--line-gold);
  border-radius: var(--r-pill);
  padding: 4px;
}

.hand-chip {
  background: transparent;
  border: none;
  color: var(--ink-secondary);
  padding: 7px 18px;
  border-radius: var(--r-pill);
  cursor: pointer;
  font-family: var(--font-display);
  font-size: 0.72rem;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  transition: all 0.25s ease;
}

.hand-chip:hover { color: var(--gold); }

.hand-chip.active {
  background: linear-gradient(135deg, var(--gold-deep), var(--gold));
  color: var(--bg-void);
  box-shadow: 0 0 8px var(--gold-glow);
  font-weight: 700;
}

.section-label {
  display: block;
  color: var(--ink-muted);
  font-family: var(--font-display);
  font-size: 0.68rem;
  letter-spacing: 0.3em;
  text-transform: uppercase;
  margin-bottom: 10px;
}

/* ===== Component chips ===== */
.component-controls { margin-bottom: 22px; }

.component-options {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.component-chip {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 7px 14px;
  border-radius: var(--r-pill);
  border: 1px solid var(--line-dim);
  background: rgba(7, 7, 13, 0.55);
  color: var(--ink-secondary);
  cursor: pointer;
  font-size: 0.82rem;
  font-family: var(--font-body);
  transition: all 0.25s ease;
  position: relative;
}

.component-chip:hover {
  border-color: var(--line-gold);
  color: var(--gold);
}

.component-chip.active {
  background: var(--gold-faint);
  border-color: var(--gold);
  color: var(--ink-primary);
  box-shadow: 0 0 8px var(--gold-glow);
  font-weight: 600;
}

.component-chip.active .color-dot {
  transform: scale(1.25);
  box-shadow: 0 0 6px currentColor;
}

.chip-check {
  font-size: 0.7rem;
  font-weight: 800;
  color: var(--bg-void);
  background: var(--gold);
  border-radius: 50%;
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 0 4px var(--gold-glow);
}

.color-dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  display: inline-block;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

/* ===== Chart ===== */
.chart-section {
  background: rgba(7, 7, 13, 0.55);
  border-radius: var(--r-md);
  border: 1px solid var(--line-dim);
  padding: 18px 22px;
  margin-bottom: 24px;
  position: relative;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 12px;
  margin-bottom: 14px;
}

.chart-title {
  font-family: var(--font-display);
  font-size: 1.1rem;
  color: var(--ink-primary);
  margin: 0;
  letter-spacing: 0.05em;
}

.item-count {
  color: var(--ink-muted);
  font-family: var(--font-mono);
  font-size: 0.8rem;
}

.chart-wrapper {
  position: relative;
  min-height: 420px;
}

.chart-status {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 420px;
  color: var(--ink-muted);
  font-family: var(--font-display);
  letter-spacing: 0.2em;
  text-transform: uppercase;
  font-size: 0.85rem;
}

.chart-scroll {
  max-height: 580px;
  overflow-y: auto;
  overflow-x: auto;
  padding-right: 10px;
  padding-bottom: 6px;
}

.chart-stage {
  position: relative;
  min-height: 420px;
}

.chart-anchor {
  position: absolute;
  left: 0;
  right: 0;
  pointer-events: none;
}

.chart-canvas-layer { position: absolute; inset: 0; }

.chart-scroll canvas { display: block; }

/* ===== Top items ===== */
.top-items { margin-bottom: 28px; }

.top-items h3 {
  font-family: var(--font-display);
  margin-bottom: 14px;
  color: var(--ink-primary);
  font-size: 1.1rem;
  letter-spacing: 0.05em;
}

.top-items-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 14px;
}

.top-item-card {
  display: flex;
  align-items: center;
  gap: 14px;
  background: linear-gradient(135deg, rgba(19, 19, 37, 0.85), rgba(7, 7, 13, 0.85));
  border: 1px solid var(--line-dim);
  border-radius: var(--r-sm);
  padding: 12px 16px;
  position: relative;
  transition: all 0.25s ease;
  overflow: hidden;
}

.top-item-card::before {
  content: '';
  position: absolute;
  left: 0; top: 0; bottom: 0;
  width: 3px;
  background: linear-gradient(180deg, var(--gold) 0%, transparent 120%);
  opacity: 0.8;
}

.top-item-card:hover {
  border-color: var(--line-gold);
  transform: translateY(-2px);
  box-shadow: 0 10px 26px rgba(0, 0, 0, 0.42), 0 0 10px var(--gold-glow);
}

.rank-badge {
  background: linear-gradient(135deg, var(--gold-deep), var(--gold));
  border-radius: 50%;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-display);
  font-weight: 800;
  color: var(--bg-void);
  box-shadow: 0 0 8px var(--gold-glow);
  flex-shrink: 0;
  font-size: 0.85rem;
}

.item-info { flex: 1; min-width: 0; }

.item-name {
  font-family: var(--font-display);
  font-weight: 600;
  color: var(--ink-primary);
  margin-bottom: 4px;
  letter-spacing: 0.02em;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item-name.hovered {
  text-shadow: 0 0 6px var(--gold-glow);
}

.item-name.highlighted {
  text-shadow: 0 0 8px var(--gold-glow);
  font-weight: 700;
}

.item-stats {
  display: flex;
  gap: 12px;
  color: var(--ink-muted);
  font-size: 0.82rem;
  align-items: center;
}

.dps-value {
  font-family: var(--font-mono);
  color: var(--rune-jade);
  font-weight: 600;
}

.item-type {
  font-family: var(--font-display);
  font-size: 0.7rem;
  letter-spacing: 0.15em;
  text-transform: uppercase;
}

.link-icon {
  font-size: 1.1rem;
  text-decoration: none;
  opacity: 0.55;
  transition: all 0.2s;
}

.link-icon:hover { opacity: 1; filter: drop-shadow(0 0 4px var(--gold)); }

@media (max-width: 1200px) {
  .panel-frame { padding: 24px 22px; }
  .chart-scroll { max-height: 480px; }
}

@media (max-width: 768px) {
  .panel-frame { padding: 22px 16px 20px; }
  .panel-header { flex-direction: column; align-items: flex-start; }
  .title-group { align-items: flex-start; }
  .eyebrow {
    letter-spacing: 0.28em;
  }
  .title-group h2 {
    font-size: 1.2rem;
    letter-spacing: 0.04em;
  }
  .subtitle {
    font-size: 0.82rem;
  }
  .chart-controls {
    width: 100%;
    display: grid;
    gap: 10px;
  }
  .chart-controls label {
    width: 100%;
    justify-content: space-between;
  }
  .chart-controls select {
    flex: 1;
    min-width: 0;
  }
  .stats-cards { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .hand-toggle,
  .component-controls {
    align-items: flex-start;
  }
  .section-label {
    width: 100%;
    margin-bottom: 6px;
  }
  .hand-options {
    width: 100%;
  }
  .hand-chip {
    flex: 1;
    text-align: center;
  }
  .component-options { gap: 8px; }
  .chart-section {
    padding: 14px 14px 16px;
  }
  .chart-header {
    flex-direction: column;
    align-items: flex-start;
  }
  .chart-wrapper,
  .chart-status {
    min-height: 320px;
    height: auto;
  }
  .chart-scroll {
    max-height: 360px;
    padding-right: 0;
  }
  .top-items-grid { grid-template-columns: 1fr; }
}

@media (max-width: 520px) {
  .stats-cards {
    grid-template-columns: 1fr;
  }
}
</style>
