<template>
  <div class="included-table-wrap">
    <table class="included-table">
      <thead>
        <tr>
          <th
            v-for="column in sortableColumns"
            :key="column.key"
            :aria-sort="ariaSort(column.key)"
          >
            <button
              type="button"
              class="sort-button"
              @click="toggleSort(column.key)"
            >
              <span>{{ column.label }}</span>
              <span
                class="sort-indicator"
                :class="{ active: sortKey === column.key }"
                aria-hidden="true"
              >
                {{ sortKey === column.key ? (sortOrder === 'asc' ? '↑' : '↓') : '↕' }}
              </span>
            </button>
          </th>
          <th>Action</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="item in sortedItems"
          :key="item.item_id"
          :style="{ '--type-color': getItemTypeColor(item.itemtype) }"
        >
          <td class="item-cell">
            <button type="button" class="item-link" @click="$emit('open', item)">
              <ItemIcon
                :icon="item.icon"
                :name="item.name || `Item #${item.item_id}`"
                size="sm"
                :title="item.name || `Item #${item.item_id}`"
              />
              <span class="item-name">{{ item.name || `Item #${item.item_id}` }}</span>
            </button>
            <div class="item-id">#{{ item.item_id }}</div>
          </td>
          <td>{{ getItemTypeName(item.itemtype) }}</td>
          <td class="numeric total">{{ formatDPS(item.total_dps) }}</td>
          <td class="numeric">{{ formatDPS(item.mh_dps) }}</td>
          <td class="numeric">{{ formatDPS(item.mh_spell_dps) }}</td>
          <td class="numeric">{{ formatDPS(item.bane_dps) }}</td>
          <td class="numeric">{{ formatDPS(item.bs_dps) }}</td>
          <td class="action-cell">
            <button type="button" class="open-btn" @click="$emit('open', item)">Open</button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script>
import ItemIcon from './ItemIcon.vue';
import { formatDPS, getItemTypeColor, getItemTypeName } from '../utils/formatters';

export default {
  name: 'IncludedItemsTable',
  components: {
    ItemIcon
  },
  props: {
    items: {
      type: Array,
      default: () => []
    }
  },
  emits: ['open'],
  data() {
    return {
      sortKey: null,
      sortOrder: 'asc'
    };
  },
  computed: {
    sortableColumns() {
      return [
        { key: 'name', label: 'Item', type: 'string' },
        { key: 'itemtype', label: 'Type', type: 'type' },
        { key: 'total_dps', label: 'Total', type: 'number' },
        { key: 'mh_dps', label: 'MH', type: 'number' },
        { key: 'mh_spell_dps', label: 'Spell', type: 'number' },
        { key: 'bane_dps', label: 'Bane', type: 'number' },
        { key: 'bs_dps', label: 'BS', type: 'number' }
      ];
    },
    sortedItems() {
      const items = [...this.items];
      if (!this.sortKey) {
        return items;
      }

      const column = this.sortableColumns.find((entry) => entry.key === this.sortKey);
      if (!column) {
        return items;
      }

      const direction = this.sortOrder === 'asc' ? 1 : -1;

      items.sort((a, b) => {
        let comparison = 0;

        if (column.type === 'number') {
          const left = Number(a?.[column.key] ?? 0);
          const right = Number(b?.[column.key] ?? 0);
          comparison = left - right;
        } else if (column.type === 'type') {
          comparison = this.getTypeNameForSort(a.itemtype).localeCompare(this.getTypeNameForSort(b.itemtype));
        } else {
          const left = String(a?.[column.key] || `Item #${a?.item_id || ''}`);
          const right = String(b?.[column.key] || `Item #${b?.item_id || ''}`);
          comparison = left.localeCompare(right);
        }

        if (comparison === 0) {
          comparison = Number(a?.item_id ?? 0) - Number(b?.item_id ?? 0);
        }

        return comparison * direction;
      });

      return items;
    }
  },
  methods: {
    formatDPS,
    getItemTypeColor,
    getItemTypeName,
    toggleSort(key) {
      if (this.sortKey === key) {
        this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
        return;
      }

      this.sortKey = key;
      this.sortOrder = 'asc';
    },
    ariaSort(key) {
      if (this.sortKey !== key) {
        return 'none';
      }
      return this.sortOrder === 'asc' ? 'ascending' : 'descending';
    },
    getTypeNameForSort(itemType) {
      return this.getItemTypeName(itemType);
    }
  }
};
</script>

<style scoped>
.included-table-wrap {
  margin-bottom: 24px;
  overflow-x: auto;
  border: 1px solid var(--line-soft);
  border-radius: var(--r-md);
  background: linear-gradient(180deg, rgba(20, 20, 36, 0.86), rgba(12, 12, 23, 0.92));
}

.included-table {
  width: 100%;
  min-width: 860px;
  border-collapse: collapse;
}

.included-table th,
.included-table td {
  padding: 14px 16px;
  border-bottom: 1px solid var(--line-dim);
  text-align: left;
}

.included-table thead th {
  position: sticky;
  top: 0;
  background: rgba(12, 12, 23, 0.96);
  font-family: var(--font-display);
  color: var(--ink-muted);
  font-size: 0.66rem;
  text-transform: uppercase;
  letter-spacing: 0.2em;
  z-index: 1;
}

.sort-button {
  all: unset;
  width: 100%;
  display: inline-flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  cursor: pointer;
}

.sort-button:hover {
  color: var(--gold);
}

.sort-indicator {
  opacity: 0.45;
  font-size: 0.8rem;
  transition: opacity 0.2s ease;
}

.sort-indicator.active {
  opacity: 1;
  color: var(--gold);
}

.included-table tbody tr:hover {
  background: rgba(230, 193, 104, 0.03);
}

.item-cell {
  min-width: 260px;
}

.item-link {
  all: unset;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  width: 100%;
}

.item-name {
  font-family: var(--font-display);
  color: var(--ink-primary);
  line-height: 1.25;
}

.item-link:hover .item-name {
  color: color-mix(in srgb, var(--type-color) 60%, var(--ink-primary));
}

.item-id {
  margin-top: 4px;
  margin-left: 42px;
  color: var(--ink-muted);
  font-size: 0.74rem;
  font-family: var(--font-mono);
}

.numeric {
  text-align: right;
  font-family: var(--font-mono);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.total {
  color: var(--rune-jade);
  font-weight: 700;
}

.action-cell {
  text-align: right;
}

.open-btn {
  padding: 7px 12px;
  border-radius: var(--r-pill);
  border: 1px solid var(--line-gold);
  background: var(--gold-faint);
  color: var(--gold);
  font-family: var(--font-display);
  font-size: 0.66rem;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

.open-btn:hover {
  box-shadow: 0 0 8px var(--gold-glow);
}
</style>
