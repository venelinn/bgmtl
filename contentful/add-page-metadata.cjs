/**
 * SEO metaData for the pages that had none (or borrowed another page's):
 * events, contacts, mission, news, bg-community. Without it they fell back to
 * the title "bgmtl.com" and a placeholder description.
 *
 * Id-targeted and idempotent: each entry gets a fixed id, is created or
 * overwritten, then linked from its page. Pages with unpublished draft changes
 * are skipped so nobody's pending edit goes live by accident.
 *
 *   node contentful/add-page-metadata.cjs            # dry run: print the plan
 *   node contentful/add-page-metadata.cjs --publish  # create, link, publish
 */
const cm = require("contentful-management");

const PUBLISH = process.argv.includes("--publish");
const linkRef = (id) => ({ sys: { type: "Link", linkType: "Entry", id } });

const PAGES = [
  {
    pageId: "2HFivm7FjuLApzXahlhqVB",
    slug: "events",
    title: "META: Events",
    pageTitle: {
      "bg-BG": "Събития на българската общност в Монреал",
      "en-CA": "Bulgarian Community Events in Montreal",
      "fr-CA": "Événements de la communauté bulgare à Montréal",
    },
    pageDescription: {
      "bg-BG":
        "Концерти, театър, празници и срещи на българската общност в Монреал и Квебек. Вижте предстоящите събития и си купете билети.",
      "en-CA":
        "Concerts, theatre, celebrations and meetups of the Bulgarian community in Montreal and Quebec. See upcoming events and get tickets.",
      "fr-CA":
        "Concerts, théâtre, fêtes et rencontres de la communauté bulgare de Montréal et du Québec. Découvrez les événements à venir et vos billets.",
    },
  },
  {
    pageId: "5YTG9NoZyZTGNOAiTbiUIO",
    slug: "contacts",
    title: "META: Contacts",
    pageTitle: {
      "bg-BG": "Контакти – Българска общност в Монреал",
      "en-CA": "Contact Us – Bulgarian Community in Montreal",
      "fr-CA": "Nous joindre – Communauté bulgare à Montréal",
    },
    pageDescription: {
      "bg-BG":
        "Свържете се с BGMTL: въпрос, ново събитие, профил в указателя или партньорство. Пишете ни и ще отговорим възможно най-скоро.",
      "en-CA":
        "Get in touch with BGMTL: a question, a new event, a directory listing or a partnership. Send us a message and we'll reply as soon as we can.",
      "fr-CA":
        "Écrivez à BGMTL : une question, un nouvel événement, une fiche au répertoire ou un partenariat. Nous vous répondrons dès que possible.",
    },
  },
  {
    pageId: "1HFJGVkUku8BsBpLf8Pxah",
    slug: "mission",
    title: "META: Mission",
    pageTitle: {
      "bg-BG": "Нашата мисия – BGMTL",
      "en-CA": "Our Mission – BGMTL",
      "fr-CA": "Notre mission – BGMTL",
    },
    pageDescription: {
      "bg-BG":
        "BGMTL е информационният и социален център за българите в Монреал: събития, новини, контакти и съхраняване на българските традиции.",
      "en-CA":
        "BGMTL is the information and social hub for Bulgarians in Montreal: events, news, contacts and keeping Bulgarian traditions alive.",
      "fr-CA":
        "BGMTL est le carrefour d’information et de rencontre des Bulgares de Montréal : événements, actualités, contacts et traditions bulgares.",
    },
  },
  {
    pageId: "3w0fAHJyxDpzy3QoW8q6XD",
    slug: "news",
    title: "META: News",
    pageTitle: {
      "bg-BG": "Новини за българите в Монреал и Канада",
      "en-CA": "News for Bulgarians in Montreal and Canada",
      "fr-CA": "Actualités des Bulgares de Montréal et du Canada",
    },
    pageDescription: {
      "bg-BG":
        "Последни новини и съобщения за българската общност в Монреал и Канада: избори, документи, инициативи и полезна информация.",
      "en-CA":
        "Latest news and announcements for the Bulgarian community in Montreal and Canada: elections, documents, initiatives and useful information.",
      "fr-CA":
        "Nouvelles et annonces pour la communauté bulgare de Montréal et du Canada : élections, démarches, initiatives et informations utiles.",
    },
  },
  {
    // Was linked to the home page's entry, so it shared the home title.
    pageId: "GVkPQxt7ajrarKRPvgXUo",
    slug: "bg-community",
    title: "META: Bulgarians in Canada",
    pageTitle: {
      "bg-BG": "Българите в Канада – сдружения, медии и църкви",
      "en-CA": "Bulgarians in Canada – Associations, Media, Churches",
      "fr-CA": "Les Bulgares au Canada – associations, médias, églises",
    },
    pageDescription: {
      "bg-BG":
        "Български сдружения, медии, фолклорни състави, църкви и училища в Торонто, Ванкувър и Калгари – с адреси и контакти.",
      "en-CA":
        "Bulgarian associations, media, folk ensembles, churches and schools in Toronto, Vancouver and Calgary, with addresses and contacts.",
      "fr-CA":
        "Associations, médias, ensembles folkloriques, églises et écoles bulgares à Toronto, Vancouver et Calgary, avec adresses et coordonnées.",
    },
  },
];

const metaId = (slug) => `metadata-page-${slug}`;

async function main() {
  // Lengths the search results show without cutting (titles ~60, descriptions ~160).
  for (const p of PAGES) {
    for (const [loc, t] of Object.entries(p.pageTitle)) {
      const d = p.pageDescription[loc];
      const warn = t.length > 60 || d.length > 160 ? "  ⚠ long" : "";
      console.log(`${p.slug} ${loc}  [${t.length}/${d.length}]${warn}\n  ${t}\n  ${d}`);
    }
  }
  if (!PUBLISH) {
    console.log("\nDry run. Re-run with --publish to create, link and publish.");
    return;
  }

  const client = cm.createClient(
    { accessToken: process.env.CONTENTFUL_MANAGEMENT_TOKEN },
    {
      type: "plain",
      defaults: {
        spaceId: process.env.CONTENTFUL_SPACE_ID,
        environmentId: process.env.CONTENTFUL_ENVIRONMENT || "master",
      },
    },
  );

  for (const p of PAGES) {
    const entryId = metaId(p.slug);
    try {
      // Check the page first: never publish someone's pending draft.
      let page = await client.entry.get({ entryId: p.pageId });
      const pendingDraft =
        page.sys.publishedVersion && page.sys.version !== page.sys.publishedVersion + 1;
      if (pendingDraft) {
        console.log(`! ${p.slug}: page has unpublished changes — skipped`);
        continue;
      }

      const fields = {
        title: { "bg-BG": p.title },
        pageTitle: p.pageTitle,
        pageDescription: p.pageDescription,
      };
      let meta;
      try {
        meta = await client.entry.get({ entryId });
        meta.fields = { ...meta.fields, ...fields };
        meta = await client.entry.update({ entryId }, meta);
      } catch {
        meta = await client.entry.createWithId(
          { entryId, contentTypeId: "metaData" },
          { fields },
        );
      }
      await client.entry.publish({ entryId }, meta);

      page.fields.metaData = { "bg-BG": linkRef(entryId) };
      page = await client.entry.update({ entryId: p.pageId }, page);
      await client.entry.publish({ entryId: p.pageId }, page);
      console.log(`✓ ${p.slug} → ${entryId}`);
    } catch (e) {
      console.log(`! ${p.slug}:`, e.message);
    }
  }
}

main();
