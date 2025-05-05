import { spawn } from "node:child_process";

/**
 * Interface for conversion handlers
 */
export interface ConversionHandler {
	getCommand(inputPath: string, outputPath: string): string[];
	contentType: string;
	extension: string;
}

/**
 * Format information including extensions and content types
 */
export const FORMAT_INFO: Record<string, { ext: string; contentType: string }> =
	{
		// Document formats
		markdown: { ext: ".md", contentType: "text/markdown" },
		html: { ext: ".html", contentType: "text/html" },
		pdf: { ext: ".pdf", contentType: "application/pdf" },
		docx: {
			ext: ".docx",
			contentType:
				"application/vnd.openxmlformats-officedocument.wordprocessingml.document",
		},
		odt: {
			ext: ".odt",
			contentType: "application/vnd.oasis.opendocument.text",
		},
		rtf: { ext: ".rtf", contentType: "application/rtf" },
		latex: { ext: ".tex", contentType: "application/x-latex" },
		epub: { ext: ".epub", contentType: "application/epub+zip" },

		// Image formats
		png: { ext: ".png", contentType: "image/png" },
		jpg: { ext: ".jpg", contentType: "image/jpeg" },
		tiff: { ext: ".tiff", contentType: "image/tiff" },
		bmp: { ext: ".bmp", contentType: "image/bmp" },
		gif: { ext: ".gif", contentType: "image/gif" },
	};

/**
 * Helper to check if a format is an image format
 */
export const isImageFormat = (format: string): boolean => {
	return ["png", "jpg", "jpeg", "tiff", "bmp", "gif"].includes(
		format.toLowerCase(),
	);
};

/**
 * Base document conversion handler using Pandoc
 */
class DefaultDocumentHandler implements ConversionHandler {
	contentType: string;
	extension: string;

	constructor(
		private inputFormat: string,
		private outputFormat: string,
	) {
		this.contentType =
			FORMAT_INFO[outputFormat]?.contentType || "application/octet-stream";
		this.extension = FORMAT_INFO[outputFormat]?.ext || `.${outputFormat}`;
	}

	getCommand(inputPath: string, outputPath: string): string[] {
		return [
			"pandoc",
			"-f",
			this.inputFormat,
			"-t",
			this.outputFormat,
			"-o",
			outputPath,
			inputPath,
		];
	}
}

/**
 * Handler for PDF output with special formatting options
 */
class PdfOutputHandler implements ConversionHandler {
	contentType = "application/pdf";
	extension = ".pdf";

	constructor(private inputFormat: string) {}

	getCommand(inputPath: string, outputPath: string): string[] {
		return [
			"pandoc",
			"-f",
			this.inputFormat,
			"--variable=geometry:left=1in,right=1in,top=0.5in,bottom=0.5in",
			"--variable=papersize=letter",
			"--variable=fontsize=12pt",
			"--variable=block-headings",
			"--variable=widowpenalty=10000",
			"--variable=clubpenalty=10000",
			"-o",
			outputPath,
			inputPath,
		];
	}
}

/**
 * Handler for PDF input conversions
 */
class PdfInputHandler implements ConversionHandler {
	contentType: string;
	extension: string;

	constructor(private outputFormat: string) {
		this.contentType =
			FORMAT_INFO[outputFormat]?.contentType || "application/octet-stream";
		this.extension = FORMAT_INFO[outputFormat]?.ext || `.${outputFormat}`;
	}

	getCommand(inputPath: string, outputPath: string): string[] {
		const command = [
			"pandoc",
			"-f",
			"pdf",
			"-t",
			this.outputFormat,
			"--extract-media=./media",
		];

		// Add format-specific options
		switch (this.outputFormat) {
			case "docx":
				command.push("--reference-doc=default", "--toc", "--standalone");
				break;
			case "html":
				command.push(
					"--standalone",
					"--metadata=title:Converted Document",
					"--css=default",
					"--embed-resources",
				);
				break;
			case "markdown":
				command.push("--wrap=none", "--standalone", "--atx-headers");
				break;
			case "odt":
			case "rtf":
				command.push("--standalone");
				break;
		}

		// Add output and input paths
		command.push("-o", outputPath, inputPath);
		return command;
	}
}

/**
 * Handler for image conversions using ImageMagick
 */
class ImageConversionHandler implements ConversionHandler {
	contentType: string;
	extension: string;

	constructor(
		private inputFormat: string,
		private outputFormat: string,
	) {
		this.contentType = FORMAT_INFO[outputFormat]?.contentType || "image/jpeg";
		this.extension = FORMAT_INFO[outputFormat]?.ext || `.${outputFormat}`;
	}

	getCommand(inputPath: string, outputPath: string): string[] {
		const command = ["convert", inputPath];

		// Add format-specific options
		if (this.outputFormat === "jpg" || this.outputFormat === "jpeg") {
			command.push("-quality", "90");
		} else if (this.outputFormat === "png") {
			command.push("-compress", "Zip");
		}

		command.push(outputPath);
		return command;
	}
}

/**
 * Special handler for RTF to DOCX conversions
 */
class RtfToDocxHandler implements ConversionHandler {
	contentType =
		"application/vnd.openxmlformats-officedocument.wordprocessingml.document";
	extension = ".docx";

	getCommand(inputPath: string, outputPath: string): string[] {
		return [
			"pandoc",
			"-f",
			"rtf",
			"-t",
			"docx",
			"--reference-doc=default",
			"-o",
			outputPath,
			inputPath,
		];
	}
}

/**
 * Special handler for HTML to DOCX conversions
 */
class HtmlToDocxHandler implements ConversionHandler {
	contentType =
		"application/vnd.openxmlformats-officedocument.wordprocessingml.document";
	extension = ".docx";

	getCommand(inputPath: string, outputPath: string): string[] {
		return [
			"pandoc",
			"-f",
			"html",
			"-t",
			"docx",
			"--extract-media=.",
			"-o",
			outputPath,
			inputPath,
		];
	}
}

/**
 * Map of conversion handlers based on input and output formats
 */
const handlerMap = new Map<string, ConversionHandler>();

/**
 * Helper to get a key for the handler map
 */
const getHandlerKey = (inputFormat: string, outputFormat: string): string => {
	return `${inputFormat.toLowerCase()}-to-${outputFormat.toLowerCase()}`;
};

/**
 * Gets the appropriate conversion handler for the given formats
 */
export const getConversionHandler = (
	inputFormat: string,
	outputFormat: string,
): ConversionHandler => {
	const key = getHandlerKey(inputFormat, outputFormat);

	// Return cached handler if available
	if (handlerMap.has(key)) {
		// We know the key exists due to the `has` check, so `get` will return a value.
		return handlerMap.get(key) as ConversionHandler;
	}

	// Create and cache a new handler
	let handler: ConversionHandler;

	// Handle image conversions
	if (isImageFormat(inputFormat) && isImageFormat(outputFormat)) {
		handler = new ImageConversionHandler(inputFormat, outputFormat);
	}
	// Handle special cases
	else if (inputFormat === "rtf" && outputFormat === "docx") {
		handler = new RtfToDocxHandler();
	} else if (inputFormat === "html" && outputFormat === "docx") {
		handler = new HtmlToDocxHandler();
	}
	// Handle PDF output
	else if (outputFormat === "pdf") {
		handler = new PdfOutputHandler(inputFormat);
	}
	// Handle PDF input
	else if (inputFormat === "pdf") {
		handler = new PdfInputHandler(outputFormat);
	}
	// Default document handler
	else {
		handler = new DefaultDocumentHandler(inputFormat, outputFormat);
	}

	// Cache the handler
	handlerMap.set(key, handler);
	return handler;
};

/**
 * Execute a conversion command and return a promise
 */
export const executeConversion = async (
	command: string[],
	inputPath: string,
	outputPath: string,
): Promise<void> => {
	const converter = spawn(command[0], command.slice(1));
	let error = "";

	converter.stderr.on("data", (data) => {
		error += data.toString();
	});

	return new Promise((resolve, reject) => {
		converter.on("close", (code) => {
			if (code === 0) {
				resolve();
			} else {
				reject(new Error(`Conversion failed with code ${code}: ${error}`));
			}
		});
	});
};
