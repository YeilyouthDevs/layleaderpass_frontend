<script lang="ts">
	import '$lib/css/main.scss';
	
	import Alert from "$lib/components/Alert.svelte";
	import HeaderAndMenu from "$lib/components/HeaderAndMenu.svelte";
	import LoadingScreen from "$lib/components/LoadingScreen.svelte";
	import { RoutingRuleManager } from '$lib/script/lib/routingRule';
	import { onMount } from "svelte";
	import { page } from '$app/stores';
	
	onMount(() => {
		page.subscribe($page => {
			RoutingRuleManager.evaluate($page)
		});	

		window.addEventListener('beforeunload', (e) => {
			e.preventDefault();
			return '진행사항을 잃어버릴 수 있습니다. 계속하시겠습니까?'
		})
	});

</script>

<svelte:head>
	<link rel="apple-touch-icon" href="favicon.png">
	<title>중직자PASS</title>
</svelte:head>

<LoadingScreen />
<Alert />

<main class="app">
	<HeaderAndMenu />
	<div>
		<slot />
	</div>
</main>

<style lang="scss">
	.app {
		background-color: white;
	}
</style>
