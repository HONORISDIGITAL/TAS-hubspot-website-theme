import Swiper from 'swiper/bundle';
import 'swiper/css';

document.addEventListener('DOMContentLoaded', function() {
    const modules = document.getElementsByClassName('courses-programs-module');
    for (let i = 0; i < modules.length; i++) {
        const module = modules[i];

        const swiperCoursesPrograms = new Swiper('.swiper.slider-courses-programs', {
            direction: 'horizontal',
            slidesPerView: 1,
            spaceBetween: 16,
            speed: 300,
            breakpoints: {
                // when window width is >= 769px
                769: {
                    allowTouchMove: false,
                    slidesPerView: 2,
                    spaceBetween: 24
                },
            },
        
            navigation: {
                nextEl: '.swiper-button-next.slider-courses-programs-btn',
                prevEl: '.swiper-button-prev.slider-courses-programs-btn',
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