const sharp = require("sharp");

let originalImage = "./src/assets/rpg-icons.png";

let count;
let left = 0;
let top = 0;

for (count = 0; count < 284; count++) {
  let outputImage = `./src/assets/rpg-icons/${count + 1}.png`;

  sharp(originalImage)
    .extract({ width: 32, height: 32, left, top })
    .toFile(outputImage)
    .then(function () {
      console.log(`Image cropped and saved - ${outputImage}`);
    })
    .catch(function (err) {
      console.log("An error occured");
      console.log(err);
    });

  left += 32;

  if (top === 0 && left > 32 * 10) {
    left = 0;
    top += 32;
  } else if (top === 32 && left > 32 * 4) {
    left = 0;
    top += 32;
  } else if (top === 32 * 2 && left > 32 * 6) {
    left = 0;
    top += 32;
  } else if (top === 32 * 4 && left > 32 * 8) {
    left = 0;
    top += 32;
  } else if (top === 32 * 6 && left > 32 * 11) {
    left = 0;
    top += 32;
  } else if (top === 32 * 8 && left > 32 * 9) {
    left = 0;
    top += 32;
  } else if (top === 32 * 15 && left > 32 * 14) {
    left = 0;
    top += 32;
  } else if (top === 32 * 16 && left > 32 * 14) {
    left = 0;
    top += 32;
  } else if (top === 32 * 17 && left > 32 * 10) {
    left = 0;
    top += 32;
  } else if (top === 32 * 18 && left > 32 * 5) {
    left = 0;
    top += 32;
  } else if (top === 32 * 19 && left > 32 * 11) {
    left = 0;
    top += 32;
  } else if (top === 32 * 20 && left > 32 * 12) {
    left = 0;
    top += 32;
  } else if (top === 32 * 21 && left > 32 * 13) {
    left = 0;
    top += 32;
  } else if (left > 32 * 15) {
    left = 0;
    top += 32;
  }
}
