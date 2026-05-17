import TopBar from '@/components/civic/TopBar'
import LandingContent from './_components/LandingContent'

export default function Home() {
  return (
    <div style={{ background: '#070708', minHeight: '100vh', color: '#d2d2d6' }}>
      <TopBar authMode="public" />
      <LandingContent />
    </div>
  )
}
