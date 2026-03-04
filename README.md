# Binocles de la Save

Site web complet pour un opticien indépendant à Levignac (31530) — vitrine publique, système de prise de rendez-vous en ligne et panel d'administration.

![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)
![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind-4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-47A248?style=flat-square&logo=mongodb&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-Deploy-black?style=flat-square&logo=vercel)

---

## Aperçu

### Accueil

![Accueil](docs/screenshots/hero.png)

### Prise de rendez-vous

![Prise de rendez-vous](docs/screenshots/rendez-vous.png)

### Catalogue de marques

![Marques](docs/screenshots/marques.png)

### FAQ

![FAQ](docs/screenshots/faq.png)

### Contact

![Contact](docs/screenshots/contact.png)

---

## Fonctionnalités

### Site public

- **Prise de rendez-vous** — Sélection du type (examen de vue, vente, réparation), créneaux disponibles calculés en temps réel, confirmation par email avec fichier `.ics`
- **Catalogue de marques** — Présentation des montures avec galerie d'images, filtres et description complète
- **FAQ** — Questions fréquentes classées par catégorie
- **Contact** — Formulaire multi-type (question, commande de lentilles)
- **Pages légales** — Mentions légales, politique de confidentialité

### Panel d'administration

- **Dashboard** — Vue d'ensemble : rendez-vous à venir, contacts du mois, statistiques
- **Rendez-vous** — Suivi des statuts (confirmé / effectué / annulé / reporté), sync Google Agenda, rappels automatiques 24h avant
- **Horaires** — Planning semaine matin/après-midi, fermetures exceptionnelles, ouvertures exceptionnelles, vacances
- **Marques & contenu** — CRUD complet, upload d'images, tri, avant-premières
- **Contacts** — Consultation et marquage des demandes traitées
- **Admins** — Gestion des comptes, connexion Google Agenda par compte
- **Email test** — Envoi des templates email avec redirection configurable

---

## Stack

| Catégorie | Technologie |
| --- | --- |
| Framework | Next.js 16 (App Router) |
| UI | React 19 · TailwindCSS 4 · Framer Motion |
| Base de données | MongoDB + Mongoose |
| Authentification | NextAuth.js v5 (JWT, credentials) |
| Email | Nodemailer + Brevo SMTP |
| Calendrier | Google Calendar API |
| Validation | Zod |
| Déploiement | Vercel + Cron Jobs |

---

## Installation

### Prérequis

- Node.js 20+
- Compte MongoDB Atlas
- Compte Brevo (SMTP)
- Projet Google Cloud (optionnel — sync Google Agenda)

### Démarrage

```bash
git clone https://github.com/<user>/binocles-de-la-save.git
cd binocles-de-la-save
npm install
cp .env.example .env.local
npm run dev
```

### Variables d'environnement

```env
# Base de données
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/binocles-save

# Authentification (NextAuth)
AUTH_SECRET=<secret aléatoire 32 caractères>

# Email (Brevo)
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_USER=<email Brevo>
SMTP_PASS=<clé API Brevo>
SMTP_FROM=contact@binoclesdelasave.fr

# Google Calendar (optionnel)
GOOGLE_CLIENT_ID=<client ID OAuth>
GOOGLE_CLIENT_SECRET=<client secret OAuth>
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback

# Cron jobs
CRON_SECRET=<secret pour sécuriser l'endpoint cron>

# URLs et infos publiques
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_ADRESSE=Levignac, 31530, France
NEXT_PUBLIC_TELEPHONE=
NEXT_PUBLIC_EMAIL=contact@binoclesdelasave.fr
```

L'application tourne sur `http://localhost:3000`.
Le panel admin est accessible sur `http://localhost:3000/admin`.

---

## Structure

```text
src/
├── app/
│   ├── (site)/              # Pages publiques
│   │   ├── page.tsx         # Accueil
│   │   ├── rendez-vous/     # Prise de RDV
│   │   ├── marques/         # Catalogue marques
│   │   ├── faq/             # FAQ
│   │   └── contact/         # Formulaire contact
│   ├── (admin)/             # Panel d'administration
│   │   └── admin/
│   │       ├── page.tsx     # Dashboard
│   │       ├── horaires/    # Gestion des horaires
│   │       ├── rendez-vous/ # Gestion des RDV
│   │       ├── marques/     # Gestion des marques
│   │       ├── faq/         # Gestion de la FAQ
│   │       └── utilisateurs/# Gestion des admins
│   └── api/
│       ├── admin/           # Routes API protégées
│       ├── rdv/             # Prise de RDV publique
│       ├── horaires/        # Horaires publics
│       └── cron/            # Tâches automatisées
├── lib/
│   ├── db/                  # Connexion MongoDB (connection pooling)
│   ├── models/              # Modèles Mongoose
│   ├── email.ts             # Templates et envoi d'emails
│   ├── creneaux.ts          # Calcul des créneaux disponibles
│   └── auth.ts              # Configuration NextAuth
└── middleware.ts             # Protection des routes admin + routing sous-domaine
```

---

## Points techniques

### Calcul des créneaux disponibles

`src/lib/creneaux.ts` calcule dynamiquement les créneaux libres en croisant :

- Les horaires d'ouverture hebdomadaires (matin / après-midi par jour)
- Les fermetures exceptionnelles (journée entière ou partielle)
- Les ouvertures exceptionnelles (jours normalement fermés)
- Les périodes de vacances
- Les plages bloquées configurées par l'admin (par type de RDV)
- Les rendez-vous existants avec une marge configurable (défaut : 15 min)

Les créneaux sont générés toutes les 15 minutes dans les plages d'ouverture.

### Templates email

8 templates HTML sont générés côté serveur avec un design system cohérent (couleurs `#412A1C` / `#E7DAC6`, typographie, responsive). Un mode test permet de rediriger tous les emails vers une adresse configurable depuis l'admin.

### Routage multi-domaine

Le middleware détecte le sous-domaine `admin.binoclesdelasave.fr` et réécrit les routes vers `/admin/*`, permettant un accès admin isolé du site principal.

### Rappels automatiques

Un cron Vercel déclenche chaque jour à 18h UTC l'envoi d'un email de rappel aux clients ayant rendez-vous le lendemain.

```json
{
  "crons": [{ "path": "/api/cron/rappels", "schedule": "0 18 * * *" }]
}
```

---

## Licence

Projet privé — tous droits réservés.
