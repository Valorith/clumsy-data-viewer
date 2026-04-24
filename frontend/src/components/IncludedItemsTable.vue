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
                {{ sortKey === column.key ? (sortOrder === 'asc' ? 'up' : 'down') : '--' }}
              </span>
            </button>
          </th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="(item, index) in sortedItems"
          :key="item.item_id"
          :class="{ selected: item.item_id === selectedItemId }"
          :style="{ '--type-color': getItemTypeColor(item.itemtype) }"
          @click="$emit('select', item)"
        >
          <td class="rank-cell">{{ index + 1 }}</td>
          <td class="item-cell">
            <button type="button" class="item-link" @click.stop="$emit('select', item)">
              <ItemIcon
                :icon="item.icon"
                :name="item.name || `Item #${item.item_id}`"
                size="sm"
                :title="item.name || `Item #${item.item_id}`"
              />
              <span>
                <strong>{{ item.name || `Item #${item.item_id}` }}</strong>
                <em>#{{ item.item_id }}</em>
              </span>
            </button>
          </td>
          <td>{{ getItemTypeName(item.itemtype) }}</td>
          <td class="numeric">{{ item.delay || '-' }}</td>
          <td class="numeric total">{{ formatDPS(item.total_dps) }}</td>
          <td class="numeric">{{ formatDPS(item.mh_dps) }}</td>
          <td class="numeric">{{ formatDPS(item.mh_spell_dps) }}</td>
          <td class="numeric">{{ formatDPS(item.bane_dps) }}</td>
          <td class="numeric">{{ formatDPS(item.bs_dps) }}</td>
          <td>{{ item.bane_name || item.bane || '-' }}</td>
          <td class="numeric">{{ item.weight || '-' }}</td>
          <td class="action-cell">
            <button type="button" class="open-btn" @click.stop="$emit('open', item)">Open</button>
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
    },
    selectedItemId: {
      type: [Number, String],
      default: null
    }
  },
  emits: ['select', 'open'],
  data() {
    return {
      sortKey: null,
      sortOrder: 'asc'
    };
  },
  computed: {
    sortableColumns() {
      return [
        { key: 'rank', label: '#', type: 'rank' },
        { key: 'name', label: 'Item', type: 'string' },
        { key: 'itemtype', label: 'Type', type: 'type' },
        { key: 'delay', label: 'Delay', type: 'number' },
        { key: 'total_dps', label: 'Total DPS', type: 'number' },
        { key: 'mh_dps', label: 'MH DPS', type: 'number' },
        { key: 'mh_spell_dps', label: 'Spell DPS', type: 'number' },
        { key: 'bane_dps', label: 'Bane DPS', type: 'number' },
        { key: 'bs_dps', label: 'Backstab DPS', type: 'number' },
        { key: 'bane_name', label: 'Bane', type: 'bane' },
        { key: 'weight', label: 'Wgt', type: 'number' },
        { key: 'action', label: 'Action', type: 'action' }
      ];
    },
    sortedItems() {
      const items = [...this.items];
      if (!this.sortKey || this.sortKey === 'rank') return items;

      const column = this.sortableColumns.find((entry) => entry.key === this.sortKey);
      if (!column) return items;

      const direction = this.sortOrder === 'asc' ? 1 : -1;
      items.sort((a, b) => {
        let comparison = 0;
        if (column.type === 'number') {
          comparison = Number(a?.[column.key] ?? 0) - Number(b?.[column.key] ?? 0);
        } else if (column.type === 'type') {
          comparison = this.getItemTypeName(a.itemtype).localeCompare(this.getItemTypeName(b.itemtype));
        } else if (column.type === 'bane') {
          comparison = this.getBaneLabel(a).localeCompare(this.getBaneLabel(b), undefined, { numeric: true });
        } else if (column.type === 'action') {
          comparison = Number(a?.item_id ?? 0) - Number(b?.item_id ?? 0);
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
    getBaneLabel(item) {
      return String(item?.bane_name || item?.bane || '');
    },
    toggleSort(key) {
      if (key === 'rank') {
        this.sortKey = null;
        return;
      }
      if (this.sortKey === key) {
        this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
        return;
      }
      this.sortKey = key;
      this.sortOrder = 'asc';
    },
    ariaSort(key) {
      if (this.sortKey !== key) return 'none';
      return this.sortOrder === 'asc' ? 'ascending' : 'descending';
    }
  }
};
</script>

<style scoped>
.included-table-wrap {
  max-width: 100%;
  min-width: 0;
  overflow: auto;
  border: 1px solid var(--line-strong);
  background: rgba(18, 18, 16, 0.82);
}

.included-table {
  width: 100%;
  min-width: 1120px;
  border-collapse: collapse;
  font-size: 0.84rem;
}

.included-table th,
.included-table td {
  padding: 9px 11px;
  border-bottom: 1px solid var(--line-strong);
  border-right: 1px solid var(--line-subtle);
  text-align: left;
}

.included-table th:last-child,
.included-table td:last-child {
  border-right: 0;
}

.included-table thead th {
  position: sticky;
  top: 0;
  z-index: 1;
  background: #211f1a;
  color: var(--text-secondary);
  font-family: var(--font-display);
  font-weight: 500;
}

.sort-button {
  all: unset;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  cursor: pointer;
}

.sort-button:hover {
  color: var(--brass-bright);
}

.sort-indicator {
  color: var(--text-muted);
  font-family: var(--font-mono);
  font-size: 0.64rem;
}

.sort-indicator.active {
  color: var(--brass-bright);
}

.included-table tbody tr {
  cursor: pointer;
  background: rgba(20, 20, 18, 0.68);
}

.included-table tbody tr:nth-child(even) {
  background: rgba(27, 26, 22, 0.72);
}

.included-table tbody tr:hover,
.included-table tbody tr.selected {
  background: rgba(197, 157, 92, 0.16);
}

.rank-cell {
  width: 44px;
  color: var(--text-muted);
  text-align: right;
  font-family: var(--font-mono);
}

.item-cell {
  min-width: 230px;
}

.item-link {
  all: unset;
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
}

.item-link strong {
  display: block;
  color: var(--text-primary);
  font-family: var(--font-display);
  font-weight: 500;
  line-height: 1.2;
}

.item-link em {
  display: block;
  color: var(--text-muted);
  font-style: normal;
  font-family: var(--font-mono);
  font-size: 0.7rem;
  margin-top: 2px;
}

.numeric {
  text-align: right;
  white-space: nowrap;
  font-family: var(--font-mono);
  font-variant-numeric: tabular-nums;
}

.total {
  color: var(--brass-bright);
  background: rgba(197, 157, 92, 0.07);
}

.action-cell {
  width: 72px;
  text-align: center;
}

.open-btn {
  height: 26px;
  padding: 0 10px;
  border: 1px solid var(--line-brass);
  border-radius: 2px;
  color: var(--text-primary);
  font-size: 0.72rem;
}
</style>
