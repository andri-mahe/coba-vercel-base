const slides = Array.from(document.querySelectorAll(".slide"));
const slideList = document.querySelector("#slideList");
const progressBar = document.querySelector("#progressBar");
const prevBtn = document.querySelector("#prevBtn");
const nextBtn = document.querySelector("#nextBtn");

let current = 0;

slides.forEach((slide, index) => {
  const item = document.createElement("li");
  const button = document.createElement("button");
  button.type = "button";
  button.innerHTML = `<span>${slide.dataset.title}</span><small>${String(index + 1).padStart(2, "0")}</small>`;
  button.addEventListener("click", () => goTo(index));
  item.appendChild(button);
  slideList.appendChild(item);
});

function goTo(index) {
  current = Math.max(0, Math.min(slides.length - 1, index));

  slides.forEach((slide, slideIndex) => {
    slide.classList.toggle("active", slideIndex === current);
  });

  Array.from(slideList.querySelectorAll("button")).forEach((button, buttonIndex) => {
    button.classList.toggle("active", buttonIndex === current);
  });

  const progress = ((current + 1) / slides.length) * 100;
  progressBar.style.width = `${progress}%`;
  prevBtn.disabled = current === 0;
  nextBtn.disabled = current === slides.length - 1;
  document.title = `${current + 1}/${slides.length} - ${slides[current].dataset.title}`;
}

prevBtn.addEventListener("click", () => goTo(current - 1));
nextBtn.addEventListener("click", () => goTo(current + 1));

document.addEventListener("keydown", (event) => {
  if (event.key === "ArrowRight" || event.key === " ") {
    event.preventDefault();
    goTo(current + 1);
  }

  if (event.key === "ArrowLeft") {
    event.preventDefault();
    goTo(current - 1);
  }

  if (event.key === "Home") {
    event.preventDefault();
    goTo(0);
  }

  if (event.key === "End") {
    event.preventDefault();
    goTo(slides.length - 1);
  }
});

goTo(0);
