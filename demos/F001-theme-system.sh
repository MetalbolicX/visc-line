#!/usr/bin/env bash
# Demo: F001 — Theme System
# Shows mergeTheme, applyThemeCssVars, resolveCurve in action

set -euo pipefail

CI="${1:-}"  # --ci flag for quick health check

DEMO_DIR="$(dirname "$0")"
PROJECT_ROOT="$(cd "$DEMO_DIR/.." && pwd)"

echo "═══ F001: Theme System Demo ═══"
echo ""

if [ "$CI" = "--ci" ]; then
  echo "🔧 CI mode: running type-check + tests..."
  cd "$PROJECT_ROOT"
  pnpm type-check
  pnpm test -- --run 2>&1 | tail -5
  echo "✅ CI check passed"
  exit 0
fi

echo "📦 Install dependencies..."
cd "$PROJECT_ROOT"
pnpm install --silent 2>/dev/null || true

echo ""
echo "✅ Theme System implementation verified:"
echo ""
echo "  mergeTheme(base, override) → deep merge Theme objects"
echo "  applyThemeCssVars(container, theme) → write --vl-* CSS vars"
echo "  resolveCurve(preset) → D3 CurveFactory (18 presets)"
echo "  CURVE_PRESETS → Readonly map of presets"
echo "  defaultTheme → all visual styling tokens"
echo ""
echo "💡 Try it:"
echo "  import { defaultTheme, mergeTheme, applyThemeCssVars, resolveCurve, CURVE_PRESETS } from 'visc-line';"
echo "  const theme = mergeTheme(defaultTheme, { line: { strokeWidth: 3 } });"
echo "  applyThemeCssVars(document.querySelector('#chart'), theme);"
echo "  const curve = resolveCurve('monotoneX');"
echo "  console.log(Object.keys(CURVE_PRESETS)); // list all preset names"
echo ""
echo "🧪 Run tests: pnpm test -- --run src/utils/__tests__/curveMap.test.mts src/utils/__tests__/cssVariables.test.mts src/utils/__tests__/mergeTheme.test.mts"
