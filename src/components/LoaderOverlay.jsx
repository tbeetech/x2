export function LoaderOverlay({ show, label = "Loading..." }) {
  if (!show) {
    return null;
  }

  return (
    <div className="loader-overlay">
      <div className="loader-card">
        <div className="loader-spinner">
          <span style={{ animationDelay: "0s" }} />
          <span style={{ animationDelay: "0.15s" }} />
          <span style={{ animationDelay: "0.3s" }} />
        </div>
        <p className="loader-label">{label}</p>
      </div>
    </div>
  );
}

export function InlineLoader({ label = "Loading..." }) {
  return (
    <div className="loader-inline">
      <div className="loader-inline-spinner">
        <span style={{ animationDelay: "0s" }} />
        <span style={{ animationDelay: "0.15s" }} />
        <span style={{ animationDelay: "0.3s" }} />
      </div>
      <span className="loader-inline-label">{label}</span>
    </div>
  );
}
