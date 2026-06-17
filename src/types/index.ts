export interface Marque {
  _id: string;
  nom: string;
  logo: string;
  origine?: string;
  resume?: string;
  descriptionLongue?: string;
  tags?: string[];
  images?: string[];
  lienSite?: string;
  ordre: number;
  actif: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Vitrine {
  _id: string;
  titre: string;
  description?: string;
  image: string;
  date: Date;
  actif: boolean;
  ordre: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface AvantPremiere {
  _id: string;
  titre: string;
  description?: string;
  image: string;
  actif: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Contact {
  _id: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  message: string;
  type: "question" | "lentilles";
  traite: boolean;
  createdAt: Date;
}

export type TypeRdv = "examen" | "vente" | "reparation" | "livraison";
export type StatutRdv = "confirme" | "annule" | "effectue" | "reporte";

export interface Rdv {
  _id: string;
  source?: "client" | "interne";
  objet?: string;
  typeInterne?: string;
  nom: string;
  prenom: string;
  email?: string;
  telephone?: string;
  message?: string;
  typeRdv: TypeRdv;
  dateRdv: Date;
  heureDebut: string;
  heureFin: string;
  duree: number;
  statut: StatutRdv;
  raisonAnnulation?: string;
  notes?: string;
  cancelToken?: string;
  googleEventId?: string;
  rappelEnvoye?: boolean;
  createdAt: Date;
  updatedAt: Date;
  effectueAt?: Date;
  annuleAt?: Date;
}

export interface PlageBloquee {
  recurrente: boolean;
  jour?: number;
  dateDebut?: string;
  dateFin?: string;
  debut: string;
  fin: string;
  typesRdv?: TypeRdv[];
  raison?: string;
}

export interface ConfigRdv {
  _id: string;
  durees: Record<TypeRdv, number>;
  marge: number;
  plagesBloquees: PlageBloquee[];
  updatedAt: Date;
}

export interface OuvertureExceptionnelle {
  _id: string;
  date: Date;
  matin?: PlageHoraire;
  aprem?: PlageHoraire;
  raison?: string;
  createdAt: Date;
}

export interface FermetureExceptionnelle {
  _id: string;
  date: Date;
  journeeComplete: boolean;
  heureDebut?: string;
  heureFin?: string;
  raison?: string;
  createdAt: Date;
}

export interface PlageHoraire {
  debut: string;
  fin: string;
}

export interface Horaire {
  _id: string;
  jour: number;
  ouvert: boolean;
  matin?: PlageHoraire;
  aprem?: PlageHoraire;
  updatedAt: Date;
}

export interface Vacances {
  _id: string;
  dateDebut: Date;
  dateFin: Date;
  message?: string;
  actif: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Admin {
  _id: string;
  email: string;
  name: string;
  passwordHash: string;
  googleRefreshToken?: string;
  googleCalendarId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Faq {
  _id: string;
  question: string;
  reponse: string;
  categorie: string;
  ordre: number;
  actif: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type JourSemaine =
  | "lundi"
  | "mardi"
  | "mercredi"
  | "jeudi"
  | "vendredi"
  | "samedi"
  | "dimanche";

export const JOURS_SEMAINE: JourSemaine[] = [
  "lundi",
  "mardi",
  "mercredi",
  "jeudi",
  "vendredi",
  "samedi",
  "dimanche",
];

export const TYPES_RDV: { value: TypeRdv; label: string; duree: number }[] = [
  { value: "examen", label: "Examen de vue", duree: 60 },
  { value: "vente", label: "Essayage / Vente", duree: 45 },
  { value: "reparation", label: "Réparation / Ajustement", duree: 30 },
  { value: "livraison", label: "Livraison", duree: 15 },
];

export const DUREE_PAR_TYPE: Record<TypeRdv, number> = {
  examen: 60,
  vente: 45,
  reparation: 30,
  livraison: 15,
};
