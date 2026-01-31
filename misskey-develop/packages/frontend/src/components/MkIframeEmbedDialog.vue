<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkModalWindow
	ref="dialogEl"
	:width="500"
	@close="cancel"
	@closed="emit('closed')"
>
	<template #header>{{ i18n.ts.attachIframeEmbed }}</template>

	<div :class="$style.root">
		<MkInfo>{{ i18n.ts.iframeEmbedDescription }}</MkInfo>

		<div :class="$style.section">
			<MkTextarea v-model="iframeCode" :placeholder="'<iframe src=&quot;https://...&quot; width=&quot;100%&quot; height=&quot;400&quot;></iframe>'" @input="parseIframeCode">
				<template #label>{{ i18n.ts.iframeCode }}</template>
			</MkTextarea>
		</div>

		<div v-if="parseError" :class="$style.error">
			<i class="ti ti-alert-triangle"></i> {{ parseError }}
		</div>

		<div v-if="parsedSrc" :class="$style.section">
			<MkInput v-model="parsedSrc" type="url">
				<template #label>{{ i18n.ts.iframeSrc }}</template>
			</MkInput>
		</div>

		<div v-if="parsedSrc" :class="$style.row">
			<MkInput v-model="parsedWidth" :class="$style.halfInput">
				<template #label>{{ i18n.ts.iframeWidth }}</template>
			</MkInput>
			<MkInput v-model="parsedHeight" :class="$style.halfInput">
				<template #label>{{ i18n.ts.iframeHeight }}</template>
			</MkInput>
		</div>

		<div v-if="parsedSrc" :class="$style.section">
			<MkInput v-model="parsedTitle">
				<template #label>{{ i18n.ts.iframeTitle }}</template>
			</MkInput>
		</div>

		<div v-if="parsedSrc && showPreview" :class="$style.previewSection">
			<div :class="$style.previewLabel">{{ i18n.ts.iframePreview }}</div>
			<div :class="$style.previewContainer">
				<iframe
					:src="parsedSrc"
					:width="parsedWidth || '100%'"
					:height="parsedHeight || '300'"
					:title="parsedTitle"
					sandbox="allow-scripts allow-same-origin allow-popups"
					loading="lazy"
				></iframe>
			</div>
		</div>

		<div v-if="parsedSrc" :class="$style.section">
			<MkSwitch v-model="showPreview">{{ i18n.ts.iframePreview }}</MkSwitch>
		</div>

		<div :class="$style.actions">
			<MkButton @click="cancel">{{ i18n.ts.cancel }}</MkButton>
			<MkButton primary :disabled="!parsedSrc" @click="add">{{ i18n.ts.add }}</MkButton>
		</div>
	</div>
</MkModalWindow>
</template>

<script lang="ts" setup>
import { ref, shallowRef } from 'vue';
import MkModalWindow from '@/components/MkModalWindow.vue';
import MkButton from '@/components/MkButton.vue';
import MkInput from '@/components/MkInput.vue';
import MkTextarea from '@/components/MkTextarea.vue';
import MkSwitch from '@/components/MkSwitch.vue';
import MkInfo from '@/components/MkInfo.vue';
import { i18n } from '@/i18n.js';

const emit = defineEmits<{
	(ev: 'done', result: { src: string; width?: string; height?: string; title?: string }): void;
	(ev: 'closed'): void;
}>();

const dialogEl = shallowRef<InstanceType<typeof MkModalWindow>>();
const iframeCode = ref('');
const parsedSrc = ref('');
const parsedWidth = ref('100%');
const parsedHeight = ref('400');
const parsedTitle = ref('');
const parseError = ref('');
const showPreview = ref(true);

function parseIframeCode() {
	parseError.value = '';
	parsedSrc.value = '';

	const code = iframeCode.value.trim();
	if (!code) return;

	// Try to parse as HTML iframe tag
	const iframeMatch = code.match(/<iframe[^>]*\ssrc=["']([^"']+)["'][^>]*>/i);
	if (iframeMatch) {
		const src = iframeMatch[1];
		if (!isValidUrl(src)) {
			parseError.value = i18n.ts.iframeInvalidUrl;
			return;
		}
		parsedSrc.value = src;

		// Extract width
		const widthMatch = code.match(/\swidth=["']?([^"'\s>]+)["']?/i);
		if (widthMatch) {
			parsedWidth.value = widthMatch[1];
		}

		// Extract height
		const heightMatch = code.match(/\sheight=["']?([^"'\s>]+)["']?/i);
		if (heightMatch) {
			parsedHeight.value = heightMatch[1];
		}

		// Extract title
		const titleMatch = code.match(/\stitle=["']([^"']*)["']/i);
		if (titleMatch) {
			parsedTitle.value = titleMatch[1];
		}

		return;
	}

	// Try to parse as plain URL
	if (isValidUrl(code)) {
		parsedSrc.value = code;
		return;
	}

	parseError.value = i18n.ts.iframeParseError;
}

function isValidUrl(string: string): boolean {
	try {
		const url = new URL(string);
		return url.protocol === 'http:' || url.protocol === 'https:';
	} catch {
		return false;
	}
}

function cancel() {
	dialogEl.value?.close();
}

function add() {
	if (!parsedSrc.value) return;

	emit('done', {
		src: parsedSrc.value,
		width: parsedWidth.value || undefined,
		height: parsedHeight.value || undefined,
		title: parsedTitle.value || undefined,
	});
	dialogEl.value?.close();
}
</script>

<style lang="scss" module>
.root {
	padding: 16px;
}

.section {
	margin-bottom: 16px;
}

.row {
	display: flex;
	gap: 8px;
	margin-bottom: 16px;
}

.halfInput {
	flex: 1;
}

.error {
	color: #ff2a2a;
	padding: 8px;
	margin-bottom: 16px;
	background: rgba(255, 42, 42, 0.1);
	border-radius: 4px;
}

.previewSection {
	margin-bottom: 16px;
}

.previewLabel {
	font-weight: bold;
	margin-bottom: 8px;
}

.previewContainer {
	border: 1px solid var(--MI_THEME-divider);
	border-radius: 8px;
	overflow: hidden;
	background: var(--MI_THEME-panel);

	iframe {
		display: block;
		border: none;
		max-width: 100%;
	}
}

.actions {
	display: flex;
	justify-content: flex-end;
	gap: 8px;
	margin-top: 16px;
}
</style>
