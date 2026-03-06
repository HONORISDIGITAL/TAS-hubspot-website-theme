document.addEventListener("DOMContentLoaded", function() {

    let module = document.getElementsByClassName("container-blog-pagination")[0];
    let select = document.getElementsByClassName("select-scroller")[0];

    if (module && select) {
        let arrow = module.getElementsByClassName("scroller-arrow")[0];
        let preview = module.getElementsByClassName("number-preview")[0];
        let mainScroller = module.getElementsByClassName("numbers-scroller")[0];
        let numbersWrapper = module.getElementsByClassName("scroller-wrapper")[0];
        let numbers = module.getElementsByClassName("number-item");
        let scrollBar = module.getElementsByClassName("scroll-bar")[0];
        let scrollHandle = module.getElementsByClassName("scroll-handle")[0];

        function checkOverflow() {
            let mainScrollerHeight = mainScroller.offsetHeight;
            let maxHeight = parseInt(window.getComputedStyle(mainScroller, null).getPropertyValue("max-height"));

            let paddingTop = window.getComputedStyle(mainScroller, null).getPropertyValue("padding-top");
            let paddingBottom = window.getComputedStyle(mainScroller, null).getPropertyValue("padding-bottom");
            let paddingVer = parseInt(paddingTop) + parseInt(paddingBottom);

            let borderTop = window.getComputedStyle(mainScroller, null).getPropertyValue("border-top");
            let borderBottom = window.getComputedStyle(mainScroller, null).getPropertyValue("border-bottom");
            let borderVer = parseInt(borderTop) + parseInt(borderBottom);

            if (mainScrollerHeight >= maxHeight) {
                let numbersWrapperHeight = numbers.length * numbers[0].offsetHeight;
                let temp = (numbersWrapperHeight - (maxHeight - paddingVer - borderVer)) / numbersWrapperHeight * scrollBar.offsetHeight;
                let scrollHandleHeight = scrollBar.offsetHeight - temp;

                scrollHandle.style.height = Math.round(scrollHandleHeight) + "px";
                scrollBar.classList.add("visible");

                numbersWrapper.addEventListener("scroll", function(){
                    let value = numbersWrapper.scrollTop / (numbersWrapperHeight - (maxHeight - paddingVer - borderVer)) * (scrollBar.offsetHeight - scrollHandleHeight);
                    scrollHandle.style.top = Math.round(value) + "px";
                });
            }
        }

        if (preview) {
            preview.addEventListener("click", function(){
                setTimeout(() => {
                    select.classList.add("active");
                }, "50");
    
                setTimeout(() => {
                    checkOverflow();
                }, "400");
            });
        }

        if (arrow) {
            arrow.addEventListener("click", function(){
                if (select.classList.contains("active")) {
                    select.classList.remove("active");
                    scrollBar.classList.remove("visible");
                    numbersWrapper.scrollTop = 0;
                }
            });
        }

        document.addEventListener('click', function(event) {
            if (mainScroller && !mainScroller.contains(event.target)) {
                select.classList.remove("active");
            }
        });
    };
});
