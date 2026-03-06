// Import me with : import StepForm from "../_utils/StepForm";
export default class StepForm {
    /**
     * Crée un formulaire en plusieurs étapes
     * @param {HTMLElement} wrapper - Wrapper du formulaire
     * @param {Object} options - Options du formulaire
     * @param {string} options.dividerText - Texte à mettre dans les dividers
     * @param {boolean} options.previousButton - Ajouter un bouton pour revenir à l'étape précédente
     * @param {Object} options.next - Options du bouton suivant
     * @param {string} options.next.text - Texte du bouton suivant
     * @param {string} options.next.class - Classe du bouton suivant
     * @param {Object} options.previous - Options du bouton précédent
     * @param {string} options.previous.text - Texte du bouton précédent
     * @param {string} options.previous.class - Classe du bouton précédent
     * @param {function} options.onReady - Callback lors de l'initialisation du formulaire
     * @param {function} options.onChangeStep - Callback lors du changement d'étape
     * @param {function} options.onNextStep - Callback lors du passage à l'étape suivante
     * @param {function} options.onPreviousStep - Callback lors du retour à l'étape précédente
     * @param {function} options.onSubmit - Callback lors de la soumission du formulaire
     * @param {function} options.onInvalidStep - Callback lorsqu'une étape n'est pas valide

     * @author MTG Team
     * @version 1.0.0
     * @returns {Object} Form object
    */
    constructor(wrapper, options = {}) {
        if (typeof wrapper === "string") {
            try {
                this.wrapper = document.querySelector(wrapper);
                if (!this.wrapper) {
                    throw new Error(`[StepForm] No element found for selector: ${wrapper}`);
                }
            } catch (error) {
                console.error(error);
                this.wrapper = null;
            }
        } else if (wrapper instanceof HTMLElement) {
            this.wrapper = wrapper;
        } else {
            throw new Error("[StepForm] Invalid input wrapper: must be a string or an HTMLElement");
        }
        const defaultOptions = {
            dividerText: "divider",
            previousButton: true,
            next: {
                text: "Suivant",
                class: "btn",
            },
            previous: {
                text: "Retour",
                class: "btn secondary",
            },
            onReady: (stepsLength) => { },
            onChangeStep: (newIndex, lastInex) => { },
            onNextStep: (index) => { },
            onPreviousStep: (index) => { },
            onSubmit: () => { },
            onInvalidStep: () => { }
        };
        this.wrapper.style.display = "none";
        this.options = { ...defaultOptions, ...options };
        this.#waitLoad(this.wrapper);
    }

    #waitLoad(wrapper) {
        const self = this;
        window.addEventListener('message', function (event) {
            if (event.data.type === 'hsFormCallback' && event.data.eventName === 'onFormReady') {
                if (event.data.id === wrapper.querySelector("form").getAttribute("data-form-id")) {
                    console.log("StepForm Ready : ", event.data);
                    self.init();
                }
            }
        });
        document.onreadystatechange = function () {
            if (document.readyState == "complete") {
                wrapper.style.display = "block";
            }
        };
    }

    /**
     * Initialise le formulaire
     */
    init() {
        this.form = this.wrapper.querySelector('form');
        this.dividers = this.#getDividers();
        this.stepsLength = this.dividers.length + 1;
        this.steps = [];
        this.buttonNext = [];
        this.actualStep = 0;
        this.#generateSteps();
        this.hideAllSteps();
        this.switchToStep(0);
        this.form.onsubmit = () => {
            if (!this.checkIfStepIsValid(this.actualStep)) {
                setTimeout(() => {
                    this.init();
                    this.options.onInvalidStep(this.actualStep);
                }, 100);
            } else {
                this.options.onSubmit();
            }
        };
        this.options.onReady(this.stepsLength);
        setTimeout(() => {
            this.wrapper.classList.add('loaded');
        }, 10);
    }

    #getDividers() {
        if (!this.form) {
            console.error("[Method getDividers] No form found");
            return [];
        }
        const richtexts = this.form.querySelectorAll('.hs-richtext');
        return Array.from(richtexts).filter(richtext => {
            const paragraph = richtext.querySelector('p');
            return paragraph && paragraph.textContent.toLowerCase().includes(this.options.dividerText.toLowerCase());
        });
    }

    #createStepElement(index) {
        let step = document.createElement('div');
        step.classList.add('step');
        step.classList.add('step-' + index);
        this.form.append(step);
        return step;
    }

    #generateSteps() {
        const elements = this.form.querySelectorAll(':scope > *');
        let stepIndex = 0;
        let step = this.#createStepElement(stepIndex);

        elements.forEach((fieldset) => {
            if (fieldset.contains(this.dividers[stepIndex])) {
                this.#finalizeStep(step, stepIndex);
                stepIndex++;
                step = this.#createStepElement(stepIndex);
            } else {
                step.append(fieldset);
            }
        });

        this.#finalizeStep(step, stepIndex, true);
        this.#removeDividers();
        this.form.querySelectorAll(":scope > fieldset").forEach(element => {
            element.remove();
        });
    }

    #finalizeStep(step, stepIndex, isLastStep = false) {
        const wrapperButton = document.createElement('div');
        wrapperButton.classList.add('wrapper-button');
        step.append(wrapperButton);
        if (this.options.previousButton && stepIndex > 0) {
            wrapperButton.append(this.#generatePreviousButton());
        }
        if (isLastStep) {
            const submit = this.form.querySelector('.hs_submit');
            wrapperButton.append(submit);
            submit.addEventListener('click', (e) => {
                e.preventDefault();
                if (!this.checkIfStepIsValid(this.actualStep)) {
                    return;
                }
                this.form.submit();
            });
        } else {
            wrapperButton.append(this.#generateNextButton());
        }
        this.steps.push(step);
    }

    #removeDividers() {
        this.dividers.forEach(divider => {
            divider.remove();
        });
    }

    /**
     * Crée le bouton pour passer à l'étape suivante
     * @return {HTMLElement} - Bouton
     */
    #generateNextButton() {
        let button = document.createElement('div');
        this.options.next.class.split(' ').forEach(className => {
            button.classList.add(className);
        });
        button.setAttribute('type', 'button');
        button.setAttribute('role', 'button');
        button.setAttribute('tabindex', '0');
        button.setAttribute('aria-label', this.options.next.text || "Suivant");
        button.innerHTML = this.options.next.text || "Suivant";
        this.buttonNext.unshift(button);
        button.addEventListener('click', () => {
            if (!this.checkIfStepIsValid(this.actualStep)) {
                this.options.onInvalidStep(this.actualStep);
                return;
            }
            this.switchToStep(this.actualStep + 1);
        });
        return button;
    }

    /**
     * Crée le bouton pour revenir à l'étape précédente
     * @return {HTMLElement} - Bouton
     */
    #generatePreviousButton() {
        let button = document.createElement('div');
        this.options.previous.class.split(' ').forEach(className => {
            button.classList.add(className);
        });
        button.setAttribute('type', 'button');
        button.setAttribute('role', 'button');
        button.setAttribute('tabindex', '0');
        button.setAttribute('aria-label', this.options.previous.text || "Précédent");
        button.innerHTML = this.options.previous.text || "Précédent";
        this.buttonNext.unshift(button);
        button.addEventListener('click', () => {
            this.switchToStep(this.actualStep - 1);
        });
        return button;
    }

    /** 
    * Affiche une étape du formulaire
    * @param {int} index - Index de l'étape à afficher
    * @return {void}
    */
    showStep(index) {
        this.steps[index].style.display = '';
        setTimeout(() => {
            this.steps[index].classList.add('active');
        }, 10);
        this.actualStep = index;
    }

    /**
     * Cache une étape du formulaire
     * @param {int} index - Index de l'étape à cacher
     * @return {void}
     */
    hideStep(index) {
        this.steps[index].style.display = 'none';
        this.steps[index].classList.remove('active');
    }

    /**
     * Cache toutes les étapes du formulaire
     * @return {void}
     */
    hideAllSteps() {
        this.steps.forEach((step, index) => {
            this.hideStep(index);
        });
    }

    /**
     * Passe à l'étape numéro index
     * @param {int} index - Index de l'étape à afficher
     * @return {void}
     */
    switchToStep(index) {
        const lastIndex = this.actualStep;
        this.hideAllSteps();
        this.showStep(index);
        this.options.onChangeStep(index, lastIndex);
        if (index > lastIndex) {
            this.options.onNextStep(index);
        } else {
            this.options.onPreviousStep(index);
        }
    }

    #checkInputValidity(input) {
        if (!input.required) {
            return true;
        }
        if(input.id.toString().includes('LEGAL_CONSENT')) {
            return true;
        }
        input.focus();
        input.blur();
        switch (input.type) {
            case 'email':
                const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                return input.value != "" && regex.test(input.value) && !input.classList.contains('invalid');
            case 'tel':
                return input.value != "" && input.value.length >= 7 && input.value.length <= 15 && !input.classList.contains('invalid');
            case 'file':
                return input.files.length > 0;
            default:
                return input.value != "" && !input.classList.contains('invalid');
        }
    }

    #checkInputBoxValidity(input) {
        if (input.getAttribute('required') === null) {
            return true;
        }
        if(input.id.toString().includes('LEGAL_CONSENT')) {
            return true;
        }
        const checked = input.querySelectorAll('input[type="checkbox"]:checked, input[type="radio"]:checked');
        if (checked.length <= 0) {
            if (input.classList.contains('invalid')) return false;
            input.classList.add('invalid');
            input.append(this.generateErrorMessage('Veuillez remplir ce champ obligatoire.'));
        } else {
            input.classList.remove('invalid');
            input.querySelector('.error-message')?.remove();
        }
        return checked.length > 0;
    }

    checkIfStepIsValid(index) {
        const stepElement = this.steps[index];
        const inputs = stepElement.querySelectorAll('input, textarea, select');
        const radioCheckbox = stepElement.querySelectorAll('ul[role="checkbox"]');
        const isValid = !Array.from(inputs).some(input => !this.#checkInputValidity(input)) && !Array.from(radioCheckbox).some(input => !this.#checkInputBoxValidity(input));
        return isValid;
    }

    generateErrorMessage(message) {
        let error = document.createElement('div');
        error.classList.add('error-message');
        error.innerHTML = message;
        return error;
    }

    getStepsLength() {
        return this.stepsLength;
    }
}