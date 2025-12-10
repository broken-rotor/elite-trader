import {
  getMaterial,
  getMaterialsAtTypeQuality,
  getMainCategory,
  MATERIALS_DB,
  BLUEPRINTS_DB,
  EXPERIMENTALS_DB,
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

describe('Blueprint Database Integrity', () => {
  test('all blueprint materials exist in MATERIALS_DB', () => {
    const missingMaterials = [];
    const allMaterialNames = new Set(MATERIALS_DB.map(m => m.item));

    Object.entries(BLUEPRINTS_DB).forEach(([moduleName, moduleData]) => {
      Object.entries(moduleData.blueprints).forEach(([blueprintName, blueprintData]) => {
        Object.entries(blueprintData.grades).forEach(([grade, materials]) => {
          materials.forEach(material => {
            if (!allMaterialNames.has(material.item)) {
              missingMaterials.push({
                module: moduleName,
                blueprint: blueprintName,
                grade: grade,
                material: material.item
              });
            }
          });
        });
      });
    });

    if (missingMaterials.length > 0) {
      const errorMessage = 'The following materials are referenced in blueprints but not found in MATERIALS_DB:\n' +
        missingMaterials.map(m =>
          `  - "${m.material}" in ${m.module} > ${m.blueprint} > Grade ${m.grade}`
        ).join('\n');
      throw new Error(errorMessage);
    }

    expect(missingMaterials).toHaveLength(0);
  });

  test('BLUEPRINTS_DB contains blueprints', () => {
    expect(Object.keys(BLUEPRINTS_DB).length).toBeGreaterThan(0);
  });

  test('all blueprints have valid structure', () => {
    Object.entries(BLUEPRINTS_DB).forEach(([_moduleName, moduleData]) => {
      expect(moduleData).toHaveProperty('name');
      expect(moduleData).toHaveProperty('blueprints');
      expect(typeof moduleData.blueprints).toBe('object');

      Object.entries(moduleData.blueprints).forEach(([_blueprintName, blueprintData]) => {
        expect(blueprintData).toHaveProperty('grades');
        expect(typeof blueprintData.grades).toBe('object');

        Object.entries(blueprintData.grades).forEach(([_grade, materials]) => {
          expect(Array.isArray(materials)).toBe(true);
          materials.forEach(material => {
            expect(material).toHaveProperty('item');
            expect(material).toHaveProperty('qty');
            expect(typeof material.item).toBe('string');
            expect(typeof material.qty).toBe('number');
          });
        });
      });
    });
  });
});

describe('Experimental Effects Database Integrity', () => {
  test('all experimental materials exist in MATERIALS_DB', () => {
    const missingMaterials = [];
    const allMaterialNames = new Set(MATERIALS_DB.map(m => m.item));

    Object.entries(EXPERIMENTALS_DB).forEach(([moduleName, moduleData]) => {
      if (!moduleData || !moduleData.experimentals) {
        return;
      }

      Object.entries(moduleData.experimentals).forEach(([experimentalName, materials]) => {
        if (!Array.isArray(materials)) {
          return;
        }

        materials.forEach(material => {
          if (!allMaterialNames.has(material.item)) {
            missingMaterials.push({
              module: moduleName,
              experimental: experimentalName,
              material: material.item
            });
          }
        });
      });
    });

    if (missingMaterials.length > 0) {
      const errorMessage = 'The following materials are referenced in experimental effects but not found in MATERIALS_DB:\n' +
        missingMaterials.map(m =>
          `  - "${m.material}" in ${m.module} > ${m.experimental}`
        ).join('\n');
      throw new Error(errorMessage);
    }

    expect(missingMaterials).toHaveLength(0);
  });

  test('EXPERIMENTALS_DB contains experimentals', () => {
    expect(Object.keys(EXPERIMENTALS_DB).length).toBeGreaterThan(0);
  });

  test('all experimentals have valid structure', () => {
    Object.entries(EXPERIMENTALS_DB).forEach(([moduleName, moduleData]) => {
      if (!moduleName || moduleName === '') {
        return;
      }

      expect(moduleData).toHaveProperty('name');
      expect(moduleData).toHaveProperty('experimentals');
      expect(typeof moduleData.experimentals).toBe('object');

      Object.entries(moduleData.experimentals).forEach(([experimentalName, materials]) => {
        if (!experimentalName || experimentalName === '') {
          return;
        }

        expect(Array.isArray(materials)).toBe(true);
        materials.forEach(material => {
          expect(material).toHaveProperty('item');
          expect(material).toHaveProperty('qty');
          expect(typeof material.item).toBe('string');
          expect(typeof material.qty).toBe('number');
          expect(material.item).not.toBe('');
        });
      });
    });
  });
});
