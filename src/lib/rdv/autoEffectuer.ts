import RdvModel from "@/models/Rdv";

export async function marquerRdvTerminesEffectues(): Promise<number> {
	const now = new Date();

	const aujourdhuiStr = new Intl.DateTimeFormat("en-CA", {
		timeZone: "Europe/Paris",
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
	}).format(now);

	const heureActuelle = new Intl.DateTimeFormat("en-GB", {
		timeZone: "Europe/Paris",
		hour: "2-digit",
		minute: "2-digit",
		hourCycle: "h23",
	}).format(now);

	const debutAujourdhui = new Date(aujourdhuiStr + "T00:00:00");
	const finAujourdhui = new Date(aujourdhuiStr + "T23:59:59");
	const horodatage = new Date();

	const resJoursPasses = await RdvModel.updateMany(
		{
			statut: "confirme",
			dateRdv: { $lt: debutAujourdhui },
		},
		{ statut: "effectue", effectueAt: horodatage }
	);

	const resAujourdhui = await RdvModel.updateMany(
		{
			statut: "confirme",
			dateRdv: { $gte: debutAujourdhui, $lte: finAujourdhui },
			heureFin: { $lte: heureActuelle },
		},
		{ statut: "effectue", effectueAt: horodatage }
	);

	return resJoursPasses.modifiedCount + resAujourdhui.modifiedCount;
}
