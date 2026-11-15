"""
PyMuPDF (pymupdf) PDF Parsing Engine
Extracts plain text and page metadata from PDF byte streams.
"""

import pymupdf as fitz
from typing import Dict, Any

class PDFParseError(Exception):
    pass

def extract_text_from_pdf_bytes(file_bytes: bytes, filename: str = "resume.pdf") -> Dict[str, Any]:
    """
    Parses a PDF file from bytes using PyMuPDF.
    Returns structured text and metadata.
    """
    if not file_bytes or len(file_bytes) == 0:
        raise PDFParseError("Uploaded file is empty (0 bytes).")

    # Verify PDF magic bytes '%PDF'
    if not file_bytes.startswith(b"%PDF"):
        raise PDFParseError("Invalid file signature: File does not appear to be a valid PDF document.")

    try:
        doc = fitz.open(stream=file_bytes, filetype="pdf")
    except Exception as e:
        raise PDFParseError(f"Failed to open PDF document: {str(e)}")

    page_count = len(doc)
    if page_count == 0:
        doc.close()
        raise PDFParseError("The PDF document contains 0 pages.")

    full_text_pages = []
    total_characters = 0

    for page_num in range(page_count):
        page = doc.load_page(page_num)
        page_text = page.get_text("text") or ""
        cleaned = page_text.strip()
        full_text_pages.append(cleaned)
        total_characters += len(cleaned)

    doc.close()

    full_text = "\n\n".join(full_text_pages).strip()

    if total_characters == 0:
        raise PDFParseError("The PDF document contains no readable text. It may be an image-only or scanned document.")

    return {
        "success": True,
        "filename": filename,
        "page_count": page_count,
        "character_count": total_characters,
        "text": full_text,
        "status": "completed"
    }
