function parseNumberParam(value, defaultValue) {
  if (Array.isArray(value)) {
    value = value[0];
  }

  if (value === undefined || value === null) {
    return defaultValue;
  }

  if (typeof value === 'string' && value.trim() === '') {
    return defaultValue;
  }

  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : defaultValue;
}

function parseItemTypesParam(value) {
  if (Array.isArray(value)) {
    value = value.join(',');
  }

  if (value === undefined || value === null) {
    return { itemTypes: [] };
  }

  const rawItemTypes = String(value)
    .split(',')
    .map(part => part.trim())
    .filter(Boolean);

  if (rawItemTypes.length === 0) {
    return { itemTypes: [] };
  }

  const parsedItemTypes = rawItemTypes.map(part => Number.parseInt(part, 10));

  if (parsedItemTypes.some(Number.isNaN)) {
    return { error: 'Invalid itemTypes parameter' };
  }

  return { itemTypes: parsedItemTypes };
}

const VALID_DPS_SOURCE_KEYS = new Set(['main', 'offhand', 'spell', 'bane', 'backstab']);
const DEFAULT_DPS_SOURCE_KEYS = ['main', 'spell', 'bane', 'backstab'];

function parseDpsSourcesParam(value) {
  if (Array.isArray(value)) {
    value = value.join(',');
  }

  if (value === undefined || value === null) {
    return { dpsSources: [...DEFAULT_DPS_SOURCE_KEYS] };
  }

  const rawSources = String(value)
    .split(',')
    .map(part => part.trim())
    .filter(Boolean);

  if (rawSources.length === 0) {
    return { dpsSources: [...DEFAULT_DPS_SOURCE_KEYS] };
  }

  if (rawSources.some(source => !VALID_DPS_SOURCE_KEYS.has(source))) {
    return { error: 'Invalid activeDpsSources parameter' };
  }

  return { dpsSources: Array.from(new Set(rawSources)) };
}

module.exports = {
  parseNumberParam,
  parseItemTypesParam,
  parseDpsSourcesParam
};
