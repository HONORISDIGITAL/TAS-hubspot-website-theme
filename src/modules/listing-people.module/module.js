document.addEventListener('DOMContentLoaded', function() {
    const modulesTabs = document.getElementsByClassName('listing-people-module');

    for (let i = 0; i < modulesTabs.length; i++) {
        const moduleTab = modulesTabs[i];
        let tabs = moduleTab.getElementsByClassName("tab");
        let tabsContainer = moduleTab.getElementsByClassName("contain-tab");

        const updateHeight = (activeIndex) => {
            if (tabsContainer.length > 0 && activeIndex !== undefined) {
                var divHeight = tabsContainer[activeIndex].clientHeight; // Utilisez clientHeight pour obtenir la hauteur avec padding
                var tabsContain = document.getElementById("contain-tabs");
                tabsContain.style.height = divHeight + "px";
            }
        };

        for (let j = 0; j < tabs.length; j++) {
            tabs[j].addEventListener("click", function() {
                for (let k = 0; k < tabs.length; k++) {
                    tabs[k].classList.remove("active");
                }
                for (let k = 0; k < tabsContainer.length; k++) {
                    tabsContainer[k].classList.remove("active");
                }
                tabs[j].classList.add("active");
                tabsContainer[j].classList.add("active");
                updateHeight(j); // Passez l'index du tab actif
            });

            tabs[j].addEventListener("keypress", function(event) {
                if (event.keyCode === 13) {
                    for (let k = 0; k < tabs.length; k++) {
                        tabs[k].classList.remove("active");
                    }
                    for (let k = 0; k < tabsContainer.length; k++) {
                        tabsContainer[k].classList.remove("active");
                    }
                    tabs[j].classList.add("active");
                    tabsContainer[j].classList.add("active");
                    updateHeight(j); // Passez l'index du tab actif
                }
            });
        }

        // Observer pour surveiller les changements dans le DOM
        const observer = new MutationObserver(() => {
            const activeTabIndex = Array.from(tabsContainer).findIndex(container => container.classList.contains("active"));
            updateHeight(activeTabIndex);
        });

        if (tabsContainer.length > 0) {
            observer.observe(tabsContainer[0], { childList: true, subtree: true });
            updateHeight(0); // Initialisation avec le premier tab
        }

        // Ajout d'un écouteur pour l'événement de redimensionnement
        window.addEventListener('resize', () => {
            const activeTabIndex = Array.from(tabsContainer).findIndex(container => container.classList.contains("active"));
            updateHeight(activeTabIndex);
        });
    }
});
