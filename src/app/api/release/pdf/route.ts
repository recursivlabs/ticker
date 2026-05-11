import { NextRequest } from 'next/server';
import {
  buildPdf,
  divider,
  p,
  pdfResponse,
  quote as pdfQuote,
} from '@/lib/pdf-helpers';
import type { PressRelease } from '@/actions/release';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Body = {
  release: PressRelease;
  meta: { ticker: string; companyName: string };
};

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Body;
    const { release, meta } = body;
    if (!release || !meta) return new Response('Missing release or meta', { status: 400 });

    const result = await buildPdf(`${meta.ticker}-press-release.pdf`, (doc) => {
      doc.font('Helvetica-Bold').fontSize(9).fillColor('#0f172a').text(release.dateline.toUpperCase());
      doc.moveDown(0.4);
      doc.font('Helvetica-Bold').fontSize(20).fillColor('#0f172a').text(release.headline);
      if (release.subheadline) {
        doc.moveDown(0.3);
        doc.font('Helvetica-Oblique').fontSize(13).fillColor('#475569').text(release.subheadline);
      }
      doc.moveDown(0.8);
      divider(doc);

      for (const para of release.body) {
        p(doc, para, { color: '#1e293b' });
      }

      pdfQuote(doc, release.quote.text, release.quote.attributedTo);

      if (release.boilerplate) {
        doc.moveDown(0.6);
        divider(doc);
        doc.font('Helvetica-Bold').fontSize(10).fillColor('#0f172a').text(`About ${meta.companyName}`);
        doc.moveDown(0.3);
        p(doc, release.boilerplate, { size: 10, color: '#475569' });
      }

      if (release.forwardLookingStatement) {
        doc.moveDown(0.6);
        p(doc, release.forwardLookingStatement, { italic: true, size: 9, color: '#94a3b8' });
      }
    });

    return pdfResponse(result);
  } catch (err) {
    return new Response(
      `Failed: ${err instanceof Error ? err.message : 'unknown'}`,
      { status: 500 }
    );
  }
}
