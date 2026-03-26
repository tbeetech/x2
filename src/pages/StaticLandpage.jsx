export function StaticLandpage() {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#0a1628',
      }}
    >
      <iframe
        src="/landpage/index.html"
        title="XFA Company Homepage"
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

export default StaticLandpage
