import Splide from '@splidejs/splide';

document.addEventListener('DOMContentLoaded', function() {
    const modules = document.getElementsByClassName('push-content-module');
    for (let i = 0; i < modules.length; i++) {
        const module = modules[i];

        const splide = module.querySelector('.splide');

        splide && new Splide( splide ).mount();
    }
});