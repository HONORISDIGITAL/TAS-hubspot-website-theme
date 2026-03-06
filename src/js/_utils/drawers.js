// Use import to call it : import Drawers from '../_utils/drawers';
export default class Drawers {
    /**
     * Creates a Drawers instance.
     * @param {NodeList} drawers - The list of drawer elements.
     * @param {NodeList} drawerContents - The list of content elements corresponding to the drawers.
     * @param {number} activeDrawer - The index of the initially active drawer (default: -1, optional).
     * @param {object} options - Additional options for configuring the Drawers behavior (optional).
     * Options:
     * - oneCanBeOpen: boolean - Whether or not only one drawer can be open at a time (default: false, optional).
     * - activeDrawer: number - The index of the initially active drawer (default: -1, optional).
     * @author William Stephan
     * @example
     * import Drawers from '../_utils/drawers';
     * const drawers = new Drawers(document.querySelectorAll('.drawer'),
     *  document.querySelectorAll('.drawer-content'),
     *  { oneCanBeOpen: true, activeDrawer: 0});
     * 
     * */
    constructor(drawers, drawerContents, options = { activeDrawer: -1, oneCanBeOpen: false }) {
        // Check if drawers and drawerContents are strings (selectors), if so, select the elements
        this.drawers = typeof drawers === 'string' ? document.querySelectorAll(drawers) : drawers;
        this.drawerContents = typeof drawerContents === 'string' ? document.querySelectorAll(drawerContents) : drawerContents;
        if (this.drawers === null || this.drawerContents === null) {
            console.error("Drawers: drawers or drawerContents is null, please check the selector.");
            return;
        }

        this.activeDrawer = options.activeDrawer || -1;
        // If the active drawer is greater than the number of drawers, set it to -1.
        if (this.activeDrawer != -1 && this.activeDrawer > this.drawers.length - 1) {
            this.activeDrawer = -1;
        }
        this.oneCanBeOpen = options.oneCanBeOpen || false;
        this._init();
    }
    /**
     * Calculates the height of the drawer content at the specified index.
     * */
    calculateDrawerContentHeight() {
        for (let i = 0; i < this.drawers.length; i++) {
            this.drawerContents[i].style.height = "auto";
            this.drawerContents[i].setAttribute("data-height", this.drawerContents[i].offsetHeight);
            if (this.activeDrawer !== -1 && this.activeDrawer !== i) {
                this.drawerContents[i].style.height = "0px";
            }
        }
    }
    /**
     * Opens the drawer at the specified index.
     * 
     * @param {number} index - The index of the drawer to open.
     * */
    openDrawer(index) {
        this.drawers[index].classList.add('open');
        this.drawerContents[index].style.height = this.drawerContents[index].getAttribute("data-height") + "px";
        this.activeDrawer = index;
    }
    /**
     * Closes the drawer at the specified index.
     * 
     * @param {number} index - The index of the drawer to close.
     * */
    closeDrawer(index) {
        this.drawers[index].classList.remove('open');
        this.drawerContents[index].style.height = "0px";
        this.activeDrawer = -1;
    }
    /**
     * Closes all drawers.
     * */
    closeAllDrawers() {
        for (let i = 0; i < this.drawers.length; i++) {
            this.closeDrawer(i);
        }
        this.activeDrawer = -1;
    }
    /**
     * Initializes the Drawers instance.
     * @private
     * */
    _init() {
        const self = this;
        this.calculateDrawerContentHeight();
        this.closeAllDrawers();
        if (this.activeDrawer !== -1) {
            this.openDrawer(this.activeDrawer);
        }
        for (let i = 0; i < this.drawers.length; i++) {
            this.drawers[i].addEventListener("click", function () {
                if (this.classList.contains('open')) {
                    self.closeDrawer(i);
                } else {
                    if (self.oneCanBeOpen) {
                        self.closeAllDrawers();
                    }
                    self.openDrawer(i);
                }
            });
        }
        window.addEventListener("resize", function () {
            self.calculateDrawerContentHeight();
        });
    }
}