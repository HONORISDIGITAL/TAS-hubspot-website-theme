export default class VideoYT {

    /**
     * La classe VideoYT permet de créer une vidéo YouTube dans un container donné, avec des options personnalisées et optimisées pour le web.
     * Dans un module : import VideoYT from "../../js/_utils/VideoYT";
     * 
     * Inspiration : lite-youtube.ts (justinribeiro/lite-youtube)
     *
     * @class
     * @param {(string|HTMLElement)} container - Le conteneur de la vidéo, soit un sélecteur CSS, soit un élément HTML.
     * @param {string} url - L'URL de la vidéo YouTube.
     * @param {Object} [options={}] - Les options de la vidéo.
     * @param {string} [options.title="Youtube Video"] - Le titre de la vidéo.
     * @param {boolean} [options.autoplay=false] - Autoplay de la vidéo. `true` = autoplay au scroll (lazyload), `false` = autoplay au clic.
     * @param {boolean} [options.autoPause=true] - Mettre en pause la vidéo lorsqu'elle n'est plus visible. `true` = pause, `false` = pas de pause.
     * @param {boolean} [options.muted=true] - Muter la vidéo. `true` = muet, `false` = non muet.
     * @param {boolean} [options.playerButton=true] - Afficher le bouton du lecteur.
     * @param {boolean} [options.poster=false] - Afficher une affiche personnalisée. `true` = affiche personnalisée, `false` = affiche YouTube.
     * @param {string} [options.posterQuality="maxresdefault"] - Qualité de l'affiche personnalisée. `maxresdefault`, `sddefault`, `hqdefault`, `mqdefault`, `default`.
     * @param {boolean} [options.loop=false] - Boucler la vidéo.
     * @param {boolean} [options.noCookie=true] - Utiliser le mode noCookie. `true` = noCookie, `false` = cookie.
     * @param {string} [options.aspectRatio="16/9"] - Ratio de l'aspect de la vidéo. `16/9`, `4/3`, `1/1`, `21/9`, `9/16`.
     * 
     * @author MTG Team - WS
     */
    constructor(container, url, options = {}) {
        this.container = this.#checkContainer(container);
        const defaultOptions = {
            title: "Youtube Video",
            autoplay: false,
            autoPause: true,
            muted: true,
            playerButton: true,
            poster: false,
            posterQuality: "maxresdefault",
            loop: false,
            noCookie: true,
            aspectRatio: "16/9",
        };
        this.options = { ...defaultOptions, ...options };

        this.videoId = this.#getVideoId(url);
        this.posterURL = this.options.poster ? this.container.getAttribute("data-poster") : this.#getDefaultVideoPoster(this.videoId, this.options.posterQuality);
        if (!this.posterURL) {
            this.posterURL = this.#getDefaultVideoPoster(this.videoId);
            console.info(`[VideoYT] No poster URL found, using default poster: ${this.posterURL}`);
        }
        this.isIframeLoaded = false;
        this.isPreconnected = false;
        this.#init();
    }

    /**
     * Précharge les ressources en amont pour optimiser le chargement de la vidéo.
     * 
     * @param {string} kind - Le type de ressource à précharger. `preconnect`, `prefetch`, `preload`.
     * @param {string} url - L'URL de la ressource à précharger.
     */
    static #addPrefetch(kind, url) {
        const linkElem = document.createElement('link');
        linkElem.rel = kind;
        linkElem.href = url;
        linkElem.crossOrigin = 'true';
        document.head.append(linkElem);
    }

    // TO DO : Mettre cette fonction en Static car il peut y avoir plusieurs vidéos YT sur la page
    #warmConnections() {
        if (this.isPreconnected) return;

        // On précharge les domaines nécessaires pour les vidéos YT
        // Pour les images de preview
        VideoYT.#addPrefetch('preconnect', 'https://i.ytimg.com/');

        // Pour les scripts des vidéos YT
        VideoYT.#addPrefetch('preconnect', 'https://s.ytimg.com');

        if (!this.options.noCookie) {
            // Si il n'y a pas de cookie, on charge les domaines necessaires
            // youtube.com
            VideoYT.#addPrefetch('preconnect', 'https://www.youtube.com');

            // Le botguard script est chargé depuis www.google.com
            VideoYT.#addPrefetch('preconnect', 'https://www.google.com');
        } else {
            // Si on utilise le mode noCookie, on charge les domaines necessaires
            // youtube-nocookie.com
            VideoYT.#addPrefetch('preconnect', 'https://www.youtube-nocookie.com');
        }

        this.isPreconnected = true;
    }

    /**
     * Vérifie et retourne le conteneur de la vidéo.
     * 
     * @private
     * @param {(string|HTMLElement)} container - Le conteneur de la vidéo.
     * @returns {HTMLElement} - L'élément conteneur validé.
     * @throws {Error} - Lance une erreur si le conteneur est invalide.
     */
    #checkContainer(container) {
        if (typeof container === "string") {
            try {
                const ctn = document.querySelector(container);
                if (!ctn) {
                    throw new Error(`[VideoYT] No element found for selector: ${container}`);
                }
                return ctn;
            } catch (error) {
                console.error(error);
                throw new Error(`[VideoYT] Invalid input container: ${container}`);
            }
        } else if (container instanceof HTMLElement) {
            return container;
        } else {
            throw new Error("[VideoYT] Invalid input container: must be a string or an HTMLElement");
        }
    }

    /**
     * Récupère l'url de l'image par défaut de la vidéo.
     */
    #getDefaultVideoPoster(videoId, quality = "hqdefault") {
        return `https://i.ytimg.com/vi_webp/${videoId}/${quality}.webp`;
    }

    #getVideoId(url) {
        if (!url) {
            throw new Error("[VideoYT] Invalid input URL: must be a string");
        }
        if (url.includes("youtube.com")) {
            return url.split("v=")[1];
        } else if (url.includes("youtu.be")) {
            return url.split("/").pop();
        }
        return url;
    }

    #generateIframe() {
        const wantsNoCookie = this.options.noCookie ? '-nocookie' : '';
        let embedTarget = `${this.videoId}?`;
        if (this.playlistId) { // Si c'est une playlist YouTube (TO DO car this.playlistId non implémenté)
            embedTarget = `?listType=playlist&list=${this.playlistId}&`;
        }
        const params = `enablejsapi=1${this.options.muted ? '&mute=1' : ''}${this.options.loop ? '&loop=1' : ''}&autoplay=1`;

        const iframe = document.createElement('iframe');
        iframe.title = this.options.title;
        iframe.frameBorder = 0;
        iframe.allow = 'accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture';
        iframe.allowFullscreen = true
        iframe.src = `https://www.youtube${wantsNoCookie}.com/embed/${embedTarget}&${params}`;
        return iframe;
    }

    #addIframe() {
        if (!this.isIframeLoaded) {
            this.iframeHTML = this.#generateIframe();
            this.container.append(this.iframeHTML);
            this.container.classList.add('activated');
            this.isIframeLoaded = true;
            this.container.dispatchEvent(
                new CustomEvent('YoutubeIframeLoaded', {
                    detail: {
                        videoId: this.videoId,
                    },
                    bubbles: true,
                    cancelable: true,
                }),
            );
        }
    }

    #initIntersectionObserver() {
        const options = {
            root: null,
            rootMargin: '0px',
            threshold: 0,
        };

        const observer = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !this.isIframeLoaded) {
                    this.#warmConnections(this);
                    this.#addIframe(true);
                    observer.unobserve(this.container);
                }
            });
        }, options);

        observer.observe(this.container);

        if (this.options.autoPause) {
            const windowPause = new IntersectionObserver(
                (e, o) => {
                    e.forEach(entry => {
                        if (entry.intersectionRatio !== 1) {
                            this.iframeHTML.contentWindow.postMessage(
                                '{"event":"command","func":"pauseVideo","args":""}',
                                '*',
                            );
                        }
                    });
                },
                { threshold: 1 },
            );
            windowPause.observe(this.container);
        }
    }

    async #addImagePoster() {
        const webpUrl = this.posterURL;
        const img = new Image();
        img.fetchPriority = 'low'; // priorité faible pour le chargement
        img.referrerPolicy = 'origin';
        img.src = webpUrl;
        img.alt = this.options.title;
        img.classList.add('yt-poster-img');
        img.onload = (e) => {
            this.container.append(img);
        }
    }

    #init() {
        this.#addStyles();
        if (this.options.playerButton) {
            this.container.innerHTML = `<button class="yt-video-player" aria-label="Play video" title="Play video"></button>`;
        }
        this.#addImagePoster();

        if (this.options.autoplay) {
            this.#initIntersectionObserver();
        } else {
            this.container.addEventListener(
                'pointerover',
                () => this.#warmConnections(this),
                {
                    once: true,
                },
            );

            this.container.addEventListener('click', () => this.#addIframe());
        }
    }

    // TO DO : Rendre cette méthode static car elle ne dépend pas de l'instance
    #addStyles() {
        const styleContent = `
        .${this.container.classList[0]} {
            contain: content;
          display: block;
          position: relative;
          width: 100%;
          aspect-ratio: ${this.options.aspectRatio};
          overflow: hidden;
        }

        iframe {
          position: absolute;
          width: 100%;
          height: 100%;
          left: 0;
          top: 0;
        }

        button.yt-video-player{
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 64px;
            height: 64px;
            border-radius: 50%;
            background-color: rgba(0, 0, 0, 0.9);
            transition: transform 0.3s ease;
            cursor: pointer;
        }

        button.yt-video-player::before {
            content: '';
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            mask-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23fff"><path d="M8 5v14l11-7z"/></svg>');
            mask-repeat: no-repeat;
            mask-position: center;
            width: 24px;
            height: 24px;
            background-color: white;
        }

        button.yt-video-player:hover {
            transform: translate(-50%, -50%) scale(1.1);
        }

        .yt-poster-img{
            width: 100%;
            height: 100%;
            object-fit: cover;
            object-position: center;
            cursor: pointer;
        }
        `;

        const styleElement = document.createElement('style');
        styleElement.innerHTML = styleContent;
        document.head.appendChild(styleElement);
    }
}