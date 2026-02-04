<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div :class="$style.noteCard" @click="openNote">
	<!-- 封面区域 -->
	<div v-if="coverImage" :class="$style.cover">
		<MkImgWithBlurhash 
			:class="$style.coverImage" 
			:src="coverImage.thumbnailUrl ?? coverImage.url" 
			:hash="coverImage.blurhash" 
			:cover="true"
		/>
		<!-- 视频/GIF 标识 -->
		<div v-if="coverImage.type.startsWith('video')" :class="$style.mediaTag">
			<i class="ti ti-video"></i>
		</div>
		<div v-else-if="isGif(coverImage)" :class="$style.mediaTag">
			<i class="ti ti-file-type-gif"></i>
		</div>
	</div>
	<div v-else :class="$style.textCover">
		<Mfm 
			v-if="appearNote.text" 
			:text="truncatedText" 
			:author="appearNote.user" 
			:nyaize="'respect'"
			:plain="true"
		/>
		<div v-else :class="$style.noContent">
			<i class="ti ti-message-circle"></i>
		</div>
	</div>
	
	<!-- 标题/内容 -->
	<div :class="$style.title">
		{{ contentText }}
	</div>
	
	<!-- 底部信息 -->
	<div :class="$style.footer">
		<MkAvatar :class="$style.avatar" :user="appearNote.user" :size="24"/>
		<span :class="$style.username">{{ appearNote.user.name || appearNote.user.username }}</span>
		<span :class="$style.likes">
			<i class="ti ti-heart"></i>
			<span v-if="reactionCount > 0">{{ number(reactionCount) }}</span>
		</span>
	</div>
</div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import * as Misskey from 'misskey-js';
import MkImgWithBlurhash from '@/components/MkImgWithBlurhash.vue';
import MkAvatar from '@/components/global/MkAvatar.vue';
import { useRouter } from '@/router.js';
import number from '@/filters/number.js';

const props = defineProps<{
	note: Misskey.entities.Note;
}>();

const router = useRouter();

const appearNote = computed(() => {
	return props.note.renote ?? props.note;
});

// 获取封面图片（第一张图片）
const coverImage = computed(() => {
	const files = appearNote.value.files;
	if (!files || files.length === 0) return null;
	
	// 优先选择图片或视频
	const media = files.find(file => 
		file.type.startsWith('image') || file.type.startsWith('video')
	);
	
	return media ?? null;
});

// 判断是否为 GIF
const isGif = (file: Misskey.entities.DriveFile) => {
	return file.type === 'image/gif' || file.type === 'image/apng';
};

// 截断文本内容
const truncatedText = computed(() => {
	const text = appearNote.value.text ?? '';
	if (text.length > 100) {
		return text.substring(0, 100);
	}
	return text;
});

// 显示在标题区域的文本
const contentText = computed(() => {
	const text = appearNote.value.text ?? '';
	if (text.length > 60) {
		return text.substring(0, 60) + '...';
	}
	return text || 'No content';
});

// 计算反应数（点赞数）
const reactionCount = computed(() => {
	const reactions = appearNote.value.reactions;
	if (!reactions) return 0;
	
	return Object.values(reactions).reduce((sum, count) => sum + count, 0);
});

// 打开笔记详情
const openNote = () => {
	router.push(`/notes/${appearNote.value.id}`);
};
</script>

<style lang="scss" module>
.noteCard {
	border-radius: 12px;
	overflow: hidden;
	background: var(--MI_THEME-panel);
	cursor: pointer;
	transition: transform 0.2s, box-shadow 0.2s;
	display: flex;
	flex-direction: column;
	
	&:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
	}
}

.cover {
	position: relative;
	aspect-ratio: 3 / 4;
	overflow: hidden;
	background: var(--MI_THEME-bg);
}

.coverImage {
	width: 100%;
	height: 100%;
	object-fit: cover;
}

.mediaTag {
	position: absolute;
	top: 8px;
	right: 8px;
	background: rgba(0, 0, 0, 0.6);
	color: white;
	padding: 4px 8px;
	border-radius: 6px;
	font-size: 12px;
	backdrop-filter: blur(4px);
	
	i {
		font-size: 14px;
	}
}

.textCover {
	aspect-ratio: 3 / 4;
	padding: 16px;
	background: linear-gradient(135deg, var(--MI_THEME-accentedBg) 0%, var(--MI_THEME-bg) 100%);
	display: flex;
	align-items: center;
	justify-content: center;
	overflow: hidden;
	text-align: center;
	font-size: 14px;
	line-height: 1.5;
	color: var(--MI_THEME-fg);
	word-break: break-word;
}

.noContent {
	opacity: 0.5;
	font-size: 32px;
}

.title {
	padding: 8px 12px;
	font-size: 14px;
	line-height: 1.4;
	display: -webkit-box;
	-webkit-line-clamp: 2;
	-webkit-box-orient: vertical;
	overflow: hidden;
	color: var(--MI_THEME-fg);
	font-weight: 500;
	min-height: 2.8em;
}

.footer {
	display: flex;
	align-items: center;
	padding: 8px 12px;
	gap: 8px;
	font-size: 12px;
	color: var(--MI_THEME-fgTransparentWeak);
	border-top: 0.5px solid var(--MI_THEME-divider);
	margin-top: auto;
}

.avatar {
	flex-shrink: 0;
}

.username {
	flex: 1;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
	font-weight: 500;
	color: var(--MI_THEME-fg);
}

.likes {
	display: flex;
	align-items: center;
	gap: 4px;
	color: var(--MI_THEME-fgTransparentWeak);
	flex-shrink: 0;
	
	i {
		font-size: 14px;
	}
}
</style>
