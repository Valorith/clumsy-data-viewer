<template>
  <div class="item-card" :class="{ 'has-bane': item.bane_dps > 0, 'has-backstab': item.bs_dps > 0 }">
    <div class="item-header">
      <h3 class="item-name">
        <a :href="`${allaBaseUrl}${item.item_id}`" target="_blank" rel="noopener noreferrer">
          {{ item.name || `Item #${item.item_id}` }}
        </a>
      </h3>
      <span class="item-type" :style="{ backgroundColor: getTypeColor() }">
        {{ getTypeName() }}
      </span>
    </div>

    <div class="item-stats">
      <div class="stat-row">
        <div class="stat-group main-stats">
          <div class="stat">
            <span class="stat-label">MH DPS:</span>
            <span class="stat-value">{{ formatDPS(item.mh_dps) }}</span>
          </div>
          <div class="stat">
            <span class="stat-label">Spell DPS:</span>
            <span class="stat-value">{{ formatDPS(item.mh_spell_dps) }}</span>
          </div>
          <div class="stat">
            <span class="stat-label">Total DPS:</span>
            <span class="stat-value highlight">{{ formatDPS(item.total_dps) }}</span>
          </div>
        </div>
      </div>

      <div class="stat-row secondary">
        <div class="stat" v-if="item.oh_dps > 0">
          <span class="stat-label">OH DPS:</span>
          <span class="stat-value">{{ formatDPS(item.oh_dps) }}</span>
        </div>
        <div class="stat" v-if="item.oh_spell_dps > 0">
          <span class="stat-label">OH Spell:</span>
          <span class="stat-value">{{ formatDPS(item.oh_spell_dps) }}</span>
        </div>
        <div class="stat" v-if="item.mh_oh_dps > 0">
          <span class="stat-label">MH+OH:</span>
          <span class="stat-value">{{ formatDPS(item.mh_oh_dps) }}</span>
        </div>
        <div class="stat" v-if="item.bane_dps > 0">
          <span class="stat-label bane">Bane DPS:</span>
          <span class="stat-value bane">{{ formatDPS(item.bane_dps) }}</span>
        </div>
        <div class="stat" v-if="item.bs_dps > 0">
          <span class="stat-label backstab">BS DPS:</span>
          <span class="stat-value backstab">{{ formatDPS(item.bs_dps) }}</span>
        </div>
      </div>

      <div class="item-details" v-if="item.damage || item.delay">
        <div class="detail" v-if="item.damage">
          <span class="detail-label">DMG:</span>
          <span class="detail-value">{{ item.damage }}</span>
        </div>
        <div class="detail" v-if="item.delay">
          <span class="detail-label">DLY:</span>
          <span class="detail-value">{{ item.delay }}</span>
        </div>
        <div class="detail" v-if="item.ac">
          <span class="detail-label">AC:</span>
          <span class="detail-value">{{ item.ac }}</span>
        </div>
      </div>

      <div class="item-requirements" v-if="item.classes || item.reqlevel">
        <div class="requirement" v-if="item.classes">
          <span class="req-label">Classes:</span>
          <span class="req-value">{{ getClasses() }}</span>
        </div>
        <div class="requirement" v-if="item.reqlevel">
          <span class="req-label">Req Level:</span>
          <span class="req-value">{{ item.reqlevel }}</span>
        </div>
      </div>

      <div class="item-notes" v-if="item.notes">
        <span class="notes-label">Notes:</span>
        <span class="notes-text">{{ item.notes }}</span>
      </div>
    </div>

    <div class="item-actions">
      <a 
        :href="`${allaBaseUrl}${item.item_id}`" 
        target="_blank" 
        rel="noopener noreferrer"
        class="view-link"
      >
        View on Allakhazam →
      </a>
    </div>
  </div>
</template>

<script>
import config from '../config';
import { formatDPS, getClassNames, getItemTypeColor, getItemTypeName } from '../utils/formatters';

export default {
  name: 'ItemCard',
  props: {
    item: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      allaBaseUrl: config.ALLA_BASE_URL
    };
  },
  methods: {
    formatDPS,
    getTypeColor() {
      return getItemTypeColor(this.item.itemtype);
    },
    getTypeName() {
      return getItemTypeName(this.item.itemtype);
    },
    getClasses() {
      return getClassNames(this.item.classes);
    }
  }
};
</script>

<style scoped>
.item-card {
  background: #1e1e2e;
  border: 1px solid #313244;
  border-radius: 8px;
  padding: 16px;
  transition: all 0.2s;
  position: relative;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.item-card:hover {
  border-color: #89b4fa;
  box-shadow: 0 4px 12px rgba(137, 180, 250, 0.2);
}

.item-card.has-bane {
  border-left: 3px solid #f38ba8;
}

.item-card.has-backstab {
  border-left: 3px solid #fab387;
}

.item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.item-name {
  margin: 0;
  font-size: 1.1rem;
  color: #cdd6f4;
}

.item-name a {
  color: #89b4fa;
  text-decoration: none;
}

.item-name a:hover {
  color: #74c7ec;
  text-decoration: underline;
}

.item-type {
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 0.85rem;
  color: white;
  font-weight: 500;
}

.item-stats {
  display: flex;
  flex-direction: column;
  gap: 10px;
  flex-grow: 1;
}

.stat-row {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
}

.stat-row.secondary {
  padding-top: 8px;
  border-top: 1px solid #313244;
}

.stat-group {
  display: flex;
  gap: 20px;
}

.stat {
  display: flex;
  align-items: center;
  gap: 6px;
}

.stat-label {
  color: #a6adc8;
  font-size: 0.9rem;
}

.stat-value {
  color: #cdd6f4;
  font-weight: 600;
  font-size: 0.95rem;
}

.stat-value.highlight {
  color: #a6e3a1;
  font-size: 1rem;
}

.stat-label.bane,
.stat-value.bane {
  color: #f38ba8;
}

.stat-label.backstab,
.stat-value.backstab {
  color: #fab387;
}

.item-details {
  display: flex;
  gap: 15px;
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid #313244;
}

.detail {
  display: flex;
  gap: 4px;
}

.detail-label {
  color: #6c7086;
  font-size: 0.85rem;
}

.detail-value {
  color: #bac2de;
  font-size: 0.85rem;
  font-weight: 500;
}

.item-requirements {
  display: flex;
  gap: 20px;
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid #313244;
}

.requirement {
  display: flex;
  gap: 6px;
}

.req-label {
  color: #6c7086;
  font-size: 0.85rem;
}

.req-value {
  color: #bac2de;
  font-size: 0.85rem;
}

.item-notes {
  margin-top: 10px;
  padding: 8px;
  background: #313244;
  border-radius: 4px;
}

.notes-label {
  color: #a6adc8;
  font-size: 0.85rem;
  font-weight: 500;
  margin-right: 6px;
}

.notes-text {
  color: #bac2de;
  font-size: 0.85rem;
}

.item-actions {
  margin-top: 12px;
  display: flex;
  justify-content: flex-end;
}

.view-link {
  color: #89b4fa;
  text-decoration: none;
  font-size: 0.9rem;
  padding: 4px 8px;
  border-radius: 4px;
  transition: all 0.2s;
}

.view-link:hover {
  background: #313244;
  color: #74c7ec;
}
</style>