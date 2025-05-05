import { FileConverter } from '@/components/FileConverter'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const queryClient = new QueryClient()

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen flex flex-col bg-background text-foreground">
        <header className="bg-card py-8 shadow-glow">
          <div className="container mx-auto px-4">
            <div className="text-center">
              <h1 className="text-3xl font-bold mb-2 text-primary text-glow">Document Converter</h1>
              <p className="text-primary-light max-w-lg mx-auto opacity-90">
                Transform documents between various formats with ease using Pandoc
              </p>
            </div>
          </div>
        </header>

        <main className="flex justify-center h-full w-full mx-auto px-4 py-6 bg-gradient-to-b from-background to-secondary">
          <FileConverter />
        </main>

        <footer className="py-6 bg-card border-t border-border">
          <div className="container mx-auto px-4">
            <div className="flex flex-col items-center justify-center space-y-2">
              <p className="text-muted-foreground text-sm text-center">
                Powered by <span className="font-medium text-primary">Pandoc</span> | Built with Vite, React & Hono.js
              </p>
              <p className="text-muted-foreground text-xs">
                &copy; {new Date().getFullYear()} Document Converter
              </p>
            </div>
          </div>
        </footer>
      </div>
    </QueryClientProvider>
  )
}

export default App
