import sharp from "sharp";

export async function processLogoImage(buffer: Buffer): Promise<Buffer> {
	try {
		const metadata = await sharp(buffer).metadata();

		if (metadata.format === "svg") {
			return await sharp(buffer, { density: 300 })
				.resize({ width: 1000 })
				.webp({ quality: 90, effort: 6 })
				.toBuffer();
		}

		const { data, info } = await sharp(buffer)
			.ensureAlpha()
			.toColorspace("srgb")
			.raw()
			.toBuffer({ resolveWithObject: true });

		for (let i = 0; i < data.length; i += 4) {
			const r = data[i];
			const g = data[i + 1];
			const b = data[i + 2];
			if (r > 240 && g > 240 && b > 240) {
				data[i + 3] = 0;
			}
		}

		return await sharp(data, {
			raw: { width: info.width, height: info.height, channels: 4 },
		})
			.resize({ width: 1000, withoutEnlargement: true })
			.webp({ quality: 90, effort: 6 })
			.toBuffer();
	} catch (error) {
		console.error("[ImageProcessing] Erreur traitement logo:", error);
		return buffer;
	}
}

export async function optimizeGalleryImage(
	buffer: Buffer,
	maxWidth: number = 1200
): Promise<Buffer> {
	try {
		return await sharp(buffer)
			.resize({ width: maxWidth, withoutEnlargement: true })
			.webp({ quality: 90, effort: 6 })
			.toBuffer();
	} catch (error) {
		console.error("[ImageProcessing] Erreur optimisation galerie:", error);
		return buffer;
	}
}
