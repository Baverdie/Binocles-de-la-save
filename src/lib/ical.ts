import ical, { ICalCalendarMethod, ICalAlarmType } from "ical-generator";

interface RdvICalData {
  dateRdv: Date;
  heureDebut: string;
  heureFin: string;
  typeRdv: string;
  clientNom: string;
  clientPrenom: string;
}

const ADRESSE_BOUTIQUE = "Levignac, 31530, France";
const TELEPHONE_BOUTIQUE = ""; // À compléter

export function genererFichierICS(rdv: RdvICalData): string {
  const calendar = ical({
    name: "Rendez-vous Binocles de la Save",
    method: ICalCalendarMethod.REQUEST,
    timezone: "Europe/Paris",
  });

  const dateStr = rdv.dateRdv.toISOString().split("T")[0];
  const start = new Date(`${dateStr}T${rdv.heureDebut}:00+01:00`);
  const end = new Date(`${dateStr}T${rdv.heureFin}:00+01:00`);

  const typeLabels: Record<string, string> = {
    examen: "Examen de vue",
    vente: "Essayage / Vente",
    reparation: "Réparation / Ajustement",
  };

  const typeLabel = typeLabels[rdv.typeRdv] || rdv.typeRdv;

  calendar.createEvent({
    start,
    end,
    summary: `RDV ${typeLabel} - Binocles de la Save`,
    description: `Rendez-vous chez Binocles de la Save\n\nType : ${typeLabel}\nClient : ${rdv.clientPrenom} ${rdv.clientNom}\nAdresse : ${ADRESSE_BOUTIQUE}${TELEPHONE_BOUTIQUE ? `\nTéléphone : ${TELEPHONE_BOUTIQUE}` : ""}`,
    location: ADRESSE_BOUTIQUE,
    url: "https://binoclesdelasave.fr",
    organizer: {
      name: "Binocles de la Save",
      email: "contact@binoclesdelasave.fr",
    },
    alarms: [
      {
        type: ICalAlarmType.display,
        trigger: 3600, // 1 heure avant
        description: "Rappel : RDV Binocles de la Save dans 1 heure",
      },
    ],
  });

  return calendar.toString();
}

export function genererNomFichierICS(date: Date): string {
  const dateStr = date.toISOString().split("T")[0];
  return `rdv-binocles-${dateStr}.ics`;
}
