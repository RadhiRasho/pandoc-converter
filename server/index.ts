import { exec, spawn } from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { promisify } from "node:util";
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";

// Create Hono app
const app = new Hono();

// Enable CORS
app.use(
	cors({
		origin: "*",
		allowMethods: ["GET", "POST", "OPTIONS"],
		allowHeaders: ["Content-Type", "Authorization"],
		maxAge: 86400,
	}),
);

// Create uploads directory
const UPLOAD_DIR = path.join(os.tmpdir(), "pandoc-converter");
if (!fs.existsSync(UPLOAD_DIR)) {
	fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Check if Pandoc is installed
const execAsync = promisify(exec);
app.get("/api/check-pandoc", async (c) => {
	try {
		const { stdout } = await execAsync("pandoc --version");
		return c.json({
			installed: true,
			version: stdout.split("\n")[0].replace("pandoc ", ""),
		});
	} catch (error) {
		return c.json({ installed: false }, 500);
	}
});

// File conversion endpoint
app.post("/api/convert", async (c) => {
	try {
		const formData = await c.req.formData();
		const file = formData.get("file") as File;
		const inputFormat = formData.get("inputFormat") as string;
		const outputFormat = formData.get("outputFormat") as string;

		if (!file || !inputFormat || !outputFormat) {
			return c.json({ error: "Missing required parameters" }, 400);
		}

		// Save uploaded file to temp directory
		const fileBuffer = Buffer.from(await file.arrayBuffer());
		const fileExt = path.extname(file.name);
		const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}${fileExt}`;
		const filePath = path.join(UPLOAD_DIR, fileName);

		fs.writeFileSync(filePath, fileBuffer);

		// Determine output file path and extension
		const outputExt =
			outputFormat === "markdown"
				? ".md"
				: outputFormat === "html"
					? ".html"
					: outputFormat === "pdf"
						? ".pdf"
						: outputFormat === "docx"
							? ".docx"
							: outputFormat === "latex"
								? ".tex"
								: outputFormat === "epub"
									? ".epub"
									: ".txt";

		const outputFileName = `${path.basename(fileName, fileExt)}${outputExt}`;
		const outputFilePath = path.join(UPLOAD_DIR, outputFileName);

		// Build pandoc command
		let command = [
			"pandoc",
			"-f",
			inputFormat,
			"-t",
			outputFormat,
			"-o",
			outputFilePath,
			filePath,
		];

		// Add special options for PDF output
		if (outputFormat === "pdf") {
			command = [
				"pandoc",
				"-f",
				inputFormat,
				"--variable=geometry:left=1in,right=1in,top=0.5in,bottom=0.5in",
				"--variable=papersize=letter",
				"--variable=fontsize=12pt",
				"--variable=block-headings",
				"--variable=widowpenalty=10000",
				"--variable=clubpenalty=10000",
				"-o",
				outputFilePath,
				filePath,
			];
		}

		// Execute pandoc command
		const pandoc = spawn(command[0], command.slice(1));

		let error = "";

		pandoc.stderr.on("data", (data) => {
			error += data.toString();
		});

		await new Promise((resolve, reject) => {
			pandoc.on("close", (code) => {
				if (code === 0) {
					resolve(true);
				} else {
					reject(new Error(`Pandoc failed with code ${code}: ${error}`));
				}
			});
		});

		// Check if the output file exists
		if (!fs.existsSync(outputFilePath)) {
			throw new Error("Conversion failed: Output file was not created");
		}

		// Send the file
		const outputFileStream = fs.readFileSync(outputFilePath);

		// Set the appropriate Content-Type
		let contentType = "application/octet-stream";
		if (outputFormat === "html") contentType = "text/html";
		else if (outputFormat === "markdown") contentType = "text/markdown";
		else if (outputFormat === "pdf") contentType = "application/pdf";
		else if (outputFormat === "docx")
			contentType =
				"application/vnd.openxmlformats-officedocument.wordprocessingml.document";

		// Clean up temp files
		setTimeout(() => {
			try {
				fs.unlinkSync(filePath);
				fs.unlinkSync(outputFilePath);
			} catch (error) {
				console.error("Error cleaning up temp files:", error);
			}
		}, 60000); // Clean up after 1 minute

		return new Response(outputFileStream, {
			headers: {
				"Content-Type": contentType,
				"Content-Disposition": `attachment; filename="${path.basename(file.name, fileExt)}${outputExt}"`,
			},
		});
	} catch (error) {
		console.error("Conversion error:", error);
		return c.json(
			{
				error:
					error instanceof Error ? error.message : "Unknown error occurred",
			},
			500,
		);
	}
});

// Health check endpoint
app.get("/api/health", (c) => {
	return c.json({ status: "ok" });
});

// Start the server
const port = process.env.PORT || 3001;
console.log(`Server is running on port ${port}`);

serve({
	fetch: app.fetch,
	port: Number(port),
});
