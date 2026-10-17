import { Icon } from './Icon'

export function Stepper({
  value,
  min = 1,
  max,
  onChange,
  label,
  disabled,
}: {
  value: number
  min?: number
  max: number
  onChange: (n: number) => void
  label: string
  disabled?: boolean
}) {
  return (
    <div className="stepper" role="group" aria-label={label}>
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={disabled || value <= min}
        aria-label="One fewer"
      >
        <Icon name="minus" size={16} />
      </button>
      <output aria-live="polite" key={value}>
        {value}
      </output>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={disabled || value >= max}
        aria-label="One more"
      >
        <Icon name="plus" size={16} />
      </button>
    </div>
  )
}
