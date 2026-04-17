<template>
  <section class="filters-container">
    <div class="incantation">
      <div class="incantation-label">Incantation</div>
      <div class="search-wrapper" :class="{ focused: focused, filled: hasInput }">
        <span class="corner corner-tl" aria-hidden="true"></span>
        <span class="corner corner-tr" aria-hidden="true"></span>
        <span class="corner corner-bl" aria-hidden="true"></span>
        <span class="corner corner-br" aria-hidden="true"></span>

        <span class="search-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
        </span>

        <input
          v-model="localFilters.search"
          type="text"
          placeholder="Speak the name of the artifact you seek…"
          @keyup.enter="handleSubmit"
          @focus="focused = true"
          @blur="focused = false"
          class="search-input"
        />

        <button
          v-if="hasInput"
          type="button"
          class="search-clear"
          @click="clearSearch"
          aria-label="Clear search"
        >✕</button>

        <kbd class="kbd-hint">⏎</kbd>
      </div>
      <div class="hint">
        <span>Press Enter to invoke</span>
        <span class="dot-sep">◆</span>
        <span>Searches both item names and parsing notes</span>
      </div>
    </div>

    <transition name="chip-fade">
      <div v-if="hasActiveFilters" class="active-filters">
        <span class="active-filters-label">Active wards</span>
        <div class="filter-tags">
          <span v-if="localFilters.search" class="filter-tag">
            <span class="tag-icon">🔍</span>
            <span class="tag-text">"{{ localFilters.search }}"</span>
            <button @click="clearSearch" class="tag-close" aria-label="Remove search">×</button>
          </span>
        </div>
        <button @click="resetFilters" class="clear-all-btn">Dispel All</button>
      </div>
    </transition>
  </section>
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
      localFilters: { ...this.filters },
      focused: false
    };
  },
  computed: {
    hasActiveFilters() {
      return !!this.localFilters.search;
    },
    hasInput() {
      return !!(this.localFilters.search && this.localFilters.search.length);
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
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.incantation {
  background: linear-gradient(180deg, rgba(19, 19, 37, 0.78) 0%, rgba(13, 13, 25, 0.8) 100%);
  border: 1px solid var(--line-gold);
  border-radius: var(--r-lg);
  padding: 22px 28px 20px;
  box-shadow: var(--shadow-card);
  position: relative;
}

.incantation::before {
  content: '';
  position: absolute;
  top: 0; left: 30px; right: 30px; height: 1px;
  background: linear-gradient(90deg, transparent, var(--gold) 50%, transparent);
}

.incantation-label {
  font-family: var(--font-display);
  font-size: 0.7rem;
  letter-spacing: 0.5em;
  color: var(--gold);
  text-transform: uppercase;
  margin-bottom: 12px;
  opacity: 0.8;
}

/* Search wrapper — corner ornaments + glow */
.search-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 12px 16px;
  background: rgba(7, 7, 13, 0.78);
  border: 1px solid var(--line-soft);
  border-radius: var(--r-md);
  transition: all 0.3s;
}

.search-wrapper.focused {
  border-color: var(--gold);
  box-shadow: 0 0 0 2px var(--gold-faint), 0 0 12px var(--gold-glow);
}

.search-wrapper.filled {
  border-color: var(--gold);
}

.corner {
  position: absolute;
  width: 10px;
  height: 10px;
  border: 1px solid var(--gold);
  opacity: 0;
  transition: opacity 0.3s;
  pointer-events: none;
}

.search-wrapper.focused .corner,
.search-wrapper.filled .corner { opacity: 0.9; }

.corner-tl { top: -3px; left: -3px; border-right: none; border-bottom: none; }
.corner-tr { top: -3px; right: -3px; border-left: none; border-bottom: none; }
.corner-bl { bottom: -3px; left: -3px; border-right: none; border-top: none; }
.corner-br { bottom: -3px; right: -3px; border-left: none; border-top: none; }

.search-icon {
  color: var(--gold);
  flex-shrink: 0;
}

.search-input {
  all: unset;
  flex: 1;
  color: var(--ink-primary);
  font-family: var(--font-body);
  font-size: 1rem;
  letter-spacing: 0.01em;
  padding: 8px 0;
}

.search-input::placeholder {
  color: var(--ink-muted);
  font-style: italic;
}

.search-clear {
  all: unset;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: rgba(239, 107, 107, 0.15);
  color: var(--rune-flame);
  font-size: 0.85rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
  line-height: 22px;
}

.search-clear:hover {
  background: rgba(239, 107, 107, 0.3);
  box-shadow: 0 0 8px rgba(239, 107, 107, 0.16);
}

.kbd-hint {
  font-family: var(--font-mono);
  font-size: 0.7rem;
  color: var(--gold);
  border: 1px solid var(--line-gold);
  padding: 3px 8px;
  border-radius: var(--r-xs);
  background: var(--gold-faint);
  letter-spacing: 0.1em;
}

.hint {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 10px;
  color: var(--ink-muted);
  font-size: 0.8rem;
  font-style: italic;
}

.dot-sep {
  color: var(--gold);
  opacity: 0.55;
  font-size: 0.5rem;
  font-style: normal;
}

/* Active filters chip bar */
.active-filters {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  background: linear-gradient(135deg, rgba(230, 193, 104, 0.06) 0%, rgba(136, 165, 204, 0.05) 100%);
  border: 1px solid var(--line-gold);
  border-radius: var(--r-md);
  padding: 12px 18px;
}

.active-filters-label {
  font-family: var(--font-display);
  color: var(--gold);
  font-size: 0.72rem;
  letter-spacing: 0.3em;
  text-transform: uppercase;
  font-weight: 600;
}

.filter-tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  flex: 1;
}

.filter-tag {
  background: rgba(230, 193, 104, 0.16);
  color: var(--ink-primary);
  padding: 6px 12px;
  border-radius: var(--r-pill);
  font-size: 0.85rem;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border: 1px solid var(--line-gold);
}

.tag-icon { font-size: 0.9rem; }

.tag-text {
  font-family: var(--font-mono);
  color: var(--gold-bright);
}

.tag-close {
  all: unset;
  cursor: pointer;
  color: var(--rune-flame);
  font-size: 1.15rem;
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.2s;
}

.tag-close:hover {
  background: rgba(239, 107, 107, 0.2);
}

.clear-all-btn {
  background: rgba(239, 107, 107, 0.1);
  border: 1px solid rgba(239, 107, 107, 0.35);
  color: var(--rune-flame);
  padding: 6px 16px;
  border-radius: var(--r-pill);
  font-family: var(--font-display);
  font-size: 0.72rem;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  cursor: pointer;
  transition: all 0.2s;
}

.clear-all-btn:hover {
  background: rgba(239, 107, 107, 0.2);
  transform: translateY(-1px);
  box-shadow: 0 0 10px rgba(239, 107, 107, 0.14);
}

.chip-fade-enter-active,
.chip-fade-leave-active {
  transition: opacity 0.25s, transform 0.25s;
}

.chip-fade-enter-from,
.chip-fade-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

@media (max-width: 640px) {
  .incantation {
    padding: 18px 16px 16px;
  }

  .search-wrapper {
    gap: 10px;
    padding: 10px 12px;
  }

  .kbd-hint {
    display: none;
  }

  .active-filters {
    padding: 10px 12px;
  }
}
</style>
