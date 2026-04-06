import sharp from "sharp";

export async function processLogoImage(buffer: Buffer): Promise<Buffer> {
	try {
		let image = sharp(buffer);
		const metadata = await image.metadata();

		if (metadata.format === "svg") {
			return await sharp(buffer).png({ quality: 90 }).toBuffer();
		}

		await image
			.ensureAlpha()
			.toColorspace("srgb")
			.toBuffer({ resolveWithObject: true });

		const { data, info } = await sharp(buffer)
			.ensureAlpha()
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

		let result = sharp(data, {
			raw: {
				width: info.width,
				height: info.height,
				channels: 4,
			},
		})
			.resize(400, 300, {
				fit: "inside",
				withoutEnlargement: true,
			})
			.png({ quality: 90 });

		return await result.toBuffer();
	} catch (error) {
		console.error("[ImageProcessing] Erreur traitement logo:", error);
		return buffer;
	}
}

export async function optimizeGalleryImage(
	buffer: Buffer,
	maxWidth: number = 800
): Promise<Buffer> {
	try {
		return await sharp(buffer)
			.resize({ width: maxWidth, withoutEnlargement: true })
			.webp({ quality: 85 })
			.toBuffer();
	} catch (error) {
		console.error("[ImageProcessing] Erreur optimisation galerie:", error);
		return buffer;
	}
}
