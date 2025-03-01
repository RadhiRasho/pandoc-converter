import { type ExecException, exec } from "node:child_process";
import fs from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import type { NextRequest } from "next/server";

const execPromise = promisify(exec);

// Map file extensions to pandoc format names
function getPandocFormat(format: string): string {
	const formatMap: Record<string, string> = {
		md: "markdown",
		markdown: "markdown",
		html: "html",
		docx: "docx",
		tex: "latex",
		rst: "rst",
		// Add other format mappings as needed
	};

	return formatMap[format.toLowerCase()] || format;
}

export async function POST(request: NextRequest) {
	try {
		const formData = await request.formData();
		const file = formData.get("file") as File;
		const inputFormat = formData.get("inputFormat") as string;
		const outputFormat = formData.get("outputFormat") as string;
		const conversionId = formData.get("conversionId") as string;

		console.log("file", file);

		if (!file || !inputFormat || !outputFormat || !conversionId) {
			return new Response(
				JSON.stringify({ error: "Missing required parameters" }),
				{
					status: 400,
					headers: { "Content-Type": "application/json" },
				},
			);
		}

		// Create temporary directory for processing
		const tempDir = path.join(process.cwd(), "tmp");
		if (!fs.existsSync(tempDir)) {
			await mkdir(tempDir, { recursive: true });
		}

		// Generate filenames
		const inputFilename = `input-${conversionId}.${inputFormat}`;
		const outputFilename = `output-${conversionId}.${outputFormat}`;

		const inputPath = path.join(tempDir, inputFilename);
		const outputPath = path.join(tempDir, outputFilename);

		// Write uploaded file to disk
		const buffer = Buffer.from(await file.arrayBuffer());
		await writeFile(inputPath, buffer);

		// Check if pandoc is installed
		try {
			const { stdout } = await execPromise("pandoc --version");
			console.log("Pandoc version:", stdout.split("\n")[0]);
		} catch (error) {
			console.error("Pandoc not found:", error);
			return new Response(
				JSON.stringify({
					error: "Pandoc is not installed or not in PATH",
				}),
				{
					status: 500,
					headers: { "Content-Type": "application/json" },
				},
			);
		}

		// Create a media directory for images
		const mediaDir = path.join(tempDir, `media-${conversionId}`);
		if (!fs.existsSync(mediaDir)) {
			await mkdir(mediaDir, { recursive: true });
		}

		let command = "";

		// Use the standardized command format for all PDF conversions
		if (outputFormat === "pdf") {
			// Check for PDF dependencies
			try {
				await execPromise("which xelatex");
			} catch (latexError) {
				console.error("xelatex not found:", latexError);
				return new Response(
					JSON.stringify({
						error: "PDF conversion requires xelatex, but it's not installed",
					}),
					{
						status: 500,
						headers: { "Content-Type": "application/json" },
					},
				);
			}

			// Using the exact command format specified
			command = `pandoc "${inputPath}" --pdf-engine=xelatex -V geometry:"margin=1in" -V fontsize=12pt --standalone -f markdown-implicit_figures --variable=graphics:1 --variable=float-placement-figure:H -o "${outputPath}"`;
		} else {
			// For non-PDF formats, use direct conversion
			const pandocInputFormat = getPandocFormat(inputFormat);
			const pandocOutputFormat = getPandocFormat(outputFormat);
			command = `pandoc "${inputPath}" -f ${pandocInputFormat} -t ${pandocOutputFormat} -o "${outputPath}" --extract-media="${mediaDir}" --standalone`;
		}

		console.log("Executing command:", command);

		try {
			const { stdout, stderr } = await execPromise(command);
			if (stderr) {
				console.log("Pandoc stderr (warnings):", stderr);
			}
			if (stdout) {
				console.log("Pandoc stdout:", stdout);
			}
		} catch (execError: unknown) {
			console.error("Pandoc execution error:", execError);
			// Include stderr in the response for better debugging
			const errorMessage =
				execError instanceof Error && "stderr" in execError
					? (execError as ExecException).stderr
					: "Unknown pandoc error";
			return new Response(
				JSON.stringify({
					error: `Pandoc conversion failed: ${errorMessage}`,
				}),
				{
					status: 500,
					headers: { "Content-Type": "application/json" },
				},
			);
		}

		// Check if output file exists
		if (!fs.existsSync(outputPath)) {
			return new Response(
				JSON.stringify({
					error: "Conversion failed: Output file not created",
				}),
				{
					status: 500,
					headers: { "Content-Type": "application/json" },
				},
			);
		}

		return new Response(
			JSON.stringify({
				success: true,
				filename: outputFilename,
			}),
			{
				status: 200,
				headers: { "Content-Type": "application/json" },
			},
		);
	} catch (error) {
		console.error("API conversion error:", error);
		return new Response(
			JSON.stringify({
				error: "Failed to convert document. Please try again.",
			}),
			{
				status: 500,
				headers: { "Content-Type": "application/json" },
			},
		);
	}
}
