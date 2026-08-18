import { useState, useEffect, createContext, useContext } from "react";
import { supabase } from "./lib/supabaseClient.js";
import { buyPremium as buyPremiumFlow, getPayMode, checkEntitlement, verifyStripePurchase } from "./lib/payments.js";
import { BIBLE_FALLBACK } from "./data/bible-fallback.js";
import { StatusBar as NativeStatusBar } from "@capacitor/status-bar";
import {
  Home, BookOpen, Music, Calendar, HelpCircle, DollarSign, Compass, Heart,
  Users, MessageCircle, Flame, Quote, X, Check, ChevronLeft, ChevronRight,
  Search, Play, ArrowRight, ShoppingBag, Sun, Moon, Bell, RotateCcw,
  Plus, Bookmark, Star, User, Crown, Volume2, VolumeX, Sparkles,
  MessageSquare, EyeOff, RefreshCw, Send, FileText, ShieldCheck,
  ShieldAlert, Loader2, MapPin, LocateFixed, Share2,
} from "lucide-react";

/* ============================== THEME ============================== */
const THEMES = {
  dark: {
    name: "dark", canvas: "#0B0E17", surface: "#1B2333", card: "#242D46", cardAlt: "#2C3654",
    accent: "#E3A857", onAccent: "#1B2333", success: "#7FA084", text: "#F4ECDD", textMuted: "#98A0C2",
    border: "#38415C", bezel: "#0d0f18", overlay: "rgba(9,11,18,0.68)",
  },
  light: {
    name: "light", canvas: "#E7E0D0", surface: "#FBF8F2", card: "#FFFFFF", cardAlt: "#F2EBDB",
    accent: "#AD7A3D", onAccent: "#FFFFFF", success: "#4F7A5C", text: "#2B2418", textMuted: "#7C7361",
    border: "#E4DBC8", bezel: "#D6CCB6", overlay: "rgba(43,36,24,0.45)",
  },
};
const ThemeContext = createContext(THEMES.dark);
const useTheme = () => useContext(ThemeContext);

/* ============================== CONTENT DATA ============================== */
const WEEKDAYS_PT = ["Domingo","Segunda-feira","Terça-feira","Quarta-feira","Quinta-feira","Sexta-feira","Sábado"];
const MONTHS_PT = ["janeiro","fevereiro","março","abril","maio","junho","julho","agosto","setembro","outubro","novembro","dezembro"];

// 31 items each — one per day of the month, cycling automatically every month
const VERSES = [
  { ref: "Jeremias 29:11", text: "Eu conheço os planos que tenho para você, diz o Senhor: planos de fazer o bem, e não o mal, para dar a você um futuro e uma esperança." },
  { ref: "Salmos 23:1", text: "O Senhor é o meu pastor; nada me faltará." },
  { ref: "Filipenses 4:13", text: "Tudo posso naquele que me fortalece." },
  { ref: "Provérbios 3:5-6", text: "Confie no Senhor de todo o coração e não se apoie apenas no seu próprio entendimento." },
  { ref: "Isaías 41:10", text: "Não temas, porque eu estou contigo; não te assombres, porque eu sou o teu Deus." },
  { ref: "Mateus 11:28", text: "Venham a mim todos os que estão cansados e sobrecarregados, e eu darei descanso a vocês." },
  { ref: "Salmos 46:1", text: "Deus é o nosso refúgio e a nossa força, um socorro sempre presente na angústia." },
  { ref: "Romanos 8:28", text: "Todas as coisas cooperam para o bem daqueles que amam a Deus." },
  { ref: "João 3:16", text: "Deus amou o mundo de tal maneira que entregou o seu único Filho, para que todo aquele que nele crê tenha a vida eterna." },
  { ref: "Números 6:24-26", text: "Que o Senhor te abençoe e te guarde; que o Senhor faça resplandecer o seu rosto sobre ti e te dê paz." },
  { ref: "Salmos 27:1", text: "O Senhor é a minha luz e a minha salvação; a quem temerei?" },
  { ref: "Isaías 40:31", text: "Os que esperam no Senhor renovam as suas forças e voam alto como águias." },
  { ref: "Josué 1:9", text: "Seja forte e corajoso, não tenha medo nem desanime, pois o Senhor estará com você por onde você andar." },
  { ref: "Salmos 34:18", text: "Perto está o Senhor dos que têm o coração quebrantado e salva os de espírito abatido." },
  { ref: "Provérbios 16:3", text: "Entregue ao Senhor tudo o que você faz, e os seus planos serão bem-sucedidos." },
  { ref: "Gálatas 6:9", text: "Não nos cansemos de fazer o bem, pois no tempo certo colheremos, se não desistirmos." },
  { ref: "1 Coríntios 13:4", text: "O amor é paciente, o amor é bondoso, não inveja, não se vangloria." },
  { ref: "Salmos 121:2", text: "O meu socorro vem do Senhor, que fez os céus e a terra." },
  { ref: "Efésios 2:8", text: "Vocês são salvos pela graça, por meio da fé — e isso não vem de vocês, é dom de Deus." },
  { ref: "Mateus 6:33", text: "Busquem em primeiro lugar o Reino de Deus, e todas essas coisas serão acrescentadas a vocês." },
  { ref: "Salmos 37:4", text: "Agrade-se do Senhor, e ele atenderá aos desejos do seu coração." },
  { ref: "Tiago 1:5", text: "Se algum de vocês tem falta de sabedoria, peça-a a Deus, que a todos dá livremente, sem repreender." },
  { ref: "2 Coríntios 12:9", text: "A minha graça é suficiente para você, pois o meu poder se aperfeiçoa na fraqueza." },
  { ref: "Salmos 91:1-2", text: "Aquele que habita no esconderijo do Altíssimo descansará à sombra do Onipotente." },
  { ref: "Provérbios 17:22", text: "O coração alegre é bom remédio, mas o espírito abatido seca os ossos." },
  { ref: "Hebreus 11:1", text: "A fé é a certeza daquilo que esperamos e a prova das coisas que ainda não vemos." },
  { ref: "Salmos 139:14", text: "Eu te louvo porque me fizeste de modo especial e admirável; maravilhosas são as tuas obras." },
  { ref: "Colossenses 3:23", text: "Tudo o que fizerem, façam de todo o coração, como para o Senhor, e não para os homens." },
  { ref: "1 Pedro 5:7", text: "Lancem sobre ele toda a sua ansiedade, porque ele tem cuidado de vocês." },
  { ref: "Salmos 16:11", text: "Tu me farás conhecer a vereda da vida; na tua presença há plenitude de alegria." },
  { ref: "Apocalipse 21:4", text: "Ele enxugará dos olhos de vocês toda lágrima; não haverá mais morte, nem tristeza, nem choro, nem dor." },
];

const PRAYERS = [
  { title: "Oração da Manhã", text: "Senhor, obrigado por mais este dia. Antes de tudo, coloco minha vida em Tuas mãos. Guia os meus passos, acalma minha mente e enche meu coração de Tua paz. Amém." },
  { title: "Oração de Gratidão", text: "Pai, hoje quero parar e agradecer. Obrigado pela vida, pela família, pelo teto e pelo pão de cada dia. Ensina-me a viver agradecido. Amém." },
  { title: "Oração por Sabedoria", text: "Senhor, tenho decisões importantes pela frente e não quero andar sozinho. Dá-me discernimento para escolher o que é certo. Amém." },
  { title: "Oração pela Família", text: "Pai, coloco minha família em Tuas mãos. Protege cada um, restaura o que estiver quebrado e fortalece os laços entre nós. Amém." },
  { title: "Oração por Paz", text: "Senhor, minha mente está cheia de preocupações. Peço que a Tua paz, que excede todo entendimento, guarde meu coração agora. Amém." },
  { title: "Oração pelo Trabalho e Sustento", text: "Deus, abençoa o trabalho das minhas mãos. Provê o que preciso e livra-me da ansiedade pelo dia de amanhã. Amém." },
  { title: "Oração da Noite", text: "Senhor, obrigado por este dia que se encerra. Perdoa onde falhei e recebe minha gratidão. Descanso em Tuas mãos essa noite. Amém." },
  { title: "Oração por Saúde", text: "Senhor, tu és o Deus que cura. Toco hoje diante de ti minha saúde e a de quem amo. Fortalece o meu corpo e renova minhas forças. Amém." },
  { title: "Oração por Proteção", text: "Pai, cobre a minha vida e a da minha família com a tua proteção hoje. Que nenhum mal se aproxime da nossa morada. Amém." },
  { title: "Oração por Restauração", text: "Senhor, há áreas da minha vida que precisam da tua restauração. Onde há quebra, traz cura; onde há perda, traz reposição. Amém." },
  { title: "Oração por Direção", text: "Deus, não sei qual caminho tomar. Guia os meus passos e fecha as portas erradas com a mesma clareza com que abres as certas. Amém." },
  { title: "Oração pelos Filhos", text: "Pai, entrego meus filhos em tuas mãos. Guarda o coração deles e cerca-os de pessoas que os ajudem a te conhecer. Amém." },
  { title: "Oração pela Igreja", text: "Senhor, abençoa a tua igreja. Une os que fazem parte dela e usa cada um de nós para edificar o Teu Reino. Amém." },
  { title: "Oração por Quem Sofre", text: "Deus, hoje levanto diante de ti quem está sofrendo. Aproxima-te de quem chora e sê o consolo que só tu podes dar. Amém." },
  { title: "Oração por Paciência", text: "Senhor, ensina-me a esperar sem ansiedade. Dá-me paciência com os outros e comigo mesmo, enquanto tu trabalhas no tempo certo. Amém." },
  { title: "Oração Pedindo Perdão", text: "Pai, reconheço onde falhei. Perdoa o meu pecado e limpa o meu coração. Ajuda-me a caminhar de forma diferente. Amém." },
  { title: "Oração Concedendo Perdão", text: "Senhor, há alguém que me machucou e ainda carrego esse peso. Ajuda-me a perdoar como fui perdoado. Amém." },
  { title: "Oração por Alegria", text: "Deus, enche o meu coração de alegria genuína hoje, não porque tudo está resolvido, mas porque tu estás comigo. Amém." },
  { title: "Oração por Contentamento", text: "Senhor, ensina-me a estar satisfeito com o que tenho hoje, sem deixar de sonhar com o que virá. Amém." },
  { title: "Oração por um Novo Começo", text: "Pai, obrigado porque as tuas misericórdias se renovam a cada manhã. Hoje eu escolho recomeçar. Amém." },
  { title: "Oração por Coragem", text: "Deus, dá-me coragem para enfrentar o que hoje me assusta. Lembra-me de que tu já foste antes de mim nesse caminho. Amém." },
  { title: "Oração por Cura", text: "Senhor, tu conheces cada dor que carrego. Toca o que precisa ser curado e me sustenta enquanto isso acontece. Amém." },
  { title: "Oração por Favor", text: "Pai, peço o teu favor sobre o meu dia: nas conversas, nas decisões e nas portas que ainda vou encontrar. Amém." },
  { title: "Oração por Boas Decisões", text: "Senhor, tenho escolhas importantes pela frente. Tira de mim a pressa e me dá clareza para decidir. Amém." },
  { title: "Oração por Unidade", text: "Deus, onde há divisão à minha volta, usa-me como instrumento de paz e unidade. Amém." },
  { title: "Oração por Pureza de Coração", text: "Pai, examina o meu coração e revela o que não te agrada. Quero pensamentos que reflitam quem tu és. Amém." },
  { title: "Oração por Generosidade", text: "Senhor, abre as minhas mãos. Ensina-me a dar com alegria, sem medo de que vai faltar. Amém." },
  { title: "Oração por Perseverança", text: "Deus, quando a vontade de desistir bater, lembra-me de todas as vezes que tu já me sustentaste até aqui. Amém." },
  { title: "Oração de Esperança", text: "Pai, quando o cenário parecer difícil de mudar, ajuda-me a lembrar que a esperança em ti nunca decepciona. Amém." },
  { title: "Oração de Fé", text: "Senhor, aumenta a minha fé. Nas coisas que ainda não vejo, ajuda-me a confiar no teu caráter, que já conheço. Amém." },
  { title: "Oração de Entrega", text: "Deus, hoje eu escolho entregar nas tuas mãos o que insisto em carregar sozinho. Assume o controle da minha vida. Amém." },
];

const MOMENTS = [
  { theme: "Confiança", intro: "Há dias em que não entendemos o caminho, mas podemos confiar em quem o traça. Respire fundo e solte o que está tentando controlar sozinho.", verseRef: "Provérbios 3:5-6" },
  { theme: "Gratidão", intro: "Antes de pedir qualquer coisa, pare e agradeça. A gratidão muda a forma como enxergamos o nosso dia.", verseRef: "1 Tessalonicenses 5:18" },
  { theme: "Perdão", intro: "Perdoar não é esquecer, é escolher a liberdade em vez do peso que você carrega.", verseRef: "Efésios 4:32" },
  { theme: "Esperança", intro: "Mesmo na espera, há esperança. Deus não chega atrasado, ainda que o relógio pareça dizer o contrário.", verseRef: "Romanos 15:13" },
  { theme: "Paz", intro: "Você não precisa resolver tudo hoje. Use esta pausa apenas para respirar na presença de Deus.", verseRef: "Filipenses 4:6-7" },
  { theme: "Propósito", intro: "Sua vida não é acidente. Há um propósito sendo tecido, mesmo nos dias mais incertos.", verseRef: "Jeremias 29:11" },
  { theme: "Renovo", intro: "Cansaço não é o fim da linha. Deus renova as forças de quem espera nele.", verseRef: "Isaías 40:31" },
  { theme: "Coragem", intro: "O medo conta uma história. Deus, muitas vezes, conta outra. Hoje, escolha acreditar na versão dele.", verseRef: "Josué 1:9" },
  { theme: "Humildade", intro: "Grandeza, no Reino de Deus, parece muito com serviço. Onde você pode se colocar em último lugar hoje?", verseRef: "Filipenses 2:3" },
  { theme: "Alegria", intro: "Alegria não é ausência de problema, é a presença de Deus no meio dele. Deixe-se alegrar, mesmo que só um pouco.", verseRef: "Neemias 8:10" },
  { theme: "Paciência", intro: "Nem tudo floresce no seu tempo. Respire. O que Deus está construindo em você não tem pressa.", verseRef: "Gálatas 6:9" },
  { theme: "Generosidade", intro: "Mãos fechadas não recebem nada de novo. O que você pode soltar hoje, em confiança?", verseRef: "2 Coríntios 9:7" },
  { theme: "Descanso", intro: "Você não foi criado para funcionar sem parar. Descansar também é um ato de fé.", verseRef: "Êxodo 20:8-10" },
  { theme: "Cura", intro: "Há feridas que só o tempo com Deus consegue tratar. Permita-se sentir, diante dele, o que ainda dói.", verseRef: "Salmos 147:3" },
  { theme: "Provisão", intro: "Antes de você pedir, Deus já sabe do que você precisa. Descanse nisso por um instante.", verseRef: "Mateus 6:31-32" },
  { theme: "Unidade", intro: "Ninguém caminha essa fé sozinho. Pense em alguém que Deus colocou ao seu lado — e agradeça por essa pessoa.", verseRef: "Eclesiastes 4:9-10" },
  { theme: "Pureza", intro: "O que você tem alimentado nos seus pensamentos ultimamente? Convide Deus para essa parte também.", verseRef: "Filipenses 4:8" },
  { theme: "Sabedoria", intro: "Você não precisa ter todas as respostas hoje. Só precisa perguntar a quem as tem.", verseRef: "Tiago 1:5" },
  { theme: "Vitória", intro: "A batalha que parece maior que você não é maior que Deus. Lembre disso antes de continuar o dia.", verseRef: "1 Coríntios 15:57" },
  { theme: "Identidade", intro: "Antes de qualquer título ou função, você é filho ou filha. Deixe essa verdade te sustentar hoje.", verseRef: "1 João 3:1" },
  { theme: "Chamado", intro: "Deus não chama os prontos, prepara os chamados. Onde você sente um chamado ainda pequeno, comece.", verseRef: "Jeremias 1:5" },
  { theme: "Adoração", intro: "Adorar é lembrar quem é maior. Por um minuto, deixe de olhar pro problema e olhe só para Deus.", verseRef: "Salmos 34:3" },
  { theme: "Serviço", intro: "O maior entre vocês será aquele que serve. Quem você pode servir, sem que ninguém veja, hoje?", verseRef: "Marcos 10:43-44" },
  { theme: "Comunhão", intro: "Fé também se vive em comunidade. Pense em alguém que você precisa reencontrar ou ligar hoje.", verseRef: "Hebreus 10:24-25" },
  { theme: "Fé", intro: "Fé não é a ausência de dúvida, é escolher confiar mesmo com ela. Onde você precisa dar esse passo hoje?", verseRef: "Marcos 9:24" },
  { theme: "Entrega", intro: "Existe algo que você está segurando com as duas mãos, com medo de largar. Deus tem mãos maiores que as suas.", verseRef: "Salmos 55:22" },
  { theme: "Restauração", intro: "O que parece quebrado demais para Deus consertar ainda não passou pelas mãos dele. Dê esse espaço a ele agora.", verseRef: "Joel 2:25" },
  { theme: "Proteção", intro: "Você não caminha exposto. Ainda que não veja, há uma cobertura sobre a sua vida.", verseRef: "Salmos 91:4" },
  { theme: "Favor", intro: "Peça hoje, sem medo, pelo favor de Deus sobre o seu dia — nas pessoas, nas portas, nas conversas.", verseRef: "Salmos 5:12" },
  { theme: "Recomeço", intro: "Hoje pode ser o primeiro dia de algo novo. As misericórdias de Deus se renovam a cada manhã.", verseRef: "Lamentações 3:22-23" },
  { theme: "Gratidão em Provação", intro: "Mesmo no meio da dificuldade, existe algo pelo qual agradecer. Encontre isso agora, mesmo que pequeno.", verseRef: "1 Tessalonicenses 5:18" },
];

const REFLECTIONS = [
  "O que Deus tem falado ao seu coração essa semana?",
  "Cite três coisas pelas quais você é grato hoje.",
  "Existe alguém que você precisa perdoar ou pedir perdão?",
  "Onde você tem buscado segurança além de Deus?",
  "O que está pesando no seu coração agora? Escreva sem filtro.",
  "Como você pode servir alguém à sua volta hoje?",
  "O que significa, na prática, confiar em Deus em meio à espera?",
  "Qual medo você precisa entregar a Deus hoje?",
  "Em que área da sua vida você tem tentado controlar tudo sozinho?",
  "Que promessa de Deus você precisa lembrar agora?",
  "Como tem sido a sua vida de oração ultimamente?",
  "O que você faria diferente hoje se realmente confiasse em Deus?",
  "Quem, na sua vida, precisa ver o amor de Deus através de você?",
  "O que você tem aprendido com as dificuldades recentes?",
  "Existe algo que você prometeu a Deus e ainda não cumpriu?",
  "O que ocupa o primeiro lugar no seu coração hoje?",
  "Como você tem cuidado do seu corpo, que é templo de Deus?",
  "Que hábito você gostaria de construir na sua vida espiritual?",
  "Em que momento recente você sentiu a presença de Deus mais perto?",
  "O que a paz de Deus significaria, na prática, para o seu dia hoje?",
  "Existe alguma área escondida da sua vida que Deus está pedindo para iluminar?",
  "Como você tem tratado as pessoas mais próximas de você?",
  "O que te impede de descansar de verdade?",
  "Que passo pequeno de fé você pode dar hoje?",
  "Quando foi a última vez que você celebrou o que Deus já fez?",
  "O que você tem feito com os talentos que Deus te confiou?",
  "Existe uma mágoa antiga que ainda influencia suas decisões hoje?",
  "Como está a sua generosidade — com tempo, dinheiro e atenção?",
  "O que a sua rotina revela sobre as suas prioridades reais?",
  "Que palavra você acredita que Deus quer que você guarde para hoje?",
  "Se hoje fosse o último dia, o que você mudaria agora mesmo?",
];

const HELP_CONTENT = {
  financeira: [
    { title: "Dízimo e generosidade", text: "Dar não é sobre quanto sobra, é sobre confiança. Comece com o que você tem e um coração disposto a partilhar." },
    { title: "Orçamento com propósito", text: "Anote entradas e saídas por 30 dias antes de cortar qualquer gasto. Você não consegue administrar o que não enxerga." },
    { title: "Livre das dívidas", text: "Liste as dívidas da menor para a maior. Quitar a menor primeiro dá o impulso emocional para seguir até o fim." },
    { title: "Contentamento", text: "Contentamento não é se acomodar, é ter paz enquanto se trabalha, com sabedoria, por algo melhor." },
  ],
  espiritual: [
    { title: "Um hábito de oração", text: "Comece com 5 minutos, sempre no mesmo horário. Constância pequena vence intensidade esporádica." },
    { title: "Jejum: primeiros passos", text: "Jejue uma refeição com um propósito claro de oração. Não é sobre passar fome, é sobre abrir espaço." },
    { title: "Estudo bíblico pessoal", text: "Escolha um livro pequeno da Bíblia e leia um capítulo por dia, anotando uma frase que tocou você." },
    { title: "Adoração no dia a dia", text: "Adorar não é só cantar aos domingos. É reconhecer a Deus em cada tarefa simples da rotina." },
  ],
  emocional: [
    { title: "Ansiedade e fé", text: "Coloque em palavras, na oração, exatamente o que te preocupa. Nomear o medo já tira parte do seu peso." },
    { title: "Esperança na tristeza", text: "Tristeza não é falta de fé. Muitos salmos começam em lamento antes de chegar à esperança." },
    { title: "O poder do perdão", text: "Perdoar alguém é, antes de tudo, um presente que você entrega para si mesmo." },
    { title: "Quando Deus parece distante", text: "Sentimentos mudam, mas a fidelidade de Deus não depende de como você se sente hoje." },
  ],
  casamento: [
    { title: "Comunicação que une", text: "Separem 10 minutos por dia, sem celular, só para se ouvirem de verdade." },
    { title: "Reacender a intimidade", text: "Pequenos gestos diários pesam mais do que grandes datas esporádicas no calendário." },
    { title: "Perdão no casamento", text: "Discutir é normal em qualquer casal. Quem fortalece a relação é quem escolhe reconciliar primeiro." },
    { title: "Orando como casal", text: "Orar juntos, mesmo que por 2 minutos, cria uma intimidade que a rotina sozinha não constrói." },
  ],
};

// Sem limite de quantidade: pode ter quantos itens quiser, a lista rola.
// Para a foto: no seu anúncio no Mercado Livre, clique com o botão direito na
// foto principal do produto -> "Copiar endereço da imagem" -> cole em "image".
// Deixe "" (vazio) se ainda não tiver a foto — aparece um ícone no lugar.
const AFFILIATE_PRODUCTS = [
  { name: "Bíblia Letra Gigante com Harpa", desc: "Capa luxo preta, RC (Revista e Corrigida)", url: "https://meli.la/2tT9L5y", image: "data:image/jpeg;base64,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" },
  { name: "Oi Deus, Sou Eu De Novo! (2026)", desc: "Devocional de Deive Leonardo, capa dura", url: "https://meli.la/2YdiKKs", image: "data:image/jpeg;base64,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" },
  { name: "Bíblia dos Pequeninos", desc: "Coleção Pequenos Corações, infantil", url: "https://meli.la/2sbsZBX", image: "data:image/jpeg;base64,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" },
  { name: "Bíblia NVI Leão de Judá", desc: "Nova Versão Internacional, Pão Diário, capa dura", url: "https://meli.la/32btuYK", image: "data:image/jpeg;base64,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" },
  { name: "Bíblia de Estudo da Mulher", desc: "NVA, João Ferreira de Almeida, capa dura", url: "https://meli.la/2rtDsje", image: "data:image/jpeg;base64,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" },
  { name: "Camiseta Filha do Rei", desc: "Feminina evangélica, vermelha", url: "https://meli.la/2nfseJZ", image: "data:image/jpeg;base64,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" },
  { name: "Camiseta Cruz de Jesus", desc: "Masculina evangélica", url: "https://meli.la/2TJD22Y", image: "data:image/jpeg;base64,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" },
  { name: "Kit Casal Jesus Vive", desc: "Camisetas evangélicas, preto/preto", url: "https://meli.la/2YPysBK", image: "data:image/jpeg;base64,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" },
];

const BIBLE_BOOKS = [
  { name: "Gênesis", abbrev: "gn", chapters: 50, t: "AT" }, { name: "Êxodo", abbrev: "ex", chapters: 40, t: "AT" },
  { name: "Levítico", abbrev: "lv", chapters: 27, t: "AT" }, { name: "Números", abbrev: "nm", chapters: 36, t: "AT" },
  { name: "Deuteronômio", abbrev: "dt", chapters: 34, t: "AT" }, { name: "Josué", abbrev: "js", chapters: 24, t: "AT" },
  { name: "Juízes", abbrev: "jz", chapters: 21, t: "AT" }, { name: "Rute", abbrev: "rt", chapters: 4, t: "AT" },
  { name: "1 Samuel", abbrev: "1sm", chapters: 31, t: "AT" }, { name: "2 Samuel", abbrev: "2sm", chapters: 24, t: "AT" },
  { name: "1 Reis", abbrev: "1rs", chapters: 22, t: "AT" }, { name: "2 Reis", abbrev: "2rs", chapters: 25, t: "AT" },
  { name: "1 Crônicas", abbrev: "1cr", chapters: 29, t: "AT" }, { name: "2 Crônicas", abbrev: "2cr", chapters: 36, t: "AT" },
  { name: "Esdras", abbrev: "ed", chapters: 10, t: "AT" }, { name: "Neemias", abbrev: "ne", chapters: 13, t: "AT" },
  { name: "Ester", abbrev: "et", chapters: 10, t: "AT" }, { name: "Jó", abbrev: "job", chapters: 42, t: "AT" },
  { name: "Salmos", abbrev: "sl", chapters: 150, t: "AT" }, { name: "Provérbios", abbrev: "pv", chapters: 31, t: "AT" },
  { name: "Eclesiastes", abbrev: "ec", chapters: 12, t: "AT" }, { name: "Cantares", abbrev: "ct", chapters: 8, t: "AT" },
  { name: "Isaías", abbrev: "is", chapters: 66, t: "AT" }, { name: "Jeremias", abbrev: "jr", chapters: 52, t: "AT" },
  { name: "Lamentações", abbrev: "lm", chapters: 5, t: "AT" }, { name: "Ezequiel", abbrev: "ez", chapters: 48, t: "AT" },
  { name: "Daniel", abbrev: "dn", chapters: 12, t: "AT" }, { name: "Oséias", abbrev: "os", chapters: 14, t: "AT" },
  { name: "Joel", abbrev: "jl", chapters: 3, t: "AT" }, { name: "Amós", abbrev: "am", chapters: 9, t: "AT" },
  { name: "Obadias", abbrev: "ob", chapters: 1, t: "AT" }, { name: "Jonas", abbrev: "jn", chapters: 4, t: "AT" },
  { name: "Miquéias", abbrev: "mq", chapters: 7, t: "AT" }, { name: "Naum", abbrev: "na", chapters: 3, t: "AT" },
  { name: "Habacuque", abbrev: "hc", chapters: 3, t: "AT" }, { name: "Sofonias", abbrev: "sf", chapters: 3, t: "AT" },
  { name: "Ageu", abbrev: "ag", chapters: 2, t: "AT" }, { name: "Zacarias", abbrev: "zc", chapters: 14, t: "AT" },
  { name: "Malaquias", abbrev: "ml", chapters: 4, t: "AT" },
  { name: "Mateus", abbrev: "mt", chapters: 28, t: "NT" }, { name: "Marcos", abbrev: "mc", chapters: 16, t: "NT" },
  { name: "Lucas", abbrev: "lc", chapters: 24, t: "NT" }, { name: "João", abbrev: "jo", chapters: 21, t: "NT" },
  { name: "Atos", abbrev: "at", chapters: 28, t: "NT" }, { name: "Romanos", abbrev: "rm", chapters: 16, t: "NT" },
  { name: "1 Coríntios", abbrev: "1co", chapters: 16, t: "NT" }, { name: "2 Coríntios", abbrev: "2co", chapters: 13, t: "NT" },
  { name: "Gálatas", abbrev: "gl", chapters: 6, t: "NT" }, { name: "Efésios", abbrev: "ef", chapters: 6, t: "NT" },
  { name: "Filipenses", abbrev: "fp", chapters: 4, t: "NT" }, { name: "Colossenses", abbrev: "cl", chapters: 4, t: "NT" },
  { name: "1 Tessalonicenses", abbrev: "1ts", chapters: 5, t: "NT" }, { name: "2 Tessalonicenses", abbrev: "2ts", chapters: 3, t: "NT" },
  { name: "1 Timóteo", abbrev: "1tm", chapters: 6, t: "NT" }, { name: "2 Timóteo", abbrev: "2tm", chapters: 4, t: "NT" },
  { name: "Tito", abbrev: "tt", chapters: 3, t: "NT" }, { name: "Filemom", abbrev: "fm", chapters: 1, t: "NT" },
  { name: "Hebreus", abbrev: "hb", chapters: 13, t: "NT" }, { name: "Tiago", abbrev: "tg", chapters: 5, t: "NT" },
  { name: "1 Pedro", abbrev: "1pe", chapters: 5, t: "NT" }, { name: "2 Pedro", abbrev: "2pe", chapters: 3, t: "NT" },
  { name: "1 João", abbrev: "1jo", chapters: 5, t: "NT" }, { name: "2 João", abbrev: "2jo", chapters: 1, t: "NT" },
  { name: "3 João", abbrev: "3jo", chapters: 1, t: "NT" }, { name: "Judas", abbrev: "jd", chapters: 1, t: "NT" },
  { name: "Apocalipse", abbrev: "ap", chapters: 22, t: "NT" },
];

// Offline fallback (~70 chapters with full verse text)
const BIBLE_SAMPLE = BIBLE_FALLBACK;

// 24 real, verified songs — one per day of month (repeats automatically every month)
const SONGS = [
  { title: "Ousado Amor", artist: "Isaias Saad", ytId: "wSKKEAnLTDw", category: "Adoração" },
  { title: "Bondade de Deus", artist: "Isaias Saad", ytId: "VPOCqNnBBtc", category: "Adoração" },
  { title: "Lugar Secreto", artist: "Gabriela Rocha", ytId: "V12T7cbEBMc", category: "Adoração" },
  { title: "Quão Grande É o Meu Deus", artist: "Soraya Moraes", ytId: "2nJ7-CsbmS0", category: "Louvor" },
  { title: "Deus é Deus", artist: "Delino Marçal", ytId: "OP79d1jsz20", category: "Louvor" },
  { title: "Eu Navegarei", artist: "Gabriela Rocha", ytId: "nSvxVCdj_gU", category: "Reflexivo" },
  { title: "Uma Nova História", artist: "Fernandinho", ytId: "SdkWBHLHTgg", category: "Reflexivo" },
  { title: "Era a Mão de Deus", artist: "Isaias Saad", ytId: "Z6ldpH6V1-o", category: "Louvor" },
  { title: "Ninguém Explica Deus", artist: "Preto no Branco ft. Gabriela Rocha", ytId: "LYsaKn8FRhc", category: "Louvor" },
  { title: "Deus Forte", artist: "Kleber Lucas", ytId: "Raerz_GTr4E", category: "Louvor" },
  { title: "Deus Cuida de Mim", artist: "Kleber Lucas", ytId: "B9W1zz6pDyU", category: "Reflexivo" },
  { title: "Tua Graça Me Basta", artist: "Davi Sacer ft. Preto no Branco", ytId: "F9hWwTQ4MKQ", category: "Adoração" },
  { title: "Amor do Pai", artist: "Aline Barros", ytId: "qiZJi1BtZjs", category: "Adoração" },
  { title: "O Grande Eu Sou", artist: "Bruna Karla", ytId: "jGzD-Yw0v-U", category: "Louvor" },
  { title: "Águas Purificadoras / Oceanos", artist: "Isaias Saad ft. John Dias", ytId: "XUDifaNsjtA", category: "Adoração" },
  { title: "Reina Sobre Mim", artist: "Nívea Soares", ytId: "od4trd2rOkU", category: "Adoração" },
  { title: "Ele É Exaltado", artist: "Aline Barros", ytId: "tAdSniZjaC0", category: "Louvor" },
  { title: "Nada Além do Sangue", artist: "Fernandinho", ytId: "zmN6nFLgk4E", category: "Adoração" },
  { title: "Sou Feliz", artist: "Aline Barros", ytId: "hz6CTL52KCQ", category: "Louvor" },
  { title: "Poderoso Deus (Medley)", artist: "Gabriela Rocha", ytId: "_L6a96-XOyI", category: "Louvor" },
  { title: "Fiel É Deus", artist: "Isaias Saad, Julliany Souza & Léo Brandão", ytId: "cetVsAbaP3o", category: "Adoração" },
  { title: "Grande É o Senhor", artist: "Nívea Soares", ytId: "pCWG_8xnuRA", category: "Louvor" },
  { title: "Aclame ao Senhor", artist: "Diante do Trono", ytId: "hmXtbhHiS6o", category: "Louvor" },
  { title: "Ainda Que a Figueira", artist: "Fernandinho", ytId: "hFwNSQVi0q0", category: "Reflexivo" },
];

const READING_PLAN = [
  "Um novo começo", "Confiança em meio à dúvida", "O amor que não falha", "Gratidão em todas as coisas",
  "Força na fraqueza", "Perdão que liberta", "Paz que excede o entendimento", "Fé que move montanhas",
  "Esperança viva", "Sabedoria para decidir", "Generosidade de coração", "Descanso em Deus",
  "Coragem para recomeçar", "Amor ao próximo", "Alegria verdadeira", "Humildade e serviço",
  "Perseverança na provação", "A Palavra como lâmpada", "Oração sem cessar", "Família segundo o coração de Deus",
  "Trabalho com propósito", "Domínio próprio", "Misericórdia renovada", "Comunhão e igreja",
  "Identidade em Cristo", "Vencendo o medo", "Restauração e cura", "Chamado e propósito",
  "Adoração em espírito e verdade", "Celebrando a fidelidade de Deus",
];

const NAV_ITEMS = [
  { id: "home", label: "Início", icon: Home },
  { id: "biblia", label: "Bíblia", icon: BookOpen },
  { id: "louvor", label: "Louvor", icon: Music },
  { id: "agenda", label: "Agenda", icon: Calendar },
  { id: "mural", label: "Mural", icon: MessageSquare },
  { id: "ajuda", label: "Ajuda+", icon: HelpCircle },
];

const STORE_KEY = "fediaria:state:v3";
const COMMUNITY_KEY = "fediaria:community:posts";
const FRIENDS_KEY = "fediaria:community:friends";
const TERMS_VERSION = "1.0";

const POST_CATEGORIES = [
  { id: "testemunho", label: "Testemunho" },
  { id: "oracao", label: "Pedido de Oração" },
  { id: "encorajamento", label: "Encorajamento" },
  { id: "versiculo", label: "Versículo" },
];

/* ============================== HELPERS ============================== */
function getMonthGrid(year, month) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const grid = [];
  for (let i = 0; i < firstDay; i++) grid.push(null);
  for (let d = 1; d <= daysInMonth; d++) grid.push(d);
  return grid;
}
function dateKey(d) { return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; }
function dmThreadKey(nameA, nameB) { return "fediaria:dm:" + [nameA, nameB].map((n) => (n || "").trim().toLowerCase()).sort().join("__"); }
function uid() { return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`; }

function normalizeName(s) { return (s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim(); }
function findBibleBook(name) {
  if (!name) return null;
  const target = normalizeName(name);
  return (
    BIBLE_BOOKS.find((b) => normalizeName(b.name) === target) ||
    BIBLE_BOOKS.find((b) => normalizeName(b.name).includes(target) || target.includes(normalizeName(b.name))) ||
    null
  );
}

function timeAgo(ts) {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return "agora mesmo";
  const m = Math.floor(s / 60);
  if (m < 60) return `há ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `há ${h}h`;
  const d = Math.floor(h / 24);
  return `há ${d}d`;
}

async function shareText(text, title) {
  try {
    if (typeof window !== "undefined" && window.Capacitor?.Share) {
      await window.Capacitor.Share.share({ title, text });
      return;
    }
    if (navigator.share) {
      await navigator.share({ title, text });
      return;
    }
    await navigator.clipboard.writeText(text);
    alert("Texto copiado para compartilhar.");
  } catch { /* usuário cancelou ou sem suporte */ }
}

// Uses Google Gemini (free tier, no credit card required) to suggest a Bible passage
// based on what the person wrote in their journal. Get a free key at aistudio.google.com/apikey
// and add VITE_GEMINI_API_KEY=... to .env.local.
async function askAIForPassage(journalText) {
  const key = typeof import.meta !== 'undefined' ? import.meta.env.VITE_GEMINI_API_KEY : null;
  if (!key) throw new Error("Chave da API Gemini não configurada. Adicione VITE_GEMINI_API_KEY ao .env.local");

  const prompt = `Você é um assistente devocional gentil, acolhedor e prudente dentro de um app cristão. A pessoa escreveu livremente sobre como foi o seu dia. Leia com atenção e responda SOMENTE com um JSON válido — sem markdown, sem crases, sem texto antes ou depois — exatamente neste formato:
{"reflexao":"uma frase curta e acolhedora reconhecendo o que a pessoa viveu, sem julgar e sem diagnosticar nada, no máximo 2 frases","livro":"nome de um livro da Bíblia em português","capitulo":numero_do_capitulo_como_inteiro,"versiculo":"número ou intervalo de versículo, ou null se for o capítulo inteiro","motivo":"uma frase curta explicando por que essa passagem se conecta ao que a pessoa escreveu"}

Se o texto sugerir que a pessoa está em risco ou em crise, priorize acolhimento e, no campo "reflexao", gentilmente sugira que converse com alguém de confiança ou um profissional, mantendo ainda assim o formato JSON pedido.

Texto da pessoa:
"""${journalText}"""`;

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${key}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { response_mime_type: "application/json", maxOutputTokens: 1000 },
    }),
  });
  if (!response.ok) throw new Error("Gemini API status " + response.status);
  const data = await response.json();
  const raw = (data?.candidates?.[0]?.content?.parts ?? []).map((p) => p.text ?? "").join("").replace(/```json|```/g, "").trim();
  return JSON.parse(raw);
}

// Uses Google Gemini (free tier) to moderate community posts before publishing.
async function moderateText(text) {
  const key = typeof import.meta !== 'undefined' ? import.meta.env.VITE_GEMINI_API_KEY : null;
  if (!key) throw new Error("Chave da API Gemini não configurada. Adicione VITE_GEMINI_API_KEY ao .env.local");

  const prompt = `Você é o moderador automático do mural público de um app cristão de devocional. Analise o texto abaixo e responda SOMENTE com um JSON válido, sem markdown e sem texto adicional, exatamente neste formato:
{"aprovado":true ou false,"motivo":"categoria curta em português caso reprovado (ex: discurso de ódio, assédio, conteúdo sexual, spam, golpe, dados pessoais expostos, violência), ou null se aprovado"}

Reprove apenas em casos claros de: discurso de ódio, assédio ou bullying, conteúdo sexual explícito, violência grave, spam ou propaganda comercial, golpes/phishing, ou exposição de dados pessoais de terceiros (telefone, endereço, CPF). Desabafos emocionais, tristeza, dúvidas de fé, pedidos de oração e discordância religiosa educada NÃO devem ser reprovados.

Texto: """${text}"""`;
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${key}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { response_mime_type: "application/json", maxOutputTokens: 300 },
    }),
  });
  if (!response.ok) throw new Error("moderation Gemini API status " + response.status);
  const data = await response.json();
  const raw = (data?.candidates?.[0]?.content?.parts ?? []).map((p) => p.text ?? "").join("").replace(/```json|```/g, "").trim();
  return JSON.parse(raw);
}

// Two-note synthesized chime (no audio files — generated with the Web Audio API, so nothing to license)
function playChime(soundOn, variant = "confirm") {
  if (!soundOn) return;
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const now = ctx.currentTime;
    const notes = variant === "premium" ? [523.25, 659.25, 783.99] : variant === "favorite" ? [784, 988] : [659.25, 880];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      const start = now + i * 0.09;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.13, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 1.1);
      osc.connect(gain).connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 1.2);
    });
    setTimeout(() => ctx.close(), 1500);
  } catch { /* Web Audio unavailable — stay silent, never block the interaction */ }
}

/* ============================== SMALL PIECES ============================== */
function CandleFlame({ lit }) {
  const T = useTheme();
  return (
    <div className="relative flex items-center justify-center" style={{ height: 88 }}>
      <div className={`absolute w-24 h-24 rounded-full blur-2xl ${lit ? "fd-pulse" : ""}`} style={{ backgroundColor: T.accent, opacity: lit ? 0.4 : 0.15 }} />
      <svg width="34" height="48" viewBox="0 0 34 48" className={lit ? "fd-flicker" : ""}>
        <defs>
          <radialGradient id="fdFlameGrad" cx="50%" cy="70%" r="65%">
            <stop offset="0%" stopColor="#FFF3D6" /><stop offset="45%" stopColor={T.accent} /><stop offset="100%" stopColor="#B4632A" />
          </radialGradient>
        </defs>
        <path d="M17 3 C8 16 5 25 9 34 C11 41 23 41 25 34 C29 25 26 16 17 3 Z" fill="url(#fdFlameGrad)" opacity={lit ? 1 : 0.5} />
      </svg>
    </div>
  );
}

function ProgressRing({ pct, size = 60, label }) {
  const T = useTheme();
  const stroke = 6;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (Math.min(100, Math.max(0, pct)) / 100) * circ;
  return (
    <div className="relative flex items-center justify-center shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={T.cardAlt} strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={T.success} strokeWidth={stroke} strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" style={{ transition: "stroke-dashoffset 0.6s ease" }} />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-xs font-semibold" style={{ color: T.text }}>{Math.round(pct)}%</span>
        {label && <span style={{ color: T.textMuted, fontSize: 9 }}>{label}</span>}
      </div>
    </div>
  );
}

function VerseSkeleton() {
  const T = useTheme();
  return (
    <div className="space-y-2.5 py-1">
      {[96, 88, 100, 62].map((w, i) => (
        <div key={i} className="h-3.5 rounded-full fd-pulse" style={{ width: `${w}%`, backgroundColor: T.cardAlt }} />
      ))}
    </div>
  );
}

function StatusBar({ theme, onToggleTheme }) {
  const T = useTheme();
  return (
    <div className="flex items-center justify-between px-5 pt-3 pb-1">
      <span className="text-xs font-medium" style={{ color: T.text }}>Fé Diária</span>
      <button onClick={onToggleTheme} className="transition active:scale-95" aria-label="Alternar tema">
        {theme === "dark" ? <Sun size={14} style={{ color: T.text }} /> : <Moon size={14} style={{ color: T.text }} />}
      </button>
    </div>
  );
}

function ScreenHeader({ title }) {
  const T = useTheme();
  return (<div className="px-5 pt-1 pb-2"><h1 className="fd-display text-xl" style={{ color: T.text }}>{title}</h1></div>);
}

function AdBanner() {
  const T = useTheme();
  return (
    <div className="mx-5 mt-3 rounded-xl border border-dashed flex items-center justify-center gap-2 py-3 text-xs" style={{ borderColor: T.border, color: T.textMuted }}>
      <span className="uppercase tracking-wider font-semibold" style={{ color: T.accent }}>Anúncio</span>
      <span>Espaço reservado para banner (Google AdMob)</span>
    </div>
  );
}

function AffiliateStrip() {
  const T = useTheme();
  return (
    <div className="mx-5 mt-2 mb-3">
      <p className="text-xs uppercase tracking-wider font-semibold mb-1.5" style={{ color: T.textMuted }}>Recomendados</p>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {AFFILIATE_PRODUCTS.map((p, i) => (
          <a key={i} href={p.url} target="_blank" rel="noopener noreferrer sponsored" className="shrink-0 rounded-xl overflow-hidden text-left block transition active:scale-95" style={{ backgroundColor: T.card, border: `1px solid ${T.border}`, width: 130 }}>
            <div className="relative w-full" style={{ height: 100, backgroundColor: T.cardAlt, overflow: "hidden" }}>
              {p.image ? (
                <img src={p.image} alt={p.name} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", display: "block" }} onError={(e) => { e.target.style.display = "none"; }} />
              ) : (
                <div className="w-full h-full flex items-center justify-center"><ShoppingBag size={22} style={{ color: T.textMuted }} /></div>
              )}
            </div>
            <div className="p-2">
              <p className="text-xs font-medium truncate" style={{ color: T.text }}>{p.name}</p>
              <p className="text-xs mt-0.5" style={{ color: T.accent }}>Ver produto →</p>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
function MonetizationBlock() { return (<><AdBanner /><AffiliateStrip /></>); }

function BottomNav({ active, onChange }) {
  const T = useTheme();
  return (
    <div className="flex border-t" style={{ borderColor: T.border, backgroundColor: T.card }}>
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon; const isActive = active === item.id;
        return (
          <button key={item.id} onClick={() => onChange(item.id)} className="flex-1 flex flex-col items-center gap-1 py-2.5 transition active:scale-95">
            <div className="rounded-full px-3 py-0.5" style={{ backgroundColor: isActive ? T.accent + "24" : "transparent" }}>
              <Icon size={18} strokeWidth={isActive ? 2.3 : 1.8} style={{ color: isActive ? T.accent : T.textMuted }} />
            </div>
            <span className="text-xs" style={{ color: isActive ? T.accent : T.textMuted, fontWeight: isActive ? 600 : 400 }}>{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}

function Modal({ title, onClose, children }) {
  const T = useTheme();
  return (
    <div className="absolute inset-0 z-30 flex items-end justify-center" style={{ backgroundColor: T.overlay }} onClick={onClose}>
      <div className="w-full rounded-t-3xl p-5 overflow-y-auto fd-scroll" style={{ backgroundColor: T.card, maxHeight: "85%", border: `1px solid ${T.border}` }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="fd-display text-lg" style={{ color: T.text }}>{title}</h3>
          <button onClick={onClose} className="transition active:scale-95"><X size={20} style={{ color: T.textMuted }} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function SongCard({ song, favorite, onToggleFavorite, onPlay }) {
  const T = useTheme();
  const thumb = `https://img.youtube.com/vi/${song.ytId}/hqdefault.jpg`;
  return (
    <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: T.card, border: `1px solid ${T.border}` }}>
      <button onClick={onPlay} className="relative w-full block aspect-video">
        <img src={thumb} alt={song.title} className="w-full h-full object-cover" />
        <div className="absolute inset-0 flex items-center justify-center" style={{ backgroundColor: "rgba(10,12,18,0.25)" }}>
          <div className="rounded-full flex items-center justify-center w-14 h-14 shadow-lg" style={{ backgroundColor: "rgba(255,255,255,0.94)" }}>
            <Play size={22} style={{ color: "#1B2333", marginLeft: 2 }} fill="#1B2333" />
          </div>
        </div>
      </button>
      <div className="p-3.5 flex items-center justify-between gap-2">
        <div className="min-w-0"><p className="text-sm font-medium truncate" style={{ color: T.text }}>{song.title}</p><p className="text-xs truncate" style={{ color: T.textMuted }}>{song.artist}</p></div>
        <button onClick={() => onToggleFavorite(song.ytId)} className="shrink-0 transition active:scale-95"><Heart size={20} fill={favorite ? T.accent : "none"} style={{ color: T.accent }} /></button>
      </div>
    </div>
  );
}

/* ============================== MODALS ============================== */
function PrayerModal({ prayer, prayed, onMarkPrayed, onClose }) {
  const T = useTheme();
  return (
    <Modal title={prayer.title} onClose={onClose}>
      <p className="text-sm leading-relaxed" style={{ color: T.text }}>{prayer.text}</p>
      <button onClick={onMarkPrayed} disabled={prayed} className="w-full mt-5 rounded-full py-3 text-sm font-medium flex items-center justify-center gap-2 transition active:scale-95" style={{ backgroundColor: prayed ? T.cardAlt : T.accent, color: prayed ? T.success : T.onAccent }}>
        {prayed ? (<><Check size={15} /> Você orou hoje</>) : "Marcar como orado hoje"}
      </button>
    </Modal>
  );
}

function MomentModal({ moment, onClose }) {
  const T = useTheme();
  const [duration, setDuration] = useState(60);
  const [seconds, setSeconds] = useState(60);
  const [running, setRunning] = useState(false);
  useEffect(() => {
    if (!running) return;
    if (seconds <= 0) { setRunning(false); return; }
    const id = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [running, seconds]);
  const pick = (d) => { setDuration(d); setSeconds(d); setRunning(false); };
  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");
  return (
    <Modal title={`Momento com Deus · ${moment.theme}`} onClose={onClose}>
      <p className="text-sm mb-3 leading-relaxed" style={{ color: T.text }}>{moment.intro}</p>
      <CandleFlame lit={running} />
      <p className="text-center fd-display text-2xl mt-1" style={{ color: T.text }}>{mm}:{ss}</p>
      <div className="flex justify-center gap-2 mt-3">
        {[60, 180, 300].map((d) => (<button key={d} onClick={() => pick(d)} className="text-xs px-3 py-1.5 rounded-full transition active:scale-95" style={{ backgroundColor: duration === d ? T.accent : T.cardAlt, color: duration === d ? T.onAccent : T.text }}>{d / 60} min</button>))}
      </div>
      <button onClick={() => { if (seconds === 0) { setSeconds(duration); setRunning(true); } else setRunning((r) => !r); }} className="w-full mt-4 rounded-full py-3 text-sm font-medium transition active:scale-95" style={{ backgroundColor: T.accent, color: T.onAccent }}>
        {running ? "Pausar" : seconds === 0 ? "Recomeçar" : "Começar pausa guiada"}
      </button>
      <p className="text-xs mt-4 text-center font-medium" style={{ color: T.accent }}>{moment.verseRef}</p>
    </Modal>
  );
}

function ReflectionModal({ question, text, setText, onClose }) {
  const T = useTheme();
  return (
    <Modal title="Momento de Reflexão" onClose={onClose}>
      <p className="text-sm mb-3 leading-relaxed" style={{ color: T.text }}>{question}</p>
      <textarea value={text} onChange={(e) => setText(e.target.value)} rows={5} placeholder="Escreva livremente aqui..." className="w-full rounded-xl p-3 text-sm outline-none resize-none" style={{ backgroundColor: T.cardAlt, color: T.text, border: `1px solid ${T.border}` }} />
      <p className="text-xs mt-2" style={{ color: T.textMuted }}>Suas anotações de hoje ficam salvas automaticamente neste dispositivo.</p>
    </Modal>
  );
}

function PremiumModal({ isPremium, onBuy, onRestore, onClose }) {
  const T = useTheme();
  const [busy, setBusy] = useState(false);
  const [verifyEmail, setVerifyEmail] = useState("");
  const payMode = getPayMode();
  const benefits = [
    "Sem nenhum anúncio, em nenhuma tela",
    "Acesso vitalício — pagamento único, sem assinatura",
    "Continua com tudo: Bíblia, agenda, louvor e apoio",
    "Ajuda a manter o projeto no ar",
  ];
  const payLabel = payMode === "stripe" ? "Pagar com cartão (Stripe)" : payMode === "play" ? "Comprar na Google Play" : "Desbloquear Premium · R$ 12,00";

  const handleBuy = async () => {
    setBusy(true);
    try {
      const { mode } = await buyPremiumFlow();
      if (mode !== "demo") {
        // Para Play e Stripe, a confirmação real acontece fora do app.
        alert(payMode === "stripe"
          ? "Você será levado à página de pagamento do Stripe. Ao concluir, volte ao app e confirme o mesmo e-mail usado no pagamento."
          : "A compra será concluída pela Google Play. Ao finalizar, o Premium ativa automaticamente.");
        if (payMode === "play") onBuy();
      } else {
        onBuy();
      }
    } catch (e) {
      alert("Não foi possível concluir a compra. " + (e?.message || "Tente novamente."));
    } finally { setBusy(false); }
  };

  const handleVerifyStripe = async () => {
    const email = verifyEmail.trim();
    if (!email) { alert("Digite o e-mail usado no pagamento."); return; }
    setBusy(true);
    try {
      const paid = await verifyStripePurchase(email);
      if (paid) {
        onBuy();
        alert("Pagamento confirmado! Premium ativo. 💛");
      } else {
        alert("Ainda não encontramos uma compra para esse e-mail. Confirme se digitou o mesmo e-mail usado no pagamento e tente de novo em alguns segundos.");
      }
    } finally { setBusy(false); }
  };

  return (
    <Modal title={isPremium ? "Fé Diária Premium" : "Fé Diária Premium"} onClose={onClose}>
      <div className="text-center py-1">
        <div className="w-14 h-14 rounded-2xl mx-auto mb-3 flex items-center justify-center" style={{ backgroundColor: T.accent + "22" }}>
          <Crown size={26} style={{ color: T.accent }} fill={T.accent} />
        </div>
        {isPremium ? (
          <>
            <p className="text-sm font-medium" style={{ color: T.text }}>Você já é Premium. Obrigado por apoiar este projeto! 💛</p>
            <p className="text-xs mt-1.5" style={{ color: T.textMuted }}>Todos os anúncios foram removidos, para sempre.</p>
            {payMode === "play" && (
              <button onClick={async () => { setBusy(true); try { if (await checkEntitlement()) { onBuy(); alert("Compra confirmada! Premium ativo."); } else { alert("Nenhuma compra encontrada nesta conta."); } } finally { setBusy(false); } }} disabled={busy} className="mt-4 text-xs underline" style={{ color: T.textMuted }}>
                {busy ? "Verificando..." : "Já paguei — verificar compra"}
              </button>
            )}
            {payMode === "stripe" && (
              <div className="mt-4">
                <div className="flex gap-2">
                  <input
                    value={verifyEmail}
                    onChange={(e) => setVerifyEmail(e.target.value)}
                    type="email"
                    placeholder="E-mail usado no pagamento"
                    className="flex-1 min-w-0 rounded-xl px-3 py-2.5 text-xs outline-none"
                    style={{ backgroundColor: T.cardAlt, color: T.text, border: `1px solid ${T.border}` }}
                  />
                  <button onClick={handleVerifyStripe} disabled={busy} className="shrink-0 rounded-xl px-3.5 text-xs font-semibold transition active:scale-95" style={{ backgroundColor: T.accent, color: T.onAccent, opacity: busy ? 0.6 : 1 }}>
                    {busy ? "..." : "Verificar"}
                  </button>
                </div>
              </div>
            )}
            {payMode !== "play" && payMode !== "stripe" && (
              <button onClick={onRestore} className="mt-4 text-xs underline" style={{ color: T.textMuted }}>Restaurar anúncios (modo demonstração)</button>
            )}
          </>
        ) : (
          <>
            <p className="text-sm mb-4 leading-relaxed" style={{ color: T.text }}>Uma experiência mais tranquila, sem interrupções, com um único pagamento — não é assinatura.</p>
            <div className="text-left space-y-2 mb-5">
              {benefits.map((b, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <div className="w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{ backgroundColor: T.success }}>
                    <Check size={10} style={{ color: T.onAccent }} />
                  </div>
                  <span className="text-xs leading-relaxed" style={{ color: T.text }}>{b}</span>
                </div>
              ))}
            </div>
            <button onClick={handleBuy} disabled={busy} className="w-full rounded-full py-3 font-semibold text-sm transition active:scale-95 flex items-center justify-center gap-2" style={{ backgroundColor: T.accent, color: T.onAccent, opacity: busy ? 0.6 : 1 }}>
              <Crown size={15} fill={T.onAccent} /> {busy ? "Aguarde..." : payLabel}
            </button>
            <p className="text-xs mt-3 leading-relaxed" style={{ color: T.textMuted }}>
              {payMode === "play"
                ? "Pagamento pela Google Play (R$ 12,00). A compra ativa automaticamente assim que confirmada."
                : payMode === "stripe"
                  ? "Pagamento por cartão via Stripe (R$ 12,00). O link abre no navegador — sem precisar da Play Store."
                  : "Sistema de pagamento ainda não configurado. Configure VITE_REVENUECAT_API_KEY (Google Play) ou VITE_STRIPE_PAYMENT_LINK para cobrança real. Por enquanto, a compra é apenas simulada para testes."}
            </p>
            {payMode === "stripe" && (
              <div className="mt-5 pt-4 border-t" style={{ borderColor: T.border }}>
                <p className="text-xs font-medium mb-2" style={{ color: T.text }}>Já pagou? Ative o Premium:</p>
                <div className="flex gap-2">
                  <input
                    value={verifyEmail}
                    onChange={(e) => setVerifyEmail(e.target.value)}
                    type="email"
                    placeholder="E-mail usado no pagamento"
                    className="flex-1 min-w-0 rounded-xl px-3 py-2.5 text-xs outline-none"
                    style={{ backgroundColor: T.cardAlt, color: T.text, border: `1px solid ${T.border}` }}
                  />
                  <button onClick={handleVerifyStripe} disabled={busy} className="shrink-0 rounded-xl px-3.5 text-xs font-semibold transition active:scale-95" style={{ backgroundColor: T.accent, color: T.onAccent, opacity: busy ? 0.6 : 1 }}>
                    {busy ? "..." : "Ativar"}
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </Modal>
  );
}


function NowPlayingModal({ song, favorite, onToggleFavorite, onClose }) {
  const T = useTheme();
  return (
    <Modal title="Tocando agora" onClose={onClose}>
      <div className="rounded-2xl overflow-hidden mb-3" style={{ backgroundColor: "#000" }}>
        <div className="aspect-video">
          <iframe className="w-full h-full" src={`https://www.youtube.com/embed/${song.ytId}?autoplay=1`} title={song.title} allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
        </div>
      </div>
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0"><p className="text-sm font-medium truncate" style={{ color: T.text }}>{song.title}</p><p className="text-xs truncate" style={{ color: T.textMuted }}>{song.artist}</p></div>
        <button onClick={() => onToggleFavorite(song.ytId)} className="shrink-0"><Heart size={20} fill={favorite ? T.accent : "none"} style={{ color: T.accent }} /></button>
      </div>
      <a href={`https://www.youtube.com/watch?v=${song.ytId}`} target="_blank" rel="noopener noreferrer" className="mt-3 flex items-center justify-center gap-1.5 text-xs py-2.5 rounded-full" style={{ backgroundColor: T.cardAlt, color: T.accent }}>
        Não está tocando? Abrir no YouTube <ArrowRight size={12} />
      </a>
    </Modal>
  );
}

function ProfileModal({ user, onSignIn, onSignOut, onClose }) {
  const T = useTheme();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const supabaseReady = import.meta.env.VITE_SUPABASE_URL && !import.meta.env.VITE_SUPABASE_URL.includes("SEU-PROJETO");

  const signInWithGoogle = async () => {
    setLoading(true);
    try {
      const isNative = typeof window !== "undefined" && window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform();
      const redirectTo = isNative ? "com.fediaria.app://" : window.location.origin;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo },
      });
      if (error) alert("Erro ao iniciar login: " + error.message);
    } catch { alert("Falha ao conectar com Google. Verifique se o Supabase está configurado."); } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title={user ? "Seu perfil" : "Entrar"} onClose={onClose}>
      {user ? (
        <div className="text-center py-2">
          {user.picture ? (
            <img src={user.picture} alt="" className="w-16 h-16 rounded-full mx-auto mb-3 object-cover" />
          ) : (
            <div className="w-16 h-16 rounded-full mx-auto mb-3 flex items-center justify-center text-xl font-semibold" style={{ backgroundColor: T.cardAlt, color: T.accent }}>{user.name.charAt(0).toUpperCase()}</div>
          )}
          <p className="text-sm font-medium" style={{ color: T.text }}>{user.name}</p>
          {user.email && <p className="text-xs" style={{ color: T.textMuted }}>{user.email}</p>}
          <p className="text-xs mt-1" style={{ color: T.textMuted }}>{user.sub ? "Conectado com Google" : "Conectado como convidado"}</p>
          <button onClick={onSignOut} className="mt-4 text-xs px-4 py-2 rounded-full" style={{ backgroundColor: T.cardAlt, color: T.textMuted }}>Sair</button>
        </div>
      ) : (
        <div>
          {supabaseReady ? (
            <button onClick={signInWithGoogle} disabled={loading} className="w-full flex items-center justify-center gap-2.5 rounded-full py-3 text-sm font-medium mb-3 transition active:scale-95 disabled:opacity-50" style={{ backgroundColor: "#fff", border: "1px solid #dadce0", color: "#3c4043" }}>
              <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold" style={{ backgroundColor: "#fff", color: "#4285F4" }}>G</span>
              {loading ? "Aguardando Google..." : "Continuar com Google"}
            </button>
          ) : (
            <p className="text-xs mb-2 leading-relaxed" style={{ color: T.textMuted }}>
              Configure <code style={{ backgroundColor: T.cardAlt, padding: "1px 5px", borderRadius: 4 }}>VITE_SUPABASE_URL</code> no <code style={{ backgroundColor: T.cardAlt, padding: "1px 5px", borderRadius: 4 }}>.env.local</code> para ativar o login com Google.
            </p>
          )}
          <div className="flex items-center gap-2 mb-1"><div className="flex-1 h-px" style={{ backgroundColor: T.border }} /><span className="text-xs" style={{ color: T.textMuted }}>ou</span><div className="flex-1 h-px" style={{ backgroundColor: T.border }} /></div>
          <p className="text-xs mb-2" style={{ color: T.textMuted }}>digite um nome para entrar como convidado:</p>
          <div className="flex gap-2">
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Seu nome" className="flex-1 rounded-xl px-3 py-2.5 text-sm outline-none" style={{ backgroundColor: T.cardAlt, color: T.text, border: `1px solid ${T.border}` }} />
            <button onClick={() => onSignIn(name.trim() || "Convidado")} className="rounded-xl px-4 text-sm font-medium" style={{ backgroundColor: T.accent, color: T.onAccent }}>Entrar</button>
          </div>
        </div>
      )}
    </Modal>
  );
}

function NotificationRow() {
  const T = useTheme();
  const isNative = typeof window !== "undefined" && window.Capacitor?.Plugins?.LocalNotifications;
  const supported = isNative || (typeof window !== "undefined" && "Notification" in window);
  const [status, setStatus] = useState(supported ? "unknown" : "unsupported");
  const [hour, setHour] = useState(7);
  const [minute, setMinute] = useState(0);

  useEffect(() => {
    if (!supported) return;
    (async () => {
      try {
        if (isNative) {
          const perms = await window.Capacitor.Plugins.LocalNotifications.checkPermissions();
          setStatus(perms.display === "granted" ? "granted" : "denied");
          const sched = await window.Capacitor.Plugins.LocalNotifications.getPending();
          if (sched.notifications && sched.notifications.length > 0) setStatus("granted");
        } else {
          setStatus(Notification.permission === "granted" ? "granted" : "denied");
        }
      } catch { setStatus("denied"); }
    })();
  }, [isNative, supported]);

  const enable = async () => {
    if (!supported) return;
    try {
      if (isNative) {
        const perms = await window.Capacitor.Plugins.LocalNotifications.requestPermissions();
        if (perms.display !== "granted") { setStatus("denied"); return; }
        await window.Capacitor.Plugins.LocalNotifications.schedule({
          notifications: [{
            id: 1,
            title: "Fé Diária",
            body: "Hora do seu momento com Deus. 🕊️",
            schedule: { on: { hour, minute } },
            extra: { screen: "home" },
          }],
        });
        setStatus("granted");
      } else {
        const perm = await Notification.requestPermission();
        setStatus(perm);
        if (perm === "granted") new Notification("Fé Diária", { body: "Lembretes diários ativados nesta aba ✝️" });
      }
    } catch { setStatus("denied"); }
  };

  const disable = async () => {
    try {
      if (isNative) {
        await window.Capacitor.Plugins.LocalNotifications.cancel({ notifications: [{ id: 1 }] });
      }
      setStatus("denied");
    } catch { setStatus("denied"); }
  };

  return (
    <div className="rounded-2xl p-3.5" style={{ backgroundColor: T.card, border: `1px solid ${T.border}` }}>
      <div className="flex items-center gap-3">
        <Bell size={18} style={{ color: T.accent }} />
        <div className="flex-1">
          <p className="text-sm font-medium" style={{ color: T.text }}>Lembrete diário</p>
          <p className="text-xs" style={{ color: T.textMuted }}>
            {!supported ? "Não suportado neste dispositivo" : status === "granted" ? `Ativado todos os dias às ${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}` : isNative ? "Um aviso diário para seu momento com Deus" : "Um aviso para não esquecer seu momento com Deus"}
          </p>
        </div>
        {supported && status === "granted" ? (
          <button onClick={disable} className="text-xs px-3 py-1.5 rounded-full shrink-0 transition active:scale-95" style={{ backgroundColor: T.cardAlt, color: T.textMuted }}>Desativar</button>
        ) : supported ? (
          <button onClick={enable} className="text-xs px-3 py-1.5 rounded-full shrink-0 transition active:scale-95" style={{ backgroundColor: T.accent, color: T.onAccent }}>Ativar</button>
        ) : null}
      </div>
      {supported && status !== "granted" && (
        <div className="flex items-center gap-2 mt-3">
          <input type="time" value={`${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`} onChange={(e) => { const [h, m] = e.target.value.split(":").map(Number); setHour(h); setMinute(m || 0); }} className="rounded-lg px-2 py-1.5 text-xs outline-none" style={{ backgroundColor: T.cardAlt, color: T.text, border: `1px solid ${T.border}` }} />
          <span className="text-xs" style={{ color: T.textMuted }}>horário do lembrete diário</span>
        </div>
      )}
      <p className="text-xs mt-2.5 leading-relaxed" style={{ color: T.textMuted }}>
        {isNative ? "No app instalado, o lembrete chega na tela do celular todos os dias no horário escolhido." : "Dentro do navegador, o lembrete aparece enquanto a aba estiver aberta. No app instalado, chega de verdade na tela do celular todos os dias."}
      </p>
    </div>
  );
}

/* ============================== SCREENS ============================== */
function HomeScreen({ verse, onOpen, doneCount, isPremium, songOfDay, onGoLouvor, lastRead, onContinueReading, user, onOpenProfile }) {
  const T = useTheme();
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";
  const now = new Date();
  const dateLabel = `${WEEKDAYS_PT[now.getDay()]}, ${now.getDate()} de ${MONTHS_PT[now.getMonth()]}`;
  const cards = [
    { id: "oracao", label: "Oração do dia", desc: "Comece com uma palavra ao Pai", icon: MessageCircle },
    { id: "momento", label: "Momento com Deus", desc: "Uma pausa guiada de silêncio", icon: Flame },
    { id: "reflexao", label: "Reflexão do dia", desc: "Uma pergunta para o coração", icon: Quote },
    { id: "louvor", label: "Louvor do dia", desc: `${songOfDay.title} · ${songOfDay.artist}`, icon: Music },
  ];
  return (
    <div className="px-5 py-3 space-y-4">
      <div className="flex items-center gap-2.5">
        <button onClick={onOpenProfile} className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 overflow-hidden" style={{ backgroundColor: T.card, border: `1px solid ${T.border}` }}>
          {user ? (user.picture ? <img src={user.picture} alt="" className="w-full h-full object-cover" /> : <span className="text-sm font-semibold" style={{ color: T.accent }}>{user.name.charAt(0).toUpperCase()}</span>) : <User size={16} style={{ color: T.accent }} />}
        </button>
        <div className="min-w-0">
          <p className="fd-display text-lg leading-tight truncate" style={{ color: T.text }}>{greeting}{user ? `, ${user.name.split(" ")[0]}` : ""}</p>
          <p className="text-xs capitalize" style={{ color: T.textMuted }}>{dateLabel}</p>
        </div>
        <div className="ml-auto flex items-center gap-1.5 rounded-full px-3 py-1.5 shrink-0" style={{ backgroundColor: T.card, border: `1px solid ${T.border}` }}>
          <Flame size={13} style={{ color: T.accent }} /><span className="text-xs font-semibold" style={{ color: T.text }}>{doneCount}</span>
        </div>
      </div>

      {lastRead && (
        <button onClick={onContinueReading} className="w-full rounded-xl px-3.5 py-2.5 flex items-center gap-2.5 transition active:scale-95" style={{ backgroundColor: T.card, border: `1px solid ${T.border}` }}>
          <Bookmark size={14} fill={T.accent} style={{ color: T.accent }} />
          <span className="text-xs flex-1 text-left" style={{ color: T.text }}>Continuar leitura: <b>{lastRead.bookName} {lastRead.chapter}</b></span>
          <ArrowRight size={13} style={{ color: T.accent }} />
        </button>
      )}

      <div className="rounded-2xl p-4" style={{ backgroundColor: T.card, border: `1px solid ${T.border}` }}>
        <div className="flex items-start justify-between gap-2">
          <Quote size={16} style={{ color: T.accent, opacity: 0.7 }} />
          <button onClick={() => shareText(`“${verse.text}”\n— ${verse.ref}`, "Versículo do dia — Fé Diária")} className="shrink-0 transition active:scale-95" title="Compartilhar"><Share2 size={15} style={{ color: T.textMuted }} /></button>
        </div>
        <p className="fd-display text-sm mt-2 leading-relaxed" style={{ color: T.text }}>“{verse.text}”</p>
        <p className="text-xs mt-2 font-medium" style={{ color: T.accent }}>{verse.ref}</p>
      </div>

      <div>
        <p className="text-xs uppercase tracking-wider mb-2.5" style={{ color: T.textMuted }}>Seu momento de hoje</p>
        <div className="grid grid-cols-2 gap-2.5">
          {cards.map((c) => {
            const Icon = c.icon;
            return (
              <button key={c.id} onClick={() => (c.id === "louvor" ? onGoLouvor() : onOpen(c.id))} className="rounded-2xl p-3.5 text-left flex flex-col gap-2.5 transition active:scale-95" style={{ backgroundColor: T.card, border: `1px solid ${T.border}` }}>
                <Icon size={18} style={{ color: T.accent }} />
                <div><p className="text-sm font-medium" style={{ color: T.text }}>{c.label}</p><p className="text-xs mt-0.5 truncate" style={{ color: T.textMuted }}>{c.desc}</p></div>
              </button>
            );
          })}
        </div>
      </div>
      {!isPremium && <MonetizationBlock />}
    </div>
  );
}

function BibleScreen({ book, setBook, chapter, setChapter, cache, setCache, version, setVersion, favoriteVerses, toggleFavoriteVerse, lastRead, onMarkLastRead, isPremium }) {
  const T = useTheme();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("idle");
  const [retryTick, setRetryTick] = useState(0);
  const [showFavorites, setShowFavorites] = useState(false);

  const filtered = BIBLE_BOOKS.filter((b) => b.name.toLowerCase().includes(query.toLowerCase()));
  const at = filtered.filter((b) => b.t === "AT");
  const nt = filtered.filter((b) => b.t === "NT");
  const cacheKey = `${version}-${book.abbrev}-${chapter}`;
  const verses = cache[cacheKey];
  const fallback = BIBLE_SAMPLE[`${book.name}-${chapter}`];
  const isLastReadHere = lastRead && lastRead.bookName === book.name && lastRead.chapter === chapter;

  useEffect(() => {
    if (cache[cacheKey]) return;
    let cancelled = false;
    const offline = BIBLE_SAMPLE[`${book.name}-${chapter}`];
    // Mostra o texto offline (Bíblia embutida) imediatamente, sem depender da internet.
    if (offline) {
      setCache((prev) => ({ ...prev, [cacheKey]: offline }));
      setStatus("idle");
    } else {
      setStatus("loading");
    }
    (async () => {
      if (cancelled) return;
      try {
        const stored = await window.storage.get(`fediaria:bible:${cacheKey}`, false);
        if (stored && stored.value) {
          if (!cancelled) { setCache((prev) => ({ ...prev, [cacheKey]: JSON.parse(stored.value) })); setStatus("idle"); }
          return;
        }
      } catch { /* not cached yet — will fetch live below */ }
      try {
        const r = await fetch(`https://www.abibliadigital.com.br/api/verses/${version}/${book.abbrev}/${chapter}`);
        if (!r.ok) throw new Error(String(r.status));
        const data = await r.json();
        const vs = (data.verses || []).map((v) => ({ v: v.number, t: v.text }));
        if (!cancelled) { setCache((prev) => ({ ...prev, [cacheKey]: vs })); setStatus("idle"); }
        window.storage.set(`fediaria:bible:${cacheKey}`, JSON.stringify(vs), false).catch(() => {});
      } catch {
        if (!cancelled && !offline) setStatus("error");
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cacheKey, retryTick]);

  return (
    <div className="px-5 py-3 space-y-4">
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 rounded-xl px-3 py-2.5 flex-1" style={{ backgroundColor: T.card, border: `1px solid ${T.border}` }}>
          <Search size={14} style={{ color: T.textMuted }} />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar livro..." className="bg-transparent text-sm flex-1 outline-none" style={{ color: T.text }} />
        </div>
        <button onClick={() => setShowFavorites((s) => !s)} className="rounded-xl px-3 py-2.5 flex items-center gap-1 shrink-0 transition active:scale-95" style={{ backgroundColor: showFavorites ? T.accent : T.card, border: `1px solid ${showFavorites ? T.accent : T.border}` }}>
          <Star size={14} fill={showFavorites ? T.onAccent : "none"} style={{ color: showFavorites ? T.onAccent : T.accent }} />
          <span className="text-xs font-medium" style={{ color: showFavorites ? T.onAccent : T.text }}>{favoriteVerses.length}</span>
        </button>
      </div>

      {lastRead && !showFavorites && !isLastReadHere && (
        <button onClick={() => { setBook(BIBLE_BOOKS.find((b) => b.name === lastRead.bookName)); setChapter(lastRead.chapter); }} className="w-full rounded-xl px-3.5 py-2.5 flex items-center gap-2.5 transition active:scale-95" style={{ backgroundColor: T.cardAlt }}>
          <Bookmark size={14} fill={T.accent} style={{ color: T.accent }} />
          <span className="text-xs flex-1 text-left" style={{ color: T.text }}>Continuar de: <b>{lastRead.bookName} {lastRead.chapter}</b></span>
          <ArrowRight size={13} style={{ color: T.accent }} />
        </button>
      )}

      {showFavorites ? (
        <div className="space-y-2">
          {favoriteVerses.length === 0 ? (
            <p className="text-xs py-4 text-center leading-relaxed" style={{ color: T.textMuted }}>Você ainda não marcou nenhum versículo. Toque na estrela ao lado de um versículo para salvá-lo aqui.</p>
          ) : favoriteVerses.map((f, i) => (
            <div key={i} className="rounded-xl p-3" style={{ backgroundColor: T.card, border: `1px solid ${T.border}` }}>
              <p className="text-sm leading-relaxed" style={{ color: T.text }}>{f.text}</p>
              <div className="flex items-center justify-between mt-1.5">
                <p className="text-xs font-medium" style={{ color: T.accent }}>{f.book} {f.chapter}:{f.verse}</p>
                <button onClick={() => toggleFavoriteVerse(f.book, f.chapter, f.verse, f.text)}><Star size={14} fill={T.accent} style={{ color: T.accent }} /></button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <>
          <div>
            <p className="text-xs uppercase tracking-wider mb-1.5" style={{ color: T.textMuted }}>Antigo Testamento</p>
            <div className="flex flex-wrap gap-1.5">
              {at.map((b) => (<button key={b.name} onClick={() => { setBook(b); setChapter(1); }} className="text-xs px-2.5 py-1.5 rounded-full transition active:scale-95" style={{ backgroundColor: book.name === b.name ? T.accent : T.card, color: book.name === b.name ? T.onAccent : T.text, border: `1px solid ${book.name === b.name ? T.accent : T.border}` }}>{b.name}</button>))}
            </div>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider mb-1.5" style={{ color: T.textMuted }}>Novo Testamento</p>
            <div className="flex flex-wrap gap-1.5">
              {nt.map((b) => (<button key={b.name} onClick={() => { setBook(b); setChapter(1); }} className="text-xs px-2.5 py-1.5 rounded-full transition active:scale-95" style={{ backgroundColor: book.name === b.name ? T.accent : T.card, color: book.name === b.name ? T.onAccent : T.text, border: `1px solid ${book.name === b.name ? T.accent : T.border}` }}>{b.name}</button>))}
            </div>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider mb-1.5" style={{ color: T.textMuted }}>{book.name} · Capítulo</p>
            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
              {Array.from({ length: book.chapters }, (_, i) => i + 1).map((c) => (<button key={c} onClick={() => setChapter(c)} className="w-8 h-8 rounded-lg text-xs flex items-center justify-center transition active:scale-95" style={{ backgroundColor: chapter === c ? T.accent : T.cardAlt, color: chapter === c ? T.onAccent : T.text }}>{c}</button>))}
            </div>
          </div>

          <div className="rounded-2xl p-4" style={{ backgroundColor: T.card, border: `1px solid ${T.border}` }}>
            <div className="flex items-center justify-between mb-2">
              <p className="fd-display text-base" style={{ color: T.text }}>{book.name} {chapter}</p>
              <div className="flex gap-1">
                {["nvi", "acf"].map((v) => (<button key={v} onClick={() => setVersion(v)} className="text-xs px-2 py-1 rounded-full uppercase font-medium" style={{ backgroundColor: version === v ? T.accent : T.cardAlt, color: version === v ? T.onAccent : T.textMuted }}>{v}</button>))}
              </div>
            </div>

            <button onClick={() => onMarkLastRead(book.name, chapter)} className="flex items-center gap-1.5 text-xs mb-3 px-2.5 py-1.5 rounded-full transition active:scale-95" style={{ backgroundColor: isLastReadHere ? T.accent : T.cardAlt, color: isLastReadHere ? T.onAccent : T.accent }}>
              <Bookmark size={12} fill={isLastReadHere ? T.onAccent : "none"} /> {isLastReadHere ? "Marcado como ponto de parada" : "Marcar como ponto de parada"}
            </button>

            {(!verses && (status === "idle" || status === "loading")) && <VerseSkeleton />}

            {verses ? (
              <div className="space-y-2">
                {verses.map((v) => {
                  const isFav = favoriteVerses.some((f) => f.book === book.name && f.chapter === chapter && f.verse === v.v);
                  return (
                    <div key={v.v} className="flex items-start gap-2">
                      <p className="text-sm leading-relaxed flex-1" style={{ color: T.text }}><span className="text-xs mr-1.5 font-semibold" style={{ color: T.accent }}>{v.v}</span>{v.t}</p>
                      <button onClick={() => shareText(`“${v.t}”\n— ${book.name} ${chapter}:${v.v}`, "Versículo — Fé Diária")} className="shrink-0 mt-0.5" title="Compartilhar"><Share2 size={13} style={{ color: T.textMuted }} /></button>
                      <button onClick={() => toggleFavoriteVerse(book.name, chapter, v.v, v.t)} className="shrink-0 mt-0.5"><Star size={13} fill={isFav ? T.accent : "none"} style={{ color: T.accent }} /></button>
                    </div>
                  );
                })}
                <p className="text-xs pt-1" style={{ color: T.textMuted }}>Texto de Almeida Atualizada embutido no app — disponível mesmo sem internet.</p>
              </div>
            ) : status === "error" ? (
              <div>
                {fallback ? (
                  <div className="space-y-2">
                    {fallback.map((v) => (<p key={v.v} className="text-sm leading-relaxed" style={{ color: T.text }}><span className="text-xs mr-1.5 font-semibold" style={{ color: T.accent }}>{v.v}</span>{v.t}</p>))}
                    <p className="text-xs pt-1" style={{ color: T.textMuted }}>API offline — mostrando texto salvo no app.</p>
                  </div>
                ) : (
                  <div className="text-center py-3">
                    <p className="text-xs mb-2 leading-relaxed" style={{ color: T.textMuted }}>Este capítulo ainda não está disponível offline. Conecte-se à internet para carregá-lo.</p>
                    <button onClick={() => setRetryTick((t) => t + 1)} className="text-xs px-3 py-1.5 rounded-full inline-flex items-center gap-1.5" style={{ backgroundColor: T.cardAlt, color: T.accent }}><RotateCcw size={12} /> Tentar novamente</button>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </>
      )}
      {!isPremium && <MonetizationBlock />}
    </div>
  );
}

function MusicScreen({ favorites, toggleFavorite, songOfDay, isPremium }) {
  const T = useTheme();
  const [category, setCategory] = useState("Todos");
  const [nowPlaying, setNowPlaying] = useState(null);
  const categories = ["Todos", "Adoração", "Louvor", "Reflexivo"];
  const list = category === "Todos" ? SONGS : SONGS.filter((s) => s.category === category);
  return (
    <div className="px-5 py-3 space-y-4">
      <div>
        <p className="text-xs uppercase tracking-wider font-semibold mb-2" style={{ color: T.accent }}>Louvor do dia</p>
        <SongCard song={songOfDay} favorite={favorites.has(songOfDay.ytId)} onToggleFavorite={toggleFavorite} onPlay={() => setNowPlaying(songOfDay)} />
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {categories.map((c) => (<button key={c} onClick={() => setCategory(c)} className="text-xs px-3 py-1.5 rounded-full shrink-0 transition active:scale-95" style={{ backgroundColor: category === c ? T.accent : T.card, color: category === c ? T.onAccent : T.text, border: `1px solid ${category === c ? T.accent : T.border}` }}>{c}</button>))}
      </div>
      <div className="space-y-1.5">
        {list.map((s) => (
          <button key={s.ytId} onClick={() => setNowPlaying(s)} className="w-full flex items-center gap-3 rounded-xl px-2.5 py-2.5 transition active:scale-95" style={{ backgroundColor: songOfDay.ytId === s.ytId ? T.cardAlt : T.card, border: `1px solid ${T.border}` }}>
            <img src={`https://img.youtube.com/vi/${s.ytId}/default.jpg`} alt="" className="w-11 h-11 rounded-lg object-cover shrink-0" />
            <div className="flex-1 text-left min-w-0"><p className="text-sm truncate" style={{ color: T.text }}>{s.title}</p><p className="text-xs truncate" style={{ color: T.textMuted }}>{s.artist}</p></div>
            <Heart size={16} fill={favorites.has(s.ytId) ? T.accent : "none"} style={{ color: T.accent }} onClick={(e) => { e.stopPropagation(); toggleFavorite(s.ytId); }} />
          </button>
        ))}
      </div>
      <p className="text-xs text-center pt-1" style={{ color: T.textMuted }}>Toque em uma música para tocar direto aqui no app.</p>
      {!isPremium && <MonetizationBlock />}
      {nowPlaying && <NowPlayingModal song={nowPlaying} favorite={favorites.has(nowPlaying.ytId)} onToggleFavorite={toggleFavorite} onClose={() => setNowPlaying(null)} />}
    </div>
  );
}

function AgendaScreen({ completedDays, toggleDay, tasks, addTask, toggleTask, removeTask, journalText, setJournalText, journalSuggestion, setJournalSuggestion, onGoToPassage, isPremium }) {
  const T = useTheme();
  const [monthOffset, setMonthOffset] = useState(0);
  const [taskInput, setTaskInput] = useState("");
  const [aiStatus, setAiStatus] = useState("idle"); // idle | loading | error
  const base = new Date();
  const viewDate = new Date(base.getFullYear(), base.getMonth() + monthOffset, 1);
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const grid = getMonthGrid(year, month);
  const monthLabel = `${MONTHS_PT[month]} de ${year}`;
  const todayNum = monthOffset === 0 ? base.getDate() : -1;
  const doneCount = completedDays.size;
  const totalDaysInMonth = grid.filter((d) => d).length;
  const progressPct = totalDaysInMonth ? Math.min(100, (doneCount / totalDaysInMonth) * 100) : 0;
  const submitTask = () => { const t = taskInput.trim(); if (!t) return; addTask(t); setTaskInput(""); };

  const askAI = async () => {
    if (!journalText.trim() || aiStatus === "loading") return;
    setAiStatus("loading");
    try {
      const suggestion = await askAIForPassage(journalText.trim());
      setJournalSuggestion(suggestion);
      setAiStatus("idle");
    } catch { setAiStatus("error"); }
  };

  const matchedBook = journalSuggestion ? findBibleBook(journalSuggestion.livro) : null;

  return (
    <div className="px-5 py-3 space-y-5">
      <div className="flex items-center justify-between">
        <button onClick={() => setMonthOffset((m) => m - 1)} className="transition active:scale-95"><ChevronLeft size={18} style={{ color: T.textMuted }} /></button>
        <span className="fd-display text-base capitalize" style={{ color: T.text }}>{monthLabel}</span>
        <button onClick={() => setMonthOffset((m) => m + 1)} className="transition active:scale-95"><ChevronRight size={18} style={{ color: T.textMuted }} /></button>
      </div>

      <div>
        <div className="grid grid-cols-7 gap-1.5 text-center mb-1.5">{["D", "S", "T", "Q", "Q", "S", "S"].map((d, i) => (<span key={i} className="text-xs" style={{ color: T.textMuted }}>{d}</span>))}</div>
        <div className="grid grid-cols-7 gap-1.5">
          {grid.map((d, i) => d ? (
            <button key={i} onClick={() => toggleDay(d)} className="aspect-square rounded-full flex items-center justify-center text-xs transition active:scale-95" style={{ backgroundColor: completedDays.has(d) ? T.accent : T.card, color: completedDays.has(d) ? T.onAccent : T.text, border: `1px solid ${completedDays.has(d) ? T.accent : T.border}`, boxShadow: d === todayNum ? `0 0 0 2px ${T.accent}` : "none" }}>{d}</button>
          ) : (<div key={i} />))}
        </div>
      </div>

      <div className="rounded-2xl p-3.5 flex items-center gap-4" style={{ backgroundColor: T.card, border: `1px solid ${T.border}` }}>
        <ProgressRing pct={progressPct} label="do mês" />
        <div className="flex-1">
          <p className="text-sm font-medium" style={{ color: T.text }}>Progresso do mês</p>
          <p className="text-xs mb-1.5" style={{ color: T.textMuted }}>{doneCount} de {totalDaysInMonth} dias concluídos</p>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: T.cardAlt }}><div className="h-full rounded-full transition-all" style={{ width: `${progressPct}%`, backgroundColor: T.success }} /></div>
        </div>
      </div>

      <div>
        <h3 className="fd-display text-sm mb-2.5" style={{ color: T.text }}>Minhas tarefas</h3>
        <div className="flex gap-2 mb-2.5">
          <input value={taskInput} onChange={(e) => setTaskInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") submitTask(); }} placeholder="Nova tarefa..." className="flex-1 rounded-xl px-3 py-2.5 text-sm outline-none" style={{ backgroundColor: T.card, color: T.text, border: `1px solid ${T.border}` }} />
          <button onClick={submitTask} className="rounded-xl px-4 flex items-center justify-center transition active:scale-95" style={{ backgroundColor: T.accent }}><Plus size={16} style={{ color: T.onAccent }} /></button>
        </div>
        <div className="space-y-1.5">
          {tasks.length === 0 && <p className="text-xs" style={{ color: T.textMuted }}>Nenhuma tarefa ainda. Adicione a primeira acima.</p>}
          {tasks.map((task) => (
            <div key={task.id} className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5" style={{ backgroundColor: T.card, border: `1px solid ${T.border}` }}>
              <button onClick={() => toggleTask(task.id)} className="w-5 h-5 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: task.done ? T.success : "transparent", border: task.done ? "none" : `1.5px solid ${T.border}` }}>{task.done && <Check size={12} style={{ color: T.onAccent }} />}</button>
              <span className="text-sm flex-1" style={{ color: task.done ? T.textMuted : T.text, textDecoration: task.done ? "line-through" : "none" }}>{task.text}</span>
              <button onClick={() => removeTask(task.id)}><X size={14} style={{ color: T.textMuted }} /></button>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="fd-display text-sm mb-1" style={{ color: T.text }}>Diário do dia</h3>
        <p className="text-xs mb-2.5" style={{ color: T.textMuted }}>Como foi o seu dia? Escreva livremente.</p>
        <textarea value={journalText} onChange={(e) => setJournalText(e.target.value)} rows={5} placeholder="Hoje eu..." className="w-full rounded-2xl p-3.5 text-sm outline-none resize-none" style={{ backgroundColor: T.card, color: T.text, border: `1px solid ${T.border}` }} />
        <button onClick={askAI} disabled={!journalText.trim() || aiStatus === "loading"} className="w-full mt-2.5 rounded-full py-2.5 text-sm font-medium flex items-center justify-center gap-2 transition active:scale-95" style={{ backgroundColor: T.accent, color: T.onAccent, opacity: !journalText.trim() || aiStatus === "loading" ? 0.5 : 1 }}>
          <Sparkles size={15} /> {aiStatus === "loading" ? "Lendo com carinho..." : "Pedir sugestão da IA"}
        </button>

        {aiStatus === "loading" && (
          <div className="mt-2.5 rounded-2xl p-3.5" style={{ backgroundColor: T.cardAlt }}><VerseSkeleton /></div>
        )}
        {aiStatus === "error" && (
          <p className="text-xs mt-2.5 text-center" style={{ color: T.textMuted }}>Não consegui pensar em uma sugestão agora. Tente de novo em instantes.</p>
        )}
        {journalSuggestion && aiStatus !== "loading" && (
          <div className="mt-2.5 rounded-2xl p-3.5" style={{ backgroundColor: T.cardAlt }}>
            <div className="flex items-center gap-1.5 mb-1.5"><Sparkles size={13} style={{ color: T.accent }} /><p className="text-xs uppercase tracking-wider font-semibold" style={{ color: T.accent }}>Sugestão da IA</p></div>
            <p className="text-sm leading-relaxed mb-2" style={{ color: T.text }}>{journalSuggestion.reflexao}</p>
            <p className="text-sm font-medium" style={{ color: T.text }}>{journalSuggestion.livro} {journalSuggestion.capitulo}{journalSuggestion.versiculo ? `:${journalSuggestion.versiculo}` : ""}</p>
            <p className="text-xs mt-1 leading-relaxed" style={{ color: T.textMuted }}>{journalSuggestion.motivo}</p>
            {matchedBook && (
              <button onClick={() => onGoToPassage(matchedBook.name, Math.min(journalSuggestion.capitulo || 1, matchedBook.chapters))} className="flex items-center gap-1.5 text-xs mt-2.5 px-3 py-1.5 rounded-full transition active:scale-95" style={{ backgroundColor: T.accent, color: T.onAccent }}>
                Ler na Bíblia <ArrowRight size={12} />
              </button>
            )}
            <p className="text-xs mt-2.5" style={{ color: T.textMuted }}>Sugestão gerada automaticamente — não substitui aconselhamento profissional.</p>
          </div>
        )}
        <p className="text-xs mt-2" style={{ color: T.textMuted }}>Seu diário é salvo automaticamente, apenas neste dispositivo.</p>
      </div>

      <div>
        <h3 className="fd-display text-sm mb-2.5" style={{ color: T.text }}>Plano de 30 dias · Fé para Recomeçar</h3>
        <div className="space-y-1.5">
          {READING_PLAN.map((title, i) => {
            const dayNum = i + 1; const done = completedDays.has(dayNum);
            return (
              <button key={i} onClick={() => toggleDay(dayNum)} className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-left transition active:scale-95" style={{ backgroundColor: T.card, border: `1px solid ${T.border}` }}>
                <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs" style={{ backgroundColor: done ? T.success : T.cardAlt, color: done ? T.onAccent : T.textMuted }}>{done ? <Check size={13} /> : dayNum}</div>
                <span className="text-sm flex-1" style={{ color: done ? T.textMuted : T.text, textDecoration: done ? "line-through" : "none" }}>{title}</span>
              </button>
            );
          })}
        </div>
      </div>
      {!isPremium && <MonetizationBlock />}
    </div>
  );
}

function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function ChurchFinder() {
  const T = useTheme();
  const [status, setStatus] = useState("idle"); // idle | locating | loading | error | done
  const [cityName, setCityName] = useState("");
  const [churches, setChurches] = useState([]);
  const [errorMsg, setErrorMsg] = useState("");

  const getPosition = () => new Promise((resolve, reject) => {
    const isNative = typeof window !== "undefined" && window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform();
    if (isNative && window.Capacitor.Plugins?.Geolocation) {
      window.Capacitor.Plugins.Geolocation.requestPermissions().then((perm) => {
        if (perm.location !== "granted") return reject(new Error("negada"));
        return window.Capacitor.Plugins.Geolocation.getCurrentPosition();
      }).then((pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude })).catch((e) => reject(e));
    } else if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
        (err) => reject(err),
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }
      );
    } else {
      reject(new Error("unsupported"));
    }
  });

  const find = async () => {
    setStatus("locating");
    let lat, lon;
    try {
      const pos = await getPosition();
      lat = pos.lat; lon = pos.lon;
    } catch (e) {
      const msg = e && e.message === "negada"
        ? "Permissão de localização negada. Ative a localização nas configurações do app."
        : "Permissão de localização negada ou indisponível neste dispositivo.";
      setStatus("error");
      setErrorMsg(msg);
      return;
    }
    setStatus("loading");
    try {
      // Geocodificação reversa (grátis, OpenStreetMap Nominatim) — só para mostrar o nome da cidade
      const geoRes = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10`);
      const geoData = await geoRes.json();
      const addr = geoData.address || {};
      setCityName(addr.city || addr.town || addr.village || addr.county || "sua região");

      // Busca igrejas próximas (grátis, OpenStreetMap Overpass API)
      const query = `[out:json][timeout:25];(node["amenity"="place_of_worship"]["religion"="christian"](around:6000,${lat},${lon});way["amenity"="place_of_worship"]["religion"="christian"](around:6000,${lat},${lon}););out center 25;`;
      const opRes = await fetch("https://overpass-api.de/api/interpreter", { method: "POST", body: query });
      if (!opRes.ok) throw new Error("overpass status " + opRes.status);
      const opData = await opRes.json();
      const list = (opData.elements || [])
        .map((el) => {
          const elLat = el.lat ?? el.center?.lat;
          const elLon = el.lon ?? el.center?.lon;
          if (!elLat || !elLon) return null;
          return {
            id: el.id,
            name: el.tags?.name || "Igreja",
            denomination: el.tags?.denomination || "",
            lat: elLat, lon: elLon,
            distanceKm: haversineKm(lat, lon, elLat, elLon),
          };
        })
        .filter(Boolean)
        .sort((a, b) => a.distanceKm - b.distanceKm)
        .slice(0, 12);
      setChurches(list);
      setStatus("done");
    } catch {
      setStatus("error");
      setErrorMsg("Não consegui buscar igrejas agora. Tente novamente em instantes.");
    }
  };

  return (
    <div className="rounded-2xl p-3.5" style={{ backgroundColor: T.card, border: `1px solid ${T.border}` }}>
      <div className="flex items-center gap-3 mb-1">
        <MapPin size={18} style={{ color: T.accent }} />
        <div className="flex-1"><p className="text-sm font-medium" style={{ color: T.text }}>Igrejas perto de você</p><p className="text-xs" style={{ color: T.textMuted }}>Usa sua localização + OpenStreetMap (gratuito)</p></div>
      </div>
      {status === "idle" && (
        <button onClick={find} className="w-full mt-2 rounded-full py-2.5 text-sm font-medium flex items-center justify-center gap-2 transition active:scale-95" style={{ backgroundColor: T.accent, color: T.onAccent }}>
          <LocateFixed size={15} /> Encontrar igrejas perto de mim
        </button>
      )}
      {(status === "locating" || status === "loading") && (
        <div className="flex items-center gap-2 justify-center py-3">
          <Loader2 size={16} className="fd-spin" style={{ color: T.accent }} />
          <span className="text-xs" style={{ color: T.textMuted }}>{status === "locating" ? "Obtendo sua localização..." : "Buscando igrejas próximas..."}</span>
        </div>
      )}
      {status === "error" && (
        <div className="text-center py-2">
          <p className="text-xs mb-2" style={{ color: T.textMuted }}>{errorMsg}</p>
          <button onClick={find} className="text-xs px-3 py-1.5 rounded-full inline-flex items-center gap-1.5" style={{ backgroundColor: T.cardAlt, color: T.accent }}><RotateCcw size={12} /> Tentar novamente</button>
        </div>
      )}
      {status === "done" && (
        <div className="mt-2">
          <p className="text-xs mb-2" style={{ color: T.textMuted }}>Perto de {cityName}:</p>
          {churches.length === 0 ? (
            <p className="text-xs" style={{ color: T.textMuted }}>Nenhuma igreja encontrada no mapa aberto (OpenStreetMap) perto de você ainda — a base de dados é colaborativa e pode ter lacunas na sua região.</p>
          ) : (
            <div className="space-y-1.5">
              {churches.map((c) => (
                <a key={c.id} href={`https://www.openstreetmap.org/?mlat=${c.lat}&mlon=${c.lon}#map=17/${c.lat}/${c.lon}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 rounded-xl px-3 py-2 transition active:scale-95" style={{ backgroundColor: T.cardAlt }}>
                  <MapPin size={13} style={{ color: T.accent }} className="shrink-0" />
                  <div className="flex-1 min-w-0"><p className="text-xs font-medium truncate" style={{ color: T.text }}>{c.name}</p>{c.denomination && <p className="text-xs" style={{ color: T.textMuted }}>{c.denomination}</p>}</div>
                  <span className="text-xs shrink-0" style={{ color: T.textMuted }}>{c.distanceKm.toFixed(1)} km</span>
                </a>
              ))}
            </div>
          )}
          <button onClick={find} className="text-xs mt-2 flex items-center gap-1" style={{ color: T.accent }}><RefreshCw size={11} /> Atualizar</button>
        </div>
      )}
    </div>
  );
}

function HelpScreen({ isPremium, onOpenPremium, soundOn, onToggleSound, onOpenTerms, onExportData, onDeleteData, ageBracket }) {
  const T = useTheme();
  const [cat, setCat] = useState("financeira");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const categories = [
    { id: "financeira", label: "Financeira", icon: DollarSign }, { id: "espiritual", label: "Espiritual", icon: Compass },
    { id: "emocional", label: "Emocional", icon: Heart }, { id: "casamento", label: "Casamento", icon: Users },
  ];
  const tips = HELP_CONTENT[cat];
  return (
    <div className="px-5 py-3 space-y-4">
      <div className="flex gap-2 overflow-x-auto pb-1">
        {categories.map((c) => { const Icon = c.icon; return (<button key={c.id} onClick={() => setCat(c.id)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full shrink-0 text-xs transition active:scale-95" style={{ backgroundColor: cat === c.id ? T.accent : T.card, color: cat === c.id ? T.onAccent : T.text, border: `1px solid ${cat === c.id ? T.accent : T.border}` }}><Icon size={13} /> {c.label}</button>); })}
      </div>
      <div className="space-y-2">{tips.map((t, i) => (<div key={i} className="rounded-2xl p-3.5" style={{ backgroundColor: T.card, border: `1px solid ${T.border}` }}><p className="text-sm font-medium mb-1" style={{ color: T.text }}>{t.title}</p><p className="text-xs leading-relaxed" style={{ color: T.textMuted }}>{t.text}</p></div>))}</div>
      {(cat === "emocional" || cat === "casamento") && (<p className="text-xs leading-relaxed rounded-xl p-3" style={{ backgroundColor: T.cardAlt, color: T.textMuted }}>Este conteúdo tem caráter devocional e não substitui acompanhamento profissional. Em momentos mais difíceis, procure um conselheiro, pastor ou psicólogo de confiança.</p>)}

      <div className="pt-3 border-t" style={{ borderColor: T.border }}>
        <p className="text-xs uppercase tracking-wider mt-3 mb-2" style={{ color: T.textMuted }}>Perto de você</p>
        <ChurchFinder />
      </div>

      <div className="pt-1">
        <p className="text-xs uppercase tracking-wider mt-3 mb-2" style={{ color: T.textMuted }}>Preferências</p>
        <div className="space-y-2">
          <NotificationRow />
          <div className="rounded-2xl p-3.5 flex items-center gap-3" style={{ backgroundColor: T.card, border: `1px solid ${T.border}` }}>
            {soundOn ? <Volume2 size={18} style={{ color: T.accent }} /> : <VolumeX size={18} style={{ color: T.textMuted }} />}
            <div className="flex-1"><p className="text-sm font-medium" style={{ color: T.text }}>Sons do app</p><p className="text-xs" style={{ color: T.textMuted }}>Um toque suave ao concluir orações e tarefas</p></div>
            <button onClick={onToggleSound} className="rounded-full transition active:scale-95" style={{ width: 40, height: 24, backgroundColor: soundOn ? T.accent : T.cardAlt, position: "relative" }}>
              <span style={{ position: "absolute", top: 3, left: soundOn ? 19 : 3, width: 18, height: 18, borderRadius: 9999, backgroundColor: "#fff", transition: "left 0.2s ease" }} />
            </button>
          </div>
        </div>
      </div>

      <div>
        <p className="text-xs uppercase tracking-wider mb-2" style={{ color: T.textMuted }}>Apoie o app</p>
        <button onClick={onOpenPremium} className="w-full rounded-2xl p-3.5 flex items-center gap-3 transition active:scale-95" style={{ backgroundColor: isPremium ? T.card : T.accent + "18", border: `1px solid ${isPremium ? T.border : T.accent}` }}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: T.accent + "26" }}>
            <Crown size={17} style={{ color: T.accent }} fill={isPremium ? T.accent : "none"} />
          </div>
          <div className="text-left flex-1"><p className="text-sm font-medium" style={{ color: T.text }}>{isPremium ? "Você é Premium" : "Virar Premium"}</p><p className="text-xs" style={{ color: T.textMuted }}>{isPremium ? "Obrigado por apoiar o projeto 💛" : "Sem anúncios · pagamento único de R$ 12,00"}</p></div>
          {!isPremium && <ArrowRight size={16} style={{ color: T.accent }} />}
        </button>
      </div>

      <div>
        <p className="text-xs uppercase tracking-wider mb-2" style={{ color: T.textMuted }}>Recomendados (afiliados)</p>
        <div className="space-y-1.5">
          {AFFILIATE_PRODUCTS.map((p, i) => (
            <a key={i} href={p.url} target="_blank" rel="noopener noreferrer sponsored" className="rounded-xl px-3 py-2.5 flex items-center gap-3 transition active:scale-95" style={{ backgroundColor: T.card, border: `1px solid ${T.border}` }}>
              <div className="relative rounded-lg shrink-0" style={{ width: 36, height: 36, backgroundColor: T.cardAlt, overflow: "hidden" }}>
                {p.image ? (
                  <img src={p.image} alt={p.name} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", display: "block" }} onError={(e) => { e.target.style.display = "none"; }} />
                ) : (
                  <div className="w-full h-full flex items-center justify-center"><ShoppingBag size={16} style={{ color: T.accent }} /></div>
                )}
              </div>
              <div className="flex-1"><p className="text-xs font-medium" style={{ color: T.text }}>{p.name}</p><p className="text-xs" style={{ color: T.textMuted }}>{p.desc}</p></div>
              <ArrowRight size={13} style={{ color: T.accent }} />
            </a>
          ))}
        </div>
        <p className="text-xs mt-1.5" style={{ color: T.textMuted }}>Links de afiliado (ex.: Mercado Livre) — você recebe comissão quando alguém compra por eles.</p>
      </div>
      <div className="rounded-2xl p-3.5" style={{ backgroundColor: T.card, border: `1px solid ${T.border}` }}>
        <div className="flex items-center gap-3 mb-2.5">
          <ShieldCheck size={18} style={{ color: T.accent }} />
          <div className="flex-1"><p className="text-sm font-medium" style={{ color: T.text }}>Meus Dados</p><p className="text-xs" style={{ color: T.textMuted }}>Acesse, baixe ou apague seus dados — direito seu pela LGPD</p></div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              const blob = new Blob([JSON.stringify(onExportData(), null, 2)], { type: "application/json" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url; a.download = "meus-dados-fe-diaria.json"; a.click();
              URL.revokeObjectURL(url);
            }}
            className="flex-1 text-xs py-2 rounded-full transition active:scale-95"
            style={{ backgroundColor: T.cardAlt, color: T.accent }}
          >
            Baixar meus dados
          </button>
          <button onClick={() => setConfirmDelete(true)} className="flex-1 text-xs py-2 rounded-full transition active:scale-95" style={{ backgroundColor: T.cardAlt, color: T.textMuted }}>Apagar tudo</button>
        </div>
        {confirmDelete && (
          <div className="mt-2.5 rounded-xl p-3" style={{ backgroundColor: T.cardAlt }}>
            <p className="text-xs mb-2 leading-relaxed" style={{ color: T.text }}>Isso apaga para sempre seu progresso, diário, favoritos e login deste dispositivo. Não dá para desfazer.</p>
            <div className="flex gap-2">
              <button onClick={() => { onDeleteData(); setConfirmDelete(false); }} className="flex-1 text-xs py-1.5 rounded-full font-medium transition active:scale-95" style={{ backgroundColor: T.accent, color: T.onAccent }}>Sim, apagar</button>
              <button onClick={() => setConfirmDelete(false)} className="flex-1 text-xs py-1.5 rounded-full transition active:scale-95" style={{ backgroundColor: T.card, color: T.textMuted }}>Cancelar</button>
            </div>
          </div>
        )}
        <p className="text-xs mt-2.5" style={{ color: T.textMuted }}>Idade informada: {ageBracket === "18_plus" ? "18 ou mais" : ageBracket === "13_to_17" ? "13 a 17" : ageBracket === "under_13" ? "até 12" : "não informada"}</p>
      </div>
      <button onClick={onOpenTerms} className="w-full flex items-center justify-center gap-1.5 text-xs py-2 transition active:scale-95" style={{ color: T.textMuted }}><FileText size={12} /> Termos de Uso e Privacidade</button>
      <p className="text-xs text-center pt-1 pb-1" style={{ color: T.textMuted }}>Fé Diária · seus dados ficam salvos neste dispositivo</p>
      <p className="text-xs text-center pb-2" style={{ color: T.textMuted }}>Desenvolvido por <b style={{ color: T.accent }}>AddInfoBrasil</b></p>
    </div>
  );
}

function MiniAvatar({ name, size = 28 }) {
  const T = useTheme();
  return (
    <div className="rounded-full flex items-center justify-center shrink-0 font-semibold" style={{ width: size, height: size, backgroundColor: T.cardAlt, color: T.accent, fontSize: size * 0.4 }}>
      {(name || "A").charAt(0).toUpperCase()}
    </div>
  );
}

function DMThread({ myName, otherName, onBack }) {
  const T = useTheme();
  const key = dmThreadKey(myName, otherName);
  const [messages, setMessages] = useState([]);
  const [status, setStatus] = useState("loading");
  const [text, setText] = useState("");

  const load = async () => {
    setStatus("loading");
    try {
      const res = await window.storage.get(key, true);
      setMessages(res && res.value ? JSON.parse(res.value) : []);
    } catch { setMessages([]); }
    finally { setStatus("idle"); }
  };
  useEffect(() => { load(); }, [key]); // eslint-disable-line react-hooks/exhaustive-deps

  const send = async () => {
    const t = text.trim();
    if (!t) return;
    try {
      let current = messages;
      try { const res = await window.storage.get(key, true); current = res && res.value ? JSON.parse(res.value) : []; } catch { current = []; }
      const updated = [...current, { id: uid(), from: myName || "Anônimo", text: t.slice(0, 500), ts: Date.now() }].slice(-300);
      await window.storage.set(key, JSON.stringify(updated), true);
      setMessages(updated);
      setText("");
    } catch { /* keep draft */ }
  };

  return (
    <div className="flex flex-col" style={{ height: "100%" }}>
      <div className="flex items-center gap-2 px-1 pb-2">
        <button onClick={onBack} className="transition active:scale-95"><ChevronLeft size={18} style={{ color: T.textMuted }} /></button>
        <MiniAvatar name={otherName} size={26} />
        <p className="text-sm font-medium" style={{ color: T.text }}>{otherName}</p>
      </div>
      <div className="rounded-xl p-2.5 mb-2 flex items-start gap-2" style={{ backgroundColor: T.cardAlt }}>
        <ShieldAlert size={14} style={{ color: T.accent, marginTop: 1 }} />
        <p className="text-xs leading-relaxed" style={{ color: T.textMuted }}>Mensagens salvas apenas neste dispositivo. Não é um serviço de mensageria real — evite compartilhar dados sensíveis.</p>
      </div>
      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
        {status === "loading" ? <VerseSkeleton /> : messages.length === 0 ? (
          <p className="text-xs text-center py-6" style={{ color: T.textMuted }}>Nenhuma mensagem ainda. Diga oi!</p>
        ) : messages.map((m) => (
          <div key={m.id} className="max-w-[80%] rounded-2xl px-3 py-2" style={{ backgroundColor: m.from === myName ? T.accent : T.card, color: m.from === myName ? T.onAccent : T.text, marginLeft: m.from === myName ? "auto" : 0, border: m.from === myName ? "none" : `1px solid ${T.border}` }}>
            <p className="text-sm whitespace-pre-wrap">{m.text}</p>
            <p className="text-xs mt-0.5 opacity-70">{timeAgo(m.ts)}</p>
          </div>
        ))}
      </div>
      <div className="pt-2">
        <div className="flex items-center gap-2 mt-2">
          <input value={text} onChange={(ev) => setText(ev.target.value)} onKeyDown={(ev) => { if (ev.key === "Enter") send(); }} placeholder="Escreva uma mensagem..." className="flex-1 rounded-full px-3.5 py-2 text-sm outline-none" style={{ backgroundColor: T.cardAlt, color: T.text }} />
          <button onClick={send} className="rounded-full p-2 transition active:scale-95" style={{ backgroundColor: T.accent }}><Send size={15} style={{ color: T.onAccent }} /></button>
        </div>
      </div>
    </div>
  );
}

function CommunityScreen({ user, hiddenPosts, onHidePost, likedPosts, onToggleLike }) {
  const T = useTheme();
  const [section, setSection] = useState("mural"); // mural | amigos | msgs
  const [friends, setFriends] = useState([]);
  const [friendName, setFriendName] = useState("");
  const [activeChat, setActiveChat] = useState(null);
  const [posts, setPosts] = useState([]);
  const [status, setStatus] = useState("loading");
  const [text, setText] = useState("");
  const [category, setCategory] = useState("encorajamento");
  const [posting, setPosting] = useState(false);
  const supabaseReady = import.meta.env.VITE_SUPABASE_URL && !import.meta.env.VITE_SUPABASE_URL.includes("SEU-PROJETO");

  const mapPost = (p) => ({
    id: p.id,
    name: p.author_name || "Anônimo",
    category: p.category,
    text: p.text,
    ts: new Date(p.created_at).getTime(),
    likes: p.likes_count || 0,
  });

  const load = async () => {
    setStatus("loading");
    try {
      let local = [];
      try {
        const res = await window.storage.get(COMMUNITY_KEY, true);
        local = res && res.value ? JSON.parse(res.value) : [];
      } catch { local = []; }
      if (supabaseReady) {
        try {
          const { data, error } = await supabase.from("posts_with_likes").select("*").order("created_at", { ascending: false }).limit(100);
          if (!error) {
            // Mescla posts da nuvem com os locais (por id), sem duplicar.
            const cloud = (data || []).map(mapPost);
            const ids = new Set(cloud.map((p) => p.id));
            const merged = [...cloud, ...local.filter((p) => !ids.has(p.id))].sort((a, b) => b.ts - a.ts);
            setPosts(merged); setStatus("idle"); return;
          }
        } catch { /* cai para local abaixo */ }
      }
      setPosts(local);
    } catch { setPosts([]); } finally {
      setStatus("idle");
    }
  };
  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    (async () => {
      try {
        const res = await window.storage.get(FRIENDS_KEY, true);
        setFriends(res && res.value ? JSON.parse(res.value) : []);
      } catch { setFriends([]); }
    })();
  }, []);

  const addFriend = async (name) => {
    const n = name.trim();
    if (!n) return;
    const existing = friends.some((f) => f.name.toLowerCase() === n.toLowerCase());
    if (existing) { setFriendName(""); return; }
    const updated = [...friends, { id: uid(), name: n, addedAt: Date.now() }];
    setFriends(updated);
    await window.storage.set(FRIENDS_KEY, JSON.stringify(updated), true).catch(() => {});
    setFriendName("");
  };

  const removeFriend = async (id) => {
    const updated = friends.filter((f) => f.id !== id);
    setFriends(updated);
    await window.storage.set(FRIENDS_KEY, JSON.stringify(updated), true).catch(() => {});
  };

  const myName = (user && user.name) || "Convidado";

  const submitPost = async () => {
    const t = text.trim();
    if (!t || posting) return;
    setPosting(true);
    try {
      // Moderação: se a IA falhar (sem internet/API), não bloqueia a publicação.
      let moderation = { aprovado: true };
      try { moderation = await moderateText(t); } catch { moderation = { aprovado: true }; }
      if (!moderation.aprovado) {
        alert("Publicação recusada: " + (moderation.motivo || "conteúdo inadequado."));
        setPosting(false);
        return;
      }
      if (supabaseReady && user?.sub) {
        const { data, error } = await supabase.from("posts").insert({
          user_id: user?.sub,
          category,
          text: t.slice(0, 280),
          author_name: user?.name || "Anônimo",
          author_avatar: user?.picture || null,
          approved: true,
        }).select().single();
        if (error) throw error;
        setPosts((prev) => [mapPost(data), ...prev]);
      } else {
        let current = posts;
        try {
          const res = await window.storage.get(COMMUNITY_KEY, true);
          current = res && res.value ? JSON.parse(res.value) : [];
        } catch { current = []; }
        const newPost = { id: uid(), name: user ? user.name : "Anônimo", category, text: t.slice(0, 280), ts: Date.now(), likes: 0 };
        const updated = [newPost, ...current].slice(0, 200);
        await window.storage.set(COMMUNITY_KEY, JSON.stringify(updated), true);
        setPosts(updated);
      }
      setText("");
    } catch {
      alert("Não foi possível publicar agora. Verifique sua conexão e tente novamente.");
    } finally { setPosting(false); }
  };

  const like = async (id) => {
    const alreadyLiked = likedPosts.has(id);
    onToggleLike(id);
    setPosts((prev) => prev.map((p) => (p.id === id ? { ...p, likes: Math.max(0, p.likes + (alreadyLiked ? -1 : 1)) } : p)));
    if (supabaseReady && user?.sub) {
      try {
        if (alreadyLiked) {
          await supabase.from("post_likes").delete().match({ post_id: id, user_id: user.sub });
        } else {
          await supabase.from("post_likes").insert({ post_id: id, user_id: user.sub });
        }
      } catch { /* revert handled by optimistic update below */ }
    } else {
      try {
        const res = await window.storage.get(COMMUNITY_KEY, true).catch(() => null);
        const current = res && res.value ? JSON.parse(res.value) : posts;
        const updated = current.map((p) => (p.id === id ? { ...p, likes: Math.max(0, p.likes + (alreadyLiked ? -1 : 1)) } : p));
        await window.storage.set(COMMUNITY_KEY, JSON.stringify(updated), true);
      } catch { /* optimistic already applied */ }
    }
  };

  const visible = posts.filter((p) => !hiddenPosts.has(p.id));

  if (activeChat) {
    return (
      <div className="px-5 py-3" style={{ height: "100%" }}>
        <DMThread myName={myName} otherName={activeChat} onBack={() => setActiveChat(null)} />
      </div>
    );
  }

  return (
    <div className="flex flex-col" style={{ height: "100%" }}>
      <div className="flex gap-1.5 px-5 pt-3 pb-2">
        {[["mural", "Mural"], ["amigos", "Amigos"], ["msgs", "Mensagens"]].map(([id, label]) => (
          <button key={id} onClick={() => setSection(id)} className="text-xs px-3 py-1.5 rounded-full font-medium transition active:scale-95" style={{ backgroundColor: section === id ? T.accent : T.card, color: section === id ? T.onAccent : T.text, border: `1px solid ${section === id ? T.accent : T.border}` }}>
            {label}
          </button>
        ))}
      </div>

      {section === "amigos" && (
        <div className="px-5 py-2 space-y-3 flex-1 overflow-y-auto fd-scroll">
          <div className="rounded-2xl p-3.5" style={{ backgroundColor: T.card, border: `1px solid ${T.border}` }}>
            <p className="text-xs mb-2" style={{ color: T.textMuted }}>Adicione pessoas para conversar em particular. Os amigos e as mensagens ficam salvos apenas neste dispositivo.</p>
            <input value={friendName} onChange={(e) => setFriendName(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") addFriend(friendName); }} placeholder="Nome do amigo" className="w-full rounded-xl px-3 py-2.5 text-sm outline-none mb-2" style={{ backgroundColor: T.cardAlt, color: T.text, border: `1px solid ${T.border}` }} />
            <button onClick={() => addFriend(friendName)} className="w-full rounded-xl py-2.5 text-sm font-medium transition active:scale-95" style={{ backgroundColor: T.accent, color: T.onAccent, opacity: friendName.trim() ? 1 : 0.5 }}>Adicionar</button>
          </div>
          {friends.length === 0 ? (
            <p className="text-xs text-center py-6 leading-relaxed" style={{ color: T.textMuted }}>Nenhum amigo ainda. Adicione alguém pelo nome para começar a conversar.</p>
          ) : (
            <div className="space-y-2">
              {friends.map((f) => (
                <div key={f.id} className="rounded-2xl p-3 flex items-center gap-3" style={{ backgroundColor: T.card, border: `1px solid ${T.border}` }}>
                  <MiniAvatar name={f.name} size={34} />
                  <div className="flex-1 min-w-0"><p className="text-sm font-medium truncate" style={{ color: T.text }}>{f.name}</p><p className="text-xs" style={{ color: T.textMuted }}>Amigo desde {timeAgo(f.addedAt)}</p></div>
                  <button onClick={() => setActiveChat(f.name)} className="text-xs px-3 py-1.5 rounded-full font-medium" style={{ backgroundColor: T.accent, color: T.onAccent }}>Conversar</button>
                  <button onClick={() => removeFriend(f.id)} className="transition active:scale-95"><X size={15} style={{ color: T.textMuted }} /></button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {section === "msgs" && (
        <div className="px-5 py-2 space-y-3 flex-1 overflow-y-auto fd-scroll">
          {friends.length === 0 ? (
            <p className="text-xs text-center py-6 leading-relaxed" style={{ color: T.textMuted }}>Adicione amigos na aba &quot;Amigos&quot; para trocar mensagens.</p>
          ) : (
            friends.map((f) => (
              <button key={f.id} onClick={() => setActiveChat(f.name)} className="w-full rounded-2xl p-3 flex items-center gap-3 text-left transition active:scale-95" style={{ backgroundColor: T.card, border: `1px solid ${T.border}` }}>
                <MiniAvatar name={f.name} size={34} />
                <div className="flex-1 min-w-0"><p className="text-sm font-medium truncate" style={{ color: T.text }}>{f.name}</p><p className="text-xs" style={{ color: T.textMuted }}>Tocar para abrir a conversa</p></div>
                <ChevronRight size={16} style={{ color: T.textMuted }} />
              </button>
            ))
          )}
        </div>
      )}

      {section === "mural" && (
        <div className="px-5 py-2 space-y-4 flex-1 overflow-y-auto fd-scroll">
          <div className="rounded-xl p-3 flex items-start gap-2" style={{ backgroundColor: T.cardAlt }}>
            <Users size={14} style={{ color: T.accent, marginTop: 2 }} />
            <p className="text-xs leading-relaxed" style={{ color: T.textMuted }}>{supabaseReady ? (user?.sub ? "Mural público compartilhado com todos os usuários do Fé Diária. Suas publicações aparecem para todo mundo." : "Para publicar e ver as publicações de todos os usuários, entre com sua conta Google pelo ícone do perfil na tela inicial.") : "Mural local — visível apenas neste dispositivo. Conecte o Supabase para compartilhar."}</p>
          </div>

          <div className="rounded-2xl p-3.5" style={{ backgroundColor: T.card, border: `1px solid ${T.border}` }}>
            <textarea value={text} onChange={(e) => setText(e.target.value.slice(0, 280))} rows={3} placeholder={`Compartilhe algo com a comunidade${user ? ", " + user.name.split(" ")[0] : ""}...`} className="w-full rounded-xl p-2.5 text-sm outline-none resize-none" style={{ backgroundColor: T.cardAlt, color: T.text }} />
            <div className="flex gap-1.5 overflow-x-auto mt-2 pb-1">
              {POST_CATEGORIES.map((c) => (<button key={c.id} onClick={() => setCategory(c.id)} className="text-xs px-2.5 py-1 rounded-full shrink-0" style={{ backgroundColor: category === c.id ? T.accent : T.cardAlt, color: category === c.id ? T.onAccent : T.textMuted }}>{c.label}</button>))}
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs" style={{ color: T.textMuted }}>{text.length}/280</span>
              <button onClick={submitPost} disabled={!text.trim() || posting} className="flex items-center gap-1.5 text-xs px-4 py-2 rounded-full font-medium transition active:scale-95" style={{ backgroundColor: T.accent, color: T.onAccent, opacity: !text.trim() || posting ? 0.5 : 1 }}>
                <Send size={13} /> {posting ? "Publicando..." : "Publicar"}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-wider" style={{ color: T.textMuted }}>Feed da comunidade</p>
            <button onClick={load} className="flex items-center gap-1 text-xs transition active:scale-95" style={{ color: T.accent }}><RefreshCw size={12} /> Atualizar</button>
          </div>

          {status === "loading" ? (
            <VerseSkeleton />
          ) : visible.length === 0 ? (
            <p className="text-xs text-center py-6 leading-relaxed" style={{ color: T.textMuted }}>Ainda não há publicações. Seja a primeira pessoa a compartilhar algo hoje.</p>
          ) : (
            <div className="space-y-2">
              {visible.map((p) => {
                const catLabel = (POST_CATEGORIES.find((c) => c.id === p.category) || {}).label || "";
                const liked = likedPosts.has(p.id);
                return (
                  <div key={p.id} className="rounded-2xl p-3.5" style={{ backgroundColor: T.card, border: `1px solid ${T.border}` }}>
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-semibold" style={{ backgroundColor: T.cardAlt, color: T.accent }}>{(p.name || "A").charAt(0).toUpperCase()}</div>
                      <div className="flex-1 min-w-0"><p className="text-xs font-medium truncate" style={{ color: T.text }}>{p.name}</p><p className="text-xs" style={{ color: T.textMuted }}>{catLabel} · {timeAgo(p.ts)}</p></div>
                      <button onClick={() => { addFriend(p.name); setActiveChat(p.name); }} title="Conversar em particular" className="transition active:scale-95"><MessageCircle size={14} style={{ color: T.accent }} /></button>
                      <button onClick={() => onHidePost(p.id)} title="Ocultar para mim"><EyeOff size={13} style={{ color: T.textMuted }} /></button>
                    </div>
                    <p className="text-sm leading-relaxed" style={{ color: T.text }}>{p.text}</p>
                    <button onClick={() => like(p.id)} className="flex items-center gap-1.5 mt-2 transition active:scale-95">
                      <Heart size={15} fill={liked ? T.accent : "none"} style={{ color: T.accent }} />
                      <span className="text-xs" style={{ color: T.textMuted }}>{p.likes || 0}</span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function TermsModal({ onAccept, onClose, canDismiss }) {
  const T = useTheme();
  const [ageBracket, setAgeBracket] = useState(null);
  const [sensitiveConsent, setSensitiveConsent] = useState(false);
  const canProceed = ageBracket && (ageBracket === "18_plus" ? sensitiveConsent : true);

  return (
    <Modal title="Termos de Uso e Privacidade" onClose={canDismiss ? onClose : () => {}}>
      <div className="flex items-center gap-2 mb-3">
        <ShieldCheck size={16} style={{ color: T.accent }} />
        <p className="text-xs" style={{ color: T.textMuted }}>Versão {TERMS_VERSION}{!canDismiss ? " · leia antes de continuar" : ""}</p>
      </div>
      <div className="space-y-3 text-xs leading-relaxed pr-1" style={{ color: T.text, maxHeight: 280, overflowY: "auto" }}>
        <p><b>1. Aceitação.</b> Ao usar o Fé Diária, você concorda com estes termos e com a Política de Privacidade. Se não concordar, não continue usando o app.</p>
        <p><b>2. Natureza do conteúdo.</b> Este app tem finalidade devocional e educativa. Nada aqui substitui aconselhamento profissional médico, psicológico, financeiro, jurídico ou pastoral.</p>
        <p><b>3. Mural da comunidade.</b> Espaço público, não moderado em tempo real por pessoas (há moderação automática por IA). Proibido discurso de ódio, assédio, spam, conteúdo sexual, ilegal, ou exposição de dados de terceiros.</p>
        <p><b>4. Dado sensível.</b> Conteúdo sobre fé (orações, diário, publicações) é considerado dado pessoal sensível pela LGPD (Art. 5º, II). Pedimos consentimento específico para isso abaixo.</p>
        <p><b>5. Idade mínima.</b> Mural e mensagens privadas são recomendados apenas para maiores de 18 anos, dado o risco de contato com estranhos.</p>
        <p><b>6. Seus direitos.</b> Você pode acessar, exportar ou apagar seus dados a qualquer momento em &quot;Meus Dados&quot;, em Ajuda+.</p>
        <p><b>7. IA.</b> Moderação e sugestões usam inteligência artificial e podem conter imprecisões.</p>
        <p><b>8. Pagamentos.</b> Nesta versão de demonstração, remover anúncios não realiza cobrança real.</p>
        <p className="pt-1" style={{ color: T.textMuted }}>Modelo inicial de referência — não substitui revisão por advogado antes da publicação real.</p>
      </div>

      <div className="mt-3 pt-3 border-t" style={{ borderColor: T.border }}>
        <p className="text-xs font-medium mb-1.5" style={{ color: T.text }}>Qual é a sua idade?</p>
        <div className="flex gap-1.5 mb-3">
          {[{ id: "under_13", label: "Até 12" }, { id: "13_to_17", label: "13 a 17" }, { id: "18_plus", label: "18 ou mais" }].map((o) => (
            <button key={o.id} onClick={() => setAgeBracket(o.id)} className="flex-1 text-xs py-2 rounded-xl" style={{ backgroundColor: ageBracket === o.id ? T.accent : T.cardAlt, color: ageBracket === o.id ? T.onAccent : T.text }}>{o.label}</button>
          ))}
        </div>
        {ageBracket && ageBracket !== "18_plus" && (
          <p className="text-xs mb-3 leading-relaxed rounded-xl p-2.5" style={{ backgroundColor: T.cardAlt, color: T.textMuted }}>Para menores de 18, o mural público e as mensagens privadas ficam desativados nesta conta, e o uso do app deve ser orientado por um responsável.</p>
        )}
        {ageBracket === "18_plus" && (
          <button onClick={() => setSensitiveConsent((s) => !s)} className="w-full flex items-start gap-2.5 text-left mb-1">
            <div className="w-4 h-4 rounded flex items-center justify-center shrink-0 mt-0.5" style={{ backgroundColor: sensitiveConsent ? T.accent : "transparent", border: `1.5px solid ${sensitiveConsent ? T.accent : T.border}` }}>{sensitiveConsent && <Check size={11} style={{ color: T.onAccent }} />}</div>
            <span className="text-xs leading-relaxed" style={{ color: T.text }}>Concordo especificamente com o tratamento do conteúdo de fé que eu escrever (orações, diário, publicações) como dado sensível, conforme a Política de Privacidade.</span>
          </button>
        )}
      </div>

      {onAccept && (<button onClick={() => onAccept(ageBracket, sensitiveConsent)} disabled={!canProceed} className="w-full mt-3 rounded-full py-3 text-sm font-medium transition active:scale-95" style={{ backgroundColor: T.accent, color: T.onAccent, opacity: canProceed ? 1 : 0.5 }}>Aceitar e continuar</button>)}
    </Modal>
  );
}

/* ============================== APP ============================== */
export default function App() {
  const [tab, setTab] = useState("home");
  const [modal, setModal] = useState(null);
  const [ready, setReady] = useState(false);
  const [themeName, setThemeName] = useState("dark");
  const [isPremium, setIsPremium] = useState(false);
  const [completedDays, setCompletedDays] = useState(() => new Set());
  const [favorites, setFavorites] = useState(() => new Set());
  const [prayedDates, setPrayedDates] = useState(() => new Set());
  const [reflections, setReflections] = useState({});
  const [tasks, setTasks] = useState([]);
  const [bibleBook, setBibleBook] = useState(BIBLE_BOOKS.find((b) => b.name === "Salmos"));
  const [bibleChapter, setBibleChapter] = useState(23);
  const [bibleVersion, setBibleVersion] = useState("nvi");
  const [bibleCache, setBibleCache] = useState({});
  const [lastRead, setLastRead] = useState(null);
  const [favoriteVerses, setFavoriteVerses] = useState([]);
  const [user, setUser] = useState(null);
  const [soundOn, setSoundOn] = useState(true);
  const [journalEntries, setJournalEntries] = useState({});
  const [journalSuggestions, setJournalSuggestions] = useState({});
  const [hiddenPosts, setHiddenPosts] = useState(() => new Set());
  const [likedPosts, setLikedPosts] = useState(() => new Set());
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [ageBracket, setAgeBracket] = useState(null);
  const isAdult = ageBracket === "18_plus";
  const [splashPhase, setSplashPhase] = useState("in"); // "in" -> "out" -> "gone"
  useEffect(() => {
    const t1 = setTimeout(() => setSplashPhase("out"), 950);
    const t2 = setTimeout(() => setSplashPhase("gone"), 1350);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const dayOfYear = Math.floor((now - start) / 86400000);
  const dayOfMonth = now.getDate();
  const todayKey = dateKey(now);
  const journalText = journalEntries[todayKey] || "";
  const journalSuggestion = journalSuggestions[todayKey] || null;

  const verse = VERSES[dayOfYear % VERSES.length];
  const prayer = PRAYERS[dayOfYear % PRAYERS.length];
  const moment = MOMENTS[dayOfYear % MOMENTS.length];
  const reflection = REFLECTIONS[dayOfYear % REFLECTIONS.length];
  const songOfDay = SONGS[(dayOfMonth - 1) % SONGS.length];
  const prayedToday = prayedDates.has(todayKey);
  const reflectionText = reflections[todayKey] || "";

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await window.storage.get(STORE_KEY, false);
        if (res && res.value && !cancelled) {
          const d = JSON.parse(res.value);
          if (d.theme) setThemeName(d.theme);
          if (d.isPremium) setIsPremium(true);
          if (Array.isArray(d.completedDays)) setCompletedDays(new Set(d.completedDays));
          if (Array.isArray(d.favorites)) setFavorites(new Set(d.favorites));
          if (Array.isArray(d.prayedDates)) setPrayedDates(new Set(d.prayedDates));
          if (d.reflections) setReflections(d.reflections);
          if (Array.isArray(d.tasks)) setTasks(d.tasks);
          if (d.lastRead) setLastRead(d.lastRead);
          if (Array.isArray(d.favoriteVerses)) setFavoriteVerses(d.favoriteVerses);
          if (d.user) setUser(d.user);
          if (typeof d.soundOn === "boolean") setSoundOn(d.soundOn);
          if (d.journalEntries) setJournalEntries(d.journalEntries);
          if (d.journalSuggestions) setJournalSuggestions(d.journalSuggestions);
          if (Array.isArray(d.hiddenPosts)) setHiddenPosts(new Set(d.hiddenPosts));
          if (Array.isArray(d.likedPosts)) setLikedPosts(new Set(d.likedPosts));
          if (typeof d.termsAccepted === "boolean") setTermsAccepted(d.termsAccepted);
          if (d.ageBracket) setAgeBracket(d.ageBracket);
        }
      } catch { /* first time opening — nothing saved yet */ }
      finally { if (!cancelled) setReady(true); }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!ready) return;
    const t = setTimeout(async () => {
      try {
        await window.storage.set(STORE_KEY, JSON.stringify({
          theme: themeName, isPremium,
          completedDays: Array.from(completedDays), favorites: Array.from(favorites),
          prayedDates: Array.from(prayedDates), reflections, tasks,
          lastRead, favoriteVerses, user, soundOn,
          journalEntries, journalSuggestions,
          hiddenPosts: Array.from(hiddenPosts), likedPosts: Array.from(likedPosts),
          termsAccepted, ageBracket,
        }), false);
      } catch { /* ignore write errors */ }
    }, 450);
    return () => clearTimeout(t);
  }, [ready, themeName, isPremium, completedDays, favorites, prayedDates, reflections, tasks, lastRead, favoriteVerses, user, soundOn, journalEntries, journalSuggestions, hiddenPosts, likedPosts, termsAccepted, ageBracket]);

  const toggleDay = (d) => setCompletedDays((prev) => { const n = new Set(prev); if (n.has(d)) { n.delete(d); } else { n.add(d); playChime(soundOn); } return n; });
  const toggleFavorite = (id) => setFavorites((prev) => { const n = new Set(prev); if (n.has(id)) { n.delete(id); } else { n.add(id); playChime(soundOn, "favorite"); } return n; });
  const markPrayed = () => { setPrayedDates((prev) => new Set(prev).add(todayKey)); playChime(soundOn); };
  const setReflectionText = (text) => setReflections((prev) => ({ ...prev, [todayKey]: text }));
  const setJournalText = (text) => setJournalEntries((prev) => ({ ...prev, [todayKey]: text }));
  const setJournalSuggestion = (s) => setJournalSuggestions((prev) => ({ ...prev, [todayKey]: s }));
  const onGoToPassage = (bookName, chapter) => { setBibleBook(BIBLE_BOOKS.find((b) => b.name === bookName)); setBibleChapter(chapter); setTab("biblia"); };
  const onHidePost = (id) => setHiddenPosts((prev) => new Set(prev).add(id));
  const onToggleLike = (id) => setLikedPosts((prev) => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const acceptTerms = (bracket) => { setTermsAccepted(true); setAgeBracket(bracket); };
  const exportMyData = () => ({
    completedDays: Array.from(completedDays), favorites: Array.from(favorites), prayedDates: Array.from(prayedDates),
    reflections, tasks, lastRead, favoriteVerses, journalEntries, journalSuggestions, user, ageBracket, exportedAt: new Date().toISOString(),
  });
  const deleteMyData = () => {
    setCompletedDays(new Set()); setFavorites(new Set()); setPrayedDates(new Set()); setReflections({});
    setTasks([]); setLastRead(null); setFavoriteVerses([]); setJournalEntries({}); setJournalSuggestions({});
    setHiddenPosts(new Set()); setLikedPosts(new Set()); setUser(null); setIsPremium(false);
    window.storage.delete(STORE_KEY, false).catch(() => {});
  };
  const toggleTheme = () => setThemeName((t) => (t === "dark" ? "light" : "dark"));
  const toggleSound = () => setSoundOn((s) => !s);
  const addTask = (text) => setTasks((prev) => [...prev, { id: uid(), text, done: false }]);
  const toggleTask = (id) => setTasks((prev) => prev.map((t) => { if (t.id !== id) return t; if (!t.done) playChime(soundOn); return { ...t, done: !t.done }; }));
  const removeTask = (id) => setTasks((prev) => prev.filter((t) => t.id !== id));
  const markLastRead = (bookName, chapter) => setLastRead({ bookName, chapter });
  const continueReading = () => { if (!lastRead) return; setBibleBook(BIBLE_BOOKS.find((b) => b.name === lastRead.bookName)); setBibleChapter(lastRead.chapter); setTab("biblia"); };
  const toggleFavoriteVerse = (bookName, chapter, verseNum, text) => setFavoriteVerses((prev) => {
    const exists = prev.some((f) => f.book === bookName && f.chapter === chapter && f.verse === verseNum);
    if (exists) return prev.filter((f) => !(f.book === bookName && f.chapter === chapter && f.verse === verseNum));
    return [...prev, { book: bookName, chapter, verse: verseNum, text }];
  });
  const signIn = (profile) => setUser(typeof profile === "string" ? { name: profile } : profile); const signOut = () => { if (supabaseReady) supabase.auth.signOut(); setUser(null); };

  // Inject fonts + keyframe animations once, instead of re-parsing this <style> block on every render
  useEffect(() => {
    if (document.getElementById("fd-styles")) return;
    const style = document.createElement("style");
    style.id = "fd-styles";
    style.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=Work+Sans:wght@400;500;600&display=swap');
      .fd-display { font-family: 'Fraunces', Georgia, 'Times New Roman', serif; }
      @keyframes fd-flicker { 0%,100%{transform:scale(1) rotate(0deg);} 25%{transform:scale(1.06,0.95) rotate(-2deg);} 50%{transform:scale(0.96,1.05) rotate(2deg);} 75%{transform:scale(1.03,0.97) rotate(-1deg);} }
      .fd-flicker { animation: fd-flicker 2.3s ease-in-out infinite; transform-origin: 50% 100%; }
      @keyframes fd-pulse { 0%,100%{opacity:0.5;} 50%{opacity:0.85;} }
      .fd-pulse { animation: fd-pulse 4s ease-in-out infinite; }
      @keyframes fd-spin { to { transform: rotate(360deg); } }
      .fd-spin { animation: fd-spin 0.8s linear infinite; }
      @keyframes fd-fadein { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
      .fd-fadein { animation: fd-fadein 0.28s ease-out; }
      .fd-scroll::-webkit-scrollbar { width: 4px; }
      .fd-scroll::-webkit-scrollbar-thumb { background: rgba(152,160,194,0.35); border-radius: 4px; }
    `;
    document.head.appendChild(style);
  }, []);

  const T = THEMES[themeName];
  const TITLES = { biblia: "Bíblia", louvor: "Louvor", agenda: "Agenda", mural: "Mural", ajuda: "Central de Apoio" };

  const supabaseReady = import.meta.env.VITE_SUPABASE_URL && !import.meta.env.VITE_SUPABASE_URL.includes("SEU-PROJETO");

  const mapSupabaseUser = (su) => {
    if (!su) { setUser(null); return; }
    setUser({
      name: su.user_metadata?.full_name || su.user_metadata?.name || su.email?.split("@")[0] || "Usuário",
      email: su.email,
      picture: su.user_metadata?.avatar_url || su.user_metadata?.picture,
      sub: su.id,
    });
  };

  // Supabase auth listener
  useEffect(() => {
    const isNative = typeof window !== "undefined" && window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform();
    if (isNative) {
      // Esconde a barra do sistema (bateria, hora, sinal) no app nativo
      try { NativeStatusBar.hide(); } catch { /* web */ }
    }
    if (!supabaseReady) return;
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) mapSupabaseUser(session.user);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      mapSupabaseUser(session?.user || null);
    });

    // Deep link (Android/iOS): quando o Google redireciona de volta ao app
    // via scheme customizado, captura o token e cria a sessão no Supabase.
    let appListener = null;
    if (typeof window !== "undefined" && window.Capacitor && window.Capacitor.Plugins?.App) {
      appListener = window.Capacitor.Plugins.App.addListener("appUrlOpen", async ({ url }) => {
        const hash = url.split("#")[1];
        if (!hash) return;
        const params = new URLSearchParams(hash);
        const accessToken = params.get("access_token");
        const refreshToken = params.get("refresh_token");
        if (accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
          if (error) console.error("Falha ao restaurar sessão no app:", error.message);
        }
      });
    }
    return () => { subscription?.unsubscribe(); appListener?.remove(); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const isNative = typeof window !== "undefined" && window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform();

  const inner = (
    <ThemeContext.Provider value={T}>
      <div className="w-full flex items-center justify-center" style={{ backgroundColor: T.canvas, fontFamily: "'Work Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", height: "100dvh", overflow: "hidden", padding: isNative ? 0 : "2.5rem 1rem" }}>
        <div className="relative" style={isNative ? { width: "100%", height: "100%" } : {}}>
          {!isNative && <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full blur-3xl fd-pulse" style={{ background: `radial-gradient(circle, ${T.accent}30 0%, transparent 70%)` }} />}
          <div className="relative w-full" style={isNative ? { height: "100%" } : { maxWidth: 384, margin: "0 auto", borderRadius: 24, padding: 8, backgroundColor: T.bezel, boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)" }}>
            <div className="relative overflow-hidden flex flex-col" style={{ backgroundColor: T.surface, height: isNative ? "100%" : 700, borderRadius: isNative ? 0 : 16 }}>
              <StatusBar theme={themeName} onToggleTheme={toggleTheme} />
              {tab === "home" ? (
                <div className="px-5 pt-1 pb-1 flex items-center gap-1.5">
                  <Flame size={14} style={{ color: T.accent }} />
                  <span className="fd-display text-sm tracking-wide" style={{ color: T.accent }}>FÉ DIÁRIA</span>
                  {isPremium && <Crown size={12} style={{ color: T.accent, marginLeft: 2 }} fill={T.accent} />}
                </div>
              ) : (<ScreenHeader title={TITLES[tab]} />)}

              <div key={tab} className="flex-1 overflow-y-auto fd-scroll fd-fadein">
                {tab === "home" && <HomeScreen verse={verse} onOpen={setModal} doneCount={completedDays.size} isPremium={isPremium} songOfDay={songOfDay} onGoLouvor={() => setTab("louvor")} lastRead={lastRead} onContinueReading={continueReading} user={user} onOpenProfile={() => setModal("profile")} />}
                {tab === "biblia" && <BibleScreen book={bibleBook} setBook={setBibleBook} chapter={bibleChapter} setChapter={setBibleChapter} cache={bibleCache} setCache={setBibleCache} version={bibleVersion} setVersion={setBibleVersion} favoriteVerses={favoriteVerses} toggleFavoriteVerse={toggleFavoriteVerse} lastRead={lastRead} onMarkLastRead={markLastRead} isPremium={isPremium} />}
                {tab === "louvor" && <MusicScreen favorites={favorites} toggleFavorite={toggleFavorite} songOfDay={songOfDay} isPremium={isPremium} />}
                {tab === "agenda" && <AgendaScreen completedDays={completedDays} toggleDay={toggleDay} tasks={tasks} addTask={addTask} toggleTask={toggleTask} removeTask={removeTask} journalText={journalText} setJournalText={setJournalText} journalSuggestion={journalSuggestion} setJournalSuggestion={setJournalSuggestion} onGoToPassage={onGoToPassage} isPremium={isPremium} />}
                {tab === "mural" && (isAdult ? <CommunityScreen user={user} hiddenPosts={hiddenPosts} onHidePost={onHidePost} likedPosts={likedPosts} onToggleLike={onToggleLike} /> : (
                  <div className="px-5 py-8 text-center">
                    <ShieldAlert size={28} style={{ color: T.accent }} className="mx-auto mb-3" />
                    <p className="text-sm font-medium mb-1.5" style={{ color: T.text }}>Disponível para maiores de 18</p>
                    <p className="text-xs leading-relaxed" style={{ color: T.textMuted }}>O mural e as mensagens envolvem contato com outras pessoas, por isso ficam reservados a contas de adultos.</p>
                  </div>
                ))}
                {tab === "ajuda" && <HelpScreen isPremium={isPremium} onOpenPremium={() => setModal("premium")} soundOn={soundOn} onToggleSound={toggleSound} onOpenTerms={() => setModal("terms")} onExportData={exportMyData} onDeleteData={deleteMyData} ageBracket={ageBracket} />}
              </div>

              <BottomNav active={tab} onChange={setTab} />
              <div className="flex justify-center py-2" style={{ backgroundColor: T.card }}><div className="w-28 h-1 rounded-full" style={{ backgroundColor: T.text, opacity: 0.3 }} /></div>

              {modal === "oracao" && <PrayerModal prayer={prayer} prayed={prayedToday} onMarkPrayed={markPrayed} onClose={() => setModal(null)} />}
              {modal === "momento" && <MomentModal moment={moment} onClose={() => setModal(null)} />}
              {modal === "reflexao" && <ReflectionModal question={reflection} text={reflectionText} setText={setReflectionText} onClose={() => setModal(null)} />}
              {modal === "premium" && <PremiumModal isPremium={isPremium} onBuy={() => { setIsPremium(true); playChime(soundOn, "premium"); }} onRestore={() => setIsPremium(false)} onClose={() => setModal(null)} />}
              {modal === "profile" && <ProfileModal user={user} onSignIn={(n) => { signIn(n); setModal(null); }} onSignOut={() => { signOut(); setModal(null); }} onClose={() => setModal(null)} />}
              {modal === "terms" && <TermsModal onAccept={() => setModal(null)} onClose={() => setModal(null)} canDismiss={true} />}

              {ready && !termsAccepted && (
                <div className="absolute inset-0 z-50">
                  <TermsModal onAccept={acceptTerms} canDismiss={false} />
                </div>
              )}

              {splashPhase !== "gone" && (
                <div className="absolute inset-0 z-40 flex flex-col items-center justify-center gap-3" style={{ backgroundColor: T.surface, opacity: splashPhase === "out" ? 0 : 1, transition: "opacity 0.4s ease", pointerEvents: "none" }}>
                  <div className="relative flex items-center justify-center" style={{ height: 70 }}>
                    <div className="absolute w-20 h-20 rounded-full blur-2xl fd-pulse" style={{ backgroundColor: T.accent, opacity: 0.4 }} />
                    <Flame size={40} style={{ color: T.accent }} className="fd-flicker" />
                  </div>
                  <span className="fd-display text-base tracking-wide" style={{ color: T.accent }}>FÉ DIÁRIA</span>
                  <Sparkles size={12} style={{ color: T.textMuted }} />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </ThemeContext.Provider>
  );

  return inner;
}
