import { jsPDF } from 'jspdf';
import { LessonData } from '../types';
import { generateKeyframeImages } from '../components/InteractiveCanvas';

export interface PdfExportOptions {
  includeKeyframes: boolean;
  includeDerivationSteps: boolean;
  includeSympyRules: boolean;
  includeCitations: boolean;
  includeManimCode: boolean;
  simParams?: Record<string, any>;
}

export async function exportLessonToPdf(
  lesson: LessonData,
  options: PdfExportOptions = {
    includeKeyframes: true,
    includeDerivationSteps: true,
    includeSympyRules: true,
    includeCitations: true,
    includeManimCode: true,
  }
): Promise<Blob> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;

  let currentY = margin;

  // Helper to add page when space runs out
  const checkPageBreak = (neededHeight: number) => {
    if (currentY + neededHeight > pageHeight - 16) {
      doc.addPage();
      currentY = margin;
      drawPageHeader();
    }
  };

  const drawPageHeader = () => {
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(0, 0, pageWidth, 10, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(56, 189, 248); // cyan-400
    doc.text('SYNAPSE-AI STEM SUMMARY DOCUMENT', margin, 7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184); // slate-400
    doc.text(lesson.title, pageWidth - margin, 7, { align: 'right' });
    currentY = Math.max(currentY, 16);
  };

  // --- PAGE 1: HEADER & OVERVIEW ---
  // Top Banner
  doc.setFillColor(11, 15, 25);
  doc.roundedRect(margin, currentY, contentWidth, 38, 3, 3, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.text('SYNAPSE-AI', margin + 6, currentY + 10);
  doc.setFontSize(10);
  doc.setTextColor(56, 189, 248);
  doc.text('AUTONOMOUS STEM LESSON & VERIFICATION SUMMARY', margin + 46, currentY + 10);

  // Lesson Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(255, 255, 255);
  const titleLines = doc.splitTextToSize(lesson.title, contentWidth - 12);
  doc.text(titleLines, margin + 6, currentY + 20);

  // Metadata pills
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  const metaText = `Category: ${lesson.category}  |  Bloom Level: ${lesson.bloomLevel}  |  Duration: ${lesson.duration}s  |  SymPy: Sound`;
  doc.text(metaText, margin + 6, currentY + 32);

  currentY += 44;

  // Primary Equation Box
  doc.setFillColor(15, 23, 42);
  doc.setDrawColor(56, 189, 248);
  doc.roundedRect(margin, currentY, contentWidth, 22, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(56, 189, 248);
  doc.text('PRIMARY GOVERNING FORMULATION (LaTeX):', margin + 4, currentY + 6);

  doc.setFont('courier', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(250, 204, 21); // yellow
  const formulaLines = doc.splitTextToSize(lesson.primaryEquation, contentWidth - 8);
  doc.text(formulaLines, margin + 4, currentY + 14);

  currentY += 28;

  // Description
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(51, 65, 85);
  const descLines = doc.splitTextToSize(lesson.description, contentWidth);
  doc.text(descLines, margin, currentY);
  currentY += descLines.length * 4.5 + 4;

  // --- SECTION 1: ANIMATION KEYFRAMES GALLERY ---
  if (options.includeKeyframes) {
    checkPageBreak(50);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text('1. Synchronized Visual Keyframes (Manim CE Animation)', margin, currentY);
    currentY += 6;

    // Generate keyframe screenshots
    const keyframes = generateKeyframeImages(lesson, options.simParams || {});

    // Render 2 keyframes per row
    const imgWidth = (contentWidth - 6) / 2;
    const imgHeight = (imgWidth * 9) / 16;

    for (let i = 0; i < keyframes.length; i += 2) {
      checkPageBreak(imgHeight + 22);

      // Frame A
      const kfA = keyframes[i];
      doc.addImage(kfA.dataUrl, 'JPEG', margin, currentY, imgWidth, imgHeight);

      // Frame A Caption Box
      doc.setFillColor(241, 245, 249);
      doc.rect(margin, currentY + imgHeight, imgWidth, 14, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(15, 23, 42);
      doc.text(`Step ${kfA.stepNumber}: ${kfA.label} (t=${kfA.timestamp}s)`, margin + 2, currentY + imgHeight + 4.5);
      doc.setFont('courier', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(71, 85, 105);
      const kfALatex = doc.splitTextToSize(kfA.latex, imgWidth - 4);
      doc.text(kfALatex[0] || '', margin + 2, currentY + imgHeight + 9.5);

      // Frame B if exists
      if (i + 1 < keyframes.length) {
        const kfB = keyframes[i + 1];
        const rightX = margin + imgWidth + 6;
        doc.addImage(kfB.dataUrl, 'JPEG', rightX, currentY, imgWidth, imgHeight);

        doc.setFillColor(241, 245, 249);
        doc.rect(rightX, currentY + imgHeight, imgWidth, 14, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(15, 23, 42);
        doc.text(`Step ${kfB.stepNumber}: ${kfB.label} (t=${kfB.timestamp}s)`, rightX + 2, currentY + imgHeight + 4.5);
        doc.setFont('courier', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(71, 85, 105);
        const kfBLatex = doc.splitTextToSize(kfB.latex, imgWidth - 4);
        doc.text(kfBLatex[0] || '', rightX + 2, currentY + imgHeight + 9.5);
      }

      currentY += imgHeight + 18;
    }
  }

  // --- SECTION 2: MATHEMATICAL DERIVATION & SYMPY PROOFS ---
  if (options.includeDerivationSteps) {
    checkPageBreak(30);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text('2. Step-by-Step Mathematical Derivation & Proofs', margin, currentY);
    currentY += 6;

    lesson.steps.forEach((st) => {
      checkPageBreak(28);

      // Step container card
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(margin, currentY, contentWidth, 24, 2, 2, 'FD');

      // Step header pill
      doc.setFillColor(15, 23, 42);
      doc.circle(margin + 4.5, currentY + 5, 3.2, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(255, 255, 255);
      doc.text(st.stepNumber.toString(), margin + 3.3, currentY + 6.2);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(15, 23, 42);
      doc.text(st.label, margin + 10, currentY + 6);

      // Timestamp tag
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139);
      doc.text(`Timeline: t = ${st.timestampStart}s`, margin + contentWidth - 4, currentY + 6, { align: 'right' });

      // Equation
      doc.setFont('courier', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(30, 41, 59);
      const eqSnippet = doc.splitTextToSize(st.latex, contentWidth - 14);
      doc.text(eqSnippet, margin + 4, currentY + 12);

      // Explanation
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(71, 85, 105);
      const expSnippet = doc.splitTextToSize(st.explanation, contentWidth - 14);
      doc.text(expSnippet, margin + 4, currentY + 17);

      // SymPy validation badge
      if (options.includeSympyRules) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7);
        doc.setTextColor(16, 185, 129); // emerald-500
        doc.text(`[SymPy Verified: ${st.sympyRule}]`, margin + 4, currentY + 22);
      }

      currentY += 27;
    });
  }

  // --- SECTION 3: GROUNDED TEXTBOOK CITATIONS ---
  if (options.includeCitations && lesson.citations.length > 0) {
    checkPageBreak(30);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text('3. Grounded Textbook & Research Paper Citations', margin, currentY);
    currentY += 6;

    lesson.citations.forEach((cit) => {
      checkPageBreak(24);

      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(margin, currentY, contentWidth, 20, 2, 2, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(15, 23, 42);
      doc.text(cit.bookTitle, margin + 4, currentY + 5.5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(2, 132, 199);
      doc.text(`${cit.section}, Page ${cit.pageNumber}  |  Relevance: ${(cit.relevanceScore * 100).toFixed(0)}%`, margin + 4, currentY + 10);

      doc.setFont('helvetica', 'italic');
      doc.setFontSize(7);
      doc.setTextColor(71, 85, 105);
      const quoteLines = doc.splitTextToSize(`"${cit.excerpt}"`, contentWidth - 8);
      doc.text(quoteLines, margin + 4, currentY + 15);

      currentY += 23;
    });
  }

  // --- SECTION 4: MANIM CE PYTHON SOURCE CODE ---
  if (options.includeManimCode) {
    checkPageBreak(40);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text('4. Manim Community Edition Python Script (v0.18.1)', margin, currentY);
    currentY += 6;

    const codeSnippet = lesson.manimPythonCode.trim().split('\n').slice(0, 32).join('\n');
    const codeLines = doc.splitTextToSize(codeSnippet, contentWidth - 8);
    const boxHeight = Math.min(65, codeLines.length * 3.5 + 8);

    doc.setFillColor(11, 15, 25);
    doc.roundedRect(margin, currentY, contentWidth, boxHeight, 2, 2, 'F');

    doc.setFont('courier', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(226, 232, 240);
    doc.text(codeLines.slice(0, 18), margin + 4, currentY + 5.5);

    currentY += boxHeight + 8;
  }

  // Draw Page Number Footers on All Pages
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Page ${p} of ${totalPages}  |  SynapseAI Autonomous STEM Video & SymPy Engine  |  Generated for user satyapraveen2006@gmail.com`,
      margin,
      pageHeight - 6
    );
  }

  // Return generated Blob and save
  const blob = doc.output('blob');
  doc.save(`${lesson.id}-summary.pdf`);
  return blob;
}
