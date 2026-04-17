<template>
  <section class="item-type-filter">
    <div class="filter-header">
      <div class="title-row">
        <span class="glyph" aria-hidden="true">⬢</span>
        <div>
          <div class="eyebrow">Arsenal</div>
          <h3 class="filter-title">Choose your discipline</h3>
        </div>
      </div>
      <div class="filter-actions">
        <button @click="selectAll" class="chip-btn ghost">All</button>
        <button @click="clearAll" class="chip-btn danger">None</button>
      </div>
    </div>

    <div class="hex-rack">
      <button
        v-for="type in itemTypes"
        :key="type.id"
        type="button"
        :class="['hex-tile', { active: isTypeActive(type.id), hasCount: getTypeCount(type.id) > 0 }]"
        @click="toggleType(type.id)"
        :style="{ '--type-color': type.color }"
      >
        <span class="hex-shape" aria-hidden="true">
          <span class="hex-inner"></span>
          <span class="hex-core"></span>
        </span>
        <span class="hex-icon">{{ type.icon }}</span>
        <span class="hex-name">{{ type.name }}</span>
        <span v-if="getTypeCount(type.id) > 0" class="hex-count">{{ getTypeCount(type.id) }}</span>
        <span class="hex-check" aria-hidden="true">✓</span>
      </button>
    </div>
  </section>
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
        { id: 0, name: '1H Slash', icon: '⚔', color: '#b97b76' },
        { id: 1, name: '2H Slash', icon: '🗡', color: '#be9a68' },
        { id: 2, name: 'Piercing', icon: '🗡', color: '#84a28f' },
        { id: 3, name: '1H Blunt', icon: '🔨', color: '#b6a16a' },
        { id: 4, name: '2H Blunt', icon: '🔨', color: '#9888c0' },
        { id: 5, name: 'Archery', icon: '🏹', color: '#78aab5' },
        { id: 10, name: 'Armor', icon: '👕', color: '#918fc1' },
        { id: 35, name: '2H Pierce', icon: '⚔', color: '#7d95c3' },
        { id: 45, name: 'Hand-to-Hand', icon: '👊', color: '#c08d62' }
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
  background: linear-gradient(180deg, rgba(19, 19, 37, 0.78) 0%, rgba(13, 13, 25, 0.84) 100%);
  border: 1px solid var(--line-gold);
  border-radius: var(--r-lg);
  padding: 24px 28px 26px;
  box-shadow: var(--shadow-card);
  position: relative;
  overflow: hidden;
}

.item-type-filter::before {
  content: '';
  position: absolute;
  top: 0; left: 30px; right: 30px; height: 1px;
  background: linear-gradient(90deg, transparent, var(--gold) 50%, transparent);
}

.filter-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 22px;
  flex-wrap: wrap;
}

.title-row {
  display: flex;
  align-items: center;
  gap: 14px;
}

.glyph {
  color: var(--gold);
  font-size: 1.4rem;
  animation: rune-pulse 3.2s ease-in-out infinite;
}

.eyebrow {
  font-family: var(--font-display);
  font-size: 0.7rem;
  letter-spacing: 0.4em;
  color: var(--gold);
  text-transform: uppercase;
  opacity: 0.8;
}

.filter-title {
  font-family: var(--font-display);
  font-size: 1.3rem;
  font-weight: 600;
  color: var(--ink-primary);
  letter-spacing: 0.05em;
  margin: 0;
}

.filter-actions {
  display: flex;
  gap: 8px;
}

.chip-btn {
  background: rgba(7, 7, 13, 0.55);
  border: 1px solid var(--line-soft);
  color: var(--ink-secondary);
  padding: 6px 16px;
  border-radius: var(--r-pill);
  font-family: var(--font-display);
  font-size: 0.72rem;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  cursor: pointer;
  transition: all 0.2s;
}

.chip-btn.ghost:hover {
  border-color: var(--gold);
  color: var(--gold);
  box-shadow: 0 0 8px var(--gold-glow);
}

.chip-btn.danger:hover {
  border-color: var(--rune-flame);
  color: var(--rune-flame);
  box-shadow: 0 0 8px rgba(202, 133, 120, 0.16);
}

/* ==========================
   Hex rack grid
   ========================== */
.hex-rack {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(124px, 1fr));
  gap: 16px 14px;
}

.hex-tile {
  all: unset;
  cursor: pointer;
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 18px 8px 14px;
  text-align: center;
  transition: transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1.2);
}

.hex-tile:focus-visible { outline: 2px solid var(--gold); outline-offset: 4px; border-radius: var(--r-sm); }

.hex-shape {
  position: absolute;
  inset: 4px 0 0 0;
  pointer-events: none;
  display: block;
  clip-path: polygon(50% 0%, 95% 25%, 95% 75%, 50% 100%, 5% 75%, 5% 25%);
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.04) 0%, rgba(7, 7, 13, 0.5) 100%);
  border: 0;
}

.hex-shape::after {
  content: '';
  position: absolute;
  inset: 0;
  clip-path: polygon(50% 0%, 95% 25%, 95% 75%, 50% 100%, 5% 75%, 5% 25%);
  background:
    linear-gradient(145deg, rgba(255, 255, 255, 0.08) 0%, transparent 30%);
  mix-blend-mode: screen;
}

.hex-inner {
  position: absolute;
  inset: 2px;
  clip-path: polygon(50% 0%, 95% 25%, 95% 75%, 50% 100%, 5% 75%, 5% 25%);
  background: linear-gradient(180deg, rgba(19, 19, 37, 0.95), rgba(7, 7, 13, 0.95));
  border: 0;
  display: block;
  transition: background 0.3s;
}

.hex-core {
  position: absolute;
  inset: -2px;
  clip-path: polygon(50% 0%, 95% 25%, 95% 75%, 50% 100%, 5% 75%, 5% 25%);
  background: linear-gradient(180deg, var(--type-color, var(--gold)) 0%, transparent 100%);
  opacity: 0;
  transition: opacity 0.3s;
  display: block;
}

.hex-tile:hover {
  transform: translateY(-3px);
}

.hex-tile:hover .hex-core { opacity: 0.35; }
.hex-tile:hover .hex-inner { background: linear-gradient(180deg, rgba(35, 35, 61, 0.95), rgba(7, 7, 13, 0.95)); }

.hex-tile.active .hex-core { opacity: 0.35; }
.hex-tile.active .hex-inner {
  background:
    radial-gradient(circle at 50% 100%, color-mix(in srgb, var(--type-color, var(--gold)) 16%, transparent) 0%, transparent 60%),
    linear-gradient(180deg, rgba(44, 44, 74, 0.9), rgba(13, 13, 25, 0.95));
}

.hex-tile.active { filter: drop-shadow(0 0 8px color-mix(in srgb, var(--type-color, var(--gold)) 35%, transparent)); }

.hex-icon {
  position: relative;
  font-size: 1.9rem;
  z-index: 1;
  filter: drop-shadow(0 2px 6px rgba(0, 0, 0, 0.6));
  transition: transform 0.3s;
}

.hex-tile:hover .hex-icon { transform: scale(1.1) rotate(-3deg); }

.hex-name {
  position: relative;
  font-family: var(--font-display);
  color: var(--ink-primary);
  font-size: 0.78rem;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  z-index: 1;
}

.hex-tile.active .hex-name { color: var(--type-color, var(--gold)); }

.hex-count {
  position: relative;
  z-index: 1;
  font-family: var(--font-mono);
  color: var(--ink-muted);
  background: rgba(0, 0, 0, 0.45);
  border: 1px solid var(--line-dim);
  padding: 1px 8px;
  border-radius: var(--r-pill);
  font-size: 0.7rem;
  font-weight: 600;
  margin-top: 2px;
}

.hex-tile.active .hex-count {
  color: var(--bg-void);
  background: var(--type-color, var(--gold));
  border-color: transparent;
  box-shadow: 0 0 10px currentColor;
}

.hex-check {
  position: absolute;
  top: 10px;
  right: 12px;
  z-index: 2;
  width: 20px; height: 20px;
  border-radius: 50%;
  background: var(--type-color, var(--gold));
  color: var(--bg-void);
  font-size: 0.7rem;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transform: scale(0.5);
  transition: all 0.25s cubic-bezier(0.2, 0.8, 0.2, 1.3);
  box-shadow: 0 0 6px currentColor;
}

.hex-tile.active .hex-check {
  opacity: 1;
  transform: scale(1);
}

@media (max-width: 600px) {
  .hex-rack {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 12px 10px;
  }

  .filter-title {
    font-size: 1.1rem;
    letter-spacing: 0.04em;
  }

  .hex-tile {
    padding: 16px 6px 12px;
  }

  .hex-icon {
    font-size: 1.65rem;
  }

  .hex-name {
    font-size: 0.7rem;
    letter-spacing: 0.08em;
  }
}
</style>
