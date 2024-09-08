<script lang="ts">
	import { loadingStore } from '$lib/stores/loadingStore';
    //@ts-ignore
    import WebViewer from '@pdftron/pdfjs-express-viewer';
    import { onMount } from 'svelte';
    
    export let src: string | undefined = undefined;

    const zIndexHide = '--z-orders-pdf-viewer-hide'
    const zIndexShow = '--z-orders-pdf-viewer-show'
    const apiToken = 'bVv3V5BbsQZIGKHiSzNI'
    
    let isVisible = false;
    let loadPromiseResolvers: { resolve: CallableFunction; reject: CallableFunction } | null = null;
    let documentViewer: any;
    let documentLoadState: 'pending' | 'loaded' | null = null;
    let viewerLoadState: 'pending' | 'loaded' | null = null;
    let viewerZIndex = zIndexHide;
    let viewerBind: HTMLDivElement | null = null;

    onMount(() => {
        if (viewerBind){
            viewerBind.addEventListener('transitionend', moveViewerZIndexBehind);
        }

        return () => {

            if (viewerBind){
                viewerBind.removeEventListener('transitionend', moveViewerZIndexBehind);
            }
        }
    });

    export async function toggleVisibility() {
        isVisible = !isVisible;

        if (isVisible) {
            if (viewerLoadState !== 'loaded' || documentLoadState !== 'loaded') loadingStore.showRightNow();
            viewerZIndex = zIndexShow; // 바로 전경으로 이동
        }
    }

    export async function init() {
        try {
            await initializeViewer();
        } catch(error){
            console.error('PDF Viewer 초기화 실패함', error)
        } finally {
            loadingStore.hide();
        }
    }
    
    export async function load(newSrc:string) {
        try{
            if (documentViewer){

                documentViewer.closeDocument();

                documentLoadState = 'pending';
                await documentViewer.loadDocument(newSrc);
                documentLoadState = 'loaded';
                
                src = newSrc;
            } else throw new Error('PDF Viewer가 아직 초기화되지 않음');
        
        } catch(error){
            console.error('PDF Viewer 문서 로딩 실패함,', newSrc, error)
        } finally {
            loadingStore.hide();
        }
    }
    
    function initializeViewer() {
        return new Promise<void>((resolve, reject) => {
    
            if (viewerLoadState) {
                resolve();
                return;
            }
    
            viewerLoadState = 'pending';
            loadPromiseResolvers = { resolve, reject };
    
            try {
                const viewerElement = document.getElementById('pdfViewer');

                WebViewer({
                    path: '/pdf-viewer-lib',
                    initialDoc: src,
                    licenseKey: apiToken,
                }, viewerElement).then((instance: { docViewer: any; UI: any; }) => {
                    const { docViewer, UI } = instance;

                    documentViewer = docViewer;
                
                    UI.setHeaderItems((headerItems: { type: string; render: () => HTMLDivElement; }[]) => {
                        headerItems.push(createCloseButton());
                    });

                    viewerLoadState = 'loaded';
                    resolve();
                })

            } catch (error) {
                reject(error);
            }
        });
    }

    function createCloseButton() {
        return {
            type: 'customElement',
            render: function() {
                const button = document.createElement('div');
                
                button.style.border = '2px solid black'
                button.style.borderRadius = '0.25rem';
                button.style.display = 'flex';
                button.style.alignItems = 'center';
                button.style.justifyContent = 'center';
                button.style.fontWeight = 'bold';
                button.style.fontSize = '1rem';
                button.style.color = 'black';
                button.style.width = button.style.minWidth = '3rem';
                button.style.height = '2.5rem';
                button.style.marginLeft = '0.25rem';
                button.style.opacity = '0.4';
                button.innerText = '닫기'

                button.onclick = function() {
                    toggleVisibility();
                }

                return button;
            }
        };
    }

    function moveViewerZIndexBehind(event: TransitionEvent) {
        if (event.propertyName === 'opacity' && !isVisible) {
            viewerZIndex = zIndexHide; // opacity 전환 완료 후 배경으로 이동
        }
    }

    
</script>
    
    <div bind:this={viewerBind} class="pdf-viewer-class {isVisible ? 'viewer-show' : 'viewer-hide'}" style="z-index: var({viewerZIndex});">
        <div id="pdfViewer" class="flex-grow-1"></div>
    </div>
    
<style lang="scss">
    .viewer-show, .viewer-hide {
        transition: opacity 200ms;
    }

    .viewer-show {
        opacity: 1;
    }

    .viewer-hide {
        opacity: 0;
    }

    .pdf-viewer-class {
        // z-index 설정 제거
        width: 100vw;
        height: 100vh;
        position: fixed;
        top: 0;
        left: 0;
        display: flex;
        flex-direction: column;
        background-color: #f1f3f5;
    }
</style>
    