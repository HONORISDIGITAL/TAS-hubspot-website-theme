export class MultiSelect {
    constructor(container, options = {}) {
        if (typeof container === "string") {
            try {
                this.container = document.querySelector(container);
                if (!this.container) {
                    throw new Error(`[MultiSelect] No element found for selector: ${container}`);
                }
            } catch (error) {
                console.error(error);
                this.container = null;
            }
        } else if (container instanceof HTMLElement) {
            this.container = container;
        } else {
            throw new Error("[MultiSelect] Invalid input container: must be a string or an HTMLElement");
        }
        const defaultOptions = {
            unique: false,
            values: [],
            placeholder: 'Selectionner une option',
            maxHeight: 175,
            onOpen: () => { },
            onClose: () => { },
            onSelect: (value, allValues) => { },
            onDeselect: (value, allValues) => { },
            onReset: () => { },
            onChange: (value, allValues) => { }
        };
        this.options = { ...defaultOptions, ...options };
        this.selected = [];
        this.isOpen = false;
        this.dropdown = null;
        this.height = 0;
        this.type = this.container.getAttribute("name") || "default";
        this.init();
    }

    init() {
        this.createHTML();
        this.calculateHeight();
        this.container.addEventListener("click", () => this.toggle());
        window.addEventListener("click", (e) => {
            if (!this.container.contains(e.target)) this.close();
        }, true);
    }

    getPossibleValues() {
        return this.options.values;
    }

    createHTML() {
        this.container.innerHTML = `<span class="value">${this.options.placeholder}</span>`;
        this.dropdown = document.createElement("ul");
        this.dropdown.classList.add("dropdown");
        this.dropdown.style.height = `0px`;

        // Création des éléments de la liste
        this.options.values.forEach(value => {
            const item = document.createElement("li");
            item.classList.add("option");
            item.setAttribute("data-value", value.toLowerCase().replace(/\s+/g, "-"));
            item.innerHTML = `<span>${value}</span>`;
            item.addEventListener("click", (e) => {
                e.stopPropagation();
                this.toggleSelection(item, value);
            });
            this.dropdown.appendChild(item);
        });

        this.container.appendChild(this.dropdown);

        this.btnResetIcon = document.createElement('button');
        this.btnResetIcon.classList.add('btn-reset-icon');
        this.btnResetIcon.setAttribute('aria-label', 'Reset');
        this.btnResetIcon.addEventListener('click', (e) => {
            e.stopPropagation();
            this.deselectAll();
            this.options.onReset();
        });
        this.container.append(this.btnResetIcon);
    }

    calculateHeight() {
        this.height = Array.from(this.dropdown.children).reduce((acc, item) => acc + item.offsetHeight, 0);
    }

    toggle() {
        this.isOpen ? this.close() : this.open();
    }

    open() {
        this.container.classList.add("open");
        this.dropdown.style.height = `${Math.min(this.height, this.options.maxHeight)}px`;
        this.isOpen = true;
        this.options.onOpen(this.selected);
    }

    close() {
        this.container.classList.remove("open");
        this.dropdown.style.height = '0px';
        this.isOpen = false;
        this.options.onClose(this.selected);
    }

    toggleSelection(item, value) {
        if (item.classList.contains("selected")) {
            this.deselectItem(item, value);
        } else {
            this.select(item, value);
        }
    }

    setValues(values) {
        const span = this.container.querySelector(".value");
        if (!values || values.length == 0) {
            span.innerHTML = this.options.placeholder;
            return;
        }
        let text = "";
        let v = values.map(val => val.toLowerCase().replace(/\s+/g, "-"));
        Array.from(this.dropdown.children).forEach(item => {
            if (v.includes(item.dataset.value)) {
                const index = v.indexOf(item.dataset.value);
                text += `${text.length > 0 ? ", " : ""}${values[index]}`;
            }
        });
        span.innerHTML = text;
    }

    select(item, value) {
        if (!item) {
            item = this.dropdown.querySelector(`[data-value="${value.toLowerCase().replace(/\s+/g, "-")}"]`);
        }
        if (this.options.unique) this.deselectAll();
        this.container.classList.add("selected");
        item.classList.add("selected");
        this.selected.push(value);
        this.setValues(this.selected);
        if (this.options.unique) this.close();

        this.options.onSelect(value, this.selected);
        this.options.onChange(value, this.selected);
    }

    deselectItem(item, value) {
        item.classList.remove("selected");
        this.selected = this.selected.filter(val => val !== value);
        if (this.selected.length == 0) { this.container.classList.remove("selected"); }
        this.setValues(this.selected);
        this.options.onDeselect(value, this.selected);
        this.options.onChange(value, this.selected);
    }

    deselect(value) {
        let item = this.dropdown.querySelector(`[data-value="${value.toString().toLowerCase().replace(/\s+/g, "-")}"]`);
        item.classList.remove("selected");
        this.selected = this.selected.filter(val => val !== value);
        if (this.selected.length == 0) { this.container.classList.remove("selected"); }
        this.setValues(this.selected);
        this.options.onDeselect(value, this.selected);
        this.options.onChange(value, this.selected);
    }

    deselectAll() {
        this.selected = [];
        this.setValues(this.selected);
        Array.from(this.dropdown.children).forEach(item => item.classList.remove("selected"));
        this.container.classList.remove("selected");
    }

    reset() {
        this.deselectAll();
        this.options.onReset();
    }
}


export class SearchInput {
    constructor(container, options = { placeholder: 'Search', onSearch: () => { }, onReset: () => { }, onChange: () => { } }) {
        if (typeof container === "string") {
            try {
                this.container = document.querySelector(container);
                if (!this.container) {
                    throw new Error(`[SearchInput] No element found for selector: ${container}`);
                }

            } catch (error) {
                console.error(error);
                this.container = null;
            }
        } else if (container instanceof HTMLElement) {
            this.container = container;
        } else {
            throw new Error("[SearchInput] Invalid input container: must be a string or an HTMLElement");
        }

        const defaultOptions = {
            placeholder: 'Search',
            onSearch: (value) => { },
            onReset: () => { },
            onChange: (value) => { }
        };
        this.options = { ...defaultOptions, ...options };
        this.init();
    }

    init() {
        this.createHTML();
        this.container.addEventListener("input", (e) => {
            this.search(e.target.value);
        })
    }

    createHTML() {
        if (typeof this.container == "string") {
            this.container = document.querySelector(this.container);
            this.container.innerHTML = "";
            this.container.innerHTML = `<input type="text" placeholder="${this.options.placeholder}">`;
            this.input = this.container.querySelector("input");
        } else if (this.container.tagName == "INPUT") {
            this.input = this.container;
            this.input.setAttribute("placeholder", this.options.placeholder);
        } else {
            this.container.innerHTML = "";
            this.container.innerHTML = `<input type="text" placeholder="${this.options.placeholder}">`;
            this.input = this.container.querySelector("input");
        }
    }

    search(value) {
        this.options.onSearch(value);
        this.options.onChange(value);
    }

    reset() {
        this.input.value = "";
        this.options.onReset();
    }
}

export class DateInput {
    /**
     * The DateInput class is a simple date picker that allows users to select a date range.
     * 
     * @param {HTMLElement} input - The input element that will contain the date picker
     * @param {Object} options - The options object
     * @param {String} options.placeholder - The placeholder text
     * @param {Array} options.weekDays - The week days labels
     * @param {Array} options.months - The months labels
     * @param {Function} options.onSelect - The callback function when a date is selected
     * @param {Function} options.onReset - The callback function when the reset button is clicked
     * @param {Function} options.onOpen - The callback function when the date picker is opened
     * @param {Function} options.onClose - The callback function when the date picker is closed
     * 
     * @example
     * const dateInput = new DateInput(document.querySelector('.date-input'), {
     *    placeholder: 'Choose a date',
     *   weekDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
     *  months: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
     * onSelect: (start, end) => console.log(start, end),
     * onReset: () => console.log('Reset'),
     * onOpen: () => console.log('Open'),
     * onClose: () => console.log('Close')
     * });
     */
    constructor(container, options = {}) {
        if (typeof container === "string") {
            try {
                this.container = document.querySelector(container);
                if (!this.container) {
                    throw new Error(`[DateInput] No element found for selector: ${container}`);
                }
            } catch (error) {
                console.error(error);
                // Handle the error appropriately, e.g., set this.container to null or throw the error
                this.container = null;
            }
        } else if (container instanceof HTMLElement) {
            this.container = container;
        } else {
            throw new Error("[DateInput] Invalid input: must be a string or an HTMLElement");
        }
        this.options = {
            placeholder: options.placeholder || 'Choose a date',
            weekDays: ['Lun.', 'Mar.', 'Mer.', 'Jeu.', 'Ven.', 'Sam.', 'Dim.'],
            months: ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'],
            onSelect: options.onSelect || ((timestampStart, timestampEnd) => { }),
            onReset: options.onReset || (() => { }),
            onOpen: options.onOpen || (() => { }),
            onClose: options.onClose || (() => { }),
            onChange: options.onChange || ((indexChanged, timestampStart, timestampEnd) => { })
        };
        this.date = new Date().setHours(0, 0, 0, 0);
        this.selectedDateStart = null;
        this.selectedDateEnd = null;
        this.isOpen = false;

        this.init();
    }

    init() {
        this.createHTML();
        this.bindEvents();
    }

    createHTML() {
        // Structure de base
        this.value = document.createElement('span');
        this.value.classList.add('value');
        this.value.innerHTML = this.options.placeholder;
        this.container.append(this.value);
        this.datePicker = document.createElement('div');
        this.datePicker.classList.add('date-picker');
        this.calendarButtons = document.createElement('div');
        this.calendarButtons.classList.add('calendar-buttons');
        this.calendarContainer = document.createElement('div');
        this.calendarContainer.classList.add('calendar');
        this.datePicker.append(this.calendarButtons);
        this.datePicker.append(this.calendarContainer);
        this.container.append(this.datePicker);

        this.createButtons();
        this.renderCalendar();
    }

    createButtons() {
        this.btnWeek = document.createElement('button');
        this.btnWeek.classList.add('btn-week');
        this.btnWeek.innerHTML = 'Cette semaine';
        this.btnMonth = document.createElement('button');
        this.btnMonth.classList.add('btn-month');
        this.btnMonth.innerHTML = 'Ce mois';
        this.btnNextMonth = document.createElement('button');
        this.btnNextMonth.classList.add('btn-next-month');
        this.btnNextMonth.innerHTML = 'Mois prochain';

        this.btnReset = document.createElement('button');
        this.btnReset.classList.add('btn-reset');
        this.btnReset.innerHTML = 'Réinitialiser';
        this.btnReset.addEventListener('click', () => {
            this.deselectAll();
            this.options.onReset();
        });

        this.btnResetIcon = document.createElement('button');
        this.btnResetIcon.classList.add('btn-reset-icon');
        this.btnResetIcon.setAttribute('aria-label', 'Reset');
        this.btnResetIcon.addEventListener('click', () => {
            this.reset();
        });
        this.container.append(this.btnResetIcon);

        this.calendarButtons.append(this.btnWeek);
        this.calendarButtons.append(this.btnMonth);
        this.calendarButtons.append(this.btnNextMonth);
        this.calendarButtons.append(this.btnReset);

        this.btnWeek.addEventListener('click', () => this.selectWeek());
        this.btnMonth.addEventListener('click', () => this.selectMonth());
        this.btnNextMonth.addEventListener('click', () => this.selectNextMonth());
    }

    bindEvents() {
        this.container.addEventListener('click', (e) => this.toggleCalendar(e));
        this.datePicker.addEventListener('click', (e) => e.stopPropagation());
        window.addEventListener('click', (e) => this.handleDocumentClick(e));
    }

    getPossibleValues() {
        return [new RegExp(/^\d{2}\/\d{2}\/\d{4};(\d{2}\/\d{2}\/\d{4}$)*/)];
    }

    renderCalendar() {
        const calendar = this.generateCalendarHTML();
        this.calendarContainer.innerHTML = calendar;
        this.bindCalendarEvents();
    }

    generateCalendarHTML() {
        const today = new Date();
        const date = new Date(this.date);
        const month = date.getMonth();
        const year = date.getFullYear();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const startDay = new Date(year, month, 1).getDay();

        let days = '';

        // Ajouter des éléments vides pour les jours avant le début du mois
        for (let i = 0; i < (startDay === 0 ? 6 : startDay - 1); i++) {
            days += '<div class="day empty"></div>';
        }

        // Génération des jours du mois
        for (let i = 1; i <= daysInMonth; i++) {
            const currentDay = new Date(year, month, i);
            const isToday = currentDay.getTime() === today.getTime();
            const isPast = new Date(year, month, i + 1).setHours(0, 0, 0, 0) < today.getTime();

            days += `<div class="day${this.isSameDay(this.selectedDateStart, currentDay) || this.isSameDay(this.selectedDateEnd, currentDay) ? ' selected' : ''}${isToday ? ' today' : ''}${isPast ? ' disabled' : ''}${this.isBetween(currentDay, this.selectedDateStart, this.selectedDateEnd) ? " in-range" : ""}" data-date="${currentDay.toISOString()}">${i}</div>`;
        }

        return `
            <div class="calendar-header">
                <button aria-label="Previous Month" class="prev"></button>
                <div class="month-year">${this.options.months[month]} ${year}</div>
                <button aria-label="Next Month" class="next"></button>
            </div>
            <div class="week-days">${this.options.weekDays.map(day => `<div>${day}</div>`).join('')}</div>
            <div class="days-container" style="grid-template-columns: repeat(7, 1fr);">${days}</div>
        `;
    }

    bindCalendarEvents() {
        this.calendarContainer.querySelector('.prev').addEventListener('click', () => this.changeMonth(-1));
        this.calendarContainer.querySelector('.next').addEventListener('click', () => this.changeMonth(1));
        this.calendarContainer.querySelectorAll('.day').forEach(day => {
            day.addEventListener('click', (e) => {
                this.selectDate(e.target.dataset.date)
            });
        });
    }

    toggleCalendar(e) {
        this.isOpen ? this.closeCalendar() : this.openCalendar();
    }

    openCalendar() {
        this.isOpen = true;
        this.datePicker.classList.add('open');
        this.options.onOpen();
    }

    closeCalendar() {
        this.isOpen = false;
        this.datePicker.classList.remove('open');
        this.options.onClose();
    }

    handleDocumentClick(e) {
        if (this.isOpen && !this.calendarContainer.contains(e.target) && e.target !== this.container) {
            this.closeCalendar();
        }
    }

    changeMonth(delta) {
        const today = new Date(this.date);
        this.date = new Date(today).setMonth(today.getMonth() + delta);
        this.renderCalendar();
    }

    selectDate(date) {
        this.clearSideButtons();
        if (this.selectedDateStart && this.selectedDateEnd) {
            this.deselectAll();
            this.selectFirstDate(date);
            this.options.onChange(0, this.selectedDateStart, this.selectedDateEnd);
        } else if (this.selectedDateStart) {
            this.selectLastDate(date);
            this.options.onChange(1, this.selectedDateStart, this.selectedDateEnd);
        } else {
            this.selectFirstDate(date);
            this.options.onChange(0, this.selectedDateStart, this.selectedDateEnd);
        }
        this.options.onSelect(this.selectedDateStart, this.selectedDateEnd);

    }

    setValue(debut, fin) {
        if (!debut) {
            this.container.classList.remove('selected');
            this.value.innerHTML = this.options.placeholder;
            return;
        }
        this.value.innerHTML = this.formatDate(debut, fin);
        this.container.classList.add('selected');
    }

    selectFirstDate(date) {
        this.deselectAll();
        this.selectedDateStart = new Date(date).getTime();
        this.setItemSelected(date);
        this.setValue(this.selectedDateStart);
    }

    selectLastDate(date) {
        this.selectedDateEnd = new Date(date).getTime();
        if (this.selectedDateStart == this.selectedDateEnd) {
            this.deselectAll();
            this.options.onReset();
            return;
        }
        if (this.selectedDateStart > this.selectedDateEnd) {
            let tempDeb = this.selectedDateStart;
            let tempFin = this.selectedDateEnd;
            this.deselectAll();
            this.selectedDateStart = tempFin;
            this.selectedDateEnd = tempDeb;
            this.setItemSelected(this.selectedDateEnd);
        }
        this.setItemSelected(date);
        this.setItemRanged(this.selectedDateStart, this.selectedDateEnd);
        this.setValue(this.selectedDateStart, this.selectedDateEnd);
    }

    setItemSelected(date) {
        this.datePicker.querySelectorAll('.day').forEach(day => {
            if (this.isSameDay(day.dataset.date, date)) {
                day.classList.add('selected');
            }
        });
    }

    setItemRanged(debut, fin) {
        this.datePicker.querySelectorAll('.day').forEach(day => {
            if (this.isBetween(day.dataset.date, debut, fin)) {
                day.classList.add('in-range');
            }
        });
    }

    deselectAll() {
        this.datePicker.querySelectorAll('.day').forEach(day => {
            day.classList.remove('selected');
            day.classList.remove('in-range');
        });
        this.clearSideButtons();
        this.selectedDateStart = null;
        this.selectedDateEnd = null;
        this.setValue(null);
    }

    selectWeek() {
        const today = new Date();
        today.setMonth(today.getMonth());
        today.setFullYear(today.getFullYear());
        this.date = today;
        this.renderCalendar();
        if (this.btnWeek.classList.contains('active')) {
            this.reset();
            return;
        }
        this.deselectAll();
        const week = this.getWeek();
        this.selectFirstDate(week.firstDay);
        this.selectLastDate(week.lastDay);
        this.btnWeek.classList.add('active');
        this.options.onSelect(this.selectedDateStart, this.selectedDateEnd);
        this.options.onChange(1, this.selectedDateStart, this.selectedDateEnd);
    }

    selectMonth() {
        const today = new Date();
        today.setMonth(today.getMonth());
        today.setFullYear(today.getFullYear());
        this.date = today;
        this.renderCalendar();
        if (this.btnMonth.classList.contains('active')) {
            this.reset();
            return;
        }
        this.deselectAll();
        const month = this.getMonth();
        this.selectFirstDate(month.firstDay);
        this.selectLastDate(month.lastDay);
        this.btnMonth.classList.add('active');
        this.options.onSelect(this.selectedDateStart, this.selectedDateEnd);
        this.options.onChange(1, this.selectedDateStart, this.selectedDateEnd);
    }

    selectNextMonth() {
        const today = new Date();
        today.setMonth(today.getMonth() + 1);
        today.setFullYear(today.getFullYear());
        this.date = today;
        this.renderCalendar();
        if (this.btnNextMonth.classList.contains('active')) {
            this.reset();
            return;
        }
        this.deselectAll();
        const month = this.getNextMonth();
        this.selectFirstDate(month.firstDay);
        this.selectLastDate(month.lastDay);
        this.btnNextMonth.classList.add('active');
        this.options.onSelect(this.selectedDateStart, this.selectedDateEnd);
        this.options.onChange(1, this.selectedDateStart, this.selectedDateEnd);
    }

    clearSideButtons() {
        this.btnWeek.classList.remove('active');
        this.btnMonth.classList.remove('active');
        this.btnNextMonth.classList.remove('active');
    }

    getMonth() {
        const today = new Date();
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        return { firstDay: startOfMonth.getTime(), lastDay: endOfMonth.getTime() };
    }

    getWeek() {
        const today = new Date();

        // Calculer le début de la semaine (lundi)
        const startOfWeek = new Date(today);

        // Calculer la fin de la semaine (dimanche)
        const endOfWeek = new Date(today);
        endOfWeek.setDate(today.getDate() + (7 - today.getDay()));

        return { firstDay: startOfWeek.getTime(), lastDay: endOfWeek.getTime() };
    }

    getNextMonth() {
        const today = new Date();
        const currentYear = today.getFullYear();
        const currentMonth = today.getMonth();

        // Calculer le début du mois suivant
        const startOfMonth = new Date(currentYear, currentMonth + 1, 1);

        // Calculer la fin du mois suivant
        const endOfMonth = new Date(currentYear, currentMonth + 2, 0);

        // Gérer le changement d'année si le mois actuel est décembre
        if (currentMonth === 11) {
            startOfMonth.setFullYear(currentYear + 1);
            endOfMonth.setFullYear(currentYear + 1);
        }

        return { firstDay: startOfMonth.getTime(), lastDay: endOfMonth.getTime() };
    }

    isSameDay(date1, date2) {
        return (date1 && date2) && new Date(date1).setHours(0, 0, 0, 0) === new Date(date2).setHours(0, 0, 0, 0);
    }

    isBetween(date, start, end) {
        if (!start || !end) return false;

        // Créer des objets Date en utilisant uniquement le jour, le mois et l'année
        const dateToCheck = new Date(new Date(date).setHours(0, 0, 0, 0));
        const startDate = new Date(new Date(start).setHours(0, 0, 0, 0));
        const endDate = new Date(new Date(end).setHours(0, 0, 0, 0));

        return dateToCheck > startDate && dateToCheck < endDate;
    }

    formatDate(debut, fin) {
        if (fin) {
            const options = { weekday: 'short', day: 'numeric', month: 'short' };
            let start = new Date(debut).toLocaleDateString('fr-FR', options);
            let end = new Date(fin).toLocaleDateString('fr-FR', options);
            return `${start} - ${end}`;
        } else {
            const options = { weekday: 'short', year: 'numeric', month: 'long', day: 'numeric' };
            let start = new Date(debut).toLocaleDateString('fr-FR', options);
            return start;
        }
    }

    reset() {
        this.deselectAll();
        this.options.onReset();
    }

    deselect() {
        this.deselectAll();
        this.options.onChange();
    }
}

export class Checkbox {
    constructor(container, options = {}) {
        if (typeof container === "string") {
            try {
                this.container = document.querySelector(container);
                if (!this.container) {
                    throw new Error(`[Checkbox] No element found for selector: ${container}`);
                }
            } catch (error) {
                console.error(error);
                this.container = null;
            }
        } else if (container instanceof HTMLElement) {
            this.container = container;
        } else {
            throw new Error("[Checkbox] Invalid input container: must be a string or an HTMLElement");
        }

        const defaultOptions = {
            values: [],
            onSelect: (value, allValues) => { },
            onDeselect: (value, allValues) => { },
            onChange: (value, isChecked, allValues) => { },
            onReset: () => { }
        };

        this.options = { ...defaultOptions, ...options };
        this.selected = [];
        this.init();
    }

    init() {
        this.createHTML();
        this.bindEvents();
    }

    getPossibleValues() {
        return this.options.values;
    }

    createHTML() {
        this.container.innerHTML = "";
        this.options.values.forEach(value => {
            const item = document.createElement("div");
            item.classList.add("checkbox");
            item.innerHTML = `
                <input type="checkbox" id="${value.toLowerCase().replace(/\s+/g, "-")}" value="${value}">
                <label for="${value.toLowerCase().replace(/\s+/g, "-")}">${value}</label>
            `;
            this.container.append(item);
        });
    }

    bindEvents() {
        this.container.addEventListener("change", (e) => {
            const input = e.target;
            if (input.type === "checkbox") {
                if (input.checked) {
                    this.selected.push(input.value);
                    this.options.onSelect(input.value, this.selected);
                } else {
                    this.selected = this.selected.filter(val => val !== input.value);
                    this.options.onDeselect(input.value, this.selected);
                }
                this.options.onChange(input.value, input.checked, this.selected);
            }
        });
    }

    select(value) {
        const input = this.container.querySelector(`#${value.toLowerCase().replace(/\s+/g, "-")}`);
        if (input) {
            input.checked = true;
            this.selected.push(value);
            this.options.onSelect(value, this.selected);
            this.options.onChange(value, true, this.selected);
        }
    }

    deselect(value) {
        const input = this.container.querySelector(`#${value.toLowerCase().replace(/\s+/g, "-")}`);
        if (input) {
            input.checked = false;
            this.selected = this.selected.filter(val => val !== value);
            this.options.onDeselect(value, this.selected);
            this.options.onChange(value, false, this.selected);
        }
    }

    reset() {
        this.container.querySelectorAll("input[type='checkbox']").forEach(input => input.checked = false);
        this.selected = [];
        this.options.onReset();
    }
}