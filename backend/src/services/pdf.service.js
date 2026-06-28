const PDFDocument = require('pdfkit');

/**
 * Generates a study guide PDF from lecture materials.
 * @param {Object} data - Contains lecture, notes, flashcards, and MCQs.
 * @param {Object} res - Express response stream.
 */
const generateStudyPDF = (data, res) => {
  const { lecture, notes, flashcards, mcqs, options = { theme: 'classic' } } = data;
  
  const doc = new PDFDocument({
    margin: 50,
    size: 'A4'
  });

  // Pipe the PDF document to the Express response
  doc.pipe(res);

  // Set theme colors based on query options
  const theme = options.theme ? options.theme.toLowerCase() : 'classic';
  
  let pageBgColor = '#F6F6FA'; // for title page
  let contentBgColor = '#FFFFFF'; // for content pages
  let primaryColor = '#13005A';
  let secondaryColor = '#00337C';
  let accentColor = '#1C82AD';
  let textColor = '#333333';
  let explanationColor = '#555555';

  if (theme === 'dark') {
    pageBgColor = '#0B0033';
    contentBgColor = '#0B0033';
    primaryColor = '#1C82AD';
    secondaryColor = '#03C988';
    accentColor = '#03C988';
    textColor = '#F6F6FA';
    explanationColor = '#CCCCCC';
  } else if (theme === 'minimal') {
    pageBgColor = '#FFFFFF';
    contentBgColor = '#FFFFFF';
    primaryColor = '#000000';
    secondaryColor = '#333333';
    accentColor = '#555555';
    textColor = '#111111';
    explanationColor = '#444444';
  }

  // Handle automatic page backgrounds (especially useful for Dark mode auto-breaks)
  doc.on('pageAdded', () => {
    doc.save();
    doc.rect(0, 0, doc.page.width, doc.page.height).fill(contentBgColor);
    doc.restore();
    doc.fillColor(textColor);
  });

  // --- Title Page ---
  doc.rect(0, 0, doc.page.width, doc.page.height).fill(pageBgColor);
  
  doc.fillColor(primaryColor)
     .fontSize(32)
     .font('Helvetica-Bold')
     .text('STUDY GUIDE', 50, 180, { align: 'center' });

  doc.fillColor(accentColor)
     .fontSize(20)
     .font('Helvetica-Bold')
     .text(lecture.title, 50, 240, { align: 'center' });

  doc.fillColor(secondaryColor)
     .fontSize(14)
     .font('Helvetica')
     .text(`Subject: ${lecture.subject}`, 50, 290, { align: 'center' });

  if (lecture.teacherId && lecture.teacherId.name) {
    doc.fillColor(textColor)
       .fontSize(12)
       .text(`Instructor: ${lecture.teacherId.name}`, 50, 320, { align: 'center' });
  }

  doc.fontSize(10)
     .fillColor(theme === 'dark' ? '#AAAAAA' : '#777777')
     .text(`Generated on: ${new Date().toLocaleDateString()}`, 50, 350, { align: 'center' });

  doc.fillColor(primaryColor)
     .fontSize(12)
     .text('Powered by AI Classroom Notes Generator', 50, doc.page.height - 100, { align: 'center' });

  // --- Section 1: Lecture Notes ---
  doc.addPage();

  doc.fillColor(primaryColor)
     .fontSize(22)
     .font('Helvetica-Bold')
     .text('1. Lecture Notes', 50, 50);
  doc.moveDown(1);

  // Simple Markdown Parsing for PDF Kit
  if (notes && notes.noteContent) {
    const lines = notes.noteContent.split('\n');
    doc.fillColor(textColor).font('Helvetica').fontSize(11);
    
    lines.forEach(line => {
      const trimmed = line.trim();
      if (trimmed.startsWith('# ')) {
        doc.moveDown(1.5);
        doc.fillColor(primaryColor).fontSize(18).font('Helvetica-Bold').text(trimmed.replace('# ', ''));
        doc.font('Helvetica').fontSize(11).fillColor(textColor);
        doc.moveDown(0.5);
      } else if (trimmed.startsWith('## ')) {
        doc.moveDown(1.2);
        doc.fillColor(secondaryColor).fontSize(14).font('Helvetica-Bold').text(trimmed.replace('## ', ''));
        doc.font('Helvetica').fontSize(11).fillColor(textColor);
        doc.moveDown(0.4);
      } else if (trimmed.startsWith('### ')) {
        doc.moveDown(1);
        doc.fillColor(accentColor).fontSize(12).font('Helvetica-Bold').text(trimmed.replace('### ', ''));
        doc.font('Helvetica').fontSize(11).fillColor(textColor);
        doc.moveDown(0.3);
      } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        doc.text(`• ${trimmed.substring(2)}`, { indent: 15 });
        doc.moveDown(0.2);
      } else if (trimmed) {
        // Remove simple bold markings **text** -> text
        const cleanText = trimmed.replace(/\*\*/g, '');
        doc.text(cleanText);
        doc.moveDown(0.4);
      } else {
        doc.moveDown(0.3);
      }

      // Avoid writing off page
      if (doc.y > doc.page.height - 70) {
        doc.addPage();
      }
    });
  }

  // --- Section 2: Summaries ---
  doc.addPage();
  doc.fillColor(primaryColor)
     .fontSize(22)
     .font('Helvetica-Bold')
     .text('2. Lecture Summaries', 50, 50);
  doc.moveDown(1.5);

  if (notes && notes.summary) {
    doc.fillColor(secondaryColor).fontSize(14).font('Helvetica-Bold').text('Short Summary (100 words)');
    doc.fillColor(textColor).font('Helvetica').fontSize(11).text(notes.summary.short);
    doc.moveDown(1.5);

    doc.fillColor(secondaryColor).fontSize(14).font('Helvetica-Bold').text('Medium Summary (300 words)');
    doc.fillColor(textColor).font('Helvetica').fontSize(11).text(notes.summary.medium);
    doc.moveDown(1.5);

    doc.fillColor(secondaryColor).fontSize(14).font('Helvetica-Bold').text('Detailed Summary (500 words)');
    doc.fillColor(textColor).font('Helvetica').fontSize(11).text(notes.summary.detailed);
    doc.moveDown(1.5);
  }

  // --- Section 3: Flashcards ---
  if (flashcards && flashcards.length > 0) {
    doc.addPage();
    doc.fillColor(primaryColor)
       .fontSize(22)
       .font('Helvetica-Bold')
       .text('3. Revision Flashcards', 50, 50);
    doc.moveDown(1.5);

    flashcards.forEach((fc, index) => {
      doc.fillColor(secondaryColor).fontSize(12).font('Helvetica-Bold').text(`Q${index + 1}: ${fc.question}`);
      doc.fillColor(textColor).font('Helvetica').fontSize(11).text(`Answer: ${fc.answer}`);
      doc.moveDown(1);

      if (doc.y > doc.page.height - 70) {
        doc.addPage();
      }
    });
  }

  // --- Section 4: Multiple Choice Questions (MCQs) ---
  if (mcqs && mcqs.length > 0) {
    doc.addPage();
    doc.fillColor(primaryColor)
       .fontSize(22)
       .font('Helvetica-Bold')
       .text('4. Practice Quiz (MCQs)', 50, 50);
    doc.moveDown(1.5);

    mcqs.forEach((mcq, index) => {
      doc.fillColor(secondaryColor).fontSize(12).font('Helvetica-Bold').text(`Q${index + 1}: ${mcq.question}`);
      doc.moveDown(0.3);
      
      // Draw options
      mcq.options.forEach(opt => {
        doc.fillColor(textColor).font('Helvetica').fontSize(11).text(opt, { indent: 15 });
      });
      doc.moveDown(0.4);

      doc.fillColor(theme === 'dark' ? '#03C988' : '#029E6B').font('Helvetica-Bold').fontSize(10).text(`Correct Answer: Option ${mcq.correctAnswer}`, { indent: 15 });
      doc.fillColor(explanationColor).font('Helvetica-Oblique').fontSize(10).text(`Explanation: ${mcq.explanation}`, { indent: 15 });
      doc.moveDown(1.5);

      if (doc.y > doc.page.height - 100) {
        doc.addPage();
      }
    });
  }

  // Finalize PDF
  doc.end();
};

module.exports = {
  generateStudyPDF
};
