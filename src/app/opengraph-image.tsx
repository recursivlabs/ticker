import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Ticker. The AI workspace for Investor Relations.';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          background:
            'radial-gradient(circle at 30% 20%, rgba(16, 185, 129, 0.15) 0%, transparent 60%), radial-gradient(circle at 70% 80%, rgba(16, 185, 129, 0.08) 0%, transparent 50%), linear-gradient(135deg, #050505 0%, #0a0a0a 50%, #0f0f0f 100%)',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          position: 'relative',
        }}
      >
        {/* subtle horizontal rule top */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 1,
            background: 'linear-gradient(90deg, transparent 0%, #1f1f1f 30%, #1f1f1f 70%, transparent 100%)',
          }}
        />

        {/* Top small label */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            marginBottom: 40,
            color: '#737373',
            fontSize: 20,
            letterSpacing: 4,
            textTransform: 'uppercase',
            fontWeight: 500,
          }}
        >
          The AI workspace for Investor Relations
        </div>

        {/* Main wordmark */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 28,
          }}
        >
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 999,
              background: '#10b981',
              boxShadow: '0 0 60px rgba(16, 185, 129, 0.6), 0 0 20px rgba(16, 185, 129, 0.8)',
            }}
          />
          <div
            style={{
              color: '#fafafa',
              fontSize: 200,
              fontWeight: 600,
              letterSpacing: -6,
              lineHeight: 1,
            }}
          >
            Ticker
          </div>
        </div>

        {/* Bottom meta strip */}
        <div
          style={{
            position: 'absolute',
            bottom: 48,
            left: 60,
            right: 60,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            color: '#525252',
            fontSize: 22,
            fontFamily: 'ui-monospace, monospace',
          }}
        >
          <div>ticker.on.recursiv.io</div>
          <div style={{ display: 'flex', gap: 20 }}>
            <span>EDGAR</span>
            <span style={{ color: '#262626' }}>·</span>
            <span>FactSet-ready</span>
            <span style={{ color: '#262626' }}>·</span>
            <span>Built on Recursiv</span>
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
