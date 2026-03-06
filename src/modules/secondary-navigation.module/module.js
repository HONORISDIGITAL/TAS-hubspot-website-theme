document.addEventListener('DOMContentLoaded', function() {
    const modules = document.getElementsByClassName('secondary-navigation-module');
    for (let i = 0; i < modules.length; i++) {
        const module = modules[i];

        const container = module.querySelector('.container');
        const contentWrapper = module.querySelector('.content-wrapper');



        function updateOverflowingClass() {
            if (contentWrapper.scrollWidth > container.clientWidth) {
                module.classList.add('overflowing');
            } else {
                module.classList.remove('overflowing');
            }
        }

        function updateOverflowDirection() {
            const scrollLeft = contentWrapper.scrollLeft;
            const maxScroll = contentWrapper.scrollWidth - contentWrapper.clientWidth;

            if (scrollLeft > 0) {
                module.classList.add('overflow-left');
            } else {
                module.classList.remove('overflow-left');
            }

            if (scrollLeft < maxScroll) {
                module.classList.add('overflow-right');
            } else {
                module.classList.remove('overflow-right');
            }
        }



        updateOverflowingClass();
        updateOverflowDirection();

        contentWrapper.addEventListener('scroll', updateOverflowDirection);

        window.addEventListener('resize', function() {
            updateOverflowingClass();
            updateOverflowDirection();
        });
    }
});