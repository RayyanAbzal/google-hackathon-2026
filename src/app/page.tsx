import TopBar from '@/components/civic/TopBar'
import LandingContent from './_components/LandingContent'

export default function Home() {
  return (
    <div style={{ background: '#10141a', minHeight: '100vh', color: '#dfe2eb' }}>
      <TopBar authMode="public" />
      <LandingContent />
    </div>
  )
}
