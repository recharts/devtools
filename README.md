# @recharts/devtools

> **This package is entirely optional.** Recharts works perfectly fine without it. `@recharts/devtools` provides quality of life improvements and development tools to help you build and debug Recharts-based applications more efficiently.

Devtools for Recharts.

[![npm version](https://badge.fury.io/js/@recharts%2Fdevtools.svg)](https://badge.fury.io/js/@recharts%2Fdevtools)

## Installation

```bash
npm install @recharts/devtools --save-dev
```

## Usage

### Basic Usage

Import the `RechartsDevtools` component and render it inside of your chart.

Add a div with specific ID where the devtools will render a portal.

```tsx
import { RechartsDevtools, RECHARTS_DEVTOOLS_PORTAL_ID } from '@recharts/devtools';
import { AreaChart } from 'recharts';

function App() {
  return (
    <article>
      <AreaChart>
        {/* The DevTools component reads state from inside of the chart */}
        <RechartsDevtools />
      </AreaChart>
        {/* The Portal component renders the devtools UI, debugging information, hooks and other stuff */}
      <div id={RECHARTS_DEVTOOLS_PORTAL_ID} />
    </article>
  );
}
```

### Multiple Instances (Context Mode)

If you have multiple charts or devtools instances on the same page (e.g., in a documentation site with live editors), you should use the `RechartsDevtoolsContext` and `RechartsDevtoolsPortal` to ensure each devtools instance targets the correct location without ID conflicts.

1. Wrap your chart and editor/devtools area with `RechartsDevtoolsContext`. One context for one devtools.
2. Place `RechartsDevtoolsPortal` where you want the devtools UI to be rendered.
3. `RechartsDevtools` will automatically detect the context and render into the associated portal.

```tsx
import { RechartsDevtools, RechartsDevtoolsContext, RechartsDevtoolsPortal } from '@recharts/devtools';
import { AreaChart, LineChart } from 'recharts';

function EditorWithPreview() {
  return (
    <RechartsDevtoolsContext>
        <AreaChart>
          <RechartsDevtools />
        </AreaChart>
        <RechartsDevtoolsPortal />
    </RechartsDevtoolsContext>
      
    <RechartsDevtoolsContext>
        <LineChart>
          <RechartsDevtools />
        </LineChart>
        <RechartsDevtoolsPortal />
    </RechartsDevtoolsContext>
  );
}
```

## Theme accessibility checks

`@recharts/devtools/theme` measures how readable the colors of a Recharts theme are. It takes your `RechartsTheme` object as it is. Nothing from React or Recharts runs: the theme is plain data, and Recharts only provides its type (Recharts 3.11.0-canary.6 or newer: earlier versions don't have the full `RechartsTheme` type). All the color math comes from [culori](https://culorijs.org/).

For the theme's `pageBackground` (or any backgrounds you pass), and for typical vision plus simulated protanopia, deuteranopia and tritanopia, it checks:

| Check | What it measures | Default threshold |
|---|---|---|
| `seriesOnBackground` | each series fill and stroke against the page | 3:1, [WCAG 2.2 SC 1.4.11](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html) |
| `seriesVsSeries` | CIEDE2000 difference between every pair of series | none, you choose |
| `seriesContrast` | WCAG contrast between every pair, for touching marks like pie slices | none, you choose |
| `textOnBackground` | `typography.color` on the page | 4.5:1, [WCAG 2.2 SC 1.4.3](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html) |
| `seriesAsText` | a series color used for label text on the page | 4.5:1, SC 1.4.3 |
| `textOnSeries` | `typography.color` on each series fill | 4.5:1, SC 1.4.3 |

A failed check usually comes with a fix: the nearest lighter or darker color, with the same hue, that would pass. `fix` is `null` when no lightness passes.

```ts
import { analyzeTheme, themeFailures } from '@recharts/devtools/theme';
import { myTheme } from './myTheme';

test('my theme is readable', () => {
  const report = analyzeTheme(myTheme, {
    thresholds: { seriesDifference: 10, seriesDifferenceCvd: 2 },
    checks: { textOnSeries: false },
  });
  expect(themeFailures(report)).toEqual([]);
});
```

The guide at https://recharts.github.io/en-US/guide/theme-color-testing/ explains each check and links the standards behind it.

The package is ESM only.
