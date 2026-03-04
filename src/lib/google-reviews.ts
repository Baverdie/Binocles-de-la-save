export interface GoogleReview {
  auteur: string;
  note: number;
  texte: string;
  date: string;
  photoUrl?: string;
}

export interface GooglePlaceData {
  rating: number;
  totalReviews: number;
  reviews: GoogleReview[];
  reviewUrl: string;
}

const PLACE_ID = process.env.GOOGLE_PLACE_ID!;
const API_KEY = process.env.GOOGLE_PLACES_API_KEY!;

export async function getGoogleReviews(): Promise<GooglePlaceData | null> {
  if (!PLACE_ID || !API_KEY) {
    console.warn("[Google Reviews] GOOGLE_PLACE_ID ou GOOGLE_PLACES_API_KEY manquant");
    return null;
  }

  try {
    const res = await fetch(
      `https://places.googleapis.com/v1/places/${PLACE_ID}?languageCode=fr`,
      {
        headers: {
          "X-Goog-Api-Key": API_KEY,
          "X-Goog-FieldMask": "rating,userRatingCount,reviews",
        },
        next: { revalidate: 86400 }, // Cache 24 heures
      }
    );

    if (!res.ok) {
      console.error("[Google Reviews] Erreur API:", res.status, await res.text());
      return null;
    }

    const data = await res.json();

    const reviews: GoogleReview[] = (data.reviews || []).map(
      (r: {
        authorAttribution?: { displayName?: string; photoUri?: string };
        rating?: number;
        text?: { text?: string };
        relativePublishTimeDescription?: string;
      }) => ({
        auteur: r.authorAttribution?.displayName || "Anonyme",
        note: r.rating || 5,
        texte: r.text?.text || "",
        date: r.relativePublishTimeDescription || "",
        photoUrl: r.authorAttribution?.photoUri || undefined,
      })
    );

    return {
      rating: data.rating || 0,
      totalReviews: data.userRatingCount || 0,
      reviews,
      reviewUrl: `https://search.google.com/local/writereview?placeid=${PLACE_ID}`,
    };
  } catch (error) {
    console.error("[Google Reviews] Erreur:", error);
    return null;
  }
}
