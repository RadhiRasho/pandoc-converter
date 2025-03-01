import { type NextRequest, NextResponse } from "next/server"
import fs from "fs"
import path from "path"

// Explicitly set runtime to nodejs
export const runtime = "nodejs"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const filename = searchParams.get("file")

    if (!filename) {
      return NextResponse.json({ error: "No file specified" }, { status: 400 })
    }

    // Validate filename to prevent directory traversal attacks
    if (filename.includes("..") || filename.includes("/") || filename.includes("\\")) {
      return NextResponse.json({ error: "Invalid filename" }, { status: 400 })
    }

    const filePath = path.join(process.cwd(), "tmp", filename)

    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: "File not found" }, { status: 404 })
    }

    const fileBuffer = fs.readFileSync(filePath)
    const fileExtension = path.extname(filename).substring(1)

    // Map file extensions to MIME types
    const mimeTypes: Record<string, string> = {
      pdf: "application/pdf",
      docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      md: "text/markdown",
      html: "text/html",
      odt: "application/vnd.oasis.opendocument.text",
      tex: "application/x-tex",
      rtf: "application/rtf",
      epub: "application/epub+zip",
    }

    const contentType = mimeTypes[fileExtension] || "application/octet-stream"

    // Set appropriate headers for file download
    const headers = new Headers()
    headers.set("Content-Type", contentType)
    headers.set("Content-Disposition", `attachment; filename="converted.${fileExtension}"`)

    // In a production environment, you would want to delete the file after sending
    // or implement a cleanup job for temporary files

    return new NextResponse(fileBuffer, {
      status: 200,
      headers,
    })
  } catch (error) {
    console.error("Download error:", error)
    return NextResponse.json({ error: "Failed to download file" }, { status: 500 })
  }
}

