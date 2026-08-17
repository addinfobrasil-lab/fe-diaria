const fs = require("fs");
const path = require("path");

const SOURCE = "https://raw.githubusercontent.com/thiagobodruk/biblia/master/json/aa.json";

const BOOK_ABBREV = {
  "Gênesis": "gn", "Êxodo": "ex", "Levítico": "lv", "Números": "nm",
  "Deuteronômio": "dt", "Josué": "js", "Juízes": "jz", "Rute": "rt",
  "1 Samuel": "1sm", "2 Samuel": "2sm", "1 Reis": "1rs", "2 Reis": "2rs",
  "1 Crônicas": "1cr", "2 Crônicas": "2cr", "Esdras": "ed", "Neemias": "ne",
  "Ester": "et", "Jó": "jó", "Salmos": "sl", "Provérbios": "pv",
  "Eclesiastes": "ec", "Cantares": "ct", "Isaías": "is", "Jeremias": "jr",
  "Lamentações": "lm", "Ezequiel": "ez", "Daniel": "dn", "Oséias": "os",
  "Joel": "jl", "Amós": "am", "Obadias": "ob", "Jonas": "jn",
  "Miquéias": "mq", "Naum": "na", "Habacuque": "hc", "Sofonias": "sf",
  "Ageu": "ag", "Zacarias": "zc", "Malaquias": "ml",
  "Mateus": "mt", "Marcos": "mc", "Lucas": "lc", "João": "jo",
  "Atos": "atos", "Romanos": "rm", "1 Coríntios": "1co", "2 Coríntios": "2co",
  "Gálatas": "gl", "Efésios": "ef", "Filipenses": "fp", "Colossenses": "cl",
  "1 Tessalonicenses": "1ts", "2 Tessalonicenses": "2ts", "1 Timóteo": "1tm",
  "2 Timóteo": "2tm", "Tito": "tt", "Filemom": "fm", "Hebreus": "hb",
  "Tiago": "tg", "1 Pedro": "1pe", "2 Pedro": "2pe", "1 João": "1jo",
  "2 João": "2jo", "3 João": "3jo", "Judas": "jd", "Apocalipse": "ap",
};

function clean(text) {
  return text
    .replace(/\s+/g, " ")
    .replace(/\u00A0/g, " ")
    .replace(/[«»]/g, "")
    .replace(/\u2014/g, "—")
    .trim();
}

async function main() {
  console.log("Baixando dataset completo...");
  const res = await fetch(SOURCE);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  console.log(`Livros no dataset: ${data.length}`);

  const result = {};
  const abbrevToName = Object.fromEntries(Object.entries(BOOK_ABBREV).map(([n, a]) => [a, n]));
  data.forEach((book) => {
    const name = abbrevToName[book.abbrev];
    if (!name) { console.log(`ignorando livro desconhecido: ${book.abbrev} ${book.name}`); return; }
    (book.chapters || []).forEach((chapterVerses, idx) => {
      const verses = chapterVerses
        .map((t, i) => ({ v: i + 1, t: clean(t) }))
        .filter((v) => v.t);
      if (verses.length) result[`${name}-${idx + 1}`] = verses;
    });
  });

  const totalChapters = Object.keys(result).length;
  console.log(`Total: ${totalChapters} capítulos`);

  const lines = [];
  lines.push("// Bíblia completa (Almeida Atualizada — João Ferreira de Almeida, domínio público).");
  lines.push("// Gerado a partir de https://github.com/thiagobodruk/biblia (json/aa.json).");
  lines.push("// Cobre TODOS os livros e capítulos para leitura 100% offline.");
  lines.push("export const BIBLE_FALLBACK = {");
  Object.entries(result).forEach(([key, verses]) => {
    const body = verses.map((v) => `{ v: ${v.v}, t: ${JSON.stringify(v.t)} }`).join(", ");
    lines.push(`  ${JSON.stringify(key)}: [${body}],`);
  });
  lines.push("};");
  lines.push("");
  lines.push(`export const BIBLE_FALLBACK_COUNT = ${totalChapters};`);

  const out = path.join(__dirname, "..", "src", "data", "bible-fallback.js");
  fs.writeFileSync(out, lines.join("\n"), "utf8");
  console.log(`Arquivo gerado: ${out} (${(fs.statSync(out).size / 1024).toFixed(0)} KB)`);
}

main().catch((e) => { console.error("ERRO:", e.message); process.exit(1); });