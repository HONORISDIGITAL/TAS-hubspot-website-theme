document.addEventListener('DOMContentLoaded', function() {
    const modules = document.getElementsByClassName('showcase-artworks-preview-module');
    for (let i = 0; i < modules.length; i++) {
        const module = modules[i];

        const cards = document.getElementsByClassName("card");
        const popup = module.querySelector('.popup-container');
        const popupMedia = popup.querySelector('.popup-media');
        const popupClosers = popup.querySelectorAll('.close-popup, .background');



        function openPopup(card) {
            popupMedia.innerHTML = '';

            if (card.dataset.mediaType === 'image') {
                popupMedia.innerHTML = `<img src="${card.dataset.media}">`;
            } else if (card.dataset.mediaType === 'video_file') {
                popupMedia.innerHTML = `<video controls autoplay><source src="${card.dataset.media}" type="video/mp4"></video>`;
            } else if (card.dataset.mediaType === 'video_youtube') {
                popupMedia.innerHTML = `<iframe width="500" height="500" src="${card.dataset.media}" frameborder="0" allow="autoplay;encrypted-media"></iframe>`;
            }
            popup.classList.add("active");
        }



        for (let i = 0; i < cards.length; i++) {
            cards[i].addEventListener("click", function(){
                openPopup(cards[i]);
            });
        }

        for (let i = 0; i < popupClosers.length; i++) {
            popupClosers[i].addEventListener("click", function(){
                popup.classList.remove("active");
                popupMedia.innerHTML = '';
            });
        }
    }
});