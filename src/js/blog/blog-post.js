document.addEventListener("DOMContentLoaded", function() {
    const modules = document.getElementsByClassName("blog-post-template");
    if (modules.length > 0) {
        for (let i = 0; i < modules.length; i++) {
            const module = modules[i];

            const copyLink = module.querySelector(".side-bar .social.copy");

            const summaryLinks = document.querySelector('.summary-links');
            const postContent = document.querySelector('.post-content');
            const headings = postContent.querySelectorAll('h2');
            


            copyLink.addEventListener("click", function(){
                const link = copyLink.dataset.link;
                navigator.clipboard.writeText(link).then(
                    function () {
                        console.log("Link copied successfully !");
                    },
                    function () {
                        console.log("Something went wrong while trying to copy the link...");
                    },
                );
            });
            


            summaryLinks.innerHTML = '';
            for (let i = 0; i < headings.length; i++) {
                const number = i + 1;
                if (!headings[i].id) {
                    headings[i].id = 'heading-anchor-' + number;
                }
                const a = document.createElement('a');
                a.href = '#' + headings[i].id;
                a.textContent = (number < 10 ? "0" + number : number) + " - " + headings[i].textContent;
                
                summaryLinks.appendChild(a);
            }
        };
    };
});