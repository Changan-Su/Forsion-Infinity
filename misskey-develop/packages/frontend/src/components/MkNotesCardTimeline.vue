<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkPagination :paginator="paginator" :direction="direction" :autoLoad="autoLoad" :pullToRefresh="pullToRefresh" :withControl="withControl" :forceDisableInfiniteScroll="forceDisableInfiniteScroll">
	<template #empty>
		<MkResult type="empty" :text="i18n.ts.noNotes"/>
	</template>

	<template #default="{ items: notes }">
		<MkMasonryLayout :mode="mode" :class="$style.root">
			<MkNoteCard 
				v-for="note in notes" 
				:key="note.id" 
				:note="note"
			/>
		</MkMasonryLayout>
	</template>
</MkPagination>
</template>

<script lang="ts" setup generic="T extends IPaginator<Misskey.entities.Note>">
import * as Misskey from 'misskey-js';
import type { MkPaginationOptions } from '@/components/MkPagination.vue';
import type { IPaginator } from '@/utility/paginator.js';
import MkNoteCard from '@/components/MkNoteCard.vue';
import MkMasonryLayout from '@/components/MkMasonryLayout.vue';
import MkPagination from '@/components/MkPagination.vue';
import MkResult from '@/components/global/MkResult.vue';
import { i18n } from '@/i18n.js';
import { useGlobalEvent } from '@/events.js';

const props = withDefaults(defineProps<MkPaginationOptions & {
	paginator: T;
	mode?: 'masonry' | 'compact';
}>(), {
	autoLoad: true,
	direction: 'down',
	pullToRefresh: true,
	withControl: false,
	forceDisableInfiniteScroll: false,
	mode: 'masonry',
});

useGlobalEvent('noteDeleted', (noteId) => {
	props.paginator.removeItem(noteId);
});

function reload() {
	return props.paginator.reload();
}

defineExpose({
	reload,
});
</script>

<style lang="scss" module>
.root {
	background: var(--MI_THEME-bg);
}
</style>
