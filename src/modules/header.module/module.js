document.addEventListener('DOMContentLoaded', function() {
    const modules = document.getElementsByClassName('header-module');
    for (let i = 0; i < modules.length; i++) {
        const module = modules[i];

        const itemWrappers = module.getElementsByClassName("item-wrapper");
        const menuClosers = module.querySelectorAll(".logo-link, .ctas");
        const burger = module.querySelector(".mobile-bar .btn");
        const mobileBar = module.querySelector(".mobile-bar");
        const ctas = module.querySelector(".ctas");



        function initLightDarkMode() {
            const hero = document.querySelector("#main-content section");
            if (!hero.classList.contains("dark-mode")) {
                module.classList.remove("dark-nav");
                mobileBar.classList.remove("dark-mode");
                ctas.classList.remove("dark-mode");
            }
        }

        function toggleLightDarkMode(mode) {
            if (mode == "dark" && module.classList.contains("dark-nav-temp") && !module.classList.contains("scrolled")) {
                module.classList.remove("dark-nav-temp");
                module.classList.add("dark-nav");
                mobileBar.classList.add("dark-mode");
                ctas.classList.add("dark-mode");
            }
            if (mode == "light" && module.classList.contains("dark-nav")) {
                module.classList.add("dark-nav-temp");
                module.classList.remove("dark-nav");
                mobileBar.classList.remove("dark-mode");
                ctas.classList.remove("dark-mode");
            }
        }

        function closeMenuDesktop() {
            for (let i = 0; i < itemWrappers.length; i++) {
                itemWrappers[i].classList.remove("active");
            }
            toggleLightDarkMode("dark");
        }

        function openMenuDesktop(e) {
            const wrapper = e.target.closest(".item-wrapper");
            if (wrapper.classList.contains("active")) {
                closeMenuDesktop();
            } else {
                closeMenuDesktop();
                wrapper.classList.add("active");
                toggleLightDarkMode("light");
            }
        }

        function closeMenuMobile() {
            for (let i = 0; i < itemWrappers.length; i++) {
                itemWrappers[i].classList.remove("active");
                itemWrappers[i].style.height = itemWrappers[i].children[0].offsetHeight + "px";
            }
        }

        function clickMenuMobile(e) {
            const wrapper = e.target.closest(".item-wrapper");

            if (wrapper.classList.contains("active")) {
                closeMenuMobile();
            } else {   
                closeMenuMobile();
                wrapper.classList.add("active");
                wrapper.style.height = wrapper.children[0].offsetHeight + wrapper.children[1].offsetHeight + "px";
            }
        }

        function burgerToggle() {
            if (module.classList.contains("active")) {
                module.classList.remove("active");
                toggleLightDarkMode("dark");
            } else {
                module.classList.add("active");
                toggleLightDarkMode("light");
            }
        }

        function scrollStyle() {
            if (window.scrollY > 50) {
                if (!module.classList.contains("scrolled")) {
                    module.classList.add("scrolled");
                    toggleLightDarkMode("light");
                }
            } else {
                if (module.classList.contains("scrolled")) {
                    module.classList.remove("scrolled");
                    toggleLightDarkMode("dark");
                }
            }
        }



        function mediaquery() {
            initLightDarkMode();

            if (window.matchMedia("(max-width: 1280px)").matches) { // mobile mode
                for (let i = 0; i < itemWrappers.length; i++) {
                    itemWrappers[i].querySelector(".main-item").removeEventListener("click", openMenuDesktop);
                }
                
                for (let i = 0; i < menuClosers.length; i++) {
                    menuClosers[i].removeEventListener("mouseenter", closeMenuDesktop);
                }

                module.removeEventListener("mouseleave", closeMenuDesktop);


                
                burger.addEventListener("click", burgerToggle);

                for (let i = 0; i < itemWrappers.length; i++) {
                    itemWrappers[i].style.height = itemWrappers[i].children[0].offsetHeight + "px";
                    itemWrappers[i].addEventListener("click", clickMenuMobile);
                }
            } else { // desktop mode
                for (let i = 0; i < itemWrappers.length; i++) {
                    itemWrappers[i].querySelector(".main-item").addEventListener("click", openMenuDesktop);
                }
                
                for (let i = 0; i < menuClosers.length; i++) {
                    menuClosers[i].addEventListener("mouseenter", closeMenuDesktop);
                }

                module.addEventListener("mouseleave", closeMenuDesktop);



                burger.removeEventListener("click", burgerToggle);

                for (let i = 0; i < itemWrappers.length; i++) {
                    itemWrappers[i].removeAttribute("style");
                    itemWrappers[i].removeEventListener("click", clickMenuMobile);
                }
            };
        };
        mediaquery();
        window.addEventListener("resize", mediaquery);
        window.addEventListener("scroll", scrollStyle);
    }
});