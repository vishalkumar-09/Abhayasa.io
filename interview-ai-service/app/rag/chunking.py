from typing import List

def chunk_text(text: str, chunk_size: int = 600, chunk_overlap: int = 120) -> List[str]:
    """Splits a single string block into sliding-window overlapping character chunks.
    
    Args:
        text (str): Raw input text to split.
        chunk_size (int): Character size of each chunk.
        chunk_overlap (int): Overlap characters to preserve context boundaries.
        
    Returns:
        List[str]: List of trimmed text chunks.
    """
    if not text or not text.strip():
        return []
        
    # Guard against invalid inputs
    if chunk_size <= 0:
        chunk_size = 600
    if chunk_overlap >= chunk_size or chunk_overlap < 0:
        chunk_overlap = int(chunk_size * 0.2)  # Default 20% overlap
        
    chunks = []
    text_len = len(text)
    start = 0
    
    while start < text_len:
        end = min(start + chunk_size, text_len)
        chunk = text[start:end].strip()
        if chunk:
            chunks.append(chunk)
            
        # If we reached the end of the text, break
        if end >= text_len:
            break
            
        start += (chunk_size - chunk_overlap)
        
    return chunks
