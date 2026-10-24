[![Discord](https://img.shields.io/discord/1136390342321651712?color=blue&label=Support&logo=discord&logoColor=white&style=plastic)](https://discord.gg/t4H7zVXwzc)
![GitHub commit activity](https://img.shields.io/github/commit-activity/m/MiraBellierr/jasmine?logo=github&style=plastic)
![Contributor](https://img.shields.io/github/contributors/MiraBellierr/jasmine?color=blue&logo=github&style=plastic)
![Issue](https://img.shields.io/github/issues-closed/MiraBellierr/jasmine?color=blue&logo=github&style=plastic)<br>
![Donation](https://img.shields.io/github/sponsors/MiraBellierr?color=blue&label=Patreon&logo=patreon&style=plastic)

<img width="120" height="120" align="left" style="float: left; margin: 0 10px 0 0;" alt="jasmine" src="https://cdn.discordapp.com/attachments/873441703330185250/1004738366912348210/d8f6a7c57082620bb61ab4fdf5cc671a.jpg">

# Jasmine

Jasmine is a Discord bot written in Javascript developed by Mirabellier for fun. Containing 100+ commands from different categories.

## About

Jasmine is a simple RPG Discord bot developed by Mirabellier for fun. You can invite it to your Discord server by clicking [this link](https://discord.com/api/oauth2/authorize?client_id=969633016089546763&permissions=0&scope=bot%20applications.commands)! You can also join the [support server](https://discord.gg/t4H7zVXwzc) for all questions, suggestions, and assistance! It comes packaged with a variety of fun commands and utility commands that can be useful for your server.

## Features

- **Utility**: `giveaway`, `announce`, `poll`, `searchimage` and more
- **Anime**: `anime`, `quote`, `topanime`, `starrail`
- **Info**: `avatar`, `botinfo`, `roleinfo`, `servericon` and more
- **Roleplay**: `bite`, `blush`, `clap`, `cry` and more
- **meme**: `meme`
- **rpg**: `register`, `battle`, `profile` and more
- **moderation**: `logging`, `purge`

## Links

- **[Support server](https://discord.gg/t4H7zVXwzc)** - Ask questions and get help with Jasmine
- **[Invite](https://discord.com/api/oauth2/authorize?client_id=969633016089546763&permissions=0&scope=bot%20applications.commands)** - Invite Jasmine to your server
- **[Donation](https://www.patreon.com/jasminebot)** - help me with funding

## Running

Copy `.env.example` to `.env` and fill in `TOKEN`. Then run `npm start`.

The bot starts a shard manager. It uses the shard count Discord recommends by default. Set `SHARD_COUNT` in `.env` to a whole number to override it.

## Contributing

You may contribute to the jasmine repo. I would appreciate it if you do so and help me with the development.

## Thanks To

- **[Z3RYX](https://github.com/Z3RYX)**: RPG Algorithms and Optimization
- **[ySnoopyDogy](https://github.com/ySnoopyDogy)**: Code Optimization
- **[dchu096](https://github.com/dchu096)**: Console and Output
- **[nemoisafish](https://github.com/nemoisafish)**: Graphics Design and Business
- **[devYamato](https://github.com/devYamato)**: Website Developer

## Quote data

The quote command reads from `src/database/json/quotes.json`, so it works without a quote API or rate limit. The library has 7,301 quotes from 793 anime. The data comes from [cf-anime-quotes](https://github.com/aynh/cf-anime-quotes), which is licensed under the WTFPL.

## Star Rail data

The starrail command gets player profiles from [Enka.Network](https://enka.network). Character and light cone names come from a bundled copy of [StarRailRes](https://github.com/Mar-7th/StarRailRes) in `src/database/json/starrail.json`.

Profile and character cards are drawn locally with `@napi-rs/canvas`. The bundled Noto Sans fonts are licensed under the SIL Open Font License, with the license text in `src/assets/fonts/OFL.txt`.

## Assets

- [Shikashi's Fantasy Icons Pack](https://cheekyinkling.itch.io/shikashis-fantasy-icons-pack)
