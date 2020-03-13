const canvas = document.getElementById("canvas");
const c = canvas.getContext("2d");

const slideDeck = document.querySelector(".slide-group");
const prevButton = document.getElementById("prev");
const nextButton = document.getElementById("next");

const numberOfSlides = 13;
let slideNumber = 0;

let wideScreen = false;

function onClick(event) {
  hideButton();
  if (event.target === prevButton) {
    changeSlide(false);
  } else if (event.target === nextButton) {
    changeSlide(true);
  }
}

function onTransitionEnd(event) {
  showButton();
}

function changeSlide(next) {
  slideNumber = next ? slideNumber + 1 : slideNumber - 1;
  slideNumber = slideNumber < 0 ? 0 : slideNumber;
  slideNumber =
    slideNumber == numberOfSlides ? numberOfSlides - 1 : slideNumber;
  slideDeck.style.transform = wideScreen
    ? `translateX(calc(-${100 * slideNumber}vw)`
    : `translateY(calc(-${100 * slideNumber}vh)`;
}

function hideButton() {
  prevButton.style.display = "none";
  nextButton.style.display = "none";
}

function showButton() {
  prevButton.style.display = slideNumber > 0 ? "flex" : "none";
  nextButton.style.display = slideNumber < numberOfSlides - 1 ? "flex" : "none";
}

function rePaint() {
  c.beginPath();
  c.arc(0, 0, 200, 0, Math.PI * 2, false);
  c.fillStyle = "orangered";
  c.fill();
}

function onResize(event) {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  canvas.setAttribute("width", window.innerWidth);
  canvas.setAttribute("height", window.innerHeight);
  wideScreen = window.innerWidth > window.innerHeight;
  rePaint();
}

window.addEventListener("resize", onResize);
prevButton.addEventListener("click", onClick);
nextButton.addEventListener("click", onClick);
slideDeck.addEventListener("transitionend", onTransitionEnd);

onResize();
showButton();
