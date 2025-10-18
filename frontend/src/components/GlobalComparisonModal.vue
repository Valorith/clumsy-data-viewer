<template>
  <transition name="modal">
    <div v-if="isOpen" class="modal-overlay" @click.self="close">
      <div class="modal-container large">
        <div class="modal-header">
          <h2 class="modal-title">
            <span class="title-icon">📊</span>
            Global DPS Comparison
          </h2>
          <button @click="close" class="close-btn">✕</button>
        </div>

        <div class="modal-body">
          <div class="filters-section">
            <div class="filter-chips">
              <button
                v-for="type in itemTypes"
                :key="type.id"
                :class="['filter-chip', { active: selectedTypes.includes(type.id) }]"
                @click="toggleType(type.id)"
              >
                {{ type.icon }} {{ type.name }}
              </button>
            </div>
            <div class="chart-controls">
              <select v-model="chartType" class="chart-type-select">
                <option value="total">Total DPS</option>
                <option value="breakdown">DPS Breakdown</option>
                <option value="top20">Top 20 Items</option>
              </select>
              <select v-model="sortOrder" class="sort-select">
                <option value="desc">Highest First</option>
                <option value="asc">Lowest First</option>
              </select>
            </div>
          </div>

          <div class="stats-cards">
            <div class="stat-card">
              <span class="stat-label">Total Items</span>
              <span class="stat-value">{{ filteredItems.length }}</span>
            </div>
            <div class="stat-card">
              <span class="stat-label">Average DPS</span>
              <span class="stat-value">{{ formatDPS(averageDPS) }}</span>
            </div>
            <div class="stat-card">
              <span class="stat-label">Max DPS</span>
              <span class="stat-value highlight">{{ formatDPS(maxDPS) }}</span>
            </div>
            <div class="stat-card">
              <span class="stat-label">Min DPS</span>
              <span class="stat-value">{{ formatDPS(minDPS) }}</span>
            </div>
          </div>

          <div class="chart-container large">
            <h3 class="chart-title">{{ getChartTitle() }}</h3>
            <div class="chart-fixed-container">
              <ChartContainer
                v-if="isOpen"
                canvas-id="global-comparison-chart"
                :chart-data="chartData"
                :chart-options="chartOptions"
                :width="1000"
                :height="600"
              />
            </div>
          </div>

          <div v-if="chartType === 'top20'" class="top-items-list">
            <h3>Top Performing Items</h3>
            <div class="top-items-grid">
              <div v-for="(item, index) in topItems" :key="item.item_id" class="top-item-card">
                <div class="rank-badge">#{{ index + 1 }}</div>
                <div class="item-info">
                  <div class="item-name">{{ item.name || `Item #${item.item_id}` }}</div>
                  <div class="item-stats">
                    <span class="dps-value">{{ formatDPS(item.total_dps) }}</span>
                    <span class="item-type">{{ getTypeName(item.itemtype) }}</span>
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
              </div>
            </div>
          </div>

          <div class="distribution-chart">
            <h3>DPS Distribution</h3>
            <div class="distribution-bars">
              <div v-for="bucket in distributionBuckets" :key="bucket.range" class="dist-bar-wrapper">
                <div class="dist-bar" :style="{ height: bucket.percentage + '%' }"></div>
                <div class="dist-label">{{ bucket.range }}</div>
                <div class="dist-count">{{ bucket.count }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </transition>
</template>

<script>
import ChartContainer from './ChartContainer.vue'

export default {
  name: 'GlobalComparisonModal',
  components: {
    ChartContainer
  },
  data() {
    return {
      selectedTypes: [],
      chartType: 'total',
      sortOrder: 'desc',
      itemTypes: [
        { id: 0, name: '1H Slash', icon: '⚔' },
        { id: 1, name: '2H Slash', icon: '🗡' },
        { id: 2, name: '1H Blunt', icon: '🔨' },
        { id: 3, name: '2H Blunt', icon: '⚒' },
        { id: 4, name: 'Piercing', icon: '🏹' },
        { id: 14, name: 'Martial', icon: '🥊' },
        { id: 35, name: '2H Pierce', icon: '🔱' },
        { id: 45, name: 'Archery', icon: '🏹' },
        { id: 51, name: 'Throwing', icon: '💫' }
      ]
    }
  },
  props: {
    isOpen: {
      type: Boolean,
      default: false
    },
    items: {
      type: Array,
      default: () => []
    }
  },
  emits: ['close'],
  computed: {
    filteredItems() {
      let items = [...this.items];
      
      if (this.selectedTypes.length > 0) {
        items = items.filter(item => this.selectedTypes.includes(item.itemtype));
      }
      
      items.sort((a, b) => {
        const diff = a.total_dps - b.total_dps;
        return this.sortOrder === 'asc' ? diff : -diff;
      });
      
      return items;
    },
    topItems() {
      return this.filteredItems.slice(0, 20);
    },
    averageDPS() {
      if (!this.filteredItems.length) return 0;
      const sum = this.filteredItems.reduce((acc, item) => acc + item.total_dps, 0);
      return sum / this.filteredItems.length;
    },
    maxDPS() {
      if (!this.filteredItems.length) return 0;
      return Math.max(...this.filteredItems.map(item => item.total_dps));
    },
    minDPS() {
      if (!this.filteredItems.length) return 0;
      return Math.min(...this.filteredItems.map(item => item.total_dps));
    },
    distributionBuckets() {
      const bucketSize = 10;
      const maxValue = Math.ceil(this.maxDPS / bucketSize) * bucketSize;
      const buckets = [];
      
      for (let i = 0; i <= maxValue; i += bucketSize) {
        const count = this.filteredItems.filter(item => 
          item.total_dps >= i && item.total_dps < i + bucketSize
        ).length;
        
        if (count > 0 || (i === 0 && this.filteredItems.length > 0)) {
          buckets.push({
            range: `${i}-${i + bucketSize}`,
            count,
            percentage: (count / this.filteredItems.length) * 100
          });
        }
      }
      
      return buckets.slice(0, 10);
    },
    chartData() {
      // Limit to 30 items for better readability with horizontal bars
      let items = this.chartType === 'top20' ? this.topItems : this.filteredItems.slice(0, 30);
      const labels = items.map(i => i.name || `Item #${i.item_id}`);
      
      if (this.chartType === 'breakdown') {
        return {
          labels,
          datasets: [
            {
              label: 'MH DPS',
              data: items.map(i => i.mh_dps),
              backgroundColor: 'rgba(243, 139, 168, 0.7)',
              borderColor: '#f38ba8',
              borderWidth: 1,
              borderRadius: 4
            },
            {
              label: 'Spell DPS',
              data: items.map(i => i.mh_spell_dps),
              backgroundColor: 'rgba(166, 227, 161, 0.7)',
              borderColor: '#a6e3a1',
              borderWidth: 1,
              borderRadius: 4
            },
            {
              label: 'Bane DPS',
              data: items.map(i => i.bane_dps),
              backgroundColor: 'rgba(250, 179, 135, 0.7)',
              borderColor: '#fab387',
              borderWidth: 1,
              borderRadius: 4
            },
            {
              label: 'Backstab DPS',
              data: items.map(i => i.bs_dps),
              backgroundColor: 'rgba(180, 190, 254, 0.7)',
              borderColor: '#b4befe',
              borderWidth: 1,
              borderRadius: 4
            }
          ]
        };
      } else {
        return {
          labels,
          datasets: [
            {
              label: 'Total DPS',
              data: items.map(i => i.total_dps),
              backgroundColor: items.map((item, idx) => {
                // Create gradient colors based on DPS value
                const maxDps = Math.max(...items.map(i => i.total_dps));
                const ratio = item.total_dps / maxDps;
                if (ratio > 0.8) return 'rgba(166, 227, 161, 0.8)'; // Top 20% - Green
                if (ratio > 0.6) return 'rgba(137, 180, 250, 0.8)'; // Next 20% - Blue
                if (ratio > 0.4) return 'rgba(250, 179, 135, 0.8)'; // Middle - Orange
                return 'rgba(243, 139, 168, 0.8)'; // Bottom - Pink
              }),
              borderColor: items.map((item, idx) => {
                const maxDps = Math.max(...items.map(i => i.total_dps));
                const ratio = item.total_dps / maxDps;
                if (ratio > 0.8) return '#a6e3a1';
                if (ratio > 0.6) return '#89b4fa';
                if (ratio > 0.4) return '#fab387';
                return '#f38ba8';
              }),
              borderWidth: 2,
              borderRadius: 4,
              hoverBackgroundColor: 'rgba(137, 180, 250, 0.95)'
            }
          ]
        };
      }
    },
    chartOptions() {
      return {
        indexAxis: 'y', // Make bars horizontal
        plugins: {
          legend: {
            display: this.chartType === 'breakdown',
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
                const itemName = context.label || '';
                const value = this.formatDPS(context.raw);
                return [`${context.dataset.label}: ${value}`, `Item: ${itemName}`];
              }
            }
          },
          datalabels: {
            display: true,
            color: '#fff',
            anchor: 'center',
            align: 'center',
            font: {
              size: 10,
              weight: 'bold'
            },
            formatter: (value, context) => {
              const label = context.chart.data.labels[context.dataIndex];
              const shortLabel = label.length > 20 ? label.substring(0, 20) + '...' : label;
              return `${shortLabel}\n${this.formatDPS(value)}`;
            }
          }
        },
        scales: {
          x: {
            stacked: this.chartType === 'breakdown',
            grid: {
              color: 'rgba(69, 71, 90, 0.3)'
            },
            ticks: {
              color: '#a6adc8',
              callback: (value) => this.formatDPS(value)
            },
            beginAtZero: true
          },
          y: {
            stacked: this.chartType === 'breakdown',
            grid: {
              color: 'rgba(69, 71, 90, 0.3)',
              display: false
            },
            ticks: {
              color: '#cdd6f4',
              font: {
                size: 11
              },
              autoSkip: false,
              maxRotation: 0,
              callback: function(value, index) {
                const label = this.getLabelForValue(value);
                return label.length > 25 ? label.substring(0, 25) + '...' : label;
              }
            }
          }
        }
      };
    }
  },
  methods: {
    formatDPS(value) {
      return value ? value.toFixed(1) : '0.0';
    },
    toggleType(typeId) {
      const index = this.selectedTypes.indexOf(typeId);
      if (index > -1) {
        this.selectedTypes.splice(index, 1);
      } else {
        this.selectedTypes.push(typeId);
      }
    },
    getTypeName(typeId) {
      const type = this.itemTypes.find(t => t.id === typeId);
      return type ? type.name : `Type ${typeId}`;
    },
    getChartTitle() {
      switch(this.chartType) {
        case 'breakdown':
          return 'DPS Breakdown by Component';
        case 'top20':
          return 'Top 20 Items by Total DPS';
        default:
          return 'Total DPS Comparison';
      }
    },
    close() {
      this.$emit('close');
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
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(5px);
}

.modal-container {
  background: linear-gradient(135deg, #1e1e2e 0%, #2a2a3e 100%);
  border-radius: 20px;
  max-width: 1400px;
  width: 95%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 30px 60px rgba(0, 0, 0, 0.6);
  border: 1px solid rgba(137, 180, 250, 0.2);
}

.modal-container.large {
  max-width: 1400px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 28px 32px;
  border-bottom: 1px solid rgba(69, 71, 90, 0.5);
  background: rgba(49, 50, 68, 0.3);
}

.modal-title {
  color: #cdd6f4;
  font-size: 2rem;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 14px;
}

.title-icon {
  font-size: 2.2rem;
}

.close-btn {
  background: none;
  border: none;
  color: #f38ba8;
  font-size: 1.8rem;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 6px;
  transition: all 0.2s;
}

.close-btn:hover {
  background: rgba(243, 139, 168, 0.2);
}

.modal-body {
  padding: 32px;
}

.filters-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 28px;
  flex-wrap: wrap;
  gap: 16px;
}

.filter-chips {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.filter-chip {
  padding: 8px 14px;
  background: rgba(69, 71, 90, 0.3);
  border: 1px solid rgba(69, 71, 90, 0.5);
  border-radius: 20px;
  color: #a6adc8;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s;
}

.filter-chip:hover {
  background: rgba(69, 71, 90, 0.5);
  border-color: #89b4fa;
}

.filter-chip.active {
  background: rgba(137, 180, 250, 0.2);
  border-color: #89b4fa;
  color: #89b4fa;
}

.chart-controls {
  display: flex;
  gap: 12px;
}

.chart-type-select,
.sort-select {
  padding: 8px 14px;
  border: 1px solid #45475a;
  border-radius: 8px;
  background: rgba(17, 17, 27, 0.5);
  color: #cdd6f4;
  font-size: 0.95rem;
  cursor: pointer;
}

.stats-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 28px;
}

.stat-card {
  background: rgba(49, 50, 68, 0.5);
  border: 1px solid rgba(69, 71, 90, 0.5);
  border-radius: 12px;
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.stat-label {
  color: #a6adc8;
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.stat-value {
  color: #cdd6f4;
  font-size: 1.8rem;
  font-weight: 600;
}

.stat-value.highlight {
  color: #a6e3a1;
}

.chart-container {
  background: rgba(17, 17, 27, 0.6);
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 28px;
}

.chart-fixed-container {
  width: 100%;
  height: 600px;
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
  font-size: 1.3rem;
  margin: 0 0 24px 0;
  text-align: center;
}

.top-items-list {
  margin-top: 32px;
  padding-top: 28px;
  border-top: 1px solid rgba(69, 71, 90, 0.3);
}

.top-items-list h3 {
  color: #89b4fa;
  font-size: 1.3rem;
  margin-bottom: 20px;
}

.top-items-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 12px;
}

.top-item-card {
  background: rgba(49, 50, 68, 0.4);
  border: 1px solid rgba(69, 71, 90, 0.4);
  border-radius: 10px;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  transition: all 0.2s;
}

.top-item-card:hover {
  background: rgba(69, 71, 90, 0.3);
  transform: translateX(4px);
}

.rank-badge {
  background: linear-gradient(135deg, #89b4fa, #74c7ec);
  color: #1e1e2e;
  font-weight: bold;
  font-size: 0.9rem;
  padding: 6px 10px;
  border-radius: 8px;
}

.item-info {
  flex: 1;
}

.item-name {
  color: #cdd6f4;
  font-weight: 500;
  margin-bottom: 4px;
}

.item-stats {
  display: flex;
  gap: 12px;
  align-items: center;
}

.dps-value {
  color: #a6e3a1;
  font-weight: 600;
  font-size: 1.1rem;
}

.item-type {
  color: #a6adc8;
  font-size: 0.85rem;
}

.link-icon {
  text-decoration: none;
  font-size: 1.2rem;
  opacity: 0.7;
  transition: all 0.2s;
}

.link-icon:hover {
  opacity: 1;
  transform: scale(1.2);
}

.distribution-chart {
  margin-top: 32px;
  padding: 24px;
  background: rgba(17, 17, 27, 0.5);
  border-radius: 16px;
}

.distribution-chart h3 {
  color: #89b4fa;
  font-size: 1.2rem;
  margin-bottom: 20px;
}

.distribution-bars {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  height: 200px;
  gap: 8px;
}

.dist-bar-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.dist-bar {
  width: 100%;
  background: linear-gradient(180deg, #89b4fa, #74c7ec);
  border-radius: 4px 4px 0 0;
  transition: all 0.3s;
  min-height: 4px;
}

.dist-label {
  color: #6c7086;
  font-size: 0.7rem;
  text-align: center;
  white-space: nowrap;
}

.dist-count {
  color: #a6adc8;
  font-size: 0.8rem;
  font-weight: 600;
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
  width: 10px;
}

.modal-container::-webkit-scrollbar-track {
  background: rgba(17, 17, 27, 0.5);
  border-radius: 5px;
}

.modal-container::-webkit-scrollbar-thumb {
  background: rgba(137, 180, 250, 0.5);
  border-radius: 5px;
}

.modal-container::-webkit-scrollbar-thumb:hover {
  background: rgba(137, 180, 250, 0.7);
}
</style>