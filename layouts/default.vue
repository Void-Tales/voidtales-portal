<script setup lang="ts">
const isMenuOpen = ref(false);

import { onMounted } from 'vue';

onMounted(() => {
	// Erstelle ein neues <link>-Element
	const preloadLink = document.createElement('link');

	// Setze die Attribute für das Preloading
	preloadLink.rel = 'preload';
	preloadLink.as = 'image';
	preloadLink.href = '/images/index-light.webp';

	// Füge das Element zum <head> der Seite hinzu
	document.head.appendChild(preloadLink);
});
</script>

<template>
	<div>
		<header
			class="sticky top-0 z-50 border-b border-neutral-200/40 dark:border-neutral-800/60 bg-transparent dark:bg-transparent backdrop-blur-md"
		>
			<div class="mx-auto max-w-5xl px-6 py-4 flex items-center justify-between">
				<NuxtLink to="/" class="font-semibold tracking-wide mr-4 sm:mr-6"> Void Tales </NuxtLink>

				<!-- Social Links - Hidden on mobile, shown on md and up -->
				<div class="hidden md:flex items-center gap-3">
					<NuxtLink
						to="https://wiki.voidtales.win"
						target="_blank"
						class="px-3 py-1.5 rounded-xl border border-neutral-300/60 dark:border-neutral-700/60 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800/70 transition-colors"
					>
						Wiki
					</NuxtLink>

					<NuxtLink
						to="https://gallery.voidtales.win"
						target="_blank"
						class="px-3 py-1.5 rounded-xl border border-neutral-300/60 dark:border-neutral-700/60 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800/70 transition-colors"
					>
						Gallery
					</NuxtLink>

					<NuxtLink
						to="https://blog.voidtales.win"
						target="_blank"
						class="px-3 py-1.5 rounded-xl border border-neutral-300/60 dark:border-neutral-700/60 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800/70 transition-colors"
					>
						Blog
					</NuxtLink>

					<NuxtLink
						to="https://forum.voidtales.win"
						target="_blank"
						class="px-3 py-1.5 rounded-xl border border-neutral-300/60 dark:border-neutral-700/60 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800/70 transition-colors"
					>
						Forum
					</NuxtLink>

					<NuxtLink
						to="https://discord.voidtales.win"
						target="_blank"
						class="px-3 py-1.5 rounded-xl border border-neutral-300/60 dark:border-neutral-700/60 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800/70 transition-colors"
					>
						Discord
					</NuxtLink>

					<NuxtLink
						to="https://dynmap.voidtales.win"
						target="_blank"
						class="px-3 py-1.5 rounded-xl border border-neutral-300/60 dark:border-neutral-700/60 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800/70 transition-colors"
					>
						World Map
					</NuxtLink>
				</div>

				<!-- Mobile menu button and ColorModeToggle -->
				<div class="flex items-center gap-3 ml-2 sm:ml-4">
					<!-- Hamburger menu button for mobile -->
					<button
						@click="isMenuOpen = !isMenuOpen"
						class="md:hidden p-2 rounded-xl border border-neutral-300/60 dark:border-neutral-700/60 hover:bg-neutral-100 dark:hover:bg-neutral-800/70 transition-colors"
						aria-label="Toggle menu"
					>
						<!-- Simple hamburger icon -->
						<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M4 6h16M4 12h16M4 18h16"
							></path>
						</svg>
					</button>
					<ColorModeToggle />
				</div>
			</div>

			<!-- Mobile menu dropdown -->
			<div
				v-if="isMenuOpen"
				class="md:hidden bg-white dark:bg-neutral-900 border-t border-neutral-200/40 dark:border-neutral-800/60"
			>
				<div class="mx-auto max-w-5xl px-6 py-4 flex flex-col gap-3">
					<NuxtLink
						to="https://wiki.voidtales.win"
						target="_blank"
						class="px-3 py-2 rounded-xl border border-neutral-300/60 dark:border-neutral-700/60 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800/70 transition-colors"
						@click="isMenuOpen = false"
					>
						Wiki
					</NuxtLink>

					<NuxtLink
						to="https://gallery.voidtales.win"
						target="_blank"
						class="px-3 py-2 rounded-xl border border-neutral-300/60 dark:border-neutral-700/60 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800/70 transition-colors"
						@click="isMenuOpen = false"
					>
						Gallery
					</NuxtLink>

					<NuxtLink
						to="https://blog.voidtales.win"
						target="_blank"
						class="px-3 py-2 rounded-xl border border-neutral-300/60 dark:border-neutral-700/60 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800/70 transition-colors"
						@click="isMenuOpen = false"
					>
						Blog
					</NuxtLink>

					<NuxtLink
						to="https://forum.voidtales.win"
						target="_blank"
						class="px-3 py-2 rounded-xl border border-neutral-300/60 dark:border-neutral-700/60 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800/70 transition-colors"
						@click="isMenuOpen = false"
					>
						Forum
					</NuxtLink>

					<NuxtLink
						to="https://discord.voidtales.win"
						target="_blank"
						class="px-3 py-2 rounded-xl border border-neutral-300/60 dark:border-neutral-700/60 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800/70 transition-colors"
						@click="isMenuOpen = false"
					>
						Discord
					</NuxtLink>

					<NuxtLink
						to="https://bluemap.voidtales.win"
						target="_blank"
						class="px-3 py-2 rounded-xl border border-neutral-300/60 dark:border-neutral-700/60 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800/70 transition-colors"
						@click="isMenuOpen = false"
					>
						World Map
					</NuxtLink>
				</div>
			</div>
		</header>

		<div class="mx-auto max-w-5xl px-6 py-10">
			<slot />
		</div>

		<footer class="mt-20 border-t border-neutral-200/40 dark:border-neutral-800/60">
			<div class="mx-auto max-w-5xl px-6 py-8 text-sm opacity-70">
				© {{ new Date().getFullYear() }} Void Tales ~ Created by Hyphonical &amp; Inventory 💙 Not
				affiliated with Mojang or Microsoft. All rights reserved.
			</div>
		</footer>
	</div>
</template>
