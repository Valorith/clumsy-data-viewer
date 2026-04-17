<template>
  <div id="app">
    <header class="app-header">
      <div class="header-aurora" aria-hidden="true">
        <span class="aurora aurora-a"></span>
        <span class="aurora aurora-b"></span>
        <span class="aurora aurora-c"></span>
      </div>
      <div class="header-embers" aria-hidden="true">
        <span v-for="n in 14" :key="n" class="ember" :style="emberStyle(n)"></span>
      </div>
      <div class="header-content">
        <div class="sigil" aria-hidden="true">
          <svg viewBox="0 0 64 64" width="64" height="64">
            <defs>
              <linearGradient id="sigilGrad" x1="0" x2="1" y1="0" y2="1">
                <stop offset="0%" stop-color="#f5d98a" />
                <stop offset="50%" stop-color="#e6c168" />
                <stop offset="100%" stop-color="#a87f2f" />
              </linearGradient>
            </defs>
            <circle cx="32" cy="32" r="28" fill="none" stroke="url(#sigilGrad)" stroke-width="1.5" opacity="0.7" />
            <circle cx="32" cy="32" r="22" fill="none" stroke="url(#sigilGrad)" stroke-width="1" opacity="0.5" />
            <path d="M32 10 L36 30 L54 32 L36 34 L32 54 L28 34 L10 32 L28 30 Z" fill="url(#sigilGrad)" opacity="0.95" />
            <circle cx="32" cy="32" r="3" fill="#f5d98a" />
          </svg>
        </div>
        <div class="title-stack">
          <div class="eyebrow">⚜ Clumsy's World Codex ⚜</div>
          <h1 class="app-title">Parse Viewer</h1>
          <p class="subtitle">A grimoire of weapon DPS, distilled from chronicled parses across Norrath</p>
        </div>
      </div>
      <div class="header-ruler" aria-hidden="true"></div>
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

      <section class="results-panel">
        <div class="results-header">
          <div class="results-title-block">
            <span class="results-glyph" aria-hidden="true">✦</span>
            <h2>Included Items</h2>
            <span class="results-count">{{ totalItems.toLocaleString() }}</span>
          </div>
          <div class="results-controls">
            <div class="view-toggle" role="tablist" aria-label="Included items view">
              <button
                type="button"
                :class="['view-chip', { active: itemView === 'cards' }]"
                @click="itemView = 'cards'"
              >
                Grid
              </button>
              <button
                type="button"
                :class="['view-chip', { active: itemView === 'table' }]"
                @click="itemView = 'table'"
              >
                Table
              </button>
            </div>
            <div class="page-size-selector">
              <label for="page-size">Per page</label>
              <select id="page-size" v-model.number="pageSize" @change="fetchItems">
                <option :value="25">25</option>
                <option :value="50">50</option>
                <option :value="100">100</option>
                <option :value="200">200</option>
              </select>
            </div>
          </div>
        </div>

        <div v-if="loading" class="loading">
          <div class="arcane-spinner" aria-hidden="true">
            <span></span><span></span><span></span>
          </div>
          <p>Summoning artifacts…</p>
        </div>

        <div v-else-if="error" class="error">
          <p>✦ A disturbance in the weave ✦</p>
          <p class="error-detail">{{ error }}</p>
          <button @click="fetchItems">Retry the divination</button>
        </div>

        <div v-else-if="items.length === 0" class="no-results">
          <div class="no-results-glyph" aria-hidden="true">⚔</div>
          <p>No artifacts match your incantation.</p>
          <p class="no-results-hint">Try loosening the filters above.</p>
        </div>

        <div v-else-if="itemView === 'cards'" class="items-container">
          <ItemCard
            v-for="item in items"
            :key="item.item_id"
            :item="item"
            @open="openItemDetail"
          />
        </div>

        <IncludedItemsTable
          v-else
          :items="items"
          @open="openItemDetail"
        />

        <div v-if="totalPages > 1" class="pagination">
          <button
            @click="changePage(currentPage - 1)"
            :disabled="currentPage === 1"
            class="page-btn page-nav"
          >
            ◂ Prev
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
            class="page-btn page-nav"
          >
            Next ▸
          </button>
        </div>
      </section>
    </main>

    <footer class="app-footer">
      <div class="footer-rule" aria-hidden="true"></div>
      <p>⚜ Clumsy's World Codex · Parse data from <code>items_parses</code> ⚜</p>
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
import IncludedItemsTable from './components/IncludedItemsTable.vue';
import itemsApi from './api/items';
import { formatNumber } from './utils/formatters';

export default {
  name: 'App',
  components: {
    ItemCard,
    ItemFilters,
    ItemTypeFilter,
    StatsOverview,
    ItemDetailModal,
    GlobalComparisonPanel,
    IncludedItemsTable
  },
  data() {
    return {
      items: [],
      stats: null,
      loading: false,
      error: null,
      currentPage: 1,
      pageSize: 50,
      itemView: 'table',
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
    formatNumber,
    emberStyle(index) {
      const seeds = [
        [8, 7.2, 1.1], [18, 9.4, 0.6], [28, 6.8, 1.4], [37, 8.6, 0.9],
        [47, 7.9, 1.2], [56, 6.1, 0.5], [64, 8.2, 1.3], [72, 7.4, 0.8],
        [80, 9.1, 1.0], [88, 6.6, 0.7], [92, 8.8, 1.1], [12, 7.7, 0.9],
        [22, 9.0, 0.6], [44, 8.3, 1.2]
      ];
      const [left, dur, delay] = seeds[(index - 1) % seeds.length];
      return {
        left: `${left}%`,
        animationDuration: `${dur}s`,
        animationDelay: `${delay}s`
      };
    },
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
        const params = {
          page: this.currentPage,
          pageSize: this.pageSize,
          ...this.filters,
          itemTypes: Array.isArray(this.selectedItemTypes) && this.selectedItemTypes.length > 0
            ? this.selectedItemTypes.join(',')
            : undefined
        };

        const response = await itemsApi.getItems(params);
        this.items = response.items;
        this.totalItems = response.pagination.total;
        this.totalPages = response.pagination.totalPages;

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

      const baseParams = {
        pageSize: 200,
        ...this.filters,
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
  font-family: var(--font-body);
  color: var(--ink-primary);
  line-height: 1.55;
}

#app {
  width: 100vw;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* =====================================================
   Header — cinematic aurora banner with drifting embers
   ===================================================== */
.app-header {
  position: relative;
  padding: 52px 5% 42px;
  text-align: center;
  overflow: hidden;
  background:
    linear-gradient(180deg, rgba(7, 7, 13, 0) 0%, rgba(7, 7, 13, 0.82) 100%),
    radial-gradient(circle at 50% 18%, rgba(230, 193, 104, 0.1), transparent 58%),
    linear-gradient(135deg, #0e0d19 0%, #17132a 52%, #0b0a15 100%);
  border-bottom: 1px solid var(--line-gold);
  box-shadow: 0 6px 28px rgba(0, 0, 0, 0.5);
}

.header-aurora {
  position: absolute;
  inset: 0;
  pointer-events: none;
  filter: blur(78px);
  opacity: 0.5;
}

.aurora {
  position: absolute;
  width: 60%;
  height: 160%;
  border-radius: 50%;
  animation: aurora-shift 12s ease-in-out infinite;
}
.aurora-a {
  top: -50%; left: -10%;
  background: radial-gradient(circle, rgba(136, 165, 204, 0.28), transparent 60%);
}
.aurora-b {
  top: -60%; right: -10%;
  background: radial-gradient(circle, rgba(162, 146, 200, 0.25), transparent 60%);
  animation-delay: -4s;
}
.aurora-c {
  bottom: -80%; left: 20%;
  background: radial-gradient(circle, rgba(230, 193, 104, 0.18), transparent 60%);
  animation-delay: -8s;
}

.header-embers {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
}

.ember {
  position: absolute;
  bottom: -6px;
  width: 2px;
  height: 2px;
  border-radius: 50%;
  background: radial-gradient(circle, #f5d98a, rgba(230, 193, 104, 0));
  animation: ember-drift linear infinite;
  opacity: 0;
}

.header-content {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: auto 1fr;
  align-items: center;
  gap: 24px;
  max-width: 1400px;
  margin: 0 auto;
  text-align: left;
}

.sigil {
  width: 64px;
  height: 64px;
  filter: drop-shadow(0 0 10px rgba(230, 193, 104, 0.24));
  animation: rune-pulse 4s ease-in-out infinite;
  opacity: 0.88;
}

.title-stack {
  text-align: center;
}

.eyebrow {
  font-family: var(--font-display);
  font-size: 0.78rem;
  letter-spacing: 0.42em;
  color: var(--gold);
  text-transform: uppercase;
  opacity: 0.82;
  margin-bottom: 6px;
}

.app-title {
  font-family: var(--font-display);
  font-size: clamp(2.15rem, 4vw, 3.2rem);
  font-weight: 700;
  letter-spacing: 0.07em;
  margin: 0;
  background: linear-gradient(100deg, #f2d592 0%, #e6c168 38%, #f3e4bb 55%, #d8b25d 78%, #a87f2f 100%);
  background-size: 200% auto;
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  text-shadow: 0 0 18px rgba(230, 193, 104, 0.12);
  animation: glyph-sweep 8s linear infinite;
}

.subtitle {
  color: var(--ink-secondary);
  font-size: 1rem;
  margin-top: 8px;
  font-style: italic;
  letter-spacing: 0.02em;
  max-width: 46rem;
  margin-left: auto;
  margin-right: auto;
}

.header-ruler {
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 60%;
  height: 2px;
  background: linear-gradient(90deg, transparent, var(--gold) 50%, transparent);
  opacity: 0.6;
}

/* =====================================================
   Main content
   ===================================================== */
.app-main {
  flex: 1;
  width: 100%;
  padding: 36px 5% 40px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.results-panel {
  background: linear-gradient(180deg, rgba(19, 19, 37, 0.78) 0%, rgba(13, 13, 25, 0.8) 100%);
  border: 1px solid var(--line-gold);
  border-radius: var(--r-lg);
  padding: 28px 30px;
  box-shadow: var(--shadow-card);
  position: relative;
}

.results-panel::before {
  content: '';
  position: absolute;
  top: -1px; left: 24px; right: 24px;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--gold) 50%, transparent);
}

.results-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 22px;
  gap: 16px;
  flex-wrap: wrap;
}

.results-title-block {
  display: flex;
  align-items: center;
  gap: 14px;
}

.results-controls {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.results-glyph {
  color: var(--gold);
  font-size: 1.3rem;
  animation: rune-pulse 3s ease-in-out infinite;
}

.results-header h2 {
  font-family: var(--font-display);
  color: var(--ink-primary);
  font-size: 1.6rem;
  margin: 0;
  letter-spacing: 0.05em;
}

.results-count {
  font-family: var(--font-mono);
  font-size: 0.95rem;
  color: var(--gold-bright);
  padding: 4px 12px;
  border: 1px solid var(--line-gold);
  border-radius: var(--r-pill);
  background: var(--gold-faint);
}

.view-toggle {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px;
  background: rgba(7, 7, 13, 0.58);
  border: 1px solid var(--line-gold);
  border-radius: var(--r-pill);
}

.view-chip {
  border-radius: var(--r-pill);
  padding: 8px 14px;
  font-family: var(--font-display);
  font-size: 0.68rem;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--ink-secondary);
}

.view-chip:hover {
  color: var(--gold);
  background: var(--gold-faint);
}

.view-chip.active {
  background: linear-gradient(135deg, var(--gold-deep), var(--gold));
  color: var(--bg-void);
  box-shadow: 0 0 10px var(--gold-glow);
  font-weight: 700;
}

.page-size-selector {
  display: flex;
  align-items: center;
  gap: 10px;
}

.page-size-selector label {
  font-family: var(--font-display);
  color: var(--ink-muted);
  font-size: 0.75rem;
  letter-spacing: 0.2em;
  text-transform: uppercase;
}

.page-size-selector select {
  padding: 7px 14px;
  border: 1px solid var(--line-gold);
  border-radius: var(--r-sm);
  background: rgba(7, 7, 13, 0.6);
  color: var(--ink-primary);
  font-size: 0.9rem;
  font-family: var(--font-mono);
  cursor: pointer;
  transition: all 0.2s;
}

.page-size-selector select:hover {
  border-color: var(--gold);
  box-shadow: 0 0 0 2px var(--gold-faint);
}

.items-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

/* =====================================================
   Loading — orbiting runes
   ===================================================== */
.loading {
  text-align: center;
  padding: 80px 20px;
  color: var(--ink-secondary);
  font-family: var(--font-display);
  letter-spacing: 0.14em;
  text-transform: uppercase;
  font-size: 0.85rem;
}

.arcane-spinner {
  position: relative;
  width: 64px;
  height: 64px;
  margin: 0 auto 24px;
}

.arcane-spinner span {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 2px solid transparent;
  border-top-color: var(--gold);
  animation: spin 1.4s linear infinite;
}

.arcane-spinner span:nth-child(2) {
  inset: 8px;
  border-top-color: var(--rune-mana);
  animation-duration: 1.1s;
  animation-direction: reverse;
}

.arcane-spinner span:nth-child(3) {
  inset: 16px;
  border-top-color: var(--rune-jade);
  animation-duration: 0.8s;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* =====================================================
   Error / No results
   ===================================================== */
.error {
  text-align: center;
  padding: 48px 32px;
  background: rgba(239, 107, 107, 0.06);
  border: 1px solid rgba(239, 107, 107, 0.35);
  border-radius: var(--r-md);
}

.error p {
  color: var(--rune-flame);
  font-family: var(--font-display);
  letter-spacing: 0.1em;
  margin-bottom: 12px;
}

.error-detail {
  color: var(--ink-secondary);
  font-family: var(--font-mono);
  font-size: 0.85rem;
  margin-bottom: 20px;
}

.error button {
  padding: 10px 22px;
  background: transparent;
  color: var(--rune-flame);
  border: 1px solid var(--rune-flame);
  border-radius: var(--r-sm);
  font-size: 0.9rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  cursor: pointer;
  transition: all 0.2s;
}

.error button:hover {
  background: rgba(239, 107, 107, 0.15);
  box-shadow: 0 0 12px rgba(239, 107, 107, 0.18);
}

.no-results {
  text-align: center;
  padding: 80px 24px;
  background: rgba(19, 19, 37, 0.55);
  border: 1px dashed var(--line-gold);
  border-radius: var(--r-lg);
}

.no-results-glyph {
  font-size: 3rem;
  opacity: 0.35;
  filter: grayscale(0.3);
  margin-bottom: 16px;
}

.no-results p {
  color: var(--ink-secondary);
  font-family: var(--font-display);
  letter-spacing: 0.1em;
}

.no-results-hint {
  color: var(--ink-muted) !important;
  font-size: 0.85rem;
  margin-top: 6px;
  font-style: italic;
  letter-spacing: 0.02em !important;
}

/* =====================================================
   Pagination — rune stepper
   ===================================================== */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;
  margin: 20px 0 4px;
}

.page-numbers {
  display: flex;
  gap: 6px;
  padding: 4px;
  background: rgba(7, 7, 13, 0.55);
  border: 1px solid var(--line-gold);
  border-radius: var(--r-pill);
}

.page-btn {
  padding: 8px 14px;
  min-width: 40px;
  background: transparent;
  color: var(--ink-secondary);
  border: 1px solid transparent;
  border-radius: var(--r-pill);
  font-size: 0.9rem;
  font-family: var(--font-mono);
  cursor: pointer;
  transition: all 0.2s;
}

.page-btn:hover:not(:disabled) {
  color: var(--gold);
  background: var(--gold-faint);
}

.page-btn.active {
  background: linear-gradient(135deg, var(--gold-deep), var(--gold));
  color: var(--bg-void);
  font-weight: 700;
  box-shadow: 0 0 10px var(--gold-glow);
}

.page-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.page-nav {
  border: 1px solid var(--line-gold);
  border-radius: var(--r-pill);
  background: rgba(7, 7, 13, 0.55);
  padding: 8px 18px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  font-size: 0.75rem;
}

.page-nav:hover:not(:disabled) {
  border-color: var(--gold);
  color: var(--gold);
  box-shadow: 0 0 10px var(--gold-glow);
}

/* =====================================================
   Footer
   ===================================================== */
.app-footer {
  padding: 24px 20px 28px;
  text-align: center;
  color: var(--ink-muted);
  font-family: var(--font-display);
  letter-spacing: 0.15em;
  font-size: 0.78rem;
  margin-top: auto;
  position: relative;
}

.footer-rule {
  max-width: 500px;
  height: 1px;
  margin: 0 auto 18px;
  background: linear-gradient(90deg, transparent, var(--gold) 50%, transparent);
  opacity: 0.5;
}

.app-footer code {
  font-family: var(--font-mono);
  color: var(--gold);
  background: var(--gold-faint);
  padding: 2px 6px;
  border-radius: var(--r-xs);
  letter-spacing: 0;
}

/* =====================================================
   Toast
   ===================================================== */
.toast-container {
  position: fixed;
  top: 28px;
  right: 28px;
  z-index: 2000;
  pointer-events: none;
}

.toast-message {
  background: linear-gradient(135deg, rgba(26, 26, 46, 0.97), rgba(19, 19, 37, 0.97));
  color: var(--ink-primary);
  padding: 14px 22px;
  border-radius: var(--r-md);
  box-shadow: var(--shadow-deep), 0 0 12px var(--gold-glow);
  border: 1px solid var(--line-gold);
  font-size: 0.95rem;
  max-width: 360px;
  font-family: var(--font-body);
  position: relative;
}

.toast-message::before {
  content: '✦';
  color: var(--gold);
  margin-right: 8px;
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

@media (max-width: 1000px) {
  .header-content {
    grid-template-columns: 1fr;
    text-align: center;
    gap: 16px;
  }
}

@media (max-width: 768px) {
  .app-header {
    padding: 40px 4% 32px;
  }

  .eyebrow {
    font-size: 0.72rem;
    letter-spacing: 0.3em;
  }

  .app-title {
    letter-spacing: 0.05em;
  }

  .results-header {
    flex-direction: column;
    gap: 14px;
    align-items: stretch;
  }

  .results-title-block {
    justify-content: space-between;
    flex-wrap: wrap;
  }

  .results-controls {
    justify-content: stretch;
    flex-direction: column;
    align-items: stretch;
  }

  .view-toggle {
    width: 100%;
  }

  .view-chip {
    flex: 1;
    text-align: center;
  }

  .page-size-selector {
    width: 100%;
    justify-content: space-between;
  }

  .pagination {
    flex-wrap: wrap;
  }

  .items-container {
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  }

  .app-main {
    padding: 24px 4% 32px;
  }

  .results-panel {
    padding: 22px 18px;
  }

  .results-header h2 {
    font-size: 1.35rem;
  }
}
</style>
