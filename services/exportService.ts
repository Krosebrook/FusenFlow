
import { jsPDF } from 'jspdf';
import { Document, Packer, Paragraph, TextRun, AlignmentType } from 'docx';

/**
 * Exports the document content to a PDF file.
 * Uses plain text extraction to ensure a clean, distraction-free document.
 */
export const exportToPDF = (title: string, content: string) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });
  
  const cleanTitle = title || 'FlowState Document';
  
  // Extract clean text from HTML
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = content;
  const plainText = tempDiv.innerText || tempDiv.textContent || "";

  const margin = 20;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const maxWidth = pageWidth - (margin * 2);

  // Set font for title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.text(cleanTitle, margin, 25);
  
  // Draw a separator line
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, 30, pageWidth - margin, 30);
  
  // Content styling
  doc.setFont('times', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(50, 50, 50);
  
  // Wrap and split text for pages
  const splitText = doc.splitTextToSize(plainText, maxWidth);
  
  let y = 40;
  const lineHeight = 7;
  
  splitText.forEach((line: string) => {
    // Check for page overflow
    if (y > pageHeight - margin) {
      doc.addPage();
      y = margin + 10;
    }
    doc.text(line, margin, y);
    y += lineHeight;
  });
  
  // Add page numbers at the end
  const pageCount = (doc as any).internal.getNumberOfPages();
  for(let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.text(`Page ${i} of ${pageCount}`, pageWidth - margin - 20, pageHeight - 10);
  }
  
  doc.save(`${cleanTitle.toLowerCase().replace(/\s+/g, '_')}.pdf`);
};

/**
 * Exports to a Word Document with basic styling.
 */
export const exportToDocx = async (title: string, content: string) => {
  const cleanTitle = title || 'FlowState Document';
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = content;
  const lines = tempDiv.innerText.split('\n').filter(l => l.trim().length > 0);

  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        new Paragraph({
          children: [new TextRun({ text: cleanTitle, bold: true, size: 32 })],
          alignment: AlignmentType.CENTER,
          spacing: { after: 400 }
        }),
        ...lines.map(line => new Paragraph({
          children: [new TextRun({ text: line, size: 24 })],
          spacing: { before: 200, after: 200 },
          alignment: AlignmentType.LEFT
        }))
      ],
    }],
  });

  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${cleanTitle.toLowerCase().replace(/\s+/g, '_')}.docx`;
  link.click();
  URL.revokeObjectURL(url);
};

export const exportToMarkdown = (title: string, content: string) => {
  const cleanTitle = title || 'FlowState Document';
  let md = content
    .replace(/<h1>(.*?)<\/h1>/gi, '# $1\n\n')
    .replace(/<h2>(.*?)<\/h2>/gi, '## $1\n\n')
    .replace(/<p>(.*?)<\/p>/gi, '$1\n\n')
    .replace(/<strong>(.*?)<\/strong>/gi, '**$1**')
    .replace(/<em>(.*?)<\/em>/gi, '_$1_')
    .replace(/<ul>/gi, '\n')
    .replace(/<\/ul>/gi, '\n')
    .replace(/<li>(.*?)<\/li>/gi, '* $1\n');

  md = md.replace(/<[^>]*>?/gm, '');
  const finalMd = `# ${cleanTitle}\n\n${md.trim()}`;
  const blob = new Blob([finalMd], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${cleanTitle.toLowerCase().replace(/\s+/g, '_')}.md`;
  link.click();
  URL.revokeObjectURL(url);
};
