import {
  getMaterial,
  getMaterialsAtTypeQuality,
  getMainCategory,
  MATERIALS_DB,
} from './database';

describe('getMaterial', () => {
  test('finds a material by exact name', () => {
    const material = getMaterial('Iron');
    expect(material).toBeDefined();
    expect(material.item).toBe('Iron');
    expect(material.type).toBe('Raw (Raw material 4)');
    expect(material.quality).toBe(1);
  });

  test('returns undefined for non-existent material', () => {
    const material = getMaterial('NonExistentMaterial');
    expect(material).toBeUndefined();
  });

  test('finds manufactured materials', () => {
    const material = getMaterial('Salvaged Alloys');
    expect(material).toBeDefined();
    expect(material.type).toBe('Manufactured (Alloys)');
    expect(material.quality).toBe(1);
  });

  test('finds encoded materials', () => {
    const material = getMaterial('Anomalous Bulk Scan Data');
    expect(material).toBeDefined();
    expect(material.type).toBe('Encoded (Data archives)');
    expect(material.quality).toBe(1);
  });
});

describe('getMaterialsAtTypeQuality', () => {
  test('finds all materials of a specific type and quality', () => {
    const materials = getMaterialsAtTypeQuality('Manufactured (Alloys)', 1);
    expect(materials).toHaveLength(1);
    expect(materials[0].item).toBe('Salvaged Alloys');
  });

  test('returns empty array for non-existent type/quality combination', () => {
    const materials = getMaterialsAtTypeQuality('NonExistent Type', 1);
    expect(materials).toHaveLength(0);
  });

  test('finds multiple materials at same type/quality', () => {
    const materials = getMaterialsAtTypeQuality('Encoded (Data archives)', 1);
    expect(materials.length).toBeGreaterThanOrEqual(1);
    materials.forEach(m => {
      expect(m.type).toBe('Encoded (Data archives)');
      expect(m.quality).toBe(1);
    });
  });
});

describe('getMainCategory', () => {
  test('extracts Encoded category', () => {
    expect(getMainCategory('Encoded (Data archives)')).toBe('Encoded');
    expect(getMainCategory('Encoded (Emission data)')).toBe('Encoded');
    expect(getMainCategory('Encoded (Wake scans)')).toBe('Encoded');
  });

  test('extracts Manufactured category', () => {
    expect(getMainCategory('Manufactured (Alloys)')).toBe('Manufactured');
    expect(getMainCategory('Manufactured (Capacitors)')).toBe('Manufactured');
    expect(getMainCategory('Manufactured (Chemical)')).toBe('Manufactured');
  });

  test('extracts Raw category', () => {
    expect(getMainCategory('Raw (Raw material 1)')).toBe('Raw');
    expect(getMainCategory('Raw (Raw material 2)')).toBe('Raw');
    expect(getMainCategory('Raw (Raw material 3)')).toBe('Raw');
  });

  test('handles unknown types as fallback', () => {
    expect(getMainCategory('Unknown Type')).toBe('Unknown Type');
  });
});

describe('Constants', () => {
  test('MATERIALS_DB contains materials', () => {
    expect(MATERIALS_DB.length).toBeGreaterThan(0);
  });

  test('all materials have required fields', () => {
    MATERIALS_DB.forEach(material => {
      expect(material).toHaveProperty('item');
      expect(material).toHaveProperty('type');
      expect(material).toHaveProperty('quality');
      expect(material).toHaveProperty('source');
    });
  });
});
