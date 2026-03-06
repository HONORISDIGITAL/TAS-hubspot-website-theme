import Swiper from 'swiper/bundle';
import 'swiper/css';

document.addEventListener('DOMContentLoaded', function() {
    const modules = document.getElementsByClassName('push-news-module');
    for (let i = 0; i < modules.length; i++) {
        const module = modules[i];

        const swiperPushNews = new Swiper('.swiper.slider-push-news', {
            allowTouchMove: false,
            direction: 'horizontal',
            slidesPerView: 1,
            spaceBetween: 16,
            speed: 300,
            breakpoints: {
                // when window width is >= 769px
                769: {
                    slidesPerView: 3,
                    spaceBetween: 24
                },
            },
        
            pagination: {
                el: '.swiper-pagination.slider-push-news-pagination',
                clickable: true,
            },
        
            navigation: {
                nextEl: '.swiper-button-next.slider-push-news-btn',
                prevEl: '.swiper-button-prev.slider-push-news-btn',
            }
        });
    }
});