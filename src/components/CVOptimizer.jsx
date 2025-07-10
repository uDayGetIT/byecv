import React, { useState, useRef } from 'react';
import { Upload, FileText, Sparkles, Download, Edit3, Save, X, CheckCircle, Zap, Target, RefreshCw } from 'lucide-react';

const CVOptimizer = () => {
  const [step, setStep] = useState(1);
  const [cvFile, setCvFile] = useState(null);
  const [cvText, setCvText] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [optimizedCV, setOptimizedCV] = useState('');
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editableCV, setEditableCV] = useState('');
  const [optimizationInsights, setOptimizationInsights] = useState(null);
  const fileInputRef = useRef(null);

  const GROQ_API_KEY = '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';

  // PDF text extraction using PDF.js
  const extractTextFromPDF = async (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const arrayBuffer = e.target.result;
          
          // Load PDF.js library
          const script = document.createElement('script');
          script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
          script.onload = async () => {
            try {
              // Configure PDF.js worker
              window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
              
              const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
              let fullText = '';
              
              // Extract text from each page
              for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
                const page = await pdf.getPage(pageNum);
                const textContent = await page.getTextContent();
                const pageText = textContent.items.map(item => item.str).join(' ');
                fullText += pageText + '\n';
              }
              
              resolve(fullText.trim());
            } catch (pdfError) {
              console.error('PDF processing error:', pdfError);
              reject(pdfError);
            }
          };
          script.onerror = () => reject(new Error('Failed to load PDF.js'));
          document.head.appendChild(script);
        } catch (error) {
          console.error('Error extracting text from PDF:', error);
          reject(error);
        }
      };
      reader.readAsArrayBuffer(file);
    });
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (file && file.type === 'application/pdf') {
      setCvFile(file);
      try {
        const extractedText = await extractTextFromPDF(file);
        if (extractedText.trim()) {
          setCvText(extractedText);
          setStep(2);
        } else {
          alert('Could not extract text from PDF. Please ensure your PDF contains readable text.');
        }
      } catch (error) {
        alert('Error reading PDF file. Please try a different file.');
        console.error('PDF extraction error:', error);
      }
    } else {
      alert('Please upload a PDF file');
    }
  };

  const optimizeCV = async () => {
    if (!cvText || !jobDescription) {
      alert('Please provide both CV and job description');
      return;
    }

    setIsOptimizing(true);
    
    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama3-8b-8192',
          messages: [
            {
              role: 'system',
              content: `You are a professional CV optimizer. Create a tailored, compelling CV that maximizes relevance for the target position. Focus on:

1. KEYWORD OPTIMIZATION: Naturally incorporate relevant terms from the job description
2. SKILL ALIGNMENT: Highlight and reframe skills that match job requirements
3. ACHIEVEMENT ENHANCEMENT: Quantify accomplishments with metrics where possible
4. RELEVANCE PRIORITIZATION: Emphasize most relevant experiences and skills
5. PROFESSIONAL POLISH: Ensure clear, concise, and impactful language

Create a strong, tailored CV that positions the candidate as an ideal fit for the role.`
            },
            {
              role: 'user',
              content: `Optimize this CV for the target position. Make it compelling and highly relevant.

JOB DESCRIPTION:
${jobDescription}

CURRENT CV:
${cvText}

Create an optimized version that:
- Incorporates relevant keywords naturally
- Highlights matching skills and experiences
- Quantifies achievements where possible
- Uses compelling, professional language
- Maintains authenticity while maximizing impact

Provide the complete optimized CV.`
            }
          ],
          max_tokens: 2500,
          temperature: 0.7
        })
      });

      const data = await response.json();
      const optimizedContent = data.choices[0].message.content;
      
      // Generate optimization summary
      const summaryResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama3-8b-8192',
          messages: [
            {
              role: 'system',
              content: 'Analyze the CV optimization and provide a brief summary of key improvements in JSON format.'
            },
            {
              role: 'user',
              content: `Analyze the key optimizations made. Provide insights in JSON format:

ORIGINAL CV:
${cvText}

OPTIMIZED CV:
${optimizedContent}

Provide analysis in this structure:
{
  "keyImprovements": ["improvement1", "improvement2", "improvement3"],
  "addedKeywords": ["keyword1", "keyword2", "keyword3"],
  "enhancedSections": ["section1", "section2"],
  "matchScore": "85%"
}`
            }
          ],
          max_tokens: 500,
          temperature: 0.3
        })
      });

      const summaryData = await summaryResponse.json();
      const summaryContent = summaryData.choices[0].message.content;
      
      // Extract JSON from summary
      const jsonMatch = summaryContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const insights = JSON.parse(jsonMatch[0]);
          setOptimizationInsights(insights);
        } catch (e) {
          console.error('JSON parsing error:', e);
        }
      }
      
      setOptimizedCV(optimizedContent);
      setEditableCV(optimizedContent);
      setStep(3);
    } catch (error) {
      console.error('Error optimizing CV:', error);
      alert('Error optimizing CV. Please try again.');
    } finally {
      setIsOptimizing(false);
    }
  };

  const downloadCV = () => {
    const element = document.createElement('a');
    const file = new Blob([editableCV], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = 'optimized_cv.txt';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const saveEdit = () => {
    setOptimizedCV(editableCV);
    setIsEditing(false);
  };

  const cancelEdit = () => {
    setEditableCV(optimizedCV);
    setIsEditing(false);
  };

  const startOver = () => {
    setStep(1);
    setCvFile(null);
    setCvText('');
    setJobDescription('');
    setOptimizedCV('');
    setEditableCV('');
    setOptimizationInsights(null);
    setIsEditing(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">CV Optimizer</h1>
          <p className="text-gray-600">Tailor your resume to match any job description</p>
        </div>

        {/* Progress */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center space-x-4">
            {[1, 2, 3].map((stepNum) => (
              <div key={stepNum} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step >= stepNum ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
                }`}>
                  {step > stepNum ? <CheckCircle className="w-4 h-4" /> : stepNum}
                </div>
                {stepNum < 3 && (
                  <div className={`w-16 h-1 ${step > stepNum ? 'bg-blue-600' : 'bg-gray-200'}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step 1: Upload */}
        {step === 1 && (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <Upload className="w-16 h-16 text-blue-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Upload Your CV</h2>
            <p className="text-gray-600 mb-6">Upload your current CV in PDF format</p>
            
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              onChange={handleFileUpload}
              className="hidden"
            />
            
            <button
              onClick={() => fileInputRef.current?.click()}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2 mx-auto"
            >
              <FileText className="w-5 h-5" />
              Choose PDF File
            </button>
            
            {cvFile && (
              <p className="mt-4 text-sm text-gray-600">Selected: {cvFile.name}</p>
            )}
          </div>
        )}

        {/* Step 2: Job Description */}
        {step === 2 && (
          <div className="bg-white rounded-lg shadow p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Add Job Description</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-700 mb-3">Your CV</h3>
                <div className="bg-gray-50 rounded-lg p-4 h-80 overflow-y-auto">
                  <pre className="text-sm text-gray-700 whitespace-pre-wrap">{cvText}</pre>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-gray-700 mb-3">Job Description</h3>
                <textarea
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder="Paste the job description here..."
                  className="w-full h-80 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
              </div>
            </div>
            
            <div className="flex justify-center mt-6">
              <button
                onClick={optimizeCV}
                disabled={isOptimizing || !jobDescription.trim()}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-8 py-3 rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                {isOptimizing ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Optimizing...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Optimize CV
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Results */}
        {step === 3 && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Optimized CV</h2>
                <div className="flex gap-3">
                  <button
                    onClick={startOver}
                    className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Start Over
                  </button>
                  {isEditing ? (
                    <>
                      <button
                        onClick={saveEdit}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
                      >
                        <Save className="w-4 h-4" />
                        Save
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
                      >
                        <X className="w-4 h-4" />
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={handleEdit}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
                      >
                        <Edit3 className="w-4 h-4" />
                        Edit
                      </button>
                      <button
                        onClick={downloadCV}
                        className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
                      >
                        <Download className="w-4 h-4" />
                        Download
                      </button>
                    </>
                  )}
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-6">
                {isEditing ? (
                  <textarea
                    value={editableCV}
                    onChange={(e) => setEditableCV(e.target.value)}
                    className="w-full h-96 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-mono resize-none"
                  />
                ) : (
                  <div className="h-96 overflow-y-auto">
                    <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono">{editableCV}</pre>
                  </div>
                )}
              </div>
            </div>

            {/* Optimization Summary */}
            {optimizationInsights && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Target className="w-5 h-5 text-blue-600" />
                  Optimization Summary
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-gray-700 mb-2">Key Improvements</h4>
                    <ul className="space-y-1">
                      {optimizationInsights.keyImprovements?.map((improvement, index) => (
                        <li key={index} className="text-sm text-gray-600">• {improvement}</li>
                      ))}
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-gray-700 mb-2">Added Keywords</h4>
                    <div className="flex flex-wrap gap-2">
                      {optimizationInsights.addedKeywords?.map((keyword, index) => (
                        <span key={index} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                          {keyword}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                
                {optimizationInsights.matchScore && (
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-blue-900">Match Score</span>
                      <span className="text-2xl font-bold text-blue-600">{optimizationInsights.matchScore}</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CVOptimizer;
