// routingRule.ts

import type { Page } from "@sveltejs/kit";

export interface RoutingRule {
    url: string;
    affectChild?: boolean;
}

export interface RoutingRuleSet {
    rules: RoutingRule[];
    handler: (e: RoutingRuleEvent) => void;
}

export interface RoutingRuleEvent {
    url: string;
    prevUrl: string | null;
}

export class RoutingRuleManager {
    static ruleSets: RoutingRuleSet[] = [];
    static prevUrl: string[] = [];

    static add(ruleSet: RoutingRuleSet) {
        RoutingRuleManager.ruleSets.push(ruleSet); // 룰 세트 추가
    }

    static evaluate(page: Page) {
        if (!page || Object.keys(page).length == 0) return;

        RoutingRuleManager.ruleSets.forEach((ruleSet) => {
            ruleSet.rules.forEach((rule) => {
                const isMatch = rule.affectChild ?
                    page.url.pathname.startsWith(rule.url) :
                    page.url.pathname === rule.url;
                if (isMatch) {
                    ruleSet.handler({
                        url: page.url.pathname,
                        prevUrl: RoutingRuleManager.prevUrl[0]
                    });
                }
            });
        });

        this.prevUrl.push(page.url.pathname);
        if (this.prevUrl.length > 2) this.prevUrl.shift();
        sessionStorage.setItem('history', JSON.stringify(this.prevUrl));
    }
}
