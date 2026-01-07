/**
 * Calculate kWp (kilowatts peak) from number of panels and average panel output
 * @param {number} panels - Number of solar panels
 * @param {number} avgPanelOutput - Average solar panel output in Wp (watts peak)
 * @returns {number} kWp value
 */
export const calculateKwp = (panels, avgPanelOutput) => {
  if (!panels || panels <= 0 || !avgPanelOutput || avgPanelOutput <= 0) {
    return 0;
  }
  return (panels * avgPanelOutput) / 1000;
};

/**
 * Calculate annual output in kWh
 * @param {number} kwp - Kilowatts peak
 * @param {number} kwhPerKwpPerYear - kWh per kWp per year (default: 875 for Netherlands)
 * @param {number} availabilityFactor - Availability factor as percentage (default: 99)
 * @returns {number} Annual output in kWh
 */
export const calculateAnnualOutput = (kwp, kwhPerKwpPerYear, availabilityFactor) => {
  if (!kwp || kwp <= 0) {
    return 0;
  }
  if (!kwhPerKwpPerYear || kwhPerKwpPerYear <= 0) {
    return 0;
  }
  if (!availabilityFactor || availabilityFactor <= 0) {
    return 0;
  }
  return kwp * kwhPerKwpPerYear * (availabilityFactor / 100);
};

/**
 * Calculate both kWp and annual output
 * @param {Object} params - Calculation parameters
 * @param {number} params.panels - Number of solar panels
 * @param {number} params.avgPanelOutput - Average solar panel output in Wp
 * @param {number} params.kwhPerKwpPerYear - kWh per kWp per year
 * @param {number} params.availabilityFactor - Availability factor as percentage
 * @returns {Object} Object with kwp and annualOutput
 */
export const calculateSolarPanelOutput = ({
  panels,
  avgPanelOutput,
  kwhPerKwpPerYear = 875,
  availabilityFactor = 99
}) => {
  const kwp = calculateKwp(panels, avgPanelOutput);
  const annualOutput = calculateAnnualOutput(kwp, kwhPerKwpPerYear, availabilityFactor);
  
  return {
    kwp,
    annualOutput
  };
};
