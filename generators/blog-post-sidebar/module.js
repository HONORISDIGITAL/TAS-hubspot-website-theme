document.addEventListener("DOMContentLoaded", function() {
    const modules = document.getElementsByClassName('blog-post-sidebar-module');
    if (modules.length > 0) {
        for (let i = 0; i < modules.length; i++) {

            const module = modules[i];
            
            const copyLink = module.getElementsByClassName("social copy");
            for (let i = 0; i < copyLink.length; i++) {
                copyLink[i].addEventListener("click", function(){
                    const link = copyLink[i].dataset.link;
                    navigator.clipboard.writeText(link).then(
                        function () {
                          console.log("Link copied successfully !");
                        },
                        function () {
                            console.log("Something went wrong while trying to copy the link...");
                        },
                    );
                });
            }



            const list = module.querySelector(".summary-block ol");
            const titles = document.querySelectorAll("#hs_cos_wrapper_post_body h2, #hs_cos_wrapper_post_body h3");
            if (list) {
                if (titles.length > 0) {

                    let mainCounter = 0;
                    let subCounter = 0;
                    const letters = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z"]

                    for (let i = 0; i < titles.length; i++) {
                        if (titles[i].innerHTML != "&nbsp;" && titles[i].innerHTML != "") {
                            let before = "";
                            const element = document.createElement("li");

                            if (titles[i].tagName == "H2" || titles[i].tagName == "h2") {
                                element.classList.add("item");
                                subCounter = 0;
                                mainCounter = mainCounter + 1;
                                before = mainCounter;
                            } else if (titles[i].tagName == "H3" || titles[i].tagName == "h3") {
                                element.classList.add("sub-item");
                                subCounter = subCounter + 1;
                                before = letters[subCounter - 1];
                            }

                            const link = document.createElement("a");
                            link.href = "#title-summary-anchor-" + i;
                            link.textContent = before + ". " + titles[i].textContent;
                            element.append(link);
                            list.append(element);

                            titles[i].id = "title-summary-anchor-" + i;
                        }
                    }

                } else {
                    document.querySelector(".summary-block").remove();
                }
            }
        }
    };
});