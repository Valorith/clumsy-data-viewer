<template>
  <transition name="modal">
    <div v-if="isOpen" class="modal-overlay" @click.self="close">
      <div class="modal-container">
        <div class="modal-header">
          <h2 class="modal-title">
            <span class="item-icon">⚔</span>
            {{ item.name || `Item #${item.item_id}` }}
          </h2>
          <button @click="close" class="close-btn">✕</button>
        </div>

        <div class="modal-body">
          <div class="item-stats-summary">
            <div class="stat-badge">
              <span class="stat-label">Total DPS</span>
              <span class="stat-value highlight">{{ formatDPS(displayTotalDps) }}</span>
            </div>
            <div
              v-for="comp in mainHandDisplayComponents"
              :key="comp.key"
              class="stat-badge"
              :class="comp.badgeClass"
              :title="comp.tooltip"
            >
              <span class="stat-label">{{ comp.label }}</span>
              <span class="stat-value">{{ formatDPS(comp.value) }}</span>
            </div>
          </div>

          <div
            v-if="offHandDisplayComponents.length"
            class="item-stats-summary secondary-summary"
          >
            <div
              v-for="offComp in offHandDisplayComponents"
              :key="`off-${offComp.key}`"
              class="stat-badge"
              :class="offComp.badgeClass"
              :title="offComp.tooltip"
            >
              <span class="stat-label">{{ offComp.label }}</span>
              <span class="stat-value">{{ formatDPS(offComp.value) }}</span>
            </div>
          </div>

          <div class="chart-container">
            <h3 class="chart-title">DPS Comparison with Similar Items</h3>
            <div class="chart-fixed-container">
              <ChartContainer
                v-if="isOpen && item && item.item_id"
                :canvas-id="`item-chart-${item.item_id}`"
                :chart-data="chartData"
                :chart-options="chartOptions"
                :width="800"
                :height="250"
              />
            </div>
          </div>

          <div class="percentile-info">
            <div class="percentile-card">
              <div class="percentile-value">{{ getPercentile() }}%</div>
              <div class="percentile-label">Percentile Rank</div>
              <div class="percentile-bar">
                <div class="percentile-fill" :style="{ width: getPercentile() + '%' }"></div>
              </div>
            </div>
            <div class="comparison-text">
              This item performs better than <strong>{{ getPercentile() }}%</strong> of all parsed items
            </div>
          </div>

          <div class="item-details-grid">
            <div class="detail-section">
              <h4>Weapon Stats</h4>
              <div class="detail-row" v-if="item.damage">
                <span>Damage:</span>
                <strong>{{ item.damage }}</strong>
              </div>
              <div class="detail-row" v-if="item.delay">
                <span>Delay:</span>
                <strong>{{ item.delay }}</strong>
              </div>
              <div class="detail-row" v-if="item.ac">
                <span>AC:</span>
                <strong>{{ item.ac }}</strong>
              </div>
            </div>

            <div class="detail-section">
              <h4>Requirements</h4>
              <div class="detail-row" v-if="item.reqlevel">
                <span>Required Level:</span>
                <strong>{{ item.reqlevel }}</strong>
              </div>
              <div class="detail-row" v-if="item.classes">
                <span>Classes:</span>
                <strong>{{ getClassNames(item.classes) }}</strong>
              </div>
            </div>
          </div>

          <div class="action-buttons">
            <a 
              :href="`https://alla.clumsysworld.com/?a=item&id=${item.item_id}`"
              target="_blank"
              rel="noopener noreferrer"
              class="btn-primary"
            >
              View on Allakhazam →
            </a>
            <button @click="close" class="btn-secondary">Close</button>
          </div>
        </div>
      </div>
    </div>
  </transition>
</template>

<script>
import ChartContainer from './ChartContainer.vue'
import { formatDPS, getClassNames } from '../utils/formatters'

const MAIN_HAND_COMPONENTS = [
  {
    key: 'mh',
    field: 'mh_dps',
    label: 'Main Hand DPS',
    backgroundColor: 'rgba(243, 139, 168, 0.5)',
    highlightBackground: 'rgba(243, 139, 168, 0.85)',
    borderColor: 'rgba(243, 139, 168, 0.8)',
    highlightBorder: '#f38ba8'
  },
  {
    key: 'spell',
    field: 'mh_spell_dps',
    label: 'Spell DPS',
    backgroundColor: 'rgba(166, 227, 161, 0.5)',
    highlightBackground: 'rgba(166, 227, 161, 0.85)',
    borderColor: 'rgba(166, 227, 161, 0.8)',
    highlightBorder: '#a6e3a1'
  },
  {
    key: 'bane',
    field: 'bane_dps',
    label: 'Bane DPS',
    badgeClass: 'bane',
    backgroundColor: 'rgba(250, 179, 135, 0.5)',
    highlightBackground: 'rgba(250, 179, 135, 0.85)',
    borderColor: 'rgba(250, 179, 135, 0.8)',
    highlightBorder: '#fab387'
  },
  {
    key: 'backstab',
    field: 'bs_dps',
    label: 'Backstab DPS',
    badgeClass: 'backstab',
    backgroundColor: 'rgba(180, 190, 254, 0.5)',
    highlightBackground: 'rgba(180, 190, 254, 0.85)',
    borderColor: 'rgba(180, 190, 254, 0.8)',
    highlightBorder: '#b4befe'
  }
].filter(component => component && component.key && component.field);

const OFF_HAND_COMPONENTS = [
  {
    key: 'oh',
    field: 'oh_dps',
    label: 'OH DPS',
    backgroundColor: 'rgba(243, 139, 168, 0.5)',
    highlightBackground: 'rgba(243, 139, 168, 0.85)',
    borderColor: 'rgba(243, 139, 168, 0.8)',
    highlightBorder: '#f38ba8'
  },
  {
    key: 'spell',
    field: 'oh_spell_dps',
    label: 'Spell DPS',
    backgroundColor: 'rgba(166, 227, 161, 0.5)',
    highlightBackground: 'rgba(166, 227, 161, 0.85)',
    borderColor: 'rgba(166, 227, 161, 0.8)',
    highlightBorder: '#a6e3a1'
  },
  {
    key: 'bane',
    field: 'bane_dps',
    label: 'Bane DPS',
    badgeClass: 'bane',
    backgroundColor: 'rgba(250, 179, 135, 0.5)',
    highlightBackground: 'rgba(250, 179, 135, 0.85)',
    borderColor: 'rgba(250, 179, 135, 0.8)',
    highlightBorder: '#fab387'
  }
].filter(component => component && component.key && component.field);

export default {
  name: 'ItemDetailModal',
  components: {
    ChartContainer
  },
  props: {
    isOpen: {
      type: Boolean,
      default: false
    },
    item: {
      type: Object,
      default: () => ({})
    },
    allItems: {
      type: Array,
      default: () => []
    }
  },
  emits: ['close'],
  computed: {
    mainHandComponents() {
      return MAIN_HAND_COMPONENTS.filter(component => component && component.key && component.field);
    },
    offHandComponents() {
      return OFF_HAND_COMPONENTS.filter(component => component && component.key && component.field);
    },
    componentMetrics() {
      return {
        main: this.computeItemMetrics(this.item, this.mainHandComponents, { useOffHandLogic: false }),
        off: this.computeItemMetrics(this.item, this.offHandComponents, { useOffHandLogic: true })
      };
    },
    displayTotalDps() {
      return this.componentMetrics.main.targetTotal;
    },
    mainHandDisplayComponents() {
      return this.mainHandComponents.map(component => {
        const value = this.componentValue('main', component.key);
        return {
          ...component,
          value,
          tooltip: this.componentTooltip('main', component.key)
        };
      }).filter(component => component.value > 0.0001);
    },
    offHandDisplayComponents() {
      return this.offHandComponents.map(component => {
        const value = this.componentValue('off', component.key);
        return {
          ...component,
          value,
          tooltip: this.componentTooltip('off', component.key)
        };
      }).filter(component => component.value > 0.0001);
    },
    chartData() {
      const similarItems = this.getSimilarItems();
      const labels = similarItems.map(i => i.name || `Item #${i.item_id}`);
      const currentItemIndex = similarItems.findIndex(i => i.item_id === this.item.item_id);
      const metricsList = similarItems.map(item =>
        this.computeItemMetrics(item, this.mainHandComponents, { useOffHandLogic: false })
      );
      const isCurrentIndex = (idx) => idx === currentItemIndex;
      const withHighlight = (defaultColor, highlightColor) =>
        similarItems.map((_, idx) => (isCurrentIndex(idx) ? highlightColor : defaultColor));

      const datasets = this.mainHandComponents.map(component => {
        const values = metricsList.map(metrics => metrics.scaled[component.key] ?? 0);
        return {
          label: component.label,
          data: values,
          backgroundColor: withHighlight(
            component.backgroundColor || this.getComponentColor(component.key, 'background'),
            component.highlightBackground || this.getComponentColor(component.key, 'highlightBackground')
          ),
          borderColor: withHighlight(
            component.borderColor || this.getComponentColor(component.key, 'border'),
            component.highlightBorder || this.getComponentColor(component.key, 'highlightBorder')
          ),
          borderWidth: withHighlight(1, 2),
          borderRadius: 6,
          stack: 'dps'
        };
      }).filter(dataset => dataset.data.some(value => value > 0.0001));

      return {
        labels,
        datasets
      };
    },
    chartOptions() {
      return {
        interaction: {
          mode: 'index',
          intersect: false
        },
        plugins: {
          legend: {
            display: true,
            position: 'top',
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
                return `${context.dataset.label}: ${this.formatDPS(context.raw)}`;
              },
              footer: (tooltipItems) => {
                const total = tooltipItems.reduce((sum, item) => {
                  const value = typeof item.raw === 'number' ? item.raw : 0;
                  return sum + value;
                }, 0);
                return `Total DPS: ${this.formatDPS(total)}`;
              }
            }
          }
        },
        scales: {
          x: {
            grid: {
              color: 'rgba(69, 71, 90, 0.3)',
              display: true
            },
            ticks: {
              color: '#a6adc8',
              maxRotation: 45,
              minRotation: 0
            },
            stacked: true
          },
          y: {
            grid: {
              color: 'rgba(69, 71, 90, 0.3)'
            },
            ticks: {
              color: '#a6adc8',
              callback: (value) => this.formatDPS(value)
            },
            beginAtZero: true,
            stacked: true
          }
        }
      };
    }
  },
  methods: {
    formatDPS,
    getClassNames,
    componentTooltip(hand, key) {
      const metrics = this.componentMetrics?.[hand];
      if (!metrics || !key) return '';

      const scaled = metrics.scaled?.[key] ?? 0;
      const raw = metrics.raw?.[key] ?? 0;

      if (Math.abs(scaled - raw) < 0.01) {
        return `Raw DPS: ${this.formatDPS(raw)}`;
      }

      return `Scaled DPS: ${this.formatDPS(scaled)} (Raw: ${this.formatDPS(raw)})`;
    },
    componentValue(hand, key) {
      const metrics = this.componentMetrics?.[hand];
      if (!metrics || !key) return 0;
      return metrics.scaled?.[key] ?? 0;
    },
    computeItemMetrics(item, components, { useOffHandLogic = false } = {}) {
      const safeComponents = Array.isArray(components)
        ? components.filter(component => component && component.key && component.field)
        : [];

      const rawValues = safeComponents.map(component => {
        const value = Number(item?.[component.field] ?? 0);
        return Number.isFinite(value) && value > 0 ? value : 0;
      });

      const rawTotal = rawValues.reduce((sum, value) => sum + value, 0);
      let targetTotal = Number(item?.total_dps ?? 0);

      if (!Number.isFinite(targetTotal) || targetTotal < 0) {
        targetTotal = 0;
      }

      if (useOffHandLogic) {
        if (rawTotal > targetTotal || targetTotal <= 0) {
          targetTotal = rawTotal;
        }
      } else if (targetTotal <= 0) {
        targetTotal = rawTotal;
      }

      let scaledValues;
      if (rawTotal > 0 && targetTotal > 0) {
        const scale = targetTotal / rawTotal;
        scaledValues = rawValues.map(value => value * scale);
      } else if (targetTotal > 0 && safeComponents.length > 0) {
        scaledValues = safeComponents.map((_, index) => (index === 0 ? targetTotal : 0));
      } else {
        scaledValues = rawValues.map(() => 0);
      }

      const scaledMap = {};
      const rawMap = {};
      safeComponents.forEach((component, index) => {
        scaledMap[component.key] = scaledValues[index];
        rawMap[component.key] = rawValues[index];
      });

      return {
        scaled: {
          ...scaledMap,
          total: scaledValues.reduce((sum, value) => sum + value, 0)
        },
        raw: {
          ...rawMap,
          total: rawValues.reduce((sum, value) => sum + value, 0)
        },
        rawTotal,
        targetTotal
      };
    },
    getComponentColor(key, variant) {
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

      const entry = palette[key] || {};
      return entry[variant] || entry.background || '#89b4fa';
    },
    close() {
      this.$emit('close');
    },
    getSimilarItems() {
      if (!this.item || !this.item.total_dps) return [];
      const targetDps = this.item.total_dps;
      const minDps = targetDps * 0.5;
      const maxDps = targetDps * 1.5;
      
      let similar = this.allItems.filter(i => 
        (i.itemtype === this.item.itemtype || 
         (i.total_dps >= minDps && i.total_dps <= maxDps))
      );
      
      similar = similar.sort((a, b) => a.total_dps - b.total_dps);
      
      if (!similar.find(i => i.item_id === this.item.item_id)) {
        similar.push(this.item);
        similar.sort((a, b) => a.total_dps - b.total_dps);
      }
      
      if (similar.length > 10) {
        const currentIndex = similar.findIndex(i => i.item_id === this.item.item_id);
        const start = Math.max(0, currentIndex - 4);
        const end = Math.min(similar.length, start + 10);
        similar = similar.slice(start, end);
      }
      
      return similar;
    },
    getPercentile() {
      if (!this.allItems.length || !this.item || !this.item.total_dps) return 0;
      const lowerCount = this.allItems.filter(i => i.total_dps < this.item.total_dps).length;
      return Math.round((lowerCount / this.allItems.length) * 100);
    }
  },
  watch: {
    isOpen(val) {
      document.body.style.overflow = val ? 'hidden' : '';
    }
  }
};
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.modal-container {
  background: linear-gradient(135deg, #1e1e2e 0%, #2a2a3e 100%);
  border-radius: 16px;
  max-width: 900px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5);
  border: 1px solid rgba(137, 180, 250, 0.2);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px;
  border-bottom: 1px solid rgba(69, 71, 90, 0.5);
  background: rgba(49, 50, 68, 0.3);
}

.modal-title {
  color: #cdd6f4;
  font-size: 1.8rem;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 12px;
}

.item-icon {
  font-size: 2rem;
  opacity: 0.9;
}

.close-btn {
  background: none;
  border: none;
  color: #f38ba8;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  transition: all 0.2s;
}

.close-btn:hover {
  background: rgba(243, 139, 168, 0.2);
}

.modal-body {
  padding: 24px;
}

.item-stats-summary {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}

.item-stats-summary.secondary-summary {
  margin-top: 8px;
}

.item-stats-summary.secondary-summary .stat-badge {
  background: rgba(49, 50, 68, 0.45);
  border-color: rgba(69, 71, 90, 0.5);
}

.stat-badge {
  background: rgba(49, 50, 68, 0.6);
  border: 1px solid rgba(69, 71, 90, 0.5);
  border-radius: 12px;
  padding: 12px 20px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-badge.bane {
  border-color: rgba(243, 139, 168, 0.5);
  background: rgba(243, 139, 168, 0.1);
}

.stat-badge.backstab {
  border-color: rgba(250, 179, 135, 0.5);
  background: rgba(250, 179, 135, 0.1);
}

.stat-label {
  color: #a6adc8;
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.stat-value {
  color: #cdd6f4;
  font-size: 1.4rem;
  font-weight: 600;
}

.stat-value.highlight {
  color: #a6e3a1;
}

.chart-container {
  background: rgba(17, 17, 27, 0.5);
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 24px;
}

.chart-fixed-container {
  width: 100%;
  height: 250px;
  position: relative;
  overflow: hidden;
  display: flex;
  justify-content: center;
  align-items: center;
}

.chart-fixed-container canvas {
  position: absolute !important;
  max-width: 100%;
}

.chart-title {
  color: #cdd6f4;
  font-size: 1.2rem;
  margin: 0 0 20px 0;
  text-align: center;
}

.percentile-info {
  display: flex;
  gap: 20px;
  align-items: center;
  margin-bottom: 24px;
  padding: 20px;
  background: rgba(137, 180, 250, 0.1);
  border-radius: 12px;
  border: 1px solid rgba(137, 180, 250, 0.3);
}

.percentile-card {
  flex-shrink: 0;
}

.percentile-value {
  font-size: 2.5rem;
  color: #89b4fa;
  font-weight: 700;
}

.percentile-label {
  color: #a6adc8;
  font-size: 0.9rem;
  margin-bottom: 8px;
}

.percentile-bar {
  width: 150px;
  height: 8px;
  background: rgba(69, 71, 90, 0.5);
  border-radius: 4px;
  overflow: hidden;
}

.percentile-fill {
  height: 100%;
  background: linear-gradient(90deg, #89b4fa, #74c7ec);
  transition: width 0.5s ease;
}

.comparison-text {
  color: #cdd6f4;
  font-size: 1.1rem;
  line-height: 1.5;
}

.comparison-text strong {
  color: #89b4fa;
}

.item-details-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 24px;
}

.detail-section {
  background: rgba(49, 50, 68, 0.3);
  border-radius: 8px;
  padding: 16px;
}

.detail-section h4 {
  color: #89b4fa;
  font-size: 1rem;
  margin: 0 0 12px 0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  padding: 6px 0;
  color: #a6adc8;
}

.detail-row strong {
  color: #cdd6f4;
}

.action-buttons {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.btn-primary,
.btn-secondary {
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
  text-decoration: none;
  display: inline-block;
}

.btn-primary {
  background: #89b4fa;
  color: #1e1e2e;
}

.btn-primary:hover {
  background: #74c7ec;
  transform: translateY(-2px);
}

.btn-secondary {
  background: rgba(69, 71, 90, 0.5);
  color: #cdd6f4;
}

.btn-secondary:hover {
  background: rgba(69, 71, 90, 0.7);
}

/* Modal animation */
.modal-enter-active,
.modal-leave-active {
  transition: all 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .modal-container,
.modal-leave-to .modal-container {
  transform: scale(0.9);
}

/* Custom scrollbar */
.modal-container::-webkit-scrollbar {
  width: 8px;
}

.modal-container::-webkit-scrollbar-track {
  background: rgba(17, 17, 27, 0.5);
  border-radius: 4px;
}

.modal-container::-webkit-scrollbar-thumb {
  background: rgba(137, 180, 250, 0.5);
  border-radius: 4px;
}

.modal-container::-webkit-scrollbar-thumb:hover {
  background: rgba(137, 180, 250, 0.7);
}
</style>
