document.addEventListener("DOMContentLoaded", function () {
  const modules = document.getElementsByClassName("tabs-module");
  for (let i = 0; i < modules.length; i++) {
    const module = modules[i];
    const tabLinks = module.querySelectorAll(".tab-link");
    const dropdown = module.querySelector(".dropdown");
    const wrapperTabs = module.querySelector(".wrapper-tabs");
    const tabs = module.querySelectorAll(".tab");

    /**
     * Set the height of the parent element to the height of the tallest tab
     * @param {HTMLElement} wrapperParent - The parent element (wrapper) containing all tabs
     * @param {NodeList} elements - A NodeList of tab elements to measure
     */
    function setHeight(wrapperParent, elements) {
      let maxHeight = 0;

      for (let i = 0; i < elements.length; i++) {
        const elementHeight = elements[i].offsetHeight;

        if (elementHeight > maxHeight) {
          maxHeight = elementHeight;
        }
      }

      wrapperParent.style.height = `${maxHeight}px`;
    }
    setHeight(wrapperTabs, tabs);

    /**
     * Deactivate all links and elements
     * @param {NodeList} links - The collection of link elements
     * @param {NodeList} elements - The collection of content elements
     */
    function deactivateAll(links, elements) {
      for (let j = 0; j < links.length; j++) {
        links[j].classList.remove("active");
        elements[j].classList.remove("active");
      }
    }

    /**
     * Activate the clicked link
     * @param {HTMLElement} link - The link element to activate
     */
    function activateLink(link) {
      link.classList.add("active");
    }

    /**
     * Activate the corresponding content element
     * @param {NodeList} elements - The collection of content elements
     * @param {string} dataLink - The data attribute value to match
     */
    function activateElement(elements, dataLink) {
      for (let j = 0; j < elements.length; j++) {
        if (elements[j].dataset.index === dataLink) {
          elements[j].classList.add("active");
          break; // Exit the loop after activating the matching element
        }
      }
    }

    /**
     * Set up the display logic for links and elements
     * @param {NodeList} links - The collection of link elements
     * @param {NodeList} elements - The collection of content elements
     */
    function displayElement(links, elements) {
      for (let i = 0; i < links.length; i++) {
        const link = links[i];
        const dataLink = link.dataset.index;

        link.addEventListener("click", () => {
          deactivateAll(links, elements); // Deactivate all links and elements
          activateLink(link); // Activate the clicked link
          activateElement(elements, dataLink); // Activate the corresponding element
        });
      }
    }

    let responsive = window.matchMedia("(max-width: 969px)");
    function mediaquery(responsive) {
      if (responsive.matches) {
        // ----- MOBILE ----- //
        dropdown.addEventListener("change", () => {
          const selectedIndex = dropdown.selectedIndex; // Keep index option

          for (let j = 0; j < tabs.length; j++) {
            tabs[j].classList.remove("active");
          }

          for (let j = 0; j < tabs.length; j++) {
            const tab = tabs[j];
            const dataTab = parseInt(tab.dataset.index, 10) - 1;

            if (selectedIndex === dataTab) {
              tab.classList.add("active");
              break;
            }
          }
        });
      } else {
        // ----- DESKTOP ----- //
        displayElement(tabLinks, tabs);
      }
    }
    mediaquery(responsive);

    responsive.addEventListener("change", () => {
      mediaquery(responsive);
    });

    window.addEventListener("resize", () => {
      setHeight(wrapperTabs, tabs);
    });
  }
});
