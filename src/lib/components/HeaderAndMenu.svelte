<script lang="ts">
	import { goto } from "$app/navigation";
	import { alertStore } from "$lib/stores/alertStore";
	import { credentialStore, signout } from "$lib/stores/credentialStore";
	import { headerStore } from "$lib/stores/headerStore";
	import { UserRole, refreshSelfInfo, userStore } from "$lib/stores/userStore";
	import { debounce } from "lodash-es";
	import Modal from "./Modal.svelte";
	import Offcanvas from "./Offcanvas.svelte";

let showMenu = false;

// 세션 만료 등으로 CredentialStore의 이메일이 초기화되면 메뉴를 닫음
$: if (!$credentialStore.email){
  showMenu = false;
}

function toggleMenu() {
    showMenu = !showMenu
}

function goOtherTab(path: string, gotoOptions = {}){
  goto(path, gotoOptions);
  showMenu = false;
}

async function requestSignout(){
 const result = await signout();

 if(result){

  logoutModal.hide();

  alertStore.info({
      content: '로그아웃 되었습니다!',
      duration: 1000
  })

  console.log($credentialStore)

  goOtherTab('/', { replaceState: true })
 }
}

/**
 * 사용자 자신 정보 새로고침 디바운스
 */
const refreshSelfInfoDeb = debounce(async () => {
  await refreshSelfInfo();
}, 1000, {leading: true, trailing: false, maxWait: 2000})

const developerEmail = import.meta.env.VITE_DEVELOPER_EMAIL;

let logoutModal: Modal;

</script>

<!-- svelte-ignore a11y-no-static-element-interactions -->
<!-- svelte-ignore a11y-click-events-have-key-events -->

{#if $credentialStore.email}
<Offcanvas toggle={toggleMenu} show={showMenu} placement="end" style="width: 13rem; overflow-y: auto;">

    <!-- 사용자 정보 인디케이터 -->
    <div class="border-bottom">
        <div id="indicator" class="p-3 d-flex flex-column gap-1">
          <div class="indicator-wrap">
            <img class="indicator-icon" src="/images/remnant_icon.png" alt="유저 아이콘">
            <div class="indicator-value">{$userStore.name}</div>
          </div>
          <div class="indicator-wrap">
            <img class="indicator-icon" src="/images/talent_icon_colored.png" alt="달란트 아이콘">

            <div class="d-flex justify-content-between align-items-center w-100">
              <div class="indicator-value">{$userStore.talent}</div>
              <div id="refreshButton" on:click={refreshSelfInfoDeb}>
                <img class="w-100 h-100" src="/images/refresh_icon.png" alt="새로고침 아이콘">
              </div>
            </div>
            
          </div>

        </div>
    </div>

    <!-- 메뉴 아이템 -->
    {#if $headerStore.useMenu }
    <div id="menu" class="d-flex flex-column justify-content-between h-100">
        <!-- 상단 -->
        <div class="flex-grow-1">

          {#if !$userStore.isDeleted}
          <button class="menu-item" on:click={() => goOtherTab('/home')}>홈 화면</button>
          {/if}
          
          {#if $userStore.role !== UserRole.GUEST && !$userStore.isDeleted}
          <button class="menu-item" on:click={() => goOtherTab('/staticPage/WhatIsThis')}>중직자PASS란?</button>
          <button class="menu-item" on:click={() => goOtherTab('/staticPage/HowToUse')}>참여방법</button>
          <button class="menu-item" on:click={() => goOtherTab('/notice')}>공지사항</button>
          <!-- <button class="menu-item" style="color: rgb(220, 220, 220)">캘린더</button> -->
          <button class="menu-item" on:click={() => goOtherTab('/training')}>훈련</button>
          {/if}

          <button class="menu-item" on:click={() => goOtherTab('/mypage')}>마이페이지</button>

          {#if $userStore.role === UserRole.ADMIN && !$userStore.isDeleted}
          <button class="menu-item" on:click={() => goOtherTab('/adminMenu')}>관리자 메뉴</button>
          {/if}

          {#if $credentialStore.email === developerEmail}
          <button class="menu-item" on:click={() => goOtherTab('/developerMenu')}>개발자 메뉴</button>
          {/if}
          
        </div>

        <!-- 하단 -->
        <div class="">
            <button class="menu-item" on:click={() => logoutModal.show()}>로그아웃</button>
        </div>
    </div>
    {/if}
    

</Offcanvas>
{/if}


<div class="sticky-top user-select-none">
    <nav id="navbar" class="navbar">
        <!-- svelte-ignore a11y-no-static-element-interactions -->
        <!-- svelte-ignore a11y-click-events-have-key-events -->
        <div class="container-fluid">

            <div class="navbar-brand">
              {#if $headerStore.backButton}
                <div id="backButton" on:click={() => window.history.back()}>
                  <img src="/images/back_button.png" alt="뒤로가기">
                </div>
              {/if}
              <div id="title" on:click={() => {
                  if($headerStore.useMenu) {  //로그인 한 경우 notice로, 아닌경우 홈으로
                    goto(($credentialStore.email) ? '/home' : '/')
                  }
                }}>
                <img src="/favicon.png" alt="로고" on:contextmenu={e => e.preventDefault()}>
                <p class="text-white fs-2 p-0 fw-bold">중직자PASS</p>
              </div>
            </div>

            <!-- 메뉴버튼 -->
            {#if $headerStore.useMenu && $credentialStore.email}
            <div id="menuButton" on:click={toggleMenu}>
                <img src="/images/menu_icon.png" alt="메뉴 버튼" />
            </div>
            {/if}
        </div>
    </nav>

</div>

<Modal title="로그아웃" footerSlot bind:this={logoutModal}>
  <p class="text-center">로그아웃 하시겠습니까?</p>

  <div slot="footer" class="d-flex w-100 gap-1">
    <button class="btn btn-primary btn-height w-100" on:click={requestSignout}>로그아웃</button>
    <button class="btn btn-secondary btn-height w-100" on:click={() => logoutModal.hide()}>닫기</button>
  </div>
</Modal>

<style lang="scss">

  #indicator {
    background-color: rgb(255, 255, 255);
  }

  #menu {
    background-color: #eee;
  }


  #refreshButton {
    width: 2.7rem;
    height: 2.7rem;
    opacity: .4;
    border: 1px solid rgb(73, 73, 73);
    padding: 0.25rem;
    padding-left: 0.35rem;
    border-radius: 0.25rem;
  }

  #menuButton {
      display: flex;
      align-items: center;
      border: 3px solid rgb(232, 232, 232);
      border-radius: 0.3rem;
      background-color: transparent;
      width: 3.2rem;
      height: 2.4rem;
      padding: 0.1rem 0.2rem;
      cursor: pointer;

      img {
          width: 100%;
          height: 100%;
      }
}

.menu-item {
    border: none;
    background-color: white;
    width: 100%;
    height: 3rem;
    padding-left: 0.7rem;
    text-align: left;
    font-size: 1.2rem;
    color: rgb(35, 35, 35);
    border-bottom: 1px solid rgb(225, 225, 225);
    border-top: 1px solid rgb(225, 225, 225);
}

#navbar {
    background-color: rgb(148, 192, 143);
    padding: 0.3rem 0;

    img {
      height: 2.3rem;
      opacity: 0.9;
    }
}

.navbar-brand {
  display: flex;
  align-items: center;
  gap: 0.5rem;

  #backButton {
    width: 2.8rem;
    height: 2.4rem;
    display: flex;
    align-items: center;
    cursor: pointer;

    img {
        width: 100%;
        height: 100%;
        opacity: 0.9;
    }
  }

  #title {
    display: flex;
    gap: 0.4rem;
    align-items: center;
    cursor: pointer;
  }
}

.indicator-wrap {
  display: flex;
  align-items: center;
  width: 100%;
  gap: 0.75rem;
}

.indicator-icon {
  width: 1.8rem;
  height: 1.8rem;
  opacity: .8;
}

.indicator-value {
  flex-grow: 1;
  font-size: 1.3rem;
  font-weight: bold;
}

.sticky-top {
  z-index: var(--z-orders-header) !important;
}
</style>
