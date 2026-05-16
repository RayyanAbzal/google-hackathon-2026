import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Bell,
  Camera,
  CheckCircle2,
  ClipboardCheck,
  Copy,
  FolderOpen,
  Handshake,
  Home,
  LogIn,
  LogOut,
  MapPin,
  Plus,
  QrCode,
  Search,
  SearchCheck,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  UserPlus,
  UserX,
  X,
  type LucideIcon,
} from 'lucide-react'

interface IconProps {
  name: string
  size?: number
  className?: string
  style?: React.CSSProperties
}

const ICONS: Record<string, LucideIcon> = {
  add: Plus,
  arrow_back: ArrowLeft,
  arrow_forward: ArrowRight,
  check_circle: CheckCircle2,
  close: X,
  cloud_upload: FolderOpen,
  content_copy: Copy,
  dashboard: Home,
  fact_check: ClipboardCheck,
  folder_open: FolderOpen,
  handshake: Handshake,
  location_on: MapPin,
  login: LogIn,
  logout: LogOut,
  notifications: Bell,
  person_add: UserPlus,
  person_alert: UserX,
  person_check: UserCheck,
  person_search: SearchCheck,
  photo_camera: Camera,
  qr_code_2: QrCode,
  report: ShieldAlert,
  search: Search,
  verified: ShieldCheck,
  warning: AlertTriangle,
}

export default function Icon({ name, size = 20, className = '', style }: IconProps) {
  const Lucide = ICONS[name]
  if (Lucide) {
    return <Lucide aria-hidden="true" className={className} size={size} style={style} />
  }

  return (
    <span
      className={`material-symbols-outlined ${className}`}
      aria-hidden="true"
      style={{
        fontSize: size,
        width: size,
        height: size,
        overflow: 'hidden',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        ...style,
      }}
    >
      {name}
    </span>
  )
}
