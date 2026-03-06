// Use import to call it : import Numbers from '../_utils/numbers';
export default class Numbers {
    /**
     * Creates a Numbers instance.
     * @param {NodeList} numbers - The list of number elements.
     * @param {object} options - Additional options for configuring the Numbers behavior (optional).
     * Options:
     * - duration: number - The duration of the animation in milliseconds (default: 2000, optional).
     * - startValue: number - The start value of the animation (default: 0, optional).
     * - delay: number - The delay before the animation starts in milliseconds (default: 500, optional).
     * - animation: boolean - Whether or not the animation is enabled (default: true, optional).
     * @author William Stephan
     * @example
     * import Numbers from '../_utils/numbers';
     * const numbers = new Numbers(document.querySelectorAll('.number'), {
     * duration: 2000,
     * startValue: 0,
     * delay: 500,
     * animation: true
     * });
     * 
     * */
    constructor(numbers, options = { duration: 3000, startValue: 0, delay: 500, animation: true }) {
        this.numbers = numbers;
        this.duration = options.duration || 3000;
        this.startValue = options.startValue || 0;
        this.delay = options.delay || 500;
        this.animation = options.animation || true;
        this.isAnimated = false;
        this._init();
    }
    /**
     * Counts the number of decimals in a number.
     * 
     * @param {number} value - The number to count the decimals of.
     * */
    countDecimals(value) {
        if (Math.floor(value) !== value)
            return value.toString().split(".")[1].length || 0;
        return 0;
    }
    /**
     * Formats a number with spaces.
     * 
     * @param {number} number - The number to format.
     * */
    formatNumberWithSpaces(number) {
        return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
    }
    /**
     * Detect the type of number (integer, decimal or time).
     * 
     * @param {number} number - The number to detect the type of.
     * */
    getNumberType(number) {
        number = number.toString();
        if (/\d+:\d+/.test(number) || /\d+[hms]/.test(number)) {
            return "time";
        } else if (/\d+\.\d+/.test(number) || /\d+,\d+/.test(number)) {
            return "decimal";
        } else {
            return "integer";
        }
    }
    /**
     * Animates a number.
     * 
     * @param {number} finalValue - The final value of the number.
     * @param {HTMLElement} element - The element containing the number.
     * @param {string} sign - The sign of the number.
     * @param {string} unit - The unit of the number.
     * @param {string} type - The type of the number.
     * */
    animateNumber(finalValue, element, sign, unit, type) {
        const self = this;
        const easeInOut = (t) => t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2;
        const startTime = performance.now();
        const decimals = this.countDecimals(finalValue);
        this.isAnimated = true;

        function updateNumber(timestamp) {
            const elapsedTime = timestamp - startTime;
            if (elapsedTime >= self.duration) {
                const formattedValue = type === "time" ? sign + finalValue.toString().replace(".", "h") + unit :
                    sign + self.formatNumberWithSpaces(finalValue) + unit;
                element.innerHTML = formattedValue;
                self.isAnimated = false;
                return;
            }

            const progress = elapsedTime / self.duration;
            const easedProgress = easeInOut(progress);
            const currentValue = (easedProgress * (finalValue - self.startValue)).toFixed(decimals);
            const formattedValue = type === "time" ? sign + currentValue.toString().replace(".", "h") + unit :
                sign + self.formatNumberWithSpaces(currentValue) + unit;
            element.innerHTML = formattedValue;

            requestAnimationFrame(updateNumber);
        }
        requestAnimationFrame(updateNumber);
    }
    /**
     * Initializes the Numbers instance.
     * */
    _init() {
        const self = this;
        const observer = new IntersectionObserver((entries) => {
            if (self.isAnimated && self.animation) {
                return;
            }
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    self.numbers.forEach((number) => {
                        let sign = number.innerHTML.match(/^[=+-]( )*/g);
                        let unit = number.innerHTML.match(/( )*[%€$£⅘èéA-Za-z]*$|\/[0-9]( )*[%€$£⅘èéA-Za-z]*$/g);
                        let nb = number.innerHTML.replace(sign, "").replace(unit, "");

                        const type = self.getNumberType(nb);
                        nb = nb.replace(/[:h]/g, ".").replace(/[,]/g, ".").replace(" ", "");

                        if (type === "integer") {
                            nb = nb.replace(/\s/g, "");
                            nb = parseInt(nb);
                        } else if (type === "decimal") {
                            nb = parseFloat(nb);
                        } else if (type === "time") {
                            nb = parseFloat(nb).toFixed(2);
                        }

                        sign = sign || "";
                        unit = unit || "";
                        number.innerHTML = type == 'time' ? sign[0] + "0h00" + unit[0] : sign[0] + self.formatNumberWithSpaces(0) + unit[0];
                        setTimeout(() => {
                            self.animateNumber(nb, number, sign[0], unit[0], type);
                        }, this.delay);
                    });
                }
            });
        });
        observer.observe(this.numbers[0]);
    }

}