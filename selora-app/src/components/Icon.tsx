const PATHS = {
  shirt: 'M8.5 3 3 6l2 4.2 2-.9V20h10V9.3l2 .9L21 6l-5.5-3a3.6 3.6 0 0 1-7 0Z',
  cart: 'M3 4h2.5l2.2 11h10.6l2-8H6.4M10 20h.01M17 20h.01',
  receipt: 'M6 3h12v18l-3-2-3 2-3-2-3 2V3Zm3 5h6m-6 4h6',
  bell: 'M6 17V11a6 6 0 1 1 12 0v6l1.5 2h-15L6 17Zm4 4h4',
  gauge: 'M4 18a8 8 0 1 1 16 0M12 18l4-6',
  search: 'm20 20-4.2-4.2M10.5 17a6.5 6.5 0 1 1 0-13 6.5 6.5 0 0 1 0 13Z',
  check: 'm5 12.5 4.5 4.5L19 7.5',
  plus: 'M12 5v14M5 12h14',
  minus: 'M5 12h14',
  close: 'M6 6l12 12M18 6 6 18',
  menu: 'M4 7h16M4 12h16M4 17h16',
  logout: 'M9 20H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h4m7 12 4-4-4-4m4 4H9',
  download: 'M12 4v11m-5-5 5 5 5-5M5 20h14',
  image: 'M4 5h16v14H4V5Zm0 11 4.5-4.5 4 4 2.5-2.5L20 18M15.5 9.5h.01',
  sun: 'M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm0-14v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4',
  moon: 'M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5Z',
  monitor: 'M3 5h18v11H3V5Zm6 15h6m-3-4v4',
  dashboard: 'M4 4h7v9H4V4Zm9 0h7v5h-7V4Zm0 7h7v9h-7v-9ZM4 15h7v5H4v-5Z',
  tag: 'M3 12V4h8l9 9-8 8-9-9Zm5-4.5h.01',
  percent: 'M19 5 5 19M7 9.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Zm10 10a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z',
  coins:'M12 4c4.4 0 8 1.3 8 3s-3.6 3-8 3-8-1.3-8-3 3.6-3 8-3Zm-8 3v5c0 1.7 3.6 3 8 3s8-1.3 8-3V7M4 12v5c0 1.7 3.6 3 8 3s8-1.3 8-3v-5',
  list: 'M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01',
  chart: 'M4 20V10m6 10V4m6 16v-7m4 7H3',
  alert: 'M12 4 2.5 20h19L12 4Zm0 6v4.5m0 3h.01',
  info: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-10v6m0-9h.01',
  arrow: 'M5 12h14m-5-5 5 5-5 5',
  table: 'M4 5h16v14H4V5Zm0 5h16M4 14.5h16M10 5v14',
  send: 'M21 3 3 10.5l7.5 3L21 3Zm0 0-7.5 18-3-7.5',
  play: 'M8 5.5v13l10.5-6.5L8 5.5Z',
  pause: 'M8.5 5v14M15.5 5v14',
  truck: 'M3 6h11v10H3V6Zm11 4h4l3 3v3h-7M7 19.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Zm10 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z',
} as const

export type IconName = keyof typeof PATHS

export function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d={PATHS[name]} />
    </svg>
  )
}
