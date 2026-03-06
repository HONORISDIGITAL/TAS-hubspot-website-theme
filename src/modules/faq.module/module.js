document.addEventListener("DOMContentLoaded", function () {
    const modules = document.querySelectorAll(".faq-module");
    
    // Add click event listener to each module
    for (let i = 0; i < modules.length; i++) {
      modules[i].addEventListener("click", onClickAccordion);
      modules[i].addEventListener("keydown", onKeydownAccordion);
      
      // Activate the first accordion by default
      const firstAccordion = modules[i].querySelector(".accordion");
      if (firstAccordion) {
      toggleAccordion(firstAccordion, modules[i]);
      }
    }
    
    // Rest of your functions remain the same
    function onClickAccordion(event) {
      const accordion = event.target.closest(".accordion");
      if (accordion && this.contains(accordion)) {
      toggleAccordion(accordion, this);
      }
    }
    
    function onKeydownAccordion(event) {
      if (event.key === "Enter" || event.key === " ") {
      const accordion = event.target.closest(".accordion");
      if (accordion && this.contains(accordion)) {
        toggleAccordion(accordion, this);
      }
      }
    }
    
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
  