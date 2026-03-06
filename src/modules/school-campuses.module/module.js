document.addEventListener('DOMContentLoaded', function() {
    const modules = document.getElementsByClassName('school-campuses-module');
    for (let i = 0; i < modules.length; i++) {
        const module = modules[i];

        const items = module.getElementsByClassName("tab-content");
        const images = module.getElementsByClassName("tab-images");

        function itemHeight(item) {
            const cta = item.querySelector(".cta-content");
            if (item.classList.contains("active") && cta) {
                item.style.height = item.children[0].offsetHeight + cta.offsetHeight + "px";
            } else {
                item.style.height = item.children[0].offsetHeight + "px";
            }
        }

        function imagesHeight() {
            const activeImages = module.getElementsByClassName("tab-images active")[0];
            if (activeImages) {
                module.getElementsByClassName("tabs-images")[0].style.height = activeImages.offsetHeight + "px";
            }
        }

        for (let i = 0; i < items.length; i++) {
            itemHeight(items[i]);

            items[i].addEventListener("click", function(){
                for (let j = 0; j < items.length; j++) {
                    items[j].classList.remove("active");
                    itemHeight(items[j]);
                }
                items[i].classList.add("active");
                itemHeight(items[i]);

                for (let j = 0; j < images.length; j++) {
                    images[j].classList.remove("active");

                    if (images[j].dataset.index == items[i].dataset.index) {
                        images[j].classList.add("active");
                    }
                }
                imagesHeight();
            });
        }

        setTimeout(() => {
            imagesHeight();
        }, 300);
    }
});