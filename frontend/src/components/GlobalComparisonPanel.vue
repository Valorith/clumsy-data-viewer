<template>
  <section class="global-comparison">
    <header class="panel-header">
      <div class="title-group">
        <span class="title-icon">📊</span>
        <div>
          <h2>Global DPS Comparison</h2>
          <p class="subtitle">Visualise how filtered items stack up overall</p>
        </div>
      </div>
      <div class="chart-controls">
        <label>
          View
          <select v-model="chartType">
            <option value="total">Total DPS</option>
            <option value="breakdown">DPS Breakdown</option>
            <option value="top20">Top 20 Items</option>
          </select>
        </label>
        <label>
          Sort
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

    <section v-if="filteredItems.length" class="distribution">
      <div class="distribution-header">
        <h3>DPS Distribution</h3>
        <span class="distribution-subtitle">Count of filtered items per DPS band</span>
      </div>
      <div class="distribution-chart">
        <div class="distribution-bars">
          <div
            v-for="bucket in distributionBars"
            :key="bucket.range"
            class="dist-bar-wrapper"
          >
            <div class="dist-bar-fill">
              <div
                class="dist-bar"
                :style="{ height: bucket.height + '%' }"
              ></div>
            </div>
            <div class="dist-label">{{ bucket.range }}</div>
            <div class="dist-count">{{ bucket.count }}</div>
          </div>
        </div>
      </div>
    </section>
  </section>
</template>

<script>
import ChartContainer from './ChartContainer.vue'

const HAND_COMPONENTS = {
  mh: [
    {
      key: 'mh',
      label: 'MH DPS',
      field: 'mh_dps',
      backgroundColor: 'rgba(243, 139, 168, 0.7)',
      borderColor: '#f38ba8',
      dotColor: '#f38ba8'
    },
    {
      key: 'spell',
      label: 'Spell DPS',
      field: 'mh_spell_dps',
      backgroundColor: 'rgba(166, 227, 161, 0.7)',
      borderColor: '#a6e3a1',
      dotColor: '#a6e3a1'
    },
    {
      key: 'bane',
      label: 'Bane DPS',
      field: 'bane_dps',
      backgroundColor: 'rgba(250, 179, 135, 0.7)',
      borderColor: '#fab387',
      dotColor: '#fab387'
    },
    {
      key: 'backstab',
      label: 'Backstab DPS',
      field: 'bs_dps',
      backgroundColor: 'rgba(180, 190, 254, 0.7)',
      borderColor: '#b4befe',
      dotColor: '#b4befe'
    }
  ],
  oh: [
    {
      key: 'oh',
      label: 'OH DPS',
      field: 'oh_dps',
      backgroundColor: 'rgba(243, 139, 168, 0.7)',
      borderColor: '#f38ba8',
      dotColor: '#f38ba8'
    },
    {
      key: 'spell',
      label: 'Spell DPS',
      field: 'oh_spell_dps',
      backgroundColor: 'rgba(166, 227, 161, 0.7)',
      borderColor: '#a6e3a1',
      dotColor: '#a6e3a1'
    },
    {
      key: 'bane',
      label: 'Bane DPS',
      field: 'bane_dps',
      backgroundColor: 'rgba(250, 179, 135, 0.7)',
      borderColor: '#fab387',
      dotColor: '#fab387'
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
  0: '#FF6B6B',
  1: '#4ECDC4',
  2: '#95E77E',
  3: '#FFD93D',
  4: '#6C5CE7',
  5: '#FD79A8',
  10: '#A29BFE',
  14: '#FF7675',
  35: '#74B9FF',
  45: '#FF7675',
  51: '#B9FBC0'
};

export default {
  name: 'GlobalComparisonPanel',
  components: {
    ChartContainer
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
      return Math.max(rows * 34, 420);
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
    distributionBuckets() {
      if (!this.filteredItems.length) return [];
      const bucketSize = 10;
      const maxValue = Math.ceil(this.maxDPS / bucketSize) * bucketSize || bucketSize;
      const buckets = [];

      for (let i = 0; i <= maxValue; i += bucketSize) {
        const count = this.filteredItems.filter(item => {
          const value = this.getHandTotal(item);
          return value >= i && value < i + bucketSize;
        }).length;

        if (count > 0 || (i === 0 && this.filteredItems.length > 0)) {
          buckets.push({
            range: `${i}-${i + bucketSize}`,
            count,
            percentage: Math.round((count / this.filteredItems.length) * 100)
          });
        }
      }

      return buckets.slice(0, 12);
    },
    distributionBars() {
      const buckets = this.distributionBuckets;
      if (!buckets.length) return [];

      const maxCount = Math.max(...buckets.map(bucket => bucket.count));
      const safeMax = maxCount > 0 ? maxCount : 1;
      const minHeight = buckets.length > 1 ? 12 : 35;

      return buckets.map(bucket => {
        const ratio = bucket.count / safeMax;
        const height = Math.max(ratio * 100, bucket.count > 0 ? minHeight : 0);
        return {
          ...bucket,
          height: Math.min(height, 100)
        };
      });
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
              color: '#cdd6f4',
              padding: 15,
              font: {
                size: 12
              }
            }
          },
          tooltip: {
            backgroundColor: 'rgba(30, 30, 46, 0.95)',
            titleColor: '#cdd6f4',
            bodyColor: '#a6adc8',
            borderColor: '#89b4fa',
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
              color: 'rgba(69, 71, 90, 0.3)'
            },
            ticks: {
              color: '#a6adc8',
              callback: (value) => this.formatDPS(value)
            },
            beginAtZero: true,
            max: this.maxDisplayedDps || undefined
          },
          y: {
            stacked: usingStacking,
            grid: {
              color: 'rgba(69, 71, 90, 0.25)',
              display: false
            },
            ticks: {
              color(context) {
                const item = vm.displayedItems?.[context.index];
                if (!item) return '#cdd6f4';
                const base = vm.getTypeColor(item.itemtype);
                if (context.index === vm.hoveredLabelIndex) {
                  return vm.getHoverColor(item.itemtype);
                }
                if (vm.shouldHighlight) {
                  return vm.isHighlightMatch(item) ? vm.getHoverColor(item.itemtype) : vm.fadeColor(base, 0.35);
                }
                return base;
              },
              font(context) {
                const size = 11;
                if (context.index === vm.hoveredLabelIndex) {
                  return { size, weight: '700' };
                }
                if (vm.shouldHighlight && vm.displayedItems?.[context.index] && !vm.isHighlightMatch(vm.displayedItems[context.index])) {
                  return { size, weight: '400' };
                }
                return { size, weight: '500' };
              },
              autoSkip: false,
              maxRotation: 0,
              callback(value, index) {
                const label = this.getLabelForValue(value);
                return label.length > 30 ? `${label.substring(0, 30)}…` : label;
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
          background: 'rgba(243, 139, 168, 0.5)',
          highlightBackground: 'rgba(243, 139, 168, 0.85)',
          border: 'rgba(243, 139, 168, 0.8)',
          highlightBorder: '#f38ba8'
        },
        spell: {
          background: 'rgba(166, 227, 161, 0.5)',
          highlightBackground: 'rgba(166, 227, 161, 0.85)',
          border: 'rgba(166, 227, 161, 0.8)',
          highlightBorder: '#a6e3a1'
        },
        bane: {
          background: 'rgba(250, 179, 135, 0.5)',
          highlightBackground: 'rgba(250, 179, 135, 0.85)',
          border: 'rgba(250, 179, 135, 0.8)',
          highlightBorder: '#fab387'
        },
        backstab: {
          background: 'rgba(180, 190, 254, 0.5)',
          highlightBackground: 'rgba(180, 190, 254, 0.85)',
          border: 'rgba(180, 190, 254, 0.8)',
          highlightBorder: '#b4befe'
        },
        oh: {
          background: 'rgba(243, 139, 168, 0.5)',
          highlightBackground: 'rgba(243, 139, 168, 0.85)',
          border: 'rgba(243, 139, 168, 0.8)',
          highlightBorder: '#f38ba8'
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
    updateChartDimensions() {
      this.$nextTick(() => {
        const viewportWidth = window.innerWidth || 1024;
        const gutter = viewportWidth > 1280 ? 120 : 40;
        const scrollEl = this.$refs.chartScroll;
        const containerWidth = scrollEl ? scrollEl.clientWidth : 0;
        const desiredWidth = Math.max(containerWidth, viewportWidth - gutter);
        const minWidth = 420;
        const maxWidth = 2000;
        this.chartWidth = Math.min(Math.max(desiredWidth, minWidth), maxWidth);
      });
    }
  }
};
</script>

<style scoped>
.global-comparison {
  margin: 32px 0 36px;
  padding: 30px 34px;
  background: linear-gradient(140deg, rgba(30, 30, 46, 0.95) 0%, rgba(24, 24, 37, 0.95) 100%);
  border-radius: 20px;
  border: 1px solid rgba(137, 180, 250, 0.25);
  box-shadow: 0 25px 60px rgba(10, 10, 30, 0.45);
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 22px;
}

.title-group {
  display: flex;
  align-items: center;
  gap: 14px;
}

.title-group h2 {
  font-size: 1.9rem;
  margin: 0;
  color: #cdd6f4;
}

.title-icon {
  font-size: 2.2rem;
}

.subtitle {
  color: #a6adc8;
  font-size: 0.95rem;
  margin-top: 4px;
}

.chart-controls {
  display: flex;
  gap: 12px;
  align-items: center;
}

.chart-controls label {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #cdd6f4;
  font-size: 0.95rem;
}

.chart-controls select {
  background: rgba(49, 50, 68, 0.6);
  border: 1px solid rgba(69, 71, 90, 0.6);
  border-radius: 8px;
  padding: 6px 12px;
  color: #cdd6f4;
  font-size: 0.95rem;
}

.stats-cards {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
  align-items: center;
}

.stat-card {
  background: rgba(49, 50, 68, 0.3);
  border-radius: 8px;
  border: 1px solid rgba(69, 71, 90, 0.35);
  padding: 6px 10px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 110px;
}

.stat-label {
  color: #a6adc8;
  font-size: 0.68rem;
  text-transform: uppercase;
  letter-spacing: 0.45px;
}

.stat-value {
  font-size: 1.1rem;
  color: #cdd6f4;
  font-weight: 600;
  line-height: 1.2;
}

.stat-value.highlight {
  color: #a6e3a1;
}

.component-controls {
  margin-bottom: 24px;
}

.hand-toggle {
  margin-bottom: 18px;
}

.hand-options {
  display: inline-flex;
  gap: 10px;
  background: rgba(49, 50, 68, 0.4);
  border: 1px solid rgba(69, 71, 90, 0.6);
  border-radius: 999px;
  padding: 4px;
}

.hand-chip {
  background: transparent;
  border: none;
  color: #cdd6f4;
  padding: 8px 18px;
  border-radius: 999px;
  cursor: pointer;
  font-size: 0.95rem;
  transition: all 0.2s ease;
}

.hand-chip.active {
  background: rgba(137, 180, 250, 0.25);
  color: #b4befe;
  box-shadow: 0 0 12px rgba(137, 180, 250, 0.25);
}

.section-label {
  display: block;
  color: #a6adc8;
  font-size: 0.9rem;
  margin-bottom: 10px;
}

.component-options {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.component-chip {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  border-radius: 999px;
  border: 1px solid rgba(69, 71, 90, 0.6);
  background: rgba(49, 50, 68, 0.5);
  color: #cdd6f4;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s ease;
  position: relative;
}

.component-chip.active {
  background: linear-gradient(135deg, rgba(137, 180, 250, 0.35) 0%, rgba(76, 131, 201, 0.35) 100%);
  border-color: rgba(137, 180, 250, 0.85);
  color: #dce5ff;
  box-shadow: 0 6px 18px rgba(137, 180, 250, 0.35);
  transform: translateY(-2px);
  font-weight: 600;
}

.component-chip.active .color-dot {
  transform: scale(1.25);
  box-shadow: 0 0 10px currentColor;
}

.component-chip:hover {
  border-color: rgba(137, 180, 250, 0.6);
  color: #ced8ff;
}

.component-chip:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.chip-check {
  font-size: 0.9rem;
  font-weight: 700;
  color: #1e2235;
  background: rgba(204, 208, 255, 0.9);
  border-radius: 50%;
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 0 8px rgba(204, 208, 255, 0.6);
}

.color-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  display: inline-block;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.chart-section {
  background: rgba(17, 17, 27, 0.65);
  border-radius: 16px;
  border: 1px solid rgba(69, 71, 90, 0.6);
  padding: 20px 24px;
  margin-bottom: 28px;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.chart-title {
  font-size: 1.3rem;
  color: #cdd6f4;
  margin: 0;
}

.item-count {
  color: #a6adc8;
  font-size: 0.9rem;
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
  color: #a6adc8;
  font-size: 1rem;
}

.chart-scroll {
  max-height: 580px;
  overflow-y: auto;
  overflow-x: hidden;
  padding-right: 12px;
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

.chart-canvas-layer {
  position: absolute;
  inset: 0;
}

.chart-scroll canvas {
  display: block;
}

.top-items {
  margin-bottom: 32px;
}

.top-items h3 {
  margin-bottom: 14px;
  color: #cdd6f4;
}

.top-items-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 16px;
}

.top-item-card {
  display: flex;
  align-items: center;
  gap: 14px;
  background: rgba(49, 50, 68, 0.6);
  border: 1px solid rgba(69, 71, 90, 0.5);
  border-radius: 12px;
  padding: 14px 18px;
}

.rank-badge {
  background: rgba(137, 180, 250, 0.3);
  border-radius: 50%;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  color: #b4befe;
}

.item-info {
  flex: 1;
}

.item-name {
  font-weight: 600;
  color: #cdd6f4;
  margin-bottom: 4px;
}

.item-name.hovered {
  text-shadow: 0 0 8px rgba(137, 180, 250, 0.45);
}

.item-name.highlighted {
  text-shadow: 0 0 10px rgba(137, 180, 250, 0.4);
  font-weight: 700;
}

.item-stats {
  display: flex;
  gap: 12px;
  color: #a6adc8;
  font-size: 0.9rem;
}

.link-icon {
  font-size: 1.2rem;
  text-decoration: none;
}

.distribution {
  margin-top: 28px;
}

.distribution-header {
  display: flex;
  align-items: baseline;
  gap: 12px;
  margin-bottom: 14px;
}

.distribution h3 {
  color: #cdd6f4;
  margin: 0;
}

.distribution-subtitle {
  color: #a6adc8;
  font-size: 0.85rem;
}

.distribution-chart {
  background: rgba(17, 17, 27, 0.55);
  border: 1px solid rgba(69, 71, 90, 0.6);
  border-radius: 14px;
  padding: 18px 20px 16px;
}

.distribution-bars {
  display: flex;
  gap: 12px;
  align-items: flex-end;
  overflow-x: auto;
  padding-bottom: 4px;
}

.dist-bar-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  min-width: 64px;
}

.dist-bar-fill {
  position: relative;
  width: 100%;
  height: 140px;
  background: linear-gradient(180deg, rgba(137, 180, 250, 0.12), transparent);
  border-radius: 10px;
  border: 1px solid rgba(137, 180, 250, 0.18);
  display: flex;
  align-items: flex-end;
  overflow: hidden;
}

.dist-bar {
  width: 100%;
  background: linear-gradient(180deg, rgba(137, 180, 250, 0.85) 0%, rgba(137, 180, 250, 0.45) 100%);
  border-radius: 8px 8px 2px 2px;
  box-shadow: 0 8px 18px rgba(137, 180, 250, 0.25);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.dist-bar-wrapper:hover .dist-bar {
  transform: translateY(-4px);
  box-shadow: 0 12px 22px rgba(137, 180, 250, 0.35);
}

.dist-label {
  color: #a6adc8;
  font-size: 0.8rem;
}

.dist-count {
  color: #cdd6f4;
  font-size: 0.8rem;
  font-weight: 600;
}

@media (max-width: 1200px) {
  .global-comparison {
    padding: 24px 22px;
  }

  .chart-scroll {
    max-height: 480px;
  }
}

@media (max-width: 768px) {
  .panel-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .chart-controls {
    width: 100%;
    justify-content: flex-start;
  }

  .component-options {
    gap: 8px;
  }
}
</style>
