import StepForm from '../../js/_utils/StepForm';

document.addEventListener('DOMContentLoaded', function() {
    const modules = document.getElementsByClassName('hero-form-module');
    for (let i = 0; i < modules.length; i++) {
        const module = modules[i];
        const wrapperForm = module.querySelector('.wrapper-form');
        let stepsLength;
        const instance = new StepForm(wrapperForm, {
            next: {
                class: "btn btn-primary btn-next",
            },
            previous: {
                class: "btn btn-secondary btn-previous no-picto",
            },
            onReady: function(length) {
                stepsLength = length;
            },
            onChangeStep: function(step) {
                highlightStep(step);
            },
            onInvalidStep: function(step) {
                console.log("Invalid step : ", step);
            }
        });

        const indicators = module.querySelectorAll('.wrapper-steps .step');
        const indicatorsText = module.querySelectorAll('.wrapper-steps .text');
        const spacers = module.querySelectorAll('.wrapper-steps .spacer');

        function highlightStep(step) {
            if(!stepsLength || !indicators) return;
            for (let i = 0; i < stepsLength; i++) {
                if (i <= step) {
                    spacers[i-1]?.classList.add('active');
                    indicators[i].classList.add('active');
                    indicatorsText[i].classList.add('active');
                } else {
                    spacers[i-1]?.classList.remove('active');
                    indicators[i].classList.remove('active');
                    indicatorsText[i].classList.remove('active');
                }
            }
        }
    }
});