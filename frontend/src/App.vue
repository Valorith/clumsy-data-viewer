<template>
  <div id="app">
    <header class="app-header">
      <h1>⚔️ EverQuest Item Database</h1>
      <p class="subtitle">Browse and filter parsed item DPS data</p>
    </header>

    <main class="app-main">
      <StatsOverview v-if="stats" :stats="stats" />
      
      <ItemTypeFilter 
        :selectedTypes="selectedItemTypes"
        :typeCounts="stats ? stats.typeCounts : {}"
        @update="handleTypeFilterUpdate"
      />
      
      <ItemFilters :filters="filters" @update="handleFilterUpdate" />

      <div class="comparison-button-wrapper">
        <button @click="openGlobalComparison" class="global-comparison-btn">
          <span class="btn-icon">📊</span>
          Global DPS Comparison
        </button>
      </div>

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
          @click="openItemDetail(item)"
          style="cursor: pointer;"
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
      <p>EverQuest Item Database Viewer | Data sourced from items_parses table</p>
    </footer>

    <!-- Modals -->
    <ItemDetailModal
      :isOpen="isItemDetailOpen"
      :item="selectedItem || {}"
      :allItems="allItemsForComparison"
      @close="closeItemDetail"
    />

    <GlobalComparisonModal
      :isOpen="isGlobalComparisonOpen"
      :items="allItemsForComparison"
      @close="closeGlobalComparison"
    />
  </div>
</template>

<script>
import ItemCard from './components/ItemCard.vue';
import ItemFilters from './components/ItemFilters.vue';
import ItemTypeFilter from './components/ItemTypeFilter.vue';
import StatsOverview from './components/StatsOverview.vue';
import ItemDetailModal from './components/ItemDetailModal.vue';
import GlobalComparisonModal from './components/GlobalComparisonModal.vue';
import itemsApi from './api/items';

export default {
  name: 'App',
  components: {
    ItemCard,
    ItemFilters,
    ItemTypeFilter,
    StatsOverview,
    ItemDetailModal,
    GlobalComparisonModal
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
      selectedItemTypes: [],
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
      isGlobalComparisonOpen: false,
      selectedItem: {},
      allItemsForComparison: []
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
    }
  },
  mounted() {
    this.fetchStats();
    this.fetchItems();
    this.fetchAllItems();
  },
  methods: {
    async fetchItems() {
      this.loading = true;
      this.error = null;
      
      try {
        const params = {
          page: this.currentPage,
          pageSize: this.pageSize,
          ...this.filters,
          itemTypes: this.selectedItemTypes.length > 0 ? this.selectedItemTypes.join(',') : undefined
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
      this.filters = newFilters;
      this.currentPage = 1;
      this.fetchItems();
    },
    
    handleTypeFilterUpdate(newTypes) {
      this.selectedItemTypes = newTypes;
      this.currentPage = 1;
      this.fetchItems();
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
    
    async fetchAllItems() {
      try {
        // Fetch a reasonable amount of items for comparison
        const response = await itemsApi.getItems({ 
          pageSize: 500,
          sortBy: 'total_dps',
          sortOrder: 'desc'
        });
        this.allItemsForComparison = response.items;
      } catch (error) {
        console.error('Failed to fetch all items:', error);
        this.allItemsForComparison = this.items; // Fallback to current page items
      }
    },
    
    openItemDetail(item) {
      this.selectedItem = item;
      this.isItemDetailOpen = true;
    },
    
    closeItemDetail() {
      this.isItemDetailOpen = false;
    },
    
    openGlobalComparison() {
      this.isGlobalComparisonOpen = true;
    },
    
    closeGlobalComparison() {
      this.isGlobalComparisonOpen = false;
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
  grid-template-columns: repeat(auto-fill, minmax(450px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
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

.comparison-button-wrapper {
  display: flex;
  justify-content: center;
  margin: 24px 0;
}

.global-comparison-btn {
  background: linear-gradient(135deg, #89b4fa 0%, #74c7ec 100%);
  color: #1e1e2e;
  border: none;
  border-radius: 12px;
  padding: 16px 32px;
  font-size: 1.2rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 10px;
  transition: all 0.3s;
  box-shadow: 0 4px 12px rgba(137, 180, 250, 0.3);
}

.global-comparison-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(137, 180, 250, 0.4);
}

.global-comparison-btn:active {
  transform: translateY(0);
}

.btn-icon {
  font-size: 1.4rem;
}

@media (max-width: 1200px) {
  .items-container {
    grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
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
    grid-template-columns: 1fr;
  }
  
  .app-main {
    padding: 15px;
  }
}
</style>
