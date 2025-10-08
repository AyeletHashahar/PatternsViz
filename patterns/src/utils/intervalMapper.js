// src/utils/intervalMapper.js
// Maps full interval names to shortened versions for display

/**
 * Maps full interval names to their shortened versions
 * @param {string} fullName - The full interval name (e.g., "Heart Rate.3", "Temperature.2")
 * @returns {string} - The shortened version (e.g., "HR.3", "Temp.2")
 */
export function shortenIntervalName(fullName) {
  if (!fullName || typeof fullName !== 'string') {
    return fullName;
  }

  // Extract the base name and any suffix (like .3, .2, etc.)
  const match = fullName.match(/^(.+?)(\.\d+)?$/);
  if (!match) return fullName;
  
  const baseName = match[1].trim();
  const suffix = match[2] || '';

  // Define the mapping for common interval names
  const nameMap = {
    // Heart Rate variations
    'Heart Rate': 'HR',
    'heart rate': 'HR',
    'HEART RATE': 'HR',
    
    // Temperature variations
    'Temperature': 'Temp',
    'temperature': 'Temp',
    'TEMPERATURE': 'Temp',
    
    // Respiratory Rate variations
    'Respiratory Rate': 'RR',
    'respiratory rate': 'RR',
    'RESPIRATORY RATE': 'RR',
    
    // O2 saturation variations
    'O2 saturation pulseoxymetry': 'O2',
    'O2 Saturation Pulseoxymetry': 'O2',
    'O2 SATURATION PULSEOXYMETRY': 'O2',
    'O2 saturation': 'O2',
    'O2 Saturation': 'O2',
    'O2 SATURATION': 'O2',
    
    // Blood Pressure variations
    'Non Invasive Blood Pressure systolic': 'NIBP-Sys',
    'Non Invasive Blood Pressure diastolic': 'NIBP-Dia',
    'NON INVASIVE BLOOD PRESSURE SYSTOLIC': 'NIBP-Sys',
    'NON INVASIVE BLOOD PRESSURE DIASTOLIC': 'NIBP-Dia',
    'Blood Pressure systolic': 'BP-Sys',
    'Blood Pressure diastolic': 'BP-Dia',
    
    // Urine output variations
    'Urine output (Foley)': 'UO',
    'URINE OUTPUT (FOLEY)': 'UO',
    'Urine Output (Foley)': 'UO',
    
    // Chest tubes variations
    'Chest Tubes Mediastinal': 'CT',
    'CHEST TUBES MEDIASTINAL': 'CT',
    'Chest Tubes': 'CT',
    
    // Lab values - keep as is but shorten if needed
    'Potassium': 'K+',
    'Sodium': 'Na+',
    'Creatinine': 'Cr',
    'Bicarbonate': 'HCO3-',
    'Total CO2': 'CO2',
    'Urea Nitrogen': 'BUN',
  };

  // Check for exact match first
  if (nameMap[baseName]) {
    return nameMap[baseName] + suffix;
  }

  // Check for case-insensitive match
  const lowerBaseName = baseName.toLowerCase();
  for (const [key, value] of Object.entries(nameMap)) {
    if (key.toLowerCase() === lowerBaseName) {
      return value + suffix;
    }
  }

  // If no mapping found, return the original name
  return fullName;
}

/**
 * Creates a mapping object from full names to shortened names
 * @param {Array<string>} fullNames - Array of full interval names
 * @returns {Object} - Mapping object { fullName: shortenedName }
 */
export function createIntervalMapping(fullNames) {
  const mapping = {};
  fullNames.forEach(fullName => {
    mapping[fullName] = shortenIntervalName(fullName);
  });
  return mapping;
}

/**
 * Batch shorten multiple interval names
 * @param {Array<string>} fullNames - Array of full interval names
 * @returns {Array<string>} - Array of shortened names
 */
export function shortenIntervalNames(fullNames) {
  return fullNames.map(shortenIntervalName);
}
