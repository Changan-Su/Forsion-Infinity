<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div :class="[$style.root, $style[`mode_${mode}`]]">
	<slot></slot>
</div>
</template>

<script lang="ts" setup>
const props = withDefaults(defineProps<{
	mode?: 'masonry' | 'compact';
}>(), {
	mode: 'masonry',
});
</script>

<style lang="scss" module>
.root {
	container-type: inline-size;
	width: 100%;
	padding: 0;
}

// 瀑布流模式
.mode_masonry {
	display: grid;
	gap: 12px;
	
	// 默认：移动端 2 列
	grid-template-columns: repeat(2, 1fr);
	
	// 平板：3 列
	@container (min-width: 600px) {
		grid-template-columns: repeat(3, 1fr);
	}
	
	// 桌面：4 列
	@container (min-width: 900px) {
		grid-template-columns: repeat(4, 1fr);
	}
	
	// 宽屏：5 列
	@container (min-width: 1200px) {
		grid-template-columns: repeat(5, 1fr);
	}
}

// 紧凑模式 - 固定 2 列
.mode_compact {
	display: grid;
	grid-template-columns: repeat(2, 1fr);
	gap: 8px;
	
	// 在小屏幕上保持 2 列
	@container (max-width: 400px) {
		gap: 6px;
	}
}
</style>
