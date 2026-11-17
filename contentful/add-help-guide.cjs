/**
 * Help page (/help, "Помощ и полезна информация"): one section with a "guide"
 * collection of cards, each summarizing one subject and linking to the official
 * source. `card.role` holds the card's category; the page filters on it.
 *
 * Needs migration 2026-11-17-collection-guide-variant.js first.
 *
 * Id-targeted and idempotent: every entry has a fixed id and is created or
 * overwritten, then published (leaves first, page last).
 *
 *   node contentful/add-help-guide.cjs            # dry run: print the texts
 *   node contentful/add-help-guide.cjs --publish  # create/update and publish
 */
require("dotenv").config();
const cm = require("contentful-management");

const PUBLISH = process.argv.includes("--publish");
const LOCALES = ["bg-BG", "en-CA", "fr-CA"];
const link = (id) => ({ sys: { type: "Link", linkType: "Entry", id } });
const bg = (value) => ({ "bg-BG": value });

// Rich text with one paragraph per string.
const doc = (...paragraphs) => ({
  nodeType: "document",
  data: {},
  content: paragraphs.map((value) => ({
    nodeType: "paragraph",
    data: {},
    content: [{ nodeType: "text", value, marks: [], data: {} }],
  })),
});
const localizedDoc = (texts) =>
  Object.fromEntries(LOCALES.map((loc) => [loc, doc(...[].concat(texts[loc]))]));

const tri = (bgText, en, fr) => ({ "bg-BG": bgText, "en-CA": en, "fr-CA": fr });

// Broad categories (card.role): the /help filter chips. New cards should reuse one.
const CAT = {
  documents: tri("Документи", "Documents", "Documents"),
  health: tri("Здраве", "Health", "Santé"),
  family: tri("Семейство и образование", "Family & education", "Famille et éducation"),
  work: tri("Език и работа", "Language & work", "Langue et emploi"),
  home: tri("Жилище и транспорт", "Housing & transport", "Logement et transport"),
  bulgarians: tri("За българите", "For Bulgarians", "Pour les Bulgares"),
};

const CARDS = [
  {
    key: "first-steps",
    icon: "ClipboardCheck",
    topic: CAT.documents,
    title: tri("Първите дни в Квебек", "Your first days in Québec", "Vos premiers jours au Québec"),
    text: tri(
      "Номер за социално осигуряване (SIN), здравна карта, банкова сметка, телефон и жилище: правителството на Квебек е събрало основните стъпки на едно място и предлага безплатна информационна сесия за новопристигнали.",
      "Social insurance number (SIN), health card, bank account, phone and housing: the Québec government lists the key steps in one place and offers a free information session for newcomers.",
      "Numéro d’assurance sociale (NAS), carte d’assurance maladie, compte bancaire, téléphone et logement : le gouvernement du Québec réunit les démarches essentielles et offre une séance d’information gratuite aux nouveaux arrivants.",
    ),
    linkName: tri("Първи стъпки на Québec.ca", "First steps on Québec.ca", "Premiers pas sur Québec.ca"),
    url: "https://www.quebec.ca/en/immigration/settle-and-integrate-in-quebec/first-steps-settling-in",
  },
  {
    key: "ramq",
    icon: "HeartPulse",
    topic: CAT.health,
    title: tri("Здравна карта RAMQ", "RAMQ health insurance", "Assurance maladie (RAMQ)"),
    text: tri(
      "Регистрирайте се в RAMQ веднага след пристигането си. По правило има период на изчакване до 3 месеца, затова дотогава е добре да имате частна здравна застраховка.",
      "Register with the RAMQ as soon as you arrive. As a rule there is a waiting period of up to 3 months, so private health insurance is a good idea until then.",
      "Inscrivez-vous à la RAMQ dès votre arrivée. En règle générale, un délai de carence allant jusqu’à 3 mois s’applique : une assurance privée est recommandée d’ici là.",
    ),
    linkName: tri("Регистрация в RAMQ", "Register with the RAMQ", "S’inscrire à la RAMQ"),
    url: "https://www.ramq.gouv.qc.ca/en/citizens/health-insurance/register/newcomer-adult",
  },
  {
    key: "french",
    icon: "Languages",
    topic: CAT.work,
    title: tri("Безплатни курсове по френски", "Free French courses", "Cours de français gratuits"),
    text: tri(
      "Francisation Québec предлага безплатни курсове по френски: присъствени и онлайн, на пълно или непълно време. При обучение на пълно време може да получите и финансова помощ.",
      "Francisation Québec offers free French courses, in class or online, full- or part-time. Full-time students may also qualify for financial assistance.",
      "Francisation Québec offre des cours de français gratuits, en classe ou en ligne, à temps plein ou à temps partiel. À temps plein, une aide financière peut s’ajouter.",
    ),
    linkName: tri("Как да се запишете", "How to register", "Comment s’inscrire"),
    url: "https://www.quebec.ca/en/education/learn-french/full-time-courses/immigrants",
  },
  {
    key: "daycare",
    icon: "Baby",
    topic: CAT.family,
    title: tri("Детски градини", "Daycare", "Services de garde"),
    text: tri(
      "От ноември 2025 г. записването в детски градини (CPE и други) става през новия Портал за записване, който замени La Place 0-5. Запишете детето възможно най-рано.",
      "Since November 2025, daycare registration (CPE and others) goes through the new registration portal, which replaced La Place 0-5. Register your child as early as possible.",
      "Depuis novembre 2025, l’inscription en service de garde (CPE et autres) se fait sur le nouveau Portail d’inscription, qui remplace La Place 0-5. Inscrivez votre enfant le plus tôt possible.",
    ),
    linkName: tri("Портал за записване", "Registration portal", "Portail d’inscription"),
    url: "https://www.quebec.ca/famille-et-soutien-aux-personnes/enfance/garderies-et-services-de-garde/portail-inscription",
  },
  {
    key: "driving",
    icon: "Car",
    topic: CAT.documents,
    title: tri("Шофьорска книжка", "Driver’s licence", "Permis de conduire"),
    text: tri(
      "Като нов жител можете да шофирате лек автомобил с валидна чужда книжка до 6 последователни месеца. След това ви трябва книжка от Квебек, издадена от SAAQ.",
      "As a new resident you can drive a passenger vehicle on a valid foreign licence for up to 6 consecutive months. After that you need a Québec licence from the SAAQ.",
      "Comme nouveau résident, vous pouvez conduire un véhicule de promenade avec un permis étranger valide pendant 6 mois consécutifs au plus. Ensuite, il vous faut un permis du Québec délivré par la SAAQ.",
    ),
    linkName: tri("Книжка от SAAQ", "Licence from the SAAQ", "Permis de la SAAQ"),
    url: "https://saaq.gouv.qc.ca/en/tourists-newcomers/obtaining-drivers-licence",
  },
  {
    key: "housing",
    icon: "House",
    topic: CAT.home,
    title: tri("Наем на жилище", "Renting a home", "Louer un logement"),
    text: tri(
      "Наемодателят не може да иска депозит, само първия месечен наем при подписване. Спорове за наем, ремонти и увеличения се решават от Tribunal administratif du logement (TAL).",
      "A landlord cannot ask for a security deposit, only the first month’s rent at signing. Disputes over rent, repairs and increases go to the Tribunal administratif du logement (TAL).",
      "Le locateur ne peut pas exiger de dépôt de garantie, seulement le premier mois de loyer à la signature. Les litiges (loyer, réparations, hausses) relèvent du Tribunal administratif du logement (TAL).",
    ),
    linkName: tri("Сайт на TAL", "TAL website", "Site du TAL"),
    url: "https://www.tal.gouv.qc.ca/en/",
  },
  {
    key: "support",
    icon: "HandHeart",
    topic: CAT.work,
    title: tri("Безплатна помощ при интеграция", "Free settlement support", "Accompagnement gratuit"),
    text: tri(
      "Accompagnement Québec ви свързва с агент по интеграция, който оценява нуждите ви и ви насочва към подходящите услуги. Безплатно е, а регистрацията е през платформата Arrima.",
      "Accompagnement Québec pairs you with an integration agent who assesses your needs and points you to the right services. It’s free, and you register through the Arrima platform.",
      "Accompagnement Québec vous jumelle à un agent d’aide à l’intégration qui évalue vos besoins et vous oriente vers les bons services. C’est gratuit, et l’inscription se fait sur Arrima.",
    ),
    linkName: tri("Accompagnement Québec", "Accompagnement Québec", "Accompagnement Québec"),
    url: "https://www.quebec.ca/en/immigration/integration-service-for-immigrants",
  },
  {
    key: "diplomas",
    icon: "GraduationCap",
    topic: CAT.work,
    title: tri("Признаване на дипломи", "Recognition of diplomas", "Reconnaissance des diplômes"),
    text: tri(
      "За регулирана професия (лекар, инженер, медицинска сестра…) се обърнете към съответния професионален орден. За останалите работодателите често искат Сравнителна оценка на образованието, получено извън Квебек.",
      "For a regulated profession (doctor, engineer, nurse…) contact the relevant professional order. For other jobs, employers often ask for a Comparative Evaluation for Studies Done Outside Québec.",
      "Pour une profession réglementée (médecin, ingénieur, infirmière…), adressez-vous à l’ordre professionnel concerné. Pour les autres emplois, l’employeur peut demander une Évaluation comparative des études effectuées hors du Québec.",
    ),
    linkName: tri("Как се признава образование", "How recognition works", "Faire reconnaître ses compétences"),
    url: "https://www.quebec.ca/en/immigration/reconnaissance-etudes-experience/faire-reconnaitre-competences-acquises-etranger/by-regulatory-body",
  },
  {
    key: "taxes",
    icon: "Receipt",
    topic: CAT.documents,
    title: tri("Първата данъчна декларация", "Your first tax return", "Votre première déclaration de revenus"),
    text: tri(
      "В Квебек се подават две декларации: федерална (CRA) и провинциална (Revenu Québec). От тях зависят обезщетения като кредита за GST/HST и детските помощи.",
      "In Québec you file two returns: federal (CRA) and provincial (Revenu Québec). They determine benefits such as the GST/HST credit and child benefits.",
      "Au Québec, on produit deux déclarations : fédérale (ARC) et provinciale (Revenu Québec). Elles déterminent des prestations comme le crédit pour la TPS/TVH et les allocations pour enfants.",
    ),
    linkName: tri("CRA за новодошли", "CRA for newcomers", "L’ARC pour les nouveaux arrivants"),
    url: "https://www.canada.ca/en/revenue-agency/services/tax/international-non-residents/individuals-leaving-entering-canada-non-residents/newcomers-canada-immigrants.html",
  },
  {
    key: "consulate",
    icon: "Landmark",
    topic: CAT.bulgarians,
    title: tri("Консулски услуги", "Consular services", "Services consulaires"),
    text: tri(
      "Генералното консулство в Торонто издава паспорти, удостоверения и прави заверки за българите в Канада. Консулството периодично провежда изнесени консулски дни в други градове.",
      "The Consulate General in Toronto issues passports and certificates and certifies documents for Bulgarians in Canada. The consulate regularly holds consular days in other cities.",
      "Le Consulat général à Toronto délivre passeports et certificats et légalise les documents des Bulgares au Canada. Il tient régulièrement des journées consulaires dans d’autres villes.",
    ),
    linkName: tri("Консулство в Торонто", "Consulate in Toronto", "Consulat à Toronto"),
    url: "https://www.bgconsultoronto.info/en/contact",
  },
  {
    key: "embassy-ottawa",
    icon: "Flag",
    topic: CAT.bulgarians,
    title: tri("Посолство в Отава", "Embassy in Ottawa", "Ambassade à Ottawa"),
    text: tri(
      "Посолството на България в Отава също предоставя консулски услуги — например заверки на пълномощни и документи — само с предварително записан час. На сайта му са актуалните съобщения, неработните дни и контактите.",
      "The Bulgarian Embassy in Ottawa also provides consular services — such as certifying powers of attorney and documents — by appointment only. Its site has current notices, closure days and contacts.",
      "L’ambassade de Bulgarie à Ottawa offre aussi des services consulaires — par exemple la légalisation de procurations et de documents — uniquement sur rendez-vous. Son site affiche les avis, les jours de fermeture et les coordonnées.",
    ),
    linkName: tri("Посолство в Отава", "Embassy in Ottawa", "Ambassade à Ottawa"),
    url: "https://www.mfa.bg/embassies/canada",
  },
  {
    key: "transit",
    icon: "TramFront",
    topic: CAT.home,
    title: tri("Градски транспорт", "Public transit", "Transport en commun"),
    text: tri(
      "Метрото и автобусите в Монреал се ползват с карта OPUS на STM. Учащите имат намаление, а жителите на Монреал над 65 г. пътуват безплатно.",
      "Montréal’s metro and buses run on the STM’s OPUS card. Students get reduced fares, and Montréal residents 65 and over ride free.",
      "Le métro et les autobus de Montréal fonctionnent avec la carte OPUS de la STM. Les étudiants paient moins cher et les résidents de Montréal de 65 ans et plus voyagent gratuitement.",
    ),
    linkName: tri("Цени на STM", "STM fares", "Tarifs de la STM"),
    url: "https://www.stm.info/en/fares-pricing",
  },
  // ── Added 2026-11-17: wider help topics ──
  {
    key: "sin",
    icon: "IdCard",
    topic: CAT.documents,
    title: tri("Номер за социално осигуряване (SIN)", "Social Insurance Number (SIN)", "Numéro d’assurance sociale (NAS)"),
    text: tri(
      "SIN ви трябва, за да работите и да получавате обезщетения. Кандидатствайте онлайн при Service Canada — така е най-бързо: номерът излиза в онлайн профила ви за около 5 работни дни.",
      "You need a SIN to work and to receive benefits. Applying online with Service Canada is fastest: the number shows up in your online account in about 5 business days.",
      "Le NAS est nécessaire pour travailler et recevoir des prestations. La demande en ligne auprès de Service Canada est la plus rapide : le numéro apparaît dans votre compte en ligne en environ 5 jours ouvrables.",
    ),
    linkName: tri("SIN от Service Canada", "SIN from Service Canada", "NAS auprès de Service Canada"),
    url: "https://www.canada.ca/en/employment-social-development/services/sin.html",
  },
  {
    key: "address",
    icon: "MapPin",
    topic: CAT.documents,
    title: tri("Смяна на адрес", "Change of address", "Changement d’adresse"),
    text: tri(
      "При преместване съобщете новия си адрес наведнъж на основните институции в Квебек чрез безплатната онлайн услуга. За шофьорската книжка SAAQ трябва да знае до 30 дни.",
      "When you move, notify the main Québec government bodies at once through the free online service. The SAAQ must have your new address within 30 days for your driver’s licence.",
      "Quand vous déménagez, avisez d’un coup les principaux ministères et organismes du Québec grâce au service en ligne gratuit. La SAAQ doit connaître votre nouvelle adresse dans les 30 jours pour votre permis.",
    ),
    linkName: tri("Смяна на адрес на Québec.ca", "Change your address on Québec.ca", "Changer d’adresse sur Québec.ca"),
    url: "https://www.quebec.ca/en/housing-territory/moving-new-address/how-to-send-your-new-address-to-the-government-when-you-move",
  },
  {
    key: "citizenship",
    icon: "BadgeCheck",
    topic: CAT.documents,
    title: tri("Канадско гражданство", "Canadian citizenship", "Citoyenneté canadienne"),
    text: tri(
      "Като постоянен жител можете да кандидатствате, след като сте били физически в Канада поне 1095 дни през последните 5 години. Дните като временен жител се броят наполовина, до 365 дни.",
      "As a permanent resident you can apply once you have been physically present in Canada for at least 1,095 days in the last 5 years. Days as a temporary resident count as half days, up to 365.",
      "En tant que résident permanent, vous pouvez présenter une demande après au moins 1 095 jours de présence effective au Canada au cours des 5 dernières années. Les jours comme résident temporaire comptent pour moitié, jusqu’à 365.",
    ),
    linkName: tri("Кой може да кандидатства", "Who can apply", "Qui peut présenter une demande"),
    url: "https://www.canada.ca/en/immigration-refugees-citizenship/services/canadian-citizenship/adult-minor/who.html",
  },
  {
    key: "info-sante",
    icon: "PhoneCall",
    topic: CAT.health,
    title: tri("Info-Santé 811", "Info-Santé 811", "Info-Santé 811"),
    text: tri(
      "Медицинска сестра отговаря денонощно на 811 (опция 1) при здравословен проблем, който не е спешен. Ако не сте сигурни дали да отидете в спешното, обадете се първо там. Опция 2 е Info-Social — психологическа подкрепа.",
      "A nurse answers 811 (option 1) around the clock for non-urgent health problems. If you are unsure whether to go to the emergency room, call first. Option 2 is Info-Social for psychosocial support.",
      "Une infirmière répond au 811 (option 1) jour et nuit pour un problème de santé non urgent. En cas de doute avant d’aller à l’urgence, appelez d’abord. L’option 2 mène à Info-Social, pour un soutien psychosocial.",
    ),
    linkName: tri("Кога да се обадите на 811", "When to call 811", "Quand appeler le 811"),
    url: "https://www.quebec.ca/en/health/health-system-and-services/service-organization/primary-care-health-and-social-services/how-get-advice-about-non-urgent-health-problem-1",
  },
  // Family doctors are scarce in Québec: one card per route to care.
  {
    key: "family-doctor",
    icon: "Stethoscope",
    topic: CAT.health,
    title: tri("Запишете се за семеен лекар", "Get on the family doctor list", "S’inscrire pour un médecin de famille"),
    text: tri(
      "Семейните лекари в Квебек не достигат, затова се запишете веднага след като получите здравна карта — в списъка GAMF онлайн или по телефона. Чакането може да е дълго и зависи от здравословното състояние; поддържайте данните си актуални, за да не загубите мястото си.",
      "Family doctors are scarce in Québec, so sign up as soon as you have your health card — on the GAMF list online or by phone. The wait can be long and depends on your health; keep your details up to date so you don’t lose your place.",
      "Les médecins de famille manquent au Québec : inscrivez-vous dès que vous avez votre carte d’assurance maladie — au GAMF, en ligne ou par téléphone. L’attente peut être longue et dépend de votre état de santé; tenez vos coordonnées à jour pour garder votre place.",
    ),
    linkName: tri("Списъкът GAMF", "The GAMF list", "Le GAMF"),
    url: "https://www.quebec.ca/en/health/finding-a-resource/quebec-family-doctor-finder",
  },
  {
    key: "gap",
    icon: "Hourglass",
    topic: CAT.health,
    title: tri("Докато чакате: услугата GAP", "While you wait: the GAP", "En attendant : le GAP"),
    text: tri(
      "Записаните в GAMF може да ползват GAP — онлайн денонощно или на 811, опция 3. Там оценяват нуждата ви и ви насочват към лекар, медицинска сестра или друг специалист в района.",
      "Once you are on the GAMF list you can use the GAP — online around the clock or at 811, option 3. It assesses your need and refers you to a doctor, nurse or other professional nearby.",
      "Une fois inscrit au GAMF, vous pouvez utiliser le GAP — en ligne jour et nuit ou au 811, option 3. On évalue votre besoin et on vous oriente vers un médecin, une infirmière ou un autre professionnel près de chez vous.",
    ),
    linkName: tri("Без семеен лекар", "No family doctor yet", "Sans médecin de famille"),
    url: "https://www.quebec.ca/en/health/health-system-and-services/service-organization/primary-care-health-and-social-services/how-get-medical-consultation-with-health-professional/you-don-t-have-family-doctor",
  },
  {
    key: "rvsq",
    icon: "CalendarCheck",
    topic: CAT.health,
    title: tri("Час при лекар онлайн (RVSQ)", "Book a doctor online (RVSQ)", "Prendre rendez-vous en ligne (RVSQ)"),
    text: tri(
      "С карта RAMQ може да си запишете час при семеен лекар или медицинска сестра в клиника близо до вас — и без собствен лекар. По телефона: 1 877 644-4545.",
      "With a RAMQ card you can book a family medicine appointment at a clinic near you — even without your own doctor. By phone: 1 877 644-4545.",
      "Avec votre carte RAMQ, vous pouvez réserver une consultation en médecine familiale dans une clinique près de chez vous — même sans médecin attitré. Par téléphone : 1 877 644-4545.",
    ),
    linkName: tri("Rendez-vous santé Québec", "Rendez-vous santé Québec", "Rendez-vous santé Québec"),
    url: "https://www.rvsq.gouv.qc.ca/en/home",
  },
  {
    key: "super-clinics",
    icon: "Hospital",
    topic: CAT.health,
    title: tri("Супер-клиники (GMF-R)", "Super-clinics (Access-Network FMGs)", "Super-cliniques (GMF-R)"),
    text: tri(
      "Супер-клиниките приемат и хора без семеен лекар — за преглед същия или следващия ден, с или без записан час. Добър избор за проблеми, които не са за спешното.",
      "Super-clinics also see people without a family doctor — for a same-day or next-day visit, with or without an appointment. A good option for problems that don’t need the emergency room.",
      "Les super-cliniques reçoivent aussi les personnes sans médecin de famille — pour une consultation le jour même ou le lendemain, avec ou sans rendez-vous. Une bonne option quand l’urgence n’est pas nécessaire.",
    ),
    linkName: tri("Клиники GMF и GMF-R", "FMG and super-clinic list", "Liste des GMF et GMF-R"),
    url: "https://www.quebec.ca/en/health/health-system-and-services/service-organization/family-medicine-group-fmg-u-fmg-and-super-clinic",
  },
  {
    key: "pharmacist",
    icon: "Pill",
    topic: CAT.health,
    title: tri("Аптекарят също помага", "Your pharmacist can help", "Votre pharmacien peut aider"),
    text: tri(
      "В Квебек аптекарят може да поднови рецепта и да предпише лекарство за някои леки състояния, без да ходите на лекар. От декември 2026 г. правомощията му се разширяват. Попитайте в аптеката, преди да чакате за преглед.",
      "In Québec a pharmacist can renew a prescription and prescribe for some minor conditions, so you don’t need a doctor’s visit. Their powers expand from December 2026. Ask at the pharmacy before waiting for an appointment.",
      "Au Québec, le pharmacien peut prolonger une ordonnance et prescrire pour certaines conditions mineures, sans visite chez le médecin. Ses pouvoirs s’élargissent à partir de décembre 2026. Demandez à la pharmacie avant d’attendre un rendez-vous.",
    ),
    linkName: tri("Какво може аптекарят", "What pharmacists can do", "Ce que le pharmacien peut faire"),
    url: "https://www.opq.org/nouvelles-activites/grand-public/",
  },
  {
    key: "school",
    icon: "School",
    topic: CAT.family,
    title: tri("Записване в училище", "Enrolling in school", "Inscription à l’école"),
    text: tri(
      "Децата се записват в училищния център по местоживеене — в Монреал най-често CSSDM, с предварително запазен час. Френският им се оценява при пристигане и при нужда получават допълнителна подкрепа.",
      "Children enrol through the school service centre for your address — in Montréal usually the CSSDM, by appointment. Their French is assessed on arrival and they get extra support if needed.",
      "Les enfants s’inscrivent au centre de services scolaire de votre secteur — à Montréal, généralement le CSSDM, sur rendez-vous. Leur français est évalué à l’arrivée et ils reçoivent du soutien au besoin.",
    ),
    linkName: tri("Записване в CSSDM", "CSSDM enrolment", "Inscription au CSSDM"),
    url: "https://www.cssdm.gouv.qc.ca/admission-inscription/",
  },
  {
    key: "family-allowance",
    icon: "PiggyBank",
    topic: CAT.family,
    title: tri("Детски надбавки", "Child benefits", "Allocations pour enfants"),
    text: tri(
      "Новите жители на Квебек кандидатстват сами за Allocation famille при Retraite Québec — отделно от федералната Canada Child Benefit. Плащанията може да са с обратна дата до 11 месеца.",
      "New Québec residents must apply for the Family Allowance with Retraite Québec themselves — separately from the federal Canada Child Benefit. Payments can be retroactive for up to 11 months.",
      "Les nouveaux résidents doivent demander eux-mêmes l’Allocation famille à Retraite Québec — en plus de l’Allocation canadienne pour enfants. Les versements peuvent être rétroactifs jusqu’à 11 mois.",
    ),
    linkName: tri("Заявление в Retraite Québec", "Apply with Retraite Québec", "Demande à Retraite Québec"),
    url: "https://www.retraitequebec.gouv.qc.ca/en/online-services-tools/application-family-allowance",
  },
  {
    key: "parental-leave",
    icon: "Users",
    topic: CAT.family,
    title: tri("Майчинство и родителски отпуск", "Parental leave benefits", "Prestations parentales"),
    text: tri(
      "Квебек има собствен план за родителско осигуряване (RQAP). Обикновено трябва да имате поне 2000 $ осигурителен доход и да живеете в Квебек, когато започва отпускът.",
      "Québec runs its own parental insurance plan (QPIP). You generally need at least $2,000 in insurable earnings and must live in Québec when your leave begins.",
      "Le Québec a son propre Régime québécois d’assurance parentale (RQAP). Il faut généralement au moins 2 000 $ de revenus assurables et résider au Québec au début du congé.",
    ),
    linkName: tri("Плана RQAP", "About the QPIP", "Le RQAP"),
    url: "https://www.rqap.gouv.qc.ca/en",
  },
  {
    key: "job-search",
    icon: "Briefcase",
    topic: CAT.work,
    title: tri("Помощ при търсене на работа", "Help finding a job", "Aide à la recherche d’emploi"),
    text: tri(
      "Services Québec помага безплатно при търсене на работа. Програмата PRIIME подпомага работодатели, които наемат имигранти без опит в своята област в Северна Америка.",
      "Services Québec offers free job search help. The PRIIME program supports employers who hire immigrants without North American experience in their field.",
      "Services Québec aide gratuitement à chercher un emploi. Le programme PRIIME soutient les employeurs qui embauchent des personnes immigrantes sans expérience nord-américaine dans leur domaine.",
    ),
    linkName: tri("Програмата PRIIME", "The PRIIME program", "Le programme PRIIME"),
    url: "https://www.quebec.ca/en/employment/find-job-internship/employment-assistance-programs/immigrants-visible-minorities/employment-integration",
  },
  {
    key: "labour-rights",
    icon: "Scale",
    topic: CAT.work,
    title: tri("Минимална заплата и трудови права", "Minimum wage and your rights", "Salaire minimum et vos droits"),
    text: tri(
      "Минималната заплата в Квебек е 16,60 $ на час (от 1 май 2026 г.). CNESST следи за трудовите стандарти — заплати, отпуски, извънреден труд — и приема оплаквания от работници.",
      "Québec’s minimum wage is $16.60 an hour (since May 1, 2026). The CNESST enforces labour standards — pay, holidays, overtime — and takes complaints from workers.",
      "Le salaire minimum au Québec est de 16,60 $ l’heure (depuis le 1er mai 2026). La CNESST veille aux normes du travail — salaire, congés, heures supplémentaires — et reçoit les plaintes.",
    ),
    linkName: tri("CNESST: минимална заплата", "CNESST: minimum wage", "CNESST : salaire minimum"),
    url: "https://www.cnesst.gouv.qc.ca/en/working-conditions/wage-and-pay/wages/minimum-wage",
  },
  {
    key: "hydro",
    icon: "Zap",
    topic: CAT.home,
    title: tri("Ток: Hydro-Québec", "Electricity: Hydro-Québec", "Électricité : Hydro-Québec"),
    text: tri(
      "При нанасяне в ново жилище откривате сметка за ток в Hydro-Québec. Онлайн, през Customer Space, е безплатно; по телефона се начислява такса 25 $.",
      "When you move in, open an electricity account with Hydro-Québec. It’s free online through your Customer Space; by phone there’s a $25 fee.",
      "En emménageant, ouvrez un abonnement d’électricité chez Hydro-Québec. C’est gratuit en ligne dans l’Espace client; par téléphone, des frais de 25 $ s’appliquent.",
    ),
    linkName: tri("Нов клиент в Hydro-Québec", "Become a customer", "Devenir client"),
    url: "https://www.hydroquebec.com/residential/customer-space/moving/become-a-customer.html",
  },
  {
    key: "bixi",
    icon: "Bike",
    topic: CAT.home,
    title: tri("Велосипеди BIXI", "BIXI bikes", "Vélos BIXI"),
    text: tri(
      "Градските велосипеди BIXI работят целогодишно в Монреал. С месечен абонамент всяко пътуване с обикновен велосипед до 45 минути е включено.",
      "BIXI city bikes run year-round in Montréal. With a monthly membership, every regular-bike ride up to 45 minutes is included.",
      "Les vélos BIXI roulent toute l’année à Montréal. Avec l’abonnement mensuel, chaque trajet de 45 minutes ou moins en vélo régulier est inclus.",
    ),
    linkName: tri("Цени на BIXI", "BIXI pricing", "Tarifs BIXI"),
    url: "https://bixi.com/en/pricing/",
  },
  {
    key: "city-311",
    icon: "Building2",
    topic: CAT.home,
    title: tri("Градски услуги: 311", "City services: 311", "Services municipaux : 311"),
    text: tri(
      "311 е линията на град Монреал за въпроси и сигнали — сметоизвозване, сняг, проблеми с жилището. Има и приложение 311 Montréal с известия, например за почистване на снега.",
      "311 is the City of Montréal’s line for questions and reports — garbage collection, snow, housing problems. The 311 Montréal app also sends alerts, for example about snow removal.",
      "Le 311 est la ligne de la Ville de Montréal pour les questions et les signalements — collectes, neige, problèmes de logement. L’application 311 Montréal envoie aussi des alertes, par exemple pour le déneigement.",
    ),
    linkName: tri("Контакт с града", "Contact the city", "Joindre la Ville"),
    url: "https://montreal.ca/en/contact-us",
  },
  {
    key: "voting",
    icon: "Vote",
    topic: CAT.bulgarians,
    title: tri("Гласуване в чужбина", "Voting in Bulgarian elections", "Voter aux élections bulgares"),
    text: tri(
      "На избори в България може да гласувате и от Канада, но само в секции в посолството и консулствата. Преди всеки избор подайте заявление за гласуване онлайн на сайта на ЦИК.",
      "You can vote in Bulgarian elections from Canada, but only at polling stations in the embassy and consulates. Before each election, file an application to vote online on the Central Election Commission (CIK) site.",
      "Vous pouvez voter aux élections bulgares depuis le Canada, mais seulement dans les bureaux de l’ambassade et des consulats. Avant chaque élection, faites une demande en ligne sur le site de la Commission électorale centrale (CIK).",
    ),
    linkName: tri("Сайтът на ЦИК", "CIK website", "Site de la CIK"),
    url: "https://www.cik.bg/bg",
  },
];

const PAGE = {
  name: tri("Помощ", "Help", "Aide"),
  heading: tri("Помощ и", "Help &", "Aide et"),
  // Red italic tail in the page header (heading.accent, migration 2026-11-17-heading-accent.js).
  accent: tri("полезна информация", "resources", "ressources"),
  // The "check the official sites" notice is an Alert in the page code (messages Guide.notice).
  intro: tri(
    "Практическа информация за живота в Монреал и Квебек — документи, здраве, семейство, работа, жилище и услуги за българите, с връзки към официалните източници.",
    "Practical information for life in Montréal and Québec — documents, health, family, work, housing and services for Bulgarians, with links to the official sources.",
    "Information pratique pour vivre à Montréal et au Québec — documents, santé, famille, emploi, logement et services pour les Bulgares, avec des liens vers les sources officielles.",
  ),
  metaTitle: tri(
    "Помощ и полезна информация за живота в Монреал – BGMTL",
    "Help & Resources for Life in Montréal – BGMTL",
    "Aide et ressources pour vivre à Montréal – BGMTL",
  ),
  metaDescription: tri(
    "Полезна информация за българите в Монреал: SIN, здравна карта RAMQ, курсове по френски, детски градини, шофьорска книжка, жилище, данъци и консулски услуги.",
    "Useful information for Bulgarians in Montréal: SIN, RAMQ health card, French courses, daycare, driver’s licence, housing, taxes and consular services.",
    "Infos utiles pour les Bulgares à Montréal : NAS, carte RAMQ, cours de français, services de garde, permis de conduire, logement, impôts et services consulaires.",
  ),
};

// Every entry to write, leaves first so links resolve when the page publishes.
function plan() {
  const entries = [];
  const cardIds = [];
  for (const c of CARDS) {
    const id = `help-${c.key}`;
    entries.push({
      id: `heading-${id}`,
      type: "heading",
      fields: { title: bg(`Help: ${c.key}`), heading: c.title, as: bg("h3"), size: bg("h4") },
    });
    entries.push({
      id: `link-${id}`,
      type: "link",
      fields: {
        title: bg(`Help: ${c.key}`),
        name: c.linkName,
        url: tri(c.url, c.url, c.url),
        type: bg("link"),
      },
    });
    entries.push({
      id: `card-${id}`,
      type: "card",
      fields: {
        title: bg(`Help: ${c.key}`),
        heading: bg(link(`heading-${id}`)),
        content: localizedDoc(c.text),
        role: c.topic,
        link: bg(link(`link-${id}`)),
        icon: bg(c.icon),
      },
    });
    cardIds.push(`card-${id}`);
  }
  entries.push(
    {
      id: "collection-help-guide",
      type: "collection",
      fields: {
        title: bg("Help: guide cards"),
        variant: bg("grid"),
        cardVariant: bg("guide"),
        cards: bg(cardIds.map(link)),
        itemsPerRow: bg(3),
      },
    },
    {
      id: "heading-help-section",
      type: "heading",
      fields: { title: bg("Help: section"), heading: PAGE.heading, accent: PAGE.accent, as: bg("h1"), size: bg("h2") },
    },
    {
      id: "section-help-guide",
      type: "section",
      fields: {
        title: bg("Help: newcomer guide"),
        heading: bg(link("heading-help-section")),
        description: localizedDoc(PAGE.intro),
        components: bg([link("collection-help-guide")]),
      },
    },
    {
      id: "heading-help-page",
      type: "heading",
      fields: { title: bg("Help: page name"), heading: PAGE.name },
    },
    {
      id: "metadata-page-help",
      type: "metaData",
      fields: {
        title: bg("META: Help"),
        pageTitle: PAGE.metaTitle,
        pageDescription: PAGE.metaDescription,
      },
    },
    {
      id: "page-help",
      type: "page",
      fields: {
        title: bg("HELP"),
        slug: bg("help"),
        pageName: bg(link("heading-help-page")),
        metaData: bg(link("metadata-page-help")),
        sections: bg([link("section-help-guide")]),
        sidebar: bg(false),
      },
    },
  );
  return entries;
}

async function main() {
  for (const c of CARDS) {
    console.log(`\n# ${c.key} (${c.icon})  ${c.url}`);
    for (const loc of LOCALES) {
      console.log(`  [${loc}] ${c.topic[loc]} · ${c.title[loc]}\n    ${c.text[loc]}\n    → ${c.linkName[loc]}`);
    }
  }
  const entries = plan();
  console.log(`\n${entries.length} entries.`);
  if (!PUBLISH) {
    console.log("Dry run. Re-run with --publish to create and publish.");
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

  for (const e of entries) {
    try {
      let entry;
      try {
        entry = await client.entry.get({ entryId: e.id });
        entry.fields = { ...entry.fields, ...e.fields };
        entry = await client.entry.update({ entryId: e.id }, entry);
      } catch (err) {
        if (!/NotFound|could not be found/i.test(err.message)) throw err;
        entry = await client.entry.createWithId({ entryId: e.id, contentTypeId: e.type }, { fields: e.fields });
      }
      await client.entry.publish({ entryId: e.id }, entry);
      console.log(`✓ ${e.type} ${e.id}`);
    } catch (err) {
      console.log(`! ${e.type} ${e.id}:`, err.message);
      process.exitCode = 1;
      return;
    }
  }
}

main();
