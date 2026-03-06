import Swiper from 'swiper/bundle';
import 'swiper/css';

document.addEventListener('DOMContentLoaded', function() {
    const modules = document.getElementsByClassName('listing-cards-module');
    for (let i = 0; i < modules.length; i++) {
        const module = modules[i];

        const swiperListingCards = new Swiper('.swiper.slider-listing-cards', {
            direction: 'horizontal',
            slidesPerView: 1.1,
            spaceBetween: 24,
            speed: 300,
            breakpoints: {
                // when window width is >= 769px
                769: {
                    allowTouchMove: false,
                    slidesPerView: 3
                },
            },
        
            navigation: {
                nextEl: '.swiper-button-next.slider-listing-cards-btn',
                prevEl: '.swiper-button-prev.slider-listing-cards-btn',
            }
        });



        const slides = module.getElementsByClassName("swiper-slide");
        const sliderControls = module.getElementsByClassName("slider-controls")[0];

        function mediaquery() {
            if (window.matchMedia("(max-width: 768px)").matches) { // mobile mode
                sliderControls.classList.remove("hidden");
            } else { // desktop mode
                if (slides.length > 3) {
                    sliderControls.classList.remove("hidden");
                } else {
                    sliderControls.classList.add("hidden");
                }
            };
        };
        mediaquery();
        window.addEventListener("resize", mediaquery);
    }
});