<template>
  <div id="app" class="ledger-app">
    <header class="ledger-topbar">
      <div class="brand-cluster">
        <button
          class="icon-button"
          type="button"
          aria-label="Toggle filters"
          aria-controls="filter-rail"
          :aria-expanded="filtersOpen ? 'true' : 'false'"
          @click="filtersOpen = !filtersOpen"
        >
          <span></span><span></span><span></span>
        </button>
        <div class="brand-rule" aria-hidden="true"></div>
        <div>
          <h1>Parse Viewer</h1>
          <p>Ledger Workbench</p>
        </div>
      </div>

      <div class="source-strip">
        <span>Data Source: <strong>items_parses</strong></span>
        <span class="dot" aria-hidden="true"></span>
        <span>{{ formatNumber(stats?.totalItems || totalItems) }} indexed</span>
        <span>Updated {{ lastRefreshedLabel }}</span>
        <button
          class="icon-button compact"
          type="button"
          :title="manualRefreshTitle"
          @click="requestManualRefresh"
          aria-label="Refresh"
        >R</button>
      </div>
    </header>

    <main :class="['ledger-shell', { 'filters-collapsed': !filtersOpen }]">
      <aside id="filter-rail" class="filter-rail" aria-label="Filters">
        <div class="rail-title">
          <h2>Filters</h2>
          <button class="bare-toggle" type="button" @click="resetFilters">Clear</button>
        </div>

        <section class="rail-section">
          <div class="section-heading">
            <h3>Weapon Type</h3>
            <button class="bare-toggle" type="button" @click="selectAllTypes">All</button>
          </div>

          <label class="check-row">
            <input
              type="checkbox"
              :checked="selectedItemTypes === null"
              @change="selectAllTypes"
            />
            <span>All Types</span>
            <em>{{ formatNumber(stats?.totalItems || totalItems) }}</em>
          </label>

          <label
            v-for="type in typeOptions"
            :key="type.id"
            class="check-row"
          >
            <input
              type="checkbox"
              :checked="isTypeActive(type.id)"
              @change="toggleType(type.id)"
            />
            <span>{{ type.name }}</span>
            <em>{{ formatNumber(typeCount(type.id)) }}</em>
          </label>
        </section>

        <section class="rail-section">
          <div class="section-heading">
            <h3>Restrictions</h3>
          </div>
          <div class="field-grid two">
            <label>
              <span>Min DPS</span>
              <input
                v-model.number="filters.minMeleeDps"
                type="number"
                min="0"
                @change="applyFilters"
              />
            </label>
            <label>
              <span>Max DPS</span>
              <input
                v-model.number="filters.maxMeleeDps"
                type="number"
                min="0"
                @change="applyFilters"
              />
            </label>
          </div>
          <label>
            <span>Sort Field</span>
            <select v-model="filters.sortBy" @change="applyFilters">
              <option value="item_id">Item ID</option>
              <option value="name">Name</option>
              <option value="total_dps">Total DPS</option>
              <option value="mh_dps">Main Hand DPS</option>
              <option value="mh_spell_dps">Spell DPS</option>
              <option value="bane_dps">Bane DPS</option>
              <option value="bs_dps">Backstab DPS</option>
            </select>
          </label>
          <label>
            <span>Sort Order</span>
            <select v-model="filters.sortOrder" @change="applyFilters">
              <option value="asc">Ascending</option>
              <option value="desc">Descending</option>
            </select>
          </label>
        </section>

        <section class="rail-section">
          <div class="section-heading">
            <h3>Advanced</h3>
          </div>
          <label class="check-row option">
            <input
              v-model="filters.hasBane"
              type="checkbox"
              @change="applyFilters"
            />
            <span>Bane Only</span>
          </label>
          <label class="check-row option">
            <input
              v-model="filters.hasBackstab"
              type="checkbox"
              @change="applyFilters"
            />
            <span>Backstab Only</span>
          </label>
        </section>
      </aside>

      <section class="workspace">
        <div class="command-strip">
          <label class="search-box">
            <span aria-hidden="true">Search</span>
            <input
              v-model="filters.search"
              type="search"
              placeholder="Search items"
              @keyup.enter="handleSearchSubmit"
            />
          </label>
          <button class="action-button" type="button" @click="handleSearchSubmit">Search</button>
          <button class="action-button" type="button" @click="exportVisibleRows">Copy CSV</button>
          <div class="load-status">
            {{ formatNumber(totalItems) }} items
            <span>{{ formatNumber(items.length) }} loaded</span>
          </div>
        </div>

        <GlobalComparisonPanel
          ref="globalComparisonPanel"
          :items="allItemsForComparison.length ? allItemsForComparison : items"
          :loading="comparisonLoading"
          :selected-item-id="selectedItem?.item_id"
          @select="selectItem"
        />

        <section class="table-panel">
          <div class="panel-head">
            <div>
              <h2>Included Items</h2>
              <p v-if="error" class="panel-note error-note">{{ error }}</p>
              <p v-else class="panel-note">Showing page {{ currentPage }} of {{ totalPages || 1 }}</p>
            </div>
            <div class="table-tools">
              <button
                class="action-button slim"
                type="button"
                :title="manualRefreshTitle"
                @click="requestManualRefresh"
              >
                Refresh
              </button>
              <label class="page-size">
                <span>Rows</span>
                <select v-model.number="pageSize" @change="fetchItems">
                  <option :value="25">25</option>
                  <option :value="50">50</option>
                  <option :value="100">100</option>
                  <option :value="200">200</option>
                </select>
              </label>
            </div>
          </div>

          <div v-if="loading" class="state-panel">Loading ledger rows...</div>
          <IncludedItemsTable
            v-else-if="items.length"
            :items="items"
            :selected-item-id="selectedItem?.item_id"
            @select="selectItem"
          />
          <div v-else class="state-panel">
            <strong>No rows available.</strong>
            <span>{{ error ? 'The API is unavailable or returned an error.' : 'Adjust filters to broaden the result set.' }}</span>
          </div>

          <div v-if="totalPages > 1" class="pagination">
            <button
              class="page-btn"
              type="button"
              :disabled="currentPage === 1"
              @click="changePage(currentPage - 1)"
            >
              Previous
            </button>
            <button
              v-for="page in visiblePages"
              :key="page"
              type="button"
              :class="['page-btn', { active: page === currentPage }]"
              @click="changePage(page)"
            >
              {{ page }}
            </button>
            <button
              class="page-btn"
              type="button"
              :disabled="currentPage === totalPages"
              @click="changePage(currentPage + 1)"
            >
              Next
            </button>
          </div>
        </section>
      </section>

      <aside class="inspector" aria-label="Selected Item">
        <div class="inspector-head">
          <h2>Selected Item</h2>
          <button class="bare-toggle" type="button" @click="selectedItem = null">Collapse</button>
        </div>

        <template v-if="selectedItem">
          <div class="selected-title">
            <h3>{{ selectedItem.name || `Item #${selectedItem.item_id}` }}</h3>
            <p>(ID: {{ selectedItem.item_id }})</p>
            <a
              class="record-link"
              :href="selectedAllaUrl"
              target="_blank"
              rel="noopener noreferrer"
            >
              View on Alla
            </a>
          </div>

          <div class="selected-media">
            <div class="selected-visual">
              <ItemModelPreview :item="selectedItem" size="lg" />
              <ItemIcon
                :icon="selectedItem.icon"
                :name="selectedItem.name || `Item #${selectedItem.item_id}`"
                size="lg"
                :title="selectedItem.name || `Item #${selectedItem.item_id}`"
              />
              <span class="model-id">IT{{ selectedModelId || 'n/a' }}</span>
            </div>
            <dl>
              <div><dt>Type</dt><dd>{{ getItemTypeName(selectedItem.itemtype) }}</dd></div>
              <div><dt>Model</dt><dd>{{ selectedModelId ? `IT${selectedModelId}` : 'n/a' }}</dd></div>
              <div><dt>Delay</dt><dd>{{ selectedItem.delay || 'n/a' }}</dd></div>
              <div><dt>Damage</dt><dd>{{ selectedItem.damage || 'n/a' }}</dd></div>
              <div><dt>Level</dt><dd>{{ selectedItem.reqlevel || 'n/a' }}</dd></div>
              <div><dt>Classes</dt><dd>{{ getClassNames(selectedItem.classes) }}</dd></div>
              <div><dt>Slot</dt><dd>{{ getSlotNames(selectedItem.slots) }}</dd></div>
            </dl>
          </div>

          <section class="metric-section">
            <dl class="metric-list">
              <div class="metric-row total">
                <dt>Total DPS</dt>
                <dd>{{ formatDPS(selectedItem.total_dps) }}</dd>
              </div>
              <div class="metric-row danger">
                <dt>MH DPS</dt>
                <dd>{{ formatDPS(selectedItem.mh_dps) }}</dd>
              </div>
              <div class="metric-row info">
                <dt>Spell DPS</dt>
                <dd>{{ formatDPS(selectedItem.mh_spell_dps) }}</dd>
              </div>
              <div class="metric-row success">
                <dt>Bane DPS</dt>
                <dd>{{ formatDPS(selectedItem.bane_dps) }}</dd>
              </div>
              <div class="metric-row warning">
                <dt>Backstab DPS</dt>
                <dd>{{ formatDPS(selectedItem.bs_dps) }}</dd>
              </div>
            </dl>
          </section>

          <section class="metric-section">
            <h4>Vs Global Average</h4>
            <dl class="delta-list">
              <div
                v-for="delta in selectedDeltas"
                :key="delta.label"
              >
                <dt>{{ delta.label }}</dt>
                <dd :class="{ positive: delta.value >= 0, negative: delta.value < 0 }">
                  {{ formatSignedDPS(delta.value) }}
                  <span>{{ delta.percent }}%</span>
                </dd>
              </div>
            </dl>
          </section>

          <section class="metric-section">
            <h4>Bane Damage</h4>
            <div v-if="selectedHasBane" class="mini-grid">
              <span>Bane DPS</span><strong>{{ formatDPS(selectedBaneDetails.baneDps) }}</strong>
              <span>Base DPS</span><strong>{{ formatDPS(selectedBaneDetails.baseDps) }}</strong>
              <span>Total w/ Bane</span><strong>{{ formatDPS(selectedBaneDetails.totalDps) }}</strong>
              <span>Share</span><strong>{{ selectedBaneDetails.share }}%</strong>
            </div>
            <div v-else class="empty-note">
              No bane contribution recorded for this item.
            </div>
          </section>

        </template>

        <div v-else class="state-panel inspector-empty">
          <strong>No selected item.</strong>
          <span>Select a row in the ledger to inspect DPS details.</span>
        </div>
      </aside>
    </main>

    <transition name="toast">
      <div v-if="toastVisible" class="toast-message">{{ toastMessage }}</div>
    </transition>
  </div>
</template>

<script>
import GlobalComparisonPanel from './components/GlobalComparisonPanel.vue';
import IncludedItemsTable from './components/IncludedItemsTable.vue';
import ItemIcon from './components/ItemIcon.vue';
import ItemModelPreview from './components/ItemModelPreview.vue';
import itemsApi from './api/items';
import config from './config';
import { normalizeModelId } from './utils/spire-assets';
import {
  formatDPS,
  formatNumber,
  getClassNames,
  getItemTypeName,
  getSlotNames
} from './utils/formatters';

const TYPE_OPTIONS = [
  { id: 0, name: '1H Slash' },
  { id: 1, name: '2H Slash' },
  { id: 2, name: 'Piercing' },
  { id: 3, name: 'Blunt' },
  { id: 45, name: 'Hand to Hand' },
  { id: 4, name: '2H Blunt' },
  { id: 5, name: 'Archery' },
  { id: 7, name: 'Throwing' },
  { id: 35, name: '2H Pierce' },
  { id: 10, name: 'Armor' }
];

const MANUAL_REFRESH_COOLDOWN_MS = 60 * 60 * 1000;
const MANUAL_REFRESH_STORAGE_KEY = 'clumsy-data-viewer:last-manual-refresh';

export default {
  name: 'App',
  components: {
    GlobalComparisonPanel,
    IncludedItemsTable,
    ItemIcon,
    ItemModelPreview
  },
  data() {
    return {
      allaBaseUrl: config.ALLA_BASE_URL,
      items: [],
      stats: null,
      loading: false,
      error: null,
      currentPage: 1,
      pageSize: 50,
      totalItems: 0,
      totalPages: 0,
      selectedItemTypes: null,
      selectedItem: null,
      allItemsForComparison: [],
      comparisonLoading: false,
      latestComparisonRequestId: 0,
      latestSelectedItemRequestId: 0,
      lastRefreshedAt: null,
      lastManualRefreshAt: null,
      filtersOpen: true,
      toastVisible: false,
      toastMessage: '',
      toastTimeout: null,
      filters: {
        search: '',
        minMeleeDps: 0,
        maxMeleeDps: 9999,
        minSpellDps: 0,
        maxSpellDps: 9999,
        hasBane: false,
        hasBackstab: false,
        sortBy: 'total_dps',
        sortOrder: 'desc',
        itemTypes: []
      }
    };
  },
  computed: {
    typeOptions() {
      return TYPE_OPTIONS;
    },
    visiblePages() {
      const pages = [];
      const maxVisible = 7;
      let start = Math.max(1, this.currentPage - 3);
      let end = Math.min(this.totalPages, start + maxVisible - 1);

      if (end - start < maxVisible - 1) {
        start = Math.max(1, end - maxVisible + 1);
      }

      for (let i = start; i <= end; i += 1) {
        pages.push(i);
      }
      return pages;
    },
    averageTotalDps() {
      const source = this.allItemsForComparison.length ? this.allItemsForComparison : this.items;
      if (!source.length) return 0;
      const total = source.reduce((sum, item) => sum + Number(item.total_dps || 0), 0);
      return total / source.length;
    },
    selectedDeltas() {
      if (!this.selectedItem) return [];
      const avg = this.averageTotalDps || 0;
      return [
        { label: 'Total DPS', value: Number(this.selectedItem.total_dps || 0) - avg, base: avg },
        { label: 'MH DPS', value: Number(this.selectedItem.mh_dps || 0) - avg * 0.72, base: avg * 0.72 },
        { label: 'Spell DPS', value: Number(this.selectedItem.mh_spell_dps || 0) - avg * 0.12, base: avg * 0.12 },
        { label: 'Bane DPS', value: Number(this.selectedItem.bane_dps || 0) - avg * 0.1, base: avg * 0.1 },
        { label: 'Backstab DPS', value: Number(this.selectedItem.bs_dps || 0) - avg * 0.28, base: avg * 0.28 }
      ].map((delta) => ({
        ...delta,
        percent: delta.base > 0 ? Math.round((delta.value / delta.base) * 100) : 0
      }));
    },
    selectedModelId() {
      return this.selectedItem ? normalizeModelId(this.selectedItem) : '';
    },
    selectedAllaUrl() {
      return this.selectedItem ? `${this.allaBaseUrl}${this.selectedItem.item_id}` : this.allaBaseUrl;
    },
    selectedBaneDetails() {
      const baneDps = Number(this.selectedItem?.bane_dps || 0);
      const totalDps = Number(this.selectedItem?.total_dps || 0);
      const baseDps = Math.max(0, totalDps - baneDps);

      return {
        baneDps,
        totalDps,
        baseDps,
        share: totalDps > 0 ? Math.round((baneDps / totalDps) * 100) : 0
      };
    },
    selectedHasBane() {
      return this.selectedBaneDetails.baneDps > 0;
    },
    lastRefreshedLabel() {
      if (!this.lastRefreshedAt) return 'not yet';
      return new Intl.DateTimeFormat(undefined, {
        hour: 'numeric',
        minute: '2-digit'
      }).format(this.lastRefreshedAt);
    },
    manualRefreshTitle() {
      return 'Manual database refresh is limited to once per hour';
    }
  },
  mounted() {
    this.loadManualRefreshState();
    this.refreshAll();
  },
  methods: {
    formatDPS,
    formatNumber,
    getClassNames,
    getItemTypeName,
    getSlotNames,
    typeCount(typeId) {
      return this.stats?.typeCounts?.[typeId] || 0;
    },
    isTypeActive(typeId) {
      if (!Array.isArray(this.selectedItemTypes)) return true;
      return this.selectedItemTypes.includes(typeId);
    },
    selectAllTypes() {
      this.selectedItemTypes = null;
      this.applyFilters();
    },
    toggleType(typeId) {
      const allIds = TYPE_OPTIONS.map((type) => type.id);
      const current = Array.isArray(this.selectedItemTypes)
        ? [...this.selectedItemTypes]
        : [...allIds];

      const next = current.includes(typeId)
        ? current.filter((id) => id !== typeId)
        : [...current, typeId];

      const unique = Array.from(new Set(next));
      this.selectedItemTypes = unique.length === allIds.length ? null : unique;
      this.applyFilters();
    },
    resetFilters() {
      this.filters = {
        search: '',
        minMeleeDps: 0,
        maxMeleeDps: 9999,
        minSpellDps: 0,
        maxSpellDps: 9999,
        hasBane: false,
        hasBackstab: false,
        sortBy: 'total_dps',
        sortOrder: 'desc',
        itemTypes: []
      };
      this.selectedItemTypes = null;
      this.resetGlobalDpsGraph();
      this.applyFilters();
    },
    applyFilters() {
      this.currentPage = 1;
      this.fetchItems();
      this.fetchComparisonItems();
    },
    handleSearchSubmit() {
      this.filters.search = (this.filters.search || '').trim();
      this.applyFilters();
    },
    async refreshAll(options = {}) {
      const { silent = false } = options;
      await this.fetchStats();
      await this.fetchItems({ silent });
      this.fetchComparisonItems();
      this.lastRefreshedAt = new Date();
    },
    async requestManualRefresh() {
      const waitMs = this.getManualRefreshWaitMs();
      if (waitMs > 0) {
        this.showToast(`Refresh available in ${this.formatCooldown(waitMs)}`);
        return;
      }

      this.setLastManualRefresh(new Date());
      await this.refreshAll();
      this.showToast('Database refreshed');
    },
    loadManualRefreshState() {
      try {
        const stored = window.localStorage?.getItem(MANUAL_REFRESH_STORAGE_KEY);
        const timestamp = stored ? Number(stored) : 0;
        this.lastManualRefreshAt = timestamp > 0 ? new Date(timestamp) : null;
      } catch (error) {
        this.lastManualRefreshAt = null;
      }
    },
    setLastManualRefresh(date) {
      this.lastManualRefreshAt = date;
      try {
        window.localStorage?.setItem(MANUAL_REFRESH_STORAGE_KEY, String(date.getTime()));
      } catch (error) {
        // Ignore storage failures; in-memory cooldown still protects this session.
      }
    },
    getManualRefreshWaitMs() {
      if (!this.lastManualRefreshAt) return 0;
      const elapsed = Date.now() - this.lastManualRefreshAt.getTime();
      return Math.max(0, MANUAL_REFRESH_COOLDOWN_MS - elapsed);
    },
    formatCooldown(ms) {
      const totalMinutes = Math.ceil(ms / 60000);
      if (totalMinutes >= 60) return '1 hour';
      return `${totalMinutes} minute${totalMinutes === 1 ? '' : 's'}`;
    },
    buildParams(pageSize = this.pageSize, page = this.currentPage, extraParams = {}) {
      return {
        page,
        pageSize,
        ...this.filters,
        ...extraParams,
        itemTypes: Array.isArray(this.selectedItemTypes) && this.selectedItemTypes.length > 0
          ? this.selectedItemTypes.join(',')
          : undefined
      };
    },
    async fetchItems(options = {}) {
      const { silent = false } = options;
      if (!silent) {
        this.loading = true;
      }
      this.error = null;

      if (Array.isArray(this.selectedItemTypes) && this.selectedItemTypes.length === 0) {
        this.items = [];
        this.totalItems = 0;
        this.totalPages = 0;
        this.selectedItem = null;
        if (!silent) {
          this.loading = false;
        }
        return;
      }

      try {
        const response = await itemsApi.getItems(this.buildParams());
        this.items = response.items || [];
        this.totalItems = response.pagination?.total || 0;
        this.totalPages = response.pagination?.totalPages || 0;

        const refreshedSelectedItem = this.selectedItem
          ? this.items.find((item) => item.item_id === this.selectedItem.item_id)
          : null;

        if (!this.selectedItem && this.items.length) {
          this.selectedItem = this.items[0];
        } else if (refreshedSelectedItem) {
          this.selectedItem = refreshedSelectedItem;
        } else if (this.selectedItem && this.items.length) {
          this.selectedItem = this.items[0];
        }
      } catch (error) {
        this.items = [];
        this.totalItems = 0;
        this.totalPages = 0;
        this.error = error.response?.data?.error || error.message || 'Failed to fetch items';
      } finally {
        if (!silent) {
          this.loading = false;
        }
      }
    },
    async fetchStats() {
      try {
        this.stats = await itemsApi.getStats();
      } catch (error) {
        this.stats = null;
      }
    },
    async fetchComparisonItems() {
      const requestId = Date.now();
      this.latestComparisonRequestId = requestId;
      this.comparisonLoading = true;

      if (Array.isArray(this.selectedItemTypes) && this.selectedItemTypes.length === 0) {
        this.allItemsForComparison = [];
        this.comparisonLoading = false;
        return;
      }

      try {
        const response = await itemsApi.getItems(this.buildParams(200, 1, { view: 'chart' }));
        if (this.latestComparisonRequestId === requestId) {
          this.allItemsForComparison = response.items || [];
        }
      } catch (error) {
        if (this.latestComparisonRequestId === requestId) {
          this.allItemsForComparison = this.items;
        }
      } finally {
        if (this.latestComparisonRequestId === requestId) {
          this.comparisonLoading = false;
        }
      }
    },
    async selectItem(item) {
      const localItem = this.items.find((entry) => entry.item_id === item.item_id);
      this.selectedItem = localItem || item;

      if (localItem || item.icon !== undefined) return;

      const requestId = Date.now();
      this.latestSelectedItemRequestId = requestId;

      try {
        const fullItem = await itemsApi.getItem(item.item_id);
        if (this.latestSelectedItemRequestId === requestId && this.selectedItem?.item_id === item.item_id) {
          this.selectedItem = fullItem;
        }
      } catch (error) {
        if (this.latestSelectedItemRequestId === requestId) {
          this.showToast('Selected item details unavailable');
        }
      }
    },
    changePage(page) {
      if (page >= 1 && page <= this.totalPages) {
        this.currentPage = page;
        this.fetchItems();
      }
    },
    resetGlobalDpsGraph() {
      this.$refs.globalComparisonPanel?.resetSegments?.();
    },
    async exportVisibleRows() {
      if (!this.items.length) {
        this.showToast('No rows to export');
        return;
      }
      const header = ['Item ID', 'Name', 'Type', 'Total DPS', 'MH DPS', 'Spell DPS', 'Bane DPS', 'Backstab DPS'];
      const rows = this.items.map((item) => [
        item.item_id,
        item.name || `Item #${item.item_id}`,
        this.getItemTypeName(item.itemtype),
        this.formatDPS(item.total_dps),
        this.formatDPS(item.mh_dps),
        this.formatDPS(item.mh_spell_dps),
        this.formatDPS(item.bane_dps),
        this.formatDPS(item.bs_dps)
      ]);
      const csv = [header, ...rows].map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');

      let copied = false;
      try {
        if (navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(csv);
          copied = true;
        }
      } catch (error) {
        copied = false;
      }

      if (!copied) {
        try {
          const textarea = document.createElement('textarea');
          textarea.value = csv;
          textarea.setAttribute('readonly', '');
          textarea.style.position = 'fixed';
          textarea.style.opacity = '0';
          textarea.style.pointerEvents = 'none';
          document.body.appendChild(textarea);
          textarea.select();
          copied = document.execCommand('copy');
          document.body.removeChild(textarea);
        } catch (error) {
          copied = false;
        }
      }

      this.showToast(copied ? 'Visible rows copied as CSV' : 'CSV export ready; clipboard blocked');
    },
    formatSignedDPS(value) {
      const number = Number(value || 0);
      const sign = number >= 0 ? '+' : '-';
      return `${sign}${this.formatDPS(Math.abs(number))}`;
    },
    showToast(message) {
      if (this.toastTimeout) {
        clearTimeout(this.toastTimeout);
      }
      this.toastMessage = message;
      this.toastVisible = true;
      this.toastTimeout = setTimeout(() => {
        this.toastVisible = false;
        this.toastTimeout = null;
      }, 2400);
    }
  },
  beforeUnmount() {
    if (this.toastTimeout) {
      clearTimeout(this.toastTimeout);
    }
  }
};
</script>

<style>
#app {
  min-height: 100vh;
}

.ledger-app {
  color: var(--text-primary);
  background: var(--bg-ink);
}

.ledger-topbar {
  height: 58px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 22px;
  border-bottom: 1px solid var(--line-strong);
  background:
    linear-gradient(90deg, rgba(197, 157, 92, 0.06), transparent 34%),
    var(--panel-dark);
}

.brand-cluster {
  display: flex;
  align-items: center;
  gap: 15px;
}

.brand-cluster h1 {
  margin: 0;
  font-family: var(--font-display);
  font-size: 1.46rem;
  font-weight: 500;
  color: var(--brass-bright);
}

.brand-cluster p {
  margin: 1px 0 0;
  color: var(--text-faint);
  font-size: 0.68rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.brand-rule {
  height: 34px;
  width: 1px;
  background: var(--line-brass);
}

.icon-button {
  width: 34px;
  height: 34px;
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 0;
  border: 1px solid transparent;
  border-radius: 2px;
  color: var(--brass-bright);
}

.icon-button span {
  width: 18px;
  height: 1px;
  background: currentColor;
}

.icon-button.compact {
  width: 32px;
  height: 32px;
  margin-left: 8px;
  border-color: var(--line-subtle);
  font-family: var(--font-mono);
}

.source-strip {
  display: flex;
  align-items: center;
  gap: 16px;
  color: var(--text-secondary);
  font-size: 0.82rem;
}

.source-strip strong {
  color: var(--text-primary);
  font-weight: 500;
}

.dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--brass);
}

.ledger-shell {
  min-height: calc(100vh - 58px);
  display: grid;
  grid-template-columns: 260px minmax(520px, 1fr) 320px;
  border-bottom: 1px solid var(--line-strong);
}

.ledger-shell.filters-collapsed {
  grid-template-columns: minmax(520px, 1fr) 320px;
}

.filter-rail,
.inspector {
  background: var(--panel-dark);
  border-right: 1px solid var(--line-strong);
  min-width: 0;
}

.inspector {
  border-right: 0;
  border-left: 1px solid var(--line-strong);
}

.filters-collapsed .filter-rail {
  display: none;
}

.rail-title,
.inspector-head {
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  border-bottom: 1px solid var(--line-strong);
}

.rail-title h2,
.inspector-head h2,
.panel-head h2,
.comparison-panel h2 {
  margin: 0;
  font-family: var(--font-display);
  color: var(--brass-bright);
  font-size: 1.05rem;
  font-weight: 500;
  letter-spacing: 0.03em;
}

.bare-toggle {
  padding: 0;
  border: 0;
  border-radius: 0;
  color: var(--brass);
  font-size: 0.68rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.rail-section {
  padding: 18px 24px;
  border-bottom: 1px solid var(--line-strong);
}

.section-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.section-heading h3,
.metric-section h4 {
  margin: 0;
  font-family: var(--font-display);
  color: var(--brass);
  font-size: 0.92rem;
  font-weight: 500;
  text-transform: uppercase;
}

.check-row {
  display: grid;
  grid-template-columns: 20px 1fr auto;
  align-items: center;
  gap: 10px;
  min-height: 28px;
  color: var(--text-primary);
  font-size: 0.88rem;
}

.check-row.option {
  grid-template-columns: 20px 1fr;
}

input[type='checkbox'] {
  appearance: none;
  width: 16px;
  height: 16px;
  border: 1px solid var(--line-brass);
  background: transparent;
  position: relative;
}

input[type='checkbox']:checked {
  background: rgba(197, 157, 92, 0.18);
}

input[type='checkbox']:checked::after {
  content: '';
  position: absolute;
  left: 4px;
  top: 1px;
  width: 5px;
  height: 9px;
  border: solid var(--brass-bright);
  border-width: 0 1px 1px 0;
  transform: rotate(45deg);
}

.check-row em {
  color: var(--text-muted);
  font-style: normal;
  font-variant-numeric: tabular-nums;
}

.field-grid.two {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

label {
  display: grid;
  gap: 7px;
  margin-bottom: 12px;
}

label span {
  color: var(--text-secondary);
  font-size: 0.78rem;
}

input,
select {
  width: 100%;
  height: 34px;
  border: 1px solid var(--line-strong);
  border-radius: 2px;
  background: var(--field-bg);
  color: var(--text-primary);
  padding: 0 10px;
  font-family: var(--font-body);
}

select {
  color: var(--text-secondary);
}

.workspace {
  min-width: 0;
  overflow: hidden;
  display: grid;
  grid-template-rows: 58px auto minmax(0, 1fr);
  background:
    linear-gradient(rgba(197, 157, 92, 0.035) 1px, transparent 1px),
    linear-gradient(90deg, rgba(197, 157, 92, 0.03) 1px, transparent 1px),
    var(--bg-ink);
  background-size: 36px 36px;
}

.command-strip {
  display: grid;
  grid-template-columns: minmax(240px, 1fr) auto auto auto;
  align-items: center;
  gap: 12px;
  padding: 10px 20px;
  border-bottom: 1px solid var(--line-strong);
  background: rgba(22, 22, 19, 0.9);
}

.search-box {
  position: relative;
  display: block;
  margin: 0;
}

.search-box span {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--brass-bright);
  font-size: 0;
}

.search-box span::before {
  content: '';
  display: block;
  width: 13px;
  height: 13px;
  border: 1px solid currentColor;
  border-radius: 50%;
}

.search-box span::after {
  content: '';
  position: absolute;
  width: 7px;
  height: 1px;
  background: currentColor;
  transform: rotate(45deg);
  left: 12px;
  top: 13px;
}

.search-box input {
  padding-left: 38px;
  height: 38px;
}

.action-button,
.record-link {
  height: 38px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0 18px;
  border: 1px solid var(--line-brass);
  border-radius: 2px;
  background: rgba(197, 157, 92, 0.05);
  color: var(--text-primary);
  font-family: var(--font-display);
  font-size: 0.92rem;
}

.action-button.slim {
  height: 32px;
  font-size: 0.8rem;
}

.load-status {
  justify-self: end;
  color: var(--text-secondary);
  font-size: 0.82rem;
}

.load-status span {
  margin-left: 12px;
}

.table-panel {
  min-height: 0;
  min-width: 0;
  padding: 0 20px 22px;
}

.panel-head {
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-top: 1px solid var(--line-strong);
  border-bottom: 1px solid var(--line-strong);
}

.panel-note {
  margin: 4px 0 0;
  color: var(--text-muted);
  font-size: 0.76rem;
}

.error-note {
  color: var(--red);
}

.table-tools {
  display: flex;
  align-items: center;
  gap: 10px;
}

.page-size {
  display: flex;
  align-items: center;
  grid-template-columns: none;
  gap: 8px;
  margin: 0;
}

.page-size select {
  width: 92px;
  height: 32px;
}

.state-panel {
  min-height: 120px;
  display: grid;
  place-content: center;
  gap: 7px;
  text-align: center;
  color: var(--text-muted);
  border: 1px solid var(--line-strong);
  background: rgba(16, 16, 14, 0.5);
}

.state-panel strong {
  color: var(--text-primary);
  font-family: var(--font-display);
  font-size: 1rem;
  font-weight: 500;
}

.pagination {
  display: flex;
  align-items: center;
  gap: 8px;
  padding-top: 16px;
}

.page-btn {
  height: 32px;
  min-width: 32px;
  padding: 0 10px;
  border: 1px solid transparent;
  border-radius: 2px;
  color: var(--text-secondary);
}

.page-btn.active {
  border-color: var(--line-brass);
  color: var(--brass-bright);
  background: rgba(197, 157, 92, 0.08);
}

.page-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.inspector {
  position: relative;
  z-index: 2;
  background: var(--panel-dark);
  padding-bottom: 20px;
  overflow: hidden;
}

.selected-title {
  padding: 18px 24px 16px;
}

.selected-title h3 {
  margin: 0;
  color: var(--brass-bright);
  font-family: var(--font-display);
  font-size: 1.35rem;
  font-weight: 500;
  line-height: 1.2;
}

.selected-title p {
  margin: 5px 0 0;
  color: var(--text-secondary);
  font-size: 0.82rem;
}

.selected-title .record-link {
  width: 100%;
  margin: 14px 0 0;
  height: 40px;
  background: rgba(197, 157, 92, 0.12);
  color: var(--brass-bright);
}

.selected-media {
  display: grid;
  grid-template-columns: 1fr;
  gap: 14px;
  padding: 0 24px 18px;
  border-bottom: 1px solid var(--line-strong);
}

.selected-visual {
  position: relative;
  min-height: 148px;
}

.selected-visual .item-icon {
  position: absolute;
  left: 10px;
  bottom: 10px;
  width: 56px;
  height: 56px;
  border-radius: 0;
  box-shadow: 0 12px 20px rgba(0, 0, 0, 0.34);
}

.model-id {
  position: absolute;
  right: 10px;
  bottom: 10px;
  padding: 3px 7px;
  border: 1px solid var(--line-brass);
  background: rgba(12, 12, 10, 0.82);
  color: var(--brass-bright);
  font-family: var(--font-mono);
  font-size: 0.68rem;
}

.selected-media dl,
.metric-list,
.delta-list {
  margin: 0;
}

.selected-media dl div {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 6px;
  color: var(--text-secondary);
  font-size: 0.86rem;
}

dt {
  color: var(--text-muted);
}

dd {
  margin: 0;
  color: var(--text-primary);
  text-align: right;
}

.metric-section {
  padding: 18px 24px;
  border-bottom: 1px solid var(--line-strong);
}

.metric-row,
.delta-list div {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 14px;
  margin-bottom: 12px;
}

.metric-row dd {
  font-family: var(--font-display);
  font-size: 1.05rem;
  color: var(--text-primary);
}

.metric-row.total dd {
  font-size: 1.8rem;
  color: var(--brass-bright);
}

.metric-row.danger dd { color: var(--red); }
.metric-row.info dd { color: var(--blue); }
.metric-row.success dd { color: var(--green); }
.metric-row.warning dd { color: var(--amber); }

.delta-list dd {
  color: var(--green);
  font-variant-numeric: tabular-nums;
}

.delta-list dd.negative {
  color: var(--red);
}

.delta-list span {
  display: inline-block;
  min-width: 52px;
  margin-left: 10px;
  color: inherit;
}

.mini-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px 16px;
  margin-top: 14px;
  color: var(--text-secondary);
}

.mini-grid strong {
  color: var(--text-primary);
  text-align: right;
  font-weight: 500;
}

.empty-note {
  margin-top: 12px;
  color: var(--text-muted);
  font-size: 0.84rem;
  line-height: 1.4;
}

.record-link {
  text-decoration: none;
}

.inspector-empty {
  margin: 24px;
}

.toast-message {
  position: fixed;
  right: 24px;
  bottom: 24px;
  padding: 12px 16px;
  border: 1px solid var(--line-brass);
  background: var(--panel-dark);
  color: var(--brass-bright);
  z-index: 20;
}

@media (max-width: 1040px) {
  .ledger-shell {
    grid-template-columns: 250px minmax(0, 1fr);
  }

  .ledger-shell.filters-collapsed {
    grid-template-columns: minmax(0, 1fr);
  }

  .inspector {
    grid-column: 1 / -1;
    border-left: 0;
    border-top: 1px solid var(--line-strong);
  }
}

@media (max-width: 820px) {
  .ledger-topbar,
  .source-strip,
  .command-strip {
    height: auto;
    grid-template-columns: 1fr;
    align-items: stretch;
  }

  .ledger-topbar,
  .ledger-shell {
    display: block;
  }

  .filter-rail {
    border-right: 0;
    border-bottom: 1px solid var(--line-strong);
  }

  .filters-collapsed .filter-rail {
    display: none;
  }
}
</style>
