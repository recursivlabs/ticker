// Helpers for building IR-document PDFs with pdfkit. The pattern is:
// instantiate a PDFDocument, write content with the helpers, await
// closing into a Buffer, return as a Response.

import PDFDocument from 'pdfkit';

export type PdfBuildResult = {
  buffer: Buffer;
  filename: string;
};

export async function buildPdf(
  filename: string,
  build: (doc: InstanceType<typeof PDFDocument>) => void
): Promise<PdfBuildResult> {
  const doc = new PDFDocument({
    size: 'LETTER',
    margins: { top: 64, bottom: 64, left: 72, right: 72 },
    info: {
      Creator: 'Ticker on Recursiv',
      Producer: 'Ticker on Recursiv',
    },
  });

  const chunks: Buffer[] = [];
  doc.on('data', (chunk: Buffer) => chunks.push(chunk));
  const done = new Promise<void>((resolve) => doc.on('end', () => resolve()));

  build(doc);

  doc.end();
  await done;

  return { buffer: Buffer.concat(chunks), filename };
}

export function pdfResponse(result: PdfBuildResult): Response {
  return new Response(new Uint8Array(result.buffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${result.filename}"`,
    },
  });
}

export function h1(doc: InstanceType<typeof PDFDocument>, text: string) {
  doc.moveDown(0.5);
  doc.font('Helvetica-Bold').fontSize(18).fillColor('#0f172a').text(text);
  doc.moveDown(0.3);
}

export function h2(doc: InstanceType<typeof PDFDocument>, text: string) {
  doc.moveDown(0.4);
  doc.font('Helvetica-Bold').fontSize(13).fillColor('#0f172a').text(text);
  doc.moveDown(0.2);
}

export function h3(doc: InstanceType<typeof PDFDocument>, text: string) {
  doc.moveDown(0.3);
  doc.font('Helvetica-Bold').fontSize(11).fillColor('#047857').text(text);
  doc.moveDown(0.15);
}

export function p(
  doc: InstanceType<typeof PDFDocument>,
  text: string,
  opts: { italic?: boolean; color?: string; size?: number } = {}
) {
  const font = opts.italic ? 'Helvetica-Oblique' : 'Helvetica';
  doc
    .font(font)
    .fontSize(opts.size ?? 11)
    .fillColor(opts.color ?? '#334155')
    .text(text, { paragraphGap: 6, lineGap: 2 });
}

export function bullet(doc: InstanceType<typeof PDFDocument>, text: string) {
  doc
    .font('Helvetica')
    .fontSize(11)
    .fillColor('#334155')
    .text(`• ${text}`, {
      indent: 12,
      paragraphGap: 3,
      lineGap: 2,
    });
}

export function quote(
  doc: InstanceType<typeof PDFDocument>,
  text: string,
  attribution: string
) {
  doc.moveDown(0.4);
  doc
    .font('Helvetica-Oblique')
    .fontSize(11)
    .fillColor('#475569')
    .text(`"${text}"`, { indent: 24, paragraphGap: 4 });
  doc
    .font('Helvetica-Bold')
    .fontSize(10)
    .fillColor('#334155')
    .text(attribution, { indent: 24 });
  doc.moveDown(0.4);
}

export function divider(doc: InstanceType<typeof PDFDocument>) {
  const y = doc.y + 4;
  doc
    .strokeColor('#e2e8f0')
    .lineWidth(0.5)
    .moveTo(doc.page.margins.left, y)
    .lineTo(doc.page.width - doc.page.margins.right, y)
    .stroke();
  doc.moveDown(0.6);
}

export function footer(doc: InstanceType<typeof PDFDocument>, text: string) {
  doc.moveDown(1);
  divider(doc);
  doc
    .font('Helvetica')
    .fontSize(8)
    .fillColor('#94a3b8')
    .text(text, { align: 'left' });
}
