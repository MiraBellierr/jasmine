const axios = require("axios");
const fs = require("fs");
const characters = require("./src/database/json/characters.json");
let id = 1;

function get() {
  if (characters[id]) {
    console.log(`skipped fetch ${id}`);
    id++;
    get();
  } else {
    axios({
      method: "get",
      url: `https://api.jikan.moe/v4/characters/${id}`,
    }).then(
      (res) => {
        try {
          characters[id] = {
            name: res.data.data.name,
            image: res.data.data.images.jpg.image_url,
          };

          fs.writeFileSync(
            "./src/database/json/characters.json",
            JSON.stringify(characters, null, 2),
            (err) => {
              if (err) {
                console.log("An error occured", err);
              }
            }
          );
          console.log(`Sucessfully fetch ${id}: ${res.data.data.name}`);

          id++;

          setTimeout(get, 1000);
        } catch (err) {
          console.log(`Error: fetch ${id} - ${err.message}`);
          setTimeout(get, 1000);
        }
      },
      (err) => {
        console.log(`Error: fetch ${id} - ${err.message}`);

        if (err.message.includes("404")) {
          id++;
          setTimeout(get, 1000);
        } else {
          setTimeout(get, 1000);
        }
      }
    );
  }
}

get();
