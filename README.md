# File Converter

A modern document conversion application built with Vite, React, React Query, and Hono.js to convert between various document formats.

## Features

- Convert between multiple document formats (Docx, pdf, etc.)
- Drag and drop file upload
- Real-time conversion progress tracking
- Clean, responsive UI built with TailwindCSS
- Separate frontend and backend architecture

## Prerequisites

Before running this application, you need to install:

1. [Node.js](https://nodejs.org/) (v16 or later)
2. [Pandoc](https://pandoc.org/installing.html) - The universal document converter

Check if Pandoc is installed correctly by running:

```bash
pandoc --version
```

## Getting Started

### Installation

1. Clone this repository
2. Install dependencies:

```bash
npm install
```

### Development

Run the development server (both frontend and backend):

```bash
npm run dev
```

This will start:

- Frontend: Vite dev server on <http://localhost:3000>
- Backend: Hono.js server on <http://localhost:3001>

### Building for Production

Build the application:

```bash
npm run build
```

Start the production server:

```bash
npm run start
```

## Tech Stack

- **Frontend**:
  - Vite
  - React
  - TanStack React Query
  - TailwindCSS

- **Backend**:
  - Hono.js
  - Node.js
  - Pandoc (external dependency)

## License

MIT
