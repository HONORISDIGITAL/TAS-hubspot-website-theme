// Use import to call it : import VideoPlayerManager from '../_utils/Videos';
export default class VideoPlayerManager {
    /**
     * @class
     * @param {string|HTMLElement} videoContainer - The container of the video.
     * @param {Object} options - The options for the video.
     * @param {string} options.title - The title of the video.
     * @param {string} options.type - The type of the video (youtube, file, hubspot).
     * @param {boolean} options.autoplay - Whether to autoplay the video.
     * @param {boolean} options.autoPause - Whether to pause the video when not in view.
     * @param {boolean} options.muted - Whether to mute the video.
     * @param {boolean} options.playerButton - Whether to show the play button.
     * @param {boolean} options.thumbnail - Whether to show the thumbnail.
     * @param {string} options.thumbnailUrl - The url of the thumbnail of the video.
     * @param {Object} options.dimensions - The dimensions of the video.
     * @param {number} options.dimensions.width - The width of the video.
     * @param {number} options.dimensions.height - The height of the video.
     * @param {boolean} options.loop - Whether to loop the video.
     * @param {boolean} options.controls - Whether to show the video controls.
     * @param {Object} options.youtube - The options for the youtube video.
     * @param {string} options.youtube.posterQuality - The quality of the youtube poster image.
     * @param {boolean} options.youtube.noCookie - Whether to use the no cookie mode for youtube.
     * @author MTG Team - WS
     */
    constructor(container, options = {}) {
        this.container = this.#checkContainer(container);
        const defaultOptions = this.#getDefaultOptions();
        const dataOptions = this.#extractDataAttributes(this.container);
        const rawOptions = { ...defaultOptions, ...dataOptions, ...options };
        this.options = this.#normalizeOptions(this.#normalizeOptions(rawOptions));

        this.url = this.options.url;
        this.type = this.options.type;

        // Ensemble des instances de lecteurs vidéo supportées
        VideoPlayerManager.players = {
            youtube: YouTubePlayer,
            file: FilePlayer
        };

        const playerClass = VideoPlayerManager.players[this.type];
        if (!playerClass) {
            throw new Error(`[VideoPlayerManager] Unsupported video type: ${this.type}`);
        }

        // On instancie le lecteur vidéo
        this.player = new playerClass(this.container, this.url, this.options);
    }

    static registerPlayer(type, playerClass) {
        VideoPlayerManager.players[type] = playerClass;
    }

    #getDefaultOptions() {
        return {
            url: "https://www.youtube.com/watch?v=MLpWrANjFbI",
            title: "Youtube Video",
            type: "youtube",
            autoplay: false,
            autoPause: true,
            muted: true,
            playerButton: true,
            dimensions: {
                width: 600,
                height: 430,
            },
            thumbnail: true,
            thumbnailUrl: "https://placehold.co/600x430",
            loop: false,
            controls: true,
            youtube: {
                thumbnailQuality: "maxresdefault",
                noCookie: true,
            }
        };
    }

    #extractDataAttributes(container) {
        return {
            url: container.getAttribute("data-src") || container.getAttribute("data-url"),
            type: container.dataset.type,
            title: container.getAttribute("data-title"),
            thumbnail: container.getAttribute("data-thumbnail"),
            thumbnailUrl: container.getAttribute("data-thumbnail-url"),
            autoplay: container.getAttribute("data-autoplay"),
            autoPause: container.getAttribute("data-auto-pause"),
            muted: container.getAttribute("data-muted"),
            playerButton: container.getAttribute("data-player-button"),
            loop: container.getAttribute("data-loop"),
            controls: container.getAttribute("data-controls"),
            dimensions: {
                width: container.getAttribute("data-width"),
                height: container.getAttribute("data-height")
            },
            youtube: {
                thumbnailQuality: container.getAttribute("data-thumbnail-quality"),
                noCookie: container.getAttribute("data-youtube-nocookie")
            }
        };
    }

    #normalizeOptions(options) {
        const normalized = { ...options };

        // Normaliser les booléens
        const booleanKeys = ['autoplay', 'autoPause', 'muted', 'playerButton', 'thumbnail', 'loop', 'controls'];
        booleanKeys.forEach(key => {
            if (key in normalized) {
                normalized[key] = this.#parseBoolean(normalized[key]);
            }
        });


        if (typeof normalized.dimensions !== 'object') {
            normalized.dimensions = {};
        }

        normalized.dimensions.width = parseInt(normalized.dimensions.width) || 600;
        normalized.dimensions.height = parseInt(normalized.dimensions.height) || 430;

        normalized.youtube = {
            thumbnailQuality: normalized.youtube?.thumbnailQuality || 'maxresdefault',
            noCookie: this.#parseBoolean(normalized.youtube?.noCookie)
        };

        if (!normalized.title || typeof normalized.title !== 'string') {
            normalized.title = 'Youtube Video';
        }

        if (!normalized.thumbnailUrl || typeof normalized.thumbnailUrl !== 'string') {
            normalized.thumbnailUrl = 'https://placehold.co/600x430';
        }

        return normalized;
    }

    #parseBoolean(value) {
        if (typeof value === 'boolean') return value;
        if (typeof value === 'string') {
            return ['true', '1', 'yes'].includes(value.toLowerCase());
        }
        return Boolean(value);
    }

    play() {
        this.player.play();
    }

    pause() {
        this.player.pause();
    }

    #checkContainer(container) {
        if (typeof container === "string") {
            const el = document.querySelector(container);
            if (!el) throw new Error(`[VideoPlayerManager] No element found for selector: ${container}`);
            return el;
        } else if (container instanceof HTMLElement) {
            return container;
        } else {
            throw new Error("[VideoPlayerManager] Invalid container");
        }
    }
}

export class BasePlayer {
    constructor(container, url, options) {
        this.container = container;
        this.url = url;
        this.options = options;
        this.isLoaded = false;

        if (this.options.playerButton == true) {
            this.container.innerHTML = `<span class="btn-video-player" aria-label="Play video" title="Play video"></span>`;
        }
    }

    /**
     * Initialise l'observateur d'intersection pour charger la vidéo lorsque le conteneur est visible.
     */
    initIntersectionObserver() {
        const options = {
            root: null,
            rootMargin: '0px',
            threshold: 0,
        };

        const observer = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !this.isLoaded) {
                    this.load();
                    observer.unobserve(this.container);
                    this.video.classList.add('playing');

                    // remove the poster image
                    this.container.setAttribute("data-thumbnail-hidden", "true");
                }
            });
        }, options);

        observer.observe(this.container);

        if (this.options.autoPause == true) {
            const windowPause = new IntersectionObserver(
                (e, o) => {
                    e.forEach(entry => {
                        if (entry.intersectionRatio !== 1) {
                            if (!this.isLoaded) return;
                            this.pause();
                            this.container.classList.remove('playing');
                        }
                    });
                },
                { threshold: 1 },
            );
            windowPause.observe(this.container);
        }
    }

    /**
     * Charge la vidéo et l'ajoute au conteneur.
     */
    load() { }

    /**
     * Lance la vidéo.
     */
    play() { }

    /**
     * Met la vidéo en pause.
     */
    pause() { }
}

export class YouTubePlayer extends BasePlayer {
    constructor(container, url, options) {
        super(container, url, options);
        this.videoId = this.#extractVideoId(url);
        this.#init();
    }

    #init() {
        this.isLoaded = false;
        this.isPreconnected = false;

        if (this.options.thumbnail) {
            // On ajoute la miniature de la vidéo
            this.#addThumbnail(this.#getThumbnail(this.videoId, this.options.youtube.thumbnailQuality, this.container.getAttribute("data-thumbnail-url")));
        } else {
            this.container.setAttribute("data-thumbnail-hidden", "true");
        }

        if (this.options.autoplay) {
            this.initIntersectionObserver();
        } else {
            this.container.addEventListener(
                'pointerover',
                () => this.#warmConnections(this),
                {
                    once: true,
                },
            );

            this.container.addEventListener('click', () => this.load());
            this.container.setAttribute('tabindex', '0');
            this.container.addEventListener('focusin', (e) => {
                this.load();
                this.play();
            });
        }
    }

    /**
     * Récupère l'ID de la vidéo Youtube à partir de l'URL.
     * 
     * @param {string} url - L'URL de la vidéo.
     * @returns {string} - L'ID de la vidéo.
     * @throws {Error} - Lance une erreur si l'URL est invalide.
     */
    #extractVideoId(url) {
        if (!url) {
            throw new Error("[Video] Invalid input URL: must be a string");
        }
        if (url.includes("youtube.com")) {
            if (url.includes("embed")) {
                return url.split("/").pop();
            }
            return url.split("v=")[1];
        } else if (url.includes("youtu.be")) {
            return url.split("/").pop();
        }
        return url;
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

    #warmConnections() {
        if (this.isPreconnected) return;

        // On précharge les domaines nécessaires pour les vidéos YT
        // Pour les images de preview
        YouTubePlayer.#addPrefetch('preconnect', 'https://i.ytimg.com/');

        // Pour les scripts des vidéos YT
        YouTubePlayer.#addPrefetch('preconnect', 'https://s.ytimg.com');

        if (!this.options.noCookie == false) {
            // Si les cookies sont autorisé on charge les domaines necessaires
            // youtube.com
            YouTubePlayer.#addPrefetch('preconnect', 'https://www.youtube.com');

            // Le botguard script est chargé depuis www.google.com
            YouTubePlayer.#addPrefetch('preconnect', 'https://www.google.com');
        } else {
            // Si on utilise le mode noCookie, on charge les domaines necessaires
            // youtube-nocookie.com
            YouTubePlayer.#addPrefetch('preconnect', 'https://www.youtube-nocookie.com');
        }

        this.isPreconnected = true;
    }

    /**
     * Détermine l'URL de la miniature de la vidéo en fonction de la qualité, de l'ID de la vidéo et de la présence d'une miniature.
     * 
     * @param {boolean} hasThumbnail - Indique si la vidéo a une miniature customisée.
     * @param {string} videoId - L'ID de la vidéo Youtube.
     * @param {string} quality - La qualité de la miniature si c'est la miniature Youtube (par défaut "hqdefault").
     * 
     */
    #getThumbnail(videoId, quality = "hqdefault", thumbnailUrl) {
        if (thumbnailUrl) {
            return thumbnailUrl;
        }
        return `https://i.ytimg.com/vi_webp/${videoId}/${quality}.webp`;
    }

    async #addThumbnail(url) {
        if (!url) {
            console.warn("[Video] No poster URL found, using default poster : https://placehold.co/600x430");
            url = 'https://placehold.co/600x430';
        }
        const webpUrl = url;
        const img = new Image();
        img.fetchPriority = 'low'; // priorité faible pour le chargement
        img.referrerPolicy = 'origin';
        img.src = webpUrl;
        img.alt = this.options.title;
        img.classList.add('thumbnail');
        img.onload = (e) => {
            this.container.append(img);
        }
    }

    load() {
        if (this.isLoaded) return;
        this.#warmConnections(this);

        this.video = this.#generateIframe();
        this.container.append(this.video);
        this.container.classList.add('loaded');
        this.isLoaded = true;
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

    #generateIframe() {
        const wantsNoCookie = this.options.youtube.noCookie ? '-nocookie' : '';
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

    play() {
        if (!this.video) {
            console.warn("[Video] No video found to play");
            return;
        }
        if (this.video.contentWindow) {
            this.video.contentWindow.postMessage('{"event":"command","func":"playVideo","args":""}', '*');
            this.video.classList.add('playing');
            this.container.setAttribute("data-thumbnail-hidden", "true");
        }
    }

    pause() {
        if (!this.video) {
            console.warn("[Video] No video found to pause");
            return;
        }
        if (this.video.contentWindow) {
            this.video.contentWindow.postMessage('{"event":"command","func":"pauseVideo","args":""}', '*');
            this.video.classList.remove('playing');
        }
    }
}

export class FilePlayer extends BasePlayer {
    constructor(container, url, options) {
        super(container, url, options);
        this.#init();
    }

    #init() {
        this.isLoaded = false;

        if (this.options.thumbnail) {
            this.#addThumbnail(this.#getThumbnail(this.options.thumbnailUrl));
        } else {
            this.container.setAttribute("data-thumbnail-hidden", "true");
        }

        if (this.options.autoplay) {
            this.initIntersectionObserver();
        } else {
            this.container.addEventListener('click', () => this.load());
            this.container.setAttribute('tabindex', '0');
            this.container.addEventListener('focusin', (e) => {
                this.load();
                this.play();
            });
        }
    }

    load() {
        if (this.isLoaded) return;

        this.video = this.#generateVideo();
        this.container.append(this.video);
        this.container.classList.add('loaded');
        this.isLoaded = true;
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

    #generateVideo() {
        const video = document.createElement('video');
        let params = ["playsinline"];
        if (this.options.loop == true) {
            params.push("loop");
        }
        // Les Navigateurs modern ne supportent pas autoplay sans interaction utilisateur, il faut donc ajouter muted si on veut autoplay
        if (this.options.muted == true || this.options.autoplay == true) {
            params.push("muted");
            video.muted = true;
        }
        if (this.options.controls == true) {
            params.push("controls");
        }
        if (this.options.autoplay == true) {
            params.push("autoplay");
        }
        video.title = this.options.title;
        video.frameBorder = 0;
        if (this.options.autoplay) {
            video.setAttribute("allow", "autoplay");
        }
        params.forEach(param => {
            video.setAttribute(param, "");
        });
        video.src = this.url;

        return video;
    }

    #getThumbnail(thumbnailUrl) {
        if (!thumbnailUrl) {
            return `https://placehold.co/600x430`;
        }
        return thumbnailUrl;
    }

    async #addThumbnail(url) {
        if (!url) {
            console.warn("[Video] No poster URL found, using default poster : https://placehold.co/600x430");
            url = 'https://placehold.co/600x430';
        }
        const webpUrl = url;
        const img = new Image();
        img.fetchPriority = 'low'; // priorité faible pour le chargement
        img.referrerPolicy = 'origin';
        img.src = webpUrl;
        img.alt = this.options.title;
        img.classList.add('thumbnail');
        img.onload = (e) => {
            this.container.append(img);
        }
        img.addEventListener('click', (e) => {
            this.play();
        });
    }

    play() {
        if (!this.video) {
            console.warn("[Video] No video found to play");
            return;
        }
        this.video.play();
        this.video.classList.add('playing');
        this.container.setAttribute("data-thumbnail-hidden", "true");
    }

    pause() {
        if (!this.video) {
            console.warn("[Video] No video found to pause");
            return;
        }
        this.video.pause();
        this.video.classList.remove('playing');
    }
}
