<script lang="ts">
	import type { ValidationSchema } from "$lib/script/lib/validation";
	import { validate as doValidate } from "$lib/script/lib/validation";
	import { onMount } from "svelte";
	import { assignInitialValue } from "./FormComponents/script";

    export let clazz = '';
    export let style = '';
    export let dataScope = '';
    export let asType: string | undefined = undefined;
    export let noValidate = false;
    export let readonly = false;
    export let floating = false;
    export let from: string | number | object | undefined = undefined;
    export let validation: ValidationSchema | undefined = undefined;
    export let noEditMark: boolean = false;

    let wrapper: HTMLDivElement;

    type FormElement = HTMLInputElement & HTMLSelectElement & HTMLTextAreaElement;
    
    onMount(async () => {
        if (floating) {
            updateLabels();
        }

        if (from){
                
            const elements = wrapper.querySelectorAll('input, select, textarea');

            elements.forEach(el => {
                const element = el as FormElement;

                if (element.id) {
                    assignInitialValue(element, element.id, from!);
                    validate(element)
                }
            });

        }
        
    })

    $: noValidate, wrapper, (() => {
        if (wrapper) {
            toggleInteraction();
        }
    })();

    function validate<T>(element?: T) {
        if (!noValidate && element && validation) doValidate(element, validation)
    }

    function toggleInteraction() {
        const elements = wrapper.querySelectorAll('input, textarea');
        elements.forEach(el => {
            const element = el as HTMLInputElement | HTMLTextAreaElement;
            if (noValidate || readonly) {
                element.setAttribute('readonly', 'true');
                element.style.backgroundColor = 'transparent';
            } else {
                element.removeAttribute('readonly');
                element.style.backgroundColor = ''; // 원래 배경색으로 복원
            }
        });

        const selectElements = wrapper.querySelectorAll('select');
        selectElements.forEach(el => {
            const select = el as HTMLSelectElement;
            if (noValidate || readonly) {
                select.setAttribute('disabled', 'true');
                select.style.backgroundColor = 'transparent';
            } else {
                select.removeAttribute('disabled');
                select.style.backgroundColor = ''; // 원래 배경색으로 복원
            }
        });
    }


    function updateLabels() {
        const elements = wrapper.querySelectorAll('input, select, textarea');
        elements.forEach(el => {
            const element = el as FormElement;
            if (element.id && element.name) {
                // 기존 라벨 확인
                let existingLabel = wrapper.querySelector(`label[for="${element.id}"]`);
                if (!existingLabel) {
                    let label = document.createElement('label');
                    label.htmlFor = element.id;
                    label.innerText = element.name ;
                    element.insertAdjacentElement('afterend', label);
                }
            }
        });
    }


</script>

<div bind:this={wrapper} class="{clazz} position-relative {floating ? 'form-floating' : ''} {noValidate ? 'readonly-field' : ''}" style={style} data-collectable={dataScope} data-validation-container={dataScope} data-as-type={asType}>
    <slot {validate}></slot>

    {#if !noEditMark && !noValidate}
    <img class="edit-icon" src="/images/edit_icon.png" alt="작성가능">
    {/if}
</div>

<style lang="scss">

    .edit-icon {
        width: 0.8rem;
        height: 0.8rem;
        opacity: 0.3;

        position: absolute;
        z-index: 1;
        top: 0.25rem;
        left: 0.25rem;
    }
</style>
