/**
 * The standards behind each check, with links, so that every threshold in a report can be traced back
 * to the text that defines it.
 */

export type CriterionId = 'wcag-1.4.3' | 'wcag-1.4.6' | 'wcag-1.4.11' | 'wcag-1.4.1' | 'ciede2000';

export type Criterion = {
  id: CriterionId;
  title: string;
  url: string;
};

export const CRITERIA: Readonly<Record<CriterionId, Criterion>> = {
  'wcag-1.4.1': {
    id: 'wcag-1.4.1',
    title: 'WCAG 2.2 Success Criterion 1.4.1 Use of Color (Level A)',
    url: 'https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html',
  },
  'wcag-1.4.3': {
    id: 'wcag-1.4.3',
    title: 'WCAG 2.2 Success Criterion 1.4.3 Contrast (Minimum) (Level AA)',
    url: 'https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html',
  },
  'wcag-1.4.6': {
    id: 'wcag-1.4.6',
    title: 'WCAG 2.2 Success Criterion 1.4.6 Contrast (Enhanced) (Level AAA)',
    url: 'https://www.w3.org/WAI/WCAG22/Understanding/contrast-enhanced.html',
  },
  'wcag-1.4.11': {
    id: 'wcag-1.4.11',
    title: 'WCAG 2.2 Success Criterion 1.4.11 Non-text Contrast (Level AA)',
    url: 'https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html',
  },
  ciede2000: {
    id: 'ciede2000',
    title: 'CIEDE2000 color difference (ISO/CIE 11664-6), no pass or fail threshold defined',
    url: 'https://hajim.rochester.edu/ece/sites/gsharma/ciede2000/',
  },
};

/**
 * Contrast ratios that WCAG 2.2 defines. Pick the one that matches your text size and target level.
 * "Large" text is at least 18pt, or 14pt bold.
 * @see {@link https://www.w3.org/TR/WCAG22/#dfn-large-scale}
 */
export const WCAG_CONTRAST = {
  /** SC 1.4.3, level AA, normal text */
  text: 4.5,
  /** SC 1.4.3, level AA, large text */
  largeText: 3,
  /** SC 1.4.6, level AAA, normal text */
  enhancedText: 7,
  /** SC 1.4.6, level AAA, large text */
  enhancedLargeText: 4.5,
  /** SC 1.4.11, level AA, graphical objects */
  nonText: 3,
} as const;
