import Splide from '@splidejs/splide';

document.addEventListener('DOMContentLoaded', function() {
    const modules = document.getElementsByClassName('testimonials-module');
    for (let i = 0; i < modules.length; i++) {
        const module = modules[i];
        new Splide( module.querySelector('.splide-slider'), {
            breakpoints: {
                1024: {
                    perPage: 2,
                },
                950: {
                    perPage: 1,
                },
          }
        } ).mount();
    }
});