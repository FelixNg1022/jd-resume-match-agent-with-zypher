// src/tools/file_parser.ts
import pdfParse from "npm:pdf-parse";
import { Buffer } from "node:buffer";
import mammoth from "npm:mammoth@^1.6.0";

/**
 * Extract text from various file types (PDF, Word, TXT)
 */
export async function extractTextFromFile(
  fileBuffer: Uint8Array,
  fileName: string,
  mimeType: string
): Promise<string> {
  try {
    const fileExtension = fileName.toLowerCase().split('.').pop() || '';
    
    // Handle PDF files
    if (mimeType === "application/pdf" || fileExtension === "pdf") {
      return await extractTextFromPDF(fileBuffer);
    }
    
    // Handle Word documents (.docx)
    if (
      mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      fileExtension === "docx"
    ) {
      return await extractTextFromDOCX(fileBuffer);
    }
    
    // Handle Word documents (.doc) - older format
    if (
      mimeType === "application/msword" ||
      fileExtension === "doc"
    ) {
      // Try using mammoth first (might work for some .doc files)
      try {
        return await extractTextFromDOCX(fileBuffer);
      } catch (err) {
        throw new Error("DOC files (older Word format) are not fully supported. Please convert to DOCX or PDF.");
      }
    }
    
    // Handle plain text files
    if (mimeType === "text/plain" || fileExtension === "txt") {
      return extractTextFromTXT(fileBuffer);
    }
    
    throw new Error(`Unsupported file type: ${mimeType || fileExtension}. Supported formats: PDF, DOCX, DOC, TXT`);
  } catch (error) {
    console.error("Error extracting text from file:", error);
    throw new Error(`Failed to parse file: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Extract text from a PDF file buffer
 */
async function extractTextFromPDF(pdfBuffer: Uint8Array): Promise<string> {
  try {
    // pdf-parse expects a Buffer, convert Uint8Array to Buffer
    const buffer = Buffer.from(pdfBuffer);
    
    // Parse PDF and extract text
    const data = await pdfParse(buffer);
    
    // Return the extracted text
    return data.text.trim();
  } catch (error) {
    console.error("Error extracting text from PDF:", error);
    throw new Error(`Failed to parse PDF: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Extract text from a DOCX file buffer
 */
async function extractTextFromDOCX(docxBuffer: Uint8Array): Promise<string> {
  try {
    // mammoth expects a Buffer or ArrayBuffer
    const buffer = Buffer.from(docxBuffer);
    
    // Extract text from DOCX
    const result = await mammoth.extractRawText({ buffer });
    
    // Return the extracted text
    return result.value.trim();
  } catch (error) {
    console.error("Error extracting text from DOCX:", error);
    throw new Error(`Failed to parse Word document: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Extract text from a TXT file buffer
 */
function extractTextFromTXT(txtBuffer: Uint8Array): string {
  try {
    // Convert Uint8Array to string using TextDecoder
    const decoder = new TextDecoder('utf-8');
    const text = decoder.decode(txtBuffer);
    
    // Return the text, trimmed
    return text.trim();
  } catch (error) {
    console.error("Error extracting text from TXT:", error);
    throw new Error(`Failed to parse text file: ${error instanceof Error ? error.message : String(error)}`);
  }
}
