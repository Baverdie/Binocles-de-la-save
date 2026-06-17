import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Politique de confidentialité",
  description: "Politique de confidentialité et protection des données personnelles de Binocles de la Save.",
};

export default function ConfidentialitePage() {
  return (
    <section className="relative min-h-[75vh] pt-24 pb-16 md:py-24 lg:py-32 px-4 sm:px-6 bg-beige">
      <div className="relative max-w-3xl mx-auto">
        <div className="text-center mb-10 sm:mb-16">
          <span className="inline-block text-xs tracking-[0.3em] uppercase text-brown/40 mb-3">
            Légal
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl md:text-4xl lg:text-5xl text-brown">
            Politique de confidentialité
          </h1>
        </div>

        <div className="space-y-8 text-brown/70 text-sm sm:text-base leading-relaxed">
          <section>
            <h2 className="font-serif text-lg sm:text-xl text-brown mb-3">
              Introduction
            </h2>
            <p>
              Binocles de la Save s&apos;engage à protéger la vie privée des utilisateurs
              de son site. Cette politique de confidentialité explique comment nous
              collectons, utilisons et protégeons vos données personnelles.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-lg sm:text-xl text-brown mb-3">
              Responsable du traitement
            </h2>
            <p>
              Le responsable du traitement des données est :<br />
              <strong className="text-brown">Binocles de la Save</strong><br />
              42 Avenue de la République<br />
              31530 Levignac<br />
              Email : contact@binoclesdelasave.fr
            </p>
          </section>

          <section>
            <h2 className="font-serif text-lg sm:text-xl text-brown mb-3">
              Données collectées
            </h2>
            <p>Nous collectons les données suivantes :</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Nom et prénom</li>
              <li>Adresse email</li>
              <li>Numéro de téléphone</li>
              <li>Message envoyé via le formulaire de contact</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-lg sm:text-xl text-brown mb-3">
              Finalités du traitement
            </h2>
            <p>Vos données personnelles sont collectées pour :</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Répondre à vos demandes de contact</li>
              <li>Gérer vos demandes de rendez-vous</li>
              <li>Traiter vos commandes de lentilles</li>
              <li>Vous envoyer des informations relatives à nos services</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-lg sm:text-xl text-brown mb-3">
              Base légale du traitement
            </h2>
            <p>
              Le traitement de vos données repose sur votre consentement explicite
              lors de l&apos;envoi d&apos;un formulaire sur notre site, ainsi que sur
              l&apos;exécution de mesures précontractuelles prises à votre demande.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-lg sm:text-xl text-brown mb-3">
              Durée de conservation
            </h2>
            <p>
              Vos données personnelles sont conservées pendant une durée de 3 ans
              à compter de votre dernier contact avec nous, sauf obligation légale
              de conservation plus longue.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-lg sm:text-xl text-brown mb-3">
              Destinataires des données
            </h2>
            <p>
              Vos données personnelles sont exclusivement destinées à Binocles de la Save.
              Elles ne sont transmises à aucun tiers, sauf obligation légale.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-lg sm:text-xl text-brown mb-3">
              Vos droits
            </h2>
            <p>
              Conformément au Règlement Général sur la Protection des Données (RGPD),
              vous disposez des droits suivants :
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Droit d&apos;accès à vos données</li>
              <li>Droit de rectification</li>
              <li>Droit à l&apos;effacement</li>
              <li>Droit à la limitation du traitement</li>
              <li>Droit à la portabilité</li>
              <li>Droit d&apos;opposition</li>
            </ul>
            <p className="mt-3">
              Pour exercer ces droits, vous pouvez nous contacter à l&apos;adresse
              email : contact@binoclesdelasave.fr
            </p>
          </section>

          <section>
            <h2 className="font-serif text-lg sm:text-xl text-brown mb-3">
              Cookies
            </h2>
            <p>
              Ce site n&apos;utilise pas de cookies de suivi ou de cookies publicitaires.
              Seuls des cookies techniques essentiels au fonctionnement du site peuvent
              être utilisés.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-lg sm:text-xl text-brown mb-3">
              Sécurité
            </h2>
            <p>
              Nous mettons en œuvre des mesures techniques et organisationnelles
              appropriées pour protéger vos données personnelles contre tout accès,
              modification, divulgation ou destruction non autorisés.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-lg sm:text-xl text-brown mb-3">
              Réclamation
            </h2>
            <p>
              Si vous estimez que le traitement de vos données personnelles constitue
              une violation du RGPD, vous avez le droit d&apos;introduire une réclamation
              auprès de la CNIL (Commission Nationale de l&apos;Informatique et des Libertés).
            </p>
          </section>

          <section>
            <h2 className="font-serif text-lg sm:text-xl text-brown mb-3">
              Modification de la politique
            </h2>
            <p>
              Nous nous réservons le droit de modifier cette politique de confidentialité
              à tout moment. Toute modification sera publiée sur cette page avec une date
              de mise à jour.
            </p>
            <p className="mt-3 text-brown/50 text-sm">
              Dernière mise à jour : Février 2026
            </p>
          </section>
        </div>
      </div>
    </section>
  );
}
