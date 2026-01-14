import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { FaBook, FaDownload, FaSpinner } from 'react-icons/fa';

// Lazy load PDF libraries to prevent crashes on iOS
let Document, Page, pdfjs;
let html2pdf;
let pdfLibrariesLoaded = false;

const loadPdfLibraries = () => {
  if (pdfLibrariesLoaded) return;
  
  try {
    // Only try to load if not on iOS
    if (typeof window !== 'undefined') {
      const ua = navigator.userAgent;
      const isIOSDevice = /iPad|iPhone|iPod/.test(ua) && !(/Mac OS X/.test(ua) && !/iPad/.test(ua));
      
      if (!isIOSDevice) {
        const reactPdf = require('react-pdf');
        Document = reactPdf.Document;
        Page = reactPdf.Page;
        pdfjs = reactPdf.pdfjs;
        html2pdf = require('html2pdf.js').default;
        
        // Set up PDF.js worker - use local worker file from public folder
        if (pdfjs && pdfjs.GlobalWorkerOptions) {
          pdfjs.GlobalWorkerOptions.workerSrc = '/js/pdf.worker.min.mjs';
        }
        pdfLibrariesLoaded = true;
      }
    }
  } catch (e) {
    console.error('Error loading PDF libraries:', e);
    // Don't throw - just log the error
  }
};

const Container = styled.div`
  padding: 1rem;
  max-width: 1200px;
  margin: 0 auto;
  background: #f8f9fa;
  min-height: 100vh;
  
  @media (max-width: 768px) {
    padding: 0.5rem;
  }
`;

const Header = styled.div`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 1.5rem;
  border-radius: 12px;
  margin-bottom: 1.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
  
  @media (max-width: 768px) {
    padding: 1rem;
    margin-bottom: 1rem;
    flex-direction: column;
    align-items: stretch;
  }
`;

const Title = styled.h1`
  margin: 0;
  font-size: 2rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  
  @media (max-width: 768px) {
    font-size: 1.25rem;
    gap: 0.5rem;
  }
  
  @media (max-width: 480px) {
    font-size: 1.1rem;
  }
`;

const DownloadButton = styled.button`
  background: rgba(255, 255, 255, 0.2);
  border: 2px solid white;
  color: white;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.3s ease;
  
  &:hover {
    background: white;
    color: #667eea;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
  
  @media (max-width: 768px) {
    padding: 0.6rem 1rem;
    font-size: 0.9rem;
    width: 100%;
    justify-content: center;
  }
  
  @media (max-width: 480px) {
    padding: 0.5rem 0.75rem;
    font-size: 0.85rem;
  }
`;

const ContentWrapper = styled.div`
  background: white;
  border-radius: 12px;
  padding: 3rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  line-height: 1.8;
  color: #333;
  overflow-x: auto;
  
  @media (max-width: 768px) {
    padding: 1rem;
    border-radius: 8px;
  }
  
  @media (max-width: 480px) {
    padding: 0.75rem;
  }
`;

const PDFContent = styled.div`
  font-family: 'Georgia', 'Times New Roman', serif;
  font-size: 1.1rem;
  line-height: 1.8;
  color: #2c3e50;
  max-width: 900px;
  margin: 0 auto;
  
  h1 {
    color: #667eea;
    font-size: 2.5rem;
    margin-top: 2.5rem;
    margin-bottom: 1.5rem;
    border-bottom: 4px solid #667eea;
    padding-bottom: 0.75rem;
    font-weight: 700;
    text-align: center;
  }
  
  h2 {
    color: #764ba2;
    font-size: 1.75rem;
    margin-top: 2rem;
    margin-bottom: 1rem;
    border-left: 5px solid #764ba2;
    padding-left: 1.25rem;
    padding-top: 0.5rem;
    padding-bottom: 0.5rem;
    background: linear-gradient(to right, rgba(118, 75, 162, 0.1), transparent);
    font-weight: 600;
  }
  
  h3 {
    color: #555;
    font-size: 1.35rem;
    margin-top: 1.5rem;
    margin-bottom: 0.75rem;
    font-weight: 600;
    color: #667eea;
  }
  
  p {
    margin-bottom: 1.25rem;
    text-align: justify;
    text-justify: inter-word;
    font-size: 1.05rem;
    line-height: 1.9;
  }
  
  p.subheading {
    font-weight: 600;
    color: #555;
    font-size: 1.15rem;
    margin-bottom: 0.75rem;
    margin-top: 1rem;
  }
  
  ul, ol {
    margin: 1.25rem 0;
    padding-left: 2.5rem;
    line-height: 1.9;
  }
  
  li {
    margin-bottom: 0.75rem;
    padding-left: 0.5rem;
    font-size: 1.05rem;
  }
  
  ul li::marker {
    color: #667eea;
    font-weight: bold;
  }
  
  strong {
    color: #2c3e50;
    font-weight: 700;
  }
  
  em {
    color: #666;
    font-style: italic;
  }
  
  table {
    width: 100%;
    border-collapse: collapse;
    margin: 2rem 0;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    border-radius: 8px;
    overflow: hidden;
    display: block;
    overflow-x: auto;
    white-space: nowrap;
  }
  
  table th,
  table td {
    border: 1px solid #e0e0e0;
    padding: 1rem;
    text-align: left;
  }
  
  table th {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    font-weight: 600;
    font-size: 1.1rem;
  }
  
  table tr:nth-child(even) {
    background: #f8f9fa;
  }
  
  table tr:hover {
    background: #e9ecef;
  }
  
  img {
    max-width: 100%;
    height: auto;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    margin: 2rem 0;
    display: block;
    margin-left: auto;
    margin-right: auto;
  }
  
  blockquote {
    border-left: 5px solid #667eea;
    padding: 1rem 1.5rem;
    margin: 1.5rem 0;
    background: #f8f9fa;
    border-radius: 0 8px 8px 0;
    color: #555;
    font-style: italic;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  }
  
  hr {
    border: none;
    border-top: 3px solid #e0e0e0;
    margin: 2.5rem 0;
    border-radius: 2px;
  }
  
  .page-break {
    page-break-before: always;
    margin: 3rem 0;
    border-top: 2px dashed #ddd;
    padding-top: 2rem;
  }
  
  /* Improve readability */
  * {
    word-wrap: break-word;
    overflow-wrap: break-word;
  }
  
  /* Add spacing between sections */
  h2 + p,
  h3 + p {
    margin-top: 0.5rem;
  }
  
  /* Mobile responsive styles */
  @media (max-width: 768px) {
    font-size: 1rem;
    line-height: 1.7;
    
    h1 {
      font-size: 1.75rem;
      margin-top: 1.5rem;
      margin-bottom: 1rem;
      padding-bottom: 0.5rem;
    }
    
    h2 {
      font-size: 1.4rem;
      margin-top: 1.5rem;
      margin-bottom: 0.75rem;
      padding-left: 0.75rem;
      border-left-width: 3px;
    }
    
    h3 {
      font-size: 1.2rem;
      margin-top: 1.25rem;
      margin-bottom: 0.5rem;
    }
    
    p {
      font-size: 0.95rem;
      margin-bottom: 1rem;
      text-align: left;
    }
    
    p.subheading {
      font-size: 1rem;
    }
    
    ul, ol {
      padding-left: 1.5rem;
      margin: 1rem 0;
    }
    
    li {
      font-size: 0.95rem;
      margin-bottom: 0.5rem;
    }
    
    table {
      font-size: 0.85rem;
      margin: 1rem 0;
    }
    
    table th,
    table td {
      padding: 0.5rem;
    }
    
    blockquote {
      padding: 0.75rem 1rem;
      margin: 1rem 0;
    }
    
    hr {
      margin: 1.5rem 0;
    }
    
    .page-break {
      margin: 1.5rem 0;
      padding-top: 1rem;
    }
  }
  
  @media (max-width: 480px) {
    font-size: 0.9rem;
    
    h1 {
      font-size: 1.5rem;
    }
    
    h2 {
      font-size: 1.25rem;
      padding-left: 0.5rem;
    }
    
    h3 {
      font-size: 1.1rem;
    }
    
    p {
      font-size: 0.9rem;
    }
    
    ul, ol {
      padding-left: 1.25rem;
    }
  }
`;

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  color: #666;
  
  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
`;

const ErrorContainer = styled.div`
  background: #f8d7da;
  color: #721c24;
  padding: 1.5rem;
  border-radius: 8px;
  margin: 2rem 0;
  border: 1px solid #f5c6cb;
`;

// Detect iOS device - only actual iOS devices, not MacBook Safari
const isIOS = () => {
  if (typeof window === 'undefined') return false;
  const ua = navigator.userAgent;
  const isIPad = /iPad/.test(ua);
  const isIPhone = /iPhone/.test(ua);
  const isIPod = /iPod/.test(ua);
  // Exclude MacBook Safari - only detect actual iOS devices
  // MacBook Safari might have touch points but shouldn't be treated as iOS
  const isMacOS = /Mac OS X/.test(ua) && !isIPad;
  return (isIPad || isIPhone || isIPod) && !isMacOS;
};

const RulesBook = () => {
  const [numPages, setNumPages] = useState(null);
  const [textContent, setTextContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const [showAsImages, setShowAsImages] = useState(true); // Show PDF as images by default to preserve images
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);
  const [isIOSDevice, setIsIOSDevice] = useState(() => {
    // Initialize iOS detection immediately if window is available
    if (typeof window !== 'undefined') {
      try {
        return isIOS();
      } catch (e) {
        console.error('Error in iOS detection:', e);
        return false;
      }
    }
    return false;
  });
  const [useIOSIframe, setUseIOSIframe] = useState(true); // For iOS: use iframe by default
  const contentRef = useRef(null);
  const pdfPath = '/images/CPL RULES UPDATED.pdf';

  const loadPDFText = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Try to load PDF libraries if not already loaded
      loadPdfLibraries();
      
      // Check if PDF.js is available
      if (!pdfjs || !pdfjs.getDocument) {
        throw new Error('PDF.js is not available on this device. Please use the iframe view.');
      }
      
      // Load PDF document with proper configuration
      const loadingTask = pdfjs.getDocument({
        url: pdfPath,
        cMapUrl: `https://unpkg.com/pdfjs-dist@${pdfjs.version}/cmaps/`,
        cMapPacked: true,
      });
      
      const pdf = await loadingTask.promise;
      setNumPages(pdf.numPages);

      // Extract text from all pages with structure preservation
      let allTextItems = [];
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        try {
          const page = await pdf.getPage(pageNum);
          const textContent = await page.getTextContent();
          
          // Preserve text items with their positions for better formatting
          textContent.items.forEach(item => {
            allTextItems.push({
              text: item.str,
              x: item.transform[4], // x position
              y: item.transform[5], // y position
              fontSize: item.height || 12,
              fontName: item.fontName,
              page: pageNum
            });
          });
        } catch (pageError) {
          console.error(`Error extracting text from page ${pageNum}:`, pageError);
        }
      }

      // Format the text with structure preservation
      const formattedText = formatTextWithStructure(allTextItems);
      setTextContent(formattedText);
    } catch (err) {
      console.error('Error loading PDF:', err);
      setError(`Failed to load PDF: ${err.message || 'Unknown error'}. Please make sure the file exists at ${pdfPath}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    
    const initialize = () => {
      try {
        if (typeof window === 'undefined') {
          if (isMounted) {
            setError('This component requires a browser environment.');
            setLoading(false);
          }
          return;
        }
        
        // Always set loading to false immediately to ensure component renders
        if (isMounted) {
          setLoading(false);
        }
        
        // Only load PDF text if explicitly requested (not on iOS iframe mode)
        if (!showAsImages && !(isIOSDevice && useIOSIframe)) {
          loadPDFText().catch((pdfErr) => {
            console.error('Error loading PDF text:', pdfErr);
            if (isMounted) {
              setError(`Failed to load PDF: ${pdfErr.message || 'Unknown error'}`);
            }
          });
        }
      } catch (err) {
        console.error('Error in useEffect:', err);
        if (isMounted) {
          setError(`An error occurred: ${err.message || 'Unknown error'}`);
          setLoading(false);
        }
      }
    };
    
    // Initialize immediately without delay
    initialize();
    
    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showAsImages, useIOSIframe]);

  // Handle window resize for responsive PDF scaling
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const handleResize = () => {
      try {
        setWindowWidth(window.innerWidth);
      } catch (err) {
        console.error('Error handling resize:', err);
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('resize', handleResize);
      }
    };
  }, []);

  const formatTextWithStructure = (textItems, images = []) => {
    if (!textItems || textItems.length === 0) return '<p>No content available</p>';
    
    // Group items by y-position (same line) and sort by page, then y, then x
    const sortedItems = [...textItems].sort((a, b) => {
      if (a.page !== b.page) return a.page - b.page;
      // Sort by y position (top to bottom), then by x (left to right)
      const yDiff = Math.abs(b.y - a.y);
      if (yDiff > 2) return b.y - a.y; // Different lines
      return a.x - b.x; // Same line, sort by x
    });
    
    let html = '';
    let currentLine = [];
    let lastY = null;
    let lastPage = null;
    let inList = false;
    
    // Process items line by line
    sortedItems.forEach((item, index) => {
      const isNewLine = lastY === null || Math.abs(item.y - lastY) > 2 || item.page !== lastPage;
      const isNewPage = lastPage !== null && item.page !== lastPage;
      
      if (isNewPage) {
        // Close any open lists and add page break
        if (inList) {
          html += '</ul>';
          inList = false;
        }
        html += '<div class="page-break"></div>';
      }
      
      if (isNewLine && currentLine.length > 0) {
        // Process the previous line
        const lineText = currentLine.map(i => i.text).join(' ').trim();
        const avgFontSize = currentLine.reduce((sum, i) => sum + (i.fontSize || 12), 0) / currentLine.length;
        const result = processLine(lineText, avgFontSize, inList);
        html += result.html;
        inList = result.inList;
        currentLine = [];
      }
      
      currentLine.push(item);
      lastY = item.y;
      lastPage = item.page;
      
    });
    
    // Process the last line
    if (currentLine.length > 0) {
      const lineText = currentLine.map(i => i.text).join(' ').trim();
      const avgFontSize = currentLine.reduce((sum, i) => sum + i.fontSize, 0) / currentLine.length;
      const result = processLine(lineText, avgFontSize, inList);
      html += result.html;
      inList = result.inList;
    }
    
    if (inList) {
      html += '</ul>';
    }
    
    return html;
  };

  const processLine = (lineText, fontSize, currentlyInList) => {
    if (!lineText || lineText.trim().length === 0) {
      return { html: '', inList: currentlyInList };
    }
    
    let html = '';
    let inList = currentlyInList;
    const trimmed = lineText.trim();
    
    // Detect headings (larger font, all caps, or numbered sections)
    if (fontSize > 14 || trimmed.match(/^\d+\.\s+[A-Z]/) || (trimmed.length < 100 && trimmed === trimmed.toUpperCase() && trimmed.length > 5 && !trimmed.match(/[.!?]$/))) {
      if (inList) {
        html += '</ul>';
        inList = false;
      }
      // Check if it's a main heading (starts with number)
      if (trimmed.match(/^\d+\.\s+/)) {
        html += `<h2>${trimmed}</h2>`;
      } else {
        html += `<h3>${trimmed}</h3>`;
      }
      return { html, inList };
    }
    
    // Detect list items
    if (trimmed.match(/^[-•*•]\s/) || trimmed.match(/^[a-z]\)\s/) || trimmed.match(/^\d+[\.\)]\s/)) {
      if (!inList) {
        html += '<ul>';
        inList = true;
      }
      const listText = trimmed.replace(/^[-•*•]\s/, '').replace(/^[a-z]\)\s/, '').replace(/^\d+[\.\)]\s/, '').trim();
      html += `<li>${listText}</li>`;
      return { html, inList };
    }
    
    // Regular paragraph
    if (inList) {
      html += '</ul>';
      inList = false;
    }
    
    // Check if it's a short line that might be a subheading
    if (trimmed.length < 80 && !trimmed.match(/[.!?]$/) && trimmed.length > 10) {
      html += `<p class="subheading">${trimmed}</p>`;
    } else {
      html += `<p>${trimmed}</p>`;
    }
    
    return { html, inList };
  };

  const handleDownloadPDF = async () => {
    setDownloading(true);
    try {
      if (showAsImages) {
        // Download the original PDF directly
        const link = document.createElement('a');
        link.href = pdfPath;
        link.download = 'CPL_Rules_Book.pdf';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        // Generate PDF from HTML content
        if (!contentRef.current) return;
        const element = contentRef.current;
        const opt = {
          margin: [20, 20, 20, 20],
          filename: 'CPL_Rules_Book.pdf',
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };
        
        await html2pdf().set(opt).from(element).save();
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
    setLoading(false);
    setError(null);
  };

  const onDocumentLoadError = (error) => {
    console.error('PDF load error:', error);
    setError(`Failed to load PDF: ${error.message || 'Unknown error'}. Please try downloading the PDF or viewing it directly.`);
    setLoading(false);
    // On iOS, if react-pdf fails, fall back to iframe
    if (isIOSDevice) {
      setUseIOSIframe(true);
      setShowAsImages(true);
    }
  };

  // Safety check for window object - must be after all hooks
  // Always render something, even if there's an error
  if (typeof window === 'undefined') {
    return (
      <Container>
        <Header>
          <Title>
            <FaBook />
            Rules Book
          </Title>
        </Header>
        <ContentWrapper>
          <ErrorContainer>
            <strong>Error:</strong> This component requires a browser environment.
          </ErrorContainer>
        </ContentWrapper>
      </Container>
    );
  }

  // Show loading state initially
  if (loading && !error && !isIOSDevice) {
    return (
      <Container>
        <Header>
          <Title>
            <FaBook />
            Rules Book
          </Title>
        </Header>
        <ContentWrapper>
          <LoadingContainer>
            <FaSpinner style={{ fontSize: '3rem', animation: 'spin 1s linear infinite', marginBottom: '1rem' }} />
            <p>Loading PDF content...</p>
          </LoadingContainer>
        </ContentWrapper>
      </Container>
    );
  }

  // For iOS, use native PDF viewer (iframe) by default - iOS Safari handles PDFs natively better
  // But allow users to switch to react-pdf view if they want
  if (isIOSDevice && useIOSIframe && showAsImages) {
    return (
      <Container>
        <Header>
          <Title>
            <FaBook />
            Rules Book
          </Title>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => {
                setUseIOSIframe(false);
                setShowAsImages(true);
                setLoading(true);
              }}
              style={{
                background: 'rgba(255, 255, 255, 0.2)',
                border: '2px solid white',
                color: 'white',
                padding: '0.5rem 1rem',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '0.9rem',
                fontWeight: '600'
              }}
            >
              📄 Show as Pages
            </button>
            <DownloadButton onClick={handleDownloadPDF} disabled={downloading}>
              <FaDownload />
              {downloading ? 'Downloading...' : 'Download PDF'}
            </DownloadButton>
          </div>
        </Header>

        <ContentWrapper>
          <div style={{ 
            width: '100%', 
            height: '80vh', 
            minHeight: '600px',
            border: '1px solid #dee2e6',
            borderRadius: '8px',
            overflow: 'hidden',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            background: '#f8f9fa'
          }}>
            <iframe
              src={pdfPath}
              style={{
                width: '100%',
                height: '100%',
                border: 'none'
              }}
              title="CPL Rules Book PDF"
              onError={(e) => {
                console.error('Iframe load error:', e);
                setError('Failed to load PDF in iframe. Try switching to "Show as Pages" view.');
                setLoading(false);
              }}
              onLoad={() => {
                // Iframe loaded successfully
                setLoading(false);
                setError(null);
              }}
            />
          </div>
          <div style={{ 
            marginTop: '1rem', 
            padding: '1rem', 
            background: '#e7f3ff', 
            borderRadius: '8px',
            fontSize: '0.9rem',
            color: '#004085',
            lineHeight: '1.6'
          }}>
            <strong>📱 iOS Users:</strong> The PDF is displayed using Safari's native viewer. 
            You can pinch to zoom and scroll through the document. Use the download button above to save a copy.
            Click "Show as Pages" to view using the page-by-page renderer.
          </div>
        </ContentWrapper>
      </Container>
    );
  }

  if (loading && !showAsImages) {
    return (
      <Container>
        <Header>
          <Title>
            <FaBook />
            Rules Book
          </Title>
        </Header>
        <ContentWrapper>
          <LoadingContainer>
            <FaSpinner style={{ fontSize: '3rem', animation: 'spin 1s linear infinite', marginBottom: '1rem' }} />
            <p>Loading PDF content...</p>
          </LoadingContainer>
        </ContentWrapper>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <Header>
          <Title>
            <FaBook />
            Rules Book
          </Title>
        </Header>
        <ContentWrapper>
          <ErrorContainer>
            <strong>Error:</strong> {error}
          </ErrorContainer>
        </ContentWrapper>
      </Container>
    );
  }

  return (
    <Container>
      <Header>
        <Title>
          <FaBook />
          Rules Book
        </Title>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          {isIOSDevice && (
            <button
              onClick={() => {
                setUseIOSIframe(true);
                setShowAsImages(true);
                setLoading(false);
                setError(null);
              }}
              style={{
                background: 'rgba(255, 255, 255, 0.2)',
                border: '2px solid white',
                color: 'white',
                padding: '0.5rem 1rem',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '0.9rem',
                fontWeight: '600'
              }}
            >
              📱 Show in Safari Viewer
            </button>
          )}
          <button
            onClick={() => {
              if (isIOSDevice) {
                setUseIOSIframe(false);
              }
              setShowAsImages(!showAsImages);
              setLoading(true);
            }}
            style={{
              background: 'rgba(255, 255, 255, 0.2)',
              border: '2px solid white',
              color: 'white',
              padding: '0.5rem 1rem',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.9rem',
              fontWeight: '600'
            }}
          >
            {showAsImages ? '📄 Show as Text' : '🖼️ Show as Images'}
          </button>
          <DownloadButton onClick={handleDownloadPDF} disabled={downloading}>
            <FaDownload />
            {downloading ? 'Downloading...' : 'Download PDF'}
          </DownloadButton>
        </div>
      </Header>

      <ContentWrapper>
        {showAsImages ? (
          <div ref={contentRef} style={{ width: '100%' }}>
            {(() => {
              // Try to load PDF libraries if not already loaded
              loadPdfLibraries();
              
              // Check if Document and Page are available
              if (!Document || !Page) {
                return (
                  <ErrorContainer>
                    <strong>PDF Viewer Not Available:</strong> PDF.js is not available on this device. 
                    Please use the iframe view or download the PDF.
                    {isIOSDevice && (
                      <div style={{ marginTop: '1rem' }}>
                        <button
                          onClick={() => {
                            setUseIOSIframe(true);
                            setShowAsImages(true);
                          }}
                          style={{
                            background: '#667eea',
                            color: 'white',
                            border: 'none',
                            padding: '0.5rem 1rem',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '0.9rem',
                            fontWeight: '600'
                          }}
                        >
                          📱 Use Safari Viewer
                        </button>
                      </div>
                    )}
                  </ErrorContainer>
                );
              }
              
              return (
                <Document
                  file={pdfPath}
                  onLoadSuccess={onDocumentLoadSuccess}
                  onLoadError={onDocumentLoadError}
                  loading={
                    <LoadingContainer>
                      <FaSpinner style={{ fontSize: '3rem', animation: 'spin 1s linear infinite', marginBottom: '1rem' }} />
                      <p>Loading PDF pages...</p>
                    </LoadingContainer>
                  }
                >
              {numPages && Array.from(new Array(numPages), (el, index) => {
                // Calculate responsive scale based on screen width
                const getScale = () => {
                  if (windowWidth < 480) return 0.5;
                  if (windowWidth < 768) return 0.7;
                  return 1.2;
                };
                
                return (
                  <div 
                    key={`page_${index + 1}`} 
                    style={{ 
                      marginBottom: windowWidth < 768 ? '1rem' : '2rem', 
                      textAlign: 'center',
                      width: '100%',
                      overflowX: 'auto',
                      padding: windowWidth < 768 ? '0.25rem' : '0.5rem'
                    }}
                  >
                    <Page
                      pageNumber={index + 1}
                      renderTextLayer={false}
                      renderAnnotationLayer={false}
                      scale={getScale()}
                      width={windowWidth < 768 ? windowWidth - 20 : undefined}
                      style={{
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                        margin: '0 auto',
                        display: 'block',
                        border: '1px solid #e0e0e0',
                        borderRadius: '4px',
                        maxWidth: '100%',
                        height: 'auto'
                      }}
                    />
                    {index < numPages - 1 && <div style={{ height: windowWidth < 768 ? '0.5rem' : '1rem' }} />}
                  </div>
                );
                })}
                </Document>
              );
            })()}
          </div>
        ) : (
          <PDFContent 
            ref={contentRef}
            dangerouslySetInnerHTML={{ __html: textContent || '<p>No content available</p>' }}
          />
        )}
      </ContentWrapper>
    </Container>
  );
};

// Wrap component in error boundary
const RulesBookWithErrorBoundary = () => {
  try {
    return <RulesBook />;
  } catch (error) {
    console.error('RulesBook error:', error);
    return (
      <Container>
        <Header>
          <Title>
            <FaBook />
            Rules Book
          </Title>
        </Header>
        <ContentWrapper>
          <ErrorContainer>
            <strong>Error:</strong> An unexpected error occurred. Please refresh the page or try again later.
            <br />
            <small>{error.message}</small>
          </ErrorContainer>
        </ContentWrapper>
      </Container>
    );
  }
};

export default RulesBookWithErrorBoundary;
