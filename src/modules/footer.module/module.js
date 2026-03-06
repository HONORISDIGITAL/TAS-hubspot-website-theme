document.addEventListener('DOMContentLoaded', function() {
    const modules = document.getElementsByClassName('footer-module');
    for (let i = 0; i < modules.length; i++) {
        const module = modules[i];

        const columns = module.getElementsByClassName("link-column");



        function colHeight(column) {
            if (column.classList.contains("active")) {
                column.style.height = column.children[0].offsetHeight + column.children[1].offsetHeight + "px";
            } else {
                column.style.height = column.children[0].offsetHeight + "px";
            }
        }

        function colToggle(e) {
            const column = e.target.closest(".link-column");
            if (column.classList.contains("active")) {
                column.classList.remove("active");
            } else {
                for (let i = 0; i < columns.length; i++) {
                    columns[i].classList.remove("active");
                    colHeight(columns[i]);
                }
                column.classList.add("active");
            }
            colHeight(column);
        }



        function mediaquery() {
            if (window.matchMedia("(max-width: 1024px)").matches) { // mobile mode
                for (let i = 0; i < columns.length; i++) {
                    colHeight(columns[i]);
                    columns[i].querySelector("button").addEventListener("click", colToggle);
                }
            } else { // desktop mode
                for (let i = 0; i < columns.length; i++) {
                    columns[i].removeAttribute("style");
                    columns[i].querySelector("button").removeEventListener("click", colToggle);
                }
            };
        };
        mediaquery();
        window.addEventListener("resize", mediaquery);
    }
});