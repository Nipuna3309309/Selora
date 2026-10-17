const PATHS = {
  shirt: 'M8.5 3 3 6l2 4.2 2-.9V20h10V9.3l2 .9L21 6l-5.5-3a3.6 3.6 0 0 1-7 0Z',
  receipt: 'M6 3h12v18l-3-2-3 2-3-2-3 2V3Zm3 5h6m-6 4h6',
  bell: 'M6 17V11a6 6 0 1 1 12 0v6l1.5 2h-15L6 17Zm4 4h4',
  gauge: 'M4 18a8 8 0 1 1 16 0M12 18l4-6',
  search: 'm20 20-4.2-4.2M10.5 17a6.5 6.5 0 1 1 0-13 6.5 6.5 0 0 1 0 13Z',
  check: 'm5 12.5 4.5 4.5L19 7.5',
  plus: 'M12 5v14M5 12h14',
  minus: 'M5 12h14',
  close: 'M6 6l12 12M18 6 6 18',
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
