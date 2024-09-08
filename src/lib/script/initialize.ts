import { configureAxiosRequest, configureAxiosResponse } from "$lib/script/configs/axiosConfig";
import { configureRoutingRule } from "./configs/routingRuleConfig";

export function initialize() {
    configureAxiosRequest()
    configureAxiosResponse()
    configureRoutingRule();
}