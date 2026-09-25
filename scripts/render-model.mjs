// Renders an item icon the way the inventory slot shows it, as raw RGBA.
//
// 2D items are their texture layers stacked (with tint). 3D items go through a
// small software rasterizer: orthographic, the model's `display.gui` transform,
// element rotation, a z-buffer and per-face UV, which is all an inventory icon
// needs. The shapes come from the item bundle (see srv-work
// voidtales-itemkatalog/README.md); nothing here reads a resource pack.
//
// Lighting is the vanilla world face shade (up 1.0, down 0.5, north/south 0.8,
// east/west 0.6) taken from the model-space face direction. Close to what the
// GUI's two diffuse lights produce for the usual 30-degree tilt, without
// modelling them.
// ponytail: no alpha blending (translucent pixels are drawn opaque above the
// cutoff), add it if a glassy model ever looks wrong.

const SHADE = { up: 1, down: 0.5, north: 0.8, south: 0.8, east: 0.6, west: 0.6 };
const DEG = Math.PI / 180;

/** Multiplies RGB by a '#rrggbb' tint, in place. */
function tintPixel(out, o, tint) {
	if (!tint) return;
	const n = parseInt(tint.slice(1), 16);
	out[o] = (out[o] * ((n >> 16) & 255)) / 255;
	out[o + 1] = (out[o + 1] * ((n >> 8) & 255)) / 255;
	out[o + 2] = (out[o + 2] * (n & 255)) / 255;
}

/**
 * @param {{layers: string[], tints?: (string|null)[]}} icon
 * @param {(sha: string) => {data: Uint8Array, w: number, h: number}} tex
 */
export function render2d(icon, tex, size) {
	const out = new Uint8ClampedArray(size * size * 4);
	icon.layers.forEach((sha, i) => {
		const t = tex(sha);
		for (let y = 0; y < size; y++) {
			for (let x = 0; x < size; x++) {
				const s = (Math.floor((y * t.h) / size) * t.w + Math.floor((x * t.w) / size)) * 4;
				const a = t.data[s + 3] / 255;
				if (a === 0) continue;
				const px = [t.data[s], t.data[s + 1], t.data[s + 2]];
				tintPixel(px, 0, icon.tints?.[i]);
				const o = (y * size + x) * 4;
				// Straight "over" compositing; layers are rarely half-transparent.
				const under = out[o + 3] / 255;
				const oa = a + under * (1 - a);
				for (let c = 0; c < 3; c++) out[o + c] = (px[c] * a + out[o + c] * under * (1 - a)) / oa;
				out[o + 3] = oa * 255;
			}
		}
	});
	return out;
}

// Corner order TL, BL, BR, TR as seen from outside the face, which is also the
// order Minecraft's FaceBakery walks for UV rotation.
function corners(face, [x0, y0, z0], [x1, y1, z1]) {
	switch (face) {
		case 'north':
			return [
				[x1, y1, z0],
				[x1, y0, z0],
				[x0, y0, z0],
				[x0, y1, z0],
			];
		case 'south':
			return [
				[x0, y1, z1],
				[x0, y0, z1],
				[x1, y0, z1],
				[x1, y1, z1],
			];
		case 'west':
			return [
				[x0, y1, z0],
				[x0, y0, z0],
				[x0, y0, z1],
				[x0, y1, z1],
			];
		case 'east':
			return [
				[x1, y1, z1],
				[x1, y0, z1],
				[x1, y0, z0],
				[x1, y1, z0],
			];
		case 'up':
			return [
				[x0, y1, z0],
				[x0, y1, z1],
				[x1, y1, z1],
				[x1, y1, z0],
			];
		case 'down':
			return [
				[x0, y0, z1],
				[x0, y0, z0],
				[x1, y0, z0],
				[x1, y0, z1],
			];
	}
}

// Default UV when a face gives none: the element's own extent on that face.
function defaultUv(face, [x0, y0, z0], [x1, y1, z1]) {
	switch (face) {
		case 'down':
			return [x0, 16 - z1, x1, 16 - z0];
		case 'up':
			return [x0, z0, x1, z1];
		case 'north':
			return [16 - x1, 16 - y1, 16 - x0, 16 - y0];
		case 'south':
			return [x0, 16 - y1, x1, 16 - y0];
		case 'west':
			return [z0, 16 - y1, z1, 16 - y0];
		case 'east':
			return [16 - z1, 16 - y1, 16 - z0, 16 - y0];
	}
}

const rotX = (a) => (v) => [
	v[0],
	v[1] * Math.cos(a) - v[2] * Math.sin(a),
	v[1] * Math.sin(a) + v[2] * Math.cos(a),
];
const rotY = (a) => (v) => [
	v[0] * Math.cos(a) + v[2] * Math.sin(a),
	v[1],
	-v[0] * Math.sin(a) + v[2] * Math.cos(a),
];
const rotZ = (a) => (v) => [
	v[0] * Math.cos(a) - v[1] * Math.sin(a),
	v[0] * Math.sin(a) + v[1] * Math.cos(a),
	v[2],
];
const ROT = { x: rotX, y: rotY, z: rotZ };

/** Element rotation around its origin, in model units (0..16). */
function elementTransform(rotation) {
	if (!rotation) return (v) => v;
	const o = rotation.origin ?? [8, 8, 8];
	const steps = rotation.axis
		? [[rotation.axis, rotation.angle ?? 0]]
		: // Newer free-form rotation: one angle per axis, applied x, y, z.
			['x', 'y', 'z'].filter((k) => rotation[k]).map((k) => [k, rotation[k]]);
	return (v) => {
		let p = [v[0] - o[0], v[1] - o[1], v[2] - o[2]];
		for (const [axis, angle] of steps) {
			p = ROT[axis](angle * DEG)(p);
			if (rotation.rescale && rotation.axis) {
				const k = 1 / Math.cos(angle * DEG);
				p = p.map((c, i) => (['x', 'y', 'z'][i] === axis ? c : c * k));
			}
		}
		return [p[0] + o[0], p[1] + o[1], p[2] + o[2]];
	};
}

/**
 * Model units -> screen pixels. Same chain as the GUI item renderer: centre the
 * model on the origin, then scale, rotate (quaternion XYZ, so Z applies first)
 * and translate by `display.gui`, then map one block to the whole slot.
 */
function guiTransform(gui, size) {
	const [rx, ry, rz] = gui?.rotation ?? [0, 0, 0];
	const [tx, ty, tz] = (gui?.translation ?? [0, 0, 0]).map(
		(t) => Math.max(-80, Math.min(80, t)) / 16
	);
	const [sx, sy, sz] = gui?.scale ?? [1, 1, 1];
	const rot = [rotZ(rz * DEG), rotY(ry * DEG), rotX(rx * DEG)];
	return (v) => {
		let p = [(v[0] / 16 - 0.5) * sx, (v[1] / 16 - 0.5) * sy, (v[2] / 16 - 0.5) * sz];
		for (const r of rot) p = r(p);
		return [size / 2 + (p[0] + tx) * size, size / 2 - (p[1] + ty) * size, p[2] + tz];
	};
}

/**
 * @param {{elements: object[], gui?: object, light?: string, tints?: (string|null)[]}} icon
 * @param {(sha: string) => {data: Uint8Array, w: number, h: number}} tex
 */
export function render3d(icon, tex, size) {
	const out = new Uint8ClampedArray(size * size * 4);
	const depth = new Float32Array(size * size).fill(-Infinity);
	const toScreen = guiTransform(icon.gui, size);
	const flat = icon.light === 'front';

	for (const el of icon.elements) {
		const local = elementTransform(el.rotation);
		for (const [face, f] of Object.entries(el.faces)) {
			const t = tex(f.texture);
			const [u0, v0, u1, v1] = f.uv ?? defaultUv(face, el.from, el.to);
			const uvCorners = [
				[u0, v0],
				[u0, v1],
				[u1, v1],
				[u1, v0],
			];
			const shift = (((f.rotation ?? 0) / 90) % 4) + 4;
			const pts = corners(face, el.from, el.to).map((c, i) => ({
				p: toScreen(local(c)),
				uv: uvCorners[(i + shift) % 4],
			}));
			const shade = flat || el.shade === false ? 1 : SHADE[face];
			const tint = f.tintindex !== undefined ? icon.tints?.[f.tintindex] : null;
			for (const tri of [
				[pts[0], pts[1], pts[2]],
				[pts[0], pts[2], pts[3]],
			]) {
				rasterize(tri, t, shade, tint, out, depth, size);
			}
		}
	}
	return out;
}

function rasterize([a, b, c], t, shade, tint, out, depth, size) {
	const area = (b.p[0] - a.p[0]) * (c.p[1] - a.p[1]) - (c.p[0] - a.p[0]) * (b.p[1] - a.p[1]);
	if (Math.abs(area) < 1e-9) return;
	const minX = Math.max(0, Math.floor(Math.min(a.p[0], b.p[0], c.p[0])));
	const maxX = Math.min(size - 1, Math.ceil(Math.max(a.p[0], b.p[0], c.p[0])));
	const minY = Math.max(0, Math.floor(Math.min(a.p[1], b.p[1], c.p[1])));
	const maxY = Math.min(size - 1, Math.ceil(Math.max(a.p[1], b.p[1], c.p[1])));
	for (let y = minY; y <= maxY; y++) {
		for (let x = minX; x <= maxX; x++) {
			const px = x + 0.5;
			const py = y + 0.5;
			const w0 = ((b.p[0] - px) * (c.p[1] - py) - (c.p[0] - px) * (b.p[1] - py)) / area;
			const w1 = ((c.p[0] - px) * (a.p[1] - py) - (a.p[0] - px) * (c.p[1] - py)) / area;
			const w2 = 1 - w0 - w1;
			if (w0 < 0 || w1 < 0 || w2 < 0) continue;
			const z = w0 * a.p[2] + w1 * b.p[2] + w2 * c.p[2];
			const i = y * size + x;
			if (z <= depth[i]) continue;
			const u = w0 * a.uv[0] + w1 * b.uv[0] + w2 * c.uv[0];
			const v = w0 * a.uv[1] + w1 * b.uv[1] + w2 * c.uv[1];
			const tx = Math.min(t.w - 1, Math.max(0, Math.floor((u / 16) * t.w)));
			const ty = Math.min(t.h - 1, Math.max(0, Math.floor((v / 16) * t.h)));
			const s = (ty * t.w + tx) * 4;
			if (t.data[s + 3] < 26) continue; // cutout, like the vanilla item shader
			depth[i] = z;
			const o = i * 4;
			out[o] = t.data[s] * shade;
			out[o + 1] = t.data[s + 1] * shade;
			out[o + 2] = t.data[s + 2] * shade;
			out[o + 3] = 255;
			tintPixel(out, o, tint);
		}
	}
}
