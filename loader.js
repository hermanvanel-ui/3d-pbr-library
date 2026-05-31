/**
 * 3d-pbr-library — Three.js loader helper
 *
 * Charge des sets de textures PBR depuis le CDN Polyhaven (CC0)
 * sans avoir à manipuler les URLs à la main.
 *
 * Usage typique :
 *
 *   import * as THREE from 'three';
 *   import { loadTextureSet, materialFromSet } from './loader.js';
 *
 *   const woodTex = loadTextureSet('wood_floor', { res: '1k', repeat: [4, 4] });
 *   const woodMat = materialFromSet(woodTex, { roughness: 1.0, metalness: 0.0 });
 *   const floor = new THREE.Mesh(new THREE.PlaneGeometry(10, 10), woodMat);
 *
 * Pour les HDRIs (environment lighting) :
 *
 *   import { loadHDRI } from './loader.js';
 *   loadHDRI('venice_sunset', { res: '1k' }, (hdri) => {
 *     scene.environment = hdri;
 *   });
 */

import * as THREE from 'three';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';

const CDN = {
  textures: 'https://dl.polyhaven.org/file/ph-assets/Textures/jpg/{res}/{name}/{name}_{map}_{res}.jpg',
  hdris:    'https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/{res}/{name}_{res}.hdr',
};

/**
 * Construit l'URL d'une map texture.
 */
export function textureURL(name, map = 'diff', res = '1k') {
  return CDN.textures
    .replaceAll('{res}', res)
    .replaceAll('{name}', name)
    .replaceAll('{map}', map);
}

/**
 * Construit l'URL d'un HDRI.
 */
export function hdriURL(name, res = '1k') {
  return CDN.hdris
    .replaceAll('{res}', res)
    .replaceAll('{name}', name);
}

/**
 * Charge un set complet de textures PBR (diff + nor_gl + rough + ao par défaut).
 * Renvoie un objet { diff, nor_gl, rough, ao, ...} avec les Three.Textures déjà
 * configurées (wrapping, colorSpace).
 *
 * @param {string} name — nom de la texture Polyhaven (ex: 'wood_floor')
 * @param {Object} opts
 * @param {string} opts.res — '1k' | '2k' | '4k' (1k par défaut)
 * @param {string[]} opts.maps — liste des maps à charger (par défaut diff+nor_gl+rough+ao)
 * @param {[number, number]} opts.repeat — [x, y] répétitions UV (par défaut [1, 1])
 * @param {boolean} opts.anisotropy — active l'anisotropy max du renderer (par défaut true)
 * @returns {Object} { diff, nor_gl, rough, ao, ...mapName }
 */
export function loadTextureSet(name, opts = {}) {
  const {
    res = '1k',
    maps = ['diff', 'nor_gl', 'rough', 'ao'],
    repeat = [1, 1],
  } = opts;

  const loader = new THREE.TextureLoader();
  const result = {};

  for (const map of maps) {
    const url = textureURL(name, map, res);
    const tex = loader.load(url, (t) => {
      // onLoad : appliquer settings finaux
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
      t.repeat.set(repeat[0], repeat[1]);
    });
    // Color space : sRGB pour diffuse, Linear pour le reste (PBR-correct)
    tex.colorSpace = (map === 'diff') ? THREE.SRGBColorSpace : THREE.NoColorSpace;
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(repeat[0], repeat[1]);
    result[map] = tex;
  }

  return result;
}

/**
 * Crée un MeshPhysicalMaterial à partir d'un texture set.
 *
 * @param {Object} textures — résultat de loadTextureSet()
 * @param {Object} options — surcharges (color, metalness, roughness, etc.)
 * @returns {THREE.MeshPhysicalMaterial}
 */
export function materialFromSet(textures, options = {}) {
  const defaults = {
    map: textures.diff,
    normalMap: textures.nor_gl,
    roughnessMap: textures.rough,
    aoMap: textures.ao,
    metalness: 0.0,
    roughness: 1.0,
    envMapIntensity: 1.0,
  };
  return new THREE.MeshPhysicalMaterial({ ...defaults, ...options });
}

/**
 * Charge un HDRI et l'applique en environment + (optionnellement) background.
 *
 * @param {string} name — nom du HDRI Polyhaven
 * @param {Object} opts
 * @param {string} opts.res — '1k' | '2k' | '4k'
 * @param {THREE.Scene} opts.scene — la scène où appliquer (auto si fournie)
 * @param {boolean} opts.background — si true, applique aussi en background
 * @param {Function} opts.onLoad — callback(hdri)
 * @returns {Promise<THREE.Texture>}
 */
export function loadHDRI(name, opts = {}) {
  const { res = '1k', scene, background = false, onLoad } = opts;
  const url = hdriURL(name, res);

  return new Promise((resolve, reject) => {
    new RGBELoader().load(
      url,
      (hdri) => {
        hdri.mapping = THREE.EquirectangularReflectionMapping;
        if (scene) {
          scene.environment = hdri;
          if (background) scene.background = hdri;
        }
        if (onLoad) onLoad(hdri);
        resolve(hdri);
      },
      undefined,
      reject
    );
  });
}

/**
 * Helper : crée une matériau alu thermolaqué (palette personnalisable),
 * brillant et metallique, parfait pour des volets, profilés, hardware.
 *
 * @param {number} color — couleur en hex (par défaut vert-volet Le battant)
 * @returns {THREE.MeshPhysicalMaterial}
 */
export function makeAluThermolaqueMaterial(color = 0x8FAF89) {
  return new THREE.MeshPhysicalMaterial({
    color,
    metalness: 0.55,
    roughness: 0.4,
    clearcoat: 0.55,
    clearcoatRoughness: 0.25,
    envMapIntensity: 1.5,
  });
}

/**
 * Helper : crée un matériau bois texturé prêt à l'emploi (parquet bois clair).
 *
 * @param {string} name — nom de la texture wood (par défaut 'wood_floor')
 * @param {Object} opts
 * @returns {Promise<THREE.MeshPhysicalMaterial>}
 */
export function makeWoodMaterial(name = 'wood_floor', opts = {}) {
  const { res = '1k', repeat = [2, 2], roughness = 0.9 } = opts;
  const tex = loadTextureSet(name, { res, repeat });
  return materialFromSet(tex, {
    metalness: 0.0,
    roughness,
    envMapIntensity: 0.8,
  });
}

/**
 * Helper : applique un texture set complet sur un mesh (gère aoMap UV2).
 *
 * Three.js demande un attribut UV2 pour l'AO map. Cette fonction le copie
 * automatiquement depuis UV1 si absent.
 *
 * @param {THREE.Mesh} mesh
 * @param {Object} textureSet — résultat de loadTextureSet()
 */
export function applyAOMapFix(mesh) {
  if (mesh.geometry && mesh.material && mesh.material.aoMap) {
    if (!mesh.geometry.attributes.uv2) {
      mesh.geometry.setAttribute('uv2', mesh.geometry.attributes.uv);
    }
  }
}
