'use client'

export default function Page() {
  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: 40 }}>
      <h1>G-Access</h1>
      <p>Minimal Gemini API Proxy</p>
      
      <h2>Usage</h2>
      <pre style={{ background: '#f5f5f5', padding: 16, borderRadius: 8, overflow: 'auto' }}>
{`curl -X POST https://your-project.vercel.app/api/gemini \\
  -H "Authorization: Bearer \$PROXY_SECRET_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"prompt": "Hello!"}'`}
      </pre>
      
      <h2>Environment Variables</h2>
      <ul>
        <li><code>GEMINI_API_KEY</code> - Your Gemini API Key</li>
        <li><code>PROXY_SECRET_TOKEN</code> - Secret token for authentication</li>
      </ul>
    </div>
  )
}
