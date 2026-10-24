export default function Notifications() {
  return (
    <div style={{ padding: '2rem', maxWidth: 960, margin: '0 auto', fontFamily: 'system-ui, sans-serif' }}>
      <h1>Notifications</h1>
      <p>The backend includes Notification and NotificationPreference models (added in recent main branch). No dedicated notification listing endpoint is exposed in routes. Actual push delivery requires provider configuration (not implemented).</p>
    </div>
  );
}
