
document.addEventListener("DOMContentLoaded", function () {
  const modules = document.querySelectorAll(".accordions-module");

  // Add click event listener to each module
  for (let i = 0; i < modules.length; i++) {
    modules[i].addEventListener("click", onClickAccordion);
    modules[i].addEventListener("keydown", onKeydownAccordion);
  }

  // Set the first accordion as active by default
  const firstAccordion = modules[0].querySelector(".accordion");
  const firstImage = modules[0].querySelector(".wrapper-image img:first-child");
  if (firstAccordion) {
    firstAccordion.classList.add("active");
    const content = firstAccordion.querySelector(".accordion-content");
    content.style.maxHeight = content.scrollHeight + "px";
    if (firstImage){
      const wrapperImage = modules[0].querySelector(".wrapper-image");
      wrapperImage.style.height = firstImage.offsetHeight + "px";
    }
  }

  /**
   * Handle the click event on the module to toggle the accordion
   * @param {Event} event - The click event
   */
  function onClickAccordion(event) {
    const accordion = event.target.closest(".accordion");
    if (accordion && this.contains(accordion)) {
      // Prevent closing the active accordion
      if (!accordion.classList.contains("active")) {
        toggleAccordion(accordion, this);
      }
    }
  }

  /**
   * Handle the keydown event on the module to toggle the accordion with Enter key
   * @param {Event} event - The keydown event
   */
  function onKeydownAccordion(event) {
    if (event.key === "Enter" || event.key === " ") {
      const accordion = event.target.closest(".accordion");
      if (accordion && this.contains(accordion)) {
        // Prevent closing the active accordion
        if (!accordion.classList.contains("active")) {
          toggleAccordion(accordion, this);
        }
      }
    }
  }

  /**
   * Toggle the active state of an accordion and its content
   * @param {HTMLElement} accordion - The accordion element to toggle
   * @param {HTMLElement} module - The parent module containing all accordions
   */
  function toggleAccordion(accordion, module) {
    const content = accordion.querySelector(".accordion-content");
    const index = accordion.dataset.key;
    const images = module.querySelectorAll(".wrapper-image img");
    const wrapperImage = module.querySelector(".wrapper-image");

    deactivateOtherAccordions(accordion, module);

    accordion.classList.toggle("active");

    images.forEach((img, idx) => {
      if (idx == parseInt(index)-1) {
        img.classList.toggle("active", accordion.classList.contains("active"));
        if (accordion.classList.contains("active")) {
          wrapperImage.style.height = img.offsetHeight + "px";
        }
      } else {
        img.classList.remove("active");
      }
    });

    if (accordion.classList.contains("active")) {
      content.style.maxHeight = content.scrollHeight + "px";
    } else {
      content.style.maxHeight = null;
    }
  }

  /**
   * Deactivate all other active accordions within a module
   * @param {HTMLElement} activeaccordion - The accordion that triggered the event
   * @param {HTMLElement} module - The parent module containing all accordions
   */
  function deactivateOtherAccordions(activeaccordion, module) {
    const activeAccordions = module.querySelectorAll(".accordion.active");
    for (let j = 0; j < activeAccordions.length; j++) {
      const accordion = activeAccordions[j];
      if (accordion !== activeaccordion) {
        accordion.classList.remove("active");
        accordion.querySelector(".accordion-content").style.maxHeight = null;
      }
    }
  }
});
