<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div :class="$style.root">
	<div v-if="!loaded" :class="$style.placeholder" @click="load">
		<div :class="$style.placeholderContent">
			<i class="ti ti-player-play"></i>
			<span>{{ i18n.ts.clickToShow }}</span>
			<span :class="$style.url">{{ embed.src }}</span>
		</div>
	</div>
	<div v-else :class="$style.iframeContainer">
		<iframe
			:src="embed.src"
			:width="embed.width || '100%'"
			:height="embed.height || '400'"
			:title="embed.title || ''"
			sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
			loading="lazy"
			referrerpolicy="no-referrer"
		></iframe>
	</div>
</div>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import { i18n } from '@/i18n.js';

const props = defineProps<{
	embed: {
		src: string;
		width?: string | number;
		height?: string | number;
		title?: string;
	};
}>();

const loaded = ref(false);

function load() {
	loaded.value = true;
}
</script>

<style lang="scss" module>
.root {
	margin: 8px 0;
	border-radius: 8px;
	overflow: hidden;
	background: var(--MI_THEME-panel);
}

.placeholder {
	display: flex;
	align-items: center;
	justify-content: center;
	min-height: 200px;
	background: linear-gradient(135deg, var(--MI_THEME-bg) 0%, var(--MI_THEME-panel) 100%);
	cursor: pointer;
	transition: opacity 0.2s;

	&:hover {
		opacity: 0.8;
	}
}

.placeholderContent {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 8px;
	color: var(--MI_THEME-fg);

	i {
		font-size: 48px;
		opacity: 0.5;
	}
}

.url {
	font-size: 0.8em;
	opacity: 0.5;
	max-width: 300px;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.iframeContainer {
	width: 100%;

	iframe {
		display: block;
		border: none;
		width: 100%;
		max-width: 100%;
	}
}
</style>
