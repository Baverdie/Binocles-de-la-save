// Configuration centralisée des fermetures exceptionnelles

export interface FermetureConfig {
  actif: boolean;
  dateDebut: string; // Format affiché (ex: "15 février")
  dateFin: string;   // Format affiché (ex: "1er mars")
}

// Configuration actuelle
export const fermeture: FermetureConfig = {
  actif: true,
  dateDebut: "15 février",
  dateFin: "1er mars",
};

// Helpers de formatage
export function formatFermeturePeriode(config: FermetureConfig): string {
  return `${config.dateDebut} → ${config.dateFin}`;
}

export function formatFermetureIndispo(config: FermetureConfig): string {
  // Format court pour sous le bouton RDV
  const debutCourt = config.dateDebut.replace("février", "02").replace("mars", "03").replace("janvier", "01");
  const finCourt = config.dateFin.replace("février", "02").replace("mars", "03").replace("janvier", "01");
  return `Indisponible du ${debutCourt} au ${finCourt}`;
}
