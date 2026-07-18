#!/usr/bin/env node
/**
 * Merges new redesign / navigation message keys into every locale
 * bundle. Idempotent — running twice does not double-write, and
 * existing keys are preserved (only missing keys are filled in from
 * the per-locale table below).
 *
 * The table only covers keys added by the redesign (Logo/Header/
 * Footer/Hero/PopularCalculators/WhyBeHumler/FAQ/DashboardPreview/
 * CalculatorsMenu/MobileNav) and the merge-time fixes for existing
 * keys where the redesign changed a label or added a sibling.
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const messagesDir = path.join(__dirname, "..", "messages");

/** Deep-merge: values from `source` fill missing keys in `target` and
 *  overwrite conflicting scalar values. Objects are recursed. */
function deepMerge(target, source) {
  if (source === null || typeof source !== "object") return source;
  if (target === null || typeof target !== "object") return source;
  const out = { ...target };
  for (const [k, v] of Object.entries(source)) {
    out[k] = deepMerge(target?.[k], v);
  }
  return out;
}

const TRANSLATIONS = {
  en: {
    common: {
      actions: { open: "Open" },
      labels: { soon: "Soon" },
    },
    nav: {
      blog: "Blog",
      blogSoonTitle: "Blog is coming soon",
      menu: "Menu",
      mobilePrimary: "Primary",
    },
    footer: {
      blog: "Blog",
      company: "Company",
      legal: "Legal",
      estimatesBlurb: "Revenue figures on this site are independently calculated estimates.",
    },
    calculatorsMenu: {
      money: {
        label: "YouTube Money Calculator",
        description: "Estimate a channel's monthly revenue.",
      },
      rpm: {
        label: "RPM Calculator",
        description: "Revenue per 1,000 monetized views.",
      },
      cpm: {
        label: "CPM Calculator",
        description: "Advertiser cost per 1,000 impressions.",
      },
      shorts: {
        label: "Shorts Calculator",
        description: "Estimate Shorts Creator Pool payouts.",
      },
      sponsorship: {
        label: "Sponsorship Calculator",
        description: "Estimate brand deal rates.",
      },
    },
    popularCalculators: {
      eyebrow: "Tools",
      title: "Popular calculators",
      cards: {
        money: {
          title: "YouTube Money Calculator",
          description: "Estimate a channel's total monthly revenue from long-form and Shorts views combined.",
        },
        rpm: {
          title: "RPM Calculator",
          description: "Revenue per 1,000 monetized views — a creator-side earnings metric.",
        },
        cpm: {
          title: "CPM Calculator",
          description: "What advertisers pay per 1,000 ad impressions. Useful for pricing benchmarks.",
        },
        shorts: {
          title: "Shorts Calculator",
          description: "Estimate Creator Pool payouts based on Shorts views and monetization mix.",
        },
        sponsorship: {
          title: "Sponsorship Calculator",
          description: "Ballpark brand-deal rates from subscriber count and engagement.",
        },
      },
    },
    whyBeHumler: {
      eyebrow: "Why BeHumler",
      title: "Serious analytics without the gatekeeping",
      subtitle: "Every creator deserves honest, transparent numbers. BeHumler gives you a defensible estimate you can actually reason about.",
      features: {
        accurate: {
          title: "Accurate estimates",
          description: "Every figure is derived from public YouTube statistics using transparent, published formulas.",
        },
        fast: {
          title: "Fast results",
          description: "Type a channel name or handle and get a full earnings breakdown in seconds.",
        },
        poweredBy: {
          title: "Powered by YouTube Data API",
          description: "We fetch channel stats live from Google's official YouTube Data API v3 — no scraping.",
        },
        privacy: {
          title: "Privacy friendly",
          description: "No login. No tracking of the channels you search. Recent searches are stored locally on your device.",
        },
      },
    },
    homeFaq: {
      eyebrow: "FAQ",
      title: "Frequently asked questions",
      items: {
        accuracy: {
          q: "How accurate are the earnings estimates?",
          a: "The figures are estimates, not statements of actual revenue. They combine a channel's public view counts with industry-typical RPM/CPM ranges. Real earnings depend on the specific ad mix, viewer geography, watch time, YouTube Premium share, and other factors we cannot see from public data alone.",
        },
        rpm: {
          q: "How is RPM calculated?",
          a: "RPM (revenue per mille) is total revenue divided by monetized views, multiplied by one thousand. It is a creator-side metric — different from CPM, which is what advertisers pay per one thousand ad impressions. RPM is typically lower than CPM because it accounts for unmonetized views and YouTube's revenue share.",
        },
        subscribers: {
          q: "Does YouTube pay per subscriber?",
          a: "No. YouTube pays for monetized ad views and other qualifying revenue events, not for subscriber counts. Subscribers matter because they tend to drive more views over time, but the subscriber number itself is not a direct payout.",
        },
        shorts: {
          q: "Can I estimate Shorts revenue?",
          a: "Yes. Shorts monetize through the Creator Pool rather than pre-roll ads, so their RPM is generally much lower than long-form. Our Shorts calculator applies a separate Shorts RPM band so the estimate reflects that difference.",
        },
      },
    },
    dashboardPreview: {
      channelSnapshot: "Channel snapshot",
      sampleCreator: "Sample creator",
      illustrativePreview: "Illustrative preview",
      viewsLast6Months: "Views · last 6 months",
      exampleCaption: "Example estimate — actual figures are calculated from a real channel once you search above.",
      stats: {
        subscribers: "Subscribers",
        monthlyViews: "Monthly Views",
        estimatedRevenue: "Estimated Revenue",
        rpm: "RPM",
      },
    },
  },
  es: {
    common: { actions: { open: "Abrir" }, labels: { soon: "Próximamente" } },
    nav: {
      blog: "Blog",
      blogSoonTitle: "El blog llegará pronto",
      menu: "Menú",
      mobilePrimary: "Principal",
    },
    footer: {
      blog: "Blog",
      company: "Empresa",
      legal: "Legal",
      estimatesBlurb: "Los ingresos que se muestran aquí son estimaciones calculadas de forma independiente.",
    },
    calculatorsMenu: {
      money: { label: "Calculadora de ingresos", description: "Estima los ingresos mensuales de un canal." },
      rpm: { label: "Calculadora de RPM", description: "Ingresos por cada 1.000 visualizaciones monetizadas." },
      cpm: { label: "Calculadora de CPM", description: "Coste para anunciantes por cada 1.000 impresiones." },
      shorts: { label: "Calculadora de Shorts", description: "Estima ingresos del fondo de creadores de Shorts." },
      sponsorship: { label: "Calculadora de patrocinios", description: "Estima tarifas de acuerdos con marcas." },
    },
    popularCalculators: {
      eyebrow: "Herramientas",
      title: "Calculadoras populares",
      cards: {
        money: { title: "Calculadora de ingresos", description: "Estima los ingresos mensuales totales de un canal sumando vídeos largos y Shorts." },
        rpm: { title: "Calculadora de RPM", description: "Ingresos por cada 1.000 visualizaciones monetizadas — una métrica del creador." },
        cpm: { title: "Calculadora de CPM", description: "Lo que los anunciantes pagan por cada 1.000 impresiones. Útil como referencia de precios." },
        shorts: { title: "Calculadora de Shorts", description: "Estima ingresos del fondo de creadores según visualizaciones de Shorts y monetización." },
        sponsorship: { title: "Calculadora de patrocinios", description: "Aproxima tarifas de acuerdos con marcas a partir de suscriptores y engagement." },
      },
    },
    whyBeHumler: {
      eyebrow: "Por qué BeHumler",
      title: "Analítica seria sin barreras",
      subtitle: "Todo creador merece cifras honestas y transparentes. BeHumler te da una estimación defendible con la que puedes razonar.",
      features: {
        accurate: { title: "Estimaciones precisas", description: "Cada cifra procede de estadísticas públicas de YouTube utilizando fórmulas transparentes y publicadas." },
        fast: { title: "Resultados rápidos", description: "Escribe un nombre o un @handle y obtén un desglose completo de ingresos en segundos." },
        poweredBy: { title: "Con la YouTube Data API", description: "Consultamos los datos del canal en directo desde la YouTube Data API v3 oficial de Google — sin scraping." },
        privacy: { title: "Respeta tu privacidad", description: "Sin registro. Sin seguimiento de los canales que buscas. Las búsquedas recientes se guardan solo en tu dispositivo." },
      },
    },
    homeFaq: {
      eyebrow: "Preguntas frecuentes",
      title: "Preguntas frecuentes",
      items: {
        accuracy: {
          q: "¿Qué tan precisas son las estimaciones de ingresos?",
          a: "Las cifras son estimaciones, no ingresos reales. Combinan las visualizaciones públicas de un canal con rangos de RPM/CPM típicos del sector. Los ingresos reales dependen de la mezcla de anuncios, la geografía de la audiencia, el tiempo de visualización, la cuota de YouTube Premium y otros factores que no se pueden ver desde los datos públicos.",
        },
        rpm: {
          q: "¿Cómo se calcula el RPM?",
          a: "El RPM (ingresos por cada mil) es el total de ingresos dividido entre las visualizaciones monetizadas, multiplicado por mil. Es una métrica del creador — distinta del CPM, que es lo que pagan los anunciantes por cada mil impresiones. El RPM suele ser menor que el CPM porque incluye visualizaciones no monetizadas y descuenta la parte de YouTube.",
        },
        subscribers: {
          q: "¿YouTube paga por suscriptor?",
          a: "No. YouTube paga por visualizaciones publicitarias monetizadas y otros eventos de ingresos elegibles, no por número de suscriptores. Los suscriptores importan porque tienden a generar más visualizaciones con el tiempo, pero la cifra en sí no es un pago directo.",
        },
        shorts: {
          q: "¿Puedo estimar ingresos de Shorts?",
          a: "Sí. Los Shorts se monetizan mediante el fondo de creadores en lugar de anuncios pre-roll, por lo que su RPM suele ser mucho menor que el del formato largo. Nuestra calculadora de Shorts aplica una banda de RPM específica para reflejar esa diferencia.",
        },
      },
    },
    dashboardPreview: {
      channelSnapshot: "Vista del canal",
      sampleCreator: "Creador de ejemplo",
      illustrativePreview: "Vista previa ilustrativa",
      viewsLast6Months: "Visualizaciones · últimos 6 meses",
      exampleCaption: "Estimación de ejemplo — las cifras reales se calculan a partir de un canal cuando lo buscas arriba.",
      stats: {
        subscribers: "Suscriptores",
        monthlyViews: "Visualizaciones mensuales",
        estimatedRevenue: "Ingresos estimados",
        rpm: "RPM",
      },
    },
  },
  pt: {
    common: { actions: { open: "Abrir" }, labels: { soon: "Em breve" } },
    nav: {
      blog: "Blog",
      blogSoonTitle: "O blog está a caminho",
      menu: "Menu",
      mobilePrimary: "Principal",
    },
    footer: {
      blog: "Blog",
      company: "Empresa",
      legal: "Legal",
      estimatesBlurb: "Os valores de receita mostrados neste site são estimativas calculadas de forma independente.",
    },
    calculatorsMenu: {
      money: { label: "Calculadora de rendimentos", description: "Estima os rendimentos mensais de um canal." },
      rpm: { label: "Calculadora de RPM", description: "Rendimento por cada 1.000 visualizações monetizadas." },
      cpm: { label: "Calculadora de CPM", description: "Custo para os anunciantes por cada 1.000 impressões." },
      shorts: { label: "Calculadora de Shorts", description: "Estima rendimentos do fundo de criadores de Shorts." },
      sponsorship: { label: "Calculadora de patrocínios", description: "Estima valores de acordos com marcas." },
    },
    popularCalculators: {
      eyebrow: "Ferramentas",
      title: "Calculadoras populares",
      cards: {
        money: { title: "Calculadora de rendimentos", description: "Estima o rendimento mensal total de um canal, somando vídeos longos e Shorts." },
        rpm: { title: "Calculadora de RPM", description: "Rendimento por cada 1.000 visualizações monetizadas — uma métrica do criador." },
        cpm: { title: "Calculadora de CPM", description: "Quanto pagam os anunciantes por cada 1.000 impressões. Útil como referência de preços." },
        shorts: { title: "Calculadora de Shorts", description: "Estima rendimentos do fundo de criadores com base em visualizações de Shorts e monetização." },
        sponsorship: { title: "Calculadora de patrocínios", description: "Aproxima valores de acordos com marcas a partir de subscritores e interação." },
      },
    },
    whyBeHumler: {
      eyebrow: "Porquê BeHumler",
      title: "Análises sérias sem barreiras",
      subtitle: "Todo criador merece números honestos e transparentes. O BeHumler dá-te uma estimativa defensável em que consegues raciocinar.",
      features: {
        accurate: { title: "Estimativas precisas", description: "Cada valor deriva de estatísticas públicas do YouTube utilizando fórmulas transparentes e publicadas." },
        fast: { title: "Resultados rápidos", description: "Escreve um nome ou @handle e obtém um detalhe completo de rendimentos em segundos." },
        poweredBy: { title: "Com a YouTube Data API", description: "Consultamos os dados do canal em direto na YouTube Data API v3 oficial da Google — sem scraping." },
        privacy: { title: "Respeita a privacidade", description: "Sem registo. Sem rastreamento dos canais que pesquisas. As pesquisas recentes ficam apenas no teu dispositivo." },
      },
    },
    homeFaq: {
      eyebrow: "Perguntas frequentes",
      title: "Perguntas frequentes",
      items: {
        accuracy: {
          q: "Que precisão têm as estimativas de rendimento?",
          a: "Os valores são estimativas, não rendimentos reais. Combinam as visualizações públicas de um canal com bandas típicas de RPM/CPM do setor. O rendimento real depende do mix de anúncios, geografia da audiência, tempo de visualização, quota de YouTube Premium e outros fatores que não vemos apenas com dados públicos.",
        },
        rpm: {
          q: "Como é calculado o RPM?",
          a: "O RPM (rendimento por cada mil) é o rendimento total dividido pelas visualizações monetizadas, multiplicado por mil. É uma métrica do criador — diferente do CPM, que é o que os anunciantes pagam por cada mil impressões. O RPM costuma ser inferior ao CPM porque inclui visualizações não monetizadas e desconta a quota do YouTube.",
        },
        subscribers: {
          q: "O YouTube paga por subscritor?",
          a: "Não. O YouTube paga por visualizações publicitárias monetizadas e outros eventos de receita elegíveis, não pelo número de subscritores. Os subscritores importam porque tendem a gerar mais visualizações ao longo do tempo, mas o número em si não é um pagamento direto.",
        },
        shorts: {
          q: "Posso estimar receita de Shorts?",
          a: "Sim. Os Shorts monetizam através do fundo de criadores em vez de anúncios pre-roll, por isso o seu RPM é normalmente muito inferior ao dos vídeos longos. A nossa calculadora de Shorts aplica uma banda de RPM específica que reflete essa diferença.",
        },
      },
    },
    dashboardPreview: {
      channelSnapshot: "Visão do canal",
      sampleCreator: "Criador de exemplo",
      illustrativePreview: "Pré-visualização ilustrativa",
      viewsLast6Months: "Visualizações · últimos 6 meses",
      exampleCaption: "Estimativa de exemplo — os valores reais são calculados a partir de um canal quando o pesquisas acima.",
      stats: {
        subscribers: "Subscritores",
        monthlyViews: "Visualizações mensais",
        estimatedRevenue: "Rendimento estimado",
        rpm: "RPM",
      },
    },
  },
  fr: {
    common: { actions: { open: "Ouvrir" }, labels: { soon: "Bientôt" } },
    nav: {
      blog: "Blog",
      blogSoonTitle: "Le blog arrive bientôt",
      menu: "Menu",
      mobilePrimary: "Principal",
    },
    footer: {
      blog: "Blog",
      company: "Entreprise",
      legal: "Mentions légales",
      estimatesBlurb: "Les revenus affichés sur ce site sont des estimations calculées indépendamment.",
    },
    calculatorsMenu: {
      money: { label: "Calculatrice de revenus", description: "Estimez les revenus mensuels d'une chaîne." },
      rpm: { label: "Calculatrice RPM", description: "Revenu pour 1 000 vues monétisées." },
      cpm: { label: "Calculatrice CPM", description: "Ce que paient les annonceurs pour 1 000 impressions." },
      shorts: { label: "Calculatrice Shorts", description: "Estimez les revenus du fonds Créateurs de Shorts." },
      sponsorship: { label: "Calculatrice de sponsoring", description: "Estimez les tarifs des accords de marque." },
    },
    popularCalculators: {
      eyebrow: "Outils",
      title: "Calculatrices populaires",
      cards: {
        money: { title: "Calculatrice de revenus", description: "Estimez le revenu mensuel total d'une chaîne en combinant format long et Shorts." },
        rpm: { title: "Calculatrice RPM", description: "Revenu pour 1 000 vues monétisées — une métrique côté créateur." },
        cpm: { title: "Calculatrice CPM", description: "Ce que paient les annonceurs pour 1 000 impressions. Utile pour repères de tarification." },
        shorts: { title: "Calculatrice Shorts", description: "Estimez les revenus du fonds Créateurs à partir des vues Shorts et de la monétisation." },
        sponsorship: { title: "Calculatrice de sponsoring", description: "Estimez des tarifs d'accords de marque à partir des abonnés et de l'engagement." },
      },
    },
    whyBeHumler: {
      eyebrow: "Pourquoi BeHumler",
      title: "Des analyses sérieuses, sans barrières",
      subtitle: "Chaque créateur mérite des chiffres honnêtes et transparents. BeHumler vous donne une estimation défendable sur laquelle raisonner.",
      features: {
        accurate: { title: "Estimations précises", description: "Chaque chiffre provient de statistiques publiques de YouTube et de formules transparentes et publiées." },
        fast: { title: "Résultats rapides", description: "Tapez un nom de chaîne ou un @handle et obtenez un décompte complet des revenus en quelques secondes." },
        poweredBy: { title: "Basé sur l'API YouTube Data", description: "Nous récupérons les statistiques en direct via l'API YouTube Data v3 officielle de Google — sans scraping." },
        privacy: { title: "Respectueux de la vie privée", description: "Aucune inscription. Aucun suivi des chaînes recherchées. Les recherches récentes sont enregistrées localement sur votre appareil." },
      },
    },
    homeFaq: {
      eyebrow: "FAQ",
      title: "Questions fréquentes",
      items: {
        accuracy: {
          q: "Quelle est la précision des estimations de revenus ?",
          a: "Les chiffres sont des estimations, pas des revenus réels. Ils combinent les vues publiques d'une chaîne avec des plages RPM/CPM typiques du secteur. Les revenus réels dépendent du mix d'annonces, de la géographie de l'audience, du temps de visionnage, de la part YouTube Premium et d'autres facteurs invisibles depuis les données publiques.",
        },
        rpm: {
          q: "Comment est calculé le RPM ?",
          a: "Le RPM (revenu pour mille) est le revenu total divisé par les vues monétisées, multiplié par mille. C'est une métrique côté créateur — différente du CPM, ce que les annonceurs paient pour mille impressions. Le RPM est généralement plus bas que le CPM car il tient compte des vues non monétisées et de la part prise par YouTube.",
        },
        subscribers: {
          q: "YouTube paie-t-il par abonné ?",
          a: "Non. YouTube paie pour les vues publicitaires monétisées et d'autres événements de revenu éligibles, pas pour le nombre d'abonnés. Les abonnés comptent parce qu'ils tendent à générer plus de vues au fil du temps, mais le chiffre lui-même n'est pas un paiement direct.",
        },
        shorts: {
          q: "Puis-je estimer les revenus Shorts ?",
          a: "Oui. Les Shorts se monétisent via le fonds Créateurs plutôt que par des annonces pre-roll, donc leur RPM est généralement bien plus bas que le format long. Notre calculatrice Shorts applique une plage RPM dédiée pour refléter cette différence.",
        },
      },
    },
    dashboardPreview: {
      channelSnapshot: "Aperçu de la chaîne",
      sampleCreator: "Créateur d'exemple",
      illustrativePreview: "Aperçu illustratif",
      viewsLast6Months: "Vues · 6 derniers mois",
      exampleCaption: "Estimation d'exemple — les vrais chiffres sont calculés à partir d'une chaîne quand vous la cherchez ci-dessus.",
      stats: {
        subscribers: "Abonnés",
        monthlyViews: "Vues mensuelles",
        estimatedRevenue: "Revenu estimé",
        rpm: "RPM",
      },
    },
  },
  de: {
    common: { actions: { open: "Öffnen" }, labels: { soon: "Bald verfügbar" } },
    nav: {
      blog: "Blog",
      blogSoonTitle: "Der Blog kommt bald",
      menu: "Menü",
      mobilePrimary: "Hauptnavigation",
    },
    footer: {
      blog: "Blog",
      company: "Unternehmen",
      legal: "Rechtliches",
      estimatesBlurb: "Die Umsatzzahlen auf dieser Seite sind unabhängig berechnete Schätzungen.",
    },
    calculatorsMenu: {
      money: { label: "Einnahmenrechner", description: "Schätze die monatlichen Einnahmen eines Kanals." },
      rpm: { label: "RPM-Rechner", description: "Einnahmen pro 1.000 monetarisierte Aufrufe." },
      cpm: { label: "CPM-Rechner", description: "Was Werbetreibende pro 1.000 Impressionen zahlen." },
      shorts: { label: "Shorts-Rechner", description: "Schätze Auszahlungen aus dem Shorts-Creator-Pool." },
      sponsorship: { label: "Sponsoring-Rechner", description: "Schätze Sponsoring-Preise für Brand Deals." },
    },
    popularCalculators: {
      eyebrow: "Tools",
      title: "Beliebte Rechner",
      cards: {
        money: { title: "Einnahmenrechner", description: "Schätze den monatlichen Gesamtumsatz eines Kanals aus Langform- und Shorts-Aufrufen." },
        rpm: { title: "RPM-Rechner", description: "Einnahmen pro 1.000 monetarisierte Aufrufe — eine Kennzahl aus Creator-Sicht." },
        cpm: { title: "CPM-Rechner", description: "Was Werbetreibende pro 1.000 Impressionen zahlen. Nützlich als Preisrichtwert." },
        shorts: { title: "Shorts-Rechner", description: "Schätze Auszahlungen aus dem Creator-Pool anhand von Shorts-Aufrufen und Monetarisierung." },
        sponsorship: { title: "Sponsoring-Rechner", description: "Groben Preis für Brand Deals aus Abonnenten und Engagement schätzen." },
      },
    },
    whyBeHumler: {
      eyebrow: "Warum BeHumler",
      title: "Ernstzunehmende Analytik ohne Zugangshürden",
      subtitle: "Jeder Creator verdient ehrliche, transparente Zahlen. BeHumler liefert dir eine belastbare Schätzung, mit der du wirklich arbeiten kannst.",
      features: {
        accurate: { title: "Präzise Schätzungen", description: "Jede Zahl leitet sich aus öffentlichen YouTube-Statistiken und transparent veröffentlichten Formeln ab." },
        fast: { title: "Schnelle Ergebnisse", description: "Kanalname oder @Handle eintippen und in Sekunden eine vollständige Einnahmen-Aufschlüsselung erhalten." },
        poweredBy: { title: "Basierend auf der YouTube Data API", description: "Wir holen die Kanaldaten live über die offizielle YouTube Data API v3 von Google — kein Scraping." },
        privacy: { title: "Datenschutzfreundlich", description: "Keine Anmeldung. Kein Tracking der gesuchten Kanäle. Kürzliche Suchen bleiben nur auf deinem Gerät gespeichert." },
      },
    },
    homeFaq: {
      eyebrow: "FAQ",
      title: "Häufig gestellte Fragen",
      items: {
        accuracy: {
          q: "Wie genau sind die Einnahmenschätzungen?",
          a: "Die Zahlen sind Schätzungen, keine tatsächlichen Einnahmen. Sie kombinieren die öffentlichen Aufrufzahlen eines Kanals mit branchenüblichen RPM/CPM-Bandbreiten. Reale Einnahmen hängen vom Anzeigen-Mix, der Länderverteilung der Zuschauer, der Wiedergabezeit, dem YouTube-Premium-Anteil und weiteren Faktoren ab, die aus öffentlichen Daten nicht sichtbar sind.",
        },
        rpm: {
          q: "Wie wird der RPM berechnet?",
          a: "RPM (Revenue Per Mille) ist der Gesamtumsatz geteilt durch die monetarisierten Aufrufe, multipliziert mit tausend. Es ist eine Kennzahl aus Creator-Sicht — im Gegensatz zum CPM, den Werbetreibende pro tausend Impressionen zahlen. Der RPM ist meist niedriger als der CPM, weil er nicht monetarisierte Aufrufe berücksichtigt und den YouTube-Anteil abzieht.",
        },
        subscribers: {
          q: "Zahlt YouTube pro Abonnenten?",
          a: "Nein. YouTube zahlt für monetarisierte Anzeigenaufrufe und weitere qualifizierende Umsatzereignisse, nicht für die Zahl der Abonnenten. Abonnenten sind relevant, weil sie im Zeitverlauf mehr Aufrufe erzeugen, aber die Zahl selbst ist keine direkte Auszahlung.",
        },
        shorts: {
          q: "Kann ich Shorts-Einnahmen schätzen?",
          a: "Ja. Shorts monetarisieren über den Creator-Pool statt über Pre-Roll-Anzeigen, daher liegt ihr RPM meist deutlich unter dem der Langform. Unser Shorts-Rechner verwendet eine eigene RPM-Bandbreite, die diesen Unterschied abbildet.",
        },
      },
    },
    dashboardPreview: {
      channelSnapshot: "Kanal-Momentaufnahme",
      sampleCreator: "Beispiel-Creator",
      illustrativePreview: "Illustrative Vorschau",
      viewsLast6Months: "Aufrufe · letzte 6 Monate",
      exampleCaption: "Beispielhafte Schätzung — die realen Werte werden aus einem echten Kanal berechnet, sobald du oben suchst.",
      stats: {
        subscribers: "Abonnenten",
        monthlyViews: "Aufrufe pro Monat",
        estimatedRevenue: "Geschätzter Umsatz",
        rpm: "RPM",
      },
    },
  },
  hi: {
    common: { actions: { open: "खोलें" }, labels: { soon: "जल्द ही" } },
    nav: {
      blog: "ब्लॉग",
      blogSoonTitle: "ब्लॉग जल्द ही आ रहा है",
      menu: "मेन्यू",
      mobilePrimary: "मुख्य",
    },
    footer: {
      blog: "ब्लॉग",
      company: "कंपनी",
      legal: "क़ानूनी",
      estimatesBlurb: "इस साइट पर दिखाए गए राजस्व के आँकड़े स्वतंत्र रूप से गणना किए गए अनुमान हैं।",
    },
    calculatorsMenu: {
      money: { label: "मनी कैलकुलेटर", description: "किसी चैनल की मासिक कमाई का अनुमान लगाएँ।" },
      rpm: { label: "RPM कैलकुलेटर", description: "प्रति 1,000 मॉनेटाइज़्ड व्यूज़ आय।" },
      cpm: { label: "CPM कैलकुलेटर", description: "प्रति 1,000 इंप्रेशन विज्ञापनदाता की लागत।" },
      shorts: { label: "Shorts कैलकुलेटर", description: "Shorts क्रिएटर पूल भुगतान का अनुमान लगाएँ।" },
      sponsorship: { label: "स्पॉन्सरशिप कैलकुलेटर", description: "ब्रांड डील दरों का अनुमान लगाएँ।" },
    },
    popularCalculators: {
      eyebrow: "टूल्स",
      title: "लोकप्रिय कैलकुलेटर",
      cards: {
        money: { title: "YouTube मनी कैलकुलेटर", description: "लॉन्ग-फ़ॉर्म और Shorts व्यूज़ मिलाकर किसी चैनल की कुल मासिक कमाई का अनुमान लगाएँ।" },
        rpm: { title: "RPM कैलकुलेटर", description: "प्रति 1,000 मॉनेटाइज़्ड व्यूज़ आय — क्रिएटर की तरफ़ का मापदंड।" },
        cpm: { title: "CPM कैलकुलेटर", description: "प्रति 1,000 इंप्रेशन विज्ञापनदाता क्या देते हैं। क़ीमत के मानक के लिए उपयोगी।" },
        shorts: { title: "Shorts कैलकुलेटर", description: "Shorts व्यूज़ और मॉनेटाइज़ेशन के आधार पर क्रिएटर पूल भुगतान का अनुमान लगाएँ।" },
        sponsorship: { title: "स्पॉन्सरशिप कैलकुलेटर", description: "सब्सक्राइबर और एंगेजमेंट से ब्रांड डील की मोटी दर।" },
      },
    },
    whyBeHumler: {
      eyebrow: "BeHumler क्यों",
      title: "बिना गेटकीपिंग के गंभीर एनालिटिक्स",
      subtitle: "हर क्रिएटर ईमानदार, पारदर्शी आँकड़ों का हक़दार है। BeHumler आपको एक ऐसा अनुमान देता है जिसके बारे में आप सचमुच सोच-समझ सकते हैं।",
      features: {
        accurate: { title: "सटीक अनुमान", description: "हर आँकड़ा पारदर्शी, प्रकाशित सूत्रों का उपयोग करते हुए YouTube के सार्वजनिक आँकड़ों से आता है।" },
        fast: { title: "तेज़ नतीजे", description: "एक चैनल नाम या @handle टाइप करें और सेकंड में पूरी कमाई का विवरण पाएँ।" },
        poweredBy: { title: "YouTube Data API पर आधारित", description: "हम चैनल के आँकड़े सीधे Google की आधिकारिक YouTube Data API v3 से लेते हैं — कोई स्क्रैपिंग नहीं।" },
        privacy: { title: "गोपनीयता के अनुकूल", description: "कोई लॉगिन नहीं। खोजे गए चैनलों की ट्रैकिंग नहीं। हाल की खोजें आपके डिवाइस पर ही सहेजी जाती हैं।" },
      },
    },
    homeFaq: {
      eyebrow: "अक्सर पूछे जाने वाले प्रश्न",
      title: "अक्सर पूछे जाने वाले प्रश्न",
      items: {
        accuracy: {
          q: "कमाई के अनुमान कितने सटीक हैं?",
          a: "आँकड़े अनुमान हैं, वास्तविक आय नहीं। ये चैनल के सार्वजनिक व्यूज़ को उद्योग के सामान्य RPM/CPM रेंज के साथ जोड़ते हैं। असल कमाई विज्ञापन मिक्स, दर्शक के देश, वॉच टाइम, YouTube Premium हिस्से और अन्य कारकों पर निर्भर करती है, जिन्हें केवल सार्वजनिक डेटा से नहीं देखा जा सकता।",
        },
        rpm: {
          q: "RPM कैसे निकाला जाता है?",
          a: "RPM (Revenue Per Mille) कुल आय को मॉनेटाइज़्ड व्यूज़ से भाग देकर हज़ार से गुणा करने पर मिलता है। यह क्रिएटर की तरफ़ का मापदंड है — CPM से अलग, जो 1,000 इंप्रेशन पर विज्ञापनदाता देते हैं। RPM आमतौर पर CPM से कम होता है क्योंकि इसमें ग़ैर-मॉनेटाइज़्ड व्यूज़ शामिल होते हैं और YouTube का हिस्सा घटाया जाता है।",
        },
        subscribers: {
          q: "क्या YouTube प्रति सब्सक्राइबर भुगतान करता है?",
          a: "नहीं। YouTube मॉनेटाइज़्ड विज्ञापन व्यूज़ और अन्य पात्र आय घटनाओं पर भुगतान करता है, सब्सक्राइबरों की संख्या पर नहीं। सब्सक्राइबर मायने रखते हैं क्योंकि वे समय के साथ ज़्यादा व्यूज़ लाते हैं, पर संख्या स्वयं सीधी भुगतान नहीं है।",
        },
        shorts: {
          q: "क्या मैं Shorts की आय का अनुमान लगा सकता/सकती हूँ?",
          a: "हाँ। Shorts pre-roll विज्ञापनों के बजाय क्रिएटर पूल के ज़रिए मॉनेटाइज़ होते हैं, इसलिए इनका RPM आमतौर पर लॉन्ग-फ़ॉर्म से काफ़ी कम होता है। हमारा Shorts कैलकुलेटर इस अंतर को दर्शाने के लिए एक अलग Shorts RPM बैंड लागू करता है।",
        },
      },
    },
    dashboardPreview: {
      channelSnapshot: "चैनल की झलक",
      sampleCreator: "नमूना क्रिएटर",
      illustrativePreview: "उदाहरण के लिए पूर्वावलोकन",
      viewsLast6Months: "व्यूज़ · पिछले 6 महीने",
      exampleCaption: "उदाहरण अनुमान — असल आँकड़े तब निकलते हैं जब आप ऊपर कोई असली चैनल खोजते हैं।",
      stats: {
        subscribers: "सब्सक्राइबर",
        monthlyViews: "मासिक व्यूज़",
        estimatedRevenue: "अनुमानित आय",
        rpm: "RPM",
      },
    },
  },
  ja: {
    common: { actions: { open: "開く" }, labels: { soon: "近日公開" } },
    nav: {
      blog: "ブログ",
      blogSoonTitle: "ブログは近日公開",
      menu: "メニュー",
      mobilePrimary: "メイン",
    },
    footer: {
      blog: "ブログ",
      company: "運営",
      legal: "法的情報",
      estimatesBlurb: "本サイトで表示している収益額は、独立して算出した見積もりです。",
    },
    calculatorsMenu: {
      money: { label: "収益電卓", description: "チャンネルの月間収益を見積もります。" },
      rpm: { label: "RPM 電卓", description: "収益化された 1,000 回の視聴あたりの収益。" },
      cpm: { label: "CPM 電卓", description: "1,000 回の広告インプレッションあたりに広告主が支払う額。" },
      shorts: { label: "Shorts 電卓", description: "Shorts クリエイタープールからの支払いを見積もります。" },
      sponsorship: { label: "スポンサー電卓", description: "ブランド案件の料金を見積もります。" },
    },
    popularCalculators: {
      eyebrow: "ツール",
      title: "よく使われる電卓",
      cards: {
        money: { title: "YouTube 収益電卓", description: "通常動画と Shorts の視聴を合わせたチャンネルの月間総収益を見積もります。" },
        rpm: { title: "RPM 電卓", description: "収益化された 1,000 回の視聴あたりの収益 — クリエイター側の指標です。" },
        cpm: { title: "CPM 電卓", description: "1,000 回の広告インプレッションあたりに広告主が支払う額。価格の目安に便利です。" },
        shorts: { title: "Shorts 電卓", description: "Shorts の視聴数と収益化構成から、クリエイタープール支払いを見積もります。" },
        sponsorship: { title: "スポンサー電卓", description: "登録者数とエンゲージメントから、ブランド案件の料金を概算します。" },
      },
    },
    whyBeHumler: {
      eyebrow: "BeHumler の理由",
      title: "垣根のない、本気の分析",
      subtitle: "すべてのクリエイターに、正直で透明性のある数字を。BeHumler は根拠を持って議論できる見積もりを提供します。",
      features: {
        accurate: { title: "妥当な見積もり", description: "すべての数値は、公開されている透明な計算式と YouTube の公開統計から導き出されます。" },
        fast: { title: "素早い結果", description: "チャンネル名や @ハンドルを入力するだけで、数秒で収益の内訳が表示されます。" },
        poweredBy: { title: "YouTube Data API を使用", description: "Google 公式の YouTube Data API v3 からチャンネル統計をライブで取得します — スクレイピングはしません。" },
        privacy: { title: "プライバシーに配慮", description: "ログイン不要。検索したチャンネルのトラッキングもありません。最近の検索はご利用のデバイスにのみ保存されます。" },
      },
    },
    homeFaq: {
      eyebrow: "よくある質問",
      title: "よくある質問",
      items: {
        accuracy: {
          q: "収益の見積もりはどのくらい正確ですか？",
          a: "数値は見積もりであり、実際の収益ではありません。チャンネルの公開視聴数と、業界的に典型的な RPM/CPM の幅を組み合わせています。実際の収益は広告構成、視聴者の地域、視聴時間、YouTube Premium の比率など、公開データだけでは把握できない多くの要因に依存します。",
        },
        rpm: {
          q: "RPM はどのように計算されますか？",
          a: "RPM（Revenue Per Mille）は、総収益を収益化された視聴数で割り、1,000 を掛けた値です。クリエイター側の指標で、1,000 インプレッションあたりに広告主が支払う CPM とは異なります。RPM は収益化されていない視聴も含み、YouTube の取り分を差し引くため、通常は CPM より低くなります。",
        },
        subscribers: {
          q: "YouTube は登録者ごとに支払いますか？",
          a: "いいえ。YouTube は収益化された広告視聴などの条件を満たす収益イベントに対して支払います。登録者数そのものが支払い対象ではありません。登録者数は時間の経過とともに視聴数を押し上げる要因として意味がありますが、直接の対価ではありません。",
        },
        shorts: {
          q: "Shorts の収益を見積もることはできますか？",
          a: "はい。Shorts はプレロール広告ではなく、クリエイタープールを通じて収益化されるため、RPM は通常動画と比べて大幅に低くなります。当社の Shorts 電卓は、この差を反映した専用の RPM 帯を適用します。",
        },
      },
    },
    dashboardPreview: {
      channelSnapshot: "チャンネル概況",
      sampleCreator: "サンプルクリエイター",
      illustrativePreview: "参考用プレビュー",
      viewsLast6Months: "視聴回数 · 直近 6 か月",
      exampleCaption: "参考用の見積もりです — 上で実際のチャンネルを検索すると、そのチャンネルに基づいた数値が計算されます。",
      stats: {
        subscribers: "登録者",
        monthlyViews: "月間視聴回数",
        estimatedRevenue: "推定収益",
        rpm: "RPM",
      },
    },
  },
};

async function main() {
  for (const [locale, additions] of Object.entries(TRANSLATIONS)) {
    const filepath = path.join(messagesDir, `${locale}.json`);
    const raw = await fs.readFile(filepath, "utf8");
    const existing = JSON.parse(raw);
    const merged = deepMerge(existing, additions);
    const output = JSON.stringify(merged, null, 2) + "\n";
    await fs.writeFile(filepath, output, "utf8");
    process.stdout.write(`  updated ${locale}.json\n`);
  }
  process.stdout.write("done.\n");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
