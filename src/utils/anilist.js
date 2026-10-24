const axios = require("axios");

const API_URL = "https://graphql.anilist.co";
const REQUEST_TIMEOUT = 15_000;
const USER_AGENT =
  "JasmineBot/2.1.4 (+https://github.com/MiraBellierr/jasmine)";

const MEDIA_FIELDS = `
  id
  title { romaji english native }
  description(asHtml: false)
  format
  episodes
  chapters
  volumes
  status
  averageScore
  popularity
  favourites
  duration
  startDate { year month day }
  endDate { year month day }
  studios(isMain: true) { nodes { name } }
  staff(perPage: 4) { edges { role node { name { full } } } }
  genres
  siteUrl
  coverImage { large }
`;

const CHARACTER_FIELDS = `
  id
  name { full native alternative }
  description(asHtml: false)
  favourites
  siteUrl
  image { large }
  media(perPage: 6) {
    nodes {
      title { romaji english native }
      type
    }
  }
`;

const QUERIES = {
  searchMedia: `query ($search: String!, $type: MediaType!, $perPage: Int!) {
    Page(perPage: $perPage) {
      media(search: $search, type: $type, isAdult: false, sort: SEARCH_MATCH) {
        ${MEDIA_FIELDS}
      }
    }
  }`,
  searchCharacters: `query ($search: String!, $perPage: Int!) {
    Page(perPage: $perPage) {
      characters(search: $search) {
        ${CHARACTER_FIELDS}
      }
    }
  }`,
  topMedia: `query ($type: MediaType!, $perPage: Int!) {
    Page(perPage: $perPage) {
      media(type: $type, isAdult: false, sort: SCORE_DESC) {
        ${MEDIA_FIELDS}
      }
    }
  }`,
  topCharacters: `query ($perPage: Int!) {
    Page(perPage: $perPage) {
      characters(sort: FAVOURITES_DESC) {
        ${CHARACTER_FIELDS}
      }
    }
  }`,
};

const STATUS_LABELS = {
  FINISHED: "Finished",
  RELEASING: "Ongoing",
  NOT_YET_RELEASED: "Upcoming",
  CANCELLED: "Cancelled",
  HIATUS: "Hiatus",
};

const FORMAT_LABELS = {
  TV: "TV",
  TV_SHORT: "TV Short",
  MOVIE: "Movie",
  SPECIAL: "Special",
  OVA: "OVA",
  ONA: "ONA",
  MUSIC: "Music",
  MANGA: "Manga",
  NOVEL: "Novel",
  ONE_SHOT: "One shot",
};

async function request(query, variables) {
  const response = await axios.post(
    API_URL,
    { query, variables },
    {
      timeout: REQUEST_TIMEOUT,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "User-Agent": USER_AGENT,
      },
    },
  );

  if (Array.isArray(response.data?.errors) && response.data.errors.length) {
    const error = new Error(
      response.data.errors[0]?.message || "AniList request failed",
    );
    error.response = response;
    throw error;
  }

  return response.data?.data;
}

const cleanDescription = (value) => {
  const text = String(value || "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/?[^>]+>/g, "")
    .replace(/~!|!~/g, "")
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return text || null;
};

const formatDate = (parts) => {
  if (!parts?.year) {
    return null;
  }

  if (!parts.month || !parts.day) {
    return String(parts.year);
  }

  const month = String(parts.month).padStart(2, "0");
  const day = String(parts.day).padStart(2, "0");
  return `${parts.year}-${month}-${day}`;
};

const mediaTitle = (title) =>
  title?.english || title?.romaji || title?.native || "Untitled";

const normalizeMedia = (media) => {
  const authors = (media.staff?.edges || [])
    .filter((edge) => /story|art/i.test(edge.role || ""))
    .map((edge) => ({ name: edge.node?.name?.full }))
    .filter((author) => author.name)
    .slice(0, 5);

  return {
    id: media.id,
    title: mediaTitle(media.title),
    url: media.siteUrl || null,
    image: media.coverImage?.large || null,
    synopsis: cleanDescription(media.description),
    type: FORMAT_LABELS[media.format] || media.format || null,
    episodes: media.episodes ?? null,
    chapters: media.chapters ?? null,
    volumes: media.volumes ?? null,
    status: STATUS_LABELS[media.status] || media.status || null,
    score:
      typeof media.averageScore === "number" ? media.averageScore / 10 : null,
    members: media.popularity ?? null,
    favorites: media.favourites ?? null,
    duration: media.duration ? `${media.duration} min` : null,
    aired: {
      from: formatDate(media.startDate),
      to: formatDate(media.endDate),
    },
    published: {
      from: formatDate(media.startDate),
      to: formatDate(media.endDate),
    },
    studios: (media.studios?.nodes || [])
      .map((studio) => ({ name: studio.name }))
      .filter((studio) => studio.name),
    authors,
    genres: (media.genres || []).map((genre) => ({ name: genre })),
  };
};

const normalizeCharacter = (character) => {
  const media = (character.media?.nodes || [])
    .map((entry) => ({
      title: mediaTitle(entry.title),
      type: entry.type,
    }))
    .filter((entry) => entry.title !== "Untitled");

  return {
    id: character.id,
    name: character.name?.full || "Untitled",
    nameNative: character.name?.native || null,
    favorites: character.favourites ?? null,
    nicknames: (character.name?.alternative || []).filter(Boolean),
    about: cleanDescription(character.description),
    image: character.image?.large || null,
    url: character.siteUrl || null,
    anime: media
      .filter((entry) => entry.type === "ANIME")
      .map((entry) => ({ anime: { title: entry.title } })),
    manga: media
      .filter((entry) => entry.type === "MANGA")
      .map((entry) => ({ manga: { title: entry.title } })),
  };
};

async function search(type, query, limit = 8) {
  if (type === "characters") {
    const data = await request(QUERIES.searchCharacters, {
      search: query,
      perPage: limit,
    });
    return (data?.Page?.characters || [])
      .filter((character) => character?.id)
      .map(normalizeCharacter)
      .slice(0, limit);
  }

  const data = await request(QUERIES.searchMedia, {
    search: query,
    type: type === "manga" ? "MANGA" : "ANIME",
    perPage: limit,
  });

  return (data?.Page?.media || [])
    .filter((media) => media?.id)
    .map(normalizeMedia)
    .slice(0, limit);
}

async function top(type, limit = 10) {
  if (type === "characters") {
    const data = await request(QUERIES.topCharacters, { perPage: limit });
    return (data?.Page?.characters || [])
      .filter((character) => character?.id)
      .map(normalizeCharacter)
      .slice(0, limit);
  }

  const data = await request(QUERIES.topMedia, {
    type: type === "manga" ? "MANGA" : "ANIME",
    perPage: limit,
  });

  return (data?.Page?.media || [])
    .filter((media) => media?.id)
    .map(normalizeMedia)
    .slice(0, limit);
}

module.exports = {
  search,
  top,
  cleanDescription,
};
