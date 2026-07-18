#!/usr/bin/env node
/**
 * Merge blog-UI message keys into every locale bundle.
 *
 * Idempotent — running twice does not double-write. Values from this
 * table fill in missing keys on the target JSON and overwrite existing
 * scalar values, so this file is the authoritative source for blog
 * translations.
 *
 * For the initial launch the blog content itself is English-only —
 * non-EN locales see the `TranslationPending` notice on individual
 * article pages. The listing UI (nav, filters, hero copy, share
 * buttons, etc.) IS translated for every locale so a visitor never
 * hits raw English chrome around the notice.
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const messagesDir = path.join(__dirname, "..", "messages");

function deepMerge(target, source) {
  if (source === null || typeof source !== "object") return source;
  if (target === null || typeof target !== "object") return source;
  const out = { ...target };
  for (const [k, v] of Object.entries(source)) out[k] = deepMerge(target?.[k], v);
  return out;
}

const CATEGORIES = {
  monetization: {
    en: { label: "YouTube Monetization", description: "Ads, memberships, Super Chat, Premium — every path to actually getting paid on YouTube." },
    es: { label: "Monetización de YouTube", description: "Anuncios, membresías, Super Chat, Premium — todas las vías para cobrar de verdad en YouTube." },
    pt: { label: "Monetização do YouTube", description: "Anúncios, membros, Super Chat, Premium — todas as formas de receber dinheiro no YouTube." },
    fr: { label: "Monétisation YouTube", description: "Publicités, adhésions, Super Chat, Premium — toutes les façons de vraiment être payé sur YouTube." },
    de: { label: "YouTube-Monetarisierung", description: "Anzeigen, Mitgliedschaften, Super Chat, Premium — jeder Weg, auf YouTube tatsächlich Geld zu verdienen." },
    hi: { label: "YouTube मॉनेटाइज़ेशन", description: "विज्ञापन, मेम्बरशिप, सुपर चैट, Premium — YouTube पर सच में कमाने के हर तरीक़े।" },
    ja: { label: "YouTube 収益化", description: "広告、メンバーシップ、Super Chat、Premium — YouTube で実際に収益を得るすべての手段。" },
  },
  growth: {
    en: { label: "YouTube Growth", description: "Practical advice on packaging, retention, publishing cadence, and audience compounding." },
    es: { label: "Crecimiento en YouTube", description: "Consejos prácticos sobre miniaturas, retención, cadencia de publicación y crecimiento de la audiencia." },
    pt: { label: "Crescimento no YouTube", description: "Conselhos práticos sobre miniaturas, retenção, cadência de publicação e crescimento da audiência." },
    fr: { label: "Croissance YouTube", description: "Conseils pratiques sur les miniatures, la rétention, la fréquence de publication et l'effet cumulé sur l'audience." },
    de: { label: "YouTube-Wachstum", description: "Praktische Ratschläge zu Thumbnails, Retention, Veröffentlichungsrhythmus und wachsender Reichweite." },
    hi: { label: "YouTube ग्रोथ", description: "थंबनेल, रिटेंशन, प्रकाशन नियमितता और दर्शक-वृद्धि पर व्यावहारिक सलाह।" },
    ja: { label: "YouTube グロース", description: "サムネイル、視聴維持、投稿頻度、視聴者の積み上げに関する実践的なアドバイス。" },
  },
  "creator-economy": {
    en: { label: "Creator Economy", description: "How money moves through the modern creator ecosystem — platforms, patrons, and payouts." },
    es: { label: "Economía Creator", description: "Cómo se mueve el dinero en el ecosistema creator moderno: plataformas, mecenas y pagos." },
    pt: { label: "Economia Criador", description: "Como o dinheiro circula no ecossistema criador moderno — plataformas, apoiadores e pagamentos." },
    fr: { label: "Économie des créateurs", description: "Comment l'argent circule dans l'écosystème créateur moderne — plateformes, mécènes et paiements." },
    de: { label: "Creator-Ökonomie", description: "Wie Geld im modernen Creator-Ökosystem fließt — Plattformen, Förderer und Auszahlungen." },
    hi: { label: "क्रिएटर इकोनॉमी", description: "आधुनिक क्रिएटर इकोसिस्टम में पैसा कैसे चलता है — प्लेटफ़ॉर्म, संरक्षक और भुगतान।" },
    ja: { label: "クリエイターエコノミー", description: "現代のクリエイターエコシステムにおけるお金の流れ — プラットフォーム、支援者、支払い。" },
  },
  analytics: {
    en: { label: "Analytics", description: "Making sense of the numbers in YouTube Studio — and the ones YouTube doesn't show you." },
    es: { label: "Análisis", description: "Entender los números de YouTube Studio, y los que YouTube no te muestra." },
    pt: { label: "Análises", description: "Dar sentido aos números do YouTube Studio — e aos que o YouTube não mostra." },
    fr: { label: "Analyse", description: "Donner du sens aux chiffres de YouTube Studio — et à ceux que YouTube ne montre pas." },
    de: { label: "Analytik", description: "Die Zahlen in YouTube Studio einordnen — und die, die YouTube nicht zeigt." },
    hi: { label: "एनालिटिक्स", description: "YouTube Studio के आँकड़ों को समझना — और वे भी जो YouTube नहीं दिखाता।" },
    ja: { label: "アナリティクス", description: "YouTube Studio の数字を読み解く — そして YouTube が見せない数字も。" },
  },
  seo: {
    en: { label: "SEO", description: "How search and suggested-video traffic works — for both Google and YouTube." },
    es: { label: "SEO", description: "Cómo funciona el tráfico de búsqueda y vídeos sugeridos, tanto en Google como en YouTube." },
    pt: { label: "SEO", description: "Como funciona o tráfego de pesquisa e vídeos sugeridos — no Google e no YouTube." },
    fr: { label: "SEO", description: "Comment fonctionne le trafic de recherche et de vidéos suggérées — sur Google comme sur YouTube." },
    de: { label: "SEO", description: "Wie Such- und Empfehlungstraffic funktioniert — für Google und für YouTube." },
    hi: { label: "SEO", description: "सर्च और सुझाए गए वीडियो का ट्रैफ़िक कैसे काम करता है — Google और YouTube दोनों पर।" },
    ja: { label: "SEO", description: "検索と関連動画のトラフィックがどう動くか — Google と YouTube の両方について。" },
  },
  sponsorships: {
    en: { label: "Sponsorships", description: "Pricing, contracts, deliverables, exclusivity — everything creators wish they knew earlier." },
    es: { label: "Patrocinios", description: "Precios, contratos, entregables, exclusividad — todo lo que los creadores desearían haber sabido antes." },
    pt: { label: "Patrocínios", description: "Preços, contratos, entregáveis, exclusividade — tudo o que os criadores gostariam de ter sabido antes." },
    fr: { label: "Sponsoring", description: "Tarifs, contrats, livrables, exclusivité — tout ce que les créateurs auraient aimé savoir plus tôt." },
    de: { label: "Sponsoring", description: "Preise, Verträge, Deliverables, Exklusivität — alles, was Creator früher gewusst haben wollten." },
    hi: { label: "स्पॉन्सरशिप", description: "क़ीमतें, कॉन्ट्रैक्ट, डिलीवरेबल, एक्सक्लूसिविटी — जो हर क्रिएटर पहले से जानना चाहता।" },
    ja: { label: "スポンサーシップ", description: "料金、契約、成果物、独占契約 — クリエイターがもっと早く知りたかったことすべて。" },
  },
  shorts: {
    en: { label: "Shorts", description: "The vertical-video economy: Creator Pool math, hooks, and long-form crossover." },
    es: { label: "Shorts", description: "La economía del vídeo vertical: matemática del fondo de creadores, ganchos y cruce con formato largo." },
    pt: { label: "Shorts", description: "A economia do vídeo vertical: matemática do fundo de criadores, ganchos e cruzamento com o formato longo." },
    fr: { label: "Shorts", description: "L'économie de la vidéo verticale : calculs du fonds Créateurs, accroches et passerelles avec le format long." },
    de: { label: "Shorts", description: "Die Ökonomie des Hochformats: Creator-Pool-Mathematik, Hooks und Übergang ins Langformat." },
    hi: { label: "Shorts", description: "वर्टिकल वीडियो की अर्थव्यवस्था: क्रिएटर पूल गणित, हुक और लॉन्ग-फ़ॉर्म से जुड़ाव।" },
    ja: { label: "Shorts", description: "縦型動画のエコノミー：クリエイタープールの数学、フック、通常動画との連携。" },
  },
  guides: {
    en: { label: "Guides", description: "Long-form deep dives that pull the whole picture together for creators just getting serious." },
    es: { label: "Guías", description: "Guías largas y detalladas que unen todas las piezas para creadores que empiezan a tomárselo en serio." },
    pt: { label: "Guias", description: "Guias longos e detalhados que juntam tudo para criadores que estão a começar a levar isto a sério." },
    fr: { label: "Guides", description: "Guides longs et détaillés qui rassemblent le tout pour les créateurs qui commencent à s'y mettre sérieusement." },
    de: { label: "Guides", description: "Ausführliche Guides, die das Gesamtbild für Creator zusammenführen, die es ernst zu meinen beginnen." },
    hi: { label: "गाइड", description: "विस्तृत लॉन्ग-फ़ॉर्म गाइड जो उन क्रिएटरों के लिए पूरी तस्वीर एक जगह लाते हैं जो अब गंभीर हो रहे हैं।" },
    ja: { label: "ガイド", description: "本気で取り組み始めたクリエイターのために全体像をまとめる長編ガイド。" },
  },
};

/** Fixed shell strings (used across every article & listing page). */
const SHELL = {
  en: {
    nav: { blog: "Blog" }, // overwrite: Blog is now a real destination
    footer: { blog: "Blog" },
    blog: {
      hero: {
        eyebrow: "The BeHumler blog",
        title: "Creator Economy & YouTube Growth",
        subtitle: "Honest, well-sourced writing on how creators actually make money on YouTube — with no keyword-stuffed filler.",
      },
      search: {
        srLabel: "Search articles",
        placeholder: "Search articles by title, tag, or category",
        clearAria: "Clear search",
        empty: "No articles match \"{query}\". Try a different keyword.",
      },
      categories: {
        all: "All",
        navLabel: "Browse by category",
        eyebrow: "Category",
        empty: "No articles in this category yet — check back soon.",
      },
      sections: {
        featuredEyebrow: "Editor's pick",
        featured: "Featured article",
        latestEyebrow: "Latest",
        latest: "Latest articles",
        popularEyebrow: "Popular",
        popular: "Popular articles",
      },
      newsletter: {
        title: "Get the creator-economy briefing",
        description: "One short, honest email when we publish something worth reading. No spam, no upsells, unsubscribe with one click.",
        emailPlaceholder: "you@example.com",
        subscribe: "Subscribe",
        thanks: "Thanks — you're on the list. We'll be in touch when the next article ships.",
        privacyNote: "We only use your email to send the briefing. See our privacy page for details.",
      },
      article: {
        readingTime: "{count, plural, one {# min read} other {# min read}}",
        publishedOn: "Published on {date}",
        updated: "Updated {date}",
        by: "By {author}",
        tocTitle: "On this page",
        relatedTitle: "Related articles",
        prevArticle: "Previous",
        nextArticle: "Next",
        prevNextLabel: "Article navigation",
        backToBlog: "← Back to the blog",
        share: {
          title: "Share this article",
          share: "Share",
          shareVia: "Share \"{title}\" from your device",
          copyLink: "Copy link",
          linkCopied: "Copied ✓",
          linkCopiedStatus: "Link copied to your clipboard.",
          copyError: "Couldn't copy — you can copy the URL from the address bar.",
          shareOnSocial: "Share on {network} ({newTab})",
        },
      },
      meta: {
        title: "The BeHumler Blog — Creator Economy & YouTube Growth",
        description: "Genuinely useful writing on how creators actually make money on YouTube: RPM, CPM, sponsorships, Shorts payouts, and the platforms shaping the creator economy.",
        breadcrumbHome: "Home",
        breadcrumbBlog: "Blog",
      },
      categories: {
        all: "All",
        navLabel: "Browse by category",
        eyebrow: "Category",
        empty: "No articles in this category yet — check back soon.",
        monetization: { label: CATEGORIES.monetization.en.label, description: CATEGORIES.monetization.en.description },
        growth: { label: CATEGORIES.growth.en.label, description: CATEGORIES.growth.en.description },
        "creator-economy": { label: CATEGORIES["creator-economy"].en.label, description: CATEGORIES["creator-economy"].en.description },
        analytics: { label: CATEGORIES.analytics.en.label, description: CATEGORIES.analytics.en.description },
        seo: { label: CATEGORIES.seo.en.label, description: CATEGORIES.seo.en.description },
        sponsorships: { label: CATEGORIES.sponsorships.en.label, description: CATEGORIES.sponsorships.en.description },
        shorts: { label: CATEGORIES.shorts.en.label, description: CATEGORIES.shorts.en.description },
        guides: { label: CATEGORIES.guides.en.label, description: CATEGORIES.guides.en.description },
      },
      tags: {
        eyebrow: "Tag",
        pageTitle: "Articles tagged #{tag}",
        pageDescription: "Every BeHumler article filed under the #{tag} tag.",
      },
    },
  },
};

// Localized copy per locale. English is authoritative; other locales
// translate ONLY the chrome (hero + search + section headings + share
// row + article meta). Article bodies are English-only for now.
const LOCALIZED = {
  es: {
    nav: { blog: "Blog" },
    footer: { blog: "Blog" },
    blog: {
      hero: {
        eyebrow: "El blog de BeHumler",
        title: "Economía Creator y Crecimiento en YouTube",
        subtitle: "Escritura honesta y bien documentada sobre cómo los creadores ganan dinero en YouTube — sin relleno cargado de palabras clave.",
      },
      search: {
        srLabel: "Buscar artículos",
        placeholder: "Busca artículos por título, etiqueta o categoría",
        clearAria: "Borrar búsqueda",
        empty: "Ningún artículo coincide con \"{query}\". Prueba con otra palabra clave.",
      },
      sections: {
        featuredEyebrow: "Selección editorial",
        featured: "Artículo destacado",
        latestEyebrow: "Últimos",
        latest: "Últimos artículos",
        popularEyebrow: "Populares",
        popular: "Artículos populares",
      },
      newsletter: {
        title: "Recibe el resumen creator economy",
        description: "Un correo breve y honesto cuando publicamos algo que valga la pena leer. Sin spam ni ventas cruzadas, cancelación con un clic.",
        emailPlaceholder: "tu@ejemplo.com",
        subscribe: "Suscribirse",
        thanks: "¡Gracias! Estás en la lista. Te escribiremos cuando salga el próximo artículo.",
        privacyNote: "Usamos tu correo solo para enviarte el resumen. Consulta la página de privacidad para más detalles.",
      },
      article: {
        readingTime: "{count, plural, one {# min de lectura} other {# min de lectura}}",
        publishedOn: "Publicado el {date}",
        updated: "Actualizado el {date}",
        by: "Por {author}",
        tocTitle: "En esta página",
        relatedTitle: "Artículos relacionados",
        prevArticle: "Anterior",
        nextArticle: "Siguiente",
        prevNextLabel: "Navegación de artículos",
        backToBlog: "← Volver al blog",
        share: {
          title: "Compartir este artículo",
          share: "Compartir",
          shareVia: "Compartir \"{title}\" desde tu dispositivo",
          copyLink: "Copiar enlace",
          linkCopied: "Copiado ✓",
          linkCopiedStatus: "Enlace copiado al portapapeles.",
          copyError: "No se pudo copiar — puedes copiar la URL desde la barra de direcciones.",
          shareOnSocial: "Compartir en {network} ({newTab})",
        },
      },
      meta: {
        title: "El blog de BeHumler — Economía Creator y crecimiento en YouTube",
        description: "Escritura honesta sobre cómo los creadores ganan dinero de verdad en YouTube: RPM, CPM, patrocinios, pagos de Shorts y las plataformas que definen la economía creator.",
        breadcrumbHome: "Inicio",
        breadcrumbBlog: "Blog",
      },
      categories: {
        all: "Todos",
        navLabel: "Explorar por categoría",
        eyebrow: "Categoría",
        empty: "Aún no hay artículos en esta categoría — vuelve pronto.",
        monetization: { label: CATEGORIES.monetization.es.label, description: CATEGORIES.monetization.es.description },
        growth: { label: CATEGORIES.growth.es.label, description: CATEGORIES.growth.es.description },
        "creator-economy": { label: CATEGORIES["creator-economy"].es.label, description: CATEGORIES["creator-economy"].es.description },
        analytics: { label: CATEGORIES.analytics.es.label, description: CATEGORIES.analytics.es.description },
        seo: { label: CATEGORIES.seo.es.label, description: CATEGORIES.seo.es.description },
        sponsorships: { label: CATEGORIES.sponsorships.es.label, description: CATEGORIES.sponsorships.es.description },
        shorts: { label: CATEGORIES.shorts.es.label, description: CATEGORIES.shorts.es.description },
        guides: { label: CATEGORIES.guides.es.label, description: CATEGORIES.guides.es.description },
      },
      tags: {
        eyebrow: "Etiqueta",
        pageTitle: "Artículos etiquetados con #{tag}",
        pageDescription: "Todos los artículos de BeHumler bajo la etiqueta #{tag}.",
      },
    },
  },
  pt: {
    nav: { blog: "Blog" },
    footer: { blog: "Blog" },
    blog: {
      hero: {
        eyebrow: "O blog do BeHumler",
        title: "Economia Criador e Crescimento no YouTube",
        subtitle: "Escrita honesta e bem fundamentada sobre como os criadores realmente ganham dinheiro no YouTube — sem enchimento cheio de palavras-chave.",
      },
      search: {
        srLabel: "Pesquisar artigos",
        placeholder: "Pesquisa por título, etiqueta ou categoria",
        clearAria: "Limpar pesquisa",
        empty: "Nenhum artigo corresponde a \"{query}\". Tenta outra palavra-chave.",
      },
      sections: {
        featuredEyebrow: "Escolha editorial",
        featured: "Artigo em destaque",
        latestEyebrow: "Recentes",
        latest: "Artigos mais recentes",
        popularEyebrow: "Populares",
        popular: "Artigos populares",
      },
      newsletter: {
        title: "Recebe o resumo da economia criador",
        description: "Um e-mail curto e honesto quando publicamos algo digno de leitura. Sem spam, sem upsells, cancelas com um clique.",
        emailPlaceholder: "voce@exemplo.com",
        subscribe: "Subscrever",
        thanks: "Obrigado — estás na lista. Escrevemos quando o próximo artigo sair.",
        privacyNote: "Usamos o teu e-mail apenas para enviar o resumo. Vê a página de privacidade para mais detalhes.",
      },
      article: {
        readingTime: "{count, plural, one {# min de leitura} other {# min de leitura}}",
        publishedOn: "Publicado em {date}",
        updated: "Atualizado em {date}",
        by: "Por {author}",
        tocTitle: "Nesta página",
        relatedTitle: "Artigos relacionados",
        prevArticle: "Anterior",
        nextArticle: "Seguinte",
        prevNextLabel: "Navegação de artigos",
        backToBlog: "← Voltar ao blog",
        share: {
          title: "Partilhar este artigo",
          share: "Partilhar",
          shareVia: "Partilhar \"{title}\" a partir do teu dispositivo",
          copyLink: "Copiar link",
          linkCopied: "Copiado ✓",
          linkCopiedStatus: "Link copiado para a área de transferência.",
          copyError: "Não foi possível copiar — podes copiar o URL da barra de endereços.",
          shareOnSocial: "Partilhar no {network} ({newTab})",
        },
      },
      meta: {
        title: "O blog do BeHumler — Economia criador e crescimento no YouTube",
        description: "Escrita honesta sobre como os criadores realmente ganham dinheiro no YouTube: RPM, CPM, patrocínios, pagamentos de Shorts e as plataformas que moldam a economia criador.",
        breadcrumbHome: "Início",
        breadcrumbBlog: "Blog",
      },
      categories: {
        all: "Todos",
        navLabel: "Explorar por categoria",
        eyebrow: "Categoria",
        empty: "Ainda não há artigos nesta categoria — volta em breve.",
        monetization: { label: CATEGORIES.monetization.pt.label, description: CATEGORIES.monetization.pt.description },
        growth: { label: CATEGORIES.growth.pt.label, description: CATEGORIES.growth.pt.description },
        "creator-economy": { label: CATEGORIES["creator-economy"].pt.label, description: CATEGORIES["creator-economy"].pt.description },
        analytics: { label: CATEGORIES.analytics.pt.label, description: CATEGORIES.analytics.pt.description },
        seo: { label: CATEGORIES.seo.pt.label, description: CATEGORIES.seo.pt.description },
        sponsorships: { label: CATEGORIES.sponsorships.pt.label, description: CATEGORIES.sponsorships.pt.description },
        shorts: { label: CATEGORIES.shorts.pt.label, description: CATEGORIES.shorts.pt.description },
        guides: { label: CATEGORIES.guides.pt.label, description: CATEGORIES.guides.pt.description },
      },
      tags: {
        eyebrow: "Etiqueta",
        pageTitle: "Artigos com a etiqueta #{tag}",
        pageDescription: "Todos os artigos do BeHumler sob a etiqueta #{tag}.",
      },
    },
  },
  fr: {
    nav: { blog: "Blog" },
    footer: { blog: "Blog" },
    blog: {
      hero: {
        eyebrow: "Le blog BeHumler",
        title: "Économie des créateurs & croissance YouTube",
        subtitle: "Un point de vue honnête et documenté sur la façon dont les créateurs gagnent vraiment de l'argent sur YouTube — sans remplissage bourré de mots-clés.",
      },
      search: {
        srLabel: "Rechercher des articles",
        placeholder: "Cherchez par titre, tag ou catégorie",
        clearAria: "Effacer la recherche",
        empty: "Aucun article ne correspond à « {query} ». Essayez un autre mot-clé.",
      },
      sections: {
        featuredEyebrow: "Sélection éditoriale",
        featured: "Article à la une",
        latestEyebrow: "Récents",
        latest: "Derniers articles",
        popularEyebrow: "Populaires",
        popular: "Articles populaires",
      },
      newsletter: {
        title: "Recevez le brief économie des créateurs",
        description: "Un e-mail court et honnête quand nous publions quelque chose qui vaut le coup. Pas de spam, pas de vente incitative, désabonnement en un clic.",
        emailPlaceholder: "vous@exemple.com",
        subscribe: "S'abonner",
        thanks: "Merci — vous êtes sur la liste. Nous vous écrivons dès la prochaine parution.",
        privacyNote: "Nous n'utilisons votre e-mail que pour envoyer le brief. Voir la page confidentialité pour les détails.",
      },
      article: {
        readingTime: "{count, plural, one {# min de lecture} other {# min de lecture}}",
        publishedOn: "Publié le {date}",
        updated: "Mis à jour le {date}",
        by: "Par {author}",
        tocTitle: "Sur cette page",
        relatedTitle: "Articles associés",
        prevArticle: "Précédent",
        nextArticle: "Suivant",
        prevNextLabel: "Navigation entre articles",
        backToBlog: "← Retour au blog",
        share: {
          title: "Partager cet article",
          share: "Partager",
          shareVia: "Partager « {title} » depuis votre appareil",
          copyLink: "Copier le lien",
          linkCopied: "Copié ✓",
          linkCopiedStatus: "Lien copié dans le presse-papiers.",
          copyError: "Impossible de copier — vous pouvez copier l'URL depuis la barre d'adresse.",
          shareOnSocial: "Partager sur {network} ({newTab})",
        },
      },
      meta: {
        title: "Le blog BeHumler — Économie des créateurs & croissance YouTube",
        description: "Un point de vue honnête sur la façon dont les créateurs gagnent réellement de l'argent sur YouTube : RPM, CPM, sponsoring, revenus Shorts, et les plateformes qui façonnent l'économie des créateurs.",
        breadcrumbHome: "Accueil",
        breadcrumbBlog: "Blog",
      },
      categories: {
        all: "Tous",
        navLabel: "Parcourir par catégorie",
        eyebrow: "Catégorie",
        empty: "Aucun article dans cette catégorie pour l'instant — revenez bientôt.",
        monetization: { label: CATEGORIES.monetization.fr.label, description: CATEGORIES.monetization.fr.description },
        growth: { label: CATEGORIES.growth.fr.label, description: CATEGORIES.growth.fr.description },
        "creator-economy": { label: CATEGORIES["creator-economy"].fr.label, description: CATEGORIES["creator-economy"].fr.description },
        analytics: { label: CATEGORIES.analytics.fr.label, description: CATEGORIES.analytics.fr.description },
        seo: { label: CATEGORIES.seo.fr.label, description: CATEGORIES.seo.fr.description },
        sponsorships: { label: CATEGORIES.sponsorships.fr.label, description: CATEGORIES.sponsorships.fr.description },
        shorts: { label: CATEGORIES.shorts.fr.label, description: CATEGORIES.shorts.fr.description },
        guides: { label: CATEGORIES.guides.fr.label, description: CATEGORIES.guides.fr.description },
      },
      tags: {
        eyebrow: "Tag",
        pageTitle: "Articles taggés #{tag}",
        pageDescription: "Tous les articles BeHumler classés sous le tag #{tag}.",
      },
    },
  },
  de: {
    nav: { blog: "Blog" },
    footer: { blog: "Blog" },
    blog: {
      hero: {
        eyebrow: "Der BeHumler-Blog",
        title: "Creator-Ökonomie & YouTube-Wachstum",
        subtitle: "Ehrliches, gut recherchiertes Schreiben darüber, wie Creator auf YouTube wirklich Geld verdienen — ohne Keyword-Füller.",
      },
      search: {
        srLabel: "Artikel suchen",
        placeholder: "Suche nach Titel, Tag oder Kategorie",
        clearAria: "Suche leeren",
        empty: "Kein Artikel passt zu \u201E{query}\u201C. Versuche ein anderes Stichwort.",
      },
      sections: {
        featuredEyebrow: "Redaktionsempfehlung",
        featured: "Empfohlener Artikel",
        latestEyebrow: "Aktuell",
        latest: "Neueste Artikel",
        popularEyebrow: "Beliebt",
        popular: "Beliebte Artikel",
      },
      newsletter: {
        title: "Hol dir das Creator-Ökonomie-Briefing",
        description: "Eine kurze, ehrliche E-Mail, wenn wir etwas Lesenswertes veröffentlichen. Kein Spam, kein Upsell, Abmeldung mit einem Klick.",
        emailPlaceholder: "du@beispiel.com",
        subscribe: "Abonnieren",
        thanks: "Danke — du bist auf der Liste. Wir melden uns, wenn der nächste Artikel erscheint.",
        privacyNote: "Wir verwenden deine E-Mail nur, um das Briefing zu versenden. Details siehe Datenschutzseite.",
      },
      article: {
        readingTime: "{count, plural, one {# Min. Lesezeit} other {# Min. Lesezeit}}",
        publishedOn: "Veröffentlicht am {date}",
        updated: "Aktualisiert am {date}",
        by: "Von {author}",
        tocTitle: "Auf dieser Seite",
        relatedTitle: "Verwandte Artikel",
        prevArticle: "Zurück",
        nextArticle: "Weiter",
        prevNextLabel: "Artikelnavigation",
        backToBlog: "← Zurück zum Blog",
        share: {
          title: "Diesen Artikel teilen",
          share: "Teilen",
          shareVia: "\u201E{title}\u201C vom Ger\u00E4t aus teilen",
          copyLink: "Link kopieren",
          linkCopied: "Kopiert ✓",
          linkCopiedStatus: "Link in die Zwischenablage kopiert.",
          copyError: "Konnte nicht kopiert werden — du kannst die URL aus der Adresszeile kopieren.",
          shareOnSocial: "Auf {network} teilen ({newTab})",
        },
      },
      meta: {
        title: "Der BeHumler-Blog — Creator-Ökonomie & YouTube-Wachstum",
        description: "Ehrliches Schreiben darüber, wie Creator auf YouTube wirklich Geld verdienen: RPM, CPM, Sponsoring, Shorts-Auszahlungen und die Plattformen, die die Creator-Ökonomie prägen.",
        breadcrumbHome: "Startseite",
        breadcrumbBlog: "Blog",
      },
      categories: {
        all: "Alle",
        navLabel: "Nach Kategorie stöbern",
        eyebrow: "Kategorie",
        empty: "In dieser Kategorie gibt es noch keine Artikel — schau bald wieder rein.",
        monetization: { label: CATEGORIES.monetization.de.label, description: CATEGORIES.monetization.de.description },
        growth: { label: CATEGORIES.growth.de.label, description: CATEGORIES.growth.de.description },
        "creator-economy": { label: CATEGORIES["creator-economy"].de.label, description: CATEGORIES["creator-economy"].de.description },
        analytics: { label: CATEGORIES.analytics.de.label, description: CATEGORIES.analytics.de.description },
        seo: { label: CATEGORIES.seo.de.label, description: CATEGORIES.seo.de.description },
        sponsorships: { label: CATEGORIES.sponsorships.de.label, description: CATEGORIES.sponsorships.de.description },
        shorts: { label: CATEGORIES.shorts.de.label, description: CATEGORIES.shorts.de.description },
        guides: { label: CATEGORIES.guides.de.label, description: CATEGORIES.guides.de.description },
      },
      tags: {
        eyebrow: "Tag",
        pageTitle: "Mit #{tag} getaggte Artikel",
        pageDescription: "Alle BeHumler-Artikel unter dem Tag #{tag}.",
      },
    },
  },
  hi: {
    nav: { blog: "ब्लॉग" },
    footer: { blog: "ब्लॉग" },
    blog: {
      hero: {
        eyebrow: "BeHumler ब्लॉग",
        title: "क्रिएटर इकोनॉमी और YouTube ग्रोथ",
        subtitle: "इस बारे में ईमानदार, अच्छी तरह से शोधित लेख कि क्रिएटर सच में YouTube से कैसे पैसे कमाते हैं — बिना कीवर्ड-भरी फ़िलर के।",
      },
      search: {
        srLabel: "लेख खोजें",
        placeholder: "शीर्षक, टैग या श्रेणी से लेख खोजें",
        clearAria: "खोज साफ़ करें",
        empty: "\"{query}\" से मेल खाता कोई लेख नहीं। कोई और कीवर्ड आज़माएँ।",
      },
      sections: {
        featuredEyebrow: "संपादक की पसंद",
        featured: "फ़ीचर्ड लेख",
        latestEyebrow: "नए",
        latest: "नवीनतम लेख",
        popularEyebrow: "लोकप्रिय",
        popular: "लोकप्रिय लेख",
      },
      newsletter: {
        title: "क्रिएटर इकोनॉमी ब्रीफ़िंग पाएँ",
        description: "जब हम पढ़ने लायक कुछ प्रकाशित करते हैं, एक छोटा, ईमानदार ईमेल। कोई स्पैम नहीं, कोई अपसेल नहीं, एक क्लिक में अनसब्सक्राइब।",
        emailPlaceholder: "aap@example.com",
        subscribe: "सब्सक्राइब करें",
        thanks: "धन्यवाद — आप सूची में हैं। अगला लेख आने पर हम संपर्क करेंगे।",
        privacyNote: "हम आपके ईमेल का उपयोग केवल ब्रीफ़िंग भेजने के लिए करते हैं। विवरण के लिए हमारी गोपनीयता पेज देखें।",
      },
      article: {
        readingTime: "{count} मिनट का पठन",
        publishedOn: "{date} को प्रकाशित",
        updated: "{date} को अपडेट",
        by: "लेखक: {author}",
        tocTitle: "इस पृष्ठ पर",
        relatedTitle: "संबंधित लेख",
        prevArticle: "पिछला",
        nextArticle: "अगला",
        prevNextLabel: "लेख नेविगेशन",
        backToBlog: "← ब्लॉग पर लौटें",
        share: {
          title: "यह लेख शेयर करें",
          share: "शेयर करें",
          shareVia: "\"{title}\" को अपने डिवाइस से शेयर करें",
          copyLink: "लिंक कॉपी करें",
          linkCopied: "कॉपी हो गया ✓",
          linkCopiedStatus: "लिंक क्लिपबोर्ड पर कॉपी हो गया है।",
          copyError: "कॉपी नहीं हो सका — आप एड्रेस बार से URL कॉपी कर सकते हैं।",
          shareOnSocial: "{network} पर शेयर करें ({newTab})",
        },
      },
      meta: {
        title: "BeHumler ब्लॉग — क्रिएटर इकोनॉमी और YouTube ग्रोथ",
        description: "इस बारे में ईमानदार लेख कि क्रिएटर सच में YouTube पर कैसे कमाते हैं: RPM, CPM, स्पॉन्सरशिप, Shorts से भुगतान, और वे प्लेटफ़ॉर्म जो क्रिएटर इकोनॉमी को आकार दे रहे हैं।",
        breadcrumbHome: "होम",
        breadcrumbBlog: "ब्लॉग",
      },
      categories: {
        all: "सभी",
        navLabel: "श्रेणी से देखें",
        eyebrow: "श्रेणी",
        empty: "इस श्रेणी में अभी कोई लेख नहीं — जल्द ही फिर देखें।",
        monetization: { label: CATEGORIES.monetization.hi.label, description: CATEGORIES.monetization.hi.description },
        growth: { label: CATEGORIES.growth.hi.label, description: CATEGORIES.growth.hi.description },
        "creator-economy": { label: CATEGORIES["creator-economy"].hi.label, description: CATEGORIES["creator-economy"].hi.description },
        analytics: { label: CATEGORIES.analytics.hi.label, description: CATEGORIES.analytics.hi.description },
        seo: { label: CATEGORIES.seo.hi.label, description: CATEGORIES.seo.hi.description },
        sponsorships: { label: CATEGORIES.sponsorships.hi.label, description: CATEGORIES.sponsorships.hi.description },
        shorts: { label: CATEGORIES.shorts.hi.label, description: CATEGORIES.shorts.hi.description },
        guides: { label: CATEGORIES.guides.hi.label, description: CATEGORIES.guides.hi.description },
      },
      tags: {
        eyebrow: "टैग",
        pageTitle: "#{tag} टैग वाले लेख",
        pageDescription: "#{tag} टैग के अंतर्गत सभी BeHumler लेख।",
      },
    },
  },
  ja: {
    nav: { blog: "ブログ" },
    footer: { blog: "ブログ" },
    blog: {
      hero: {
        eyebrow: "BeHumler ブログ",
        title: "クリエイターエコノミーと YouTube 成長",
        subtitle: "キーワードで水増ししない、正直で丁寧にリサーチされた記事。クリエイターが実際に YouTube でどう稼いでいるのかを扱います。",
      },
      search: {
        srLabel: "記事を検索",
        placeholder: "タイトル・タグ・カテゴリで記事を検索",
        clearAria: "検索をクリア",
        empty: "「{query}」に一致する記事はありません。別のキーワードでお試しください。",
      },
      sections: {
        featuredEyebrow: "編集部のおすすめ",
        featured: "注目記事",
        latestEyebrow: "新着",
        latest: "最新記事",
        popularEyebrow: "人気",
        popular: "人気の記事",
      },
      newsletter: {
        title: "クリエイターエコノミー ブリーフィングを受け取る",
        description: "読む価値のある記事を公開したときにだけ、短く正直なメールをお送りします。スパムや売り込みなし、ワンクリックで購読解除。",
        emailPlaceholder: "anata@example.com",
        subscribe: "購読する",
        thanks: "ありがとうございます — 登録が完了しました。次の記事が公開され次第ご連絡します。",
        privacyNote: "メールアドレスはブリーフィングの送信にのみ使用します。詳細はプライバシーページをご確認ください。",
      },
      article: {
        readingTime: "{count} 分で読めます",
        publishedOn: "{date} 公開",
        updated: "{date} 更新",
        by: "著者: {author}",
        tocTitle: "このページの目次",
        relatedTitle: "関連記事",
        prevArticle: "前の記事",
        nextArticle: "次の記事",
        prevNextLabel: "記事ナビゲーション",
        backToBlog: "← ブログに戻る",
        share: {
          title: "この記事をシェア",
          share: "シェア",
          shareVia: "「{title}」をデバイスからシェア",
          copyLink: "リンクをコピー",
          linkCopied: "コピーしました ✓",
          linkCopiedStatus: "リンクをクリップボードにコピーしました。",
          copyError: "コピーできませんでした — アドレスバーから URL をコピーしてください。",
          shareOnSocial: "{network} でシェア（{newTab}）",
        },
      },
      meta: {
        title: "BeHumler ブログ — クリエイターエコノミーと YouTube 成長",
        description: "クリエイターが実際に YouTube でどう収益を得ているのかについての、正直な記事。RPM、CPM、スポンサー、Shorts の支払い、そしてクリエイターエコノミーを形作るプラットフォームについて。",
        breadcrumbHome: "ホーム",
        breadcrumbBlog: "ブログ",
      },
      categories: {
        all: "すべて",
        navLabel: "カテゴリで探す",
        eyebrow: "カテゴリ",
        empty: "このカテゴリにはまだ記事がありません — またお立ち寄りください。",
        monetization: { label: CATEGORIES.monetization.ja.label, description: CATEGORIES.monetization.ja.description },
        growth: { label: CATEGORIES.growth.ja.label, description: CATEGORIES.growth.ja.description },
        "creator-economy": { label: CATEGORIES["creator-economy"].ja.label, description: CATEGORIES["creator-economy"].ja.description },
        analytics: { label: CATEGORIES.analytics.ja.label, description: CATEGORIES.analytics.ja.description },
        seo: { label: CATEGORIES.seo.ja.label, description: CATEGORIES.seo.ja.description },
        sponsorships: { label: CATEGORIES.sponsorships.ja.label, description: CATEGORIES.sponsorships.ja.description },
        shorts: { label: CATEGORIES.shorts.ja.label, description: CATEGORIES.shorts.ja.description },
        guides: { label: CATEGORIES.guides.ja.label, description: CATEGORIES.guides.ja.description },
      },
      tags: {
        eyebrow: "タグ",
        pageTitle: "#{tag} タグの記事",
        pageDescription: "#{tag} タグが付いた BeHumler の記事一覧。",
      },
    },
  },
};

async function main() {
  const perLocale = { en: SHELL.en, ...LOCALIZED };
  for (const [locale, additions] of Object.entries(perLocale)) {
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
