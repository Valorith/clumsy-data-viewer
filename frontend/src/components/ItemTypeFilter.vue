<template>
  <div class="item-type-filter">
    <h3 class="filter-title">Filter by Item Type</h3>
    <div class="type-cards">
      <div 
        v-for="type in itemTypes" 
        :key="type.id"
        :class="['type-card', { active: isTypeActive(type.id) }]"
        @click="toggleType(type.id)"
        :style="{ '--type-color': type.color }"
      >
        <div class="type-icon">{{ type.icon }}</div>
        <div class="type-name">{{ type.name }}</div>
        <div class="type-count">{{ getTypeCount(type.id) }}</div>
      </div>
    </div>
    <div class="filter-actions">
      <button @click="selectAll" class="btn-text">Select All</button>
      <button @click="clearAll" class="btn-text">Clear All</button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ItemTypeFilter',
  props: {
    selectedTypes: {
      default: null
    },
    typeCounts: {
      type: Object,
      default: () => ({})
    }
  },
  emits: ['update'],
  data() {
    return {
      itemTypes: [
        { id: 0, name: '1H Slash', icon: '⚔', color: '#FF6B6B' },
        { id: 1, name: '2H Slash', icon: '🗡', color: '#4ECDC4' },
        { id: 2, name: 'Piercing', icon: '🗡', color: '#95E77E' },
        { id: 3, name: '1H Blunt', icon: '🔨', color: '#FFD93D' },
        { id: 4, name: '2H Blunt', icon: '🔨', color: '#6C5CE7' },
        { id: 5, name: 'Archery', icon: '🏹', color: '#FD79A8' },
        { id: 10, name: 'Armor', icon: '👕', color: '#A29BFE' },
        { id: 35, name: '2H Piercing', icon: '⚔', color: '#74B9FF' },
        { id: 45, name: 'Hand to Hand', icon: '👊', color: '#FF7675' }
      ]
    };
  },
  computed: {
    allTypeIds() {
      return this.itemTypes.map(t => t.id);
    }
  },
  methods: {
    isTypeActive(typeId) {
      if (!Array.isArray(this.selectedTypes)) {
        return true;
      }
      if (this.selectedTypes.length === 0) {
        return false;
      }
      return this.selectedTypes.includes(typeId);
    },
    toggleType(typeId) {
      const allIds = this.allTypeIds;
      const currentlySelected = Array.isArray(this.selectedTypes)
        ? [...this.selectedTypes]
        : [...allIds];
      if (this.isTypeActive(typeId)) {
        const updated = currentlySelected.filter(id => id !== typeId);
        this.$emit('update', updated.length === allIds.length ? null : updated);
        return;
      }

      if (!currentlySelected.includes(typeId)) {
        currentlySelected.push(typeId);
      }

      const unique = Array.from(new Set(currentlySelected));
      if (unique.length === allIds.length) {
        this.$emit('update', null);
      } else {
        this.$emit('update', unique);
      }
    },
    selectAll() {
      this.$emit('update', null);
    },
    clearAll() {
      this.$emit('update', []);
    },
    getTypeCount(typeId) {
      return this.typeCounts[typeId] || 0;
    }
  }
};
</script>

<style scoped>
.item-type-filter {
  background: linear-gradient(135deg, #1e1e2e 0%, #2a2a3e 100%);
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
}

.filter-title {
  color: #cdd6f4;
  font-size: 1.3rem;
  font-weight: 600;
  margin-bottom: 20px;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.type-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 16px;
  margin-bottom: 20px;
}

.type-card {
  background: rgba(49, 50, 68, 0.6);
  border: 2px solid transparent;
  border-radius: 12px;
  padding: 16px 12px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  text-align: center;
  position: relative;
  overflow: hidden;
}

.type-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, transparent 40%, var(--type-color, #89b4fa) 100%);
  opacity: 0;
  transition: opacity 0.3s;
  z-index: 0;
}

.type-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3);
  border-color: var(--type-color, #89b4fa);
}

.type-card:hover::before {
  opacity: 0.1;
}

.type-card.active {
  background: rgba(137, 180, 250, 0.2);
  border-color: var(--type-color, #89b4fa);
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(137, 180, 250, 0.3);
}

.type-card.active::before {
  opacity: 0.2;
}

.type-icon {
  font-size: 2rem;
  margin-bottom: 8px;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
  position: relative;
  z-index: 1;
}

.type-card:hover .type-icon,
.type-card.active .type-icon {
  animation: bounce 0.5s;
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

.type-name {
  color: #cdd6f4;
  font-size: 0.85rem;
  font-weight: 500;
  margin-bottom: 4px;
  position: relative;
  z-index: 1;
}

.type-count {
  color: #a6adc8;
  font-size: 0.75rem;
  background: rgba(0, 0, 0, 0.3);
  padding: 2px 8px;
  border-radius: 12px;
  display: inline-block;
  position: relative;
  z-index: 1;
}

.type-card.active .type-count {
  background: var(--type-color, #89b4fa);
  color: #1e1e2e;
  font-weight: 600;
}

.filter-actions {
  display: flex;
  justify-content: center;
  gap: 20px;
  padding-top: 12px;
  border-top: 1px solid rgba(69, 71, 90, 0.5);
}

.btn-text {
  background: none;
  border: none;
  color: #89b4fa;
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  padding: 8px 16px;
  border-radius: 8px;
  transition: all 0.2s;
}

.btn-text:hover {
  background: rgba(137, 180, 250, 0.1);
  transform: translateY(-1px);
}
</style>
