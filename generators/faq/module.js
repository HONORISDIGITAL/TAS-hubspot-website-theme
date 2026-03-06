document.addEventListener("DOMContentLoaded", function () {
  const modules = document.querySelectorAll(".faq-module");

  // Add click event listener to each module
  for (let i = 0; i < modules.length; i++) {
    modules[i].addEventListener("click", onClickAccordion);
    modules[i].addEventListener("keydown", onKeydownAccordion);
  }

  /**
   * Handle the click event on the module to toggle the accordion
   * @param {Event} event - The click event
   */
  function onClickAccordion(event) {
    const accordion = event.target.closest(".accordion");
    if (accordion && this.contains(accordion)) {
      toggleAccordion(accordion, this);
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
        toggleAccordion(accordion, this);
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

    deactivateOtherAccordions(accordion, module);

    accordion.classList.toggle("active");

    if (accordion.classList.contains("active")) {
      content.style.maxHeight = content.scrollHeight + "px";
    } else {
      content.style.maxHeight = null;
    }
  }

  /**
   * Deactivate all other active accordions within a module
   * @param {HTMLElement} activeAccordion - The accordion that triggered the event
   * @param {HTMLElement} module - The parent module containing all accordions
   */
  function deactivateOtherAccordions(activeAccordion, module) {
    const activeAccordions = module.querySelectorAll(".accordion.active");
    for (let j = 0; j < activeAccordions.length; j++) {
      const accordion = activeAccordions[j];
      if (accordion !== activeAccordion) {
        accordion.classList.remove("active");
        accordion.querySelector(".accordion-content").style.maxHeight = null;
      }
    }
  }
});