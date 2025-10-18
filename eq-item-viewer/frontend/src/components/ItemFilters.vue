<template>
  <div class="filters-container">
    <div class="search-section">
      <div class="search-wrapper">
        <span class="search-icon">🔍</span>
        <input
          v-model="localFilters.search"
          type="text"
          placeholder="Search items by name or notes..."
          @input="debouncedUpdate"
          class="search-input"
        />
      </div>
    </div>

    <div class="filters-grid">
      <div class="filter-card dps-filters">
        <h4 class="filter-card-title"><span class="title-icon">⚔</span> DPS Ranges</h4>
        <div class="dps-grid">
          <div class="range-input-group">
            <label>MH DPS Range</label>
            <div class="range-inputs">
              <input
                v-model.number="localFilters.minMeleeDps"
                type="number"
                min="0"
                step="1"
                placeholder="Min"
                @change="updateFilters"
              />
              <span class="range-separator">—</span>
              <input
                v-model.number="localFilters.maxMeleeDps"
                type="number"
                min="0"
                step="1"
                placeholder="Max"
                @change="updateFilters"
              />
            </div>
          </div>

          <div class="range-input-group">
            <label>Spell DPS Range</label>
            <div class="range-inputs">
              <input
                v-model.number="localFilters.minSpellDps"
                type="number"
                min="0"
                step="1"
                placeholder="Min"
                @change="updateFilters"
              />
              <span class="range-separator">—</span>
              <input
                v-model.number="localFilters.maxSpellDps"
                type="number"
                min="0"
                step="1"
                placeholder="Max"
                @change="updateFilters"
              />
            </div>
          </div>
        </div>
      </div>

      <div class="filter-card special-filters">
        <h4 class="filter-card-title"><span class="title-icon">✨</span> Special Properties</h4>
        <div class="toggle-group">
          <div 
            :class="['toggle-card', { active: localFilters.hasBane }]"
            @click="localFilters.hasBane = !localFilters.hasBane; updateFilters()"
          >
            <span class="toggle-icon">💀</span>
            <span class="toggle-label">Bane DPS</span>
            <div class="toggle-indicator"></div>
          </div>
          <div 
            :class="['toggle-card', { active: localFilters.hasBackstab }]"
            @click="localFilters.hasBackstab = !localFilters.hasBackstab; updateFilters()"
          >
            <span class="toggle-icon">🗡</span>
            <span class="toggle-label">Backstab</span>
            <div class="toggle-indicator"></div>
          </div>
        </div>
      </div>

      <div class="filter-card sort-filters">
        <h4 class="filter-card-title"><span class="title-icon">📊</span> Sorting</h4>
        <div class="sort-options">
          <select
            v-model="localFilters.sortBy"
            @change="updateFilters"
            class="sort-select"
          >
            <option value="item_id">Item ID</option>
            <option value="name">Name</option>
            <option value="mh_dps">MH DPS</option>
            <option value="mh_spell_dps">Spell DPS</option>
            <option value="total_dps">Total DPS</option>
            <option value="bane_dps">Bane DPS</option>
            <option value="bs_dps">Backstab DPS</option>
          </select>
          <div class="sort-direction">
            <button
              :class="['sort-btn', { active: localFilters.sortOrder === 'asc' }]"
              @click="localFilters.sortOrder = 'asc'; updateFilters()"
              title="Ascending"
            >
              ↑
            </button>
            <button
              :class="['sort-btn', { active: localFilters.sortOrder === 'desc' }]"
              @click="localFilters.sortOrder = 'desc'; updateFilters()"
              title="Descending"
            >
              ↓
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="active-filters" v-if="hasActiveFilters">
      <span class="active-filters-label">Active Filters:</span>
      <div class="filter-tags">
        <span v-if="localFilters.search" class="filter-tag">
          Search: "{{ localFilters.search }}"
          <button @click="localFilters.search = ''; updateFilters()" class="tag-close">×</button>
        </span>
        <span v-if="localFilters.minMeleeDps > 0 || localFilters.maxMeleeDps < 9999" class="filter-tag">
          MH DPS: {{ localFilters.minMeleeDps }}-{{ localFilters.maxMeleeDps }}
          <button @click="localFilters.minMeleeDps = 0; localFilters.maxMeleeDps = 9999; updateFilters()" class="tag-close">×</button>
        </span>
        <span v-if="localFilters.hasBane" class="filter-tag">
          Has Bane
          <button @click="localFilters.hasBane = false; updateFilters()" class="tag-close">×</button>
        </span>
        <span v-if="localFilters.hasBackstab" class="filter-tag">
          Has Backstab
          <button @click="localFilters.hasBackstab = false; updateFilters()" class="tag-close">×</button>
        </span>
      </div>
      <button @click="resetFilters" class="clear-all-btn">Clear All</button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ItemFilters',
  props: {
    filters: {
      type: Object,
      required: true
    }
  },
  emits: ['update'],
  data() {
    return {
      localFilters: { ...this.filters },
      debounceTimer: null
    };
  },
  computed: {
    hasActiveFilters() {
      return this.localFilters.search ||
        this.localFilters.minMeleeDps > 0 ||
        this.localFilters.maxMeleeDps < 9999 ||
        this.localFilters.minSpellDps > 0 ||
        this.localFilters.maxSpellDps < 9999 ||
        this.localFilters.hasBane ||
        this.localFilters.hasBackstab;
    }
  },
  methods: {
    updateFilters() {
      this.$emit('update', { ...this.localFilters });
    },
    debouncedUpdate() {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = setTimeout(() => {
        this.updateFilters();
      }, 300);
    },
    resetFilters() {
      this.localFilters = {
        search: '',
        minMeleeDps: 0,
        maxMeleeDps: 9999,
        minSpellDps: 0,
        maxSpellDps: 9999,
        hasBane: false,
        hasBackstab: false,
        sortBy: 'item_id',
        sortOrder: 'asc'
      };
      this.updateFilters();
    }
  },
  watch: {
    filters: {
      handler(newFilters) {
        this.localFilters = { ...newFilters };
      },
      deep: true
    }
  }
};
</script>

<style scoped>
.filters-container {
  margin-bottom: 24px;
}

.search-section {
  margin-bottom: 20px;
}

.search-wrapper {
  position: relative;
  background: linear-gradient(135deg, #2a2a3e 0%, #1e1e2e 100%);
  border-radius: 16px;
  padding: 4px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
}

.search-icon {
  position: absolute;
  left: 20px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 1.5rem;
  filter: grayscale(20%);
}

.search-input {
  width: 100%;
  padding: 16px 16px 16px 56px;
  border: 2px solid transparent;
  border-radius: 12px;
  background: rgba(49, 50, 68, 0.5);
  color: #cdd6f4;
  font-size: 1.05rem;
  transition: all 0.3s;
}

.search-input:focus {
  outline: none;
  border-color: #89b4fa;
  background: rgba(49, 50, 68, 0.8);
  box-shadow: 0 0 0 4px rgba(137, 180, 250, 0.1);
}

.filters-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
}

.filter-card {
  background: linear-gradient(135deg, #2a2a3e 0%, #313244 100%);
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  transition: transform 0.2s, box-shadow 0.2s;
}

.filter-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.3);
}

.filter-card-title {
  color: #cdd6f4;
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0 0 16px 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.title-icon {
  font-size: 1.3rem;
  display: inline-block;
  width: 28px;
  text-align: center;
}

.dps-grid {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.range-input-group label {
  display: block;
  color: #a6adc8;
  font-size: 0.9rem;
  margin-bottom: 8px;
  font-weight: 500;
}

.range-inputs {
  display: flex;
  align-items: center;
  gap: 8px;
}

.range-inputs input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #45475a;
  border-radius: 8px;
  background: rgba(17, 17, 27, 0.5);
  color: #cdd6f4;
  font-size: 0.95rem;
  transition: all 0.2s;
}

.range-inputs input:focus {
  outline: none;
  border-color: #89b4fa;
  background: rgba(17, 17, 27, 0.8);
}

.range-separator {
  color: #6c7086;
  font-weight: 500;
}

.toggle-group {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.toggle-card {
  background: rgba(17, 17, 27, 0.5);
  border: 2px solid transparent;
  border-radius: 12px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.3s;
  text-align: center;
  position: relative;
  overflow: hidden;
}

.toggle-card:hover {
  border-color: #45475a;
  background: rgba(69, 71, 90, 0.2);
}

.toggle-card.active {
  border-color: #89b4fa;
  background: rgba(137, 180, 250, 0.15);
}

.toggle-icon {
  display: block;
  font-size: 1.8rem;
  margin-bottom: 8px;
}

.toggle-label {
  color: #cdd6f4;
  font-size: 0.9rem;
  font-weight: 500;
}

.toggle-indicator {
  position: absolute;
  bottom: 8px;
  left: 50%;
  transform: translateX(-50%);
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #6c7086;
  transition: all 0.3s;
}

.toggle-card.active .toggle-indicator {
  background: #89b4fa;
  box-shadow: 0 0 8px rgba(137, 180, 250, 0.6);
}

.sort-options {
  display: flex;
  gap: 12px;
  align-items: stretch;
}

.sort-select {
  flex: 1;
  padding: 10px 14px;
  border: 1px solid #45475a;
  border-radius: 8px;
  background: rgba(17, 17, 27, 0.5);
  color: #cdd6f4;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.2s;
}

.sort-select:focus {
  outline: none;
  border-color: #89b4fa;
}

.sort-direction {
  display: flex;
  border: 1px solid #45475a;
  border-radius: 8px;
  overflow: hidden;
}

.sort-btn {
  padding: 0 16px;
  background: rgba(17, 17, 27, 0.5);
  border: none;
  color: #6c7086;
  font-size: 1.2rem;
  cursor: pointer;
  transition: all 0.2s;
}

.sort-btn:first-child {
  border-right: 1px solid #45475a;
}

.sort-btn:hover {
  background: rgba(69, 71, 90, 0.3);
}

.sort-btn.active {
  background: rgba(137, 180, 250, 0.2);
  color: #89b4fa;
}

.active-filters {
  background: linear-gradient(135deg, rgba(137, 180, 250, 0.1) 0%, rgba(116, 199, 236, 0.1) 100%);
  border: 1px solid rgba(137, 180, 250, 0.3);
  border-radius: 12px;
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.active-filters-label {
  color: #89b4fa;
  font-size: 0.9rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.filter-tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  flex: 1;
}

.filter-tag {
  background: rgba(137, 180, 250, 0.2);
  color: #cdd6f4;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 0.85rem;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  animation: slideIn 0.3s ease;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.tag-close {
  background: none;
  border: none;
  color: #f38ba8;
  font-size: 1.1rem;
  cursor: pointer;
  padding: 0;
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.2s;
}

.tag-close:hover {
  background: rgba(243, 139, 168, 0.2);
}

.clear-all-btn {
  background: rgba(243, 139, 168, 0.2);
  border: 1px solid rgba(243, 139, 168, 0.3);
  color: #f38ba8;
  padding: 6px 16px;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.clear-all-btn:hover {
  background: rgba(243, 139, 168, 0.3);
  transform: translateY(-1px);
}
</style>