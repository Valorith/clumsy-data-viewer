<template>
  <div class="stats-overview">
    <h2>Database Statistics</h2>
    <div class="stats-grid">
      <div class="stat-card">
        <span class="stat-icon">📊</span>
        <div class="stat-info">
          <div class="stat-value">{{ formatNumber(stats.totalItems) }}</div>
          <div class="stat-label">Total Items</div>
        </div>
      </div>
      
      <div class="stat-card">
        <span class="stat-icon">⚔</span>
        <div class="stat-info">
          <div class="stat-value">{{ formatDPS(stats.maxMeleeDps) }}</div>
          <div class="stat-label">Max Melee DPS</div>
        </div>
      </div>
      
      <div class="stat-card">
        <span class="stat-icon">✨</span>
        <div class="stat-info">
          <div class="stat-value">{{ formatDPS(stats.maxSpellDps) }}</div>
          <div class="stat-label">Max Spell DPS</div>
        </div>
      </div>
      
      <div class="stat-card">
        <span class="stat-icon">💀</span>
        <div class="stat-info">
          <div class="stat-value">{{ formatNumber(stats.baneItems) }}</div>
          <div class="stat-label">Bane Items</div>
        </div>
      </div>
      
      <div class="stat-card">
        <span class="stat-icon">🗡</span>
        <div class="stat-info">
          <div class="stat-value">{{ formatNumber(stats.backstabItems) }}</div>
          <div class="stat-label">Backstab Items</div>
        </div>
      </div>
      
      <div class="stat-card">
        <span class="stat-icon">🎯</span>
        <div class="stat-info">
          <div class="stat-value">{{ formatDPS(stats.maxTotalDps) }}</div>
          <div class="stat-label">Max Total DPS</div>
        </div>
      </div>
    </div>
  </div>
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
  methods: {
    formatDPS,
    formatNumber
  }
};
</script>

<style scoped>
.stats-overview {
  background: #1e1e2e;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.stats-overview h2 {
  color: #cdd6f4;
  margin-top: 0;
  margin-bottom: 20px;
  font-size: 1.3rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
}

.stat-card {
  background: #313244;
  border-radius: 6px;
  padding: 15px;
  display: flex;
  align-items: center;
  gap: 12px;
  transition: transform 0.2s, box-shadow 0.2s;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.stat-icon {
  font-size: 1.8rem;
  opacity: 0.9;
  flex-shrink: 0;
  width: 40px;
  text-align: center;
}

.stat-info {
  flex: 1;
}

.stat-value {
  color: #89b4fa;
  font-size: 1.4rem;
  font-weight: 600;
  line-height: 1.2;
}

.stat-label {
  color: #a6adc8;
  font-size: 0.85rem;
  margin-top: 2px;
}
</style>