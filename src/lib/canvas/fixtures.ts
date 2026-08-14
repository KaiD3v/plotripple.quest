import type { Locale } from "@/i18n/config";
import { narrativeGraphThroughChronicle } from "@/lib/chronicle/narrative-bridge";
import { parseNarrativeGraph } from "@/schemas/narrative-graph";
import type { Category } from "@/types/generator";
import type {
  ConsequenceNode,
  DecisionNode,
  FollowUpNode,
  NarrativeEdge,
  NarrativeGraph,
  NarrativeStatus,
  NarrativeTimeframe,
} from "@/types/narrative-graph";

export const fixtureIds = ["3", "5", "10", "25", "long-pt"] as const;
export type FixtureId = (typeof fixtureIds)[number];
export const DEFAULT_FIXTURE_ID: FixtureId = "3";

const STAMP = {
  createdAt: "2026-03-12T14:00:00.000Z",
  updatedAt: "2026-03-12T14:00:00.000Z",
} as const;

type ConsequenceDraft = {
  id: string;
  title: string;
  description: string;
  timeframe: NarrativeTimeframe;
  category: Category;
  trigger: string;
  affectedParties: string[];
  status?: NarrativeStatus;
};

type FollowUpDraft = {
  id: string;
  title: string;
  note: string;
  status?: NarrativeStatus;
  timeframe?: NarrativeTimeframe;
};

function decision(
  id: string,
  label: string,
  summary?: string,
): DecisionNode {
  return summary
    ? { id, kind: "decision", label, summary }
    : { id, kind: "decision", label };
}

function consequence(draft: ConsequenceDraft): ConsequenceNode {
  return {
    id: draft.id,
    kind: "consequence",
    title: draft.title,
    description: draft.description,
    timeframe: draft.timeframe,
    category: draft.category,
    trigger: draft.trigger,
    affectedParties: draft.affectedParties,
    status: draft.status ?? "pending",
  };
}

function followUp(draft: FollowUpDraft): FollowUpNode {
  return {
    id: draft.id,
    kind: "follow_up",
    title: draft.title,
    note: draft.note,
    status: draft.status ?? "pending",
    timeframe: draft.timeframe,
  };
}

function edge(id: string, source: string, target: string): NarrativeEdge {
  return { id, source, target };
}

function graph(input: Omit<NarrativeGraph, "version">): NarrativeGraph {
  return parseNarrativeGraph({ ...input, version: 1 });
}

const scoutDecision = {
  en: {
    title: "Mercy for the scout",
    label:
      "The party spared the captured scout and sent them home with a warning.",
    summary:
      "Mercy leaves a trail. The garrison, the kin, and a rival patrol all hear a different version of the same night.",
  },
  "pt-br": {
    title: "Misericórdia ao batedor",
    label:
      "O grupo poupou o batedor capturado e o mandou de volta com um aviso.",
    summary:
      "A misericórdia deixa rastro. A guarnição, os parentes e uma patrulha rival ouvem versões diferentes da mesma noite.",
  },
} as const;

function fixtureThree(locale: Locale): NarrativeGraph {
  const copy = scoutDecision[locale];
  const id = `fixture-3-${locale}`;
  return graph({
    id,
    locale,
    title: copy.title,
    ...STAMP,
    rootNodeId: `${id}:d`,
    nodes: [
      decision(`${id}:d`, copy.label, copy.summary),
      consequence({
        id: `${id}:c1`,
        title:
          locale === "en" ? "A whispered debt" : "Uma dívida em voz baixa",
        description:
          locale === "en"
            ? "The scout’s kin begin asking quiet favors of the party before the next watch changes."
            : "Os parentes do batedor começam a pedir favores discretos ao grupo antes da próxima troca de guarda.",
        timeframe: "immediate",
        category: "social",
        trigger:
          locale === "en"
            ? "The scout reports who showed mercy."
            : "O batedor relata quem mostrou misericórdia.",
        affectedParties:
          locale === "en"
            ? ["the scout’s kin", "a rival patrol"]
            : ["os parentes do batedor", "uma patrulha rival"],
      }),
      consequence({
        id: `${id}:c2`,
        title:
          locale === "en"
            ? "The captain rewrites standing orders"
            : "A capitã reescreve as ordens permanentes",
        description:
          locale === "en"
            ? "By dawn the watch is told not to take prisoners from that road. Interrogations move indoors."
            : "Antes do amanhecer, a guarda recebe ordem de não fazer prisioneiros naquela estrada. Os interrogatórios passam para dentro.",
        timeframe: "next_session",
        category: "political",
        trigger:
          locale === "en"
            ? "The scout’s report reaches the captain unedited."
            : "O relatório do batedor chega intacto à capitã.",
        affectedParties:
          locale === "en"
            ? ["the garrison", "travelers on the south road"]
            : ["a guarnição", "viajantes da estrada sul"],
      }),
      consequence({
        id: `${id}:c3`,
        title:
          locale === "en"
            ? "A rumor becomes a banner"
            : "Um rumor vira estandarte",
        description:
          locale === "en"
            ? "By season’s end, a border chapel preaches that the party’s mercy was a sign. Pilgrims start using the party’s name."
            : "No fim da estação, uma capela de fronteira prega que a misericórdia do grupo foi um sinal. Peregrinos começam a usar o nome deles.",
        timeframe: "long_term",
        category: "supernatural",
        trigger:
          locale === "en"
            ? "A chaplain hears the story third-hand and writes it down."
            : "Um capelão ouve a história de terceira mão e a anota.",
        affectedParties:
          locale === "en"
            ? ["border pilgrims", "the chapel’s patrons"]
            : ["peregrinos da fronteira", "os patronos da capela"],
      }),
    ],
    edges: [
      edge(`${id}:e1`, `${id}:d`, `${id}:c1`),
      edge(`${id}:e2`, `${id}:d`, `${id}:c2`),
      edge(`${id}:e3`, `${id}:d`, `${id}:c3`),
    ],
  });
}

function fixtureFive(locale: Locale): NarrativeGraph {
  const copy = scoutDecision[locale];
  const id = `fixture-5-${locale}`;
  return graph({
    id,
    locale,
    title: copy.title,
    ...STAMP,
    rootNodeId: `${id}:d`,
    nodes: [
      decision(`${id}:d`, copy.label, copy.summary),
      consequence({
        id: `${id}:c1`,
        title: locale === "en" ? "Empty cages by midnight" : "Jaulas vazias à meia-noite",
        description:
          locale === "en"
            ? "Other captives hear that mercy is possible and start testing the locks before the next bell."
            : "Outros cativos ouvem que a misericórdia é possível e testam as fechaduras antes do próximo sino.",
        timeframe: "immediate",
        category: "social",
        trigger:
          locale === "en"
            ? "Word spreads through the holding yard."
            : "A notícia corre pelo pátio de retenção.",
        affectedParties:
          locale === "en"
            ? ["remaining captives", "the night watch"]
            : ["os cativos restantes", "a guarda noturna"],
      }),
      consequence({
        id: `${id}:c2`,
        title:
          locale === "en" ? "A bribe changes hands" : "Um suborno muda de dono",
        description:
          locale === "en"
            ? "A clerk who logged the release sells the name of the escort to a river smuggler."
            : "Um escrivão que registrou a soltura vende o nome da escolta a um contrabandista do rio.",
        timeframe: "immediate",
        category: "economic",
        trigger:
          locale === "en"
            ? "The release is written into the daybook."
            : "A soltura entra no livro do dia.",
        affectedParties:
          locale === "en"
            ? ["the clerk", "river smugglers"]
            : ["o escrivão", "contrabandistas do rio"],
      }),
      consequence({
        id: `${id}:c3`,
        title:
          locale === "en"
            ? "The rival patrol shadows the road"
            : "A patrulha rival segue a estrada",
        description:
          locale === "en"
            ? "They do not attack. They count faces, mark camps, and wait for the party to sleep poorly."
            : "Eles não atacam. Contam rostos, marcam acampamentos e esperam o grupo dormir mal.",
        timeframe: "next_session",
        category: "political",
        trigger:
          locale === "en"
            ? "The scout’s kin refuse to name the party as enemies."
            : "Os parentes do batedor recusam-se a nomear o grupo como inimigo.",
        affectedParties:
          locale === "en"
            ? ["rival patrol", "south-road inns"]
            : ["patrulha rival", "estalagens da estrada sul"],
      }),
      consequence({
        id: `${id}:c4`,
        title:
          locale === "en"
            ? "A sibling asks for escort"
            : "Um irmão pede escolta",
        description:
          locale === "en"
            ? "The scout’s younger sibling arrives with a sealed letter and a request the party cannot honor quietly."
            : "O irmão mais novo do batedor chega com uma carta lacrada e um pedido que o grupo não consegue honrar em silêncio.",
        timeframe: "next_session",
        category: "personal",
        trigger:
          locale === "en"
            ? "The family decides mercy created a debt."
            : "A família decide que a misericórdia criou uma dívida.",
        affectedParties:
          locale === "en"
            ? ["the scout’s sibling", "the party’s patron"]
            : ["o irmão do batedor", "o patrono do grupo"],
      }),
      consequence({
        id: `${id}:c5`,
        title:
          locale === "en"
            ? "The border hymn changes a verse"
            : "O hino da fronteira muda um verso",
        description:
          locale === "en"
            ? "A year later, children on the march sing about the night the blades stayed sheathed. The original names are already wrong."
            : "Um ano depois, crianças na marcha cantam a noite em que as lâminas permaneceram na bainha. Os nomes originais já estão errados.",
        timeframe: "long_term",
        category: "environmental",
        trigger:
          locale === "en"
            ? "The story is retold at three harvest fairs."
            : "A história é recontada em três feiras da colheita.",
        affectedParties:
          locale === "en"
            ? ["border villages", "itinerant singers"]
            : ["aldeias da fronteira", "cantores itinerantes"],
      }),
    ],
    edges: [
      edge(`${id}:e1`, `${id}:d`, `${id}:c1`),
      edge(`${id}:e2`, `${id}:d`, `${id}:c2`),
      edge(`${id}:e3`, `${id}:d`, `${id}:c3`),
      edge(`${id}:e4`, `${id}:d`, `${id}:c4`),
      edge(`${id}:e5`, `${id}:d`, `${id}:c5`),
    ],
  });
}

function fixtureTen(locale: Locale): NarrativeGraph {
  const id = `fixture-10-${locale}`;
  const en = locale === "en";
  return graph({
    id,
    locale,
    title: en ? "The sealed granary" : "O celeiro lacrado",
    ...STAMP,
    rootNodeId: `${id}:d`,
    nodes: [
      decision(
        `${id}:d`,
        en
          ? "The party broke the duke’s seal on the winter granary to feed the flooded quarter."
          : "O grupo rompeu o lacre do duque no celeiro de inverno para alimentar o bairro alagado.",
        en
          ? "A public mercy becomes a ledger problem, then a faction problem, then a weather problem."
          : "Uma misericórdia pública vira problema de livro-caixa, depois de facção, depois de clima.",
      ),
      consequence({
        id: `${id}:c1`,
        title: en ? "Bread before dawn" : "Pão antes do amanhecer",
        description: en
          ? "Queues form. The flooded quarter eats. The duke’s stewards start counting sacks by torchlight."
          : "Filas se formam. O bairro alagado come. Os intendentes do duque começam a contar sacos à luz de tocha.",
        timeframe: "immediate",
        category: "social",
        trigger: en
          ? "The broken seal is seen from the river wall."
          : "O lacre rompido é visto da muralha do rio.",
        affectedParties: en
          ? ["flooded quarter", "ducal stewards"]
          : ["bairro alagado", "intendentes ducais"],
      }),
      consequence({
        id: `${id}:c2`,
        title: en ? "A miller’s price" : "O preço do moleiro",
        description: en
          ? "The miller who helped carry grain now wants protection from the duke’s auditors."
          : "O moleiro que ajudou a carregar o grão agora quer proteção contra os auditores do duque.",
        timeframe: "next_session",
        category: "economic",
        trigger: en
          ? "The miller’s mark is found on two empty sacks."
          : "A marca do moleiro aparece em dois sacos vazios.",
        affectedParties: en
          ? ["the miller", "ducal auditors"]
          : ["o moleiro", "auditores ducais"],
      }),
      consequence({
        id: `${id}:c3`,
        title: en ? "The river cult keeps a tithe" : "O culto do rio guarda o dízimo",
        description: en
          ? "Priests of the silt claim the opened granary was an offering. They begin blessing only those who helped."
          : "Sacerdotes do limo afirmam que o celeiro aberto foi uma oferenda. Passam a abençoar só quem ajudou.",
        timeframe: "long_term",
        category: "supernatural",
        trigger: en
          ? "A silt-priest preaches from the broken door."
          : "Um sacerdote do limo prega da porta quebrada.",
        affectedParties: en
          ? ["silt cult", "ducal chapel"]
          : ["culto do limo", "capela ducal"],
      }),
      followUp({
        id: `${id}:f1`,
        title: en ? "Names on the ration slate" : "Nomes na lousa da ração",
        note: en
          ? "If the party returns, the quarter will ask them to witness the next distribution."
          : "Se o grupo voltar, o bairro pedirá que testemunhem a próxima distribuição.",
        timeframe: "next_session",
      }),
      consequence({
        id: `${id}:c4`,
        title: en ? "Auditors arrive with wax" : "Auditores chegam com cera",
        description: en
          ? "The miller is summoned. The party’s description is attached to a new seal."
          : "O moleiro é convocado. A descrição do grupo vai anexada a um lacre novo.",
        timeframe: "next_session",
        category: "political",
        trigger: en
          ? "The miller fails to buy the auditors off."
          : "O moleiro não consegue subornar os auditores.",
        affectedParties: en
          ? ["ducal auditors", "the miller’s apprentices"]
          : ["auditores ducais", "aprendizes do moleiro"],
      }),
      followUp({
        id: `${id}:f2`,
        title: en ? "A false confession" : "Uma confissão falsa",
        note: en
          ? "Someone will claim they opened the granary alone to spare the party — or to replace them."
          : "Alguém dirá que abriu o celeiro sozinho para poupar o grupo — ou para substituí-lo.",
        timeframe: "next_session",
      }),
      consequence({
        id: `${id}:c5`,
        title: en ? "The silt remembers the door" : "O limo lembra a porta",
        description: en
          ? "Next flood season, the river refuses to recede from the granary threshold until a new offering is named."
          : "Na próxima cheia, o rio recusa-se a recuar do limiar do celeiro até que uma nova oferenda seja nomeada.",
        timeframe: "long_term",
        category: "environmental",
        trigger: en
          ? "The cult keeps the broken seal as a relic."
          : "O culto guarda o lacre rompido como relíquia.",
        affectedParties: en
          ? ["silt cult", "riverside farms"]
          : ["culto do limo", "fazendas da margem"],
      }),
      followUp({
        id: `${id}:f3`,
        title: en ? "A hymn with the party’s cadence" : "Um hino no ritmo do grupo",
        note: en
          ? "The verse can be rewritten, banned, or left to become true."
          : "O verso pode ser reescrito, banido ou deixado para se tornar verdade.",
        timeframe: "long_term",
      }),
      followUp({
        id: `${id}:f4`,
        title: en ? "Winter stores run short" : "Os estoques de inverno acabam cedo",
        note: en
          ? "The duke will either raise the grain tax or open a second granary. Both choices remember this night."
          : "O duque vai subir o imposto do grão ou abrir um segundo celeiro. As duas escolhas lembram esta noite.",
        timeframe: "long_term",
      }),
    ],
    edges: [
      edge(`${id}:e1`, `${id}:d`, `${id}:c1`),
      edge(`${id}:e2`, `${id}:d`, `${id}:c2`),
      edge(`${id}:e3`, `${id}:d`, `${id}:c3`),
      edge(`${id}:e4`, `${id}:c1`, `${id}:f1`),
      edge(`${id}:e5`, `${id}:c2`, `${id}:c4`),
      edge(`${id}:e6`, `${id}:c2`, `${id}:f2`),
      edge(`${id}:e7`, `${id}:c3`, `${id}:c5`),
      edge(`${id}:e8`, `${id}:c5`, `${id}:f3`),
      edge(`${id}:e9`, `${id}:c4`, `${id}:f4`),
    ],
  });
}

function ripple(
  id: string,
  index: number,
  locale: Locale,
  timeframe: NarrativeTimeframe,
  category: Category,
): ConsequenceNode {
  const en = locale === "en";
  const titlesEn = [
    "A witness keeps the hour",
    "A ledger gains a new column",
    "A rival claims the rumor",
    "A door is barred after vespers",
    "A courier takes the long road",
    "A chapel changes the prayer",
    "A market stall disappears",
    "A captain burns a dispatch",
    "A child repeats the wrong name",
    "A bridge toll doubles overnight",
    "A patron withdraws credit",
    "A storm flag is raised early",
    "A sealed letter is copied",
    "A watch rotation skips a post",
    "A relic is quietly moved",
    "A harvest song adds a verse",
    "A dockworker refuses the crate",
    "A spy keeps the original map",
    "A widow sells the family boat",
    "A council postpones the vote",
    "A lantern stays lit past curfew",
    "A hunter marks a new trail",
    "A tax stamp is forged badly",
    "A garden is salted by mistake",
  ] as const;
  const titlesPt = [
    "Uma testemunha guarda a hora",
    "O livro-caixa ganha uma coluna",
    "Um rival reivindica o rumor",
    "Uma porta é trancada após as vésperas",
    "Um mensageiro toma o caminho longo",
    "Uma capela muda a oração",
    "Uma banca some do mercado",
    "Uma capitã queima um despacho",
    "Uma criança repete o nome errado",
    "O pedágio da ponte dobra de noite",
    "Um patrono retira o crédito",
    "A bandeira de tempestade sobe cedo",
    "Uma carta lacrada é copiada",
    "A ronda pula um posto",
    "Uma relíquia é movida em silêncio",
    "A canção da colheita ganha um verso",
    "Um estivador recusa o caixote",
    "Um espião guarda o mapa original",
    "Uma viúva vende o barco da família",
    "O conselho adia a votação",
    "Uma lanterna fica acesa após o toque",
    "Um caçador marca um novo rastro",
    "Um selo de imposto é forjado mal",
    "Uma horta é salgada por engano",
  ] as const;

  return consequence({
    id,
    title:
      (en ? titlesEn[index] : titlesPt[index]) ??
      (en ? `Ripple ${index + 1}` : `Ondulação ${index + 1}`),
    description: en
      ? `The first choice keeps moving. This ripple (${index + 1}) arrives as ${timeframe.replace(/_/g, " ")} pressure on people who were not in the room.`
      : `A primeira escolha continua andando. Esta ondulação (${index + 1}) chega como pressão de ${timeframe === "immediate" ? "prazo imediato" : timeframe === "next_session" ? "próxima sessão" : "longo prazo"} sobre quem não estava na sala.`,
    timeframe,
    category,
    trigger: en
      ? `Someone repeats the original decision in a narrower room (${index + 1}).`
      : `Alguém repete a decisão original numa sala mais estreita (${index + 1}).`,
    affectedParties: en
      ? [`circle ${index + 1}`, `witness ${index + 1}`]
      : [`círculo ${index + 1}`, `testemunha ${index + 1}`],
  });
}

function fixtureTwentyFive(locale: Locale): NarrativeGraph {
  const id = `fixture-25-${locale}`;
  const en = locale === "en";
  const timeframes: NarrativeTimeframe[] = [
    "immediate",
    "next_session",
    "long_term",
  ];
  const categories: Category[] = [
    "social",
    "political",
    "economic",
    "personal",
    "supernatural",
    "environmental",
  ];

  const root = decision(
    `${id}:d`,
    en
      ? "The party returned the stolen reliquary to the abbey, but named the thief in open court."
      : "O grupo devolveu o relicário roubado à abadia, mas nomeou o ladrão em praça aberta.",
    en
      ? "Restitution and exposure split into two weather systems. Twenty-odd rooms start closing doors."
      : "Restituição e exposição se separam em dois climas. Umas vinte salas começam a fechar portas.",
  );

  const firstWave = [0, 1, 2, 3, 4].map((index) =>
    ripple(
      `${id}:c${index}`,
      index,
      locale,
      timeframes[index % 3],
      categories[index % categories.length],
    ),
  );

  const secondWave = [5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map((index) =>
    ripple(
      `${id}:c${index}`,
      index,
      locale,
      timeframes[index % 3],
      categories[index % categories.length],
    ),
  );

  const thirdWave = [16, 17, 18, 19].map((index) =>
    ripple(
      `${id}:c${index}`,
      index,
      locale,
      timeframes[index % 3],
      categories[index % categories.length],
    ),
  );

  const followUps = [
    followUp({
      id: `${id}:f1`,
      title: en ? "The abbey asks for silence" : "A abadia pede silêncio",
      note: en
        ? "A later scene can trade the named thief’s safety for a rewritten chronicle."
        : "Uma cena posterior pode trocar a segurança do ladrão nomeado por uma crônica reescrita.",
      timeframe: "next_session",
    }),
    followUp({
      id: `${id}:f2`,
      title: en ? "The court keeps the minutes" : "O tribunal guarda a ata",
      note: en
        ? "The minutes can be stolen, sealed, or read aloud in another city."
        : "A ata pode ser roubada, lacrada ou lida em voz alta noutra cidade.",
      timeframe: "long_term",
    }),
    followUp({
      id: `${id}:f3`,
      title: en ? "A false reliquary appears" : "Um relicário falso aparece",
      note: en
        ? "Someone will try to sell the ‘original’ back to the abbey using the party’s story as proof."
        : "Alguém tentará revender o “original” à abadia usando a história do grupo como prova.",
      timeframe: "long_term",
    }),
    followUp({
      id: `${id}:f4`,
      title: en ? "The thief’s kin leave town" : "Os parentes do ladrão deixam a cidade",
      note: en
        ? "A later session can decide whether they flee, hire the party, or sell the name onward."
        : "Uma sessão posterior decide se fogem, contratam o grupo ou vendem o nome adiante.",
      timeframe: "next_session",
    }),
  ];

  const nodes = [root, ...firstWave, ...secondWave, ...thirdWave, ...followUps];
  const edges: NarrativeEdge[] = [
    ...firstWave.map((node, index) =>
      edge(`${id}:e-d-${index}`, root.id, node.id),
    ),
    ...secondWave.map((node, index) =>
      edge(
        `${id}:e-2-${index}`,
        firstWave[index % firstWave.length].id,
        node.id,
      ),
    ),
    ...thirdWave.map((node, index) =>
      edge(
        `${id}:e-3-${index}`,
        secondWave[index + 2].id,
        node.id,
      ),
    ),
    edge(`${id}:e-f1`, firstWave[0].id, followUps[0].id),
    edge(`${id}:e-f2`, secondWave[0].id, followUps[1].id),
    edge(`${id}:e-f3`, thirdWave[0].id, followUps[2].id),
    edge(`${id}:e-f4`, firstWave[4].id, followUps[3].id),
  ];

  return graph({
    id,
    locale,
    title: en ? "The named thief" : "O ladrão nomeado",
    ...STAMP,
    rootNodeId: root.id,
    nodes,
    edges,
  });
}

function fixtureLongPt(): NarrativeGraph {
  const id = "fixture-long-pt";
  return graph({
    id,
    locale: "pt-br",
    title: "A audiência do conselho das marés e o juramento quebrado na alfândega",
    ...STAMP,
    rootNodeId: `${id}:d`,
    nodes: [
      decision(
        `${id}:d`,
        "Depois de três noites de chuva salgada sobre o cais velho, o grupo interrompeu a audiência pública do conselho das marés, recusou-se a entregar o livro de registros da alfândega e declarou, diante de estivadores, escribas, credores e da viúva do piloto, que o juramento de sigilo feito à casa Armelar estava quebrado para sempre e que qualquer navio lacrado naquela semana sairia apenas com testemunhas da rua.",
        "Uma recusa pública, longa e impossível de resumir numa frase só, espalha consequências que não cabem num cartão estreito: nomes, ofícios, dívidas, rumores e o cheiro de peixe seco no corredor da alfândega.",
      ),
      consequence({
        id: `${id}:c1`,
        title:
          "Estivadores recusam o desembarque noturno e exigem lacres lidos em voz alta",
        description:
          "Antes mesmo do sino das quatro, a calçada entre o armazém do sal e a escada da prancha fica intransitável. Não é um motim: é uma fila cerimoniosa e irritada. Cada caixote ganha uma testemunha, cada testemunha ganha um apelido, e cada apelido chega mais rápido à taverna do que ao escrivão. A viúva do piloto insiste em permanecer no meio da chuva para confirmar que o livro recusado pelo grupo era, de fato, o mesmo que o marido descreveu na última carta. Os credores da casa Armelar tentam comprar silêncio com pão ainda quente e são vaiados com uma precisão quase administrativa. No fim da madrugada, o cais inteiro conhece uma versão alongada, contraditória e extremamente específica da recusa do grupo — incluindo o tom de voz, a ordem das frases e o momento em que alguém tossiu.",
        timeframe: "immediate",
        category: "social",
        trigger:
          "A declaração em praça aberta é repetida, quase palavra por palavra, por dois estivadores que estavam encostados na porta da alfândega e por uma escriba que fingia corrigir apenas a margem do livro de ponto.",
        affectedParties: [
          "estivadores do cais velho",
          "viúva do piloto",
          "escribas da alfândega",
          "credores da casa Armelar",
        ],
      }),
      consequence({
        id: `${id}:c2`,
        title:
          "O conselho suspende a votação e redige uma ata tão longa quanto a audiência",
        description:
          "A mesa de carvalho molhada não se levanta. Em vez de encerrar, o conselho inventa um procedimento: cada conselheiro relê a recusa do grupo, acrescenta uma ressalva, e a ressalva ganha um apêndice. O resultado é um documento que não cabe na pasta habitual e precisa ser enrolado com barbante de vela. Facções que até então votavam juntas descobrem desacordos minuciosos sobre o que significa “testemunhas da rua”. Um conselheiro tenta resumir o episódio em três linhas e é corrigido durante vinte minutos. Outro pede que o grupo compareça de novo, não para se explicar, mas para confirmar a pontuação. Enquanto a ata seca, os navios lacrados permanecem no porto e o preço do sal grosso sobe o bastante para que até quem não estava na audiência tenha uma opinião pronta.",
        timeframe: "next_session",
        category: "political",
        trigger:
          "O escrivão-mor recusa-se a arquivar uma ata incompleta depois que a audiência foi interrompida sem rito de encerramento.",
        affectedParties: [
          "conselho das marés",
          "casa Armelar",
          "capitães dos navios lacrados",
          "mercadores do sal grosso",
        ],
      }),
      consequence({
        id: `${id}:c3`,
        title:
          "Uma crônica de porto transforma a recusa num juramento popular com versos demais",
        description:
          "No inverno seguinte, as tavernais do cais já não repetem o discurso: cantam. A canção começa fiel demais, depois ganha estrofes sobre peixes que testemunharam, sobre um livro que andou sozinho até o farol, e sobre uma viúva que julgou o conselho com um look de lanterna. Peregrinos de vilas ribeirinhas chegam perguntando onde assinar o juramento da rua, embora ninguém tenha previsto um livro de assinaturas. A casa Armelar financia uma versão “correta” que ninguém canta. A capela do canal tenta banir o refrão e só consegue torná-lo mais longo. Anos depois, quando o canal novo finalmente abre, a primeira barcaça leva um estandarte com uma frase que o grupo jamais pronunciou — mas que todo o porto jura ter ouvido naquela chuva.",
        timeframe: "long_term",
        category: "supernatural",
        trigger:
          "Um cronista de porto, sem ter estado na audiência, reconstitui o discurso a partir de sete relatos incompatíveis e publica o texto como se fosse ata sagrada.",
        affectedParties: [
          "cronistas de porto",
          "peregrinos ribeirinhos",
          "capela do canal",
          "descendentes da casa Armelar",
        ],
      }),
    ],
    edges: [
      edge(`${id}:e1`, `${id}:d`, `${id}:c1`),
      edge(`${id}:e2`, `${id}:d`, `${id}:c2`),
      edge(`${id}:e3`, `${id}:d`, `${id}:c3`),
    ],
  });
}

const cache = new Map<string, NarrativeGraph>();

export function isFixtureId(value: string): value is FixtureId {
  return (fixtureIds as readonly string[]).includes(value);
}

export function getFixture(fixtureId: FixtureId, locale: Locale): NarrativeGraph {
  if (fixtureId === "long-pt") {
    const cached = cache.get("long-pt");
    if (cached) {
      return cached;
    }
    const graphValue = narrativeGraphThroughChronicle(fixtureLongPt());
    cache.set("long-pt", graphValue);
    return graphValue;
  }

  const cacheKey = `${fixtureId}:${locale}`;
  const cached = cache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const graphValue =
    fixtureId === "3"
      ? fixtureThree(locale)
      : fixtureId === "5"
        ? fixtureFive(locale)
        : fixtureId === "10"
          ? fixtureTen(locale)
          : fixtureTwentyFive(locale);

  const validated = narrativeGraphThroughChronicle(graphValue);
  cache.set(cacheKey, validated);
  return validated;
}
