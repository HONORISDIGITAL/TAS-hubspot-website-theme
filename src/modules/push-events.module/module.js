import Swiper from 'swiper/bundle';
import 'swiper/css';

document.addEventListener('DOMContentLoaded', function() {
    const modules = document.getElementsByClassName('push-events-module');
    for (let i = 0; i < modules.length; i++) {
        const module = modules[i];

        const swiperPushEvents = new Swiper('.swiper.slider-push-events', {
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
                nextEl: '.swiper-button-next.slider-push-events-btn',
                prevEl: '.swiper-button-prev.slider-push-events-btn',
            }
        });
    }
});