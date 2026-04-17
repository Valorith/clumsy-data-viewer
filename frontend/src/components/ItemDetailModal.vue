<template>
  <transition name="modal">
    <div v-if="isOpen" class="modal-overlay" @click.self="close">
      <div class="modal-container">
        <!-- Ornamental border corners -->
        <span class="frame-corner corner-tl" aria-hidden="true"></span>
        <span class="frame-corner corner-tr" aria-hidden="true"></span>
        <span class="frame-corner corner-bl" aria-hidden="true"></span>
        <span class="frame-corner corner-br" aria-hidden="true"></span>

        <div class="modal-header">
          <div class="header-left">
            <ItemIcon
              :icon="item.icon"
              :name="item.name || `Item #${item.item_id}`"
              size="lg"
              :title="item.name || `Item #${item.item_id}`"
            />
            <div class="title-block">
              <div class="eyebrow">Artifact Codex</div>
              <h2 class="modal-title">{{ item.name || `Item #${item.item_id}` }}</h2>
            </div>
          </div>
          <button @click="close" class="close-btn" aria-label="Close">✕</button>
        </div>
        <div class="header-rule" aria-hidden="true"></div>

        <div class="modal-body">
          <!-- Percentile hero: circular dial + statement -->
          <div class="percentile-hero">
            <div class="percentile-dial">
              <svg viewBox="0 0 140 140" aria-hidden="true">
                <defs>
                  <linearGradient :id="`dialGrad-${item.item_id}`" x1="0" x2="1" y1="1" y2="0">
                    <stop offset="0%" stop-color="#a87f2f" />
                    <stop offset="50%" stop-color="#e6c168" />
                    <stop offset="100%" stop-color="#f5d98a" />
                  </linearGradient>
                </defs>
                <circle class="dial-track" cx="70" cy="70" r="60" />
                <circle
                  class="dial-arc"
                  cx="70"
                  cy="70"
                  r="60"
                  :stroke="`url(#dialGrad-${item.item_id})`"
                  :style="{ strokeDashoffset: dialOffset }"
                />
              </svg>
              <div class="dial-center">
                <div class="dial-percent">{{ getPercentile() }}<span>%</span></div>
                <div class="dial-label">Percentile</div>
              </div>
            </div>
            <div class="percentile-statement">
              <div class="eyebrow">Reckoning</div>
              <p class="statement">
                This artifact outperforms
                <strong>{{ getPercentile() }}%</strong>
                of all chronicled parses.
              </p>
            </div>
          </div>

          <!-- Stats summary row -->
          <div class="stats-row">
            <div class="stat-card hero">
              <div class="stat-card-label">Total DPS</div>
              <div class="stat-card-value hi">{{ formatDPS(displayTotalDps) }}</div>
            </div>
            <div
              v-for="comp in mainHandDisplayComponents"
              :key="comp.key"
              class="stat-card"
              :class="[comp.badgeClass, `accent-${comp.key}`]"
              :title="comp.tooltip"
            >
              <div class="stat-card-label">{{ comp.label }}</div>
              <div class="stat-card-value">{{ formatDPS(comp.value) }}</div>
            </div>
          </div>

          <div
            v-if="offHandDisplayComponents.length"
            class="stats-row secondary-row"
          >
            <div class="row-label">
              <span class="eyebrow">Off Hand</span>
            </div>
            <div
              v-for="offComp in offHandDisplayComponents"
              :key="`off-${offComp.key}`"
              class="stat-card subtle"
              :class="[offComp.badgeClass, `accent-${offComp.key}`]"
              :title="offComp.tooltip"
            >
              <div class="stat-card-label">{{ offComp.label }}</div>
              <div class="stat-card-value">{{ formatDPS(offComp.value) }}</div>
            </div>
          </div>

          <!-- Peer comparison panel -->
          <div class="chart-panel">
            <div class="chart-head">
              <span class="chart-glyph" aria-hidden="true">✦</span>
              <div class="chart-copy">
                <h3 class="chart-title">Relative Standing Among Peers</h3>
                <p class="chart-subtitle">A ranked peer board with range, median, and DPS mix at a glance.</p>
              </div>
            </div>

            <div v-if="rankedPeers.length" class="peer-landscape">
              <div class="peer-summary">
                <article class="peer-pill current">
                  <span class="peer-pill-label">Peer Rank</span>
                  <strong class="peer-pill-value">#{{ currentPeerRank }} / {{ rankedPeers.length }}</strong>
                </article>
                <article class="peer-pill">
                  <span class="peer-pill-label">Peer Median</span>
                  <strong class="peer-pill-value">{{ formatDPS(peerMedianTotal) }}</strong>
                </article>
                <article class="peer-pill" :class="{ positive: peerDeltaFromMedian >= 0, negative: peerDeltaFromMedian < 0 }">
                  <span class="peer-pill-label">{{ peerDeltaFromMedian >= 0 ? 'Above Median' : 'Below Median' }}</span>
                  <strong class="peer-pill-value">{{ formatSignedDPS(peerDeltaFromMedian) }}</strong>
                </article>
                <article class="peer-pill">
                  <span class="peer-pill-label">Gap to Leader</span>
                  <strong class="peer-pill-value">{{ formatDPS(peerGapToLeader) }}</strong>
                </article>
              </div>

              <div class="peer-range">
                <div class="peer-range-labels">
                  <div class="peer-range-end">
                    <span class="peer-range-kicker">Peer Floor</span>
                    <strong>{{ formatDPS(peerMinTotal) }}</strong>
                  </div>
                  <div class="peer-range-end align-right">
                    <span class="peer-range-kicker">Peer Ceiling</span>
                    <strong>{{ formatDPS(peerMaxTotal) }}</strong>
                  </div>
                </div>
                <div class="peer-range-track">
                  <div class="peer-range-band"></div>
                  <div class="peer-range-fill" :style="peerRangeFillStyle"></div>

                  <div class="peer-marker median" :class="{ 'is-crowded': peerMarkersOverlap }" :style="{ left: `${peerMedianPct}%` }">
                    <div class="peer-marker-body">
                      <span class="peer-marker-dot"></span>
                      <span class="peer-marker-label">Median</span>
                    </div>
                  </div>

                  <div class="peer-marker current" :class="{ 'is-crowded': peerMarkersOverlap }" :style="{ left: `${peerCurrentPct}%` }">
                    <div class="peer-marker-body">
                      <ItemIcon
                        :icon="item.icon"
                        :name="item.name || `Item #${item.item_id}`"
                        size="xs"
                        :title="item.name || `Item #${item.item_id}`"
                      />
                      <span class="peer-marker-label">Current</span>
                    </div>
                  </div>
                </div>
              </div>

              <div class="peer-board">
                <article
                  v-for="peer in rankedPeers"
                  :key="peer.item.item_id"
                  class="peer-row"
                  :class="{ current: peer.isCurrent }"
                >
                  <div class="peer-rank">#{{ peer.rank }}</div>
                  <ItemIcon
                    :icon="peer.item.icon"
                    :name="peer.item.name || `Item #${peer.item.item_id}`"
                    size="xs"
                    :title="peer.item.name || `Item #${peer.item.item_id}`"
                  />
                  <div class="peer-main">
                    <div class="peer-topline">
                      <span class="peer-name">{{ peer.item.name || `Item #${peer.item.item_id}` }}</span>
                      <span v-if="peer.isCurrent" class="peer-badge current">Current</span>
                      <span v-else class="peer-badge">{{ formatPeerGap(peer.deltaFromCurrent) }}</span>
                    </div>
                    <div class="peer-bar">
                      <div class="peer-bar-fill" :style="{ width: `${peer.widthPct}%` }">
                        <span
                          v-for="segment in peer.segments"
                          :key="`${peer.item.item_id}-${segment.key}`"
                          class="peer-bar-segment"
                          :style="{ width: `${segment.sharePct}%`, background: segment.color }"
                        ></span>
                      </div>
                    </div>
                  </div>
                  <div class="peer-total">{{ formatDPS(peer.total) }}</div>
                </article>
              </div>
            </div>

            <div v-else class="peer-empty">
              No comparable peers were found for this item yet.
            </div>
          </div>

          <!-- Detail sections -->
          <div class="item-details-grid">
            <div class="detail-section">
              <div class="section-head">
                <span class="section-glyph">⚔</span>
                <h4>Weapon Stats</h4>
              </div>
              <div class="detail-row" v-if="item.damage">
                <span>Damage</span>
                <strong>{{ item.damage }}</strong>
              </div>
              <div class="detail-row" v-if="item.delay">
                <span>Delay</span>
                <strong>{{ item.delay }}</strong>
              </div>
              <div class="detail-row" v-if="item.ac">
                <span>AC</span>
                <strong>{{ item.ac }}</strong>
              </div>
              <div class="detail-row empty" v-if="!item.damage && !item.delay && !item.ac">
                <span>No combat stats recorded</span>
              </div>
            </div>

            <div class="detail-section">
              <div class="section-head">
                <span class="section-glyph">✦</span>
                <h4>Requirements</h4>
              </div>
              <div class="detail-row" v-if="item.reqlevel">
                <span>Required Level</span>
                <strong>{{ item.reqlevel }}</strong>
              </div>
              <div class="detail-row" v-if="item.classes">
                <span>Classes</span>
                <strong>{{ getClassNames(item.classes) }}</strong>
              </div>
              <div class="detail-row empty" v-if="!item.reqlevel && !item.classes">
                <span>No restrictions</span>
              </div>
            </div>
          </div>

          <div class="action-buttons">
            <a
              :href="`https://alla.clumsysworld.com/?a=item&id=${item.item_id}`"
              target="_blank"
              rel="noopener noreferrer"
              class="btn-primary"
            >
              <span class="btn-glyph">✦</span>
              View on Allakhazam
              <span class="btn-arrow">↗</span>
            </a>
            <button @click="close" class="btn-secondary">Close Codex</button>
          </div>
        </div>
      </div>
    </div>
  </transition>
</template>

<script>
import ItemIcon from './ItemIcon.vue'
import { formatDPS, getClassNames } from '../utils/formatters'

const MAIN_HAND_COMPONENTS = [
  {
    key: 'mh',
    field: 'mh_dps',
    label: 'Main Hand DPS',
    backgroundColor: 'rgba(197, 127, 124, 0.5)',
    highlightBackground: 'rgba(197, 127, 124, 0.82)',
    borderColor: 'rgba(197, 127, 124, 0.72)',
    highlightBorder: '#c57f7c'
  },
  {
    key: 'spell',
    field: 'mh_spell_dps',
    label: 'Spell DPS',
    backgroundColor: 'rgba(127, 157, 197, 0.5)',
    highlightBackground: 'rgba(127, 157, 197, 0.82)',
    borderColor: 'rgba(127, 157, 197, 0.72)',
    highlightBorder: '#7f9dc5'
  },
  {
    key: 'bane',
    field: 'bane_dps',
    label: 'Bane DPS',
    badgeClass: 'bane',
    backgroundColor: 'rgba(198, 160, 106, 0.5)',
    highlightBackground: 'rgba(198, 160, 106, 0.82)',
    borderColor: 'rgba(198, 160, 106, 0.72)',
    highlightBorder: '#c6a06a'
  },
  {
    key: 'backstab',
    field: 'bs_dps',
    label: 'Backstab DPS',
    badgeClass: 'backstab',
    backgroundColor: 'rgba(153, 139, 195, 0.5)',
    highlightBackground: 'rgba(153, 139, 195, 0.82)',
    borderColor: 'rgba(153, 139, 195, 0.72)',
    highlightBorder: '#998bc3'
  }
].filter(component => component && component.key && component.field);

const OFF_HAND_COMPONENTS = [
  {
    key: 'oh',
    field: 'oh_dps',
    label: 'OH DPS',
    backgroundColor: 'rgba(183, 144, 100, 0.5)',
    highlightBackground: 'rgba(183, 144, 100, 0.82)',
    borderColor: 'rgba(183, 144, 100, 0.72)',
    highlightBorder: '#b79064'
  },
  {
    key: 'spell',
    field: 'oh_spell_dps',
    label: 'Spell DPS',
    backgroundColor: 'rgba(124, 174, 184, 0.5)',
    highlightBackground: 'rgba(124, 174, 184, 0.82)',
    borderColor: 'rgba(124, 174, 184, 0.72)',
    highlightBorder: '#7caeb8'
  },
  {
    key: 'bane',
    field: 'bane_dps',
    label: 'Bane DPS',
    badgeClass: 'bane',
    backgroundColor: 'rgba(198, 160, 106, 0.5)',
    highlightBackground: 'rgba(198, 160, 106, 0.82)',
    borderColor: 'rgba(198, 160, 106, 0.72)',
    highlightBorder: '#c6a06a'
  }
].filter(component => component && component.key && component.field);

export default {
  name: 'ItemDetailModal',
  components: {
    ItemIcon
  },
  props: {
    isOpen: {
      type: Boolean,
      default: false
    },
    item: {
      type: Object,
      default: () => ({})
    },
    allItems: {
      type: Array,
      default: () => []
    }
  },
  emits: ['close'],
  computed: {
    dialOffset() {
      const circumference = 2 * Math.PI * 60;
      const pct = Math.max(0, Math.min(100, this.getPercentile()));
      return circumference - (pct / 100) * circumference;
    },
    mainHandComponents() {
      return MAIN_HAND_COMPONENTS.filter(component => component && component.key && component.field);
    },
    offHandComponents() {
      return OFF_HAND_COMPONENTS.filter(component => component && component.key && component.field);
    },
    componentMetrics() {
      return {
        main: this.computeItemMetrics(this.item, this.mainHandComponents, { useOffHandLogic: false }),
        off: this.computeItemMetrics(this.item, this.offHandComponents, { useOffHandLogic: true })
      };
    },
    displayTotalDps() {
      return this.componentMetrics.main.targetTotal;
    },
    mainHandDisplayComponents() {
      return this.mainHandComponents.map(component => {
        const value = this.componentValue('main', component.key);
        return {
          ...component,
          value,
          tooltip: this.componentTooltip('main', component.key)
        };
      }).filter(component => component.value > 0.0001);
    },
    offHandDisplayComponents() {
      return this.offHandComponents.map(component => {
        const value = this.componentValue('off', component.key);
        return {
          ...component,
          value,
          tooltip: this.componentTooltip('off', component.key)
        };
      }).filter(component => component.value > 0.0001);
    },
    similarItems() {
      return this.getSimilarItems();
    },
    peerEntries() {
      return this.similarItems.map((peerItem) => {
        const metrics = this.computeItemMetrics(peerItem, this.mainHandComponents, { useOffHandLogic: false });
        const total = Number(metrics.targetTotal ?? metrics.scaled?.total ?? 0);
        const segments = this.mainHandComponents
          .map((component) => {
            const value = Number(metrics.scaled?.[component.key] ?? 0);
            return {
              key: component.key,
              value,
              color: component.highlightBackground || component.backgroundColor || this.getComponentColor(component.key, 'highlightBackground')
            };
          })
          .filter((segment) => segment.value > 0.0001);

        return {
          item: peerItem,
          metrics,
          total,
          segments
        };
      });
    },
    rankedPeers() {
      const peers = [...this.peerEntries].sort((left, right) => {
        const diff = right.total - left.total;
        if (Math.abs(diff) > 0.0001) return diff;
        return Number(left.item?.item_id ?? 0) - Number(right.item?.item_id ?? 0);
      });

      const maxTotal = Math.max(...peers.map((peer) => peer.total), 0);
      const currentTotal = this.displayTotalDps;

      return peers.map((peer, index) => ({
        ...peer,
        rank: index + 1,
        isCurrent: peer.item?.item_id === this.item?.item_id,
        widthPct: maxTotal > 0 ? Math.max((peer.total / maxTotal) * 100, peer.total > 0 ? 10 : 0) : 0,
        deltaFromCurrent: peer.total - currentTotal,
        segments: peer.segments.map((segment) => ({
          ...segment,
          sharePct: peer.total > 0 ? (segment.value / peer.total) * 100 : 0
        }))
      }));
    },
    currentPeerRank() {
      const current = this.rankedPeers.find((peer) => peer.isCurrent);
      return current ? current.rank : 0;
    },
    peerTotalsAsc() {
      return [...this.peerEntries].sort((left, right) => {
        const diff = left.total - right.total;
        if (Math.abs(diff) > 0.0001) return diff;
        return Number(left.item?.item_id ?? 0) - Number(right.item?.item_id ?? 0);
      });
    },
    peerMinTotal() {
      return this.peerTotalsAsc[0]?.total ?? 0;
    },
    peerMaxTotal() {
      return this.peerTotalsAsc[this.peerTotalsAsc.length - 1]?.total ?? 0;
    },
    peerMedianEntry() {
      if (!this.peerTotalsAsc.length) return null;
      return this.peerTotalsAsc[Math.floor((this.peerTotalsAsc.length - 1) / 2)] ?? null;
    },
    peerMedianTotal() {
      return this.peerMedianEntry?.total ?? 0;
    },
    peerDeltaFromMedian() {
      return this.displayTotalDps - this.peerMedianTotal;
    },
    peerGapToLeader() {
      return Math.max(this.peerMaxTotal - this.displayTotalDps, 0);
    },
    peerMedianPct() {
      return this.scalePeerPosition(this.peerMedianTotal);
    },
    peerCurrentPct() {
      return this.scalePeerPosition(this.displayTotalDps);
    },
    peerMarkersOverlap() {
      return Math.abs(this.peerMedianPct - this.peerCurrentPct) < 9;
    },
    peerRangeFillStyle() {
      const start = 4;
      const end = Math.max(this.peerCurrentPct, start);
      return {
        left: `${start}%`,
        width: `${Math.max(end - start, 0)}%`
      };
    }
  },
  methods: {
    formatDPS,
    getClassNames,
    formatSignedDPS(value) {
      const safe = Number(value ?? 0);
      if (Math.abs(safe) < 0.005) {
        return '0.00';
      }

      return `${safe > 0 ? '+' : '-'}${this.formatDPS(Math.abs(safe))}`;
    },
    formatPeerGap(value) {
      const safe = Number(value ?? 0);
      if (Math.abs(safe) < 0.005) {
        return 'Even';
      }

      return `${safe > 0 ? '+' : '-'}${this.formatDPS(Math.abs(safe))}`;
    },
    componentTooltip(hand, key) {
      const metrics = this.componentMetrics?.[hand];
      if (!metrics || !key) return '';

      const scaled = metrics.scaled?.[key] ?? 0;
      const raw = metrics.raw?.[key] ?? 0;

      if (Math.abs(scaled - raw) < 0.01) {
        return `Raw DPS: ${this.formatDPS(raw)}`;
      }

      return `Scaled DPS: ${this.formatDPS(scaled)} (Raw: ${this.formatDPS(raw)})`;
    },
    componentValue(hand, key) {
      const metrics = this.componentMetrics?.[hand];
      if (!metrics || !key) return 0;
      return metrics.scaled?.[key] ?? 0;
    },
    computeItemMetrics(item, components, { useOffHandLogic = false } = {}) {
      const safeComponents = Array.isArray(components)
        ? components.filter(component => component && component.key && component.field)
        : [];

      const rawValues = safeComponents.map(component => {
        const value = Number(item?.[component.field] ?? 0);
        return Number.isFinite(value) && value > 0 ? value : 0;
      });

      const rawTotal = rawValues.reduce((sum, value) => sum + value, 0);
      let targetTotal = Number(item?.total_dps ?? 0);

      if (!Number.isFinite(targetTotal) || targetTotal < 0) {
        targetTotal = 0;
      }

      if (useOffHandLogic) {
        if (rawTotal > targetTotal || targetTotal <= 0) {
          targetTotal = rawTotal;
        }
      } else if (targetTotal <= 0) {
        targetTotal = rawTotal;
      }

      let scaledValues;
      if (rawTotal > 0 && targetTotal > 0) {
        const scale = targetTotal / rawTotal;
        scaledValues = rawValues.map(value => value * scale);
      } else if (targetTotal > 0 && safeComponents.length > 0) {
        scaledValues = safeComponents.map((_, index) => (index === 0 ? targetTotal : 0));
      } else {
        scaledValues = rawValues.map(() => 0);
      }

      const scaledMap = {};
      const rawMap = {};
      safeComponents.forEach((component, index) => {
        scaledMap[component.key] = scaledValues[index];
        rawMap[component.key] = rawValues[index];
      });

      return {
        scaled: {
          ...scaledMap,
          total: scaledValues.reduce((sum, value) => sum + value, 0)
        },
        raw: {
          ...rawMap,
          total: rawValues.reduce((sum, value) => sum + value, 0)
        },
        rawTotal,
        targetTotal
      };
    },
    getComponentColor(key, variant) {
      const palette = {
        mh: {
          background: 'rgba(243, 139, 168, 0.5)',
          highlightBackground: 'rgba(243, 139, 168, 0.85)',
          border: 'rgba(243, 139, 168, 0.8)',
          highlightBorder: '#f38ba8'
        },
        spell: {
          background: 'rgba(166, 227, 161, 0.5)',
          highlightBackground: 'rgba(166, 227, 161, 0.85)',
          border: 'rgba(166, 227, 161, 0.8)',
          highlightBorder: '#a6e3a1'
        },
        bane: {
          background: 'rgba(250, 179, 135, 0.5)',
          highlightBackground: 'rgba(250, 179, 135, 0.85)',
          border: 'rgba(250, 179, 135, 0.8)',
          highlightBorder: '#fab387'
        },
        backstab: {
          background: 'rgba(180, 190, 254, 0.5)',
          highlightBackground: 'rgba(180, 190, 254, 0.85)',
          border: 'rgba(180, 190, 254, 0.8)',
          highlightBorder: '#b4befe'
        },
        oh: {
          background: 'rgba(243, 139, 168, 0.5)',
          highlightBackground: 'rgba(243, 139, 168, 0.85)',
          border: 'rgba(243, 139, 168, 0.8)',
          highlightBorder: '#f38ba8'
        }
      };

      const entry = palette[key] || {};
      return entry[variant] || entry.background || '#89b4fa';
    },
    scalePeerPosition(value) {
      const min = this.peerMinTotal;
      const max = this.peerMaxTotal;
      const safeValue = Number(value ?? 0);

      if (!Number.isFinite(safeValue) || max <= min) {
        return 50;
      }

      const normalized = ((safeValue - min) / (max - min)) * 100;
      return Math.max(4, Math.min(96, normalized));
    },
    close() {
      this.$emit('close');
    },
    getSimilarItems() {
      if (!this.item || !this.item.total_dps) return [];
      const targetDps = this.item.total_dps;
      const minDps = targetDps * 0.5;
      const maxDps = targetDps * 1.5;
      
      let similar = this.allItems.filter(i => 
        (i.itemtype === this.item.itemtype || 
         (i.total_dps >= minDps && i.total_dps <= maxDps))
      );
      
      similar = similar.sort((a, b) => a.total_dps - b.total_dps);
      
      if (!similar.find(i => i.item_id === this.item.item_id)) {
        similar.push(this.item);
        similar.sort((a, b) => a.total_dps - b.total_dps);
      }
      
      if (similar.length > 10) {
        const currentIndex = similar.findIndex(i => i.item_id === this.item.item_id);
        const start = Math.max(0, currentIndex - 4);
        const end = Math.min(similar.length, start + 10);
        similar = similar.slice(start, end);
      }
      
      return similar;
    },
    getPercentile() {
      if (!this.allItems.length || !this.item || !this.item.total_dps) return 0;
      const lowerCount = this.allItems.filter(i => i.total_dps < this.item.total_dps).length;
      return Math.round((lowerCount / this.allItems.length) * 100);
    }
  },
  watch: {
    isOpen(val) {
      document.body.style.overflow = val ? 'hidden' : '';
    }
  }
};
</script>

<style scoped>
/* ============================================
   Overlay + container
   ============================================ */
.modal-overlay {
  position: fixed;
  inset: 0;
  background:
    radial-gradient(ellipse at top, rgba(230, 193, 104, 0.06), transparent 55%),
    rgba(5, 5, 10, 0.78);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(6px);
  padding: 24px;
}

.modal-container {
  position: relative;
  background:
    radial-gradient(ellipse at top, rgba(230, 193, 104, 0.05) 0%, transparent 55%),
    linear-gradient(180deg, rgba(19, 19, 37, 0.97) 0%, rgba(7, 7, 13, 0.98) 100%);
  border: 1px solid var(--line-gold);
  border-radius: var(--r-lg);
  max-width: 960px;
  width: 100%;
  max-height: 92vh;
  overflow-y: auto;
  box-shadow:
    0 40px 80px rgba(0, 0, 0, 0.7),
    0 0 60px rgba(230, 193, 104, 0.12),
    inset 0 1px 0 rgba(230, 193, 104, 0.08);
}

/* Top hairline */
.modal-container::before {
  content: '';
  position: absolute;
  top: 0;
  left: 40px;
  right: 40px;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--gold) 50%, transparent);
  pointer-events: none;
}

/* Ornamental corners */
.frame-corner {
  position: absolute;
  width: 22px;
  height: 22px;
  border: 1px solid var(--gold);
  pointer-events: none;
  opacity: 0.9;
}
.frame-corner.corner-tl { top: -1px; left: -1px; border-right: none; border-bottom: none; border-top-left-radius: var(--r-lg); }
.frame-corner.corner-tr { top: -1px; right: -1px; border-left: none; border-bottom: none; border-top-right-radius: var(--r-lg); }
.frame-corner.corner-bl { bottom: -1px; left: -1px; border-right: none; border-top: none; border-bottom-left-radius: var(--r-lg); }
.frame-corner.corner-br { bottom: -1px; right: -1px; border-left: none; border-top: none; border-bottom-right-radius: var(--r-lg); }

/* ============================================
   Header
   ============================================ */
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  padding: 28px 32px 18px;
}

.header-left {
  display: flex;
  gap: 18px;
  align-items: center;
}

.title-block {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.eyebrow {
  font-family: var(--font-display);
  font-size: 0.7rem;
  letter-spacing: 0.42em;
  color: var(--gold);
  text-transform: uppercase;
  opacity: 0.85;
  font-weight: 600;
}

.modal-title {
  font-family: var(--font-display);
  color: var(--ink-primary);
  font-size: 1.75rem;
  font-weight: 600;
  margin: 0;
  letter-spacing: 0.04em;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.6);
}

.close-btn {
  all: unset;
  cursor: pointer;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  color: var(--rune-flame);
  font-size: 1.05rem;
  border: 1px solid rgba(239, 107, 107, 0.35);
  background: rgba(239, 107, 107, 0.08);
  transition: all 0.2s;
}

.close-btn:hover {
  background: rgba(239, 107, 107, 0.2);
  box-shadow: 0 0 16px rgba(239, 107, 107, 0.35);
  transform: rotate(90deg);
}

.header-rule {
  margin: 0 32px;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--line-gold) 15%, var(--line-gold) 85%, transparent);
}

/* ============================================
   Body
   ============================================ */
.modal-body {
  padding: 24px 32px 32px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* ============================================
   Percentile hero
   ============================================ */
.percentile-hero {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 28px;
  align-items: center;
  padding: 24px 28px;
  background:
    radial-gradient(circle at 15% 50%, rgba(230, 193, 104, 0.1) 0%, transparent 60%),
    linear-gradient(135deg, rgba(19, 19, 37, 0.85) 0%, rgba(13, 13, 25, 0.9) 100%);
  border: 1px solid var(--line-gold);
  border-radius: var(--r-md);
  box-shadow: inset 0 1px 0 rgba(230, 193, 104, 0.06);
}

.percentile-dial {
  position: relative;
  width: 140px;
  height: 140px;
  flex-shrink: 0;
}

.percentile-dial svg {
  width: 100%;
  height: 100%;
  transform: rotate(-90deg);
  filter: drop-shadow(0 0 14px rgba(230, 193, 104, 0.3));
}

.dial-track {
  fill: none;
  stroke: rgba(230, 193, 104, 0.12);
  stroke-width: 6;
}

.dial-arc {
  fill: none;
  stroke-width: 8;
  stroke-linecap: round;
  stroke-dasharray: 376.99;
  transition: stroke-dashoffset 0.9s cubic-bezier(0.2, 0.8, 0.2, 1);
}

.dial-center {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  text-align: center;
}

.dial-percent {
  font-family: var(--font-mono);
  font-size: 2.4rem;
  font-weight: 700;
  color: var(--gold-bright);
  letter-spacing: -0.02em;
  line-height: 1;
  text-shadow: 0 0 18px var(--gold-glow);
}

.dial-percent span {
  font-size: 1rem;
  color: var(--gold);
  margin-left: 2px;
  font-weight: 500;
}

.dial-label {
  font-family: var(--font-display);
  font-size: 0.65rem;
  letter-spacing: 0.3em;
  color: var(--ink-muted);
  text-transform: uppercase;
  margin-top: 2px;
}

.percentile-statement {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.statement {
  color: var(--ink-primary);
  font-size: 1.05rem;
  line-height: 1.5;
  margin: 0;
  font-family: var(--font-body);
}

.statement strong {
  font-family: var(--font-mono);
  color: var(--gold-bright);
  font-weight: 700;
  letter-spacing: 0.01em;
}

/* ============================================
   Stats rows
   ============================================ */
.stats-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 12px;
}

.stats-row.secondary-row {
  grid-template-columns: auto repeat(auto-fit, minmax(130px, 1fr));
  align-items: stretch;
}

.row-label {
  display: flex;
  align-items: center;
  padding: 0 12px;
}

.stat-card {
  position: relative;
  padding: 14px 18px;
  background: linear-gradient(180deg, rgba(19, 19, 37, 0.7) 0%, rgba(13, 13, 25, 0.75) 100%);
  border: 1px solid var(--line-soft);
  border-radius: var(--r-md);
  display: flex;
  flex-direction: column;
  gap: 6px;
  transition: all 0.25s;
  overflow: hidden;
}

.stat-card::before {
  content: '';
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  width: 3px;
  background: var(--accent, var(--gold));
  opacity: 0.6;
}

.stat-card:hover {
  transform: translateY(-2px);
  border-color: var(--line-gold);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.4), 0 0 16px var(--gold-glow);
}

.stat-card.hero {
  --accent: var(--rune-jade);
  background:
    radial-gradient(circle at 0% 50%, rgba(124, 217, 146, 0.08), transparent 70%),
    linear-gradient(180deg, rgba(19, 19, 37, 0.85), rgba(13, 13, 25, 0.9));
  border-color: rgba(124, 217, 146, 0.35);
}

.stat-card.subtle {
  background: rgba(7, 7, 13, 0.5);
}

.stat-card.accent-mh { --accent: var(--rune-flame); }
.stat-card.accent-oh { --accent: var(--rune-amber); }
.stat-card.accent-spell { --accent: var(--rune-jade); }
.stat-card.accent-bane { --accent: var(--rune-violet); }
.stat-card.accent-backstab { --accent: var(--rune-mana); }

.stat-card-label {
  font-family: var(--font-display);
  color: var(--ink-muted);
  font-size: 0.65rem;
  letter-spacing: 0.25em;
  text-transform: uppercase;
  font-weight: 600;
}

.stat-card-value {
  font-family: var(--font-mono);
  color: var(--ink-primary);
  font-size: 1.35rem;
  font-weight: 700;
  letter-spacing: -0.01em;
}

.stat-card-value.hi {
  color: var(--rune-jade);
  text-shadow: 0 0 12px rgba(124, 217, 146, 0.3);
  font-size: 1.55rem;
}

/* ============================================
   Chart panel
   ============================================ */
.chart-panel {
  background: linear-gradient(180deg, rgba(19, 19, 37, 0.65) 0%, rgba(7, 7, 13, 0.8) 100%);
  border: 1px solid var(--line-gold);
  border-radius: var(--r-md);
  padding: 20px 24px 22px;
  position: relative;
  overflow: hidden;
}

.chart-panel::before {
  content: '';
  position: absolute;
  top: 0;
  left: 30px;
  right: 30px;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--gold) 50%, transparent);
  opacity: 0.7;
}

.chart-head {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 16px;
}

.chart-glyph {
  color: var(--gold);
  font-size: 1.1rem;
  filter: drop-shadow(0 0 8px var(--gold-glow));
}

.chart-copy {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.chart-title {
  font-family: var(--font-display);
  color: var(--ink-primary);
  font-size: 1.05rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  margin: 0;
}

.chart-subtitle {
  margin: 0;
  color: var(--ink-muted);
  font-size: 0.88rem;
  line-height: 1.45;
}

.peer-landscape {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.peer-summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 10px;
}

.peer-pill {
  padding: 12px 14px;
  border-radius: var(--r-sm);
  border: 1px solid var(--line-soft);
  background: rgba(7, 7, 13, 0.42);
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.peer-pill.current {
  border-color: rgba(230, 193, 104, 0.4);
  background: rgba(230, 193, 104, 0.08);
}

.peer-pill.positive .peer-pill-value {
  color: var(--rune-jade);
}

.peer-pill.negative .peer-pill-value {
  color: var(--rune-flame);
}

.peer-pill-label {
  font-family: var(--font-display);
  color: var(--ink-muted);
  font-size: 0.62rem;
  letter-spacing: 0.24em;
  text-transform: uppercase;
}

.peer-pill-value {
  font-family: var(--font-mono);
  font-size: 1.05rem;
  color: var(--ink-primary);
}

.peer-range {
  padding: 16px 16px 12px;
  border-radius: var(--r-md);
  border: 1px solid var(--line-soft);
  background:
    radial-gradient(circle at 0% 50%, rgba(230, 193, 104, 0.08), transparent 58%),
    rgba(7, 7, 13, 0.46);
}

.peer-range-labels {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
}

.peer-range-end {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.peer-range-end.align-right {
  text-align: right;
}

.peer-range-kicker {
  font-family: var(--font-display);
  color: var(--ink-muted);
  font-size: 0.62rem;
  letter-spacing: 0.2em;
  text-transform: uppercase;
}

.peer-range-end strong {
  font-family: var(--font-mono);
  color: var(--ink-primary);
  font-size: 0.98rem;
}

.peer-range-track {
  position: relative;
  padding: 28px 0 30px;
}

.peer-range-band {
  height: 12px;
  border-radius: var(--r-pill);
  border: 1px solid var(--line-soft);
  background:
    linear-gradient(90deg, rgba(124, 217, 146, 0.1), rgba(230, 193, 104, 0.18), rgba(197, 127, 124, 0.24));
}

.peer-range-fill {
  position: absolute;
  top: 28px;
  height: 12px;
  border-radius: var(--r-pill);
  background: linear-gradient(90deg, rgba(230, 193, 104, 0.22), rgba(230, 193, 104, 0.5));
  box-shadow: 0 0 18px rgba(230, 193, 104, 0.16);
}

.peer-marker {
  position: absolute;
  top: 0;
  transform: translateX(-50%);
  z-index: 1;
}

.peer-marker-body {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.peer-marker::after {
  content: '';
  width: 1px;
  height: 24px;
  background: rgba(230, 193, 104, 0.42);
}

.peer-marker.current::after {
  background: rgba(230, 193, 104, 0.7);
}

.peer-marker-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--gold);
  box-shadow: 0 0 12px var(--gold-glow);
}

.peer-marker-label {
  font-family: var(--font-display);
  color: var(--ink-muted);
  font-size: 0.58rem;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  white-space: nowrap;
}

.peer-marker.current .peer-marker-label {
  color: var(--gold);
}

.peer-marker.is-crowded.median .peer-marker-body {
  transform: translateX(-34px);
}

.peer-marker.is-crowded.current .peer-marker-body {
  transform: translateX(34px);
}

.peer-board {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.peer-row {
  display: grid;
  grid-template-columns: 38px 24px minmax(0, 1fr) auto;
  gap: 12px;
  align-items: center;
  padding: 10px 12px;
  border-radius: var(--r-sm);
  border: 1px solid var(--line-soft);
  background: rgba(7, 7, 13, 0.36);
  transition: all 0.22s ease;
}

.peer-row.current {
  border-color: rgba(230, 193, 104, 0.42);
  background:
    radial-gradient(circle at 0% 50%, rgba(230, 193, 104, 0.1), transparent 50%),
    rgba(12, 12, 22, 0.68);
  box-shadow: inset 0 1px 0 rgba(230, 193, 104, 0.12);
}

.peer-row:hover {
  border-color: var(--line-gold);
  transform: translateY(-1px);
}

.peer-rank {
  font-family: var(--font-display);
  color: var(--gold);
  font-size: 0.78rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  text-align: center;
}

.peer-main {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.peer-topline {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.peer-name {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-family: var(--font-display);
  color: var(--ink-primary);
}

.peer-badge {
  flex-shrink: 0;
  padding: 3px 7px;
  border-radius: var(--r-pill);
  border: 1px solid var(--line-soft);
  color: var(--ink-muted);
  font-family: var(--font-mono);
  font-size: 0.68rem;
}

.peer-badge.current {
  color: var(--gold);
  border-color: rgba(230, 193, 104, 0.42);
  background: rgba(230, 193, 104, 0.09);
}

.peer-bar {
  height: 10px;
  border-radius: var(--r-pill);
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.06);
  overflow: hidden;
}

.peer-bar-fill {
  height: 100%;
  display: flex;
  border-radius: inherit;
  overflow: hidden;
  box-shadow: 0 0 14px rgba(230, 193, 104, 0.08);
}

.peer-bar-segment {
  height: 100%;
}

.peer-total {
  font-family: var(--font-mono);
  color: var(--ink-primary);
  font-size: 0.9rem;
  font-weight: 700;
  white-space: nowrap;
}

.peer-empty {
  color: var(--ink-muted);
  font-style: italic;
  padding: 10px 0 2px;
}

/* ============================================
   Detail sections
   ============================================ */
.item-details-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 14px;
}

.detail-section {
  background: rgba(7, 7, 13, 0.55);
  border: 1px solid var(--line-soft);
  border-radius: var(--r-md);
  padding: 18px 20px;
  transition: all 0.25s;
}

.detail-section:hover {
  border-color: var(--line-gold);
  background: rgba(13, 13, 25, 0.7);
}

.section-head {
  display: flex;
  align-items: center;
  gap: 10px;
  padding-bottom: 10px;
  margin-bottom: 10px;
  border-bottom: 1px solid var(--line-dim);
}

.section-glyph {
  color: var(--gold);
  font-size: 0.95rem;
  filter: drop-shadow(0 0 6px var(--gold-glow));
}

.detail-section h4 {
  font-family: var(--font-display);
  color: var(--gold);
  font-size: 0.78rem;
  margin: 0;
  letter-spacing: 0.28em;
  text-transform: uppercase;
  font-weight: 600;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 7px 0;
  color: var(--ink-secondary);
  font-size: 0.95rem;
}

.detail-row + .detail-row {
  border-top: 1px dashed rgba(230, 193, 104, 0.08);
}

.detail-row strong {
  font-family: var(--font-mono);
  color: var(--ink-primary);
  font-weight: 600;
}

.detail-row.empty {
  font-style: italic;
  color: var(--ink-muted);
  justify-content: center;
  padding: 10px 0;
}

/* ============================================
   Action buttons
   ============================================ */
.action-buttons {
  display: flex;
  gap: 14px;
  justify-content: center;
  flex-wrap: wrap;
  padding-top: 6px;
}

.btn-primary,
.btn-secondary {
  all: unset;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 12px 26px;
  border-radius: var(--r-pill);
  font-family: var(--font-display);
  font-size: 0.8rem;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  font-weight: 600;
  transition: all 0.25s;
  text-decoration: none;
}

.btn-primary {
  background: linear-gradient(135deg, var(--gold-deep) 0%, var(--gold) 50%, var(--gold-bright) 100%);
  color: var(--bg-void);
  box-shadow:
    0 4px 14px rgba(230, 193, 104, 0.35),
    inset 0 1px 0 rgba(255, 255, 255, 0.25);
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow:
    0 8px 22px rgba(230, 193, 104, 0.5),
    inset 0 1px 0 rgba(255, 255, 255, 0.35);
}

.btn-glyph,
.btn-arrow {
  font-size: 0.95rem;
  letter-spacing: 0;
}

.btn-arrow {
  transition: transform 0.25s;
}

.btn-primary:hover .btn-arrow {
  transform: translate(2px, -2px);
}

.btn-secondary {
  background: rgba(7, 7, 13, 0.6);
  color: var(--ink-secondary);
  border: 1px solid var(--line-soft);
}

.btn-secondary:hover {
  border-color: var(--gold);
  color: var(--gold);
  background: var(--gold-faint);
  box-shadow: 0 0 16px var(--gold-glow);
}

/* ============================================
   Modal transitions
   ============================================ */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-active .modal-container,
.modal-leave-active .modal-container {
  transition: transform 0.35s cubic-bezier(0.2, 0.8, 0.2, 1.1), opacity 0.3s;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .modal-container,
.modal-leave-to .modal-container {
  transform: scale(0.94) translateY(10px);
  opacity: 0;
}

/* ============================================
   Scrollbar
   ============================================ */
.modal-container::-webkit-scrollbar {
  width: 10px;
}

.modal-container::-webkit-scrollbar-track {
  background: rgba(7, 7, 13, 0.5);
}

.modal-container::-webkit-scrollbar-thumb {
  background: linear-gradient(180deg, var(--gold-deep), var(--gold));
  border-radius: var(--r-pill);
  border: 2px solid rgba(7, 7, 13, 0.6);
}

.modal-container::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(180deg, var(--gold), var(--gold-bright));
}

/* ============================================
   Responsive
   ============================================ */
@media (max-width: 700px) {
  .modal-body {
    padding: 20px 22px 24px;
  }

  .modal-header {
    padding: 22px 22px 14px;
  }

  .header-rule {
    margin: 0 22px;
  }

  .percentile-hero {
    grid-template-columns: 1fr;
    text-align: center;
    justify-items: center;
    padding: 22px 20px;
  }

  .percentile-statement {
    align-items: center;
  }

  .ranking-marks {
    justify-content: center;
  }

  .stats-row.secondary-row {
    grid-template-columns: 1fr;
  }

  .row-label {
    justify-content: center;
  }

  .modal-title {
    font-size: 1.4rem;
  }

  .dial-percent {
    font-size: 2rem;
  }

  .peer-summary {
    grid-template-columns: 1fr 1fr;
  }

  .peer-row {
    grid-template-columns: 30px 24px minmax(0, 1fr);
  }

  .peer-total {
    grid-column: 3;
    justify-self: end;
  }

  .peer-marker.is-crowded.median .peer-marker-body {
    transform: translateX(-24px);
  }

  .peer-marker.is-crowded.current .peer-marker-body {
    transform: translateX(24px);
  }
}
</style>
