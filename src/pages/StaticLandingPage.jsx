export function StaticLandingPage() {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#0a1628',
      }}
    >
      <iframe
        src="/landpage/index.html"
        title="XFA Landing Page"
        sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-top-navigation-by-user-activation"
        style={{
          width: '100%',
          minHeight: '100vh',
          border: 'none',
        }}
        loading="lazy"
      />
    </div>
  )
}

export default StaticLandingPage
