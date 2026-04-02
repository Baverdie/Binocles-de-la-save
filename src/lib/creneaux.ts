import type {
	TypeRdv,
	Horaire,
	FermetureExceptionnelle,
	Vacances,
	PlageBloquee,
	OuvertureExceptionnelle,
} from "@/types";
import { DUREE_PAR_TYPE } from "@/types";

export interface ConfigCreneaux {
	durees: Record<TypeRdv, number>;
	marge: number;
	plagesBloquees: PlageBloquee[];
}

export const DEFAULT_CONFIG: ConfigCreneaux = {
	durees: { ...DUREE_PAR_TYPE },
	marge: 15,
	plagesBloquees: [],
};

interface RdvExistant {
	heureDebut: string;
	heureFin: string;
}

interface Plage {
	debut: number;
	fin: number;
}

export function toMinutes(time: string): number {
	const [h, m] = time.split(":").map(Number);
	return h * 60 + m;
}

export function fromMinutes(minutes: number): string {
	const h = Math.floor(minutes / 60);
	const m = minutes % 60;
	return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function calculerHeureFin(heureDebut: string, duree: number): string {
	return fromMinutes(toMinutes(heureDebut) + duree);
}

function sameDay(d1: Date | string, d2: Date | string): boolean {
	const a = new Date(d1).toISOString().slice(0, 10);
	const b = new Date(d2).toISOString().slice(0, 10);
	return a === b;
}

// Soustrait un intervalle [closStart, closEnd] d'une liste de plages
function soustraireIntervalle(
	plages: Plage[],
	closStart: number,
	closEnd: number
): Plage[] {
	const result: Plage[] = [];
	for (const p of plages) {
		if (closEnd <= p.debut || closStart >= p.fin) {
			result.push(p);
		} else {
			if (p.debut < closStart) {
				result.push({ debut: p.debut, fin: closStart });
			}
			if (p.fin > closEnd) {
				result.push({ debut: closEnd, fin: p.fin });
			}
		}
	}
	return result;
}

export function calculerCreneauxDisponibles(
	date: string,
	typeRdv: TypeRdv,
	horaires: Horaire[],
	rdvsExistants: RdvExistant[],
	fermetures: FermetureExceptionnelle[],
	vacances: Vacances[],
	config: ConfigCreneaux = DEFAULT_CONFIG,
	ouvertures: OuvertureExceptionnelle[] = []
): string[] {
	const duration = config.durees[typeRdv];
	const marge = config.marge;
	const dateObj = new Date(date + "T00:00:00");
	const dayOfWeek = dateObj.getDay();

	// 1. Vérifier vacances actives (sauf si ouverture exceptionnelle)
	const ouverture = ouvertures.find((o) => sameDay(o.date, dateObj));
	if (!ouverture) {
		for (const v of vacances) {
			if (!v.actif) continue;
			const debut = new Date(v.dateDebut).toISOString().slice(0, 10);
			const fin = new Date(v.dateFin).toISOString().slice(0, 10);
			if (date >= debut && date <= fin) return [];
		}
	}

	// 2. Horaires du jour (ou ouverture exceptionnelle)
	let plages: Plage[] = [];

	if (ouverture) {
		// Utiliser les plages de l'ouverture exceptionnelle
		if (ouverture.matin?.debut && ouverture.matin?.fin) {
			plages.push({
				debut: toMinutes(ouverture.matin.debut),
				fin: toMinutes(ouverture.matin.fin),
			});
		}
		if (ouverture.aprem?.debut && ouverture.aprem?.fin) {
			plages.push({
				debut: toMinutes(ouverture.aprem.debut),
				fin: toMinutes(ouverture.aprem.fin),
			});
		}
	} else {
		// Horaires normaux
		const horaire = horaires.find((h) => h.jour === dayOfWeek);
		if (!horaire || !horaire.ouvert) return [];

		if (horaire.matin?.debut && horaire.matin?.fin) {
			plages.push({
				debut: toMinutes(horaire.matin.debut),
				fin: toMinutes(horaire.matin.fin),
			});
		}
		if (horaire.aprem?.debut && horaire.aprem?.fin) {
			plages.push({
				debut: toMinutes(horaire.aprem.debut),
				fin: toMinutes(horaire.aprem.fin),
			});
		}
	}

	if (plages.length === 0) return [];

	// 3. Appliquer les fermetures exceptionnelles
	for (const f of fermetures) {
		if (!sameDay(f.date, dateObj)) continue;
		if (f.journeeComplete) return [];
		if (f.heureDebut && f.heureFin) {
			plages = soustraireIntervalle(
				plages,
				toMinutes(f.heureDebut),
				toMinutes(f.heureFin)
			);
		}
	}

	// 4. Appliquer les plages bloquées du jour (filtrées par type)
	for (const pb of config.plagesBloquees) {
		if (pb.jour !== dayOfWeek) continue;
		const concerneTous = !pb.typesRdv || pb.typesRdv.length === 0;
		if (!concerneTous && !pb.typesRdv!.includes(typeRdv)) continue;
		plages = soustraireIntervalle(
			plages,
			toMinutes(pb.debut),
			toMinutes(pb.fin)
		);
	}

	// 5. Préparer les RDV existants triés
	const bookings = rdvsExistants
		.map((r) => ({
			start: toMinutes(r.heureDebut),
			end: toMinutes(r.heureFin),
		}))
		.sort((a, b) => a.start - b.start);

	// 6. Générer les créneaux
	const slots: string[] = [];

	for (const plage of plages) {
		const firstSlot = plage.debut + marge;

		for (
			let slotStart = firstSlot;
			slotStart + duration <= plage.fin;
			slotStart += 15
		) {
			const slotEnd = slotStart + duration;

			const overlaps = bookings.some(
				(b) => slotStart < b.end + marge && slotEnd > b.start - marge
			);

			if (!overlaps) {
				slots.push(fromMinutes(slotStart));
			}
		}
	}

	return slots;
}
