interface IconProps {
  name: string
  size?: number
  className?: string
  style?: React.CSSProperties
}

export default function Icon({ name, size = 20, className = '', style }: IconProps) {
  return (
    <span
      className={`material-symbols-outlined ${className}`}
      style={{ fontSize: size, ...style }}
    >
      {name}
    </span>
  )
}
