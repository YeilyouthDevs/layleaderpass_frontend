// routingRuleConfig.ts

import { goto } from "$app/navigation";
import { alertStore } from "$lib/stores/alertStore";
import type { CredentialData } from "$lib/stores/credentialStore";
import { credentialStore } from "$lib/stores/credentialStore";
import { UserRole, userStore, type UserData } from "$lib/stores/userStore";
import { RoutingRuleManager, type RoutingRuleEvent } from "../lib/routingRule";

let credential: CredentialData;

credentialStore.subscribe(($credentialStore => {
    credential = $credentialStore;
}))

let user: UserData;

userStore.subscribe(($userStore => {
    user = $userStore;
}))

export function configureRoutingRule(){
    RoutingRuleManager.add({
        rules: [
            { url: '/' },
            { url: '/login' },
            { url: '/register', affectChild: true },
            { url: '/findAccount' }
        ],
        handler: (e: RoutingRuleEvent) => {
            if (credential.email){
                goto(e.prevUrl || '/home', { replaceState: true })
            }
                
        }
    });

    RoutingRuleManager.add({
        rules: [
            { url: '/notice', affectChild: true },
            { url: '/adminMenu', affectChild: true },
            { url: '/mypage', affectChild: true },
            { url: '/home', affectChild: true },
            { url: '/static', affectChild: true },
        ],
        handler: () => {
            if (!credential.email){ //이메일이 없으면 로그인페이지로 보냄
                goto('/login', { replaceState: true })

                alertStore.warn({
                    content: '로그인이 필요한 서비스입니다.',
                    duration: 2000
                })
            }
        }
    })

    
    RoutingRuleManager.add({
        rules: [
            { url: '/notice', affectChild: true },
            { url: '/adminMenu', affectChild: true },
            { url: '/static', affectChild: true },
        ],
        handler: () => {
            if(user.role === UserRole.GUEST){ // 가입승인 없이 home 이외로 진입하면 home으로 보냄
                goto('/home', { replaceState: true })
            }
        }
    })

    RoutingRuleManager.add({
        rules: [
            { url: '/'},
            { url: '/notice', affectChild: true },
            { url: '/adminMenu', affectChild: true },
            { url: '/home', affectChild: true },
            { url: '/static', affectChild: true },
            { url: '/training', affectChild: true },
        ],
        handler: () => {
            if(user.isDeleted === true){ // 복원자를 정보수정 페이지로 보냄
                goto('/mypage/editUser', { replaceState: true })
            }
        }
    })

}
