<template>
  <div class="filters-container">
    <div class="search-section">
      <div class="search-wrapper">
        <span class="search-icon">🔍</span>
        <input
          v-model="localFilters.search"
          type="text"
          placeholder="Search items by name or notes..."
          @keyup.enter="handleSubmit"
          class="search-input"
        />
      </div>
    </div>

    <div class="active-filters" v-if="hasActiveFilters">
      <span class="active-filters-label">Active Filters:</span>
      <div class="filter-tags">
        <span v-if="localFilters.search" class="filter-tag">
          Search: "{{ localFilters.search }}"
          <button @click="clearSearch" class="tag-close">×</button>
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
  emits: ['update', 'submit'],
  data() {
    return {
      localFilters: { ...this.filters }
    };
  },
  computed: {
    hasActiveFilters() {
      return this.localFilters.search;
    }
  },
  methods: {
    clearSearch() {
      this.localFilters.search = '';
      this.$emit('update', { ...this.localFilters });
      this.handleSubmit();
    },
    handleSubmit() {
      this.$emit('submit', (this.localFilters.search || '').trim());
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
      this.clearSearch();
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
