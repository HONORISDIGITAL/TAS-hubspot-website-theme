import Swiper from 'swiper/bundle';
import 'swiper/css';

document.addEventListener('DOMContentLoaded', function() {
    const modules = document.getElementsByClassName('testimonials-module');
    for (let i = 0; i < modules.length; i++) {
        const module = modules[i];

        const swipertestimonials = new Swiper('.swiper.slider-testimonials', {
            centeredSlides: true,
            direction: 'horizontal',
            loop: true,
            slidesPerView: 1.1,
            spaceBetween: 16,
            speed: 300,
            breakpoints: {
                // when window width is >= 769px
                769: {
                    allowTouchMove: false,
                    slidesPerView: 3.2,
                    spaceBetween: 24
                },
            },

            navigation: {
                nextEl: '.swiper-button-next.slider-testimonials-btn',
                prevEl: '.swiper-button-prev.slider-testimonials-btn',
            }
        });
    }
});