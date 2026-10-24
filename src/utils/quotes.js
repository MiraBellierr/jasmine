const data = require("../database/json/quotes.json");

const normalize = (value) =>
  String(value || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const QUOTES = (data.quotes || [])
  .filter((quote) => quote?.anime && quote?.character && quote?.content)
  .map((quote) => ({
    anime: quote.anime,
    character: quote.character,
    content: quote.content,
    search: normalize(quote.anime),
  }));

function randomQuote(filter, exclude) {
  const hasFilter = String(filter || "").trim().length > 0;
  const needle = normalize(filter);
  const pool = hasFilter
    ? needle
      ? QUOTES.filter((quote) => quote.search.includes(needle))
      : []
    : QUOTES;
  const candidates = exclude
    ? pool.filter((quote) => quote.content !== exclude)
    : pool;

  if (!candidates.length) {
    return null;
  }

  const picked = candidates[Math.floor(Math.random() * candidates.length)];

  return {
    anime: picked.anime,
    character: picked.character,
    content: picked.content,
  };
}

module.exports = {
  randomQuote,
  count: QUOTES.length,
  source: data.source || null,
  license: data.license || null,
};
