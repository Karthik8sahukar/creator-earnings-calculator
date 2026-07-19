#!/usr/bin/env node
/**
 * Merge creator-directory + creator-profile message keys into every
 * locale bundle.
 *
 * Idempotent — running twice does not double-write. Follows the same
 * shape as `merge-blog-messages.mjs`: English is authoritative; every
 * non-English locale receives translated chrome strings (nav item,
 * footer item, hero + filters + card aria + section titles + meta),
 * with the long-form editorial copy (earnings assumption, FAQ
 * answers, disclaimer) staying English-only for now.
 *
 * When a professional translator ships full localized copy for the
 * creator surface, this file is the one place to edit.
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

/**
 * Localized chrome for the top-level "Creators" nav item and footer,
 * plus the homepage "Popular creators" strip. Only strings that are
 * actually visible to a non-English reader need translation.
 */
const LOCALIZED = {
  en: {
    nav: { creators: "Creators", creatorsAria: "Browse YouTube creator profiles" },
    footer: { creators: "Creators" },
    popularCreators: {
      eyebrow: "Creators",
      title: "Popular creators",
      viewAll: "View all creators",
    },
    creators: {
      eyebrow: "Creators directory",
      title: "YouTube Creators",
      subtitle: "Browse and search YouTube creators. Every profile includes independent earnings estimates, channel statistics, and links to the calculators.",
      searchLabel: "Search creators",
      searchPlaceholder: "Search by name, handle, category or country",
      clearSearchAria: "Clear search",
      filterAll: "All",
      filterCountry: "Country",
      filterCategory: "Category",
      filterAlphabet: "Starts with",
      clearFilters: "Clear filters",
      resultCount: "{count, plural, =0 {No creators} one {# creator} other {# creators}}",
      emptyResults: "No creators match your filters. Try clearing them or searching for a different name.",
      card: { cardAria: "Open {name} profile" },
      meta: {
        title: "YouTube Creators Directory — Earnings, Revenue & Stats",
        description: "Browse YouTube creators with independent estimates for monthly earnings, revenue, sponsorship value, RPM, CPM, and channel statistics.",
        breadcrumb: "Creators",
      },
    },
    creator: {
      breadcrumb: { aria: "Breadcrumb", creators: "Creators" },
    },
  },
  es: {
    nav: { creators: "Creadores", creatorsAria: "Explorar perfiles de creadores de YouTube" },
    footer: { creators: "Creadores" },
    popularCreators: {
      eyebrow: "Creadores",
      title: "Creadores populares",
      viewAll: "Ver todos los creadores",
    },
    creators: {
      eyebrow: "Directorio de creadores",
      title: "Creadores de YouTube",
      subtitle: "Explora y busca creadores de YouTube. Cada perfil incluye estimaciones de ingresos independientes, estadísticas del canal y enlaces a las calculadoras.",
      searchLabel: "Buscar creadores",
      searchPlaceholder: "Busca por nombre, handle, categoría o país",
      clearSearchAria: "Borrar búsqueda",
      filterAll: "Todos",
      filterCountry: "País",
      filterCategory: "Categoría",
      filterAlphabet: "Empieza con",
      clearFilters: "Borrar filtros",
      resultCount: "{count, plural, =0 {Ningún creador} one {# creador} other {# creadores}}",
      emptyResults: "Ningún creador coincide con tus filtros. Prueba a borrarlos o buscar otro nombre.",
      card: { cardAria: "Abrir perfil de {name}" },
      meta: {
        title: "Directorio de creadores de YouTube — Ingresos, ganancias y estadísticas",
        description: "Explora creadores de YouTube con estimaciones independientes de ingresos mensuales, valor de patrocinios, RPM, CPM y estadísticas del canal.",
        breadcrumb: "Creadores",
      },
    },
    creator: {
      breadcrumb: { aria: "Ruta de navegación", creators: "Creadores" },
    },
  },
  pt: {
    nav: { creators: "Criadores", creatorsAria: "Explorar perfis de criadores do YouTube" },
    footer: { creators: "Criadores" },
    popularCreators: {
      eyebrow: "Criadores",
      title: "Criadores populares",
      viewAll: "Ver todos os criadores",
    },
    creators: {
      eyebrow: "Diretório de criadores",
      title: "Criadores do YouTube",
      subtitle: "Explora e pesquisa criadores do YouTube. Cada perfil inclui estimativas de ganhos independentes, estatísticas do canal e ligações às calculadoras.",
      searchLabel: "Pesquisar criadores",
      searchPlaceholder: "Pesquisa por nome, handle, categoria ou país",
      clearSearchAria: "Limpar pesquisa",
      filterAll: "Todos",
      filterCountry: "País",
      filterCategory: "Categoria",
      filterAlphabet: "Começa por",
      clearFilters: "Limpar filtros",
      resultCount: "{count, plural, =0 {Nenhum criador} one {# criador} other {# criadores}}",
      emptyResults: "Nenhum criador corresponde aos teus filtros. Tenta limpá-los ou pesquisar por outro nome.",
      card: { cardAria: "Abrir perfil de {name}" },
      meta: {
        title: "Diretório de criadores do YouTube — Ganhos, receita e estatísticas",
        description: "Explora criadores do YouTube com estimativas independentes de ganhos mensais, valor de patrocínios, RPM, CPM e estatísticas do canal.",
        breadcrumb: "Criadores",
      },
    },
    creator: {
      breadcrumb: { aria: "Trilho de navegação", creators: "Criadores" },
    },
  },
  fr: {
    nav: { creators: "Créateurs", creatorsAria: "Parcourir les profils de créateurs YouTube" },
    footer: { creators: "Créateurs" },
    popularCreators: {
      eyebrow: "Créateurs",
      title: "Créateurs populaires",
      viewAll: "Voir tous les créateurs",
    },
    creators: {
      eyebrow: "Répertoire des créateurs",
      title: "Créateurs YouTube",
      subtitle: "Parcourez et cherchez des créateurs YouTube. Chaque profil inclut des estimations de revenus indépendantes, des statistiques de chaîne et des liens vers les calculateurs.",
      searchLabel: "Rechercher des créateurs",
      searchPlaceholder: "Recherchez par nom, handle, catégorie ou pays",
      clearSearchAria: "Effacer la recherche",
      filterAll: "Tous",
      filterCountry: "Pays",
      filterCategory: "Catégorie",
      filterAlphabet: "Commence par",
      clearFilters: "Réinitialiser les filtres",
      resultCount: "{count, plural, =0 {Aucun créateur} one {# créateur} other {# créateurs}}",
      emptyResults: "Aucun créateur ne correspond à vos filtres. Essayez de les réinitialiser ou de chercher un autre nom.",
      card: { cardAria: "Ouvrir le profil de {name}" },
      meta: {
        title: "Répertoire des créateurs YouTube — Revenus, gains et statistiques",
        description: "Parcourez des créateurs YouTube avec des estimations indépendantes de revenus mensuels, valeur des sponsors, RPM, CPM et statistiques de chaîne.",
        breadcrumb: "Créateurs",
      },
    },
    creator: {
      breadcrumb: { aria: "Fil d'Ariane", creators: "Créateurs" },
    },
  },
  de: {
    nav: { creators: "Creator", creatorsAria: "YouTube-Creator-Profile durchsuchen" },
    footer: { creators: "Creator" },
    popularCreators: {
      eyebrow: "Creator",
      title: "Beliebte Creator",
      viewAll: "Alle Creator ansehen",
    },
    creators: {
      eyebrow: "Creator-Verzeichnis",
      title: "YouTube-Creator",
      subtitle: "Durchsuche und finde YouTube-Creator. Jedes Profil enthält unabhängige Ertragsschätzungen, Kanalstatistiken und Links zu den Rechnern.",
      searchLabel: "Creator suchen",
      searchPlaceholder: "Suche nach Name, Handle, Kategorie oder Land",
      clearSearchAria: "Suche leeren",
      filterAll: "Alle",
      filterCountry: "Land",
      filterCategory: "Kategorie",
      filterAlphabet: "Beginnt mit",
      clearFilters: "Filter zurücksetzen",
      resultCount: "{count, plural, =0 {Keine Creator} one {# Creator} other {# Creator}}",
      emptyResults: "Kein Creator passt zu deinen Filtern. Setze sie zurück oder suche nach einem anderen Namen.",
      card: { cardAria: "{name}-Profil öffnen" },
      meta: {
        title: "YouTube-Creator-Verzeichnis — Einnahmen, Umsatz & Statistiken",
        description: "Durchsuche YouTube-Creator mit unabhängigen Schätzungen zu monatlichen Einnahmen, Sponsoring-Wert, RPM, CPM und Kanalstatistiken.",
        breadcrumb: "Creator",
      },
    },
    creator: {
      breadcrumb: { aria: "Breadcrumb", creators: "Creator" },
    },
  },
  hi: {
    nav: { creators: "क्रिएटर", creatorsAria: "YouTube क्रिएटर प्रोफ़ाइल ब्राउज़ करें" },
    footer: { creators: "क्रिएटर" },
    popularCreators: {
      eyebrow: "क्रिएटर",
      title: "लोकप्रिय क्रिएटर",
      viewAll: "सभी क्रिएटर देखें",
    },
    creators: {
      eyebrow: "क्रिएटर डायरेक्टरी",
      title: "YouTube क्रिएटर",
      subtitle: "YouTube क्रिएटरों को ब्राउज़ और खोजें। हर प्रोफ़ाइल में स्वतंत्र कमाई अनुमान, चैनल आँकड़े और कैलकुलेटर लिंक शामिल हैं।",
      searchLabel: "क्रिएटर खोजें",
      searchPlaceholder: "नाम, handle, श्रेणी या देश से खोजें",
      clearSearchAria: "खोज साफ़ करें",
      filterAll: "सभी",
      filterCountry: "देश",
      filterCategory: "श्रेणी",
      filterAlphabet: "इस अक्षर से शुरू",
      clearFilters: "फ़िल्टर साफ़ करें",
      resultCount: "{count, plural, =0 {कोई क्रिएटर नहीं} one {# क्रिएटर} other {# क्रिएटर}}",
      emptyResults: "आपके फ़िल्टर से मेल खाता कोई क्रिएटर नहीं। फ़िल्टर साफ़ करें या कोई और नाम खोजें।",
      card: { cardAria: "{name} की प्रोफ़ाइल खोलें" },
      meta: {
        title: "YouTube क्रिएटर डायरेक्टरी — कमाई, राजस्व और आँकड़े",
        description: "YouTube क्रिएटरों को स्वतंत्र मासिक कमाई अनुमान, स्पॉन्सरशिप वैल्यू, RPM, CPM और चैनल आँकड़ों के साथ ब्राउज़ करें।",
        breadcrumb: "क्रिएटर",
      },
    },
    creator: {
      breadcrumb: { aria: "ब्रेडक्रम्ब", creators: "क्रिएटर" },
    },
  },
  ja: {
    nav: { creators: "クリエイター", creatorsAria: "YouTube クリエイターのプロフィールを見る" },
    footer: { creators: "クリエイター" },
    popularCreators: {
      eyebrow: "クリエイター",
      title: "人気のクリエイター",
      viewAll: "すべてのクリエイターを見る",
    },
    creators: {
      eyebrow: "クリエイターディレクトリ",
      title: "YouTube クリエイター",
      subtitle: "YouTube のクリエイターを閲覧・検索できます。すべてのプロフィールに独立した収益見積もり、チャンネル統計、電卓へのリンクが含まれます。",
      searchLabel: "クリエイターを検索",
      searchPlaceholder: "名前、ハンドル、カテゴリ、国で検索",
      clearSearchAria: "検索をクリア",
      filterAll: "すべて",
      filterCountry: "国",
      filterCategory: "カテゴリ",
      filterAlphabet: "頭文字",
      clearFilters: "フィルタをクリア",
      resultCount: "{count, plural, =0 {クリエイターなし} other {# 件のクリエイター}}",
      emptyResults: "フィルタに一致するクリエイターが見つかりません。フィルタをクリアするか、別の名前で検索してください。",
      card: { cardAria: "{name} のプロフィールを開く" },
      meta: {
        title: "YouTube クリエイターディレクトリ — 収益・売上・統計",
        description: "月間収益、スポンサーシップ価値、RPM、CPM、チャンネル統計の独立した見積もりで YouTube クリエイターを閲覧。",
        breadcrumb: "クリエイター",
      },
    },
    creator: {
      breadcrumb: { aria: "パンくずリスト", creators: "クリエイター" },
    },
  },
};

async function main() {
  // Load the English source-of-truth blob for `creator.*` and
  // `creators.*` sub-trees so non-English locales inherit any nested
  // key (loading label, fallback reasons, disclaimer, FAQ title, etc.)
  // that we don't explicitly translate above. Non-English readers see
  // English fallback text for those deeper keys — which is the same
  // policy the app already uses for the blog article body.
  const enBlob = JSON.parse(
    await fs.readFile(path.join(messagesDir, "en.json"), "utf8"),
  );

  const enFallback = {
    creator: enBlob.creator ?? {},
    creators: enBlob.creators ?? {},
    popularCreators: enBlob.popularCreators ?? {},
  };

  for (const [locale, additions] of Object.entries(LOCALIZED)) {
    const filepath = path.join(messagesDir, `${locale}.json`);
    const raw = await fs.readFile(filepath, "utf8");
    const existing = JSON.parse(raw);
    // Layer order: existing → English fallback (fills every key) →
    // localized overrides (translates the chrome). This guarantees
    // that no key ever renders as raw "key.not.found".
    const merged = deepMerge(deepMerge(existing, enFallback), additions);
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
