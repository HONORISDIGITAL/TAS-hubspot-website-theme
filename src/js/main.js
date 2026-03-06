/**
 * Main.js
 *
 * @since 1.0.0
*/

/* Only use import to load modules */

const { gsap } = require("gsap/dist/gsap");
const { ScrollTrigger } = require('gsap/dist/ScrollTrigger');
gsap.registerPlugin(ScrollTrigger);

setTimeout(() => {
    gsap.utils.toArray(".gsap-global-start .gsap-animation-target").forEach((element) => {
        const parentId = element.dataset.gsapParentId;
        const delay = parseFloat(element.dataset.gsapDelay) || 0;

        const triggerElement = parentId ? element.closest(`[data-gsap-id="${parentId}"]`) : element;

        gsap.to(element, {
            x: 0,
            y: 0,
            opacity: 1,
            duration: 0.5,
            delay: delay,
            scrollTrigger: {
                trigger: triggerElement,
                start: "top 75%",
                toggleActions: "play none none none",
            },
        });
    });
}, 1000);

// gsap-animation-target
// data-gsap-direction="bottom-top"
// data-gsap-id="gsap--mod"
// data-gsap-parent-id="gsap--mod"
// data-gsap-delay="{{ (loop.index - 1) * 0.2 }}"

console.log(`%c Designed & Developed by Make the Grade Agency ${new Date().getFullYear()}`, 'color: #fff; background: #000; border: 1px solid #000; text-align:center; padding: 0.25rem; font-weight: bold;');
