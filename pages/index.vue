<template>
	<!-- Hero Section -->
	<section class="text-center space-y-8 relative">
		<div
			class="mx-auto w-full max-w-xs relative flex flex-col items-center text-center overflow-visible"
		>
			<h1 class="text-5xl font-bold tracking-wide">Void Tales</h1>
			<div class="w-full relative flex flex-col items-center justify-center">
				<div
					class="absolute inset-x-0 top-0 bg-gradient-to-r from-transparent via-indigo-500 to-transparent h-[2px] w-full blur-sm"
				></div>
				<div
					class="absolute inset-x-0 top-0 bg-gradient-to-r from-transparent via-indigo-500 to-transparent h-px w-full"
				></div>
				<div
					class="absolute inset-x-0 top-0 bg-gradient-to-r from-transparent via-purple-400 to-transparent h-[5px] w-1/2 blur-sm"
				></div>
				<div
					class="absolute inset-x-0 top-0 bg-gradient-to-r from-transparent via-purple-400 to-transparent h-px w-1/2"
				></div>
				<div
					class="absolute inset-0 w-full h-full [mask-image:radial-gradient(50%_200px_at_top,transparent_20%,white)]"
				></div>
			</div>
			<span
				class="pointer-events-none absolute -z-[1] inset-0 w-full h-full flex before:content-[''] before:h-3/4 before:w-full before:bg-gradient-to-r before:from-neutral-900 before:to-purple-600 before:blur-[90px] after:content-[''] after:h-1/2 after:w-full after:bg-gradient-to-br after:from-cyan-400 after:to-sky-300 after:blur-[90px]"
			></span>
		</div>

		<p class="text-lg opacity-80">A station between worlds ✨</p>
	</section>

	<!-- Connect Panel -->
	<section class="mx-auto w-full max-w-5xl px-6 py-6 opacity-0 animate-fade-in">
		<h2 class="text-2xl font-semibold tracking-wide mb-4">Connect</h2>

		<div class="grid grid-cols-1 sm:grid-cols-2 gap-4 items-stretch">
			<!-- ServerStatus now reuses glass-panel -->
			<ServerStatus class="glass-panel h-full justify-between" />

			<!-- Right panel uses the same glass-panel -->
			<div class="glass-panel justify-between">
				<div>
					<h3 class="text-sm font-medium mb-2">News & Announcements</h3>
					<p class="text-xs opacity-85 mb-3">
						Here could be a devlog entry from discord or something with added via workflow.
					</p>
					<ul class="text-xs space-y-2">
						<li class="flex items-start gap-2">
							<span class="mt-1 h-2 w-2 rounded-full bg-purple-500/80"></span> Event: Saturday 20:00
						</li>
						<li class="flex items-start gap-2">
							<span class="mt-1 h-2 w-2 rounded-full bg-indigo-500/80"></span> New questline now
							live
						</li>
					</ul>
				</div>
				<div class="mt-3 flex justify-end">
					<a
						href="/more"
						class="inline-block px-3 py-2 text-sm rounded-lg border border-neutral-300/60 dark:border-neutral-700/60"
						>Learn more</a
					>
				</div>
			</div>
		</div>
	</section>

	<!-- Portal Content Left -->
	<section class="section-shell">
		<div class="grid items-center gap-10 md:gap-14 md:grid-cols-2">
			<div class="space-y-5">
				<h2 class="section-title">Through Ash and Arcana</h2>
				<p class="text-base leading-relaxed opacity-85">
					You awaken in a world undone, where the goddess Phia lies scattered and silent, her
					fragments hidden across realms touched by the void. At the center of it all stands the
					Soul Station—a place where memory drifts, where paths between worlds converge. To walk
					this journey is to seek not only the pieces of a fallen divinity, but also the shape of
					your own forgotten self.
				</p>
				<ul class="space-y-2.5 text-sm opacity-85">
					<li class="flex gap-3">
						<span class="mt-2 h-2 w-2 rounded-full bg-purple-500/80"></span>
						<span>Gather Phia’s fragments, hidden in worlds fractured by the void.</span>
					</li>
					<li class="flex gap-3">
						<span class="mt-2 h-2 w-2 rounded-full bg-indigo-500/80"></span>
						<span>Shape your soul with relics, sigils, and attunements.</span>
					</li>
					<li class="flex gap-3">
						<span class="mt-2 h-2 w-2 rounded-full bg-cyan-400/80"></span>
						<span>Confront the trials that guard the way between memory and rebirth.</span>
					</li>
				</ul>
			</div>

			<!-- Image Card: slanted left -->
			<div class="relative [perspective:1200px] animate-bob" style="animation-delay: -1.5s">
				<div class="card card-hover tilt-left">
					<div class="card-glow"></div>
					<img
						src="/images/portal-1.webp"
						alt="Void Tales ~ Soul Station"
						width="800"
						height="600"
						loading="lazy"
						class="w-full h-auto"
					/>
					<div class="card-tint"></div>
					<div class="card-ring"></div>
				</div>
			</div>
		</div>
	</section>

	<!-- Portal Content Right -->
	<section class="section-shell">
		<div class="grid items-center gap-10 md:gap-14 md:grid-cols-2">
			<!-- Image Card: slanted right -->
			<div class="relative [perspective:1200px] animate-bob">
				<div class="card card-hover tilt-right">
					<div class="card-glow"></div>
					<img
						src="/images/portal-2.webp"
						alt="Void Tales ~ Soul Station"
						width="800"
						height="600"
						loading="lazy"
						class="w-full h-auto"
					/>
					<div class="card-tint"></div>
					<div class="card-ring"></div>
				</div>
			</div>
			<div class="space-y-5">
				<h2 class="section-title">The Shattered Realms</h2>
				<p class="text-base leading-relaxed opacity-85">
					The lands you cross are more than ruins—they are kingdoms long surrendered to time. In the
					autumn-bound halls of Falwhind, beneath the endless trees of Ibya, or in the buried stone
					of Aridia, every shadow holds its own memory. Battles rise and fall, strange events twist
					the present, and creatures beyond reason linger in the dark. Here, to lose yourself is to
					step closer to the truth the world has hidden.
				</p>
				<ul class="space-y-2.5 text-sm opacity-85">
					<li class="flex gap-3">
						<span class="mt-2 h-2 w-2 rounded-full bg-purple-500/80"></span>
						<span>Wander realms each marked by their own history and peril.</span>
					</li>
					<li class="flex gap-3">
						<span class="mt-2 h-2 w-2 rounded-full bg-indigo-500/80"></span>
						<span>Face encounters, events, and challenges that shift with the world.</span>
					</li>
					<li class="flex gap-3">
						<span class="mt-2 h-2 w-2 rounded-full bg-cyan-400/80"></span>
						<span
							>Discover the strange beauty of being lost—and the wonder of finding your way.</span
						>
					</li>
				</ul>
			</div>
		</div>
	</section>

	<!-- Gallery Carousel -->
	<section class="section-shell">
		<div class="narrow-center text-center mb-10">
			<h2 class="section-title">Echoes from the Station</h2>
			<p class="opacity-85">Glimpses across realms—moments caught between memory and motion.</p>
		</div>

		<div class="embla" ref="emblaRef">
			<div class="embla__container flex gap-x-8">
				<div v-for="img in images" :key="img" class="embla__slide">
					<div class="card">
						<div class="card-glow"></div>
						<img
							class="embla__slide__img w-full h-auto"
							:src="img"
							alt="Void Tales ~ Soul Station"
							width="800"
							height="450"
							loading="lazy"
						/>
						<div class="card-tint"></div>
						<div class="card-ring"></div>
					</div>
				</div>
			</div>
		</div>

		<div class="narrow-center text-center mt-10">
			<p class="opacity-85">
				Fragments remain—each a path back to what was lost, and forward to what must be found.
			</p>
		</div>
	</section>

	<!-- Trailer Section -->
	<section class="section-shell">
		<div class="narrow-center text-center mb-10">
			<h2 class="section-title">Watch the Trailer</h2>
			<p class="opacity-85 mb-6">Step into the world of Void Tales.</p>
			<div class="mx-auto w-full max-w-2xl flex justify-center">
				<div
					class="rounded-2xl overflow-hidden border border-indigo-400/60 shadow-[0_0_0_4px_rgba(128,90,213,0.15),0_8px_32px_0_rgba(139,92,246,0.25)] aspect-video w-full"
					style="
						box-shadow:
							0 0 0 2px rgba(128, 90, 213, 0.25),
							0 0 0 6px rgba(139, 92, 246, 0.12),
							0 8px 32px 0 rgba(139, 92, 246, 0.18);
					"
				>
					<iframe
						class="rounded-2xl w-full h-full"
						src="https://www.youtube-nocookie.com/embed/sIdqXmTkGsE"
						title="Void Tales Trailer"
						frameborder="0"
						loading="lazy"
						allow="
							accelerometer;
							autoplay;
							clipboard-write;
							encrypted-media;
							gyroscope;
							picture-in-picture;
						"
						allowfullscreen
					></iframe>
				</div>
			</div>
		</div>
	</section>

	<!-- Social Links -->
	<section class="text-center space-y-6 py-20">
		<h3 class="text-2xl font-semibold tracking-wide">Follow the Journey</h3>
		<div class="flex items-center justify-center gap-4">
			<NuxtLink to="https://wiki.voidtales.win" target="_blank" class="btn-contrast btn-glow"
				>Wiki</NuxtLink
			>
			<NuxtLink to="https://gallery.voidtales.win" target="_blank" class="btn-contrast btn-glow"
				>Gallery</NuxtLink
			>
			<NuxtLink to="https://blog.voidtales.win" target="_blank" class="btn-contrast btn-glow"
				>Blog</NuxtLink
			>
			<NuxtLink to="https://forum.voidtales.win" target="_blank" class="btn-contrast btn-glow"
				>Forum</NuxtLink
			>
			<NuxtLink to="https://discord.voidtales.win" target="_blank" class="btn-contrast btn-glow"
				>Discord</NuxtLink
			>
		</div>
	</section>
</template>

<script setup>
import emblaCarouselVue from 'embla-carousel-vue';

const [emblaRef] = emblaCarouselVue();
const images = [
	'/images/grid-1.webp',
	'/images/grid-2.webp',
	'/images/grid-3.webp',
	'/images/grid-4.webp',
	'/images/grid-5.webp',
	'/images/grid-6.webp',
];

definePageMeta({
	title: 'Home',
});
</script>
