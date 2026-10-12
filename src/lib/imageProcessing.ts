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
			.rotate()
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

/**
 * Lit les dimensions finales d'une image (après rotation EXIF éventuelle).
 * @param buffer - image encodée (jpeg, png, webp, svg)
 * @returns largeur et hauteur en pixels, ou undefined si illisible
 */
export async function getImageDimensions(
	buffer: Buffer
): Promise<{ width: number; height: number } | undefined> {
	try {
		const { width, height } = await sharp(buffer).metadata();
		if (!width || !height) return undefined;
		return { width, height };
	} catch (error) {
		console.error("[ImageProcessing] Erreur lecture dimensions:", error);
		return undefined;
	}
}

export async function optimizeGalleryImage(
	buffer: Buffer,
	maxWidth: number = 1200,
	crop: boolean = false
): Promise<Buffer> {
	try {
		const height = crop ? Math.round((maxWidth / 4) * 3) : undefined;
		// rotate() sans argument applique l'orientation EXIF (photos de téléphone)
		// avant la conversion en WebP, qui supprime cette métadonnée
		return await sharp(buffer)
			.rotate()
			.resize({
				width: maxWidth,
				height,
				fit: crop ? "cover" : "inside",
				position: crop ? "attention" : undefined,
				withoutEnlargement: true,
			})
			.webp({ quality: 90, effort: 6 })
			.toBuffer();
	} catch (error) {
		console.error("[ImageProcessing] Erreur optimisation galerie:", error);
		return buffer;
	}
}
