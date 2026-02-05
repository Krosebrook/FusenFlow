
import { jsPDF } from 'jspdf';
import { Document, Packer, Paragraph, TextRun } from 'docx';

export const exportToPDF = (title: string, content: string) => {
  const doc = new jsPDF();
  const cleanTitle = title || 'Untitled';
  
  // Strip HTML for basic PDF export
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = content;
  const plainText = tempDiv.innerText || tempDiv.textContent || "";

  doc.setFontSize(20);
  doc.text(cleanTitle, 10, 20);
  doc.setFontSize(12);
  
  const splitText = doc.splitTextToSize(plainText, 180);
  doc.text(splitText, 10, 35);
  
  doc.save(`${cleanTitle.toLowerCase().replace(/\s+/g, '_')}.pdf`);
};

export const exportToDocx = async (title: string, content: string) => {
  const cleanTitle = title || 'Untitled';
  
  // Basic HTML to DOCX conversion
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = content;
  const lines = tempDiv.innerText.split('\n');

  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        new Paragraph({
          children: [new TextRun({ text: cleanTitle, bold: true, size: 32 })],
        }),
        ...lines.map(line => new Paragraph({
          children: [new TextRun(line)],
          spacing: { before: 200 }
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
  const cleanTitle = title || 'Untitled';
  // Simple HTML to MD fallback
  let md = content
    .replace(/<h1>(.*?)<\/h1>/gi, '# $1\n')
    .replace(/<h2>(.*?)<\/h2>/gi, '## $1\n')
    .replace(/<p>(.*?)<\/p>/gi, '$1\n\n')
    .replace(/<strong>(.*?)<\/strong>/gi, '**$1**')
    .replace(/<em>(.*?)<\/em>/gi, '_$1_')
    .replace(/<br\s*\/?>/gi, '\n');

  const blob = new Blob([md], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${cleanTitle.toLowerCase().replace(/\s+/g, '_')}.md`;
  link.click();
  URL.revokeObjectURL(url);
};
