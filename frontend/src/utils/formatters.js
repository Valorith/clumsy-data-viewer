export function formatDPS(value) {
  return value ? parseFloat(value).toFixed(2) : '0.00';
}

export function formatNumber(value) {
  return value ? value.toLocaleString() : '0';
}

export function getClassNames(classBitMask) {
  const classes = [];
  const classMap = {
    1: 'WAR', 2: 'CLR', 4: 'PAL', 8: 'RNG', 16: 'SHD',
    32: 'DRU', 64: 'MNK', 128: 'BRD', 256: 'ROG', 512: 'SHM',
    1024: 'NEC', 2048: 'WIZ', 4096: 'MAG', 8192: 'ENC',
    16384: 'BST', 32768: 'BER'
  };
  
  for (let [bit, name] of Object.entries(classMap)) {
    if (classBitMask & parseInt(bit)) {
      classes.push(name);
    }
  }
  
  return classes.length > 0 ? classes.join(' ') : 'ALL';
}

export function getSlotNames(slotBitMask) {
  const slots = [];
  const slotMap = {
    1: 'Charm', 2: 'Ear', 4: 'Head', 8: 'Face', 16: 'Ear',
    32: 'Neck', 64: 'Shoulders', 128: 'Arms', 256: 'Back',
    512: 'Wrist', 1024: 'Wrist', 2048: 'Range', 4096: 'Hands',
    8192: 'Primary', 16384: 'Secondary', 32768: 'Finger',
    65536: 'Finger', 131072: 'Chest', 262144: 'Legs',
    524288: 'Feet', 1048576: 'Waist', 2097152: 'Ammo'
  };
  
  for (let [bit, name] of Object.entries(slotMap)) {
    if (slotBitMask & parseInt(bit)) {
      if (!slots.includes(name)) {
        slots.push(name);
      }
    }
  }
  
  return slots.length > 0 ? slots.join(', ') : 'None';
}

export function getItemTypeColor(itemType) {
  const typeColors = {
    0: '#808080',  // 1HS
    1: '#4169E1',  // 2HS
    2: '#FF6347',  // Piercing
    3: '#808080',  // 1HB
    4: '#4169E1',  // 2HB
    5: '#32CD32',  // Archery
    35: '#808080', // 2HP
    7: '#FFD700',  // Throwing
    8: '#9370DB',  // Shield
    10: '#FF69B4', // Armor
    11: '#FF69B4', // Misc
    20: '#9370DB', // Spell
    21: '#9370DB', // Potion
    27: '#87CEEB', // Light
    35: '#808080', // 2HP
    45: '#FF8C00', // H2H
  };
  
  return typeColors[itemType] || '#CCCCCC';
}

export function getItemTypeName(itemType) {
  const typeNames = {
    0: '1HS', 1: '2HS', 2: 'Piercing', 3: '1HB', 4: '2HB',
    5: 'Archery', 7: 'Throwing', 8: 'Shield', 10: 'Armor',
    11: 'Misc', 20: 'Spell', 21: 'Potion', 27: 'Light',
    35: '2HP', 45: 'H2H'
  };
  
  return typeNames[itemType] || `Type ${itemType}`;
}