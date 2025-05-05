import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import {
    AlertCircle,
    ArrowRight,
    Check,
    Download,
    Eye,
    FileText,
    Loader2,
    Upload
} from 'lucide-react';
import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from './ui/button';

// Define available formats
const FORMATS = [
    { label: 'Markdown', value: 'markdown', extension: 'md' },
    { label: 'PDF', value: 'pdf', extension: 'pdf' },
    { label: 'HTML', value: 'html', extension: 'html' },
    { label: 'DOCX', value: 'docx', extension: 'docx' },
    { label: 'LaTeX', value: 'latex', extension: 'tex' },
    { label: 'EPUB', value: 'epub', extension: 'epub' },
];

export function FileConverter() {
    const [file, setFile] = useState<File | null>(null);
    const [inputFormat, setInputFormat] = useState('markdown');
    const [outputFormat, setOutputFormat] = useState('html');
    const [progress, setProgress] = useState(0);
    const [downloadUrl, setDownloadUrl] = useState('');
    const [showPdfPreview, setShowPdfPreview] = useState(false);
    const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);

    // Handle file drop
    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        accept: {
            'text/plain': ['.md', '.txt'],
            'text/html': ['.html', '.htm'],
            'application/pdf': ['.pdf'],
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
            'application/msword': ['.doc'],
            'application/epub+zip': ['.epub'],
            'application/x-latex': ['.tex', '.latex'],
        },
        maxFiles: 1,
        onDrop: acceptedFiles => {
            setFile(acceptedFiles[0]);
            setDownloadUrl('');
            setPdfBlob(null);
        }
    });

    // Detect file extension for input format
    React.useEffect(() => {
        if (file) {
            const extension = file.name.split('.').pop()?.toLowerCase();
            if (extension) {
                const format = FORMATS.find(f => f.extension === extension);
                if (format) {
                    setInputFormat(format.value);
                }
            }
        }
    }, [file]);

    // Convert file mutation
    const convertMutation = useMutation({
        mutationFn: async () => {
            if (!file) return null;

            const formData = new FormData();
            formData.append('file', file);
            formData.append('inputFormat', inputFormat);
            formData.append('outputFormat', outputFormat);

            const response = await axios.post('/api/convert', formData, {
                onUploadProgress: (progressEvent) => {
                    const percentCompleted = progressEvent.total
                        ? Math.round((progressEvent.loaded * 100) / progressEvent.total)
                        : 0;
                    setProgress(percentCompleted > 80 ? 80 : percentCompleted);
                },
                responseType: 'blob',
            });

            // Once conversion is complete, set to 100%
            setProgress(100);

            // Create blob URL for download
            const blob = new Blob([response.data]);
            const url = window.URL.createObjectURL(blob);
            setDownloadUrl(url);

            // Store PDF blob explicitly
            if (outputFormat === 'pdf') {
                setPdfBlob(blob);
            }

            return url;
        },
    });

    // Generate output filename
    const outputFileName = file
        ? `${file.name.split('.')[0]}.${FORMATS.find(f => f.value === outputFormat)?.extension || outputFormat}`
        : '';

    // Handle conversion
    const handleConvert = () => {
        setProgress(0);
        setDownloadUrl('');
        setPdfBlob(null);
        convertMutation.mutate();
    };

    return (
        <div className="w-full max-w-xl mx-auto py-10 flex items-center justify-center min-h-[70vh]">
            <div className="bg-card rounded-lg shadow-glow border border-border w-full">
                <div className="p-8">
                    <h2 className="text-2xl font-bold mb-8 text-center text-primary animate-pulse">Convert Documents</h2>

                    {/* Step 1: File Upload */}
                    {!file && (
                        <div
                            {...getRootProps()}
                            className={`
                                border-2 border-dashed rounded-lg p-10 text-center cursor-pointer
                                ${isDragActive ? 'border-primary bg-primary/10' : 'border-muted hover:border-primary-light hover:shadow-glow-sm'}
                                transition-all duration-300
                            `}
                        >
                            <input {...getInputProps()} aria-label="File upload input" />
                            <Upload className={`h-12 w-12 mx-auto mb-6 ${isDragActive ? 'text-primary animate-pulse' : 'text-muted-foreground'}`} />
                            <p className="text-xl font-medium text-foreground">
                                {isDragActive ? 'Drop the file here' : 'Drag & drop a file here'}
                            </p>
                            <p className="text-sm text-muted-foreground mt-3 mb-4">
                                or click to select a file
                            </p>
                            <p className="text-xs text-muted-foreground mt-4">
                                Supported formats: Markdown, HTML, PDF, DOCX, LaTeX, EPUB
                            </p>
                        </div>
                    )}

                    {/* Step 2: File info and conversion options */}
                    {file && (
                        <div className="space-y-8">
                            {/* File info */}
                            <div className="flex items-center p-4 border rounded-lg bg-secondary border-border">
                                <FileText className="h-8 w-8 mr-4 text-primary" />
                                <div className="flex-grow min-w-0">
                                    <p className="font-medium truncate text-foreground">{file.name}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {(file.size / 1024).toFixed(2)} KB
                                    </p>
                                </div>
                                <button
                                    type='button'
                                    onClick={() => setFile(null)}
                                    className="text-sm text-primary-light hover:text-primary hover:text-glow ml-4"
                                >
                                    Change
                                </button>
                            </div>

                            {/* Format selection */}
                            <div className="my-8">
                                <div className="grid grid-cols-[1fr,auto,1fr] gap-6 items-center">
                                    <div>
                                        <label htmlFor="input-format" className="block text-sm font-medium mb-2 text-foreground">
                                            Input Format
                                        </label>
                                        <select
                                            id="input-format"
                                            className="w-full bg-secondary border border-border rounded-md px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-foreground"
                                            value={inputFormat}
                                            onChange={(e) => setInputFormat(e.target.value)}
                                        >
                                            {FORMATS.map((format) => (
                                                <option key={format.value} value={format.value}>
                                                    {format.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="flex justify-center">
                                        <div className="bg-secondary p-2 rounded-full shadow-glow-sm">
                                            <ArrowRight className="h-6 w-6 text-primary" />
                                        </div>
                                    </div>

                                    <div>
                                        <label htmlFor="output-format" className="block text-sm font-medium mb-2 text-foreground">
                                            Output Format
                                        </label>
                                        <select
                                            id="output-format"
                                            className="w-full bg-secondary border border-border rounded-md px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-foreground"
                                            value={outputFormat}
                                            onChange={(e) => setOutputFormat(e.target.value)}
                                        >
                                            {FORMATS.map((format) => (
                                                <option key={format.value} value={format.value}>
                                                    {format.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Action area */}
                            <div className="mt-8 pt-4 border-t border-border">
                                {/* Convert button */}
                                {!convertMutation.isPending && !downloadUrl && (
                                    <Button
                                        onClick={handleConvert}
                                        className="w-full h-12 text-base bg-primary hover:bg-primary-dark hover:shadow-glow transition-all"
                                        disabled={inputFormat === outputFormat}
                                    >
                                        Convert to {FORMATS.find(f => f.value === outputFormat)?.label}
                                    </Button>
                                )}

                                {/* Loading state */}
                                {convertMutation.isPending && (
                                    <div className="p-6 bg-secondary/30 rounded-lg border border-primary/30 shadow-glow-sm">
                                        <div className="flex items-center justify-center mb-4">
                                            <Loader2 className="h-7 w-7 text-primary animate-spin mr-3" />
                                            <span className="font-medium text-primary-light">Converting...</span>
                                        </div>
                                        <div className="w-full bg-muted rounded-full h-3 mb-2">
                                            <div
                                                className="bg-primary rounded-full h-3 transition-all duration-300"
                                                style={{
                                                    width: `${progress}%`,
                                                    boxShadow: '0 0 10px rgba(168, 85, 247, 0.7)'
                                                }}
                                            />
                                        </div>
                                        <p className="text-xs text-center text-muted-foreground font-medium">{progress}% complete</p>
                                    </div>
                                )}

                                {/* Download section */}
                                {downloadUrl && (
                                    <div className="text-center p-6 bg-secondary/30 rounded-lg border border-primary/50 shadow-glow">
                                        <div className="inline-flex items-center mb-4 text-primary">
                                            <Check className="h-6 w-6 mr-2" />
                                            <span className="font-medium text-lg">Conversion complete</span>
                                        </div>
                                        <div className="flex flex-col space-y-4 mt-2">
                                            <a
                                                href={downloadUrl}
                                                download={outputFileName}
                                                className="inline-flex items-center justify-center px-4 py-3 rounded-md text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary hover:shadow-glow transition-all"
                                            >
                                                <Download className="h-5 w-5 mr-2" />
                                                Download {outputFileName}
                                            </a>
                                            {outputFormat === 'pdf' && (
                                                <>
                                                    <a
                                                        href={downloadUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center justify-center px-4 py-3 rounded-md text-primary bg-secondary hover:bg-secondary-dark focus:outline-none focus:ring-2 focus:ring-primary hover:shadow-glow transition-all"
                                                    >
                                                        <Eye className="h-5 w-5 mr-2" />
                                                        Preview PDF
                                                    </a>
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowPdfPreview(!showPdfPreview)}
                                                        className="inline-flex items-center justify-center px-4 py-3 rounded-md text-primary bg-secondary hover:bg-secondary-dark focus:outline-none focus:ring-2 focus:ring-primary hover:shadow-glow transition-all"
                                                    >
                                                        {showPdfPreview ? 'Hide Embedded Preview' : 'Show Embedded Preview'}
                                                    </button>
                                                    {showPdfPreview && pdfBlob && (
                                                        <div className="mt-4 border border-border rounded-lg overflow-hidden">
                                                            <iframe
                                                                src={URL.createObjectURL(pdfBlob)}
                                                                title="PDF Preview"
                                                                className="w-full h-[500px]"
                                                            />
                                                        </div>
                                                    )}
                                                </>
                                            )}
                                            <button
                                                type='button'
                                                onClick={() => setDownloadUrl('')}
                                                className="text-sm text-primary-light hover:text-primary hover:text-glow mt-2"
                                            >
                                                Convert another
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Error state */}
                                {convertMutation.isError && (
                                    <div className="p-6 bg-secondary/30 border border-destructive/40 rounded-lg">
                                        <div className="flex items-center text-destructive mb-3">
                                            <AlertCircle className="h-6 w-6 mr-2" />
                                            <span className="font-medium">Conversion failed</span>
                                        </div>
                                        <p className="text-sm text-destructive/90 mb-4">
                                            There was an error converting your file. Please try again or try a different format.
                                        </p>
                                        <Button
                                            onClick={() => convertMutation.reset()}
                                            className="mt-2 border border-primary/30"
                                            variant="outline"
                                        >
                                            Try Again
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}