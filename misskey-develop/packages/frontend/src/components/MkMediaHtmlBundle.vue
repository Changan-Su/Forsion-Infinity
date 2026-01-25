<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div :class="$style.root">
	<div v-if="hide" :class="$style.sensitive" @click="reveal">
		<span style="font-size: 1.6em;"><i class="ti ti-alert-triangle"></i></span>
		<b>{{ i18n.ts.sensitive }}</b>
		<span>{{ i18n.ts.clickToShow }}</span>
	</div>
	<div v-else-if="!expanded" :class="$style.preview" @click="expand">
		<div :class="$style.previewContent">
			<i class="ti ti-file-code" style="font-size: 2em; margin-bottom: 8px;"></i>
			<b>{{ media.name }}</b>
			<span :class="$style.previewHint">{{ i18n.ts._htmlBundle.clickToView }}</span>
		</div>
	</div>
	<div v-else :class="$style.container">
		<iframe
			:src="iframeSrc"
			:class="$style.iframe"
			sandbox="allow-scripts allow-same-origin"
			:title="media.comment || media.name"
		/>
		<button :class="$style.collapse" @click="collapse" :title="i18n.ts._htmlBundle.collapse">
			<i class="ti ti-chevron-up"></i>
		</button>
	</div>
</div>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue';
import * as Misskey from 'misskey-js';
import { i18n } from '@/i18n.js';
import { url } from '@@/js/config.js';
import { shouldHideFileByDefault, canRevealFile } from '@/utility/sensitive-file.js';

const props = defineProps<{
	media: Misskey.entities.DriveFile;
}>();

const hide = ref(shouldHideFileByDefault(props.media));
const expanded = ref(false);

const iframeSrc = computed(() => {
	if (!props.media.isHtmlBundle || !props.media.id) {
		return '';
	}
	// Build URL to HTML Bundle index.html
	return `${url}/files/${props.media.id}/html-bundle/index.html`;
});

async function reveal() {
	if (!(await canRevealFile(props.media))) {
		return;
	}
	hide.value = false;
}

function expand() {
	expanded.value = true;
}

function collapse() {
	expanded.value = false;
}
</script>

<style lang="scss" module>
.root {
	width: 100%;
	border-radius: 8px;
	margin-top: 4px;
	overflow: clip;
}

.sensitive {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: 8px;
	font-size: 12px;
	padding: 24px;
	background: #111;
	color: #fff;
	cursor: pointer;
	min-height: 120px;
}

.preview {
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 24px;
	background: var(--MI_THEME-panel);
	border: 1px solid var(--MI_THEME-divider);
	border-radius: 8px;
	cursor: pointer;
	transition: background 0.2s, border-color 0.2s;
	min-height: 120px;

	&:hover {
		background: var(--MI_THEME-panelHighlight);
		border-color: var(--MI_THEME-accent);
	}
}

.previewContent {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 8px;
	text-align: center;
}

.previewHint {
	font-size: 0.9em;
	color: var(--MI_THEME-fgMuted);
}

.container {
	position: relative;
	width: 100%;
	border-radius: 8px;
	overflow: clip;
	border: 1px solid var(--MI_THEME-divider);
	background: var(--MI_THEME-bg);
}

.iframe {
	width: 100%;
	border: none;
	display: block;
	max-height: 600px;
	min-height: 400px;
	background: var(--MI_THEME-bg);
}

.collapse {
	position: absolute;
	top: 8px;
	right: 8px;
	padding: 8px;
	background: var(--MI_THEME-panel);
	border: 1px solid var(--MI_THEME-divider);
	border-radius: 6px;
	cursor: pointer;
	opacity: 0.8;
	transition: opacity 0.2s;
	z-index: 10;

	&:hover {
		opacity: 1;
		background: var(--MI_THEME-panelHighlight);
	}
}
</style>
