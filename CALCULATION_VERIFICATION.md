# Solar Panel Calculation Verification

## Formulas

### 1. kWp (Kilowatts Peak) Calculation
```
kWp = (Number of Panels × Average Panel Output in Wp) / 1000
```

**Example:**
- 10 panels × 435 Wp = 4,350 Wp = 4.35 kWp

### 2. Annual Output (kWh) Calculation
```
Annual Output = kWp × kWh/kWp/year × (Availability Factor / 100)
```

**Example:**
- 4.35 kWp × 875 kWh/kWp/year × (99 / 100) = 3,768.19 kWh

## Calculation Logic

### Initial Display (from Spreadsheet)
- If spreadsheet contains `annualOutput` value → **Use spreadsheet value**
- If spreadsheet contains `kwp` value → **Use spreadsheet value**
- Otherwise → **Calculate from formulas above**

### When User Edits Fields
When any of these fields are changed:
- **KWH/KWP/YEAR_NL**
- **AVAILABILITY FACTOR**
- **AVG SOLAR PANEL OUTPUT**

The system will:
1. **Always recalculate kWp** using: `(panels × avgPanelOutput) / 1000`
2. **Always recalculate Annual Output** using: `kWp × kwhPerKwpPerYear × (availabilityFactor / 100)`

## Test Results

All 22 tests pass, verifying:
- ✅ kWp calculation correctness
- ✅ Annual output calculation correctness
- ✅ Edge cases (zero values, negative values)
- ✅ Recalculation when individual fields change
- ✅ Consistency across different scenarios
- ✅ Integration tests for formula verification

## Running Tests

```bash
npm test
```

## Test Coverage

The test suite covers:
1. Basic kWp calculations
2. Basic annual output calculations
3. Combined calculations
4. Default value handling
5. Field change recalculation
6. Edge cases and error handling
7. Real-world examples
8. Formula consistency verification

## Key Points

1. **Spreadsheet values take precedence** on initial load
2. **Calculated values are used** when user edits fields
3. **All calculations use the same utility functions** ensuring consistency
4. **Formulas are mathematically correct** and verified by tests
