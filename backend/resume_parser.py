import PyPDF2
from docx import Document
import os
# import pdfplumber # Uncomment if you prefer pdfplumber

def extract_text_from_pdf(pdf_path):
    text = ""
    try:
        with open(pdf_path, 'rb') as file:
            reader = PyPDF2.PdfReader(file)
            if not reader.pages:
                print(f"Warning: No pages found in PDF {pdf_path}.")
                return "" # Or handle as an error
            for page_num in range(len(reader.pages)):
                page = reader.pages[page_num]
                page_text = page.extract_text()
                if page_text:
                    text += page_text
        # if not text: # Fallback or alternative if PyPDF2 fails or extracts poorly
            # print(f"PyPDF2 extracted no text from {pdf_path}. Trying pdfplumber...")
            # try:
            #     with pdfplumber.open(pdf_path) as pdf:
            #         for page in pdf.pages:
            #             page_text = page.extract_text()
            #             if page_text:
            #                 text += page_text + "\n"
            # except Exception as e_plumber:
            #     print(f"pdfplumber also failed for {pdf_path}: {e_plumber}")
        if not text:
             print(f"Warning: Could not extract text from PDF {pdf_path} using available methods.")
    except Exception as e:
        print(f"Error reading PDF {pdf_path}: {e}")
        return None # Indicates a hard error during parsing
    return text

def extract_text_from_docx(docx_path):
    text = ""
    try:
        doc = Document(docx_path)
        for para in doc.paragraphs:
            text += para.text + "\n"
    except Exception as e:
        print(f"Error reading DOCX {docx_path}: {e}")
        return None # Indicates a hard error during parsing
    return text

def get_resume_text(file_path):
    _, file_extension = os.path.splitext(file_path)
    if file_extension.lower() == '.pdf':
        return extract_text_from_pdf(file_path)
    elif file_extension.lower() == '.docx':
        return extract_text_from_docx(file_path)
    else:
        print(f"Unsupported file type: {file_extension}")
        return None