document.addEventListener('DOMContentLoaded', function () {
    const modules = document.getElementsByClassName('search-results-module');
    for (let i = 0; i < modules.length; i++) {
        const module = modules[i];
        const searchParams = getSearchParameters();
        const pagination = module.querySelector('.pagination');
        const nextPageBtn = module.querySelector('nav .pagination-item--next');
        const prevPageBtn = module.querySelector('nav .pagination-item--prev');
        const container = module.querySelector('ul');
        const bFeaturedImage = module.getAttribute('data-featured-image') === 'true';
        const featuredImageURLDefault = container.querySelector("li").getAttribute('data-featured-image-url');
        const message = module.querySelector('.search-results-message');
        var searchPath = module.getAttribute('data-search-path');
        container.innerHTML = '';

        async function generateResultsPage() {
            if (getTerm()) {
                const results = await getSearchResults(getTerm(), getOffset());
                results.results.forEach((result) => {
                    addResult(result.title, result.url, result.description, result.featuredImageUrl);
                });
                paginate(results);
            } else {
                emptyResults();
            }
        }

        function emptyResults() {
            container.innerHTML = `
                <li class="no-results">
                <p>Désolé, aucun résultat pour "${getTerm()}"</p>
                <p>Essayez de reformuler votre requête ou parcourez notre site.</p>
                </li>`;
            nextPageBtn.style.display = 'none';
            nextPageBtn.setAttribute('href', '#');
            prevPageBtn.style.display = 'none';
            prevPageBtn.setAttribute('href', '#');
        }

        function paginate(results) {
            let updatedLimit = getLimit() || results.limit;
            let nbPages = Math.ceil(results.total / updatedLimit);

            function hasPreviousPage() {
                return results.page > 0;
            }
            function hasNextPage() {
                return results.offset <= results.total - updatedLimit;
            }

            if (hasPreviousPage()) {
                let prevParams = new URLSearchParams(searchParams.toString());
                prevParams.set(
                    'offset',
                    results.page * updatedLimit - parseInt(updatedLimit)
                );
                prevPageBtn.setAttribute("href", `${searchPath}?${prevParams}`);
                prevPageBtn.classList.remove('disabled');
            } else {
                prevPageBtn.classList.add('disabled');
            }

            if (hasNextPage()) {
                let nextParams = new URLSearchParams(searchParams.toString());
                nextParams.set(
                    'offset',
                    results.page * updatedLimit + parseInt(updatedLimit)
                );
                nextPageBtn.setAttribute("href", `${searchPath}?${nextParams}`);
                nextPageBtn.classList.remove('disabled');
            } else {
                nextPageBtn.classList.add('disabled');
            }

            if (nbPages > 1) {
                pagination.style.display = '';
            } else {
                pagination.style.display = 'none';
            }

            function generatePageNumbers(currentPage, nbPages) {
                pagination.innerHTML = '';

                const maxPagesToShow = 7;
                const pages = [];

                // si on a moins de pages que le nombre max de pages à afficher
                if (nbPages <= maxPagesToShow) {
                    for (let i = 1; i <= nbPages; i++) {
                        pages.push(i);
                    }
                } else {
                    const start = currentPage - Math.floor((maxPagesToShow / 2));
                    const end = currentPage + Math.floor((maxPagesToShow / 2));
                    // Cela signifie que nous sommes proches du début et qu'il n'y a pas besoin de mettre des points de suspension
                    if (start <= 1) {
                        for (let i = 1; i < currentPage; i++) {
                            pages.push(i);
                        }
                    } else {
                        pages.push(1);
                        pages.push('...');
                        pages.push(currentPage - 1);
                    }


                    pages.push(currentPage);

                    // Cela signifie que nous sommes proches de la fin et qu'il n'y a pas besoin de mettre des points de suspension
                    if (end >= nbPages) {
                        for (let i = currentPage + 1; i <= nbPages; i++) {
                            pages.push(i);
                        }
                    } else {
                        pages.push(currentPage + 1);
                        pages.push('...');
                        pages.push(nbPages);
                    }
                }

                pages.forEach(i => {
                    const page = document.createElement('li');
                    const anchor = document.createElement('a');
                    page.classList.add('pagination-item', 'pagination-item--number');

                    if (i == '...') {
                        anchor.innerHTML = '...';
                        anchor.href = '#';
                        page.classList.add('pagination-item--ellipsis');
                    } else {
                        anchor.innerHTML = i;
                        let nbParams = new URLSearchParams(searchParams.toString());
                        nbParams.set('offset', (i - 1) * updatedLimit);
                        anchor.href = `${searchPath}?${nbParams}`;
                        if (i == currentPage) {
                            page.classList.add('pagination-item--active');
                        }
                    }

                    page.appendChild(anchor);
                    pagination.appendChild(page);
                });
            }

            if (results.total != 0) {
                message.innerHTML = `Résultats ${results.offset + 1} - ${results.offset + Math.min(results.total, results.results.length)} sur ${results.total}`;
                generatePageNumbers(results.page + 1, nbPages);
            } else{
                emptyResults();
            }
        }

        function getSearchParameters() {
            const params = new URLSearchParams(window.location.search);
            // La v1 de hubspot utilise le paramètre `q` pour la recherche au lieu de `term`.
            if (params.has('q')) {
                params.set('term', params.get('q'));
                params.delete('q');
            }
            return params;
        }

        const escapeHtml = (unsafe) => {
            return unsafe
                .replace(/&/g, '&amp;')
                .replace(/<[^>]*>/g, '')
                .replace(/"/g, '')
                .replace(/'/g, '');
        }

        function addResult(title, url, description, featuredImage) {
            const result = document.createElement('li');
            result.innerHTML = `
                <a href="${url}">
                    <article>
                        ${bFeaturedImage ? `
                        <figure>
                            <img src="${featuredImage ? featuredImage : featuredImageURLDefault}" alt="${escapeHtml(title)}">
                        </figure>
                        ` : ''}
                        <div class="content">
                            <div class="title">
                                <h3>${title}</h3>
                            </div>
                            <div class="description">
                                <p>${description}</p>
                            </div>
                        </div>
                    </article>
                </a>
            `;
            container.appendChild(result);
        }

        async function getSearchResults(term, offset) {
            const SEARCH_URL = '/_hcms/search?';
            const url = SEARCH_URL + searchParams + `&analytics=true&portalId=${hsVars.portal_id}`;
            //console.log(url);
            try {
                const response = await fetch(url, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });
                if (!response.ok) {
                    throw new Error('Serveur atteint, erreur lors de la récupération des résultats.');
                }

                return await response.json();
            } catch (error) {
                console.error('[Catch] Une erreur est survenue : ', error);
            }
        }

        function getTerm() {
            return searchParams.get('term') || '';
        }
        function getOffset() {
            return parseInt(searchParams.get('offset')) || 0;
        }
        function getLimit() {
            return parseInt(searchParams.get('limit'));
        }

        generateResultsPage();
    }
});