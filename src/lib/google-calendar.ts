import { google } from "googleapis";
import { createHmac } from "crypto";
import connectDB from "@/lib/db/mongodb";
import AdminModel from "@/models/Admin";

const SCOPES = ["https://www.googleapis.com/auth/calendar"];
const CALENDAR_NAME = "Binocles - RDV";
const TIMEZONE = "Europe/Paris";

function getOAuthClient() {
	return new google.auth.OAuth2(
		process.env.GOOGLE_CLIENT_ID,
		process.env.GOOGLE_CLIENT_SECRET,
		process.env.GOOGLE_REDIRECT_URI
	);
}

function signState(adminId: string): string {
	const secret = process.env.AUTH_SECRET || "";
	const timestamp = Date.now().toString(36);
	const payload = `${adminId}.${timestamp}`;
	const sig = createHmac("sha256", secret).update(payload).digest("hex").slice(0, 16);
	return `${payload}.${sig}`;
}

// Vérifie le state signé (anti-CSRF, expire après 10 min)
export function verifyState(state: string): string | null {
	try {
		const parts = state.split(".");
		if (parts.length !== 3) return null;

		const [adminId, timestamp, sig] = parts;
		const secret = process.env.AUTH_SECRET || "";
		const payload = `${adminId}.${timestamp}`;
		const expectedSig = createHmac("sha256", secret).update(payload).digest("hex").slice(0, 16);

		if (sig !== expectedSig) return null;

		const ts = parseInt(timestamp, 36);
		if (Date.now() - ts > 10 * 60 * 1000) return null;

		return adminId;
	} catch {
		return null;
	}
}

export function generateAuthUrl(adminId: string): string {
	const client = getOAuthClient();
	return client.generateAuthUrl({
		access_type: "offline",
		prompt: "consent",
		scope: SCOPES,
		state: signState(adminId),
	});
}

export async function exchangeCode(code: string) {
	const client = getOAuthClient();
	const { tokens } = await client.getToken(code);
	return {
		refreshToken: tokens.refresh_token || null,
		accessToken: tokens.access_token || null,
	};
}

function getAuthorizedClient(refreshToken: string) {
	const client = getOAuthClient();
	client.setCredentials({ refresh_token: refreshToken });
	return client;
}

export async function createDedicatedCalendar(refreshToken: string): Promise<string> {
	const auth = getAuthorizedClient(refreshToken);
	const calendar = google.calendar({ version: "v3", auth });

	const list = await calendar.calendarList.list();
	const existing = list.data.items?.find(
		(cal) => cal.summary === CALENDAR_NAME
	);
	if (existing?.id) return existing.id;

	const res = await calendar.calendars.insert({
		requestBody: {
			summary: CALENDAR_NAME,
			timeZone: TIMEZONE,
		},
	});

	return res.data.id!;
}

const TYPE_LABELS: Record<string, string> = {
	examen: "Examen de vue",
	vente: "Essayage / Vente",
	reparation: "Réparation / Ajustement",
};

interface RdvEventData {
	dateRdv: string; // "2026-03-15"
	heureDebut: string; // "10:00"
	heureFin: string; // "11:00"
	typeRdv: string;
	nom: string;
	prenom: string;
	email: string;
	telephone: string;
	message?: string;
}

export async function createEvent(
	refreshToken: string,
	calendarId: string,
	data: RdvEventData
): Promise<string | null> {
	try {
		const auth = getAuthorizedClient(refreshToken);
		const calendar = google.calendar({ version: "v3", auth });

		const typeLabel = TYPE_LABELS[data.typeRdv] || data.typeRdv;
		const description = [
			`${typeLabel}`,
			`Client : ${data.prenom} ${data.nom}`,
			`Tél : ${data.telephone}`,
			`Email : ${data.email}`,
			data.message ? `\nMessage : ${data.message}` : "",
		]
			.filter(Boolean)
			.join("\n");

		const res = await calendar.events.insert({
			calendarId,
			requestBody: {
				summary: `${typeLabel} — ${data.prenom} ${data.nom}`,
				description,
				start: {
					dateTime: `${data.dateRdv}T${data.heureDebut}:00`,
					timeZone: TIMEZONE,
				},
				end: {
					dateTime: `${data.dateRdv}T${data.heureFin}:00`,
					timeZone: TIMEZONE,
				},
				reminders: {
					useDefault: false,
					overrides: [{ method: "popup", minutes: 15 }],
				},
			},
		});

		console.log(`[Calendar] Event created: ${res.data.id}`);
		return res.data.id || null;
	} catch (error) {
		console.error("[Calendar] Failed to create event:", error);
		return null;
	}
}

export async function deleteEvent(
	refreshToken: string,
	calendarId: string,
	eventId: string
): Promise<void> {
	try {
		const auth = getAuthorizedClient(refreshToken);
		const calendar = google.calendar({ version: "v3", auth });

		await calendar.events.delete({ calendarId, eventId });
		console.log(`[Calendar] Event deleted: ${eventId}`);
	} catch (error) {
		console.error("[Calendar] Failed to delete event:", error);
	}
}

export async function getConnectedAdmin() {
	await connectDB();
	return AdminModel.findOne({
		googleRefreshToken: { $exists: true, $ne: null },
		googleCalendarId: { $exists: true, $ne: null },
	}).lean();
}
