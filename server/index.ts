import { exec } from "node:child_process";
import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";
import { promisify } from "node:util";
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import {
	FORMAT_INFO,
	executeConversion,
	getConversionHandler,
} from "./conversion-handlers";

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
const UPLOAD_DIR = path.join(os.tmpdir(), "file-converter");
try {
	await fs.stat(UPLOAD_DIR);
} catch {
	fs.mkdir(UPLOAD_DIR, { recursive: true });
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

// Check if ImageMagick is installed
app.get("/api/check-imagemagick", async (c) => {
	try {
		const { stdout } = await execAsync("convert -version");
		return c.json({
			installed: true,
			version: stdout.split("\n")[0],
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

		await fs.writeFile(filePath, fileBuffer);

		// Get the appropriate conversion handler
		const handler = getConversionHandler(inputFormat, outputFormat);

		// Determine output file path and extension
		const outputExt = handler.extension;
		const outputFileName = `${path.basename(fileName, fileExt)}${outputExt}`;
		const outputFilePath = path.join(UPLOAD_DIR, outputFileName);

		// Build and execute the conversion command
		const command = handler.getCommand(filePath, outputFilePath);
		await executeConversion(command, filePath, outputFilePath);

		// Check if the output file exists
		try {
			await fs.stat(outputFilePath);
		} catch (error) {
			throw new Error("Conversion failed: Output file was not created");
		}

		// Send the file
		const outputFileStream = await fs.readFile(outputFilePath);

		// Set the appropriate Content-Type
		const contentType = handler.contentType;

		// Clean up temp files
		setTimeout(async () => {
			try {
				await fs.unlink(filePath);
				await fs.unlink(outputFilePath);
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
