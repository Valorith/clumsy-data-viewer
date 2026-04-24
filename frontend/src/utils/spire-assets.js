const SPRITE_ROOT = '/eq-asset-preview-master/assets/sprites';

const SPRITE_STYLESHEETS = {
  itemIcons: `${SPRITE_ROOT}/item-icons.css`,
  itemIconsSmall: `${SPRITE_ROOT}/item-icons-sm.css`,
  objects: `${SPRITE_ROOT}/objects.css`
};

const FALLBACK_MODEL_BY_TYPE = {
  0: '100',
  1: '100',
  2: '100',
  3: '10003',
  4: '10001',
  5: '4',
  7: '10100',
  10: '10009',
  35: '10028',
  45: '10015',
  51: '54'
};

const PLACEHOLDER_MODEL_IDS = new Set([
  '100056', '100058', '100074', '101013', '101021', '101045', '101056',
  '11383', '12638', '12639', '12665', '12666', '12694', '12695', '12747',
  '12748', '12774', '12775', '60098', '60099', '60101', '60103', '60128',
  '60130', '60151', '60324', '60480', '60481', '60482', '67907', '67908',
  '67927', '67928', '99238', '99246', '99263', '99271', '99287', '99288'
]);

const loadedStylesheets = new Set();

export function ensureSpireSpriteStyles(keys = ['itemIcons', 'objects']) {
  if (typeof document === 'undefined') return;

  keys.forEach((key) => {
    const href = SPRITE_STYLESHEETS[key];
    if (!href || loadedStylesheets.has(href)) return;

    const existing = document.querySelector(`link[href="${href}"]`);
    if (existing) {
      loadedStylesheets.add(href);
      return;
    }

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    link.dataset.spireAsset = key;
    document.head.appendChild(link);
    loadedStylesheets.add(href);
  });
}

export function normalizeIconId(icon) {
  if (icon === null || icon === undefined) return '';
  const value = String(icon).trim();
  return /^\d+$/.test(value) ? value : '';
}

export function normalizeModelId(item = {}) {
  const idfile = item.idfile ?? item.id_file ?? item.IDFile ?? item.IdFile;
  const rawValue = idfile === null || idfile === undefined ? '' : String(idfile).trim();
  const modelId = rawValue.replace(/^IT/i, '').replace(/\D/g, '');
  const itemType = Number(item.itemtype);
  const fallbackModelId = FALLBACK_MODEL_BY_TYPE[itemType] || '';

  if (modelId && !['0', '63', '64'].includes(modelId) && !PLACEHOLDER_MODEL_IDS.has(modelId)) {
    return modelId;
  }

  return fallbackModelId && !PLACEHOLDER_MODEL_IDS.has(fallbackModelId) ? fallbackModelId : '';
}
