# 3d-pbr-library

**Bibliothèque PBR curée** pour les POCs / projets 3D web d'Herman. Toutes les textures sont **CC0** (depuis [Polyhaven](https://polyhaven.com)), référencées par URL via leur CDN. **Aucun téléchargement local** — tout passe par le CDN.

> 🎯 **Le pourquoi** : avant cette lib, les POCs Three.js d'Herman étaient en *MeshStandardMaterial* avec des couleurs unies (rendu plastique des années 2010). Ici, on charge en 3 lignes des matériaux PBR multi-maps (diffuse + normal + roughness + AO) — niveau "fabricant catalogue 2024".

## 🚀 Utilisation rapide

```html
<script type="importmap">
{
  "imports": {
    "three": "https://unpkg.com/three@0.166.1/build/three.module.js",
    "three/addons/": "https://unpkg.com/three@0.166.1/examples/jsm/",
    "pbr-lib": "https://hermanvanel-ui.github.io/3d-pbr-library/loader.js"
  }
}
</script>
<script type="module">
import * as THREE from 'three';
import { loadTextureSet, materialFromSet, loadHDRI } from 'pbr-lib';

// 1. Set up scene
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(50, innerWidth/innerHeight, 0.1, 100);
const renderer = new THREE.WebGLRenderer({ antialias:true });
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;

// 2. HDRI environment (1 ligne)
loadHDRI('venice_sunset', { res:'1k', scene });

// 3. Texture PBR + matériau (3 lignes)
const woodTex = loadTextureSet('wood_floor', { res:'1k', repeat:[4, 4] });
const woodMat = materialFromSet(woodTex);
const floor = new THREE.Mesh(new THREE.PlaneGeometry(10, 10), woodMat);
scene.add(floor);
</script>
```

→ Voir [`examples/showcase.html`](examples/showcase.html) pour une galerie live de toutes les textures.

## 📚 Contenu de la lib

**Textures (15)** réparties en 7 catégories :

| Catégorie | Textures |
|---|---|
| 🪵 **wood** (5) | `wood_floor`, `worn_planks`, `weathered_planks`, `plywood`, `wood_table_001` |
| 🔩 **metal** (3) | `metal_plate_02`, `corrugated_iron_03`, `rusty_metal_02` |
| 🏛️ **plaster** (2) | `painted_plaster_wall`, `beige_wall_001` |
| 🧱 **brick** (2) | `red_brick_03`, `brick_wall_006` |
| 🛣️ **concrete** (2) | `concrete_floor_02`, `painted_concrete` |
| 🗿 **stone** (2) | `cobblestone_floor_06`, `marble_01` |

**HDRIs (8)** pour environment lighting :

| HDRI | Mood |
|---|---|
| `venice_sunset` | Coucher chaud — showroom premium |
| `studio_small_03` | Studio neutre — produit propre |
| `royal_esplanade` | Jour naturel — intérieur réaliste |
| `brown_photostudio_02` | Studio brun chaud — portrait |
| `industrial_sunset_02` | Atelier dramatique — Le battant |
| `abandoned_factory_canteen_02` | Industriel moody — cyberpunk |
| `quarry_01` | Extérieur cool — paysage |
| `forest_slope` | Nature verte — calme |

## 🛠️ API

### `loadTextureSet(name, opts)`
Charge un set de textures. Renvoie `{ diff, nor_gl, rough, ao }`.
- `name` — nom Polyhaven (ex: `'wood_floor'`)
- `opts.res` — `'1k'` | `'2k'` | `'4k'` (défaut `'1k'`)
- `opts.maps` — quelles maps charger (défaut `['diff', 'nor_gl', 'rough', 'ao']`)
- `opts.repeat` — `[x, y]` UV repeat (défaut `[1, 1]`)

### `materialFromSet(textures, options)`
Crée un `MeshPhysicalMaterial` depuis un texture set.
- `textures` — résultat de `loadTextureSet()`
- `options` — surcharges (color, metalness, roughness, clearcoat…)

### `loadHDRI(name, opts)`
Charge un HDRI et l'applique en environment.
- `opts.scene` — applique automatiquement à `scene.environment`
- `opts.background` — si `true`, applique aussi à `scene.background`
- Renvoie une Promise<Texture>

### `makeAluThermolaqueMaterial(color)`
Helper : matériau alu thermolaqué (Le battant) prêt à l'emploi.

### `makeWoodMaterial(name, opts)`
Helper : matériau bois texturé prêt à l'emploi.

### `applyAOMapFix(mesh)`
**Important** : si tu utilises un `aoMap`, appelle ceci après création du mesh pour copier `uv` en `uv2` (Three.js le demande).

## 🎯 Cas d'usage par projet

### Le battant (V2 hero)
```js
// HDRI atelier + bois patiné + alu thermolaqué
loadHDRI('industrial_sunset_02', { res:'1k', scene });
const aluMat = makeAluThermolaqueMaterial(0x8FAF89); // vert-volet
const woodMat = makeWoodMaterial('weathered_planks', { repeat:[3, 3] });
```

### Beurré (sandwicherie vintage Nice)
```js
// HDRI chaud + bois vieilli + brique
loadHDRI('brown_photostudio_02', { res:'1k', scene });
const counterTex = loadTextureSet('worn_planks', { repeat:[2, 1] });
const wallTex = loadTextureSet('beige_wall_001', { repeat:[4, 2] });
```

### Portfolio Herman
```js
// HDRI studio + bois clair + marbre accent
loadHDRI('studio_small_03', { res:'1k', scene });
const floorTex = loadTextureSet('wood_floor', { repeat:[5, 5] });
const accentTex = loadTextureSet('marble_01');
```

### a.SYNC Agency (siège virtuel)
```js
// HDRI esplanade + plâtre crème + parquet
loadHDRI('royal_esplanade', { res:'1k', scene });
const wallMat = materialFromSet(loadTextureSet('painted_plaster_wall'));
const floorMat = makeWoodMaterial('wood_floor', { repeat:[6, 6] });
```

## 📦 Performance

- **JPG 1k** : ~80-200 KB par map → ~500 KB pour un set complet (diff+nor+rough+ao)
- **CDN Polyhaven** : Cloudflare R2, très rapide, partout dans le monde
- **Pas de WebP/AVIF** sur Polyhaven (JPG only) — pas de gain plus loin sans pipeline custom
- **HDRI 1k** : ~250-500 KB → suffit pour environment-only (sans background)
- Pour **2k**, doubler ; pour **4k**, ×4 → réserver à des hero showcase, pas pour des sites mobiles

## ⚖️ Licence

Toutes les ressources sont **CC0** (depuis [Polyhaven](https://polyhaven.com)). Tu peux les utiliser commercialement, sans attribution. C'est notre choix d'aider Polyhaven en mentionnant la source quand le contexte s'y prête.

## 🔮 TODO (itérations futures)

- [ ] Étendre à 30+ textures (ajouter tissu, verre, céramique, peinture spéciale)
- [ ] Étendre à 15+ HDRIs (ajouter night moon, golden hour, neutral white studio)
- [ ] Variantes 2k et 4k testées et validées
- [ ] Script de **téléchargement offline** (`scripts/download-all.sh`) pour ceux qui veulent les textures en local
- [ ] Helper `makePresetScene('loft-moderne')` qui setup HDRI + sol + ambient en 1 appel
- [ ] Tests perf : impact LCP de charger 4 maps + HDRI vs material plain
- [ ] Migrer le POC volet Le battant ([le-battant-volet-poc](https://github.com/hermanvanel-ui/le-battant-volet-poc)) pour utiliser cette lib

## 🔗 Liens

- 🌐 **Live showcase** : <https://hermanvanel-ui.github.io/3d-pbr-library/examples/showcase.html>
- 📦 **GitHub** : <https://github.com/hermanvanel-ui/3d-pbr-library>
- 🎨 **Source des textures** : <https://polyhaven.com>
- 🪟 **Skill compagnon** : `webdesign-3d-scroll-experience`
