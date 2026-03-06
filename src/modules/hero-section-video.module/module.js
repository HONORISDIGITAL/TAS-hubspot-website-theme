document.addEventListener('DOMContentLoaded', function() {
    const modules = document.getElementsByClassName('hero-section-video-module');
    for (let i = 0; i < modules.length; i++) {
        const module = modules[i];

        const btn = module.getElementsByClassName("open-video-popup")[0];
        const popup = module.nextElementSibling;
        const iframe = popup.getElementsByTagName("iframe")[0];
        const background = popup.getElementsByClassName("background")[0];
        
        btn.addEventListener("click", function(){
            popup.classList.add("active");
            iframe.src = iframe.dataset.src;
        });
        
        background.addEventListener("click", function(){
            popup.classList.remove("active");
            iframe.removeAttribute("src");
        });
    }
});