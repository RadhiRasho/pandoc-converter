"use server";
import { headers } from "next/headers";
import { v4 as uuidv4 } from "uuid";

export async function convertDocument(formData: FormData) {
	try {
		const file = formData.get("file") as File;
		const inputFormat = formData.get("inputFormat") as string;
		const outputFormat = formData.get("outputFormat") as string;

		if (!file || !inputFormat || !outputFormat) {
			return { error: "Missing required parameters" };
		}

		// Generate a unique ID for this conversion
		const conversionId = uuidv4();

		// Create FormData to send to our API route
		const apiFormData = new FormData();
		apiFormData.append("file", file);
		apiFormData.append("inputFormat", inputFormat);
		apiFormData.append("outputFormat", outputFormat);
		apiFormData.append("conversionId", conversionId);

		// Get the host and construct absolute URL
		const headersList = headers();
		const host = headersList.get("host") || "localhost:3000";
		const protocol = process.env.NODE_ENV === "development" ? "http" : "https";

		// Call our API route with absolute URL
		const response = await fetch(`${protocol}://${host}/api/convert`, {
			method: "POST",
			body: apiFormData,
		});

		const contentType = response.headers.get("content-type");
		if (contentType?.includes("application/json")) {
			const result = await response.json();
			if (result.error) {
				return { error: result.error };
			}
			return { url: `/api/download?file=${result.filename}` };
		}

		// If it's not JSON, read it as text
		const text = await response.text();
		console.error("Unexpected response:", text.substring(0, 200)); // Log first 200 characters
		return { error: `Server error: ${response.status} ${response.statusText}` };
	} catch (error) {
		console.error("Conversion error:", error);
		return { error: "Failed to convert document. Please try again." };
	}
}
