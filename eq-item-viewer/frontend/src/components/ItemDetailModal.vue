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
              <span class="stat-value highlight">{{ formatDPS(item.total_dps) }}</span>
            </div>
            <div class="stat-badge">
              <span class="stat-label">MH DPS</span>
              <span class="stat-value">{{ formatDPS(item.mh_dps) }}</span>
            </div>
            <div class="stat-badge">
              <span class="stat-label">Spell DPS</span>
              <span class="stat-value">{{ formatDPS(item.mh_spell_dps) }}</span>
            </div>
            <div v-if="item.bane_dps > 0" class="stat-badge bane">
              <span class="stat-label">Bane DPS</span>
              <span class="stat-value">{{ formatDPS(item.bane_dps) }}</span>
            </div>
            <div v-if="item.bs_dps > 0" class="stat-badge backstab">
              <span class="stat-label">Backstab DPS</span>
              <span class="stat-value">{{ formatDPS(item.bs_dps) }}</span>
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
    chartData() {
      const similarItems = this.getSimilarItems();
      const labels = similarItems.map(i => i.name || `Item #${i.item_id}`);
      const currentItemIndex = similarItems.findIndex(i => i.item_id === this.item.item_id);

      return {
        labels,
        datasets: [
          {
            label: 'Total DPS',
            data: similarItems.map(i => i.total_dps),
            backgroundColor: similarItems.map((i, idx) => 
              idx === currentItemIndex ? 'rgba(137, 180, 250, 0.8)' : 'rgba(69, 71, 90, 0.6)'
            ),
            borderColor: similarItems.map((i, idx) => 
              idx === currentItemIndex ? '#89b4fa' : '#45475a'
            ),
            borderWidth: 2,
            borderRadius: 6,
            hoverBackgroundColor: 'rgba(137, 180, 250, 0.9)'
          },
          {
            label: 'MH DPS',
            data: similarItems.map(i => i.mh_dps),
            backgroundColor: 'rgba(243, 139, 168, 0.5)',
            borderColor: '#f38ba8',
            borderWidth: 1,
            borderRadius: 6,
            hidden: true
          },
          {
            label: 'Spell DPS',
            data: similarItems.map(i => i.mh_spell_dps),
            backgroundColor: 'rgba(166, 227, 161, 0.5)',
            borderColor: '#a6e3a1',
            borderWidth: 1,
            borderRadius: 6,
            hidden: true
          }
        ]
      };
    },
    chartOptions() {
      return {
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
            }
          },
          y: {
            grid: {
              color: 'rgba(69, 71, 90, 0.3)'
            },
            ticks: {
              color: '#a6adc8',
              callback: (value) => this.formatDPS(value)
            },
            beginAtZero: true
          }
        }
      };
    }
  },
  methods: {
    formatDPS,
    getClassNames,
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