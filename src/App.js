import React, { useState, useMemo } from 'react';

// Elite Dangerous Materials Database
const MATERIALS_DB = [
  { item: "Anomalous Bulk Scan Data", type: "Encoded (Data archives)", quality: 1, source: "Ship scanning (Transport ships), Mission reward" },
  { item: "Unidentified Scan Archives", type: "Encoded (Data archives)", quality: 2, source: "Ship scanning (Transport ships)" },
  { item: "Classified Scan Databanks", type: "Encoded (Data archives)", quality: 3, source: "Ship scanning (Transport ships), Surface POI" },
  { item: "Divergent Scan Data", type: "Encoded (Data archives)", quality: 4, source: "Surface data point, Mission reward" },
  { item: "Classified Scan Fragment", type: "Encoded (Data archives)", quality: 5, source: "Surface data point, Mission reward, Ship scanning (Military & authority ships)" },
  { item: "Exceptional Scrambled Emission Data", type: "Encoded (Emission data)", quality: 1, source: "Ship scanning, USS, Mission reward" },
  { item: "Irregular Emission Data", type: "Encoded (Emission data)", quality: 2, source: "Mission reward, USS" },
  { item: "Unexpected Emission Data", type: "Encoded (Emission data)", quality: 3, source: "Ship scanning (Combat ships), USS" },
  { item: "Decoded Emission Data", type: "Encoded (Emission data)", quality: 4, source: "Ship scanning (Combat ships), Mission reward" },
  { item: "Abnormal Compact Emissions Data", type: "Encoded (Emission data)", quality: 5, source: "USS (Encoded emissions), Ship scanning (Combat ships), Mission reward" },
  { item: "Specialised Legacy Firmware", type: "Encoded (Encoded Firmware)", quality: 1, source: "Mission reward, Surface data point, USS" },
  { item: "Modified Consumer Firmware", type: "Encoded (Encoded Firmware)", quality: 2, source: "Mission reward, USS, Surface data point" },
  { item: "Cracked Industrial Firmware", type: "Encoded (Encoded Firmware)", quality: 3, source: "Surface data point, Mission reward" },
  { item: "Security Firmware Patch", type: "Encoded (Encoded Firmware)", quality: 4, source: "Surface data point, Mission reward" },
  { item: "Modified Embedded Firmware", type: "Encoded (Encoded Firmware)", quality: 5, source: "Surface data point, Mission reward" },
  { item: "Unusual Encrypted Files", type: "Encoded (Encryption files)", quality: 1, source: "Surface data point, USS, Mission reward" },
  { item: "Tagged Encryption Codes", type: "Encoded (Encryption files)", quality: 2, source: "Surface data point, USS, Mission reward" },
  { item: "Open Symmetric Keys", type: "Encoded (Encryption files)", quality: 3, source: "Surface data point, USS, Mission reward" },
  { item: "Atypical Encryption Archives", type: "Encoded (Encryption files)", quality: 4, source: "Surface POI" },
  { item: "Adaptive Encryptors Capture", type: "Encoded (Encryption files)", quality: 5, source: "Surface POI, USS" },
  { item: "Pattern Gamma Obelisk Data", type: "Encoded (Guardian)", quality: 1, source: "Ancient/Guardian ruins" },
  { item: "Pattern Beta Obelisk Data", type: "Encoded (Guardian)", quality: 2, source: "Ancient/Guardian ruins" },
  { item: "Pattern Alpha Obelisk Data", type: "Encoded (Guardian)", quality: 3, source: "Ancient/Guardian ruins" },
  { item: "Pattern Delta Obelisk Data", type: "Encoded (Guardian)", quality: 4, source: "Ancient/Guardian ruins" },
  { item: "Pattern Epsilon Obelisk Data", type: "Encoded (Guardian)", quality: 4, source: "Ancient/Guardian ruins" },
  { item: "Guardian Module Blueprint Fragment", type: "Encoded (Guardian)", quality: 5, source: "Ancient/Guardian ruins" },
  { item: "Guardian Vessel Blueprint Fragment", type: "Encoded (Guardian)", quality: 5, source: "Ancient/Guardian ruins" },
  { item: "Guardian Weapon Blueprint Fragment", type: "Encoded (Guardian)", quality: 5, source: "Ancient/Guardian ruins" },
  { item: "Distorted Shield Cycle Recordings", type: "Encoded (Shield data)", quality: 1, source: "Ship scanning (Transport ships), Mission reward" },
  { item: "Inconsistent Shield Soak Analysis", type: "Encoded (Shield data)", quality: 2, source: "Ship scanning (Transport ships), Mission reward" },
  { item: "Untypical Shield Scans", type: "Encoded (Shield data)", quality: 3, source: "Ship scanning (Combat ships)" },
  { item: "Aberrant Shield Pattern Analysis", type: "Encoded (Shield data)", quality: 4, source: "Ship scanning (Combat ships), Mission reward" },
  { item: "Peculiar Shield Frequency Data", type: "Encoded (Shield data)", quality: 5, source: "Ship scanning, Mission reward" },
  { item: "Thargoid Structural Data", type: "Encoded (Thargoid)", quality: 2, source: "Thargoid site" },
  { item: "Massive Energy Surge Analytics", type: "Encoded (Thargoid)", quality: 3, source: "Thargoid Maelstrom" },
  { item: "Ship Flight Data", type: "Encoded (Thargoid)", quality: 3, source: "Thargoid ship encounter" },
  { item: "Ship Systems Data", type: "Encoded (Thargoid)", quality: 3, source: "Thargoid ship encounter" },
  { item: "Thargoid Interdiction Telemetry", type: "Encoded (Thargoid)", quality: 3, source: "Thargoid ship encounter" },
  { item: "Thargoid Material Composition Data", type: "Encoded (Thargoid)", quality: 3, source: "Thargoid site" },
  { item: "Thargoid Ship Signature", type: "Encoded (Thargoid)", quality: 3, source: "Thargoid ship encounter, Thargoid site" },
  { item: "Thargoid Residue Data", type: "Encoded (Thargoid)", quality: 4, source: "Thargoid site" },
  { item: "Thargoid Wake Data", type: "Encoded (Thargoid)", quality: 4, source: "Thargoid ship encounter" },
  { item: "Atypical Disrupted Wake Echoes", type: "Encoded (Wake scans)", quality: 1, source: "High wake scanning, Mission reward" },
  { item: "Anomalous FSD Telemetry", type: "Encoded (Wake scans)", quality: 2, source: "High wake scanning, Mission reward" },
  { item: "Strange Wake Solutions", type: "Encoded (Wake scans)", quality: 3, source: "High wake scanning, Mission reward" },
  { item: "Eccentric Hyperspace Trajectories", type: "Encoded (Wake scans)", quality: 4, source: "High wake scanning" },
  { item: "Datamined Wake Exceptions", type: "Encoded (Wake scans)", quality: 5, source: "High wake scanning, Mission reward, USS (Encoded emissions)" },
  { item: "Salvaged Alloys", type: "Manufactured (Alloys)", quality: 1, source: "Ship salvage (Combat ships), USS (Combat aftermath)" },
  { item: "Galvanising Alloys", type: "Manufactured (Alloys)", quality: 2, source: "Ship salvage (Combat ships), USS, Mission reward" },
  { item: "Phase Alloys", type: "Manufactured (Alloys)", quality: 3, source: "Ship salvage (Combat ships), USS" },
  { item: "Proto Light Alloys", type: "Manufactured (Alloys)", quality: 4, source: "USS (High grade emissions), Mission reward" },
  { item: "Proto Radiolic Alloys", type: "Manufactured (Alloys)", quality: 5, source: "USS (High grade emissions)" },
  { item: "Grid Resistors", type: "Manufactured (Capacitors)", quality: 1, source: "Ship salvage (Military & authority ships), USS, Mission reward" },
  { item: "Hybrid Capacitors", type: "Manufactured (Capacitors)", quality: 2, source: "Ship salvage (Military & authority ships), USS, Mission reward" },
  { item: "Electrochemical Arrays", type: "Manufactured (Capacitors)", quality: 3, source: "Ship salvage (Military & authority ships), USS (Degraded emissions/Anarchy)" },
  { item: "Polymer Capacitors", type: "Manufactured (Capacitors)", quality: 4, source: "Ship salvage (Military & authority ships), USS (Convoy dispersal pattern), Mission reward" },
  { item: "Military Supercapacitors", type: "Manufactured (Capacitors)", quality: 5, source: "USS (High grade emissions)" },
  { item: "Chemical Storage Units", type: "Manufactured (Chemical)", quality: 1, source: "Ship salvage (Transport ships)" },
  { item: "Chemical Processors", type: "Manufactured (Chemical)", quality: 2, source: "Ship salvage (Transport ships), USS, Mission reward" },
  { item: "Chemical Distillery", type: "Manufactured (Chemical)", quality: 3, source: "Ship salvage (Transport ships), USS" },
  { item: "Chemical Manipulators", type: "Manufactured (Chemical)", quality: 4, source: "Ship salvage (Transport ships), Surface POI, USS (Convoy dispersal pattern)" },
  { item: "Pharmaceutical Isolators", type: "Manufactured (Chemical)", quality: 5, source: "Mission reward, USS (High grade emissions)" },
  { item: "Compact Composites", type: "Manufactured (Composite)", quality: 1, source: "USS, Surface POI" },
  { item: "Filament Composites", type: "Manufactured (Composite)", quality: 2, source: "Ship salvage (Military & authority ships), USS" },
  { item: "High Density Composites", type: "Manufactured (Composite)", quality: 3, source: "Ship salvage (Military & authority ships), USS" },
  { item: "Proprietary Composites", type: "Manufactured (Composite)", quality: 4, source: "USS (Encoded emissions), USS (High grade emissions), Mission reward" },
  { item: "Core Dynamics Composites", type: "Manufactured (Composite)", quality: 5, source: "Ship salvage (Combat ships), USS (High grade emissions)" },
  { item: "Basic Conductors", type: "Manufactured (Conductive)", quality: 1, source: "Ship salvage (Transport ships)" },
  { item: "Conductive Components", type: "Manufactured (Conductive)", quality: 2, source: "Ship salvage (Transport ships), USS (Degraded emissions/Anarchy)" },
  { item: "Conductive Ceramics", type: "Manufactured (Conductive)", quality: 3, source: "Ship salvage (Transport ships), USS (Degraded emissions/Anarchy)" },
  { item: "Conductive Polymers", type: "Manufactured (Conductive)", quality: 4, source: "Ship salvage (Transport ships), Surface POI, Mission reward" },
  { item: "Biotech Conductors", type: "Manufactured (Conductive)", quality: 5, source: "Mission reward" },
  { item: "Crystal Shards", type: "Manufactured (Crystals)", quality: 1, source: "Ship salvage (Combat ships), Surface POI" },
  { item: "Flawed Focus Crystals", type: "Manufactured (Crystals)", quality: 2, source: "Ship salvage (Combat ships), USS (Combat aftermath)" },
  { item: "Focus Crystals", type: "Manufactured (Crystals)", quality: 3, source: "Ship salvage (Combat ships), USS" },
  { item: "Refined Focus Crystals", type: "Manufactured (Crystals)", quality: 4, source: "Mission reward, USS (Weapons fire)" },
  { item: "Exquisite Focus Crystals", type: "Manufactured (Crystals)", quality: 5, source: "Mission reward, Ship salvage (Combat ships)" },
  { item: "Guardian Power Cell", type: "Manufactured (Guardian)", quality: 1, source: "Ancient/Guardian ruins" },
  { item: "Guardian Wreckage Components", type: "Manufactured (Guardian)", quality: 1, source: "Ancient/Guardian ruins" },
  { item: "Guardian Power Conduit", type: "Manufactured (Guardian)", quality: 2, source: "Ancient/Guardian ruins" },
  { item: "Guardian Sentinel Weapon Parts", type: "Manufactured (Guardian)", quality: 3, source: "Ancient/Guardian ruins" },
  { item: "Guardian Technology Component", type: "Manufactured (Guardian)", quality: 3, source: "Ancient/Guardian ruins" },
  { item: "Heat Conduction Wiring", type: "Manufactured (Heat)", quality: 1, source: "Ship salvage (Transport ships), USS, Mission reward" },
  { item: "Heat Dispersion Plate", type: "Manufactured (Heat)", quality: 2, source: "Ship salvage (Transport ships), USS, Mission reward" },
  { item: "Heat Exchangers", type: "Manufactured (Heat)", quality: 3, source: "Ship salvage (Transport ships), USS (Degraded emissions/Anarchy)" },
  { item: "Heat Vanes", type: "Manufactured (Heat)", quality: 4, source: "Ship salvage (Transport ships), USS, Mission reward" },
  { item: "Proto Heat Radiators", type: "Manufactured (Heat)", quality: 5, source: "USS (High grade emissions), Mission reward" },
  { item: "Mechanical Scrap", type: "Manufactured (Mechanical components)", quality: 1, source: "Ship salvage (Transport ships), USS, Mission reward" },
  { item: "Mechanical Equipment", type: "Manufactured (Mechanical components)", quality: 2, source: "Ship salvage (Transport ships), USS" },
  { item: "Mechanical Components", type: "Manufactured (Mechanical components)", quality: 3, source: "Ship salvage (Transport ships), USS (Combat aftermath)" },
  { item: "Configurable Components", type: "Manufactured (Mechanical components)", quality: 4, source: "Ship salvage (Transport ships), USS (Combat aftermath), USS (Encoded emissions)" },
  { item: "Improvised Components", type: "Manufactured (Mechanical components)", quality: 5, source: "USS (High grade emissions), Mission reward" },
  { item: "Worn Shield Emitters", type: "Manufactured (Shielding)", quality: 1, source: "Ship salvage (Combat ships), USS" },
  { item: "Shield Emitters", type: "Manufactured (Shielding)", quality: 2, source: "Ship salvage (Combat ships), USS" },
  { item: "Shielding Sensors", type: "Manufactured (Shielding)", quality: 3, source: "Ship salvage (Combat ships), USS, Mission reward" },
  { item: "Compound Shielding", type: "Manufactured (Shielding)", quality: 4, source: "Ship salvage (Combat ships), USS (Encoded emissions), Mission reward" },
  { item: "Imperial Shielding", type: "Manufactured (Shielding)", quality: 5, source: "USS (High grade emissions), Mission reward" },
  { item: "Hardened Surface Fragments", type: "Manufactured (Thargoid)", quality: 1, source: "Thargoid Titan" },
  { item: "Caustic Shard", type: "Manufactured (Thargoid)", quality: 2, source: "Thargoid Maelstrom, Thargoid Titan debris field" },
  { item: "Tactical Core Chip", type: "Manufactured (Thargoid)", quality: 2, source: "Thargoid Revenant" },
  { item: "Thargoid Carapace", type: "Manufactured (Thargoid)", quality: 2, source: "Thargoid site, Thargoid Titan debris field" },
  { item: "Bio-Mechanical Conduits", type: "Manufactured (Thargoid)", quality: 3, source: "Thargoid ship encounter" },
  { item: "Corrosive Mechanisms", type: "Manufactured (Thargoid)", quality: 3, source: "Thargoid Caustic Generator, Thargoid Titan debris field" },
  { item: "Phasing Membrane Residue", type: "Manufactured (Thargoid)", quality: 3, source: "Thargoid Titan" },
  { item: "Thargoid Energy Cell", type: "Manufactured (Thargoid)", quality: 3, source: "Thargoid site" },
  { item: "Wreckage Components", type: "Manufactured (Thargoid)", quality: 3, source: "Thargoid ship encounter, Thargoid Titan debris field" },
  { item: "Caustic Crystal", type: "Manufactured (Thargoid)", quality: 4, source: "Thargoid Maelstrom, Thargoid Titan debris field" },
  { item: "Thargoid Technological Components", type: "Manufactured (Thargoid)", quality: 4, source: "Thargoid site" },
  { item: "Weapon Parts", type: "Manufactured (Thargoid)", quality: 4, source: "Thargoid ship encounter" },
  { item: "Heat Exposure Specimen", type: "Manufactured (Thargoid)", quality: 5, source: "Thargoid Titan" },
  { item: "Propulsion Elements", type: "Manufactured (Thargoid)", quality: 5, source: "Thargoid Caustic Generator, Thargoid Titan debris field, Thargoid ship encounter" },
  { item: "Sensor Fragment", type: "Manufactured (Thargoid)", quality: 5, source: "Destroyed Unknown artefact, USS (Non-Human), Thargoid site" },
  { item: "Thargoid Organic Circuitry", type: "Manufactured (Thargoid)", quality: 5, source: "Thargoid site, Thargoid Titan debris field" },
  { item: "Tempered Alloys", type: "Manufactured (Thermic)", quality: 1, source: "Ship salvage (Combat ships)" },
  { item: "Heat Resistant Ceramics", type: "Manufactured (Thermic)", quality: 2, source: "Ship salvage (Military & authority ships)" },
  { item: "Precipitated Alloys", type: "Manufactured (Thermic)", quality: 3, source: "Ship salvage (Military & authority ships), Mission reward" },
  { item: "Thermic Alloys", type: "Manufactured (Thermic)", quality: 4, source: "Ship salvage (Combat ships), Mission reward" },
  { item: "Military Grade Alloys", type: "Manufactured (Thermic)", quality: 5, source: "USS (High grade emissions), Mission reward" },
  { item: "Carbon", type: "Raw (Raw material 1)", quality: 1, source: "Surface prospecting, Mining, Mining (Ice rings)" },
  { item: "Vanadium", type: "Raw (Raw material 1)", quality: 2, source: "Surface prospecting, Mining (Ice rings)" },
  { item: "Niobium", type: "Raw (Raw material 1)", quality: 3, source: "Surface prospecting, Mission reward" },
  { item: "Yttrium", type: "Raw (Raw material 1)", quality: 4, source: "Surface prospecting" },
  { item: "Phosphorus", type: "Raw (Raw material 2)", quality: 1, source: "Surface prospecting, Mining, Mining (Ice rings)" },
  { item: "Chromium", type: "Raw (Raw material 2)", quality: 2, source: "Surface prospecting, Mining (Ice rings)" },
  { item: "Molybdenum", type: "Raw (Raw material 2)", quality: 3, source: "Surface prospecting, Mission reward" },
  { item: "Technetium", type: "Raw (Raw material 2)", quality: 4, source: "Surface prospecting" },
  { item: "Sulphur", type: "Raw (Raw material 3)", quality: 1, source: "Surface prospecting, Mining, Mining (Ice rings)" },
  { item: "Manganese", type: "Raw (Raw material 3)", quality: 2, source: "Surface prospecting, Mission reward" },
  { item: "Cadmium", type: "Raw (Raw material 3)", quality: 3, source: "Surface prospecting, Mining" },
  { item: "Ruthenium", type: "Raw (Raw material 3)", quality: 4, source: "Surface prospecting" },
  { item: "Iron", type: "Raw (Raw material 4)", quality: 1, source: "Surface prospecting, Mining, Mining (Ice rings)" },
  { item: "Zinc", type: "Raw (Raw material 4)", quality: 2, source: "Surface prospecting" },
  { item: "Tin", type: "Raw (Raw material 4)", quality: 3, source: "Surface prospecting" },
  { item: "Selenium", type: "Raw (Raw material 4)", quality: 4, source: "Surface prospecting, Mission reward" },
  { item: "Nickel", type: "Raw (Raw material 5)", quality: 1, source: "Surface prospecting, Mining, Mining (Ice rings)" },
  { item: "Germanium", type: "Raw (Raw material 5)", quality: 2, source: "Surface prospecting, Mission reward" },
  { item: "Tungsten", type: "Raw (Raw material 5)", quality: 3, source: "Surface prospecting" },
  { item: "Tellurium", type: "Raw (Raw material 5)", quality: 4, source: "Surface prospecting" },
  { item: "Rhenium", type: "Raw (Raw material 6)", quality: 1, source: "Mining" },
  { item: "Arsenic", type: "Raw (Raw material 6)", quality: 2, source: "Surface prospecting, Mining, Mission reward" },
  { item: "Mercury", type: "Raw (Raw material 6)", quality: 3, source: "Surface prospecting" },
  { item: "Polonium", type: "Raw (Raw material 6)", quality: 4, source: "Surface prospecting, Mission reward" },
  { item: "Lead", type: "Raw (Raw material 7)", quality: 1, source: "Mining" },
  { item: "Zirconium", type: "Raw (Raw material 7)", quality: 2, source: "Surface prospecting, Mining" },
  { item: "Boron", type: "Raw (Raw material 7)", quality: 3, source: "Mining" },
  { item: "Antimony", type: "Raw (Raw material 7)", quality: 4, source: "Surface prospecting" },
];

// Engineering Blueprints Database
const BLUEPRINTS_DB = {
  "FSD": {
    name: "Frame Shift Drive",
    blueprints: {
      "Increased Range": {
        grades: {
          1: [{ item: "Atypical Disrupted Wake Echoes", qty: 1 }],
          2: [{ item: "Atypical Disrupted Wake Echoes", qty: 1 }, { item: "Chemical Processors", qty: 1 }],
          3: [{ item: "Phosphorus", qty: 1 }, { item: "Chemical Processors", qty: 1 }, { item: "Strange Wake Solutions", qty: 1 }],
          4: [{ item: "Manganese", qty: 1 }, { item: "Chemical Distillery", qty: 1 }, { item: "Eccentric Hyperspace Trajectories", qty: 1 }],
          5: [{ item: "Arsenic", qty: 1 }, { item: "Chemical Manipulators", qty: 1 }, { item: "Datamined Wake Exceptions", qty: 1 }]
        }
      },
      "Faster Boot": {
        grades: {
          1: [{ item: "Grid Resistors", qty: 1 }],
          2: [{ item: "Grid Resistors", qty: 1 }, { item: "Chromium", qty: 1 }],
          3: [{ item: "Grid Resistors", qty: 1 }, { item: "Heat Dispersion Plate", qty: 1 }, { item: "Selenium", qty: 1 }],
          4: [{ item: "Hybrid Capacitors", qty: 1 }, { item: "Heat Exchangers", qty: 1 }, { item: "Cadmium", qty: 1 }],
          5: [{ item: "Electrochemical Arrays", qty: 1 }, { item: "Heat Vanes", qty: 1 }, { item: "Tellurium", qty: 1 }]
        }
      },
      "Shielded": {
        grades: {
          1: [{ item: "Nickel", qty: 1 }],
          2: [{ item: "Carbon", qty: 1 }, { item: "Shield Emitters", qty: 1 }],
          3: [{ item: "Carbon", qty: 1 }, { item: "Zinc", qty: 1 }, { item: "Shielding Sensors", qty: 1 }],
          4: [{ item: "Vanadium", qty: 1 }, { item: "High Density Composites", qty: 1 }, { item: "Compound Shielding", qty: 1 }],
          5: [{ item: "Tungsten", qty: 1 }, { item: "Proprietary Composites", qty: 1 }, { item: "Imperial Shielding", qty: 1 }]
        }
      }
    }
  },
  "Thrusters": {
    name: "Thrusters",
    blueprints: {
      "Dirty Drives": {
        grades: {
          1: [{ item: "Specialised Legacy Firmware", qty: 1 }],
          2: [{ item: "Specialised Legacy Firmware", qty: 1 }, { item: "Mechanical Equipment", qty: 1 }],
          3: [{ item: "Specialised Legacy Firmware", qty: 1 }, { item: "Chromium", qty: 1 }, { item: "Mechanical Components", qty: 1 }],
          4: [{ item: "Modified Consumer Firmware", qty: 1 }, { item: "Selenium", qty: 1 }, { item: "Configurable Components", qty: 1 }],
          5: [{ item: "Cracked Industrial Firmware", qty: 1 }, { item: "Cadmium", qty: 1 }, { item: "Pharmaceutical Isolators", qty: 1 }]
        }
      },
      "Clean Drives": {
        grades: {
          1: [{ item: "Sulphur", qty: 1 }],
          2: [{ item: "Specialised Legacy Firmware", qty: 1 }, { item: "Conductive Components", qty: 1 }],
          3: [{ item: "Specialised Legacy Firmware", qty: 1 }, { item: "Conductive Components", qty: 1 }, { item: "Unexpected Emission Data", qty: 1 }],
          4: [{ item: "Modified Consumer Firmware", qty: 1 }, { item: "Conductive Ceramics", qty: 1 }, { item: "Decoded Emission Data", qty: 1 }],
          5: [{ item: "Conductive Polymers", qty: 1 }, { item: "Tin", qty: 1 }, { item: "Abnormal Compact Emissions Data", qty: 1 }]
        }
      },
      "Drive Strengthening": {
        grades: {
          1: [{ item: "Carbon", qty: 1 }],
          2: [{ item: "Heat Conduction Wiring", qty: 1 }, { item: "Vanadium", qty: 1 }],
          3: [{ item: "Heat Conduction Wiring", qty: 1 }, { item: "Vanadium", qty: 1 }, { item: "High Density Composites", qty: 1 }],
          4: [{ item: "Heat Dispersion Plate", qty: 1 }, { item: "High Density Composites", qty: 1 }, { item: "Cadmium", qty: 1 }],
          5: [{ item: "Heat Exchangers", qty: 1 }, { item: "Proprietary Composites", qty: 1 }, { item: "Tin", qty: 1 }]
        }
      }
    }
  },
  "Power Plant": {
    name: "Power Plant",
    blueprints: {
      "Overcharged": {
        grades: {
          1: [{ item: "Sulphur", qty: 1 }],
          2: [{ item: "Heat Conduction Wiring", qty: 1 }, { item: "Conductive Components", qty: 1 }],
          3: [{ item: "Heat Conduction Wiring", qty: 1 }, { item: "Conductive Components", qty: 1 }, { item: "Selenium", qty: 1 }],
          4: [{ item: "Heat Dispersion Plate", qty: 1 }, { item: "Conductive Ceramics", qty: 1 }, { item: "Cadmium", qty: 1 }],
          5: [{ item: "Conductive Polymers", qty: 1 }, { item: "Chemical Manipulators", qty: 1 }, { item: "Tellurium", qty: 1 }]
        }
      },
      "Armoured": {
        grades: {
          1: [{ item: "Worn Shield Emitters", qty: 1 }],
          2: [{ item: "Carbon", qty: 1 }, { item: "Shield Emitters", qty: 1 }],
          3: [{ item: "Carbon", qty: 1 }, { item: "Shield Emitters", qty: 1 }, { item: "High Density Composites", qty: 1 }],
          4: [{ item: "Vanadium", qty: 1 }, { item: "Shielding Sensors", qty: 1 }, { item: "Proprietary Composites", qty: 1 }],
          5: [{ item: "Tungsten", qty: 1 }, { item: "Compound Shielding", qty: 1 }, { item: "Core Dynamics Composites", qty: 1 }]
        }
      },
      "Low Emissions": {
        grades: {
          1: [{ item: "Iron", qty: 1 }],
          2: [{ item: "Iron", qty: 1 }, { item: "Irregular Emission Data", qty: 1 }],
          3: [{ item: "Iron", qty: 1 }, { item: "Irregular Emission Data", qty: 1 }, { item: "Heat Exchangers", qty: 1 }],
          4: [{ item: "Germanium", qty: 1 }, { item: "Unexpected Emission Data", qty: 1 }, { item: "Heat Vanes", qty: 1 }],
          5: [{ item: "Niobium", qty: 1 }, { item: "Decoded Emission Data", qty: 1 }, { item: "Proto Heat Radiators", qty: 1 }]
        }
      }
    }
  },
  "Shield Generator": {
    name: "Shield Generator",
    blueprints: {
      "Reinforced": {
        grades: {
          1: [{ item: "Phosphorus", qty: 1 }],
          2: [{ item: "Phosphorus", qty: 1 }, { item: "Conductive Components", qty: 1 }],
          3: [{ item: "Phosphorus", qty: 1 }, { item: "Conductive Components", qty: 1 }, { item: "Mechanical Components", qty: 1 }],
          4: [{ item: "Manganese", qty: 1 }, { item: "Conductive Ceramics", qty: 1 }, { item: "Configurable Components", qty: 1 }],
          5: [{ item: "Arsenic", qty: 1 }, { item: "Conductive Polymers", qty: 1 }, { item: "Improvised Components", qty: 1 }]
        }
      },
      "Thermal Resistant": {
        grades: {
          1: [{ item: "Distorted Shield Cycle Recordings", qty: 1 }],
          2: [{ item: "Distorted Shield Cycle Recordings", qty: 1 }, { item: "Germanium", qty: 1 }],
          3: [{ item: "Distorted Shield Cycle Recordings", qty: 1 }, { item: "Germanium", qty: 1 }, { item: "Selenium", qty: 1 }],
          4: [{ item: "Inconsistent Shield Soak Analysis", qty: 1 }, { item: "Focus Crystals", qty: 1 }, { item: "Mercury", qty: 1 }],
          5: [{ item: "Untypical Shield Scans", qty: 1 }, { item: "Refined Focus Crystals", qty: 1 }, { item: "Ruthenium", qty: 1 }]
        }
      },
      "Enhanced Low Power": {
        grades: {
          1: [{ item: "Distorted Shield Cycle Recordings", qty: 1 }],
          2: [{ item: "Distorted Shield Cycle Recordings", qty: 1 }, { item: "Germanium", qty: 1 }],
          3: [{ item: "Distorted Shield Cycle Recordings", qty: 1 }, { item: "Germanium", qty: 1 }, { item: "Phosphorus", qty: 1 }],
          4: [{ item: "Inconsistent Shield Soak Analysis", qty: 1 }, { item: "Niobium", qty: 1 }, { item: "Conductive Polymers", qty: 1 }],
          5: [{ item: "Untypical Shield Scans", qty: 1 }, { item: "Tin", qty: 1 }, { item: "Biotech Conductors", qty: 1 }]
        }
      }
    }
  },
  "Shield Booster": {
    name: "Shield Booster",
    blueprints: {
      "Heavy Duty": {
        grades: {
          1: [{ item: "Grid Resistors", qty: 1 }],
          2: [{ item: "Distorted Shield Cycle Recordings", qty: 1 }, { item: "Hybrid Capacitors", qty: 1 }],
          3: [{ item: "Distorted Shield Cycle Recordings", qty: 1 }, { item: "Hybrid Capacitors", qty: 1 }, { item: "Niobium", qty: 1 }],
          4: [{ item: "Inconsistent Shield Soak Analysis", qty: 1 }, { item: "Electrochemical Arrays", qty: 1 }, { item: "Tin", qty: 1 }],
          5: [{ item: "Untypical Shield Scans", qty: 1 }, { item: "Polymer Capacitors", qty: 1 }, { item: "Antimony", qty: 1 }]
        }
      },
      "Resistance Augmented": {
        grades: {
          1: [{ item: "Phosphorus", qty: 1 }],
          2: [{ item: "Phosphorus", qty: 1 }, { item: "Conductive Components", qty: 1 }],
          3: [{ item: "Phosphorus", qty: 1 }, { item: "Conductive Components", qty: 1 }, { item: "Focus Crystals", qty: 1 }],
          4: [{ item: "Manganese", qty: 1 }, { item: "Conductive Ceramics", qty: 1 }, { item: "Refined Focus Crystals", qty: 1 }],
          5: [{ item: "Conductive Polymers", qty: 1 }, { item: "Refined Focus Crystals", qty: 1 }, { item: "Imperial Shielding", qty: 1 }]
        }
      },
      "Thermal Resistant": {
        grades: {
          1: [{ item: "Distorted Shield Cycle Recordings", qty: 1 }],
          2: [{ item: "Distorted Shield Cycle Recordings", qty: 1 }, { item: "Heat Resistant Ceramics", qty: 1 }],
          3: [{ item: "Distorted Shield Cycle Recordings", qty: 1 }, { item: "Heat Resistant Ceramics", qty: 1 }, { item: "Heat Dispersion Plate", qty: 1 }],
          4: [{ item: "Inconsistent Shield Soak Analysis", qty: 1 }, { item: "Precipitated Alloys", qty: 1 }, { item: "Heat Exchangers", qty: 1 }],
          5: [{ item: "Untypical Shield Scans", qty: 1 }, { item: "Thermic Alloys", qty: 1 }, { item: "Heat Vanes", qty: 1 }]
        }
      }
    }
  },
  "Armour": {
    name: "Armour",
    blueprints: {
      "Heavy Duty": {
        grades: {
          1: [{ item: "Carbon", qty: 1 }],
          2: [{ item: "Carbon", qty: 1 }, { item: "Shield Emitters", qty: 1 }],
          3: [{ item: "Carbon", qty: 1 }, { item: "Shield Emitters", qty: 1 }, { item: "High Density Composites", qty: 1 }],
          4: [{ item: "Vanadium", qty: 1 }, { item: "Shielding Sensors", qty: 1 }, { item: "Proprietary Composites", qty: 1 }],
          5: [{ item: "Tungsten", qty: 1 }, { item: "Compound Shielding", qty: 1 }, { item: "Core Dynamics Composites", qty: 1 }]
        }
      },
      "Lightweight": {
        grades: {
          1: [{ item: "Iron", qty: 1 }],
          2: [{ item: "Iron", qty: 1 }, { item: "Conductive Components", qty: 1 }],
          3: [{ item: "Iron", qty: 1 }, { item: "Conductive Components", qty: 1 }, { item: "High Density Composites", qty: 1 }],
          4: [{ item: "Germanium", qty: 1 }, { item: "Conductive Ceramics", qty: 1 }, { item: "Proprietary Composites", qty: 1 }],
          5: [{ item: "Conductive Polymers", qty: 1 }, { item: "Tin", qty: 1 }, { item: "Military Grade Alloys", qty: 1 }]
        }
      },
      "Thermal Resistant": {
        grades: {
          1: [{ item: "Heat Conduction Wiring", qty: 1 }],
          2: [{ item: "Nickel", qty: 1 }, { item: "Heat Dispersion Plate", qty: 1 }],
          3: [{ item: "Vanadium", qty: 1 }, { item: "Heat Dispersion Plate", qty: 1 }, { item: "Heat Exchangers", qty: 1 }],
          4: [{ item: "Tungsten", qty: 1 }, { item: "Heat Exchangers", qty: 1 }, { item: "Heat Vanes", qty: 1 }],
          5: [{ item: "Molybdenum", qty: 1 }, { item: "Heat Vanes", qty: 1 }, { item: "Proto Heat Radiators", qty: 1 }]
        }
      }
    }
  },
  "Weapons (Beam Laser)": {
    name: "Beam Laser",
    blueprints: {
      "Long Range": {
        grades: {
          1: [{ item: "Sulphur", qty: 1 }],
          2: [{ item: "Sulphur", qty: 1 }, { item: "Modified Consumer Firmware", qty: 1 }],
          3: [{ item: "Sulphur", qty: 1 }, { item: "Modified Consumer Firmware", qty: 1 }, { item: "Focus Crystals", qty: 1 }],
          4: [{ item: "Modified Consumer Firmware", qty: 1 }, { item: "Focus Crystals", qty: 1 }, { item: "Conductive Polymers", qty: 1 }],
          5: [{ item: "Cracked Industrial Firmware", qty: 1 }, { item: "Biotech Conductors", qty: 1 }, { item: "Thermic Alloys", qty: 1 }]
        }
      },
      "Overcharged": {
        grades: {
          1: [{ item: "Nickel", qty: 1 }],
          2: [{ item: "Nickel", qty: 1 }, { item: "Conductive Components", qty: 1 }],
          3: [{ item: "Nickel", qty: 1 }, { item: "Conductive Components", qty: 1 }, { item: "Electrochemical Arrays", qty: 1 }],
          4: [{ item: "Zinc", qty: 1 }, { item: "Conductive Ceramics", qty: 1 }, { item: "Polymer Capacitors", qty: 1 }],
          5: [{ item: "Zirconium", qty: 1 }, { item: "Conductive Polymers", qty: 1 }, { item: "Modified Embedded Firmware", qty: 1 }]
        }
      },
      "Efficient": {
        grades: {
          1: [{ item: "Sulphur", qty: 1 }],
          2: [{ item: "Sulphur", qty: 1 }, { item: "Heat Dispersion Plate", qty: 1 }],
          3: [{ item: "Exceptional Scrambled Emission Data", qty: 1 }, { item: "Chromium", qty: 1 }, { item: "Heat Exchangers", qty: 1 }],
          4: [{ item: "Irregular Emission Data", qty: 1 }, { item: "Selenium", qty: 1 }, { item: "Heat Vanes", qty: 1 }],
          5: [{ item: "Unexpected Emission Data", qty: 1 }, { item: "Cadmium", qty: 1 }, { item: "Proto Heat Radiators", qty: 1 }]
        }
      }
    }
  },
  "Weapons (Multi-cannon)": {
    name: "Multi-cannon",
    blueprints: {
      "Overcharged": {
        grades: {
          1: [{ item: "Nickel", qty: 1 }],
          2: [{ item: "Nickel", qty: 1 }, { item: "Conductive Components", qty: 1 }],
          3: [{ item: "Nickel", qty: 1 }, { item: "Conductive Components", qty: 1 }, { item: "Electrochemical Arrays", qty: 1 }],
          4: [{ item: "Zinc", qty: 1 }, { item: "Conductive Ceramics", qty: 1 }, { item: "Polymer Capacitors", qty: 1 }],
          5: [{ item: "Zirconium", qty: 1 }, { item: "Conductive Polymers", qty: 1 }, { item: "Modified Embedded Firmware", qty: 1 }]
        }
      },
      "Efficient": {
        grades: {
          1: [{ item: "Sulphur", qty: 1 }],
          2: [{ item: "Sulphur", qty: 1 }, { item: "Heat Dispersion Plate", qty: 1 }],
          3: [{ item: "Exceptional Scrambled Emission Data", qty: 1 }, { item: "Chromium", qty: 1 }, { item: "Heat Exchangers", qty: 1 }],
          4: [{ item: "Irregular Emission Data", qty: 1 }, { item: "Selenium", qty: 1 }, { item: "Heat Vanes", qty: 1 }],
          5: [{ item: "Unexpected Emission Data", qty: 1 }, { item: "Cadmium", qty: 1 }, { item: "Proto Heat Radiators", qty: 1 }]
        }
      },
      "Short Range": {
        grades: {
          1: [{ item: "Nickel", qty: 1 }],
          2: [{ item: "Nickel", qty: 1 }, { item: "Modified Consumer Firmware", qty: 1 }],
          3: [{ item: "Nickel", qty: 1 }, { item: "Modified Consumer Firmware", qty: 1 }, { item: "Electrochemical Arrays", qty: 1 }],
          4: [{ item: "Modified Consumer Firmware", qty: 1 }, { item: "Electrochemical Arrays", qty: 1 }, { item: "Biotech Conductors", qty: 1 }],
          5: [{ item: "Cracked Industrial Firmware", qty: 1 }, { item: "Configurable Components", qty: 1 }, { item: "Biotech Conductors", qty: 1 }]
        }
      }
    }
  },
  "Power Distributor": {
    name: "Power Distributor",
    blueprints: {
      "Charge Enhanced": {
        grades: {
          1: [{ item: "Specialised Legacy Firmware", qty: 1 }],
          2: [{ item: "Specialised Legacy Firmware", qty: 1 }, { item: "Conductive Components", qty: 1 }],
          3: [{ item: "Grid Resistors", qty: 1 }, { item: "Modified Consumer Firmware", qty: 1 }, { item: "Conductive Ceramics", qty: 1 }],
          4: [{ item: "Hybrid Capacitors", qty: 1 }, { item: "Cracked Industrial Firmware", qty: 1 }, { item: "Conductive Polymers", qty: 1 }],
          5: [{ item: "Modified Embedded Firmware", qty: 1 }, { item: "Conductive Polymers", qty: 1 }, { item: "Exquisite Focus Crystals", qty: 1 }]
        }
      },
      "Engine Focused": {
        grades: {
          1: [{ item: "Sulphur", qty: 1 }],
          2: [{ item: "Sulphur", qty: 1 }, { item: "Conductive Components", qty: 1 }],
          3: [{ item: "Exceptional Scrambled Emission Data", qty: 1 }, { item: "Chromium", qty: 1 }, { item: "Electrochemical Arrays", qty: 1 }],
          4: [{ item: "Irregular Emission Data", qty: 1 }, { item: "Selenium", qty: 1 }, { item: "Polymer Capacitors", qty: 1 }],
          5: [{ item: "Unexpected Emission Data", qty: 1 }, { item: "Cadmium", qty: 1 }, { item: "Military Supercapacitors", qty: 1 }]
        }
      },
      "Weapon Focused": {
        grades: {
          1: [{ item: "Sulphur", qty: 1 }],
          2: [{ item: "Sulphur", qty: 1 }, { item: "Hybrid Capacitors", qty: 1 }],
          3: [{ item: "Exceptional Scrambled Emission Data", qty: 1 }, { item: "Hybrid Capacitors", qty: 1 }, { item: "Selenium", qty: 1 }],
          4: [{ item: "Irregular Emission Data", qty: 1 }, { item: "Electrochemical Arrays", qty: 1 }, { item: "Cadmium", qty: 1 }],
          5: [{ item: "Unexpected Emission Data", qty: 1 }, { item: "Polymer Capacitors", qty: 1 }, { item: "Tellurium", qty: 1 }]
        }
      }
    }
  }
};

// Trade ratios
const TRADE_UP_COST = 6;
const TRADE_DOWN_YIELD = 3;
const TRADE_ACROSS_COST = 6;

// Get material info
function getMaterial(itemName) {
  return MATERIALS_DB.find(m => m.item === itemName);
}

// Get materials at type/quality
function getMaterialsAtTypeQuality(type, quality) {
  return MATERIALS_DB.filter(m => m.type === type && m.quality === quality);
}

// Calculate conversion cost
function getConversionCost(fromType, fromQuality, toType, toQuality) {
  let cost = 1;
  let currentQuality = fromQuality;
  
  while (currentQuality !== toQuality) {
    if (currentQuality < toQuality) {
      cost *= TRADE_UP_COST;
      currentQuality++;
    } else {
      cost /= TRADE_DOWN_YIELD;
      currentQuality--;
    }
  }
  
  if (fromType !== toType) {
    cost *= TRADE_ACROSS_COST;
  }
  
  return cost;
}

// Main optimization algorithm
function optimizeTrading(inventory, needs) {
  const inv = JSON.parse(JSON.stringify(inventory));
  const req = JSON.parse(JSON.stringify(needs));
  const trades = [];
  const fulfilled = [];
  const unfulfilled = [];
  
  // Direct fulfillment
  for (const need of req) {
    const match = inv.find(i => i.item === need.item);
    if (match && match.quantity > 0) {
      const take = Math.min(match.quantity, need.quantity);
      match.quantity -= take;
      need.quantity -= take;
      if (take > 0) {
        fulfilled.push({
          item: need.item,
          quantity: take,
          method: 'DIRECT',
          material: getMaterial(need.item)
        });
      }
    }
  }
  
  // Same type/quality matches
  for (const need of req) {
    if (need.quantity <= 0) continue;
    const needMat = getMaterial(need.item);
    
    for (const source of inv) {
      if (source.quantity <= 0) continue;
      const srcMat = getMaterial(source.item);
      
      if (srcMat.type === needMat.type && srcMat.quality === needMat.quality && srcMat.item !== needMat.item) {
        const take = Math.min(source.quantity, need.quantity);
        source.quantity -= take;
        need.quantity -= take;
        if (take > 0) {
          fulfilled.push({
            item: need.item,
            quantity: take,
            method: 'SAME_SLOT',
            from: source.item,
            material: needMat
          });
          trades.push({
            action: 'SAME_SLOT_TRADE',
            input: { item: source.item, type: srcMat.type, quality: srcMat.quality, amount: take },
            output: { item: need.item, type: needMat.type, quality: needMat.quality, amount: take },
            ratio: '1:1'
          });
        }
      }
    }
  }
  
  // Type conversions
  for (const need of req) {
    if (need.quantity <= 0) continue;
    const needMat = getMaterial(need.item);
    
    const options = [];
    
    for (const source of inv) {
      if (source.quantity <= 0) continue;
      const srcMat = getMaterial(source.item);
      if (srcMat.item === needMat.item) continue;
      
      const costPerUnit = getConversionCost(srcMat.type, srcMat.quality, needMat.type, needMat.quality);
      
      if (costPerUnit > 0 && isFinite(costPerUnit)) {
        options.push({ source, srcMat, costPerUnit, efficiency: 1 / costPerUnit });
      }
    }
    
    options.sort((a, b) => a.costPerUnit - b.costPerUnit);
    
    for (const opt of options) {
      if (need.quantity <= 0) break;
      if (opt.source.quantity <= 0) continue;
      
      const maxProducible = Math.floor(opt.source.quantity / opt.costPerUnit);
      const toProduce = Math.min(maxProducible, need.quantity);
      
      if (toProduce > 0) {
        const consumed = Math.ceil(toProduce * opt.costPerUnit);
        opt.source.quantity -= consumed;
        need.quantity -= toProduce;
        
        const tradeSteps = generateTradeSteps(opt.srcMat, needMat, consumed, toProduce);
        trades.push(...tradeSteps);
        
        fulfilled.push({
          item: need.item,
          quantity: toProduce,
          method: 'CONVERTED',
          from: opt.source.item,
          consumed,
          material: needMat
        });
      }
    }
    
    if (need.quantity > 0) {
      unfulfilled.push({
        item: need.item,
        quantity: need.quantity,
        material: needMat
      });
    }
  }
  
  return { trades, fulfilled, unfulfilled, remainingInventory: inv.filter(i => i.quantity > 0) };
}

// Generate trade steps
function generateTradeSteps(srcMat, targetMat, inputAmount, outputAmount) {
  const steps = [];
  let currentType = srcMat.type;
  let currentQuality = srcMat.quality;
  let currentAmount = inputAmount;
  let currentItem = srcMat.item;
  
  while (currentQuality !== targetMat.quality) {
    if (currentQuality < targetMat.quality) {
      const output = Math.floor(currentAmount / TRADE_UP_COST);
      const targetItems = getMaterialsAtTypeQuality(currentType, currentQuality + 1);
      const targetItem = targetItems[0]?.item || `Grade ${currentQuality + 1}`;
      
      steps.push({
        action: 'UPGRADE',
        input: { item: currentItem, type: currentType, quality: currentQuality, amount: currentAmount },
        output: { item: targetItem, type: currentType, quality: currentQuality + 1, amount: output },
        ratio: '6:1'
      });
      currentAmount = output;
      currentQuality++;
      currentItem = targetItem;
    } else {
      const output = currentAmount * TRADE_DOWN_YIELD;
      const targetItems = getMaterialsAtTypeQuality(currentType, currentQuality - 1);
      const targetItem = targetItems[0]?.item || `Grade ${currentQuality - 1}`;
      
      steps.push({
        action: 'DOWNGRADE',
        input: { item: currentItem, type: currentType, quality: currentQuality, amount: currentAmount },
        output: { item: targetItem, type: currentType, quality: currentQuality - 1, amount: output },
        ratio: '1:3'
      });
      currentAmount = output;
      currentQuality--;
      currentItem = targetItem;
    }
  }
  
  if (currentType !== targetMat.type) {
    const output = Math.floor(currentAmount / TRADE_ACROSS_COST);
    steps.push({
      action: 'CROSS_TYPE',
      input: { item: currentItem, type: currentType, quality: currentQuality, amount: currentAmount },
      output: { item: targetMat.item, type: targetMat.type, quality: targetMat.quality, amount: output },
      ratio: '6:1'
    });
  }
  
  return steps;
}

// Quality colors
function getQualityColor(quality) {
  const colors = { 1: 'text-gray-400', 2: 'text-green-400', 3: 'text-blue-400', 4: 'text-purple-400', 5: 'text-amber-400' };
  return colors[quality] || 'text-gray-400';
}

function getQualityBg(quality) {
  const colors = {
    1: 'bg-gray-800/50 border-gray-700',
    2: 'bg-green-900/30 border-green-800/50',
    3: 'bg-blue-900/30 border-blue-800/50',
    4: 'bg-purple-900/30 border-purple-800/50',
    5: 'bg-amber-900/30 border-amber-800/50'
  };
  return colors[quality] || 'bg-gray-800/50 border-gray-700';
}

// Calculate total materials for selected blueprints
function calculateBlueprintCosts(selectedBlueprints) {
  const totals = {};
  
  for (const bp of selectedBlueprints) {
    const moduleData = BLUEPRINTS_DB[bp.module];
    if (!moduleData) continue;
    
    const blueprintData = moduleData.blueprints[bp.blueprint];
    if (!blueprintData) continue;
    
    // Calculate materials for grades fromGrade to toGrade
    for (let g = bp.fromGrade; g <= bp.toGrade; g++) {
      const gradeMats = blueprintData.grades[g];
      if (!gradeMats) continue;
      
      // Multiply by rolls
      for (const mat of gradeMats) {
        const key = mat.item;
        if (!totals[key]) totals[key] = 0;
        totals[key] += mat.qty * bp.rolls;
      }
    }
  }
  
  return Object.entries(totals).map(([item, quantity]) => ({ item, quantity }));
}

// Main Component
export default function EliteTrader() {
  const [activeTab, setActiveTab] = useState('blueprints');
  const [inventory, setInventory] = useState([
    { item: 'Carbon', quantity: 150 },
    { item: 'Iron', quantity: 200 },
    { item: 'Phosphorus', quantity: 100 },
    { item: 'Sulphur', quantity: 120 },
    { item: 'Atypical Disrupted Wake Echoes', quantity: 50 },
    { item: 'Chemical Processors', quantity: 30 },
  ]);
  
  const [manualNeeds, setManualNeeds] = useState([]);
  const [selectedBlueprints, setSelectedBlueprints] = useState([]);
  
  const [searchOwned, setSearchOwned] = useState('');
  const [searchNeeded, setSearchNeeded] = useState('');
  const [newQty, setNewQty] = useState(10);
  const [newNeedQty, setNewNeedQty] = useState(1);
  
  // Blueprint selection state
  const [selectedModule, setSelectedModule] = useState('');
  const [selectedBp, setSelectedBp] = useState('');
  const [fromGrade, setFromGrade] = useState(1);
  const [toGrade, setToGrade] = useState(5);
  const [rolls, setRolls] = useState(1);
  
  // Calculate blueprint costs
  const blueprintNeeds = useMemo(() => calculateBlueprintCosts(selectedBlueprints), [selectedBlueprints]);
  
  // Combine manual needs with blueprint needs
  const allNeeds = useMemo(() => {
    const combined = {};
    for (const n of manualNeeds) {
      combined[n.item] = (combined[n.item] || 0) + n.quantity;
    }
    for (const n of blueprintNeeds) {
      combined[n.item] = (combined[n.item] || 0) + n.quantity;
    }
    return Object.entries(combined).map(([item, quantity]) => ({ item, quantity }));
  }, [manualNeeds, blueprintNeeds]);
  
  const result = useMemo(() => optimizeTrading(inventory, allNeeds), [inventory, allNeeds]);
  
  // Filtered materials for search
  const filteredOwned = useMemo(() => {
    return MATERIALS_DB.filter(m => m.item.toLowerCase().includes(searchOwned.toLowerCase())).slice(0, 8);
  }, [searchOwned]);
  
  const filteredNeeded = useMemo(() => {
    return MATERIALS_DB.filter(m => m.item.toLowerCase().includes(searchNeeded.toLowerCase())).slice(0, 8);
  }, [searchNeeded]);
  
  const addToInventory = (item) => {
    const existing = inventory.find(i => i.item === item);
    if (existing) {
      setInventory(inventory.map(i => i.item === item ? { ...i, quantity: i.quantity + newQty } : i));
    } else {
      setInventory([...inventory, { item, quantity: newQty }]);
    }
    setSearchOwned('');
  };
  
  const addToNeeds = (item) => {
    const existing = manualNeeds.find(i => i.item === item);
    if (existing) {
      setManualNeeds(manualNeeds.map(i => i.item === item ? { ...i, quantity: i.quantity + newNeedQty } : i));
    } else {
      setManualNeeds([...manualNeeds, { item, quantity: newNeedQty }]);
    }
    setSearchNeeded('');
  };
  
  const addBlueprint = () => {
    if (selectedModule && selectedBp) {
      setSelectedBlueprints([...selectedBlueprints, {
        id: Date.now(),
        module: selectedModule,
        blueprint: selectedBp,
        fromGrade,
        toGrade,
        rolls
      }]);
    }
  };
  
  const removeBlueprint = (id) => setSelectedBlueprints(selectedBlueprints.filter(b => b.id !== id));
  const removeFromInventory = (item) => setInventory(inventory.filter(i => i.item !== item));
  const removeFromNeeds = (item) => setManualNeeds(manualNeeds.filter(i => i.item !== item));
  
  const availableBlueprints = selectedModule ? Object.keys(BLUEPRINTS_DB[selectedModule]?.blueprints || {}) : [];
  
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-3">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-4">
          <h1 className="text-2xl font-bold text-orange-500 mb-1">Elite Dangerous Material Trader</h1>
          <p className="text-slate-500 text-xs">Trade ratios: Upgrade 6→1 | Downgrade 1→3 | Cross-type 6→1</p>
        </div>
        
        {/* Tabs */}
        <div className="flex gap-2 mb-4 justify-center">
          <button
            onClick={() => setActiveTab('blueprints')}
            className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
              activeTab === 'blueprints' ? 'bg-orange-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            🔧 Blueprints
          </button>
          <button
            onClick={() => setActiveTab('manual')}
            className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
              activeTab === 'manual' ? 'bg-orange-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            📝 Manual Entry
          </button>
          <button
            onClick={() => setActiveTab('inventory')}
            className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
              activeTab === 'inventory' ? 'bg-orange-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            📦 Inventory
          </button>
        </div>
        
        {/* Blueprint Selection Tab */}
        {activeTab === 'blueprints' && (
          <div className="bg-slate-900 rounded-lg p-4 border border-slate-800 mb-4">
            <h2 className="text-lg font-semibold mb-3 text-orange-400">Select Engineering Blueprints</h2>
            
            <div className="grid md:grid-cols-6 gap-2 mb-4">
              <select
                value={selectedModule}
                onChange={(e) => { setSelectedModule(e.target.value); setSelectedBp(''); }}
                className="bg-slate-800 rounded px-3 py-2 text-sm border border-slate-700 col-span-2"
              >
                <option value="">Select Module...</option>
                {Object.keys(BLUEPRINTS_DB).map(mod => (
                  <option key={mod} value={mod}>{BLUEPRINTS_DB[mod].name}</option>
                ))}
              </select>
              
              <select
                value={selectedBp}
                onChange={(e) => setSelectedBp(e.target.value)}
                className="bg-slate-800 rounded px-3 py-2 text-sm border border-slate-700 col-span-2"
                disabled={!selectedModule}
              >
                <option value="">Select Blueprint...</option>
                {availableBlueprints.map(bp => (
                  <option key={bp} value={bp}>{bp}</option>
                ))}
              </select>
              
              <div className="flex gap-1">
                <select value={fromGrade} onChange={(e) => setFromGrade(parseInt(e.target.value))} className="bg-slate-800 rounded px-2 py-2 text-sm border border-slate-700 flex-1">
                  {[1,2,3,4,5].map(g => <option key={g} value={g}>G{g}</option>)}
                </select>
                <span className="text-slate-500 self-center">→</span>
                <select value={toGrade} onChange={(e) => setToGrade(parseInt(e.target.value))} className="bg-slate-800 rounded px-2 py-2 text-sm border border-slate-700 flex-1">
                  {[1,2,3,4,5].map(g => <option key={g} value={g}>G{g}</option>)}
                </select>
              </div>
              
              <div className="flex gap-1">
                <input
                  type="number"
                  min="1"
                  value={rolls}
                  onChange={(e) => setRolls(parseInt(e.target.value) || 1)}
                  className="bg-slate-800 rounded px-2 py-2 text-sm border border-slate-700 w-16"
                  placeholder="Rolls"
                />
                <button onClick={addBlueprint} disabled={!selectedBp} className="bg-orange-600 hover:bg-orange-500 disabled:bg-slate-700 px-3 py-2 rounded text-sm font-medium transition-colors flex-1">
                  Add
                </button>
              </div>
            </div>
            
            {/* Selected Blueprints */}
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {selectedBlueprints.map(bp => (
                <div key={bp.id} className="flex items-center justify-between bg-slate-800/50 rounded px-3 py-2 text-sm">
                  <span>
                    <span className="text-orange-400">{BLUEPRINTS_DB[bp.module]?.name}</span>
                    <span className="text-slate-400 mx-2">→</span>
                    <span className="text-blue-400">{bp.blueprint}</span>
                    <span className="text-slate-500 ml-2">G{bp.fromGrade}-G{bp.toGrade}</span>
                    <span className="text-emerald-400 ml-2">×{bp.rolls} rolls</span>
                  </span>
                  <button onClick={() => removeBlueprint(bp.id)} className="text-red-400 hover:text-red-300 px-2">✕</button>
                </div>
              ))}
              {selectedBlueprints.length === 0 && (
                <p className="text-slate-500 text-center py-4 text-sm">No blueprints selected. Add blueprints above to calculate material costs.</p>
              )}
            </div>
            
            {/* Blueprint Material Summary */}
            {blueprintNeeds.length > 0 && (
              <div className="mt-4 pt-4 border-t border-slate-800">
                <h3 className="text-sm font-medium text-amber-400 mb-2">Materials Required for Blueprints</h3>
                <div className="flex flex-wrap gap-2">
                  {blueprintNeeds.map((n, i) => {
                    const mat = getMaterial(n.item);
                    return (
                      <span key={i} className={`px-2 py-1 rounded text-xs border ${getQualityBg(mat?.quality)}`}>
                        <span className={getQualityColor(mat?.quality)}>{n.item}</span>
                        <span className="text-slate-400 ml-1">×{n.quantity}</span>
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Manual Entry Tab */}
        {activeTab === 'manual' && (
          <div className="bg-slate-900 rounded-lg p-4 border border-slate-800 mb-4">
            <h2 className="text-lg font-semibold mb-3 text-amber-400">Manual Material Needs</h2>
            
            <div className="flex gap-2 mb-3">
              <div className="flex-1 relative">
                <input
                  type="text"
                  placeholder="Search materials..."
                  value={searchNeeded}
                  onChange={(e) => setSearchNeeded(e.target.value)}
                  className="w-full bg-slate-800 rounded px-3 py-2 text-sm border border-slate-700 focus:border-amber-500 outline-none"
                />
                {searchNeeded && filteredNeeded.length > 0 && (
                  <div className="absolute top-full left-0 right-0 bg-slate-800 border border-slate-700 rounded mt-1 max-h-48 overflow-y-auto z-10">
                    {filteredNeeded.map(m => (
                      <button
                        key={m.item}
                        onClick={() => addToNeeds(m.item)}
                        className="w-full text-left px-3 py-2 hover:bg-slate-700 text-sm border-b border-slate-700 last:border-0"
                      >
                        <span className={getQualityColor(m.quality)}>{m.item}</span>
                        <span className="text-slate-500 text-xs ml-2">G{m.quality}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <input
                type="number"
                min="1"
                value={newNeedQty}
                onChange={(e) => setNewNeedQty(parseInt(e.target.value) || 1)}
                className="w-16 bg-slate-800 rounded px-2 py-2 text-sm border border-slate-700 text-center"
              />
            </div>
            
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {manualNeeds.map(need => {
                const mat = getMaterial(need.item);
                return (
                  <div key={need.item} className={`flex items-center justify-between rounded px-3 py-2 border text-sm ${getQualityBg(mat?.quality)}`}>
                    <span className={getQualityColor(mat?.quality)}>{need.item}</span>
                    <span className="text-amber-400 font-mono">×{need.quantity}</span>
                    <button onClick={() => removeFromNeeds(need.item)} className="text-red-400 hover:text-red-300 px-1">✕</button>
                  </div>
                );
              })}
              {manualNeeds.length === 0 && (
                <p className="text-slate-500 text-center py-4 text-sm">No manual needs added</p>
              )}
            </div>
          </div>
        )}
        
        {/* Inventory Tab */}
        {activeTab === 'inventory' && (
          <div className="bg-slate-900 rounded-lg p-4 border border-slate-800 mb-4">
            <h2 className="text-lg font-semibold mb-3 text-blue-400">Your Inventory</h2>
            
            <div className="flex gap-2 mb-3">
              <div className="flex-1 relative">
                <input
                  type="text"
                  placeholder="Search materials..."
                  value={searchOwned}
                  onChange={(e) => setSearchOwned(e.target.value)}
                  className="w-full bg-slate-800 rounded px-3 py-2 text-sm border border-slate-700 focus:border-blue-500 outline-none"
                />
                {searchOwned && filteredOwned.length > 0 && (
                  <div className="absolute top-full left-0 right-0 bg-slate-800 border border-slate-700 rounded mt-1 max-h-48 overflow-y-auto z-10">
                    {filteredOwned.map(m => (
                      <button
                        key={m.item}
                        onClick={() => addToInventory(m.item)}
                        className="w-full text-left px-3 py-2 hover:bg-slate-700 text-sm border-b border-slate-700 last:border-0"
                      >
                        <span className={getQualityColor(m.quality)}>{m.item}</span>
                        <span className="text-slate-500 text-xs ml-2">G{m.quality}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <input
                type="number"
                min="1"
                value={newQty}
                onChange={(e) => setNewQty(parseInt(e.target.value) || 1)}
                className="w-16 bg-slate-800 rounded px-2 py-2 text-sm border border-slate-700 text-center"
              />
            </div>
            
            <div className="space-y-1 max-h-64 overflow-y-auto">
              {inventory.map(inv => {
                const mat = getMaterial(inv.item);
                return (
                  <div key={inv.item} className={`flex items-center justify-between rounded px-3 py-2 border text-sm ${getQualityBg(mat?.quality)}`}>
                    <div>
                      <span className={getQualityColor(mat?.quality)}>{inv.item}</span>
                      <span className="text-slate-500 text-xs ml-2">G{mat?.quality}</span>
                    </div>
                    <span className="text-emerald-400 font-mono">×{inv.quantity}</span>
                    <button onClick={() => removeFromInventory(inv.item)} className="text-red-400 hover:text-red-300 px-1">✕</button>
                  </div>
                );
              })}
              {inventory.length === 0 && (
                <p className="text-slate-500 text-center py-4 text-sm">No materials in inventory</p>
              )}
            </div>
          </div>
        )}
        
        {/* Results */}
        <div className="bg-slate-900 rounded-lg p-4 border border-slate-800">
          <h2 className="text-xl font-semibold mb-4 text-orange-500">⚡ Optimization Results</h2>
          
          {allNeeds.length === 0 ? (
            <p className="text-slate-500 text-center py-8">Select blueprints or add manual needs to see optimization results</p>
          ) : (
            <>
              {/* Trade Sequence */}
              {result.trades.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-sm font-medium mb-2 text-purple-400 uppercase tracking-wide">Trade Sequence</h3>
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {result.trades.map((trade, i) => (
                      <div key={i} className="bg-slate-800/50 rounded p-2 flex items-center gap-2 flex-wrap text-xs">
                        <span className={`px-2 py-0.5 rounded font-medium ${
                          trade.action === 'UPGRADE' ? 'bg-green-900/50 text-green-400' :
                          trade.action === 'DOWNGRADE' ? 'bg-blue-900/50 text-blue-400' :
                          trade.action === 'CROSS_TYPE' ? 'bg-purple-900/50 text-purple-400' :
                          'bg-slate-700 text-slate-300'
                        }`}>
                          {trade.action}
                        </span>
                        <span className="text-red-400">{trade.input.amount}×</span>
                        <span className={getQualityColor(trade.input.quality)}>{trade.input.item}</span>
                        <span className="text-slate-500">→</span>
                        <span className="text-emerald-400">{trade.output.amount}×</span>
                        <span className={getQualityColor(trade.output.quality)}>{trade.output.item}</span>
                        <span className="text-slate-600 ml-auto">[{trade.ratio}]</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Summary */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium mb-2 text-emerald-400 uppercase tracking-wide">✓ Fulfilled ({result.fulfilled.length})</h3>
                  <div className="space-y-1 max-h-40 overflow-y-auto">
                    {result.fulfilled.map((f, i) => (
                      <div key={i} className="bg-emerald-900/20 border border-emerald-900/50 rounded p-2 text-xs">
                        <span className="text-emerald-300">{f.quantity}× {f.item}</span>
                        <span className="text-slate-500 ml-2">
                          {f.method === 'DIRECT' ? '(direct)' : 
                           f.method === 'SAME_SLOT' ? `(from ${f.from})` :
                           `(${f.consumed}× ${f.from})`}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium mb-2 text-red-400 uppercase tracking-wide">✗ Unfulfilled ({result.unfulfilled.length})</h3>
                  {result.unfulfilled.length > 0 ? (
                    <div className="space-y-1 max-h-40 overflow-y-auto">
                      {result.unfulfilled.map((u, i) => (
                        <div key={i} className="bg-red-900/20 border border-red-900/50 rounded p-2 text-xs">
                          <span className="text-red-300">{u.quantity}× {u.item}</span>
                          <div className="text-slate-500 mt-1 truncate">Source: {u.material?.source}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-emerald-400 text-sm">All needs fulfilled! 🎉</p>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
        
        {/* Legend */}
        <div className="mt-3 flex gap-4 justify-center text-xs text-slate-500">
          <span className="text-gray-400">● G1</span>
          <span className="text-green-400">● G2</span>
          <span className="text-blue-400">● G3</span>
          <span className="text-purple-400">● G4</span>
          <span className="text-amber-400">● G5</span>
        </div>
      </div>
    </div>
  );
}
