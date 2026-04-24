<template>
  <div
    :class="['item-model-preview', `item-model-preview--${size}`, { 'is-empty': !modelId }]"
    :title="titleText"
  >
    <span
      v-if="modelId"
      :class="['spire-item-model', `object-ctn-${modelId}`]"
      aria-hidden="true"
    ></span>
    <span v-else class="model-empty" aria-hidden="true">No model</span>
  </div>
</template>

<script>
import { ensureSpireSpriteStyles, normalizeModelId } from '../utils/spire-assets';

export default {
  name: 'ItemModelPreview',
  props: {
    item: {
      type: Object,
      default: () => ({})
    },
    size: {
      type: String,
      default: 'md',
      validator(value) {
        return ['sm', 'md', 'lg'].includes(value);
      }
    }
  },
  computed: {
    modelId() {
      return normalizeModelId(this.item);
    },
    titleText() {
      if (!this.modelId) return 'No item model preview';
      return `Spire model IT${this.modelId}`;
    }
  },
  mounted() {
    ensureSpireSpriteStyles(['objects']);
  }
};
</script>

<style scoped>
.item-model-preview {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  flex-shrink: 0;
  border: 1px solid var(--line-strong);
  background:
    linear-gradient(180deg, rgba(224, 193, 132, 0.08), transparent 42%),
    rgba(9, 9, 8, 0.78);
}

.item-model-preview::after {
  content: '';
  position: absolute;
  left: 12%;
  right: 12%;
  bottom: 14%;
  height: 10px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.34);
  filter: blur(4px);
}

.spire-item-model {
  position: relative;
  z-index: 1;
  flex: 0 0 auto;
  transform-origin: center;
  filter: drop-shadow(9px 8px 7px rgba(0, 0, 0, 0.72));
  image-rendering: pixelated;
}

.item-model-preview--sm {
  width: 42px;
  height: 36px;
}

.item-model-preview--sm .spire-item-model {
  transform: scale(0.34);
}

.item-model-preview--md {
  width: 86px;
  height: 78px;
}

.item-model-preview--md .spire-item-model {
  transform: scale(0.68);
}

.item-model-preview--lg {
  width: 100%;
  min-height: 148px;
}

.item-model-preview--lg .spire-item-model {
  transform: scale(1.05);
}

.model-empty {
  color: var(--text-muted);
  font-family: var(--font-display);
  font-size: 0.72rem;
}
</style>
