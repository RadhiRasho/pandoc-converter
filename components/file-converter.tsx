"use client";

import { convertDocument } from "@/app/actions";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DownloadIcon,
  FileIcon,
  RefreshCwIcon,
  UploadIcon,
} from "lucide-react";
import { type ChangeEvent, useState } from "react";

const INPUT_FORMATS = [
  { value: "docx", label: "Microsoft Word (.docx)" },
  { value: "md", label: "Markdown (.md)" },
  { value: "html", label: "HTML (.html)" },
  { value: "odt", label: "OpenDocument Text (.odt)" },
  { value: "tex", label: "LaTeX (.tex)" },
  { value: "rtf", label: "Rich Text Format (.rtf)" },
];

const OUTPUT_FORMATS = [
  { value: "pdf", label: "PDF (.pdf)" },
  { value: "docx", label: "Microsoft Word (.docx)" },
  { value: "md", label: "Markdown (.md)" },
  { value: "html", label: "HTML (.html)" },
  { value: "odt", label: "OpenDocument Text (.odt)" },
  { value: "tex", label: "LaTeX (.tex)" },
  { value: "rtf", label: "Rich Text Format (.rtf)" },
  { value: "epub", label: "EPUB E-Book (.epub)" },
];

export function FileConverter() {
  const [file, setFile] = useState<File | null>(null);
  const [inputFormat, setInputFormat] = useState<string>("");
  const [outputFormat, setOutputFormat] = useState<string>("");
  const [convertedFile, setConvertedFile] = useState<string | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);

      // Try to detect format from file extension
      const extension = selectedFile.name.split(".").pop()?.toLowerCase() || "";
      if (INPUT_FORMATS.some((format) => format.value === extension)) {
        setInputFormat(extension);
      }
    }
  };

  const handleConvert = async () => {
    if (!file || !inputFormat || !outputFormat) {
      setError("Please select a file and both input and output formats");
      return;
    }

    setError(null);
    setIsConverting(true);
    setProgress(10);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("inputFormat", inputFormat);
      formData.append("outputFormat", outputFormat);

      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 10, 90));
      }, 300);

      const result = await convertDocument(formData);

      clearInterval(progressInterval);
      setProgress(100);

      if (result.error) {
        setError(result.error);
        setConvertedFile(null);
      } else {
        setConvertedFile(result.url || null);
      }
    } catch (err) {
      setError("An error occurred during conversion. Please try again.");
      console.error(err);
    } finally {
      setIsConverting(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setInputFormat("");
    setOutputFormat("");
    setConvertedFile(null);
    setError(null);
    setProgress(0);
  };

  return (
    <Card className="shadow-lg">
      <CardContent className="pt-6">
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-6">
          {!convertedFile ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="file">Upload Document</Label>
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <div
                      className="border-2 border-dashed rounded-md p-6 text-center cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() =>
                        document.getElementById("file-upload")?.click()
                      }
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          document.getElementById("file-upload")?.click();
                        }
                      }}
                      aria-label="Upload file"
                    >
                      <input
                        id="file-upload"
                        type="file"
                        className="hidden"
                        onChange={handleFileChange}
                      />
                      <div className="flex flex-col items-center gap-2">
                        <UploadIcon className="h-8 w-8 text-muted-foreground" />
                        {file ? (
                          <div className="flex items-center gap-2">
                            <FileIcon className="h-4 w-4" />
                            <span className="font-medium">{file.name}</span>
                          </div>
                        ) : (
                          <p className="text-muted-foreground">
                            Click to upload or drag and drop
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="input-format">Input Format</Label>
                  <Select value={inputFormat} onValueChange={setInputFormat}>
                    <SelectTrigger id="input-format">
                      <SelectValue placeholder="Select input format" />
                    </SelectTrigger>
                    <SelectContent>
                      {INPUT_FORMATS.map((format) => (
                        <SelectItem key={format.value} value={format.value}>
                          {format.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="output-format">Output Format</Label>
                  <Select value={outputFormat} onValueChange={setOutputFormat}>
                    <SelectTrigger id="output-format">
                      <SelectValue placeholder="Select output format" />
                    </SelectTrigger>
                    <SelectContent>
                      {OUTPUT_FORMATS.map((format) => (
                        <SelectItem key={format.value} value={format.value}>
                          {format.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button
                className="w-full"
                onClick={handleConvert}
                disabled={
                  !file || !inputFormat || !outputFormat || isConverting
                }
              >
                {isConverting ? (
                  <>
                    <RefreshCwIcon className="mr-2 h-4 w-4 animate-spin" />
                    Converting...
                  </>
                ) : (
                  "Convert Document"
                )}
              </Button>

              {isConverting && (
                <div className="space-y-2">
                  <Progress value={progress} className="h-2" />
                  <p className="text-xs text-center text-muted-foreground">
                    Converting document... {progress}%
                  </p>
                </div>
              )}
            </>
          ) : (
            <div className="space-y-4">
              <div className="rounded-md bg-muted p-6 text-center">
                <div className="flex flex-col items-center gap-2">
                  <FileIcon className="h-12 w-12 text-primary" />
                  <h3 className="font-medium text-lg">Conversion Complete!</h3>
                  <p className="text-muted-foreground">
                    Your document has been successfully converted
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  className="flex-1"
                  onClick={() => window.open(convertedFile, "_blank")}
                >
                  <DownloadIcon className="mr-2 h-4 w-4" />
                  Download
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={handleReset}
                >
                  <RefreshCwIcon className="mr-2 h-4 w-4" />
                  Convert Another
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
