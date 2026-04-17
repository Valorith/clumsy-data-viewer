<template>
  <component
    :is="tag"
    :class="['item-icon', `item-icon--${size}`, { 'is-fallback': !hasRemoteIcon }]"
    :title="title"
  >
    <img
      v-if="hasRemoteIcon"
      :src="remoteSrc"
      alt=""
      aria-hidden="true"
      loading="lazy"
      @error="handleError"
    />
    <span v-else aria-hidden="true">{{ fallbackText }}</span>
  </component>
</template>

<script>
const ICON_BASE_URL = 'https://alla.clumsysworld.com/images/icons';

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
  data() {
    return {
      imageFailed: false
    };
  },
  computed: {
    normalizedIcon() {
      if (this.icon === null || this.icon === undefined) {
        return '';
      }

      return String(this.icon).trim();
    },
    remoteSrc() {
      return /^\d+$/.test(this.normalizedIcon)
        ? `${ICON_BASE_URL}/item_${this.normalizedIcon}.png`
        : null;
    },
    hasRemoteIcon() {
      return Boolean(this.remoteSrc) && !this.imageFailed;
    },
    fallbackText() {
      const text = (this.name || '?').trim();
      return text.slice(0, 2).toUpperCase();
    }
  },
  watch: {
    icon() {
      this.imageFailed = false;
    }
  },
  methods: {
    handleError() {
      this.imageFailed = true;
    }
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
  border: 1px solid rgba(255, 255, 255, 0.12);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.12), rgba(255, 255, 255, 0.04)),
    rgba(8, 8, 14, 0.88);
  box-shadow: 0 10px 22px rgba(0, 0, 0, 0.24);
}

.item-icon img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  image-rendering: pixelated;
}

.item-icon.is-fallback {
  font-family: var(--font-display);
  font-weight: 700;
  letter-spacing: 0.08em;
  color: var(--ink-primary);
}

.item-icon--xs {
  width: 24px;
  height: 24px;
  border-radius: 7px;
  font-size: 0.58rem;
}

.item-icon--sm {
  width: 32px;
  height: 32px;
  border-radius: 9px;
  font-size: 0.68rem;
}

.item-icon--md {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  font-size: 0.8rem;
}

.item-icon--lg {
  width: 56px;
  height: 56px;
  border-radius: 16px;
  font-size: 0.95rem;
}
</style>
