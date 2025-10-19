<template>
  <div id="app">
    <header class="app-header">
      <h1>⚔️ Clumsy's World Parse Viewer</h1>
      <p class="subtitle">Browse and filter parsed item DPS data</p>
    </header>

    <main class="app-main">
      <StatsOverview v-if="stats" :stats="stats" />
      
      <ItemTypeFilter 
        :selectedTypes="selectedItemTypes"
        :typeCounts="stats ? stats.typeCounts : {}"
        @update="handleTypeFilterUpdate"
      />
      
      <ItemFilters :filters="filters" @update="handleFilterUpdate" @submit="handleSearchSubmit" />

      <GlobalComparisonPanel
        ref="comparisonPanel"
        :items="allItemsForComparison"
        :loading="comparisonLoading"
        :on-item-select="openItemDetail"
        :highlight-term="trimmedSearchTerm"
      />

      <div class="results-header">
        <h2>Items ({{ totalItems }} total)</h2>
        <div class="page-size-selector">
          <label>Items per page:</label>
          <select v-model.number="pageSize" @change="fetchItems">
            <option :value="25">25</option>
            <option :value="50">50</option>
            <option :value="100">100</option>
            <option :value="200">200</option>
          </select>
        </div>
      </div>

      <div v-if="loading" class="loading">
        <div class="spinner"></div>
        <p>Loading items...</p>
      </div>

      <div v-else-if="error" class="error">
        <p>Error loading items: {{ error }}</p>
        <button @click="fetchItems">Retry</button>
      </div>

      <div v-else-if="items.length === 0" class="no-results">
        <p>No items found matching your filters.</p>
      </div>

      <div v-else class="items-container">
        <ItemCard 
          v-for="item in items" 
          :key="item.item_id" 
          :item="item"
          @open="openItemDetail"
        />
      </div>

      <div v-if="totalPages > 1" class="pagination">
        <button 
          @click="changePage(currentPage - 1)" 
          :disabled="currentPage === 1"
          class="page-btn"
        >
          Previous
        </button>
        
        <div class="page-numbers">
          <button 
            v-for="page in visiblePages" 
            :key="page"
            @click="changePage(page)"
            :class="['page-btn', { active: page === currentPage }]"
          >
            {{ page }}
          </button>
        </div>
        
        <button 
          @click="changePage(currentPage + 1)" 
          :disabled="currentPage === totalPages"
          class="page-btn"
        >
          Next
        </button>
      </div>
    </main>

    <footer class="app-footer">
      <p>Clumsy's World Parse Viewer | Data sourced from items_parses table</p>
    </footer>

    <!-- Modals -->
    <ItemDetailModal
      :isOpen="isItemDetailOpen"
      :item="selectedItem || {}"
      :allItems="allItemsForComparison"
      @close="closeItemDetail"
    />

    <transition name="toast">
      <div v-if="toastVisible" class="toast-container">
        <div class="toast-message">{{ toastMessage }}</div>
      </div>
    </transition>
  </div>
</template>

<script>
import ItemCard from './components/ItemCard.vue';
import ItemFilters from './components/ItemFilters.vue';
import ItemTypeFilter from './components/ItemTypeFilter.vue';
import StatsOverview from './components/StatsOverview.vue';
import ItemDetailModal from './components/ItemDetailModal.vue';
import GlobalComparisonPanel from './components/GlobalComparisonPanel.vue';
import itemsApi from './api/items';

export default {
  name: 'App',
  components: {
    ItemCard,
    ItemFilters,
    ItemTypeFilter,
    StatsOverview,
    ItemDetailModal,
    GlobalComparisonPanel
  },
  data() {
    return {
      items: [],
      stats: null,
      loading: false,
      error: null,
      currentPage: 1,
      pageSize: 50,
      totalItems: 0,
      totalPages: 0,
      selectedItemTypes: null,
      typeCounts: {},
      filters: {
        search: '',
        minMeleeDps: 0,
        maxMeleeDps: 9999,
        minSpellDps: 0,
        maxSpellDps: 9999,
        hasBane: false,
        hasBackstab: false,
        sortBy: 'item_id',
        sortOrder: 'asc',
        itemTypes: []
      },
      isItemDetailOpen: false,
      selectedItem: {},
      allItemsForComparison: [],
      comparisonLoading: false,
      latestComparisonRequestId: 0,
      toastVisible: false,
      toastMessage: '',
      toastTimeout: null
    };
  },
  computed: {
    visiblePages() {
      const pages = [];
      const maxVisible = 7;
      let start = Math.max(1, this.currentPage - 3);
      let end = Math.min(this.totalPages, start + maxVisible - 1);
      
      if (end - start < maxVisible - 1) {
        start = Math.max(1, end - maxVisible + 1);
      }
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      
      return pages;
    },
    trimmedSearchTerm() {
      return (this.filters.search || '').trim();
    }
  },
  mounted() {
    this.fetchStats();
    this.fetchItems();
    this.fetchComparisonItems();
  },
  methods: {
    async fetchItems() {
      this.loading = true;
      this.error = null;

      if (Array.isArray(this.selectedItemTypes) && this.selectedItemTypes.length === 0) {
        this.items = [];
        this.totalItems = 0;
        this.totalPages = 0;
        this.loading = false;
        return;
      }

      try {
        const { search, ...filterParams } = this.filters;
        const params = {
          page: this.currentPage,
          pageSize: this.pageSize,
          ...filterParams,
          itemTypes: Array.isArray(this.selectedItemTypes) && this.selectedItemTypes.length > 0
            ? this.selectedItemTypes.join(',')
            : undefined
        };
        
        const response = await itemsApi.getItems(params);
        this.items = response.items;
        this.totalItems = response.pagination.total;
        this.totalPages = response.pagination.totalPages;
        
        // Update type counts
        this.updateTypeCounts(response.items);
      } catch (error) {
        this.error = error.message;
        console.error('Failed to fetch items:', error);
      } finally {
        this.loading = false;
      }
    },
    
    async fetchStats() {
      try {
        this.stats = await itemsApi.getStats();
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      }
    },
    
    handleFilterUpdate(newFilters) {
      const { search, ...rest } = newFilters;
      this.filters = { ...rest, search };
      this.currentPage = 1;
      this.fetchItems();
      this.fetchComparisonItems();
    },
    handleSearchSubmit(term) {
      const trimmed = (term || '').trim();
      const nextFilters = { ...this.filters, search: trimmed };
      if (this.filters.search !== trimmed) {
        this.handleFilterUpdate(nextFilters);
      } else {
        this.filters.search = trimmed;
      }

      this.$nextTick(() => {
        requestAnimationFrame(() => {
          this.scrollToComparisonPanel();
          this.highlightFirstMatch(trimmed);
        });
      });
    },
    highlightFirstMatch(term) {
      const trimmed = (term || '').trim();
      const panel = this.$refs.comparisonPanel;
      if (!panel) {
        if (trimmed) {
          this.showToast(`No items found for "${trimmed}"`);
        }
        return;
      }

      if (typeof panel.focusFirstHighlight === 'function') {
        const found = panel.focusFirstHighlight();
        if (!found && trimmed) {
          this.showToast(`No items found for "${trimmed}"`);
        }
        return;
      }

      // Fallback: if the panel doesn't expose focusFirstHighlight,
      // rely on internal highlight state.
      if (trimmed) {
        this.showToast(`No items found for "${trimmed}"`);
      }
    },
    
    handleTypeFilterUpdate(newTypes) {
      this.selectedItemTypes = newTypes;
      this.currentPage = 1;
      this.fetchItems();
      this.fetchComparisonItems();
    },
    
    updateTypeCounts(items) {
      const counts = {};
      items.forEach(item => {
        const type = item.itemtype;
        counts[type] = (counts[type] || 0) + 1;
      });
      this.typeCounts = counts;
    },
    
    changePage(page) {
      if (page >= 1 && page <= this.totalPages) {
        this.currentPage = page;
        this.fetchItems();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    },
    
    async fetchComparisonItems() {
      const requestId = Date.now();
      this.latestComparisonRequestId = requestId;
      this.comparisonLoading = true;

      if (Array.isArray(this.selectedItemTypes) && this.selectedItemTypes.length === 0) {
        if (this.latestComparisonRequestId === requestId) {
          this.allItemsForComparison = [];
          this.comparisonLoading = false;
        }
        return;
      }

      const { itemTypes: _discarded, search: _searchTerm, ...filterParams } = this.filters;
      const baseParams = {
        pageSize: 200,
        ...filterParams,
        itemTypes: Array.isArray(this.selectedItemTypes) && this.selectedItemTypes.length > 0
          ? this.selectedItemTypes.join(',')
          : undefined
      };

      let page = 1;
      let totalPages = 1;
      const aggregated = [];

      try {
        do {
          if (this.latestComparisonRequestId !== requestId) {
            break;
          }

          const response = await itemsApi.getItems({ ...baseParams, page });
          const currentItems = Array.isArray(response.items) ? response.items : [];
          aggregated.push(...currentItems);

          const pagination = response.pagination || {};
          totalPages = pagination.totalPages || 1;

          if (!currentItems.length || page >= totalPages) {
            break;
          }

          page += 1;
        } while (page <= totalPages);

        if (this.latestComparisonRequestId === requestId) {
          this.allItemsForComparison = aggregated;
        }
      } catch (error) {
        console.error('Failed to fetch comparison items:', error);
        if (this.latestComparisonRequestId === requestId) {
          this.allItemsForComparison = this.items;
        }
      } finally {
        if (this.latestComparisonRequestId === requestId) {
          this.comparisonLoading = false;
        }
      }
    },
    
    openItemDetail(item) {
      this.selectedItem = item;
      this.isItemDetailOpen = true;
    },
    
    closeItemDetail() {
      this.isItemDetailOpen = false;
    },
    scrollToComparisonPanel() {
      const panelRef = this.$refs.comparisonPanel;
      const el = panelRef?.$el || panelRef;
      if (el && typeof el.scrollIntoView === 'function') {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    },
    showToast(message) {
      if (this.toastTimeout) {
        clearTimeout(this.toastTimeout);
        this.toastTimeout = null;
      }
      this.toastMessage = message;
      this.toastVisible = true;
      this.toastTimeout = setTimeout(() => {
        this.toastVisible = false;
        this.toastTimeout = null;
      }, 3000);
    }
  },
  beforeUnmount() {
    if (this.toastTimeout) {
      clearTimeout(this.toastTimeout);
      this.toastTimeout = null;
    }
  }
};
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  width: 100%;
  height: 100%;
  overflow-x: hidden;
}

body {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: #11111b;
  color: #cdd6f4;
  line-height: 1.6;
}

#app {
  width: 100vw;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.app-header {
  background: linear-gradient(135deg, #1e1e2e 0%, #313244 100%);
  padding: 30px 20px;
  text-align: center;
  border-bottom: 2px solid #45475a;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
}

.app-header h1 {
  font-size: 2.5rem;
  color: #cdd6f4;
  margin-bottom: 8px;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
}

.subtitle {
  color: #a6adc8;
  font-size: 1.1rem;
}

.app-main {
  flex: 1;
  width: 100%;
  padding: 20px 5%;
  max-width: none;
}

.results-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 0 5px;
}

.results-header h2 {
  color: #cdd6f4;
  font-size: 1.5rem;
}

.page-size-selector {
  display: flex;
  align-items: center;
  gap: 10px;
}

.page-size-selector label {
  color: #a6adc8;
  font-size: 0.95rem;
}

.page-size-selector select {
  padding: 6px 10px;
  border: 1px solid #45475a;
  border-radius: 4px;
  background: #313244;
  color: #cdd6f4;
  font-size: 0.95rem;
  cursor: pointer;
}

.items-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 14px 16px;
  margin-bottom: 20px;
}

.loading {
  text-align: center;
  padding: 60px 20px;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 4px solid #313244;
  border-top: 4px solid #89b4fa;
  border-radius: 50%;
  margin: 0 auto 20px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error {
  text-align: center;
  padding: 40px;
  background: #313244;
  border-radius: 8px;
  border: 1px solid #f38ba8;
}

.error p {
  color: #f38ba8;
  margin-bottom: 15px;
}

.error button {
  padding: 8px 20px;
  background: #f38ba8;
  color: #1e1e2e;
  border: none;
  border-radius: 4px;
  font-size: 0.95rem;
  cursor: pointer;
  transition: background 0.2s;
}

.error button:hover {
  background: #eba0ac;
}

.no-results {
  text-align: center;
  padding: 60px;
  background: #1e1e2e;
  border-radius: 8px;
  color: #a6adc8;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
  margin: 30px 0;
}

.page-numbers {
  display: flex;
  gap: 5px;
}

.page-btn {
  padding: 8px 12px;
  min-width: 40px;
  background: #313244;
  color: #cdd6f4;
  border: 1px solid #45475a;
  border-radius: 4px;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.2s;
}

.page-btn:hover:not(:disabled) {
  background: #45475a;
  border-color: #89b4fa;
}

.page-btn.active {
  background: #89b4fa;
  color: #1e1e2e;
  border-color: #89b4fa;
  font-weight: 600;
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.app-footer {
  background: #1e1e2e;
  padding: 20px;
  text-align: center;
  color: #6c7086;
  border-top: 1px solid #313244;
  margin-top: auto;
}


.toast-container {
  position: fixed;
  top: 24px;
  right: 24px;
  z-index: 2000;
  pointer-events: none;
}

.toast-message {
  background: rgba(24, 24, 37, 0.95);
  color: #cdd6f4;
  padding: 12px 18px;
  border-radius: 10px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
  border: 1px solid rgba(137, 180, 250, 0.4);
  font-size: 0.95rem;
  max-width: 320px;
}

.toast-enter-active,
.toast-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

@media (max-width: 1200px) {
  .items-container {
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    gap: 12px;
  }
  
  .app-main {
    padding: 20px;
  }
}

@media (max-width: 768px) {
  .app-header h1 {
    font-size: 2rem;
  }
  
  .results-header {
    flex-direction: column;
    gap: 15px;
    align-items: flex-start;
  }
  
  .pagination {
    flex-wrap: wrap;
  }
  
  .items-container {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  }
  
  .app-main {
    padding: 15px;
  }
}
</style>
