document.addEventListener('DOMContentLoaded', function() {
    const modules = document.getElementsByClassName('header-module');
    for (let i = 0; i < modules.length; i++) {
        const module = modules[i];
        const searchBtn = module.querySelector('.btn-search');
        const searchCloseBtn = module.querySelector('.btn-close-search-bar');
        const wrapperSearchBar = module.querySelector('.wrapper-search-bar');
        const btnsSwitchLanguage = module.querySelectorAll('.switch-language');
        const btnBurgerMenu = module.querySelector('.menu-burger');
        const wrapperMenuMobile = module.querySelector('.wrapper-menu-mobile');
        const wrapperClose = module.querySelector(".wrapper-close");

        //SCROLL STICKY
        function handleScroll(e) {
            if (window.scrollY > 20) {
                module.classList.add('scrolled');
            } else {
                module.classList.remove('scrolled');
            }
        }

        window.addEventListener('scroll', handleScroll);
        handleScroll();
        //SCROLL STICKY

        //LANGUAGE BTN
        for (let i = 0; i < btnsSwitchLanguage.length; i++) {
            btnsSwitchLanguage[i].addEventListener('click', (event) => {
                btnsSwitchLanguage[i].classList.toggle('active');
            });

            btnsSwitchLanguage[i].addEventListener("keypress", function(event){
                if (event.keyCode === 13) {
                    event.preventDefault();
                    btnsSwitchLanguage[i].classList.toggle('active');
                }
            })

            function handleClickOutside(event) {
                if (!btnsSwitchLanguage[i].contains(event.target)) {
                    btnsSwitchLanguage[i].classList.remove('active');
                }
            }

            document.addEventListener('click', handleClickOutside);
        }
        //LANGUAGE BTN

        //SEARCH BTN
        searchBtn.addEventListener('click', () => {
            wrapperSearchBar.classList.toggle('active');
            if (wrapperSearchBar.classList.contains('active')){
                wrapperClose.classList.add('active');
            }else{
                wrapperClose.classList.remove('active');
            }
        });
        searchBtn.addEventListener("keypress", function(event){
            if (event.keyCode === 13) {
                event.preventDefault();
                wrapperSearchBar.classList.toggle('active');
                if (wrapperSearchBar.classList.contains('active')){
                    wrapperClose.classList.add('active');
                }else{
                    wrapperClose.classList.remove('active');
                }
            }
        })

        searchCloseBtn.addEventListener('click', () => {
            wrapperSearchBar.classList.remove('active');
            wrapperClose.classList.remove('active');
        })
        searchCloseBtn.addEventListener("keypress", function(event){
            if (event.keyCode === 13) {
                event.preventDefault();
                wrapperSearchBar.classList.remove('active');
                wrapperClose.classList.remove('active');
            }
        })
        //SEARCH BTN

        //BURGER MENU BTN
        btnBurgerMenu.addEventListener('click', () => {
            btnBurgerMenu.classList.toggle('active');
            wrapperMenuMobile.classList.toggle('open');
            if (wrapperMenuMobile.classList.contains('open')){
                wrapperClose.classList.add('active');
            }else{
                wrapperClose.classList.remove('active');
            }
        })
        btnBurgerMenu.addEventListener("keypress", function(event){
            if (event.keyCode === 13) {
                event.preventDefault();
                btnBurgerMenu.classList.add('active');
                wrapperMenuMobile.classList.add('open');
                wrapperClose.classList.add('active');
            }
        })
        
        //CLOSE WRAPPER BTN
        wrapperClose.addEventListener('click', () => {
            wrapperMenuMobile.classList.remove('open');
            wrapperSearchBar.classList.remove('active');
            wrapperClose.classList.remove('active');
            btnBurgerMenu.classList.remove('active');
        });
    }
});