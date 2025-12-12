const xHtml = [`<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>

    @import url('https://fonts.googleapis.com/css2?family=Ubuntu&display=swap');

    * {
      box-sizing: border-box;
      font-family: 'Ubuntu', sans-serif;
    }

    body {
      background: #323338;
      width: 1920px;
      height: 1080px;
    }
  </style>

  <script>
    document.addEventListener("DOMContentLoaded", () => {
      const card = document.querySelector(".card")

      card.style.minWidth = (card.offsetHeight * 1.5) + "px"
    })
  </script>
</head>

<body>

<div class="card"
     style="background: #1c1a2c; border: 1px solid rgba(255,255,255, .2); border-radius: .5rem; font-size: 1rem; color: rgba(255,255,255, .5); width: 25%;">
`, `</div></body></html>`];

const header = [`<div class="card__header"
style="padding: .5rem 1rem; border-bottom: 1px solid rgba(255,255,255, .2); display: flex; align-items: center; justify-content: space-between">`, `</div>`];

const body = [`<div class="card__body" style="padding: .5rem 1rem;">`, `</div>`];

const footer = [`<div class="card__footer" style="padding: .5rem 1rem; border-top: 1px solid rgba(255,255,255, .2);">`, `</div>`];

const headerWrapper = [`<div class="card__wrapper" style="">`, `</div>`]; // display: flex

const headerIcon = [`<span class="card__icon"
style="font-size: 1rem; line-height: 1; border-radius: 1rem; overflow: hidden; margin-right: .5rem; color: rgba(255,255,255, 1); display: flex; justify-content: center; align-items:center">PLACEHOLDER_value*`, `</span>`]

const headerTitle = [`<span class="card__title" style="margin-right: .5rem">PLACEHOLDER_value*`, `</span>`];

const label = [`<span class="card__label"
style="font-size: .75rem; padding: .25rem; background: rgba(255,255,255, .1); border-radius: .5rem">PLACEHOLDER_value*`, `</span>`];

const footerIcon = [`<span class="card__icon"
style="width: 1rem; height: 1rem; border-radius: 1rem; overflow: hidden; margin-right: .5rem;color: rgba(255,255,255, 1);">PLACEHOLDER_value*`, `</span>`];
const footerTitle = [`<span class="card__title">PLACEHOLDER_value*`, `</span>`];

const divider = [`<div class="card__divider"
style="margin-right: -1rem; margin-left: -1rem; border-bottom: 1px solid rgba(255,255,255, .2); margin-bottom: .5rem; margin-top: .5rem;">`, `</div>`];

const description = [`<p class="card__text" style="margin: .25rem 0; padding: 0; font-size: 1rem; color: rgba(255,255,255, .5)">PLACEHOLDER_value*`, `</p>`];

const title = [`<h1 class="card__heading" style="margin: .25rem 0; padding: 0; font-size: 1.25rem; color: rgba(255,255,255, 1)">PLACEHOLDER_value*`, `</h1>`];

const subTitle = [`<h1 class="card__sub-heading"
style="margin: .25rem 0; padding: 0; font-size: 1rem; color: rgba(255,255,255, .75); font-style: italic;">PLACEHOLDER_value*`, `</h1>`];

const progressBar = [`<div class="card__progress-bar" style="position: relative">
<div class="card__progress-bar-bg"
  style="height: 1rem; background: rgba(255,255,255, .1); border-radius: .5rem"></div>
<div class="card__progress-bar"
  style="height: 1rem; background: #70ffb2; border-radius: .5rem; position: absolute; z-index: 2; width: PLACEHOLDER_value*%; top: 0">
</div>`, `</div>`, {
    label: `<span class="card__progress-bar-label"
style="font-size: .75rem; border-radius: .5rem; position: absolute; top: 0; left: calc(PLACEHOLDER_value*% + .5rem); z-index: 3;">PLACEHOLDER_value*%</span>` }];


const htmlItems = {
  xHtml,
  header,
  body,
  footer,
  headerWrapper,
  headerIcon,
  headerTitle,
  label,
  footerIcon,
  footerTitle,
  divider,
  description,
  title,
  subTitle,
  progressBar
};

// Info
// This code is from the early days of our bot's development and is now considered outdated. 
// It was originally used to create Cards, which were used as embeds.
// However, as our bot has evolved, we are transitioning to a more advanced and efficient system using discord-embeds.
// The embeds will replace the Cards, providing a richer, more interactive experience.
// ~Nicusch

module.exports = { htmlItems };