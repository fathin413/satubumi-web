/**
 * Helper to translate spatial overlay keys and values consistently between ID and EN.
 */

const KEY_MAP_EN: Record<string, string> = {
  kawasan_hutan: "Forest Estate Zone",
  fungsi_kawasan: "Forest Zone Function",
  tutupan_lahan: "Land Cover",
  land_cover: "Land Cover",
  landcover: "Land Cover",
  pipib: "Forest Moratorium (PIPIB)",
  moratorium: "Forest Moratorium (PIPIB)",
  moratorium_hutan: "Forest Moratorium (PIPIB)",
  gambut: "Peatland Depth & Status",
  lahan_gambut: "Peatland Status",
  kedalaman_gambut: "Peatland Depth",
  status_lahan: "Land Status",
  kesesuaian_ruang: "Spatial Suitability",
  kesesuaian_lahan: "Land Suitability",
  kelerengan: "Slope",
  slope: "Slope",
  curah_hujan: "Rainfall",
  rainfall: "Rainfall",
  jenis_tanah: "Soil Type",
  soil_type: "Soil Type",
  elevasi: "Elevation",
  elevation: "Elevation",
  risiko_kebakaran: "Fire Risk",
  fire_risk: "Fire Risk",
  aksesibilitas: "Road Accessibility",
  aksesibilitas_jalan: "Road Accessibility",
  accessibility: "Road Accessibility",
  provinsi: "Province",
  kabupaten: "Regency",
  kabupaten_kota: "Regency / City",
  kecamatan: "District",
  desa: "Village",
  das: "Watershed (DAS)",
  daerah_aliran_sungai: "Watershed (DAS)",
  hidrologi: "Hydrology",
  keanekaragaman_hayati: "Biodiversity",
  biodiversitas: "Biodiversity",
  izin_konsesi: "Concession Permit",
  konsesi: "Concession Permit",
  hgu: "Cultivation Rights (HGU)",
  hak_guna_usaha: "Cultivation Rights (HGU)",
  perhutanan_sosial: "Social Forestry",
};

const KEY_MAP_ID: Record<string, string> = {
  kawasan_hutan: "Kawasan Hutan",
  fungsi_kawasan: "Fungsi Kawasan",
  tutupan_lahan: "Tutupan Lahan",
  land_cover: "Tutupan Lahan",
  landcover: "Tutupan Lahan",
  pipib: "PIPIB (Moratorium)",
  moratorium: "PIPIB (Moratorium)",
  moratorium_hutan: "Moratorium Hutan (PIPIB)",
  gambut: "Lahan Gambut",
  lahan_gambut: "Lahan Gambut",
  kedalaman_gambut: "Kedalaman Gambut",
  status_lahan: "Status Lahan",
  kesesuaian_ruang: "Kesesuaian Ruang",
  kesesuaian_lahan: "Kesesuaian Lahan",
  kelerengan: "Kelerengan",
  slope: "Kelerengan",
  curah_hujan: "Curah Hujan",
  rainfall: "Curah Hujan",
  jenis_tanah: "Jenis Tanah",
  soil_type: "Jenis Tanah",
  elevasi: "Elevasi",
  elevation: "Elevasi",
  risiko_kebakaran: "Risiko Kebakaran",
  fire_risk: "Risiko Kebakaran",
  aksesibilitas: "Aksesibilitas",
  aksesibilitas_jalan: "Aksesibilitas Jalan",
  accessibility: "Aksesibilitas",
  provinsi: "Provinsi",
  kabupaten: "Kabupaten",
  kabupaten_kota: "Kabupaten/Kota",
  kecamatan: "Kecamatan",
  desa: "Desa",
  das: "Daerah Aliran Sungai (DAS)",
  daerah_aliran_sungai: "Daerah Aliran Sungai (DAS)",
  hidrologi: "Hidrologi",
  keanekaragaman_hayati: "Keanekaragaman Hayati",
  biodiversitas: "Biodiversitas",
  izin_konsesi: "Izin Konsesi",
  konsesi: "Izin Konsesi",
  hgu: "Hak Guna Usaha (HGU)",
  hak_guna_usaha: "Hak Guna Usaha (HGU)",
  perhutanan_sosial: "Perhutanan Sosial",
};

const VALUE_MAP_EN: Record<string, string> = {
  // Kawasan Hutan & Zonasi
  "hutan lindung": "Protection Forest",
  "hl": "Protection Forest (HL)",
  "hutan produksi": "Production Forest",
  "hp": "Production Forest (HP)",
  "hutan produksi tetap": "Permanent Production Forest",
  "hpt": "Limited Production Forest (HPT)",
  "hutan produksi terbatas": "Limited Production Forest",
  "hpk": "Convertible Production Forest (HPK)",
  "hutan produksi konversi": "Convertible Production Forest",
  "hutan produksi yang dapat dikonversi": "Convertible Production Forest",
  "hutan konservasi": "Conservation Forest",
  "hk": "Conservation Forest (HK)",
  "areal penggunaan lain": "Other Utilization Area (APL)",
  "area penggunaan lain": "Other Utilization Area (APL)",
  "apl": "Other Utilization Area (APL)",
  "taman nasional": "National Park",
  "tn": "National Park (TN)",
  "cagar alam": "Nature Reserve",
  "ca": "Nature Reserve (CA)",
  "suaka margasatwa": "Wildlife Sanctuary",
  "sm": "Wildlife Sanctuary (SM)",
  "taman wisata alam": "Nature Tourism Park",
  "twa": "Nature Tourism Park (TWA)",
  "taman hutan raya": "Grand Forest Park",
  "tahura": "Grand Forest Park (TAHURA)",
  "taman buru": "Hunting Park",
  "kawasan suaka alam": "Nature Sanctuary Reserve",
  "kawasan pelestarian alam": "Nature Conservation Area",

  // Tutupan Lahan (Land Cover)
  "hutan primer": "Primary Forest",
  "hutan sekunder": "Secondary Forest",
  "hutan lahan kering primer": "Primary Dryland Forest",
  "hutan lahan kering sekunder": "Secondary Dryland Forest",
  "hutan rawa primer": "Primary Swamp Forest",
  "hutan rawa sekunder": "Secondary Swamp Forest",
  "hutan mangrove primer": "Primary Mangrove Forest",
  "hutan mangrove sekunder": "Secondary Mangrove Forest",
  "hutan tanaman": "Plantation Forest",
  "hutan tanaman industri": "Industrial Timber Plantation (HTI)",
  "hti": "Industrial Timber Plantation (HTI)",
  "semak belukar": "Shrubland / Bush",
  "semak belukar rawa": "Swamp Shrubland",
  "semak": "Shrubland",
  "belukar": "Bush",
  "tanah terbuka": "Bare Land",
  "pertanian lahan kering": "Dryland Agriculture",
  "pertanian lahan kering campur": "Mixed Dryland Agriculture",
  "perkebunan": "Plantation",
  "sawah": "Paddy Field",
  "pemukiman": "Settlement Area",
  "pertambangan": "Mining Area",
  "rawa": "Swamp",
  "tubuh air": "Water Body",
  "badan air": "Water Body",
  "air": "Water Body",
  "tambak": "Aquaculture Pond",
  "bandara / pelabuhan": "Airport / Harbor",
  "transmigrasi": "Transmigration Area",

  // Gambut (Peatland)
  "gambut dangkal": "Shallow Peat (< 50 cm)",
  "gambut sedang": "Medium Peat (50 - 100 cm)",
  "gambut dalam": "Deep Peat (100 - 200 cm)",
  "gambut sangat dalam": "Very Deep Peat (> 200 cm)",
  "non gambut": "Non-Peat / Mineral Soil",
  "bukan gambut": "Non-Peat / Mineral Soil",
  "mineral": "Mineral Soil",
  "tanah mineral": "Mineral Soil",
  "kubah gambut": "Peat Dome",

  // PIPIB (Moratorium)
  "pipib": "Included in Forest Moratorium (PIPIB)",
  "masuk pipib": "Included in Forest Moratorium (PIPIB)",
  "masuk moratorium": "Included in Forest Moratorium",
  "termasuk pipib": "Included in Forest Moratorium (PIPIB)",
  "bukan pipib": "Excluded from Moratorium",
  "tidak masuk pipib": "Excluded from Moratorium",
  "tidak termasuk pipib": "Excluded from Moratorium",
  "non pipib": "Excluded from Moratorium",
  "tidak masuk moratorium": "Excluded from Moratorium",

  // Kesesuaian & Fungsi
  "sesuai": "Suitable",
  "tidak sesuai": "Not Suitable",
  "tumpang tindih": "Overlapping",
  "tidak tumpang tindih": "No Overlap",
  "bebas tumpang tindih": "No Overlap",
  "fungsi lindung": "Protection Function",
  "fungsi produksi": "Production Function",
  "fungsi konservasi": "Conservation Function",
  "budidaya": "Cultivation",
  "non kehutanan": "Non-Forestry",
  "kehutanan": "Forestry",

  // General Status
  "ya": "Yes",
  "tidak": "No",
  "ada": "Present",
  "tidak ada": "None",
  "tersedia": "Available",
  "tidak tersedia": "Not Available",
  "rendah": "Low",
  "sedang": "Medium",
  "tinggi": "High",
  "sangat rendah": "Very Low",
  "sangat tinggi": "Very High",
  "aman": "Safe",
  "kritis": "Critical",
  "rentan": "Vulnerable",
  "berkelanjutan": "Sustainable",
  "tidak berkelanjutan": "Unsustainable",
};

/**
 * Format string to Title Case (capitalize first letter of each word)
 */
function toTitleCase(str: string): string {
  return str
    .toLowerCase()
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Translates a spatial overlay key (e.g. "01_kawasan_hutan", "tutupan_lahan")
 */
export function translateSpatialKey(key: string, isId: boolean): string {
  if (!key) return "";
  const cleaned = key
    .replace(/^\d+_/, "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");

  if (isId) {
    if (KEY_MAP_ID[cleaned]) return KEY_MAP_ID[cleaned];
    return toTitleCase(cleaned.replace(/_/g, " "));
  }

  if (KEY_MAP_EN[cleaned]) return KEY_MAP_EN[cleaned];
  return toTitleCase(cleaned.replace(/_/g, " "));
}

/**
 * Translates a spatial overlay value or function string (e.g. "Hutan Lindung", "Gambut Dalam", true/false)
 */
export function translateSpatialValue(
  val: unknown,
  isId: boolean
): string {
  if (val === null || val === undefined || val === "") return "—";

  if (typeof val === "boolean") {
    if (isId) return val ? "Ya" : "Tidak";
    return val ? "Yes" : "No";
  }

  const strVal = String(val).trim();
  if (!strVal || strVal === "—") return "—";

  if (isId) {
    // If it's Indonesian, return as clean title case or original if already formatted
    return strVal;
  }

  // English translation lookup
  const lower = strVal.toLowerCase();
  if (VALUE_MAP_EN[lower]) {
    return VALUE_MAP_EN[lower];
  }

  // Check if string contains known keywords
  let translated = strVal;
  for (const [idKey, enVal] of Object.entries(VALUE_MAP_EN)) {
    // Only replace whole words/phrases
    const regex = new RegExp(`\\b${idKey}\\b`, "gi");
    if (regex.test(translated)) {
      translated = translated.replace(regex, enVal);
    }
  }

  return translated;
}

/**
 * Translates feasibility categories between Indonesian and English
 * (e.g. "Potensi Tinggi" <-> "High Potential", "Potensi Sedang" <-> "Moderate Potential", etc.)
 */
export function translateFeasibilityCategory(category: unknown, isId: boolean): string {
  if (!category || typeof category !== "string") return "—";
  const cat = category.trim().toLowerCase();

  const mapping: Record<string, { id: string; en: string }> = {
    "potensi tinggi": { id: "Potensi Tinggi", en: "High Potential" },
    "high potential": { id: "Potensi Tinggi", en: "High Potential" },
    "potensi sedang": { id: "Potensi Sedang", en: "Moderate Potential" },
    "moderate potential": { id: "Potensi Sedang", en: "Moderate Potential" },
    "medium potential": { id: "Potensi Sedang", en: "Moderate Potential" },
    "potensi rendah": { id: "Potensi Rendah", en: "Low Potential" },
    "low potential": { id: "Potensi Rendah", en: "Low Potential" },
    "tidak layak": { id: "Tidak Layak", en: "Not Feasible" },
    "not feasible": { id: "Tidak Layak", en: "Not Feasible" },
    "sangat layak": { id: "Sangat Layak", en: "Highly Feasible" },
    "highly feasible": { id: "Sangat Layak", en: "Highly Feasible" },
    "layak": { id: "Layak", en: "Feasible" },
    "feasible": { id: "Layak", en: "Feasible" },
    "kurang layak": { id: "Kurang Layak", en: "Marginally Feasible" },
    "marginally feasible": { id: "Kurang Layak", en: "Marginally Feasible" },
  };

  if (mapping[cat]) {
    return isId ? mapping[cat].id : mapping[cat].en;
  }

  // Fallback pattern matching
  if (cat.includes("tinggi") || cat.includes("high")) return isId ? "Potensi Tinggi" : "High Potential";
  if (cat.includes("sedang") || cat.includes("moderate") || cat.includes("medium")) return isId ? "Potensi Sedang" : "Moderate Potential";
  if (cat.includes("rendah") || cat.includes("low")) return isId ? "Potensi Rendah" : "Low Potential";
  if (cat.includes("tidak") || cat.includes("not")) return isId ? "Tidak Layak" : "Not Feasible";

  return category;
}

/**
 * Translates strategic recommendations between Indonesian and English
 */
export function translateRecommendation(rec: unknown, isId: boolean): string {
  if (!rec || typeof rec !== "string") return "";
  const trimmed = rec.trim();

  const RECOMMENDATIONS_EN: Record<string, string> = {
    "Wilayah memiliki kelayakan tinggi untuk segera melanjutkan ke tahap Feasibility Study rinci (Full FS).":
      "The project area demonstrates high feasibility to proceed directly to a detailed Feasibility Study (Full FS).",
    "Lakukan pengumpulan baseline data lapangan untuk inventarisasi flora/fauna dan konfirmasi status legalitas hutan.":
      "Conduct field baseline data collection for flora/fauna inventory and confirm forest tenure legality status.",
    "Proyek potensial namun memerlukan optimalisasi luas area atau integrasi skema agroforestri/restorasi.":
      "The project has good potential but requires area optimization or integration of agroforestry/restoration schemes.",
    "Lakukan penilaian ulang variabel biaya operasional dan negosiasi harga kredit karbon minimal USD 12-15/tCO2e.":
      "Re-evaluate operational cost variables and negotiate carbon credit pricing of at least USD 12-15/tCO2e.",
    "Skor kelayakan relatif rendah pada skala luas area saat ini.":
      "Feasibility score is relatively low at current land area scale.",
    "Disarankan melakukan konsolidasi wilayah dengan menambahkan area di sekitarnya untuk menutupi fixed cost pengembangan.":
      "Area consolidation with surrounding land is advised to cover fixed project development expenditures.",
    "Catatan: Skala area < 5.000 ha memiliki rasio fixed cost tinggi per hektare.":
      "Note: Project area < 5,000 ha carries a high fixed cost ratio per hectare.",
  };

  const RECOMMENDATIONS_ID: Record<string, string> = Object.fromEntries(
    Object.entries(RECOMMENDATIONS_EN).map(([k, v]) => [v, k])
  );

  if (isId) {
    if (RECOMMENDATIONS_ID[trimmed]) return RECOMMENDATIONS_ID[trimmed];
    return trimmed;
  } else {
    if (RECOMMENDATIONS_EN[trimmed]) return RECOMMENDATIONS_EN[trimmed];
    // Check partial matches
    for (const [idText, enText] of Object.entries(RECOMMENDATIONS_EN)) {
      if (trimmed.toLowerCase().includes(idText.toLowerCase().slice(0, 25))) {
        return enText;
      }
    }
    return trimmed;
  }
}

/**
 * Translates ecosystem types between Indonesian and English
 */
export function translateEcosystemType(type: unknown, isId: boolean): string {
  if (!type || typeof type !== "string") return "—";
  const t = type.toLowerCase().trim().replace(/[\s-]+/g, "_");
  const map: Record<string, { id: string; en: string }> = {
    hutan_tropis: { id: "Hutan Tropis", en: "Tropical Forest" },
    tropical_forest: { id: "Hutan Tropis", en: "Tropical Forest" },
    mangrove: { id: "Mangrove", en: "Mangrove" },
    gambut: { id: "Gambut", en: "Peatland" },
    peatland: { id: "Gambut", en: "Peatland" },
    peat: { id: "Gambut", en: "Peatland" },
    agroforestri: { id: "Agroforestri", en: "Agroforestry" },
    agroforestry: { id: "Agroforestri", en: "Agroforestry" },
    lahan_terdegradasi: { id: "Lahan Terdegradasi", en: "Degraded Land" },
    degraded_land: { id: "Lahan Terdegradasi", en: "Degraded Land" },
  };
  if (map[t]) return isId ? map[t].id : map[t].en;
  return toTitleCase(t.replace(/_/g, " "));
}
