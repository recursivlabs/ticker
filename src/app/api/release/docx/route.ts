import { NextRequest } from 'next/server';
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  AlignmentType,
} from 'docx';
import type { PressRelease } from '@/actions/release';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Body = {
  release: PressRelease;
  meta: { ticker: string; companyName: string };
};

function P(text: string, opts: { italic?: boolean; bold?: boolean; size?: number; color?: string } = {}) {
  return new Paragraph({
    spacing: { after: 200 },
    children: [
      new TextRun({
        text,
        italics: opts.italic,
        bold: opts.bold,
        size: opts.size,
        color: opts.color,
      }),
    ],
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Body;
    const { release, meta } = body;
    if (!release || !meta) return new Response('Missing release or meta', { status: 400 });

    const children: Paragraph[] = [
      new Paragraph({
        alignment: AlignmentType.LEFT,
        spacing: { after: 200 },
        children: [new TextRun({ text: release.dateline, bold: true, size: 20 })],
      }),
      new Paragraph({
        spacing: { after: 200 },
        children: [new TextRun({ text: release.headline, bold: true, size: 36 })],
      }),
    ];

    if (release.subheadline) {
      children.push(P(release.subheadline, { italic: true }));
    }

    for (const p of release.body) {
      children.push(P(p));
    }

    children.push(
      new Paragraph({
        spacing: { before: 200, after: 200 },
        indent: { left: 360 },
        children: [
          new TextRun({ text: `"${release.quote.text}" `, italics: true }),
          new TextRun({ text: release.quote.attributedTo, bold: true }),
        ],
      })
    );

    if (release.boilerplate) {
      children.push(
        new Paragraph({
          spacing: { before: 400, after: 120 },
          children: [
            new TextRun({ text: `About ${meta.companyName}`, bold: true }),
          ],
        })
      );
      children.push(P(release.boilerplate));
    }

    if (release.forwardLookingStatement) {
      children.push(
        new Paragraph({
          spacing: { before: 200 },
          children: [
            new TextRun({
              text: release.forwardLookingStatement,
              italics: true,
              size: 18,
              color: '888888',
            }),
          ],
        })
      );
    }

    const doc = new Document({
      creator: 'Ticker on Recursiv',
      title: `${meta.ticker} Press Release`,
      description: `Press release for ${meta.companyName} (${meta.ticker})`,
      styles: { default: { document: { run: { font: 'Georgia', size: 22 } } } },
      sections: [{ children }],
    });

    const buffer = await Packer.toBuffer(doc);
    const filename = `${meta.ticker}-press-release.docx`;

    return new Response(new Uint8Array(buffer), {
      headers: {
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    return new Response(
      `Failed: ${err instanceof Error ? err.message : 'unknown error'}`,
      { status: 500 }
    );
  }
}
