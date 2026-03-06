document.addEventListener('DOMContentLoaded', function() {
    const modules = document.getElementsByClassName('showcase-artworks-listing-module');
    for (let i = 0; i < modules.length; i++) {
        const module = modules[i];

        if (!showcaseArtworksListingCards) return;

        const columns = module.querySelectorAll('.columns .column');
        const loadMoreBtn = module.querySelector('.load-more');
        const cardsPerPage = parseInt(module.getAttribute('data-cards_per_page'), 10) || 9;
        const yearSelect = module.querySelector('#year-select');
        const topicSelect = module.querySelector('#topic-select');

        const popup = module.querySelector('.popup-container');
        const popupMedia = popup.querySelector('.popup-media');
        const popupClosers = popup.querySelectorAll('.close-popup, .background');



        let filteredCards = [];
        let currentPage = 1;

        function openPopup(card) {
            popupMedia.innerHTML = '';

            if (card.media.type === 'image') {
                popupMedia.innerHTML = `<img src="${card.media.image.src}" alt="${card.media.image.alt}">`;
            } else if (card.media.type === 'video_file') {
                popupMedia.innerHTML = `<video controls autoplay><source src="${card.media.video_file}" type="video/mp4"></video>`;
            } else if (card.media.type === 'video_youtube') {
                popupMedia.innerHTML = `<iframe width="500" height="500" src="${card.media.video_youtube}" frameborder="0" allow="autoplay;encrypted-media"></iframe>`;
            }
            popup.classList.add("active");
        }

        function renderCards(cards, page) {
            columns.forEach(col => col.innerHTML = '');
            
            const cardsToShow = cards.slice(0, page * cardsPerPage);
            cardsToShow.forEach((card, idx) => {
                const colIdx = idx % 3;
                const cardDiv = document.createElement('div');
                cardDiv.className = 'card';
                cardDiv.innerHTML = `
                    <figure class="${card.media.type}-cover">
                        <img loading="lazy" width="${card.media.image.width}" height="${card.media.image.height}" src="${card.media.image.src}" alt="${card.media.image.alt}">
                    </figure>

                    <div class="text-content">
                        <p class="title">${card.title}</p>
                        <div class="info-wrapper">
                            <p class="info small">${card.year}</p>
                            <p class="info small">${card.year_of_study}</p>
                            <p class="info small">${card.topic}</p>
                        </div>
                    </div>
                `;
                cardDiv.addEventListener("click", function(){
                    openPopup(card);
                });
                columns[colIdx].appendChild(cardDiv);
            });

            if (cardsToShow.length >= cards.length) {
                module.classList.add('all-cards-visible');
            } else {
                module.classList.remove('all-cards-visible');
            }
        }

        function filterCards() {
            currentPage = 1;
            const yearValue = encodeURIComponent(yearSelect.value?.toLowerCase() || '');
            const topicValue = encodeURIComponent(topicSelect.value?.toLowerCase() || '');

            const params = new URLSearchParams(window.location.search);
            if (yearSelect.value && yearSelect.value !== '') {
                params.set('year', yearSelect.value);
            } else {
                params.delete('year');
            }
            if (topicSelect.value && topicSelect.value !== '') {
                params.set('topic', topicSelect.value);
            } else {
                params.delete('topic');
            }
            const newUrl = window.location.pathname + (params.toString() ? '?' + params.toString() : '');
            window.history.replaceState({}, '', newUrl);

            filteredCards = showcaseArtworksListingCards.filter(card => {
                const yearMatch = !yearValue || encodeURIComponent(card.year_of_study?.toLowerCase() || '') === yearValue;
                const topicMatch = !topicValue || encodeURIComponent(card.topic?.toLowerCase() || '') === topicValue;
                return yearMatch && topicMatch;
            });

            if (filteredCards.length === 0) {
                module.classList.add('no-cards-found');
            } else {
                module.classList.remove('no-cards-found');
            }

            renderCards(filteredCards, currentPage);
        }

        

        yearSelect.addEventListener('change', filterCards);
        topicSelect.addEventListener('change', filterCards);

        loadMoreBtn.addEventListener('click', function() {
            currentPage++;
            renderCards(filteredCards, currentPage);
        });

        const params = new URLSearchParams(window.location.search);
        if (params.has('year')) yearSelect.value = params.get('year');
        if (params.has('topic')) topicSelect.value = params.get('topic');
        filterCards();

        for (let i = 0; i < popupClosers.length; i++) {
            popupClosers[i].addEventListener("click", function(){
                popup.classList.remove("active");
                popupMedia.innerHTML = '';
            });
        }
    }
});