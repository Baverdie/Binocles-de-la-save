import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mentions légales",
  description: "Mentions légales du site Binocles de la Save, opticien à Levignac.",
};

export default function MentionsLegalesPage() {
  return (
    <section className="relative min-h-[75vh] pt-24 pb-16 md:py-24 lg:py-32 px-4 sm:px-6 bg-beige">
      <div className="relative max-w-3xl mx-auto">
        <div className="text-center mb-10 sm:mb-16">
          <span className="inline-block text-xs tracking-[0.3em] uppercase text-brown/40 mb-3">
            Légal
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl md:text-4xl lg:text-5xl text-brown">
            Mentions légales
          </h1>
        </div>

        <div className="space-y-8 text-brown/70 text-sm sm:text-base leading-relaxed">
          <section>
            <h2 className="font-serif text-lg sm:text-xl text-brown mb-3">
              Éditeur du site
            </h2>
            <p>
              Le site binoclesdelasave.fr est édité par :<br />
              <strong className="text-brown">Binocles de la Save</strong><br />
              42 Avenue de la République<br />
              31530 Levignac<br />
              France
            </p>
            <p className="mt-3">
              Téléphone : 05 34 52 19 69<br />
              Email : contact@binoclesdelasave.fr
            </p>
          </section>

          <section>
            <h2 className="font-serif text-lg sm:text-xl text-brown mb-3">
              Responsable de la publication
            </h2>
            <p>
              Le responsable de la publication est le gérant de Binocles de la Save.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-lg sm:text-xl text-brown mb-3">
              Hébergement
            </h2>
            <p>
              Ce site est hébergé par :<br />
              <strong className="text-brown">Vercel Inc.</strong><br />
              440 N Barranca Ave #4133<br />
              Covina, CA 91723<br />
              États-Unis
            </p>
          </section>

          <section>
            <h2 className="font-serif text-lg sm:text-xl text-brown mb-3">
              Conception et développement
            </h2>
            <p>
              Site conçu et développé par{" "}
              <a
                href="https://baverdie.dev"
                target="_blank"
                rel="noopener noreferrer"
                className="text-brown underline hover:no-underline transition-all duration-300"
              >
                baverdie.dev
              </a>
            </p>
          </section>

          <section>
            <h2 className="font-serif text-lg sm:text-xl text-brown mb-3">
              Propriété intellectuelle
            </h2>
            <p>
              L&apos;ensemble du contenu de ce site (textes, images, vidéos, logos,
              graphismes) est la propriété exclusive de Binocles de la Save, sauf
              mention contraire. Toute reproduction, distribution, modification,
              adaptation ou publication, même partielle, de ces éléments est
              strictement interdite sans l&apos;accord préalable écrit de Binocles de la Save.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-lg sm:text-xl text-brown mb-3">
              Limitation de responsabilité
            </h2>
            <p>
              Les informations contenues sur ce site sont aussi précises que possible
              et le site est régulièrement mis à jour. Cependant, il peut contenir des
              inexactitudes ou des omissions. Si vous constatez une lacune, erreur ou
              ce qui paraît être un dysfonctionnement, merci de bien vouloir le signaler
              par email à contact@binoclesdelasave.fr.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-lg sm:text-xl text-brown mb-3">
              Liens hypertextes
            </h2>
            <p>
              Le site peut contenir des liens hypertextes vers d&apos;autres sites.
              Binocles de la Save n&apos;exerce aucun contrôle sur ces sites et décline
              toute responsabilité quant à leur contenu.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-lg sm:text-xl text-brown mb-3">
              Droit applicable
            </h2>
            <p>
              Les présentes mentions légales sont régies par le droit français.
              En cas de litige, les tribunaux français seront seuls compétents.
            </p>
          </section>
        </div>
      </div>
    </section>
  );
}
