import Videos from "../../js/_utils/videos";

document.addEventListener('DOMContentLoaded', function () {
    const modules = document.getElementsByClassName('hero-module');
    for (let i = 0; i < modules.length; i++) {
        const module = modules[i];
        const videos = module.querySelectorAll(".video");

        // Video Player
        if (videos.length > 0) {
            videos.forEach((video) => {
                const videoInstance = new Videos(video, {
                    playerButton: true,
                    poster: true,
                    loop: false,
                    muted: false,
                    autoplay: false,
                    controls: true,
                });
            });
        }
    }
});