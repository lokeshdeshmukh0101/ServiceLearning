import fs from 'fs';
import path from 'path';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import { ExtractionResult, ExtractedPage } from '../types/index.js';

export async function extractText(filePath: string, fileType: string): Promise<ExtractionResult> {
  const normalizedType = fileType.toLowerCase().trim();

  try {
    if (!fs.existsSync(filePath)) {
      return { text: '', error: 'File does not exist on disk' };
    }

    if (normalizedType === 'pdf' || normalizedType === 'application/pdf') {
      return await extractPdfText(filePath);
    }

    if (
      normalizedType === 'docx' ||
      normalizedType === 'doc' ||
      normalizedType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ) {
      return await extractDocxText(filePath);
    }

    if (
      normalizedType === 'txt' ||
      normalizedType === 'md' ||
      normalizedType === 'markdown' ||
      normalizedType === 'text/plain' ||
      normalizedType === 'text/markdown'
    ) {
      return await extractPlainText(filePath);
    }

    // Default fallback: attempt text reading
    return await extractPlainText(filePath);
  } catch (err: any) {
    console.error(`Error extracting text from ${filePath}:`, err?.message || err);
    return {
      text: '',
      error: err?.message || 'Document uploaded, but text extraction failed.',
    };
  }
}

async function extractPdfText(filePath: string): Promise<ExtractionResult> {
  const dataBuffer = await fs.promises.readFile(filePath);
  
  // Custom pager render callback to track page boundaries
  const pages: ExtractedPage[] = [];
  
  const options = {
    pagerender: (pageData: any) => {
      return pageData.getTextContent().then((textContent: any) => {
        let lastY, text = '';
        for (const item of textContent.items) {
          if (lastY == item.transform[5] || !lastY) {
            text += item.str;
          } else {
            text += '\n' + item.str;
          }
          lastY = item.transform[5];
        }
        
        const pageNumber = pageData.pageIndex + 1;
        const pageText = text.trim();
        if (pageText) {
          pages.push({ pageNumber, text: pageText });
        }
        return `\n--- Page ${pageNumber} ---\n` + text;
      });
    },
  };

  try {
    const parsed = await pdfParse(dataBuffer, options);
    const fullText = parsed.text ? parsed.text.trim() : '';
    
    return {
      text: fullText,
      pages: pages.length > 0 ? pages : undefined,
    };
  } catch (pdfErr) {
    // Fallback standard pdfParse without custom options
    const fallbackParsed = await pdfParse(dataBuffer);
    return {
      text: fallbackParsed.text ? fallbackParsed.text.trim() : '',
    };
  }
}

async function extractDocxText(filePath: string): Promise<ExtractionResult> {
  const result = await mammoth.extractRawText({ path: filePath });
  const text = result.value ? result.value.trim() : '';
  return { text };
}

async function extractPlainText(filePath: string): Promise<ExtractionResult> {
  const content = await fs.promises.readFile(filePath, 'utf-8');
  return { text: content.trim() };
}
