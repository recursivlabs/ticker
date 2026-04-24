import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background:
            'radial-gradient(circle at 30% 30%, rgba(16, 185, 129, 0.2) 0%, transparent 60%), linear-gradient(135deg, #0a0a0a 0%, #050505 100%)',
        }}
      >
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: 999,
            background: '#10b981',
            boxShadow: '0 0 40px rgba(16, 185, 129, 0.7), 0 0 12px rgba(16, 185, 129, 0.9)',
          }}
        />
      </div>
    ),
    { ...size }
  );
}
