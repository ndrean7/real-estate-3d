/* 0x ESTATE — Perumahan Modern 3D
   Original build for ndrean7. Three.js r147 vendored inline (no CDN).
   All geometry procedural, all textures painted on canvas. */

(function () {
  'use strict';

  /* ================= Renderer / Scene / Camera ================= */

  var wrap = document.getElementById('canvas-wrap');
  var renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(wrap.clientWidth, wrap.clientHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.12;
  wrap.appendChild(renderer.domElement);

  var scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0xcfe0ec, 130, 300);

  var camera = new THREE.PerspectiveCamera(48, wrap.clientWidth / wrap.clientHeight, 0.5, 600);

  /* ================= Procedural canvas textures ================= */

  function canvasTex(size, draw, rx, ry) {
    var c = document.createElement('canvas');
    c.width = c.height = size;
    draw(c.getContext('2d'), size);
    var t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(rx || 1, ry || 1);
    t.encoding = THREE.sRGBEncoding;
    t.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
    return t;
  }
  function speckle(ctx, s, n, colors, rMin, rMax) {
    for (var i = 0; i < n; i++) {
      ctx.fillStyle = colors[(Math.random() * colors.length) | 0];
      ctx.globalAlpha = 0.25 + Math.random() * 0.5;
      var r = rMin + Math.random() * (rMax - rMin);
      ctx.beginPath();
      ctx.arc(Math.random() * s, Math.random() * s, r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  /* ---- Real photo textures (Poly Haven, CC0 — local files in textures/) ---- */
  var loaderEl = document.getElementById('loader');
  var loaderHidden = false;
  function hideLoader() {
    if (loaderHidden || !loaderEl) return;
    loaderHidden = true;
    loaderEl.classList.add('hidden');
  }
  var texManager = new THREE.LoadingManager();
  texManager.onLoad = function () { hideLoader(); };
  texManager.onError = function (u) { console.warn('texture failed:', u); };
  setTimeout(hideLoader, 6000); // never trap the user behind the loader
  var photoLoader = new THREE.TextureLoader(texManager);
  function photoTex(file, rx, ry, srgb) {
    var t = photoLoader.load('textures/' + file);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(rx || 1, ry || 1);
    if (srgb !== false) t.encoding = THREE.sRGBEncoding;
    t.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
    return t;
  }
  function photoPair(slug, rx, ry) {
    var map = photoTex(slug + '_diff_1k.jpg', rx, ry, true);
    var rough = photoTex(slug + '_rough_1k.jpg', rx, ry, false);
    return { map: map, rough: rough };
  }
  function cloneRepeat(t, rx, ry) {
    var c = t.clone();
    c.repeat.set(rx, ry);
    c.needsUpdate = true;
    return c;
  }

  var grassTex = canvasTex(1024, function (ctx, s) {
    ctx.fillStyle = '#57853a'; ctx.fillRect(0, 0, s, s);
    // Large soft lawn patches (mowing bands / sun variation)
    for (var p = 0; p < 46; p++) {
      ctx.globalAlpha = 0.04 + Math.random() * 0.06;
      ctx.fillStyle = ['#639145', '#4d7d31', '#74a050', '#47712c'][(Math.random() * 4) | 0];
      ctx.beginPath();
      ctx.ellipse(Math.random() * s, Math.random() * s, 60 + Math.random() * 150, 40 + Math.random() * 110, Math.random() * Math.PI, 0, Math.PI * 2);
      ctx.fill();
    }
    // Dry patches
    for (var d = 0; d < 14; d++) {
      ctx.globalAlpha = 0.06 + Math.random() * 0.06;
      ctx.fillStyle = '#a8a05c';
      ctx.beginPath();
      ctx.ellipse(Math.random() * s, Math.random() * s, 30 + Math.random() * 70, 20 + Math.random() * 50, Math.random() * Math.PI, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    speckle(ctx, s, 3200, ['#5d8a3e', '#7fae58', '#648c42', '#8fbc66', '#4a7a30'], 1, 3.4);
    // Grass blades
    ctx.lineWidth = 1.4;
    for (var i = 0; i < 1400; i++) {
      var x = Math.random() * s, y = Math.random() * s;
      ctx.strokeStyle = ['rgba(90,130,60,.55)', 'rgba(120,165,80,.5)', 'rgba(70,110,50,.55)'][(Math.random() * 3) | 0];
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + (Math.random() * 3 - 1.5), y - 4 - Math.random() * 5); ctx.stroke();
    }
  }, 26, 20);
  var grassRoughTex = canvasTex(256, function (ctx, s) {
    ctx.fillStyle = '#e8e8e8'; ctx.fillRect(0, 0, s, s);
    speckle(ctx, s, 900, ['#d8d8d8', '#f2f2f2', '#c8c8c8'], 1, 3);
  }, 26, 20);

  var asphaltPhoto = photoPair('asphalt_01', 10, 1);
  var asphaltSidePhoto = {
    map: cloneRepeat(asphaltPhoto.map, 1, 8),
    rough: cloneRepeat(asphaltPhoto.rough, 1, 8)
  };
  var cobblePhoto = photoPair('cobblestone_01', 1, 4);
  var cobblePathPhoto = {
    map: cloneRepeat(cobblePhoto.map, 1, 2),
    rough: cloneRepeat(cobblePhoto.rough, 1, 2)
  };
  var concretePhoto = photoPair('concrete_floor_01', 3, 3);
  var brickPhoto = photoPair('medieval_red_brick', 2, 1);
  var roofTilePhoto = photoPair('roof_tiles', 1, 1);
  var roofCeramicPhoto = photoPair('ceramic_roof_01', 1, 1);
  var oakPhoto = photoPair('oak_veneer_01', 1, 1);
  var plankPhoto = photoPair('wooden_floor_01', 1, 1);

  var sidewalkTex = canvasTex(256, function (ctx, s) {
    ctx.fillStyle = '#cfc9bb'; ctx.fillRect(0, 0, s, s);
    speckle(ctx, s, 300, ['#c2bbae', '#dcd6c8'], 1, 2.5);
    ctx.strokeStyle = '#b0a894'; ctx.lineWidth = 3;
    for (var i = 0; i <= 2; i++) {
      ctx.beginPath(); ctx.moveTo(i * 128, 0); ctx.lineTo(i * 128, s); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, i * 128); ctx.lineTo(s, i * 128); ctx.stroke();
    }
    // Hairline cracks
    ctx.strokeStyle = 'rgba(90,84,70,0.5)'; ctx.lineWidth = 1.2;
    for (var i = 0; i < 9; i++) {
      var cx = Math.random() * s, cy = Math.random() * s;
      ctx.beginPath(); ctx.moveTo(cx, cy);
      ctx.lineTo(cx + (Math.random() * 30 - 15), cy + (Math.random() * 30 - 15));
      ctx.lineTo(cx + (Math.random() * 44 - 22), cy + (Math.random() * 44 - 22));
      ctx.stroke();
    }
  }, 30, 1);

  function plasterTex(base, fleck) {
    return canvasTex(1024, function (ctx, s) {
      ctx.fillStyle = base; ctx.fillRect(0, 0, s, s);
      // Large soft mottling
      for (var p = 0; p < 26; p++) {
        ctx.globalAlpha = 0.04 + Math.random() * 0.05;
        ctx.fillStyle = fleck[(Math.random() * fleck.length) | 0];
        ctx.beginPath();
        ctx.ellipse(Math.random() * s, Math.random() * s, 50 + Math.random() * 130, 40 + Math.random() * 100, Math.random() * Math.PI, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      speckle(ctx, s, 2200, fleck, 0.8, 2.4);
      // Faint vertical weather streaks
      for (var i = 0; i < 10; i++) {
        ctx.globalAlpha = 0.03 + Math.random() * 0.03;
        ctx.fillStyle = '#8a8474';
        var x = Math.random() * s;
        ctx.fillRect(x, Math.random() * s * 0.4, 3 + Math.random() * 6, 120 + Math.random() * 300);
      }
      ctx.globalAlpha = 1;
    }, 2, 2);
  }
  var plasterRoughTex = canvasTex(256, function (ctx, s) {
    ctx.fillStyle = '#dedede'; ctx.fillRect(0, 0, s, s);
    speckle(ctx, s, 800, ['#cfcfcf', '#eaeaea', '#c4c4c4'], 1, 3);
  }, 2, 2);

  var barkTex = canvasTex(256, function (ctx, s) {
    ctx.fillStyle = '#5a3d24'; ctx.fillRect(0, 0, s, s);
    // Vertical bark ridges
    for (var i = 0; i < 46; i++) {
      ctx.globalAlpha = 0.25 + Math.random() * 0.4;
      ctx.fillStyle = ['#3e2a16', '#6e4c2c', '#2e1f10'][(Math.random() * 3) | 0];
      var x = Math.random() * s;
      ctx.fillRect(x, 0, 3 + Math.random() * 7, s);
    }
    ctx.globalAlpha = 1;
    speckle(ctx, s, 500, ['#4a3018', '#7a5636'], 1, 2.5);
  }, 1, 2);

  function skyTexture(top, mid, bot) {
    var c = document.createElement('canvas');
    c.width = 16; c.height = 512;
    var ctx = c.getContext('2d');
    var g = ctx.createLinearGradient(0, 0, 0, 512);
    g.addColorStop(0, top); g.addColorStop(0.55, mid); g.addColorStop(1, bot);
    ctx.fillStyle = g; ctx.fillRect(0, 0, 16, 512);
    var t = new THREE.CanvasTexture(c);
    t.encoding = THREE.sRGBEncoding;
    return t;
  }
  var skyDayTex = skyTexture('#6fa8d8', '#a8cbe8', '#e8f2f8');
  var skyDuskTex = skyTexture('#241f4e', '#7a4a6e', '#e07840');

  /* ================= Materials ================= */

  var M = {
    grass: new THREE.MeshStandardMaterial({ map: grassTex, roughnessMap: grassRoughTex, roughness: 1, envMapIntensity: 0.25 }),
    asphalt: new THREE.MeshStandardMaterial({ map: asphaltPhoto.map, roughnessMap: asphaltPhoto.rough, roughness: 1, envMapIntensity: 0.3 }),
    asphaltPlain: new THREE.MeshStandardMaterial({ map: asphaltSidePhoto.map, roughnessMap: asphaltSidePhoto.rough, roughness: 1, envMapIntensity: 0.3 }),
    paver: new THREE.MeshStandardMaterial({ map: cobblePhoto.map, roughnessMap: cobblePhoto.rough, roughness: 1, envMapIntensity: 0.3 }),
    paverPath: new THREE.MeshStandardMaterial({ map: cobblePathPhoto.map, roughnessMap: cobblePathPhoto.rough, roughness: 1, envMapIntensity: 0.3 }),
    sidewalk: new THREE.MeshStandardMaterial({ map: sidewalkTex, roughness: 0.92, envMapIntensity: 0.3 }),
    plasterWhite: new THREE.MeshStandardMaterial({ map: plasterTex('#f2ede3', ['#e6dfd0', '#faf7f0']), roughnessMap: plasterRoughTex, roughness: 0.92, envMapIntensity: 0.35 }),
    plasterCream: new THREE.MeshStandardMaterial({ map: plasterTex('#e8dcc4', ['#dccfb2', '#f2e9d6']), roughnessMap: plasterRoughTex, roughness: 0.92, envMapIntensity: 0.35 }),
    plasterGrey: new THREE.MeshStandardMaterial({ map: plasterTex('#c9cdd2', ['#bcc1c7', '#d6dade']), roughnessMap: plasterRoughTex, roughness: 0.92, envMapIntensity: 0.35 }),
    plasterSand: new THREE.MeshStandardMaterial({ map: plasterTex('#d9c1a0', ['#cbb391', '#e5d2b6']), roughnessMap: plasterRoughTex, roughness: 0.92, envMapIntensity: 0.35 }),
    brick: new THREE.MeshStandardMaterial({ map: brickPhoto.map, roughnessMap: brickPhoto.rough, roughness: 1, envMapIntensity: 0.3 }),
    roofTilePhoto: new THREE.MeshStandardMaterial({ map: roofTilePhoto.map, roughnessMap: roofTilePhoto.rough, roughness: 1, envMapIntensity: 0.35 }),
    roofCeramicPhoto: new THREE.MeshStandardMaterial({ map: roofCeramicPhoto.map, roughnessMap: roofCeramicPhoto.rough, roughness: 1, envMapIntensity: 0.35 }),
    roofDark: new THREE.MeshStandardMaterial({ color: 0x35373c, roughness: 0.55, metalness: 0.3, envMapIntensity: 0.6 }),
    wood: new THREE.MeshStandardMaterial({ map: plankPhoto.map, roughnessMap: plankPhoto.rough, roughness: 0.85, envMapIntensity: 0.4 }),
    woodDoor: new THREE.MeshStandardMaterial({ map: oakPhoto.map, roughnessMap: oakPhoto.rough, roughness: 0.7, envMapIntensity: 0.4 }),
    woodDark: new THREE.MeshStandardMaterial({ color: 0x5d4128, roughness: 0.75, envMapIntensity: 0.3 }),
    frame: new THREE.MeshStandardMaterial({ color: 0xf5f2ea, roughness: 0.45, envMapIntensity: 0.5 }),
    glass: new THREE.MeshStandardMaterial({ color: 0xa8c8de, roughness: 0.05, metalness: 0.1, transparent: true, opacity: 0.55, emissive: 0xffb45c, emissiveIntensity: 0, envMapIntensity: 1.3 }),
    concrete: new THREE.MeshStandardMaterial({ map: concretePhoto.map, roughnessMap: concretePhoto.rough, roughness: 1, envMapIntensity: 0.3 }),
    metal: new THREE.MeshStandardMaterial({ color: 0x2e3134, roughness: 0.38, metalness: 0.85, envMapIntensity: 1 }),
    trunk: new THREE.MeshStandardMaterial({ map: barkTex, roughness: 1, envMapIntensity: 0.25 }),
    leaf: new THREE.MeshStandardMaterial({ color: 0x3f6b2c, roughness: 1, envMapIntensity: 0.25 }),
    leaf2: new THREE.MeshStandardMaterial({ color: 0x4a7a32, roughness: 1, envMapIntensity: 0.25 }),
    leaf3: new THREE.MeshStandardMaterial({ color: 0x558638, roughness: 1, envMapIntensity: 0.25 }),
    leafDark: new THREE.MeshStandardMaterial({ color: 0x2f5423, roughness: 1, envMapIntensity: 0.25 }),
    bush: new THREE.MeshStandardMaterial({ color: 0x38632a, roughness: 1, envMapIntensity: 0.25 }),
    water: new THREE.MeshStandardMaterial({ color: 0x3f8fbf, roughness: 0.06, metalness: 0.1, envMapIntensity: 1 }),
    lampGlow: new THREE.MeshStandardMaterial({ color: 0xfff2cf, emissive: 0xffc861, emissiveIntensity: 0 }),
    white: new THREE.MeshStandardMaterial({ color: 0xf7f4ec, roughness: 0.8, envMapIntensity: 0.4 }),
    accent: new THREE.MeshStandardMaterial({ color: 0xb4552d, roughness: 0.6, envMapIntensity: 0.4 }),
    laneMark: new THREE.MeshBasicMaterial({ color: 0xe8e6df }),
    flowerRed: new THREE.MeshStandardMaterial({ color: 0xc23b4e, roughness: 0.7 }),
    flowerYellow: new THREE.MeshStandardMaterial({ color: 0xe8b93e, roughness: 0.7 }),
    flowerPink: new THREE.MeshStandardMaterial({ color: 0xd97ba8, roughness: 0.7 }),
    hydrantRed: new THREE.MeshStandardMaterial({ color: 0xa32e24, roughness: 0.5, metalness: 0.2, envMapIntensity: 0.6 })
  };

  /* ================= Sky dome ================= */

  var sky = new THREE.Mesh(
    new THREE.SphereGeometry(280, 24, 14),
    new THREE.MeshBasicMaterial({ map: skyDayTex, side: THREE.BackSide, fog: false })
  );
  scene.add(sky);

  /* ---- Distant land so the estate doesn't float on sky ---- */
  var outerGround = new THREE.Mesh(
    new THREE.PlaneGeometry(700, 700),
    new THREE.MeshStandardMaterial({ color: 0x5d7f42, roughness: 1, envMapIntensity: 0.15 })
  );
  outerGround.rotation.x = -Math.PI / 2;
  outerGround.position.y = -0.08;
  outerGround.receiveShadow = true;
  scene.add(outerGround);

  var hillMats = [0x7d8f6e, 0x6f8272, 0x86917a, 0x75816b].map(function (c) {
    return new THREE.MeshStandardMaterial({ color: c, roughness: 1, envMapIntensity: 0.15 });
  });
  [[-170, -150, 70, 0.2], [30, -215, 90, 0.16], [185, -130, 75, 0.22], [-215, 40, 80, 0.18], [180, 140, 70, 0.2]].forEach(function (h, i) {
    var hill = new THREE.Mesh(new THREE.SphereGeometry(h[2], 20, 12), hillMats[i % hillMats.length]);
    hill.scale.y = h[3];
    hill.position.set(h[0], -4, h[1]);
    scene.add(hill);
  });

  // Faint distant city skyline (north + east), hazed by fog
  var skylineMat = new THREE.MeshStandardMaterial({ color: 0x93a3b5, roughness: 0.9, envMapIntensity: 0.2 });
  var skylineGeo = new THREE.BoxGeometry(1, 1, 1);
  function skylineRow(x0, z0, dx, dz, n) {
    for (var i = 0; i < n; i++) {
      var w = 9 + Math.random() * 9, hgt = 10 + Math.random() * 20, d = 9 + Math.random() * 5;
      var b = new THREE.Mesh(skylineGeo, skylineMat);
      b.scale.set(w, hgt, d);
      b.position.set(x0 + dx * i, hgt / 2 - 1, z0 + dz * i);
      scene.add(b);
    }
  }
  skylineRow(-150, -225, 22, 0, 15);
  skylineRow(225, -130, 0, 22, 13);

  /* ---- Soft procedural clouds ---- */
  function cloudTexture() {
    var c = document.createElement('canvas');
    c.width = 256; c.height = 128;
    var ctx = c.getContext('2d');
    function puff(x, y, r, a) {
      var g = ctx.createRadialGradient(x, y, 2, x, y, r);
      g.addColorStop(0, 'rgba(255,255,255,' + a + ')');
      g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 256, 128);
    }
    puff(80, 75, 55, 0.9); puff(130, 60, 65, 0.95); puff(180, 78, 50, 0.85); puff(110, 88, 45, 0.8);
    return new THREE.CanvasTexture(c);
  }
  var cloudTex = cloudTexture();
  var clouds = [];
  for (var ci = 0; ci < 9; ci++) {
    var sm = new THREE.SpriteMaterial({ map: cloudTex, transparent: true, opacity: 0.55 + Math.random() * 0.3, fog: false, depthWrite: false });
    var sp = new THREE.Sprite(sm);
    var ang = Math.random() * Math.PI * 2, rad = 90 + Math.random() * 130;
    sp.position.set(Math.cos(ang) * rad, 55 + Math.random() * 35, Math.sin(ang) * rad);
    var sc = 45 + Math.random() * 45;
    sp.scale.set(sc, sc * 0.45, 1);
    sp.userData.speed = 0.4 + Math.random() * 0.5;
    scene.add(sp);
    clouds.push(sp);
  }

  /* ---- Procedural environment maps (PMREM) for realistic PBR reflections ---- */
  function makeEnvMap(top, mid, bot, sunColor, sunDir) {
    var envScene = new THREE.Scene();
    var envSky = new THREE.Mesh(
      new THREE.SphereGeometry(50, 16, 12),
      new THREE.MeshBasicMaterial({ map: skyTexture(top, mid, bot), side: THREE.BackSide })
    );
    envScene.add(envSky);
    var sunDisc = new THREE.Mesh(
      new THREE.CircleGeometry(7, 24),
      new THREE.MeshBasicMaterial({ color: sunColor })
    );
    sunDisc.position.copy(sunDir).normalize().multiplyScalar(44);
    sunDisc.lookAt(0, 0, 0);
    envScene.add(sunDisc);
    var envGround = new THREE.Mesh(
      new THREE.CircleGeometry(48, 24),
      new THREE.MeshBasicMaterial({ color: 0x5f7050 })
    );
    envGround.rotation.x = -Math.PI / 2;
    envGround.position.y = -3;
    envScene.add(envGround);
    var pmrem = new THREE.PMREMGenerator(renderer);
    var rt = pmrem.fromScene(envScene, 0.06);
    pmrem.dispose();
    return rt.texture;
  }
  var envDay = makeEnvMap('#6fa8d8', '#a8cbe8', '#e8f2f8', 0xfff2d8, new THREE.Vector3(85, 52, 42));
  var envDusk = makeEnvMap('#241f4e', '#7a4a6e', '#e07840', 0xff9a4d, new THREE.Vector3(-55, 28, -35));
  scene.environment = envDay;

  /* ---- Soft contact blob shadows (grounds houses & trees) ---- */
  function blobShadowTexture() {
    var c = document.createElement('canvas');
    c.width = c.height = 128;
    var ctx = c.getContext('2d');
    var g = ctx.createRadialGradient(64, 64, 6, 64, 64, 62);
    g.addColorStop(0, 'rgba(0,0,0,0.32)');
    g.addColorStop(0.65, 'rgba(0,0,0,0.13)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 128, 128);
    return new THREE.CanvasTexture(c);
  }
  var blobTex = blobShadowTexture();
  function blobShadow(w, d, x, z, parent) {
    var m = new THREE.Mesh(
      new THREE.PlaneGeometry(w, d),
      new THREE.MeshBasicMaterial({ map: blobTex, transparent: true, depthWrite: false })
    );
    m.rotation.x = -Math.PI / 2;
    m.position.set(x, 0.035, z);
    (parent || scene).add(m);
    return m;
  }

  /* ================= Lights ================= */

  var sun = new THREE.DirectionalLight(0xfff2d8, 1.25);
  sun.position.set(85, 52, 42);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -80; sun.shadow.camera.right = 80;
  sun.shadow.camera.top = 80; sun.shadow.camera.bottom = -80;
  sun.shadow.camera.near = 10; sun.shadow.camera.far = 260;
  sun.shadow.bias = -0.0004;
  scene.add(sun);
  scene.add(sun.target);

  var hemi = new THREE.HemisphereLight(0xbdd7f2, 0x8a9a7a, 0.5);
  scene.add(hemi);
  var amb = new THREE.AmbientLight(0xffffff, 0.1);
  scene.add(amb);

  /* ================= Helpers ================= */

  function box(w, h, d, mat, x, y, z, parent) {
    var m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x, y, z);
    m.castShadow = true; m.receiveShadow = true;
    (parent || scene).add(m);
    return m;
  }
  function flat(w, d, mat, x, z, y, parent) {
    var m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), mat);
    m.rotation.x = -Math.PI / 2;
    m.position.set(x, y || 0.02, z);
    m.receiveShadow = true;
    (parent || scene).add(m);
    return m;
  }
  function cyl(rt, rb, h, mat, x, y, z, parent, seg) {
    var m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg || 12), mat);
    m.position.set(x, y, z);
    m.castShadow = true; m.receiveShadow = true;
    (parent || scene).add(m);
    return m;
  }

  /* ================= Ground & roads ================= */

  flat(150, 120, M.grass, 0, 0, 0);

  // Main road (east-west)
  flat(120, 9, M.asphalt, 0, 8, 0.02);
  // Painted centre dashes (real road paint, not texture)
  for (var dx = -56; dx <= 56; dx += 7) {
    flat(3, 0.35, M.laneMark, dx, 8, 0.04);
  }
  // Side streets (north-south)
  flat(7, 96, M.asphaltPlain, -26.5, 0, 0.015);
  flat(7, 96, M.asphaltPlain, 26.5, 0, 0.015);

  // Sidewalks along the main road
  flat(120, 2.4, M.sidewalk, 0, 2.2, 0.05);
  flat(120, 2.4, M.sidewalk, 0, 13.8, 0.05);
  // Sidewalk strips along side streets
  flat(2, 96, M.sidewalk, -31, 0, 0.05);
  flat(2, 96, M.sidewalk, -22, 0, 0.05);
  flat(2, 96, M.sidewalk, 22, 0, 0.05);
  flat(2, 96, M.sidewalk, 31, 0, 0.05);

  /* ---- Grass tufts, wildflowers & pebbles (instanced, breaks the flat lawn) ---- */
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  var rng = mulberry32(20261121);
  function onGrass(x, z) {
    if (z > -2 && z < 17) return false; // main road + sidewalks band
    if (Math.abs(x + 26.5) < 5.5 || Math.abs(x - 26.5) < 5.5) return false; // side streets
    var plots = [[-42, -20], [-12, -20], [16, -20], [-42, 27], [-8, 27], [38, 27]];
    for (var i = 0; i < plots.length; i++) {
      if (Math.abs(x - plots[i][0]) < 9 && Math.abs(z - plots[i][1]) < 8.5) return false;
    }
    if (Math.hypot(x - 46, z + 32) < 8.5) return false; // pond
    return true;
  }
  var dummy = new THREE.Object3D();
  // (Grass tufts removed: the instanced cones rendered white in headless
  // Chrome despite green materials, and read as litter on the lawn.)


  // Fixed colors per mesh (setColorAt rendered white: same lesson as tufts)
  var flowerGeo = new THREE.SphereGeometry(0.09, 6, 5);
  var wildMeshes = [0xc23b4e, 0xe8b93e, 0xd97ba8].map(function (c) {
    var m = new THREE.InstancedMesh(flowerGeo,
      new THREE.MeshStandardMaterial({ color: c, roughness: 0.7, envMapIntensity: 0.3 }), 22);
    m.count = 0;
    scene.add(m);
    return m;
  });
  var wildPlaced = [0, 0, 0], guard = 0;
  while (wildPlaced[0] + wildPlaced[1] + wildPlaced[2] < 60 && guard++ < 3000) {
    var wx = (rng() * 2 - 1) * 72, wz = (rng() * 2 - 1) * 57;
    if (!onGrass(wx, wz)) continue;
    var wi = (rng() * 3) | 0;
    if (wildPlaced[wi] >= 22) continue;
    dummy.position.set(wx, 0.12, wz);
    dummy.rotation.set(0, 0, 0);
    dummy.scale.setScalar(0.8 + rng() * 0.7);
    dummy.updateMatrix();
    wildMeshes[wi].setMatrixAt(wildPlaced[wi], dummy.matrix);
    wildPlaced[wi]++;
  }
  wildMeshes.forEach(function (m, i) {
    m.count = wildPlaced[i];
    m.instanceMatrix.needsUpdate = true;
  });

  var pebGeo = new THREE.DodecahedronGeometry(0.13, 0);
  var pebMat = new THREE.MeshStandardMaterial({ color: 0x6e675e, roughness: 1, envMapIntensity: 0.2 });
  var pebbles = new THREE.InstancedMesh(pebGeo, pebMat, 70);
  var pp = 0, guard = 0;
  while (pp < 70 && guard++ < 2000) {
    var px = (rng() * 2 - 1) * 72, pz = (rng() * 2 - 1) * 57;
    if (!onGrass(px, pz)) continue;
    dummy.position.set(px, 0.06, pz);
    dummy.rotation.set(rng() * Math.PI, rng() * Math.PI, 0);
    dummy.scale.set(0.7 + rng() * 0.9, 0.5 + rng() * 0.4, 0.7 + rng() * 0.9);
    dummy.updateMatrix();
    pebbles.setMatrixAt(pp, dummy.matrix);
    pp++;
  }
  pebbles.count = pp;
  pebbles.instanceMatrix.needsUpdate = true;
  scene.add(pebbles);

  /* ================= Trees, lamps, benches, cars ================= */

  function tree(x, z, s, parent) {
    s = s || 1;
    var g = new THREE.Group();
    cyl(0.22 * s, 0.34 * s, 1.9 * s, M.trunk, 0, 0.95 * s, 0, g);
    // Layered canopy: 5 overlapping irregular blobs, dark underside
    var f1 = new THREE.Mesh(new THREE.IcosahedronGeometry(1.5 * s, 1), M.leafDark);
    f1.position.y = 2.5 * s; f1.scale.set(1.15, 0.9, 1); f1.castShadow = true; g.add(f1);
    var f2 = new THREE.Mesh(new THREE.IcosahedronGeometry(1.05 * s, 1), M.leaf2);
    f2.position.set(0.75 * s, 3.35 * s, 0.35 * s); f2.scale.set(1, 0.85, 1.1); f2.castShadow = true; g.add(f2);
    var f3 = new THREE.Mesh(new THREE.IcosahedronGeometry(0.9 * s, 1), M.leaf);
    f3.position.set(-0.75 * s, 3.15 * s, -0.45 * s); f3.scale.set(1.1, 0.9, 0.95); f3.castShadow = true; g.add(f3);
    var f4 = new THREE.Mesh(new THREE.IcosahedronGeometry(0.7 * s, 1), M.leaf3);
    f4.position.set(0.15 * s, 3.9 * s, -0.55 * s); f4.castShadow = true; g.add(f4);
    var f5 = new THREE.Mesh(new THREE.IcosahedronGeometry(0.55 * s, 1), M.leaf2);
    f5.position.set(-0.3 * s, 2.9 * s, 0.8 * s); f5.castShadow = true; g.add(f5);
    // Slight per-tree variation so no two trees look cloned
    g.rotation.y = Math.random() * Math.PI * 2;
    var vs = 0.92 + Math.random() * 0.16;
    g.scale.set(vs, 0.95 + Math.random() * 0.12, vs);
    g.position.set(x, 0, z);
    if (parent) { parent.add(g); } else { scene.add(g); blobShadow(3.4 * s, 3.4 * s, x, z); }
    return g;
  }

  // Trees lining the main road + scattered
  [-52, -38, -14, 2, 14, 40, 52].forEach(function (x) { tree(x, 0.6, 1.2); });
  [-52, -38, -6, 6, 40, 52].forEach(function (x) { tree(x, 15.6, 1.15); });
  tree(-52, -34, 1.1); tree(-52, 34, 1.05); tree(52, -8, 1.1); tree(52, 34, 1);

  function lamp(x, z, face) {
    var g = new THREE.Group();
    cyl(0.09, 0.13, 4.6, M.metal, 0, 2.3, 0, g);
    var arm = box(1.5, 0.09, 0.09, M.metal, face * 0.7, 4.55, 0, g);
    arm.castShadow = false;
    var head = box(0.55, 0.14, 0.28, M.metal, face * 1.4, 4.5, 0, g);
    head.castShadow = false;
    var bulb = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 8), M.lampGlow);
    bulb.position.set(face * 1.4, 4.38, 0); g.add(bulb);
    g.position.set(x, 0, z);
    scene.add(g);
  }
  lamp(-46, 1.2, 1); lamp(-18, 14.8, -1); lamp(10, 1.2, 1);
  lamp(38, 14.8, -1); lamp(-46, 14.8, -1); lamp(38, 1.2, 1);

  function car(x, z, ry, color) {
    var g = new THREE.Group();
    var paint = new THREE.MeshStandardMaterial({ color: color, roughness: 0.35, metalness: 0.5 });
    var body = box(4.1, 0.62, 1.85, paint, 0, 0.55, 0, g);
    body.castShadow = true;
    var cabin = box(2.2, 0.58, 1.65, M.glass, -0.2, 1.12, 0, g);
    cabin.castShadow = true;
    var roof = box(2.0, 0.1, 1.6, paint, -0.2, 1.44, 0, g);
    // Headlights + taillights
    var headMat = new THREE.MeshStandardMaterial({ color: 0xfff6d8, emissive: 0xffe9a8, emissiveIntensity: 0.6, roughness: 0.3 });
    var tailMat = new THREE.MeshStandardMaterial({ color: 0x8c1f1a, emissive: 0x5c0f0c, emissiveIntensity: 0.5, roughness: 0.3 });
    box(0.1, 0.16, 0.3, headMat, 2.06, 0.62, 0.62, g);
    box(0.1, 0.16, 0.3, headMat, 2.06, 0.62, -0.62, g);
    box(0.1, 0.16, 0.3, tailMat, -2.06, 0.62, 0.62, g);
    box(0.1, 0.16, 0.3, tailMat, -2.06, 0.62, -0.62, g);
    var wg = new THREE.CylinderGeometry(0.36, 0.36, 0.26, 14);
    [[-1.35, 0.85], [1.35, 0.85], [-1.35, -0.85], [1.35, -0.85]].forEach(function (p) {
      var w = new THREE.Mesh(wg, M.metal);
      w.rotation.x = Math.PI / 2;
      w.position.set(p[0], 0.36, p[1]);
      w.castShadow = true; g.add(w);
    });
    g.position.set(x, 0, z);
    g.rotation.y = ry;
    scene.add(g);
  }
  car(-8.5, 6.5, 0.06, 0x8c2f26);
  car(33, 9.6, Math.PI - 0.05, 0x2e4a6b);
  car(52, 8, Math.PI / 2, 0xd8d2c4);

  // Fire hydrant near the main-road corner
  (function hydrant() {
    var g = new THREE.Group();
    cyl(0.22, 0.26, 0.85, M.hydrantRed, 0, 0.43, 0, g);
    var cap = new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 8), M.hydrantRed);
    cap.position.y = 0.92; cap.castShadow = true; g.add(cap);
    cyl(0.09, 0.09, 0.5, M.hydrantRed, 0, 0.45, 0.2, g).rotation.x = Math.PI / 2;
    cyl(0.09, 0.09, 0.5, M.hydrantRed, 0.2, 0.45, 0, g).rotation.z = Math.PI / 2;
    g.position.set(-30, 0, 1.2);
    scene.add(g);
    blobShadow(1.2, 1.2, -30, 1.2);
  })();

  // More parked cars, varied colors
  car(-26.5, -30, Math.PI / 2, 0xc8c8c8);
  car(18, 9.6, Math.PI, 0x3a3a3a);
  car(26.5, -14, Math.PI / 2, 0x7a2020);
  car(-11.6, 17.5, 0, 0xdadada); // parked in the Asri 02 driveway

  /* ---- People walking on the sidewalks ---- */
  var walkers = [];
  function person(x, z, shirt, axis, min, max, speed) {
    var g = new THREE.Group();
    var skin = new THREE.MeshStandardMaterial({ color: 0xd9a986, roughness: 0.8 });
    var shirtMat = new THREE.MeshStandardMaterial({ color: shirt, roughness: 0.9 });
    var pantsMat = new THREE.MeshStandardMaterial({ color: 0x2e3440, roughness: 0.95 });
    function limb(w, h, d, mat, px, py, pz) {
      var geo = new THREE.BoxGeometry(w, h, d);
      geo.translate(0, -h / 2, 0); // pivot at top (hip / shoulder)
      var m = new THREE.Mesh(geo, mat);
      m.position.set(px, py, pz);
      m.castShadow = true;
      g.add(m);
      return m;
    }
    var legL = limb(0.17, 0.78, 0.17, pantsMat, -0.11, 0.78, 0);
    var legR = limb(0.17, 0.78, 0.17, pantsMat, 0.11, 0.78, 0);
    var armL = limb(0.12, 0.6, 0.12, shirtMat, -0.3, 1.28, 0);
    var armR = limb(0.12, 0.6, 0.12, shirtMat, 0.3, 1.28, 0);
    var torso = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.58, 0.24), shirtMat);
    torso.position.y = 1.07; torso.castShadow = true; g.add(torso);
    var head = new THREE.Mesh(new THREE.SphereGeometry(0.15, 12, 10), skin);
    head.position.y = 1.52; head.castShadow = true; g.add(head);
    var hair = new THREE.Mesh(new THREE.SphereGeometry(0.155, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.55),
      new THREE.MeshStandardMaterial({ color: 0x1e1a16, roughness: 1 }));
    hair.position.y = 1.55; g.add(hair);
    g.position.set(x, 0, z);
    scene.add(g);
    walkers.push({ g: g, axis: axis, pos: axis === 'x' ? x : z, min: min, max: max,
      speed: speed, dir: 1, legL: legL, legR: legR, armL: armL, armR: armR, phase: Math.random() * 6 });
  }
  person(-40, 2.2, 0xb4552d, 'x', -48, 48, 1.3);
  person(35, 13.8, 0x2e5d8a, 'x', -48, 48, 1.0);
  person(-31, -20, 0x3f6b2c, 'z', -40, 40, 0.9);

  /* ---- Street name signs ---- */
  function signTexture(text) {
    var c = document.createElement('canvas');
    c.width = 256; c.height = 64;
    var ctx = c.getContext('2d');
    ctx.fillStyle = '#1d5c33'; ctx.fillRect(0, 0, 256, 64);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 30px sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(text, 128, 34);
    var t = new THREE.CanvasTexture(c);
    t.encoding = THREE.sRGBEncoding;
    return t;
  }
  function streetSign(x, z, text, ry) {
    var g = new THREE.Group();
    cyl(0.05, 0.05, 2.5, M.metal, 0, 1.25, 0, g, 8);
    var board = new THREE.Mesh(
      new THREE.BoxGeometry(1.7, 0.42, 0.06),
      new THREE.MeshStandardMaterial({ map: signTexture(text), roughness: 0.6 })
    );
    board.position.y = 2.55; board.castShadow = true; g.add(board);
    g.position.set(x, 0, z);
    g.rotation.y = ry;
    scene.add(g);
  }
  streetSign(-24.2, 1.0, 'JL. KENANGA', 0);
  streetSign(24.2, 15.2, 'JL. MELATI', Math.PI);

  // Hedges along a few plot fronts + park edge
  [[16, -12.4, 5], [38, 19.6, 5], [-12, -12.4, 4], [33, -22, 8]].forEach(function (h) {
    var hedge = box(h[2], 0.75, 0.6, M.bush, h[0], 0.5, h[1], scene);
    hedge.castShadow = true;
  });

  /* ================= Park (NE corner) with pond ================= */

  (function park() {
    flat(22, 26, M.grass, 45, -31, 0.01);
    // Pond
    var pond = new THREE.Mesh(new THREE.CircleGeometry(6, 36), M.water);
    pond.rotation.x = -Math.PI / 2;
    pond.position.set(46, 0.06, -32);
    pond.receiveShadow = true;
    scene.add(pond);
    var rim = new THREE.Mesh(new THREE.RingGeometry(6, 6.9, 36), M.paver);
    rim.rotation.x = -Math.PI / 2;
    rim.position.set(46, 0.05, -32);
    rim.receiveShadow = true;
    scene.add(rim);
    // Lily pads
    [[44, -31], [48, -33.5], [46.5, -29.5]].forEach(function (p) {
      var pad = new THREE.Mesh(new THREE.CircleGeometry(0.55, 12), M.bush);
      pad.rotation.x = -Math.PI / 2;
      pad.position.set(p[0], 0.08, p[1]);
      scene.add(pad);
    });
    // Benches facing the pond
    function bench(x, z, ry) {
      var g = new THREE.Group();
      box(2.2, 0.12, 0.55, M.wood, 0, 0.55, 0, g);
      box(2.2, 0.55, 0.1, M.wood, 0, 0.95, -0.26, g);
      box(0.12, 0.55, 0.5, M.metal, -0.95, 0.28, 0, g);
      box(0.12, 0.55, 0.5, M.metal, 0.95, 0.28, 0, g);
      g.position.set(x, 0, z); g.rotation.y = ry;
      scene.add(g);
    }
    bench(38.5, -30, Math.PI / 2.4);
    bench(46, -23.5, Math.PI);
    // Park trees + bushes
    tree(36, -40, 1.15); tree(54, -40, 1.05); tree(54, -22, 1.1); tree(37, -22.5, 0.95);
    [[40, -38], [52, -30], [39, -26]].forEach(function (p) {
      var b = new THREE.Mesh(new THREE.IcosahedronGeometry(0.7, 1), M.bush);
      b.scale.y = 0.7; b.position.set(p[0], 0.45, p[1]); b.castShadow = true;
      scene.add(b);
    });
  })();

  /* ================= Houses ================= */

  var HOUSES = [
    { id: 'kenanga', name: 'Villa Kenanga', type: 'Vila Modern 2 Lantai', price: 'Rp 4,5 M', kt: 4, km: 3, lt: 320, lb: 240,
      desc: 'Vila modern dengan kaca lebar menghadap taman, balkon lantai dua, dan carport ganda. Paling luas di estate.',
      x: -42, z: -20, ry: 0, w: 11, d: 9, floors: 2, roof: 'flat', wall: M.plasterWhite, upperWall: M.plasterGrey,
      balcony: true, carport: true, pool: false, accentWall: true },
    { id: 'asri1', name: 'Rumah Asri 01', type: 'Rumah Keluarga 2 Lantai', price: 'Rp 2,1 M', kt: 4, km: 2, lt: 200, lb: 150,
      desc: 'Rumah keluarga dengan atap limasan, bata ekspos di fasad, dan halaman depan yang teduh.',
      x: -12, z: -20, ry: 0, w: 10, d: 8.5, floors: 2, roof: 'pitched', roofMat: 'roofTilePhoto', wall: M.brick, upperWall: M.plasterCream,
      balcony: false, carport: true, pool: false, accentWall: false },
    { id: 'senja', name: 'Kubus Senja', type: 'Rumah Kubus Minimalis', price: 'Rp 1,8 M', kt: 3, km: 2, lt: 180, lb: 120,
      desc: 'Desain kubus minimalis dengan aksen kayu dan jendela sudut yang besar. Cocok untuk keluarga muda.',
      x: 16, z: -20, ry: 0, w: 9, d: 8, floors: 2, roof: 'flat', wall: M.plasterWhite, upperWall: M.plasterSand,
      balcony: false, carport: false, pool: false, accentWall: true },
    { id: 'melati', name: 'Townhouse Melati', type: 'Townhouse 2 Lantai', price: 'Rp 950 jt', kt: 3, km: 2, lt: 105, lb: 110,
      desc: 'Townhouse ringkas dua lantai dengan atap datar dan taman depan kecil. Harga paling terjangkau.',
      x: -42, z: 27, ry: Math.PI, w: 7.5, d: 9, floors: 2, roof: 'flat', wall: M.plasterCream, upperWall: M.plasterWhite,
      balcony: true, carport: false, pool: false, accentWall: false },
    { id: 'asri2', name: 'Rumah Asri 02', type: 'Rumah Minimalis 1 Lantai', price: 'Rp 1,35 M', kt: 3, km: 2, lt: 150, lb: 90,
      desc: 'Satu lantai yang lapang dengan atap pelana dan teras depan lebar untuk santai sore.',
      x: -8, z: 27, ry: Math.PI, w: 10, d: 8, floors: 1, roof: 'pitched', roofMat: 'roofCeramicPhoto', wall: M.plasterCream, upperWall: null,
      balcony: false, carport: true, pool: false, accentWall: false },
    { id: 'anggrek', name: 'Villa Anggrek', type: 'Vila 1 Lantai + Kolam', price: 'Rp 3,2 M', kt: 3, km: 3, lt: 280, lb: 180,
      desc: 'Vila satu lantai dengan kolam renang pribadi, dinding kaca penuh, dan taman tropis.',
      x: 38, z: 27, ry: Math.PI, w: 12, d: 8.5, floors: 1, roof: 'flat', wall: M.plasterWhite, upperWall: null,
      balcony: false, carport: true, pool: true, accentWall: true }
  ];

  function windowUnit(w, h) {
    var g = new THREE.Group();
    box(w, h, 0.1, M.frame, 0, 0, 0, g);
    box(w - 0.18, h - 0.18, 0.12, M.glass, 0, 0, 0.01, g);
    box(0.09, h - 0.18, 0.14, M.frame, 0, 0, 0.01, g); // vertical mullion
    box(w - 0.18, 0.09, 0.14, M.frame, 0, 0, 0.01, g); // horizontal mullion (4 panes)
    box(w + 0.14, 0.09, 0.2, M.frame, 0, -h / 2 - 0.03, 0.03, g); // sill
    return g;
  }
  function placeWindow(parent, x, y, z, ry, w, h) {
    var win = windowUnit(w, h);
    win.position.set(x, y, z);
    win.rotation.y = ry;
    parent.add(win);
  }

  function scaleUVs(geo, sx, sy) {
    // ExtrudeGeometry UVs are in shape units — rescale so 1 texture tile
    // spans a realistic size instead of repeating dozens of times.
    var uv = geo.attributes.uv;
    for (var i = 0; i < uv.count; i++) {
      uv.setXY(i, uv.getX(i) * sx, uv.getY(i) * sy);
    }
    uv.needsUpdate = true;
    return geo;
  }

  function pitchedRoof(w, d, h, mat) {
    var shape = new THREE.Shape();
    shape.moveTo(-w / 2, 0); shape.lineTo(w / 2, 0); shape.lineTo(0, h); shape.closePath();
    var geo = new THREE.ExtrudeGeometry(shape, { depth: d, bevelEnabled: false });
    geo.translate(0, 0, -d / 2);
    scaleUVs(geo, 0.16, 0.16); // photo tiles: ~6 world units per texture tile
    var m = new THREE.Mesh(geo, mat);
    m.castShadow = true; m.receiveShadow = true;
    return m;
  }

  function buildHouse(cfg) {
    var g = new THREE.Group();
    var W = cfg.w, D = cfg.d;
    var floorH = cfg.floors === 2 ? 3.1 : 3.5;

    // Plot slab + driveway + garden path (real cobblestone)
    box(15, 0.14, 13, M.concrete, 0, 0.07, 0.5, g);
    flat(3.2, 15, M.paver, 3.6, 13.5, 0.16, g);
    flat(1.6, 5, M.paverPath, -1.2, 6.4, 0.16, g);
    // Driveway edge curbs
    box(0.18, 0.16, 15, M.concrete, 1.9, 0.24, 13.5, g);
    box(0.18, 0.16, 15, M.concrete, 5.3, 0.24, 13.5, g);
    // Soft contact shadow under the whole plot
    blobShadow(17, 15, 0, 0.5, g);

    // Ground floor
    box(W, floorH, D, cfg.wall, 0, floorH / 2 + 0.14, 0, g);
    var topY = floorH + 0.14;

    // Wood accent wall strip on the front (for accent houses)
    if (cfg.accentWall) {
      box(2.6, floorH - 0.4, 0.12, M.wood, -W / 2 + 1.5, floorH / 2 + 0.14, D / 2 + 0.03, g);
    }

    // Upper floor (set back, with side infills so no see-through gaps)
    var upFront = D / 2, upLeft = -W / 2, upRight = W / 2;
    if (cfg.floors === 2) {
      var w2 = W * 0.8, d2 = D * 0.86;
      var upX = 0.4, upZ = -0.4;
      upLeft = upX - w2 / 2; upRight = upX + w2 / 2;
      upFront = upZ + d2 / 2;
      box(w2, 2.9, d2, cfg.upperWall || cfg.wall, upX, floorH + 0.14 + 1.45, upZ, g);
      var lw = upLeft + W / 2;
      if (lw > 0.05) box(lw, 2.9, D, cfg.upperWall || cfg.wall, -W / 2 + lw / 2, floorH + 0.14 + 1.45, 0, g);
      var rw = W / 2 - upRight;
      if (rw > 0.05) box(rw, 2.9, D, cfg.upperWall || cfg.wall, W / 2 - rw / 2, floorH + 0.14 + 1.45, 0, g);
      topY = floorH + 0.14 + 2.9;
    }

    // Roof
    if (cfg.roof === 'pitched') {
      var roof = pitchedRoof(W + 1, D + 1, 2.2, M[cfg.roofMat] || M.roofTilePhoto);
      roof.position.set(0, topY, 0);
      g.add(roof);
      // Ridge cap
      box(W + 1, 0.18, 0.3, M.roofDark, 0, topY + 2.25, 0, g);
      // Chimney (brick, on the slope near the ridge)
      box(0.9, 1.7, 0.9, M.brick, W / 4, topY + 1.5, -D / 6, g);
      box(1.1, 0.16, 1.1, M.concrete, W / 4, topY + 2.4, -D / 6, g);
      // Gutters along both eaves + downspouts
      [-1, 1].forEach(function (s) {
        var gut = cyl(0.09, 0.09, W + 1.1, M.metal, 0, topY + 0.12, s * (D / 2 + 0.55), g, 8);
        gut.rotation.z = Math.PI / 2;
        gut.castShadow = false;
        cyl(0.07, 0.07, topY + 0.1, M.metal, -W / 2 + 0.4, (topY + 0.1) / 2 + 0.1, s * (D / 2 + 0.55), g, 8);
      });
    } else {
      box(W + 0.7, 0.28, D + 0.7, M.roofDark, 0, topY + 0.14, 0, g);
      // Parapet
      box(W + 0.7, 0.45, 0.18, cfg.upperWall || cfg.wall, 0, topY + 0.45, D / 2 + 0.26, g);
      box(W + 0.7, 0.45, 0.18, cfg.upperWall || cfg.wall, 0, topY + 0.45, -D / 2 - 0.26, g);
      box(0.18, 0.45, D + 0.7, cfg.upperWall || cfg.wall, -W / 2 - 0.26, topY + 0.45, 0, g);
      box(0.18, 0.45, D + 0.7, cfg.upperWall || cfg.wall, W / 2 + 0.26, topY + 0.45, 0, g);
      // Rooftop AC unit
      box(1.1, 0.6, 0.8, M.metal, -W / 4, topY + 0.6, -D / 4, g);
    }

    // Door (front, +z) — frame, two recessed panels, knob
    var door = box(1.15, 2.25, 0.12, M.woodDoor, -1.2, 1.27, D / 2 + 0.04, g);
    box(0.1, 2.4, 0.16, M.frame, -1.85, 1.27, D / 2 + 0.04, g);
    box(0.1, 2.4, 0.16, M.frame, -0.55, 1.27, D / 2 + 0.04, g);
    box(1.4, 0.1, 0.16, M.frame, -1.2, 2.52, D / 2 + 0.04, g);
    box(0.85, 0.8, 0.05, M.woodDark, -1.2, 1.85, D / 2 + 0.11, g);
    box(0.85, 0.8, 0.05, M.woodDark, -1.2, 0.85, D / 2 + 0.11, g);
    var knob = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 8), M.metal);
    knob.position.set(-0.75, 1.2, D / 2 + 0.14); g.add(knob);
    box(1.5, 0.16, 0.7, M.paver, -1.2, 0.22, D / 2 + 0.35, g); // step

    // Windows — front
    placeWindow(g, 1.6, 1.75, D / 2 + 0.04, 0, 1.5, 1.35);
    placeWindow(g, W / 2 - 1.2, 1.75, D / 2 + 0.04, 0, 1.3, 1.35);
    if (cfg.floors === 2) {
      placeWindow(g, -1.6, floorH + 1.6, upFront + 0.04, 0, 1.4, 1.3);
      placeWindow(g, 1.6, floorH + 1.6, upFront + 0.04, 0, 1.4, 1.3);
    }
    // Windows — sides
    placeWindow(g, -W / 2 - 0.04, 1.75, 0.5, -Math.PI / 2, 1.3, 1.3);
    placeWindow(g, W / 2 + 0.04, 1.75, -0.5, Math.PI / 2, 1.3, 1.3);
    if (cfg.floors === 2) {
      placeWindow(g, -W / 2 - 0.04, floorH + 1.6, -1, -Math.PI / 2, 1.2, 1.2);
      placeWindow(g, W / 2 + 0.04, floorH + 1.6, 1, Math.PI / 2, 1.2, 1.2);
    }

    // Balcony (upper front, on the recessed upper wall)
    if (cfg.balcony) {
      box(3.6, 0.18, 1.15, M.concrete, 0.4, floorH + 0.2, upFront + 0.55, g);
      var rail = new THREE.Group();
      for (var i = 0; i < 5; i++) {
        box(0.07, 1.0, 0.07, M.metal, -1.4 + i * 0.7, 0.5, 0, rail);
      }
      box(3.6, 0.08, 0.08, M.metal, 0, 1.02, 0, rail);
      box(3.6, 0.08, 0.08, M.metal, 0, 0.55, 0, rail);
      rail.position.set(0.4, floorH + 0.3, upFront + 1.08);
      g.add(rail);
      // Balcony door
      box(1.1, 2.1, 0.1, M.glass, 0.4, floorH + 1.2, upFront + 0.04, g);
    }

    // Carport (side)
    if (cfg.carport) {
      var cx = -W / 2 - 2.1;
      [[-1.4, -1.6], [1.4, -1.6], [-1.4, 1.6], [1.4, 1.6]].forEach(function (p) {
        cyl(0.09, 0.09, 2.5, M.metal, cx + p[0], 1.25 + 0.14, p[1], g);
      });
      box(3.6, 0.14, 4.2, M.roofDark, cx, 2.6, 0, g);
    }

    // Private pool (front-right yard)
    if (cfg.pool) {
      box(5.4, 0.5, 3.2, M.paver, 4.2, 0.32, 4.6, g);
      var water = box(4.8, 0.22, 2.6, M.water, 4.2, 0.5, 4.6, g);
      water.castShadow = false;
    }

    // Front fence with driveway gap + cap rails
    var fz = 7;
    var fenceH = 0.95;
    box(4.6, fenceH, 0.18, M.white, -5.1, fenceH / 2 + 0.14, fz, g);
    box(2.4, fenceH, 0.18, M.white, 6.2, fenceH / 2 + 0.14, fz, g);
    box(4.7, 0.08, 0.24, M.accent, -5.1, fenceH + 0.18, fz, g);
    box(2.5, 0.08, 0.24, M.accent, 6.2, fenceH + 0.18, fz, g);
    box(0.3, 1.25, 0.3, M.accent, -2.75, 0.77, fz, g);
    box(0.3, 1.25, 0.3, M.accent, 2.05, 0.77, fz, g);
    box(0.3, 1.25, 0.3, M.accent, 5.05, 0.77, fz, g);
    box(0.3, 1.25, 0.3, M.accent, 7.35, 0.77, fz, g);

    // Garden: bushes + flowers + a small tree
    var flowerGeo = new THREE.SphereGeometry(0.09, 8, 6);
    var flowerMats = [M.flowerRed, M.flowerYellow, M.flowerPink];
    [[-5.6, 4.8], [-4.2, 5.4], [5.8, 5.2]].forEach(function (p, bi) {
      var b = new THREE.Mesh(new THREE.IcosahedronGeometry(0.65, 1), M.bush);
      b.scale.y = 0.72; b.position.set(p[0], 0.6, p[1]); b.castShadow = true;
      g.add(b);
      // 3 tiny flowers on each bush
      for (var fi = 0; fi < 3; fi++) {
        var fl = new THREE.Mesh(flowerGeo, flowerMats[(bi + fi) % 3]);
        fl.position.set(p[0] - 0.3 + fi * 0.3, 0.95 + (fi % 2) * 0.12, p[1] + 0.35);
        g.add(fl);
      }
    });

    // Mailbox by the driveway
    var mbPost = box(0.09, 1.05, 0.09, M.metal, 5.6, 0.67, 7.6, g);
    box(0.5, 0.32, 0.32, M.metal, 5.6, 1.32, 7.6, g);
    box(0.06, 0.22, 0.1, M.hydrantRed, 5.85, 1.45, 7.6, g);
    tree(-5.8, 2.2, 0.8, g);

    // Selection ring (hidden until selected)
    var ring = new THREE.Mesh(
      new THREE.RingGeometry(8.4, 9.1, 48),
      new THREE.MeshBasicMaterial({ color: 0xb4552d, transparent: true, opacity: 0, side: THREE.DoubleSide })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(0, 0.2, 0.5);
    g.add(ring);
    g.userData.ring = ring;

    g.position.set(cfg.x, 0, cfg.z);
    g.rotation.y = cfg.ry;
    g.userData.houseId = cfg.id;
    scene.add(g);
    return g;
  }

  var houseGroups = {};
  var pickMeshes = [];
  HOUSES.forEach(function (cfg) {
    var grp = buildHouse(cfg);
    houseGroups[cfg.id] = grp;
    grp.traverse(function (o) { if (o.isMesh) pickMeshes.push(o); });
  });

  /* ================= Custom orbit controls (touch + mouse) ================= */

  var orbit = {
    target: new THREE.Vector3(0, 1.5, 6),
    tTarget: new THREE.Vector3(0, 1.5, 6),
    theta: 0.62, phi: 1.20, radius: 36,
    tTheta: 0.62, tPhi: 1.20, tRadius: 36
  };
  function applyOrbit() {
    var sp = Math.sin(orbit.phi), cp = Math.cos(orbit.phi);
    camera.position.set(
      orbit.target.x + orbit.radius * sp * Math.sin(orbit.theta),
      orbit.target.y + orbit.radius * cp,
      orbit.target.z + orbit.radius * sp * Math.cos(orbit.theta)
    );
    camera.lookAt(orbit.target);
  }
  function clampOrbit() {
    orbit.tPhi = Math.max(0.18, Math.min(1.42, orbit.tPhi));
    orbit.tRadius = Math.max(16, Math.min(150, orbit.tRadius));
  }

  var pointers = new Map();
  var downPos = null, downMoved = 0, pinchDist = 0;
  var el = renderer.domElement;

  el.addEventListener('pointerdown', function (e) {
    el.setPointerCapture(e.pointerId);
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.size === 1) { downPos = { x: e.clientX, y: e.clientY }; downMoved = 0; }
    if (pointers.size === 2) {
      var p = Array.from(pointers.values());
      pinchDist = Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y);
    }
    fadeHint();
  });
  el.addEventListener('pointermove', function (e) {
    if (!pointers.has(e.pointerId)) return;
    var prev = pointers.get(e.pointerId);
    var dx = e.clientX - prev.x, dy = e.clientY - prev.y;
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.size === 1) {
      downMoved += Math.abs(dx) + Math.abs(dy);
      orbit.tTheta -= dx * 0.005;
      orbit.tPhi -= dy * 0.004;
      clampOrbit();
    } else if (pointers.size === 2) {
      var p = Array.from(pointers.values());
      var d = Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y);
      if (pinchDist > 0) {
        orbit.tRadius *= pinchDist / d;
        clampOrbit();
      }
      pinchDist = d;
    }
  });
  function endPointer(e) {
    pointers.delete(e.pointerId);
    if (pointers.size < 2) pinchDist = 0;
    if (pointers.size === 0 && downPos && downMoved < 8) {
      handleTap(e.clientX, e.clientY);
    }
    downPos = null;
  }
  el.addEventListener('pointerup', endPointer);
  el.addEventListener('pointercancel', endPointer);
  el.addEventListener('wheel', function (e) {
    e.preventDefault();
    orbit.tRadius *= 1 + e.deltaY * 0.001;
    clampOrbit();
  }, { passive: false });
  el.addEventListener('contextmenu', function (e) { e.preventDefault(); });

  function focusOn(x, z, dist) {
    orbit.tTarget.set(x, 2, z);
    orbit.tRadius = dist || 34;
    orbit.tPhi = 1.02;
  }

  /* ================= Picking + detail panel ================= */

  var raycaster = new THREE.Raycaster();
  var pointerNDC = new THREE.Vector2();
  var selectedId = null;

  var detailEl = document.getElementById('detail');
  function showDetail(cfg) {
    document.getElementById('dType').textContent = cfg.type;
    document.getElementById('dName').textContent = cfg.name;
    document.getElementById('dPrice').textContent = cfg.price;
    document.getElementById('dKt').textContent = cfg.kt;
    document.getElementById('dKm').textContent = cfg.km;
    document.getElementById('dLt').textContent = cfg.lt + ' m²';
    document.getElementById('dLb').textContent = cfg.lb + ' m²';
    document.getElementById('dDesc').textContent = cfg.desc;
    detailEl.hidden = false;
  }
  function hideDetail() {
    detailEl.hidden = true;
    selectHouse(null);
  }
  document.getElementById('detailClose').addEventListener('click', hideDetail);

  function selectHouse(id) {
    selectedId = id;
    HOUSES.forEach(function (h) {
      var ring = houseGroups[h.id].userData.ring;
      ring.material.opacity = (h.id === id) ? 0.9 : 0;
    });
    document.querySelectorAll('.card').forEach(function (c) {
      c.classList.toggle('active', c.dataset.id === id);
    });
  }

  function openHouse(id) {
    var cfg = null;
    HOUSES.forEach(function (h) { if (h.id === id) cfg = h; });
    if (!cfg) return;
    selectHouse(id);
    showDetail(cfg);
    focusOn(cfg.x, cfg.z, 34);
  }

  function handleTap(cx, cy) {
    var rect = el.getBoundingClientRect();
    pointerNDC.set(((cx - rect.left) / rect.width) * 2 - 1, -((cy - rect.top) / rect.height) * 2 + 1);
    raycaster.setFromCamera(pointerNDC, camera);
    var hits = raycaster.intersectObjects(pickMeshes, false);
    if (!hits.length) { hideDetail(); return; }
    var obj = hits[0].object, id = null;
    while (obj) {
      if (obj.userData && obj.userData.houseId) { id = obj.userData.houseId; break; }
      obj = obj.parent;
    }
    if (id) openHouse(id); else hideDetail();
  }

  /* ================= Property cards ================= */

  var cardsEl = document.getElementById('cards');
  HOUSES.forEach(function (h) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'card';
    b.dataset.id = h.id;
    b.innerHTML = '<span class="card-type"></span><h3></h3><p class="card-price"></p><p class="card-meta"></p>';
    b.querySelector('.card-type').textContent = h.type;
    b.querySelector('h3').textContent = h.name;
    b.querySelector('.card-price').textContent = h.price;
    b.querySelector('.card-meta').textContent = h.kt + ' KT • ' + h.km + ' KM • LT ' + h.lt + ' m²';
    b.addEventListener('click', function () { openHouse(h.id); });
    cardsEl.appendChild(b);
  });

  /* ================= Day / dusk ================= */

  var isDusk = false;
  var duskMix = 0; // 0 = day, 1 = dusk
  var dayState = {
    sunColor: new THREE.Color(0xfff2d8), sunI: 1.25, sunPos: new THREE.Vector3(85, 52, 42),
    hemiSky: new THREE.Color(0xbdd7f2), hemiGround: new THREE.Color(0x8a9a7a), hemiI: 0.5,
    fog: new THREE.Color(0xcfe0ec), ambI: 0.1, glow: 0
  };
  var duskState = {
    sunColor: new THREE.Color(0xff9a4d), sunI: 0.55, sunPos: new THREE.Vector3(-55, 28, -35),
    hemiSky: new THREE.Color(0x6a5a8a), hemiGround: new THREE.Color(0x3a3340), hemiI: 0.28,
    fog: new THREE.Color(0x4a3f66), ambI: 0.06, glow: 0.9
  };
  var toggleBtn = document.getElementById('dayToggle');
  toggleBtn.addEventListener('click', function () {
    isDusk = !isDusk;
    toggleBtn.textContent = isDusk ? 'Siang' : 'Senja';
    sky.material.map = isDusk ? skyDuskTex : skyDayTex;
    sky.material.needsUpdate = true;
    scene.environment = isDusk ? envDusk : envDay;
  });

  var tmpColor = new THREE.Color();
  function applyDayDusk() {
    var t = duskMix;
    var from = dayState, to = duskState;
    sun.color.lerpColors(from.sunColor, to.sunColor, t);
    sun.intensity = from.sunI + (to.sunI - from.sunI) * t;
    sun.position.lerpVectors(from.sunPos, to.sunPos, t);
    hemi.color.lerpColors(from.hemiSky, to.hemiSky, t);
    hemi.groundColor.lerpColors(from.hemiGround, to.hemiGround, t);
    hemi.intensity = from.hemiI + (to.hemiI - from.hemiI) * t;
    amb.intensity = from.ambI + (to.ambI - from.ambI) * t;
    tmpColor.lerpColors(from.fog, to.fog, t);
    scene.fog.color.copy(tmpColor);
    M.glass.emissiveIntensity = t * 1.8;
    M.lampGlow.emissiveIntensity = t * 2.6;
  }

  /* ================= Hint + resize + loop ================= */

  var hintEl = document.getElementById('hint');
  var hintFaded = false;
  function fadeHint() {
    if (hintFaded) return;
    hintFaded = true;
    hintEl.classList.add('faded');
  }
  setTimeout(fadeHint, 7000);

  window.addEventListener('resize', function () {
    camera.aspect = wrap.clientWidth / wrap.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(wrap.clientWidth, wrap.clientHeight);
  });

  var clock = new THREE.Clock();
  function tick() {
    requestAnimationFrame(tick);
    var dt = Math.min(clock.getDelta(), 0.05);
    var t = clock.elapsedTime;

    // Orbit damping
    orbit.theta += (orbit.tTheta - orbit.theta) * 0.1;
    orbit.phi += (orbit.tPhi - orbit.phi) * 0.1;
    orbit.radius += (orbit.tRadius - orbit.radius) * 0.1;
    orbit.target.lerp(orbit.tTarget, 0.08);
    applyOrbit();

    // Day/dusk blend (fast enough to finish even on slow devices)
    var target = isDusk ? 1 : 0;
    if (Math.abs(duskMix - target) > 0.001) {
      duskMix += (target - duskMix) * Math.min(1, dt * 3.5);
      applyDayDusk();
    }

    // Selection ring pulse
    if (selectedId) {
      var ring = houseGroups[selectedId].userData.ring;
      ring.material.opacity = 0.6 + Math.sin(t * 3) * 0.25;
    }

    // Clouds drift slowly across the sky
    for (var ci = 0; ci < clouds.length; ci++) {
      clouds[ci].position.x += clouds[ci].userData.speed * dt;
      if (clouds[ci].position.x > 250) clouds[ci].position.x = -250;
    }

    // People walk back and forth on the sidewalks
    walkers.forEach(function (w) {
      w.phase += dt * 6.5 * Math.abs(w.speed);
      w.pos += w.dir * Math.abs(w.speed) * dt;
      if (w.pos > w.max) { w.pos = w.max; w.dir = -1; }
      if (w.pos < w.min) { w.pos = w.min; w.dir = 1; }
      if (w.axis === 'x') {
        w.g.position.x = w.pos;
        w.g.rotation.y = w.dir > 0 ? Math.PI / 2 : -Math.PI / 2;
      } else {
        w.g.position.z = w.pos;
        w.g.rotation.y = w.dir > 0 ? 0 : Math.PI;
      }
      w.g.position.y = Math.abs(Math.sin(w.phase)) * 0.05;
      var sw = Math.sin(w.phase) * 0.55;
      w.legL.rotation.x = sw; w.legR.rotation.x = -sw;
      w.armL.rotation.x = -sw * 0.7; w.armR.rotation.x = sw * 0.7;
    });

    renderer.render(scene, camera);
  }
  applyOrbit();
  tick();

  // Debug hook for verification (harmless in production)
  window.__estate = {
    webglOk: function () { try { return !!renderer.getContext(); } catch (e) { return false; } },
    setView: function (theta, phi, radius, tx, ty, tz) {
      orbit.theta = orbit.tTheta = theta;
      orbit.phi = orbit.tPhi = phi;
      orbit.radius = orbit.tRadius = radius;
      orbit.target.set(tx, ty, tz);
      orbit.tTarget.set(tx, ty, tz);
      applyOrbit();
      return true;
    },
    houses: HOUSES.length,
    revision: 'r147',
    duskMix: function () { return duskMix; },
    glassGlow: function () { return M.glass.emissiveIntensity; },
    envKind: function () { return scene.environment === envDusk ? 'dusk' : (scene.environment === envDay ? 'day' : 'other'); },
    sunI: function () { return sun.intensity; }
  };

})();
