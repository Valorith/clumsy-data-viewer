<template>
  <article
    class="item-card"
    :class="{
      'has-bane': item.bane_dps > 0,
      'has-backstab': item.bs_dps > 0,
      'is-expanded': expanded
    }"
  >
    <button
      type="button"
      class="card-toggle"
      @click="toggleExpanded"
      :aria-expanded="expanded.toString()"
    >
      <div class="item-header">
        <div class="title-block">
          <h3 class="item-name">
            {{ item.name || `Item #${item.item_id}` }}
          </h3>
          <span class="item-type" :style="{ backgroundColor: getTypeColor() }">
            {{ getTypeName() }}
          </span>
        </div>
        <span class="toggle-icon" :class="{ open: expanded }">▾</span>
      </div>

      <div class="item-summary">
        <span class="summary-chip highlight">
          Total {{ formatDPS(item.total_dps) }}
        </span>
        <span class="summary-chip">
          MH {{ formatDPS(item.mh_dps) }}
        </span>
        <span
          v-if="item.mh_spell_dps > 0"
          class="summary-chip"
        >
          Spell {{ formatDPS(item.mh_spell_dps) }}
        </span>
        <span
          v-if="item.oh_dps > 0"
          class="summary-chip"
        >
          OH {{ formatDPS(item.oh_dps) }}
        </span>
        <span
          v-if="item.bane_dps > 0"
          class="summary-chip bane"
        >
          Bane {{ formatDPS(item.bane_dps) }}
        </span>
        <span
          v-if="item.bs_dps > 0"
          class="summary-chip backstab"
        >
          BS {{ formatDPS(item.bs_dps) }}
        </span>
      </div>
    </button>

    <transition name="card-expand">
      <section v-if="expanded" class="item-details-wrapper">
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
            <span class="req-value">{{ getClasses() }}</span>
          </div>
          <div class="requirement" v-if="item.reqlevel">
            <span class="req-label">Req&nbsp;Level</span>
            <span class="req-value">{{ item.reqlevel }}</span>
          </div>
        </div>

        <div class="item-notes" v-if="item.notes">
          <span class="notes-label">Notes</span>
          <span class="notes-text">{{ item.notes }}</span>
        </div>

        <div class="item-actions">
          <button type="button" class="detail-btn" @click.stop="handleOpen">
            View Item Details
          </button>
          <a
            :href="`${allaBaseUrl}${item.item_id}`"
            target="_blank"
            rel="noopener noreferrer"
            class="view-link"
            @click.stop
          >
            Alla →
          </a>
        </div>
      </section>
    </transition>
  </article>
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
  emits: ['open'],
  data() {
    return {
      allaBaseUrl: config.ALLA_BASE_URL,
      expanded: false
    };
  },
  watch: {
    item() {
      this.expanded = false;
    }
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
  background: #1e1e2e;
  border: 1px solid #313244;
  border-radius: 6px;
  padding: 12px 14px;
  transition: all 0.2s;
  position: relative;
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 10px;
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
  gap: 10px;
  width: 100%;
}

.title-block {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1 1 auto;
}

.item-name {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: #cdd6f4;
}

.card-toggle {
  all: unset;
  cursor: pointer;
  display: block;
  width: 100%;
}

.item-type {
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.75rem;
  color: white;
  font-weight: 500;
  white-space: nowrap;
  flex-shrink: 0;
  max-width: 120px;
  text-align: center;
}

.item-summary {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 10px;
}

.summary-chip {
  background: rgba(137, 180, 250, 0.12);
  color: #bac2de;
  border-radius: 999px;
  padding: 4px 8px;
  font-size: 0.78rem;
  font-weight: 500;
}

.summary-chip.highlight {
  background: rgba(166, 227, 161, 0.18);
  color: #a6e3a1;
}

.summary-chip.bane {
  background: rgba(243, 139, 168, 0.18);
  color: #f38ba8;
}

.summary-chip.backstab {
  background: rgba(250, 179, 135, 0.18);
  color: #fab387;
}

.item-details-wrapper {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-top: 10px;
  border-top: 1px solid #313244;
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
  gap: 12px;
  margin-top: 6px;
  padding-top: 6px;
  border-top: 1px solid #313244;
  flex-wrap: wrap;
}

.detail {
  display: flex;
  gap: 4px;
}

.detail-label {
  color: #6c7086;
  font-size: 0.78rem;
}

.detail-value {
  color: #bac2de;
  font-size: 0.78rem;
  font-weight: 500;
}

.item-requirements {
  display: flex;
  gap: 12px;
  margin-top: 6px;
  padding-top: 6px;
  border-top: 1px solid #313244;
  flex-wrap: wrap;
}

.requirement {
  display: flex;
  gap: 6px;
}

.req-label {
  color: #6c7086;
  font-size: 0.78rem;
}

.req-value {
  color: #bac2de;
  font-size: 0.78rem;
}

.item-notes {
  margin-top: 8px;
  padding: 6px 8px;
  background: #313244;
  border-radius: 4px;
}

.notes-label {
  color: #a6adc8;
  font-size: 0.78rem;
  font-weight: 500;
  margin-right: 4px;
}

.notes-text {
  color: #bac2de;
  font-size: 0.78rem;
}

.item-actions {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 10px;
}

.detail-btn {
  background: transparent;
  border: 1px solid #89b4fa;
  color: #89b4fa;
  border-radius: 4px;
  padding: 3px 8px;
  font-size: 0.78rem;
  cursor: pointer;
  transition: all 0.2s;
}

.detail-btn:hover {
  background: rgba(137, 180, 250, 0.15);
}

.view-link {
  color: #89b4fa;
  text-decoration: none;
  font-size: 0.78rem;
  padding: 3px 6px;
  border-radius: 4px;
  transition: all 0.2s;
}

.view-link:hover {
  background: #313244;
  color: #74c7ec;
}

.toggle-icon {
  font-size: 0.9rem;
  color: #a6adc8;
  transition: transform 0.2s ease;
}

.toggle-icon.open {
  transform: rotate(180deg);
}

.item-card.is-expanded {
  border-color: #89b4fa;
}

.card-expand-enter-active,
.card-expand-leave-active {
  transition: opacity 0.18s ease, transform 0.18s ease;
}

.card-expand-enter-from,
.card-expand-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
