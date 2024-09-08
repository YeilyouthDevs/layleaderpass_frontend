<script lang="ts">
    import debounce from 'lodash-es/debounce';
    import { onMount, tick } from 'svelte';
    import { slide } from 'svelte/transition';
    import Modal from '../Modal.svelte';
    import { DateMode } from './script';

    export let usingYears: number[] = [];
    export let usingMonths: number[] = [];
    export let usingDays: number[] = [];
    export let usingHours: number[] = [];
    export let usingMinutes: number[] = [];
    export let yearRange: number = 100;

    let mode: DateMode = DateMode.DATETIME;
    let prompt: string | undefined = undefined;

    let selectedYear: number | undefined;
    let selectedMonth: number| undefined;
    let selectedDay: number| undefined;
    let selectedHour: number| undefined;
    let selectedMinute: number| undefined;
    let selectedDayOfWeek: string = '';

    let render = false;
    let input: HTMLInputElement | undefined;

    let modal: Modal;
    let yearSpinner: HTMLDivElement;
    let monthSpinner: HTMLDivElement;
    let daySpinner: HTMLDivElement;
    let hourSpinner: HTMLDivElement;
    let minuteSpinner: HTMLDivElement;

    let isScrolling = false;

    onMount(() => {
        fillUsingArrays();
        selectNowIfNotSelected();
        scrollToSelectedValues(false);
    });

    export async function open(inputElem: HTMLInputElement, receivedPrompt: string, requestMode: DateMode = DateMode.DATETIME) {
        resetSelection();
        mode = requestMode;
        prompt = receivedPrompt;

        input = inputElem;
        const value = input.value;

        console.log('날짜값:', value);

        if (!value) {
            selectNow();
        } else {
            parseAndSelect(value);
            console.log('parsing', value)
        }

        await modal?.show();
        render = true;
        await tick();

        scrollToSelectedValues(false);
        updateInputValue();
    }


    export function close() {
        render = false; // 먼저 render를 false로 설정
        modal?.hide();
        resetSelection(); // 추가된 부분
    }


    function fillUsingArrays() {
        const currentYear = new Date().getFullYear();

        if (usingYears.length === 0) {
            for (let i = currentYear - yearRange; i <= currentYear + yearRange; i++) {
                usingYears.push(i);
            }
        }

        if (usingMonths.length === 0) {
            for (let i = 1; i <= 12; i++) {
                usingMonths.push(i);
            }
        }

        if (usingDays.length === 0) {
            for (let i = 1; i <= 31; i++) {
                usingDays.push(i);
            }
        }

        if (usingHours.length === 0) {
            for (let i = 0; i < 24; i++) {
                usingHours.push(i);
            }
        }

        if (usingMinutes.length === 0) {
            for (let i = 0; i < 60; i++) {
                usingMinutes.push(i);
            }
        }

        usingYears.unshift(-1);
        usingYears.push(-1);
        usingMonths.unshift(-1);
        usingMonths.push(-1);
        usingDays.unshift(-1);
        usingDays.push(-1);
        usingHours.unshift(-1);
        usingHours.push(-1);
        usingMinutes.unshift(-1);
        usingMinutes.push(-1);
    }

    function updateSelection(spinner: HTMLDivElement, options: number[], setSelected: (val: number) => void) {
        const scrollCenter = spinner.scrollTop + spinner.clientHeight / 2;
        const optionHeight = 48;
        const selectedIndex = Math.min(Math.max(Math.round((scrollCenter - optionHeight / 2) / optionHeight), 0), options.length - 1);
        const selectedValue = options[selectedIndex];
        setSelected(selectedValue);
        updateDayOfWeek();
        updateInputValue();
    }

    function handleScroll(event: Event, options: number[], setSelected: (val: number) => void) {
        if (!render || isScrolling) return;
        const spinner = event.target as HTMLDivElement;
        updateSelection(spinner, options, setSelected);
        if (spinner === monthSpinner || spinner === yearSpinner) {
            updateDaysDebounced();
        }
    }

    function selectNow() {
        const now = new Date();
        selectedYear = now.getFullYear();
        selectedMonth = now.getMonth() + 1;
        selectedDay = now.getDate();
        selectedHour = now.getHours();
        selectedMinute = now.getMinutes();
        updateDays();
        updateDayOfWeek();
        scrollToSelectedValues(false);
        updateInputValue();
    }

    function selectNowIfNotSelected() {
        if (selectedYear === undefined) selectNow();
    }

    function scrollToSelectedValues(smooth = true) {
        const optionHeight = 48;
        const spinnerHeight = 9 * 16;
        const scrollOptions: ScrollToOptions = smooth ? { behavior: 'smooth' } : { behavior: 'auto' };

        const calculateScrollPosition = (index: number) => {
            return index * optionHeight - spinnerHeight / 2 + optionHeight / 2;
        };

        if (yearSpinner && selectedYear !== undefined) {
            const yearIndex = usingYears.indexOf(selectedYear);
            yearSpinner.scrollTo({ top: calculateScrollPosition(yearIndex), ...scrollOptions });
        }

        if (monthSpinner && selectedMonth !== undefined) {
            const monthIndex = usingMonths.indexOf(selectedMonth);
            monthSpinner.scrollTo({ top: calculateScrollPosition(monthIndex), ...scrollOptions });
        }

        if (daySpinner && selectedDay !== undefined) {
            const dayIndex = usingDays.indexOf(selectedDay);
            daySpinner.scrollTo({ top: calculateScrollPosition(dayIndex), ...scrollOptions });
        }

        if (mode !== DateMode.DATE) {
            if (hourSpinner && selectedHour !== undefined) {
                const hourIndex = usingHours.indexOf(selectedHour);
                hourSpinner.scrollTo({ top: calculateScrollPosition(hourIndex), ...scrollOptions });
            }

            if (minuteSpinner && selectedMinute !== undefined) {
                const minuteIndex = usingMinutes.indexOf(selectedMinute);
                minuteSpinner.scrollTo({ top: calculateScrollPosition(minuteIndex), ...scrollOptions });
            }
        }
    }

    function handleCellClick(value: number, options: number[], setSelected: (val: number) => void, spinner: HTMLDivElement) {
        if (value === -1) return;

        isScrolling = true; // Prevent scroll events temporarily
        setSelected(value);
        const index = options.indexOf(value);
        const optionHeight = 48;
        const spinnerHeight = 9 * 16;
        const scrollPosition = index * optionHeight - spinnerHeight / 2 + optionHeight / 2;
        spinner.scrollTo({ top: scrollPosition, behavior: 'smooth' as ScrollBehavior });
        if (spinner === monthSpinner || spinner === yearSpinner) {
            updateDaysDebounced();
        }
        updateDayOfWeek();
        updateInputValue();
        setTimeout(() => isScrolling = false, 300); // Resume scroll events after a delay
    }

    function updateDays() {
        if (!selectedYear || !selectedMonth) return;

        const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
        usingDays = [];
        for (let i = 1; i <= daysInMonth; i++) {
            usingDays.push(i);
        }
        usingDays.unshift(-1);
        usingDays.push(-1);

        if (selectedDay && selectedDay > daysInMonth) {
            selectedDay = daysInMonth;
        }
    }

    function triggerEvent(element: HTMLInputElement, eventName: string) {
        const event = new Event(eventName, {
            bubbles: true,
            cancelable: true,
        });
        element.dispatchEvent(event);
    }
    
    const updateDaysDebounced = debounce(updateDays, 300);

    function updateInputValue() {
        if (!input) return;

        let value = '';

        if (mode === DateMode.DATETIME) {
            if (selectedYear !== undefined && selectedMonth !== undefined && selectedDay !== undefined && selectedHour !== undefined && selectedMinute !== undefined) {
                value = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')} (${selectedDayOfWeek}) ${String(selectedHour).padStart(2, '0')}:${String(selectedMinute).padStart(2, '0')}`;
            }
        } else if (mode === DateMode.TIME) {
            if (selectedHour !== undefined && selectedMinute !== undefined) {
                value = `${String(selectedHour).padStart(2, '0')}:${String(selectedMinute).padStart(2, '0')}`;
            }
        } else if (mode === DateMode.DATE) {
            if (selectedYear !== undefined && selectedMonth !== undefined && selectedDay !== undefined) {
                value = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')} (${selectedDayOfWeek})`;
            }
        }

        input.value = value;

        // input 이벤트 발생
        triggerEvent(input, 'input');
    }

    function updateDayOfWeek() {
        if (selectedYear !== undefined && selectedMonth !== undefined && selectedDay !== undefined) {
            const date = new Date(selectedYear, selectedMonth - 1, selectedDay);
            const daysOfWeek = ['일', '월', '화', '수', '목', '금', '토'];
            selectedDayOfWeek = daysOfWeek[date.getDay()];
        }
    }

    function parseAndSelect(value: string) {
        const dateTimeParts = value.split(' ');

        if (mode === DateMode.DATETIME && dateTimeParts.length >= 3) {
            const [datePart, dayOfWeekPart, timePart] = dateTimeParts;
            const [year, month, day] = datePart.split('-').map(Number);
            const [hour, minute] = timePart.split(':').map(Number);

            selectedYear = year;
            selectedMonth = month;
            selectedDay = day;
            selectedHour = hour;
            selectedMinute = minute;
            selectedDayOfWeek = dayOfWeekPart.replace(/[()]/g, ''); // Remove parentheses
        } else if (mode === DateMode.TIME && dateTimeParts.length >= 1) {
            const [hour, minute] = dateTimeParts[0].split(':').map(Number);

            selectedHour = hour;
            selectedMinute = minute;
        } else if (mode === DateMode.DATE && dateTimeParts.length >= 2) {
            const [datePart, dayOfWeekPart] = dateTimeParts;
            const [year, month, day] = datePart.split('-').map(Number);

            selectedYear = year;
            selectedMonth = month;
            selectedDay = day;
            selectedDayOfWeek = dayOfWeekPart.replace(/[()]/g, ''); // Remove parentheses
        }

        console.log(selectedYear, selectedMonth, selectedDay, selectedHour, selectedMinute, selectedDayOfWeek);

        updateDays();
        updateDayOfWeek();
        scrollToSelectedValues(false);
        updateInputValue();
    }

    function resetSelect() {
        if (!input) return;

        input.value = ''
        triggerEvent(input, 'input')
        close()
    }

    function resetSelection() {
        selectedYear = undefined;
        selectedMonth = undefined;
        selectedDay = undefined;
        selectedHour = undefined;
        selectedMinute = undefined;
        selectedDayOfWeek = '';
    }
</script>


<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<Modal bind:this={modal} noHeader footerSlot alwaysRender contentClass="date-selector-border">
    {#if prompt}
        <p class="text-center small text-secondary text-pretty mt-1">{prompt}</p>
    {/if}
    
    {#if render}
    <div transition:slide={{axis: 'y', duration: 250}}>
        {#if mode !== DateMode.TIME}
        <div class="p-2 d-flex justify-content-center align-items-center">
            <div bind:this={yearSpinner} class="spinner" on:scroll={(e) => handleScroll(e, usingYears, val => selectedYear = val)}>
                {#each usingYears as year}
                    <div class="spinner-cell {year === selectedYear ? 'selected' : ''}" on:click={() => handleCellClick(year, usingYears, val => selectedYear = val, yearSpinner)}>{year === -1 ? '' : year}</div>
                {/each}
            </div>
            <p>년</p>
            <div bind:this={monthSpinner} class="spinner" on:scroll={(e) => handleScroll(e, usingMonths, val => selectedMonth = val)}>
                {#each usingMonths as month}
                    <div class="spinner-cell {month === selectedMonth ? 'selected' : ''}" on:click={() => handleCellClick(month, usingMonths, val => selectedMonth = val, monthSpinner)}>{month === -1 ? '' : month}</div>
                {/each}
            </div>
            <p>월</p>
            <div bind:this={daySpinner} class="spinner" on:scroll={(e) => handleScroll(e, usingDays, val => selectedDay = val)}>
                {#each usingDays as day}
                    <div class="spinner-cell {day === selectedDay ? 'selected' : ''}" on:click={() => handleCellClick(day, usingDays, val => selectedDay = val, daySpinner)}>{day === -1 ? '' : day}</div>
                {/each}
            </div>
            <p>일</p>
            <p class="ms-2">({selectedDayOfWeek})</p>
        </div>
        {/if}

        {#if mode !== DateMode.DATE}
        <div class="p-2 d-flex justify-content-center align-items-center">
            <div bind:this={hourSpinner} class="spinner" on:scroll={(e) => handleScroll(e, usingHours, val => selectedHour = val)}>
                {#each usingHours as hour}
                    <div class="spinner-cell {hour === selectedHour ? 'selected' : ''}" on:click={() => handleCellClick(hour, usingHours, val => selectedHour = val, hourSpinner)}>{hour === -1 ? '' : hour}</div>
                {/each}
            </div>
            <p>시</p>
            <div bind:this={minuteSpinner} class="spinner" on:scroll={(e) => handleScroll(e, usingMinutes, val => selectedMinute = val)}>
                {#each usingMinutes as minute}
                    <div class="spinner-cell {minute === selectedMinute ? 'selected' : ''}" on:click={() => handleCellClick(minute, usingMinutes, val => selectedMinute = val, minuteSpinner)}>{minute === -1 ? '' : minute}</div>
                {/each}
            </div>
            <p>분</p>
        </div>
        {/if}
    </div>
    {/if}

    <div slot="footer" class="w-100 d-flex justify-content-center gap-1 btn-height">
        <button class="btn btn-danger w-100" on:click={resetSelect}>지우기</button>
        <button class="btn btn-primary w-100" on:click={() => { selectNow() }}>오늘/지금</button>
        <button class="btn btn-success w-100" on:click={close}>확인</button>
    </div>
</Modal>

<style lang="scss">
    .spinner {
        height: 9rem;
        width: 5rem;
        overflow-y: scroll;
        padding: 0 0.3rem;
        scroll-snap-type: y mandatory;
    }

    .spinner::-webkit-scrollbar {
        display: none;
    }

    .spinner-cell {
        border-top: 0.5px dotted lightgray;
        border-bottom: 0.5px dotted lightgray;
        height: 3rem;
        text-align: center;
        padding: 0.5rem 0;
        font-weight: bold;
        font-size: 1.2rem;
        color: rgb(73, 73, 73);
        scroll-snap-align: center;
        cursor: pointer;
    }

    .selected {
        background-color: rgb(222, 247, 211);
    }
</style>
