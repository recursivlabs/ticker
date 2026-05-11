import { NextRequest } from 'next/server';
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
} from 'docx';
import type { EarningsScript } from '@/actions/script';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Body = {
  script: EarningsScript;
  meta: { ticker: string; companyName: string; quarter: string };
};

type Heading =
  | typeof HeadingLevel.HEADING_1
  | typeof HeadingLevel.HEADING_2
  | typeof HeadingLevel.HEADING_3;

function H(text: string, level: Heading) {
  return new Paragraph({
    heading: level,
    spacing: { before: 240, after: 120 },
    children: [new TextRun({ text, bold: true })],
  });
}

function P(text: string) {
  return new Paragraph({
    spacing: { after: 160 },
    children: [new TextRun({ text })],
  });
}

function Bullet(text: string) {
  return new Paragraph({
    bullet: { level: 0 },
    spacing: { after: 60 },
    children: [new TextRun({ text })],
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Body;
    const { script, meta } = body;
    if (!script || !meta) return new Response('Missing script or meta', { status: 400 });

    const children: Paragraph[] = [
      new Paragraph({
        alignment: AlignmentType.LEFT,
        spacing: { after: 200 },
        children: [
          new TextRun({
            text: `${meta.companyName} (${meta.ticker})`,
            bold: true,
            size: 32,
          }),
        ],
      }),
      new Paragraph({
        spacing: { after: 240 },
        children: [
          new TextRun({
            text: `${meta.quarter} Earnings Call Script · Est. ${script.timing.ceoEstimatedMinutes}min CEO / ${script.timing.cfoEstimatedMinutes}min CFO`,
            italics: true,
            color: '666666',
          }),
        ],
      }),
    ];

    children.push(H('CEO Prepared Remarks', HeadingLevel.HEADING_1));
    for (const s of script.prepared_remarks.ceo) {
      children.push(H(s.section, HeadingLevel.HEADING_3));
      for (const para of s.content.split(/\n+/).filter(Boolean)) {
        children.push(P(para));
      }
    }

    children.push(H('CFO Prepared Remarks', HeadingLevel.HEADING_1));
    for (const s of script.prepared_remarks.cfo) {
      children.push(H(s.section, HeadingLevel.HEADING_3));
      for (const para of s.content.split(/\n+/).filter(Boolean)) {
        children.push(P(para));
      }
    }

    if (script.speakerNotes && script.speakerNotes.length > 0) {
      children.push(H('Speaker Notes', HeadingLevel.HEADING_1));
      for (const n of script.speakerNotes) children.push(Bullet(n));
    }

    const doc = new Document({
      creator: 'Ticker on Recursiv',
      title: `${meta.ticker} ${meta.quarter} Earnings Script`,
      description: `Earnings script for ${meta.companyName} (${meta.ticker}) ${meta.quarter}`,
      styles: { default: { document: { run: { font: 'Georgia', size: 22 } } } },
      sections: [{ children }],
    });

    const buffer = await Packer.toBuffer(doc);
    const safeQuarter = meta.quarter.replace(/[^a-z0-9-]+/gi, '-');
    const filename = `${meta.ticker}-${safeQuarter}-script.docx`;

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
