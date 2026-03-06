document.addEventListener('DOMContentLoaded', function() {
    const modules = document.getElementsByClassName('blog-post-testimonials-module');
    for (let i = 0; i < modules.length; i++) {
        const module = modules[i];

        const postContent = document.getElementById("hs_cos_wrapper_post_body");
        const potTargets = postContent.querySelectorAll("p, div");

        if (module.id && module.id != "") {
            for (let i = 0; i < potTargets.length; i++) {
                if (potTargets[i].textContent == module.id) {
                    potTargets[i].replaceWith(module);
                }
            }
        }
    }
});