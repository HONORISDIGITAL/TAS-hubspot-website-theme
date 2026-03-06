import Splide from '@splidejs/splide';
import { AutoScroll } from '@splidejs/splide-extension-auto-scroll';

document.addEventListener('DOMContentLoaded', function() {
    const modules = document.getElementsByClassName('logos-slider-module');
    for (let i = 0; i < modules.length; i++) {
        const module = modules[i];

        new Splide( module.querySelector('.splide') ).mount({ AutoScroll });
    }
});