import sharp from "sharp";

/**
 * Traite un logo pour supprimer le fond blanc et créer une transparence
 * Convertit en PNG transparent et redimensionne si nécessaire
 */
export async function processLogoImage(buffer: Buffer): Promise<Buffer> {
	try {
		// Charger l'image
		let image = sharp(buffer);
		const metadata = await image.metadata();

		// Vérifier le format
		if (metadata.format === "svg") {
			// Pour SVG, convertir en PNG transparent
			return await sharp(buffer).png({ quality: 90 }).toBuffer();
		}

		// Pour les images raster (PNG, JPG, WEBP)
		let processed = await image
			// Ensurer canal alpha (transparence)
			.ensureAlpha()
			// Convertir en sRGB si nécessaire
			.toColorspace("srgb")
			.toBuffer({ resolveWithObject: true });

		// Créer une copie pour traitement pixel
		const { data, info } = await sharp(buffer)
			.ensureAlpha()
			.raw()
			.toBuffer({ resolveWithObject: true });

		// Suppression du fond blanc/clair par seuillage
		// On rend transparent tous les pixels très clairs (R, G, B > 240)
		for (let i = 0; i < data.length; i += 4) {
			const r = data[i];
			const g = data[i + 1];
			const b = data[i + 2];
			const a = data[i + 3];

			// Si le pixel est très clair (blanc/quasi-blanc), le rendre transparent
			if (r > 240 && g > 240 && b > 240) {
				data[i + 3] = 0; // alpha = 0 (transparent)
			}
		}

		// Convertir les pixels bruts en PNG
		let result = sharp(data, {
			raw: {
				width: info.width,
				height: info.height,
				channels: 4,
			},
		})
			// Redimensionner si trop grand (max 400px)
			.resize(400, 300, {
				fit: "inside",
				withoutEnlargement: true,
			})
			.png({ quality: 90 });

		return await result.toBuffer();
	} catch (error) {
		console.error("[ImageProcessing] Erreur traitement logo:", error);
		// En cas d'erreur, retourner l'image originale
		return buffer;
	}
}

/**
 * Valide et optimise une image pour galerie
 * Redimensionne et compresse sans modifier la transparence
 */
export async function optimizeGalleryImage(
	buffer: Buffer,
	maxWidth: number = 800
): Promise<Buffer> {
	try {
		return await sharp(buffer)
			.resize(maxWidth, 600, {
				fit: "inside",
				withoutEnlargement: true,
			})
			.webp({ quality: 80 })
			.toBuffer();
	} catch (error) {
		console.error("[ImageProcessing] Erreur optimisation galerie:", error);
		return buffer;
	}
}
