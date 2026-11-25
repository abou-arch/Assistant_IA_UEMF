import { useEffect, useState } from "react";
import { obtenirSuggestions, type Langue, type Suggestion } from "../api";
import { LANGUES, LIENS, PARTENAIRES, TEXTES } from "../i18n";

interface Props {
  langue: Langue;
  setLangue: (l: Langue) => void;
  ouvrirChat: (question?: string) => void;
}

function Fleche() {
  return (
    <svg className="fleche" width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
      <path d="M3 8h10M9 4l4 4-4 4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Visuel du hero : orbites autour d'un noyau lumineux (évoque l'IA et la connaissance). */
function Orbites() {
  return (
    <div className="orbites" aria-hidden="true">
      <div className="noyau" />
      <svg viewBox="-300 -300 600 600">
        <defs>
          <linearGradient id="trait" x1="0" x2="1">
            <stop offset="0" stopColor="#0e9ed4" stopOpacity="0" />
            <stop offset="0.5" stopColor="#0e9ed4" stopOpacity="0.9" />
            <stop offset="1" stopColor="#ffffff" stopOpacity="0.2" />
          </linearGradient>
        </defs>
        {[
          { rx: 270, ry: 90, rot: -18, d: 38 },
          { rx: 230, ry: 120, rot: 32, d: 52 },
          { rx: 190, ry: 60, rot: 74, d: 30 },
          { rx: 150, ry: 140, rot: 0, d: 64 },
        ].map((o, i) => (
          <g key={i} className="orbite" style={{ animationDuration: `${o.d}s` }} transform={`rotate(${o.rot})`}>
            <ellipse rx={o.rx} ry={o.ry} fill="none" stroke="url(#trait)" strokeWidth="1" />
            <circle cx={o.rx} cy="0" r="3.5" fill="#fff" />
            <circle cx={-o.rx} cy="0" r="2" fill="#0e9ed4" />
          </g>
        ))}
      </svg>
    </div>
  );
}

export function Landing({ langue, setLangue, ouvrirChat }: Props) {
  const t = TEXTES[langue];
  const [navCachee, setNavCachee] = useState(false);
  const [navOpaque, setNavOpaque] = useState(false);
  const [faq, setFaq] = useState<Suggestion[]>([]);

  // Barre de navigation : se cache en descendant, réapparaît en remontant.
  useEffect(() => {
    let dernier = window.scrollY;
    const surDefilement = () => {
      const y = window.scrollY;
      setNavCachee(y > dernier && y > 120);
      setNavOpaque(y > 20);
      dernier = y;
    };
    window.addEventListener("scroll", surDefilement, { passive: true });
    return () => window.removeEventListener("scroll", surDefilement);
  }, []);

  // Apparition progressive des sections au défilement.
  useEffect(() => {
    const obs = new IntersectionObserver(
      (entrees) => entrees.forEach((e) => e.isIntersecting && e.target.classList.add("visible")),
      { threshold: 0.15 },
    );
    document.querySelectorAll(".apparait").forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, [langue]);

  useEffect(() => {
    obtenirSuggestions(langue)
      .then(setFaq)
      .catch(() => setFaq([]));
  }, [langue]);

  const niveaux = [t.formations.prepa, t.formations.ingenieur, t.formations.master];

  return (
    <>
      <header className={`nav ${navCachee ? "cachee" : ""} ${navOpaque ? "opaque" : ""}`}>
        <a href="#haut" className="marque">
          <span className="logo-point" aria-hidden="true" />
          EIDIA
          <small>UEMF</small>
        </a>
        <nav className="nav-liens" aria-label="Navigation principale">
          <a href="#formations">{t.nav.formations}</a>
          <a href="#parcours">{t.nav.parcours}</a>
          <a href="#campus">{t.nav.campus}</a>
          <a href="#faq">{t.nav.faq}</a>
        </nav>
        <div className="nav-actions">
          <div className="langues" role="group" aria-label="Langue / Language / اللغة">
            {LANGUES.map((l) => (
              <button
                key={l.code}
                type="button"
                className={l.code === langue ? "actif" : ""}
                aria-pressed={l.code === langue}
                onClick={() => setLangue(l.code)}
                lang={l.code}
              >
                {l.libelle}
              </button>
            ))}
          </div>
          <a className="btn btn-clair btn-petit" href={LIENS.candidature} target="_blank" rel="noopener noreferrer">
            {t.nav.candidater}
          </a>
        </div>
      </header>

      <main id="haut">
        <section className="hero">
          <Orbites />
          <div className="hero-contenu">
            <p className="surtitre">{t.hero.surtitre}</p>
            <h1>
              <span>{t.hero.titre1}</span>
              <span className="degrade">{t.hero.titre2}</span>
            </h1>
            <p className="hero-texte">{t.hero.texte}</p>
            <div className="hero-cta">
              <a className="btn btn-clair" href="#formations">
                {t.hero.cta1}
              </a>
              <button type="button" className="btn btn-contour" onClick={() => ouvrirChat()}>
                {t.hero.cta2}
                <Fleche />
              </button>
            </div>
          </div>
          <a href="#formations" className="defiler">
            {t.hero.defiler}
            <span aria-hidden="true" />
          </a>
        </section>

        <section className="bandeau" aria-label={t.bandeau}>
          <p>{t.bandeau}</p>
          <div className="defilant">
            <div className="piste">
              {[...PARTENAIRES, ...PARTENAIRES].map((p, i) => (
                <span key={i} aria-hidden={i >= PARTENAIRES.length}>
                  {p}
                </span>
              ))}
            </div>
          </div>
        </section>

        <section id="formations" className="section">
          <div className="entete-section apparait">
            <p className="surtitre">{t.formations.surtitre}</p>
            <h2>{t.formations.titre}</h2>
            <p>{t.formations.texte}</p>
          </div>
          <div className="grille-3">
            {niveaux.map((n, i) => (
              <article key={n.titre} className="carte apparait" style={{ transitionDelay: `${i * 90}ms` }}>
                <span className="numero">0{i + 1}</span>
                <h3>{n.titre}</h3>
                <p className="duree">{n.duree}</p>
                <p>{n.texte}</p>
                <button type="button" className="lien-assistant" onClick={() => ouvrirChat(`${t.formations.questionNiveau} ${n.titre} ${langue === "ar" ? "؟" : "?"}`)}>
                  {t.formations.demander}
                  <Fleche />
                </button>
              </article>
            ))}
          </div>

          <h3 className="sous-titre apparait">{t.formations.filieresTitre}</h3>
          <ul className="filieres apparait">
            {t.formations.filieres.map((f, i) => (
              <li key={f.nom}>
                <button type="button" onClick={() => ouvrirChat(`${t.formations.questionFiliere} ${f.nom} ${langue === "ar" ? "؟" : "?"}`)}>
                  <span className="numero">0{i + 1}</span>
                  <span className="filiere-nom">{f.nom}</span>
                  <span className="filiere-resume">{f.resume}</span>
                  <Fleche />
                </button>
              </li>
            ))}
          </ul>
        </section>

        <section id="parcours" className="section">
          <div className="entete-section apparait">
            <p className="surtitre">{t.parcours.surtitre}</p>
            <h2>{t.parcours.titre}</h2>
          </div>
          <ol className="frise">
            {t.parcours.etapes.map((e, i) => (
              <li key={e.titre} className="apparait" style={{ transitionDelay: `${i * 90}ms` }}>
                <span className="jalon" aria-hidden="true" />
                <h3>{e.titre}</h3>
                <p>{e.texte}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="section assistant-vitrine">
          <div className="apparait">
            <p className="surtitre">{t.assistant.surtitre}</p>
            <h2>{t.assistant.titre}</h2>
            <p>{t.assistant.texte}</p>
            <ul className="points">
              {t.assistant.points.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
            <button type="button" className="btn btn-clair" onClick={() => ouvrirChat()}>
              {t.assistant.cta}
              <Fleche />
            </button>
          </div>
          <div className="demo apparait" aria-hidden="true">
            <div className="demo-barre">
              <span />
              <span />
              <span />
            </div>
            <div className="demo-bulle demo-user">{t.assistant.demoQuestion}</div>
            <div className="demo-bulle demo-ia">
              {t.assistant.demoReponse}
              <span className="demo-source">↗ {t.assistant.demoSource}</span>
            </div>
          </div>
        </section>

        <section id="campus" className="section">
          <div className="entete-section apparait">
            <p className="surtitre">{t.campus.surtitre}</p>
            <h2>{t.campus.titre}</h2>
          </div>
          <div className="grille-3">
            {t.campus.cartes.map((c, i) => (
              <article key={c.titre} className="carte apparait" style={{ transitionDelay: `${i * 90}ms` }}>
                <h3>{c.titre}</h3>
                <p>{c.texte}</p>
              </article>
            ))}
          </div>
          <dl className="chiffres">
            {t.chiffres.map((c, i) => (
              <div key={c.libelle} className="apparait" style={{ transitionDelay: `${i * 90}ms` }}>
                <dt>{c.libelle}</dt>
                <dd>{c.valeur}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section id="faq" className="section section-faq">
            <div className="entete-section apparait">
              <p className="surtitre">{t.faq.surtitre}</p>
              <h2>{t.faq.titre}</h2>
              <p>{t.faq.texte}</p>
            </div>
            {faq.length === 0 && (
              <button type="button" className="btn btn-contour" onClick={() => ouvrirChat()}>
                {t.hero.cta2}
                <Fleche />
              </button>
            )}
            <ul className="faq apparait">
              {faq.map((q) => (
                <li key={q.fiche_id}>
                  <button type="button" onClick={() => ouvrirChat(q.question)} dir="auto">
                    <span>{q.question}</span>
                    <small>{q.categorie}</small>
                    <Fleche />
                  </button>
                </li>
              ))}
            </ul>
          </section>

        <section className="final apparait">
          <h2>{t.final.titre}</h2>
          <div className="hero-cta">
            <a className="btn btn-clair" href={LIENS.candidature} target="_blank" rel="noopener noreferrer">
              {t.final.candidater}
            </a>
            <button type="button" className="btn btn-contour" onClick={() => ouvrirChat()}>
              {t.final.question}
            </button>
          </div>
        </section>
      </main>

      <footer className="pied-page">
        <div>
          <strong>EIDIA</strong>
          <p>{t.pied.adresse}</p>
        </div>
        <nav aria-label="Liens">
          <a href={LIENS.site} target="_blank" rel="noopener noreferrer">
            {t.pied.site}
          </a>
          <a href={LIENS.contact} target="_blank" rel="noopener noreferrer">
            {t.pied.contact}
          </a>
        </nav>
        <p className="mention">{t.pied.mention}</p>
      </footer>
    </>
  );
}
