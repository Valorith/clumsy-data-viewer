<template>
  <component
    :is="tag"
    :class="['item-icon', `item-icon--${size}`, { 'is-fallback': !hasSpireIcon }]"
    :title="title"
  >
    <span
      v-if="hasSpireIcon"
      :class="['spire-item-icon', spriteClass]"
      aria-hidden="true"
    ></span>
    <span v-else aria-hidden="true">{{ fallbackText }}</span>
  </component>
</template>

<script>
import { ensureSpireSpriteStyles, normalizeIconId } from '../utils/spire-assets';

export default {
  name: 'ItemIcon',
  props: {
    icon: {
      type: [Number, String],
      default: null
    },
    name: {
      type: String,
      default: ''
    },
    size: {
      type: String,
      default: 'md',
      validator(value) {
        return ['xs', 'sm', 'md', 'lg'].includes(value);
      }
    },
    title: {
      type: String,
      default: ''
    },
    tag: {
      type: String,
      default: 'span'
    }
  },
  computed: {
    normalizedIcon() {
      return normalizeIconId(this.icon);
    },
    hasSpireIcon() {
      return Boolean(this.normalizedIcon);
    },
    spriteClass() {
      return `item-${this.normalizedIcon}`;
    },
    fallbackText() {
      const text = (this.name || '?').trim();
      return text.slice(0, 2).toUpperCase();
    }
  },
  mounted() {
    ensureSpireSpriteStyles(['itemIcons']);
  }
};
</script>

<style scoped>
.item-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  flex-shrink: 0;
  border: 1px solid var(--line-brass);
  background: rgba(13, 13, 11, 0.92);
}

.spire-item-icon {
  flex: 0 0 auto;
  transform-origin: center;
  image-rendering: auto;
}

.item-icon.is-fallback {
  font-family: var(--font-display);
  font-weight: 700;
  letter-spacing: 0.08em;
  color: var(--brass-bright);
}

.item-icon--xs {
  width: 24px;
  height: 24px;
  border-radius: 0;
  font-size: 0.58rem;
}

.item-icon--xs .spire-item-icon {
  transform: scale(0.6);
}

.item-icon--sm {
  width: 32px;
  height: 32px;
  border-radius: 0;
  font-size: 0.68rem;
}

.item-icon--sm .spire-item-icon {
  transform: scale(0.8);
}

.item-icon--md {
  width: 44px;
  height: 44px;
  border-radius: 0;
  font-size: 0.8rem;
}

.item-icon--md .spire-item-icon {
  transform: scale(1);
}

.item-icon--lg {
  width: 56px;
  height: 56px;
  border-radius: 0;
  font-size: 0.95rem;
}

.item-icon--lg .spire-item-icon {
  transform: scale(1.2);
}
</style>
