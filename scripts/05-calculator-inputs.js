/**
 * SCRIPT 05 — Calculator Manual Inputs
 *
 * What this does:
 *  - For each slider in CalculatorView, adds a <input type="number"> to its right
 *  - Slider and input stay in sync (two-way binding)
 *  - Uses a utility wrapper component `SliderWithInput` that handles sync logic
 *  - Replaces each raw <input type="range"> with <SliderWithInput>
 *
 * Strategy:
 *  - We add a SliderWithInput component near the top of the file
 *  - We replace the slider JSX patterns in CalculatorView
 *
 * Run from project root:
 *   node scripts/05-calculator-inputs.js
 */

const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, '../src/app/page.tsx');
let src = fs.readFileSync(FILE, 'utf8');

// ─── 1. Add SliderWithInput component ────────────────────────────────────────
const SLIDER_COMPONENT = `
// ── SliderWithInput — synced range slider + number input ──────────────────────
function SliderWithInput({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  prefix = '',
  suffix = '',
  formatDisplay,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
  prefix?: string;
  suffix?: string;
  formatDisplay?: (v: number) => string;
}) {
  const [inputStr, setInputStr] = React.useState(String(value));

  // Sync inputStr when value changes from outside (slider drag)
  React.useEffect(() => {
    setInputStr(String(value));
  }, [value]);

  const handleSlider = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value);
    onChange(v);
  };

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputStr(e.target.value);
  };

  const handleInputBlur = () => {
    let v = parseFloat(inputStr);
    if (isNaN(v)) v = min;
    v = Math.max(min, Math.min(max, v));
    // Round to step
    v = Math.round(v / step) * step;
    onChange(v);
    setInputStr(String(v));
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      (e.target as HTMLInputElement).blur();
    }
  };

  const displayValue = formatDisplay ? formatDisplay(value) : \`\${prefix}\${value.toLocaleString()}\${suffix}\`;

  return (
    <div className="slider-with-input">
      <div className="slider-row-label">
        <span className="slider-label">{label}</span>
        <span className="slider-display-value">{displayValue}</span>
      </div>
      <div className="slider-row-controls">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={handleSlider}
          className="slider-range"
        />
        <input
          type="number"
          min={min}
          max={max}
          step={step}
          value={inputStr}
          onChange={handleInput}
          onBlur={handleInputBlur}
          onKeyDown={handleInputKeyDown}
          className="slider-number-input"
          aria-label={\`\${label} exact value\`}
        />
      </div>
    </div>
  );
}
// ── End SliderWithInput ───────────────────────────────────────────────────────
`;

const INSERT_BEFORE_CALC = 'function CalculatorView(';
if (!src.includes('function SliderWithInput(') && src.includes(INSERT_BEFORE_CALC)) {
  src = src.replace(INSERT_BEFORE_CALC, SLIDER_COMPONENT + '\n' + INSERT_BEFORE_CALC);
  console.log('✅ Added SliderWithInput component');
} else {
  console.log('⏭  SliderWithInput already present or anchor not found');
}

// ─── 2. Replace sliders in CalculatorView ────────────────────────────────────
// The CalculatorView has sliders for: principal, monthly contribution, rate, years.
// We look for the specific slider patterns and replace them.
// 
// Typical pattern before:
//   <input type="range" min={1000} max={1000000} step={1000} value={principal}
//     onChange={(e) => setPrincipal(Number(e.target.value))} className="slider" />
//
// We replace each with <SliderWithInput ... />

// ── Principal slider ──────────────────────────────────────────────────────────
const PRINCIPAL_SLIDER_PATTERN = /(<(?:label|div)[^>]*>[\s\S]*?)?<input\s+type="range"\s+[^/]*?value=\{principal\}\s+onChange=\{[^}]*setPrincipal[^}]*\}[^/]*\/>/;
const principalMatch = src.match(PRINCIPAL_SLIDER_PATTERN);
if (principalMatch && !src.includes('SliderWithInput') === false && !src.includes('label="Initial Amount"')) {
  // Already done
}

// Instead of fragile regex, we do targeted string replacements.
// We look for the exact onChange pattern for each state setter.

function replaceSlider(source, stateName, setterName, min, max, step, label, prefix, suffix) {
  // Pattern: <input type="range" ... value={stateName} onChange={(e) => setterName(...)} ... />
  // This is a best-effort replacement — we look for onChange containing the setter name
  // and replace the nearest input[type=range] element.
  
  // Find the range input that sets this state
  const patterns = [
    // Pattern A: onChange={(e) => setterName(Number(e.target.value))}
    new RegExp(`<input\\s+type="range"[^>]*value=\\{${stateName}\\}[^>]*onChange=\\{[^}]*${setterName}[^}]*\\}[^/]*/>`,'s'),
    new RegExp(`<input\\s+type="range"[^>]*onChange=\\{[^}]*${setterName}[^}]*\\}[^>]*value=\\{${stateName}\\}[^/]*/>`,'s'),
  ];
  
  const replacement = `<SliderWithInput
          label="${label}"
          value={${stateName}}
          min={${min}}
          max={${max}}
          step={${step}}
          onChange={(v) => ${setterName}(v)}
          prefix="${prefix}"
          suffix="${suffix}"
        />`;
  
  for (const pattern of patterns) {
    if (pattern.test(source)) {
      source = source.replace(pattern, replacement);
      console.log(`✅ Replaced ${stateName} slider with SliderWithInput`);
      return source;
    }
  }
  console.log(`⚠️  Could not auto-replace ${stateName} slider — add SliderWithInput manually`);
  return source;
}

// Replace each calculator slider
src = replaceSlider(src, 'principal', 'setPrincipal', 1000, 1000000, 1000, 'Initial Amount', 'R', '');
src = replaceSlider(src, 'monthly', 'setMonthly', 0, 50000, 100, 'Monthly Contribution', 'R', '');
src = replaceSlider(src, 'rate', 'setRate', 1, 30, 0.5, 'Annual Return Rate', '', '%');
src = replaceSlider(src, 'years', 'setYears', 1, 40, 1, 'Investment Period', '', ' yrs');

// ─── 3. Add CSS for slider row ────────────────────────────────────────────────
const CSS_FILE = path.join(__dirname, '../src/app/globals.css');
let css = fs.readFileSync(CSS_FILE, 'utf8');

const SLIDER_CSS = `
/* ── SliderWithInput ──────────────────────────────────────────── */
.slider-with-input {
  margin-bottom: 1.25rem;
}

.slider-row-label {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 0.4rem;
}

.slider-label {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-secondary, #555);
}

.slider-display-value {
  font-size: 0.9rem;
  font-weight: 700;
  color: var(--text-primary, #111);
}

.slider-row-controls {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.slider-range {
  flex: 1;
  -webkit-appearance: none;
  height: 6px;
  border-radius: 3px;
  background: var(--border, #ddd);
  outline: none;
}

.slider-range::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #007A4D;
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(0,122,77,0.3);
}

.slider-range::-moz-range-thumb {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #007A4D;
  cursor: pointer;
  border: none;
}

.slider-number-input {
  width: 72px;
  padding: 0.35rem 0.5rem;
  border: 1.5px solid var(--border, #ddd);
  border-radius: 0.5rem;
  font-size: 0.85rem;
  font-weight: 600;
  text-align: right;
  background: var(--card-bg, #fff);
  color: var(--text-primary, #111);
  -moz-appearance: textfield;
}

.slider-number-input::-webkit-inner-spin-button,
.slider-number-input::-webkit-outer-spin-button {
  opacity: 1;
}

.slider-number-input:focus {
  outline: none;
  border-color: #007A4D;
  box-shadow: 0 0 0 2px rgba(0,122,77,0.15);
}
`;

if (!css.includes('.slider-with-input')) {
  css += SLIDER_CSS;
  fs.writeFileSync(CSS_FILE, css);
  console.log('✅ Added SliderWithInput CSS to globals.css');
} else {
  console.log('⏭  SliderWithInput CSS already present');
}

// ─── Write page.tsx ───────────────────────────────────────────────────────────
fs.writeFileSync(FILE, src);
console.log('\n✅ Script 05 complete — Calculator manual inputs added.');
console.log('Run: npm run build   to verify no TS errors');
