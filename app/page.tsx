import { FileConverter } from "@/components/file-converter"

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 md:p-24 bg-gray-50 dark:bg-gray-900">
      <div className="w-full max-w-3xl">
        <h1 className="text-3xl md:text-4xl font-bold text-center mb-2">Document Converter</h1>
        <p className="text-muted-foreground text-center mb-8">
          Convert documents between different formats using Pandoc
        </p>
        <FileConverter />
      </div>
    </main>
  )
}

