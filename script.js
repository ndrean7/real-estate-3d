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

  var grassTex = canvasTex(256, function (ctx, s) {
    ctx.fillStyle = '#6d9a4b'; ctx.fillRect(0, 0, s, s);
    speckle(ctx, s, 900, ['#5d8a3e', '#7fae58', '#648c42', '#8fbc66'], 1, 3.2);
    ctx.strokeStyle = 'rgba(90,130,60,.5)';
    for (var i = 0; i < 160; i++) {
      var x = Math.random() * s, y = Math.random() * s;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 1.5, y - 5); ctx.stroke();
    }
  }, 26, 20);

  var asphaltTex = canvasTex(256, function (ctx, s) {
    ctx.fillStyle = '#4b4e56'; ctx.fillRect(0, 0, s, s);
    speckle(ctx, s, 700, ['#43464e', '#565a63', '#3e4148'], 1, 2.4);
    ctx.fillStyle = '#e8e6df';
    for (var y = 0; y < s; y += 64) ctx.fillRect(s / 2 - 4, y + 8, 8, 34);
  }, 1, 14);

  var asphaltPlainTex = canvasTex(256, function (ctx, s) {
    ctx.fillStyle = '#4b4e56'; ctx.fillRect(0, 0, s, s);
    speckle(ctx, s, 700, ['#43464e', '#565a63', '#3e4148'], 1, 2.4);
  }, 2, 10);

  var paverTex = canvasTex(256, function (ctx, s) {
    ctx.fillStyle = '#c9c2b2'; ctx.fillRect(0, 0, s, s);
    speckle(ctx, s, 350, ['#bdb5a4', '#d6cfbf', '#b3ab99'], 1, 2.5);
    ctx.strokeStyle = '#a49c8a'; ctx.lineWidth = 3;
    for (var i = 0; i <= 4; i++) {
      ctx.beginPath(); ctx.moveTo(i * 64, 0); ctx.lineTo(i * 64, s); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, i * 64); ctx.lineTo(s, i * 64); ctx.stroke();
    }
  }, 4, 4);

  var sidewalkTex = canvasTex(256, function (ctx, s) {
    ctx.fillStyle = '#cfc9bb'; ctx.fillRect(0, 0, s, s);
    speckle(ctx, s, 300, ['#c2bbae', '#dcd6c8'], 1, 2.5);
    ctx.strokeStyle = '#b0a894'; ctx.lineWidth = 3;
    for (var i = 0; i <= 2; i++) {
      ctx.beginPath(); ctx.moveTo(i * 128, 0); ctx.lineTo(i * 128, s); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, i * 128); ctx.lineTo(s, i * 128); ctx.stroke();
    }
  }, 30, 1);

  function plasterTex(base, fleck) {
    return canvasTex(256, function (ctx, s) {
      ctx.fillStyle = base; ctx.fillRect(0, 0, s, s);
      speckle(ctx, s, 500, fleck, 0.8, 2.2);
    }, 2, 2);
  }

  var brickTex = canvasTex(256, function (ctx, s) {
    ctx.fillStyle = '#b98a68'; ctx.fillRect(0, 0, s, s);
    var bh = 32, bw = 64;
    for (var row = 0; row < s / bh; row++) {
      var off = (row % 2) * bw / 2;
      for (var col = -1; col < s / bw + 1; col++) {
        var shade = 150 + ((Math.random() * 40) | 0);
        ctx.fillStyle = 'rgb(' + shade + ',' + ((shade * 0.62) | 0) + ',' + ((shade * 0.45) | 0) + ')';
        ctx.fillRect(col * bw + off + 2, row * bh + 2, bw - 4, bh - 4);
      }
    }
    ctx.fillStyle = 'rgba(0,0,0,.08)';
    for (var i = 0; i < 200; i++) ctx.fillRect(Math.random() * s, Math.random() * s, 2, 2);
  }, 3, 2);

  function makeRoofTex(c1, c2, c3) {
    return canvasTex(256, function (ctx, s) {
      ctx.fillStyle = c3; ctx.fillRect(0, 0, s, s);
      for (var row = 0; row < 8; row++) {
        var y = row * 32;
        for (var col = 0; col < 8; col++) {
          var x = col * 32 + (row % 2 ? 16 : 0);
          var g = ctx.createLinearGradient(x, y, x, y + 32);
          g.addColorStop(0, c1); g.addColorStop(1, c2);
          ctx.fillStyle = g;
          ctx.beginPath(); ctx.arc(x + 16, y + 30, 15, Math.PI, 0); ctx.fill();
          ctx.fillRect(x, y + 14, 32, 16);
        }
      }
    }, 4, 2);
  }
  var roofTex = makeRoofTex('#c06a42', '#8a3d22', '#a34d2e');
  var roofBlueTex = makeRoofTex('#6d9bd1', '#3d6396', '#4a7ab5');
  var roofGreyTex = makeRoofTex('#8d939c', '#5d636c', '#767c86');

  var woodTex = canvasTex(256, function (ctx, s) {
    ctx.fillStyle = '#9a6b42'; ctx.fillRect(0, 0, s, s);
    for (var p = 0; p < 4; p++) {
      var y = p * 64;
      ctx.fillStyle = ['#a1764a', '#8f6339', '#a87c50', '#96683c'][p];
      ctx.fillRect(0, y + 2, s, 60);
      ctx.strokeStyle = 'rgba(70,45,20,.45)'; ctx.lineWidth = 1.5;
      for (var i = 0; i < 5; i++) {
        ctx.beginPath();
        ctx.moveTo(0, y + 10 + i * 11 + Math.random() * 4);
        ctx.bezierCurveTo(80, y + 8 + i * 11, 170, y + 14 + i * 11, s, y + 10 + i * 11);
        ctx.stroke();
      }
      ctx.fillStyle = 'rgba(60,38,18,.6)'; ctx.fillRect(0, y, s, 2);
    }
  }, 1, 1);

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
    grass: new THREE.MeshStandardMaterial({ map: grassTex, roughness: 1 }),
    asphalt: new THREE.MeshStandardMaterial({ map: asphaltTex, roughness: 0.95 }),
    asphaltPlain: new THREE.MeshStandardMaterial({ map: asphaltPlainTex, roughness: 0.95 }),
    paver: new THREE.MeshStandardMaterial({ map: paverTex, roughness: 0.9 }),
    sidewalk: new THREE.MeshStandardMaterial({ map: sidewalkTex, roughness: 0.9 }),
    plasterWhite: new THREE.MeshStandardMaterial({ map: plasterTex('#f2ede3', ['#e6dfd0', '#faf7f0']), roughness: 0.85 }),
    plasterCream: new THREE.MeshStandardMaterial({ map: plasterTex('#e8dcc4', ['#dccfb2', '#f2e9d6']), roughness: 0.85 }),
    plasterGrey: new THREE.MeshStandardMaterial({ map: plasterTex('#c9cdd2', ['#bcc1c7', '#d6dade']), roughness: 0.85 }),
    plasterSand: new THREE.MeshStandardMaterial({ map: plasterTex('#d9c1a0', ['#cbb391', '#e5d2b6']), roughness: 0.85 }),
    brick: new THREE.MeshStandardMaterial({ map: brickTex, roughness: 0.9 }),
    roofTile: new THREE.MeshStandardMaterial({ map: roofTex, roughness: 0.85 }),
    roofBlue: new THREE.MeshStandardMaterial({ map: roofBlueTex, roughness: 0.85 }),
    roofGrey: new THREE.MeshStandardMaterial({ map: roofGreyTex, roughness: 0.85 }),
    roofDark: new THREE.MeshStandardMaterial({ color: 0x35373c, roughness: 0.6, metalness: 0.25 }),
    wood: new THREE.MeshStandardMaterial({ map: woodTex, roughness: 0.7 }),
    woodDark: new THREE.MeshStandardMaterial({ color: 0x5d4128, roughness: 0.75 }),
    frame: new THREE.MeshStandardMaterial({ color: 0xf5f2ea, roughness: 0.5 }),
    glass: new THREE.MeshStandardMaterial({ color: 0x9ec7e2, roughness: 0.08, metalness: 0.35, transparent: true, opacity: 0.72, emissive: 0xffb45c, emissiveIntensity: 0 }),
    concrete: new THREE.MeshStandardMaterial({ color: 0xcfc9bb, roughness: 0.95 }),
    metal: new THREE.MeshStandardMaterial({ color: 0x2e3134, roughness: 0.45, metalness: 0.7 }),
    trunk: new THREE.MeshStandardMaterial({ color: 0x6b4a2e, roughness: 1 }),
    leaf: new THREE.MeshStandardMaterial({ color: 0x4d7d33, roughness: 1 }),
    leaf2: new THREE.MeshStandardMaterial({ color: 0x5d8f3c, roughness: 1 }),
    bush: new THREE.MeshStandardMaterial({ color: 0x3f7030, roughness: 1 }),
    water: new THREE.MeshStandardMaterial({ color: 0x3f8fbf, roughness: 0.12, metalness: 0.25 }),
    lampGlow: new THREE.MeshStandardMaterial({ color: 0xfff2cf, emissive: 0xffc861, emissiveIntensity: 0 }),
    white: new THREE.MeshStandardMaterial({ color: 0xf7f4ec, roughness: 0.8 }),
    accent: new THREE.MeshStandardMaterial({ color: 0xb4552d, roughness: 0.6 })
  };

  /* ================= Sky dome ================= */

  var sky = new THREE.Mesh(
    new THREE.SphereGeometry(280, 24, 14),
    new THREE.MeshBasicMaterial({ map: skyDayTex, side: THREE.BackSide, fog: false })
  );
  scene.add(sky);

  /* ================= Lights ================= */

  var sun = new THREE.DirectionalLight(0xfff2d8, 1.25);
  sun.position.set(70, 95, 45);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -80; sun.shadow.camera.right = 80;
  sun.shadow.camera.top = 80; sun.shadow.camera.bottom = -80;
  sun.shadow.camera.near = 10; sun.shadow.camera.far = 260;
  sun.shadow.bias = -0.0004;
  scene.add(sun);
  scene.add(sun.target);

  var hemi = new THREE.HemisphereLight(0xbdd7f2, 0x8a9a7a, 0.6);
  scene.add(hemi);
  var amb = new THREE.AmbientLight(0xffffff, 0.12);
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

  // Main road (east-west) with dashed centre line in the texture
  flat(120, 9, M.asphalt, 0, 8, 0.02);
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

  /* ================= Trees, lamps, benches, cars ================= */

  function tree(x, z, s) {
    s = s || 1;
    var g = new THREE.Group();
    cyl(0.22 * s, 0.32 * s, 1.9 * s, M.trunk, 0, 0.95 * s, 0, g);
    var f1 = new THREE.Mesh(new THREE.IcosahedronGeometry(1.5 * s, 1), M.leaf);
    f1.position.y = 2.6 * s; f1.castShadow = true; g.add(f1);
    var f2 = new THREE.Mesh(new THREE.IcosahedronGeometry(1.05 * s, 1), M.leaf2);
    f2.position.set(0.7 * s, 3.4 * s, 0.3 * s); f2.castShadow = true; g.add(f2);
    var f3 = new THREE.Mesh(new THREE.IcosahedronGeometry(0.85 * s, 1), M.leaf);
    f3.position.set(-0.7 * s, 3.2 * s, -0.4 * s); f3.castShadow = true; g.add(f3);
    g.position.set(x, 0, z);
    scene.add(g);
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
      x: -12, z: -20, ry: 0, w: 10, d: 8.5, floors: 2, roof: 'pitched', roofMat: 'roofBlue', wall: M.brick, upperWall: M.plasterCream,
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
      x: -8, z: 27, ry: Math.PI, w: 10, d: 8, floors: 1, roof: 'pitched', roofMat: 'roofGrey', wall: M.plasterCream, upperWall: null,
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
    box(0.09, h - 0.18, 0.14, M.frame, 0, 0, 0.01, g); // mullion
    box(w + 0.14, 0.09, 0.2, M.frame, 0, -h / 2 - 0.03, 0.03, g); // sill
    return g;
  }
  function placeWindow(parent, x, y, z, ry, w, h) {
    var win = windowUnit(w, h);
    win.position.set(x, y, z);
    win.rotation.y = ry;
    parent.add(win);
  }

  function pitchedRoof(w, d, h, mat) {
    var shape = new THREE.Shape();
    shape.moveTo(-w / 2, 0); shape.lineTo(w / 2, 0); shape.lineTo(0, h); shape.closePath();
    var geo = new THREE.ExtrudeGeometry(shape, { depth: d, bevelEnabled: false });
    geo.translate(0, 0, -d / 2);
    var m = new THREE.Mesh(geo, mat);
    m.castShadow = true; m.receiveShadow = true;
    return m;
  }

  function buildHouse(cfg) {
    var g = new THREE.Group();
    var W = cfg.w, D = cfg.d;
    var floorH = cfg.floors === 2 ? 3.1 : 3.5;

    // Plot slab + driveway + garden path
    box(15, 0.14, 13, M.concrete, 0, 0.07, 0.5, g);
    flat(3.2, 15, M.paver, 3.6, 13.5, 0.16, g);
    flat(1.6, 5, M.paver, -1.2, 6.4, 0.16, g);

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
      var roof = pitchedRoof(W + 1, D + 1, 2.2, M[cfg.roofMat] || M.roofTile);
      roof.position.set(0, topY, 0);
      g.add(roof);
      // Ridge cap
      box(W + 1, 0.18, 0.3, M.roofDark, 0, topY + 2.25, 0, g);
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

    // Door (front, +z)
    var door = box(1.15, 2.25, 0.12, M.wood, -1.2, 1.27, D / 2 + 0.04, g);
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

    // Front fence with driveway gap
    var fz = 7;
    var fenceH = 0.95;
    box(4.6, fenceH, 0.18, M.white, -5.1, fenceH / 2 + 0.14, fz, g);
    box(2.4, fenceH, 0.18, M.white, 6.2, fenceH / 2 + 0.14, fz, g);
    box(0.3, 1.25, 0.3, M.accent, -2.75, 0.77, fz, g);
    box(0.3, 1.25, 0.3, M.accent, 2.05, 0.77, fz, g);
    box(0.3, 1.25, 0.3, M.accent, 5.05, 0.77, fz, g);
    box(0.3, 1.25, 0.3, M.accent, 7.35, 0.77, fz, g);

    // Garden: bushes + a small tree
    [[-5.6, 4.8], [-4.2, 5.4], [5.8, 5.2]].forEach(function (p) {
      var b = new THREE.Mesh(new THREE.IcosahedronGeometry(0.65, 1), M.bush);
      b.scale.y = 0.72; b.position.set(p[0], 0.6, p[1]); b.castShadow = true;
      g.add(b);
    });
    var gt = tree(0, 0, 0.8);
    gt.position.set(-5.8, 0, 2.2);
    g.add(gt);

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
    target: new THREE.Vector3(0, 1, 2),
    tTarget: new THREE.Vector3(0, 1, 2),
    theta: 0.62, phi: 0.85, radius: 72,
    tTheta: 0.62, tPhi: 0.85, tRadius: 72
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
    sunColor: new THREE.Color(0xfff2d8), sunI: 1.25, sunPos: new THREE.Vector3(70, 95, 45),
    hemiSky: new THREE.Color(0xbdd7f2), hemiGround: new THREE.Color(0x8a9a7a), hemiI: 0.6,
    fog: new THREE.Color(0xcfe0ec), ambI: 0.12, glow: 0
  };
  var duskState = {
    sunColor: new THREE.Color(0xff9a4d), sunI: 0.55, sunPos: new THREE.Vector3(-55, 28, -35),
    hemiSky: new THREE.Color(0x6a5a8a), hemiGround: new THREE.Color(0x3a3340), hemiI: 0.32,
    fog: new THREE.Color(0x4a3f66), ambI: 0.07, glow: 0.9
  };
  var toggleBtn = document.getElementById('dayToggle');
  toggleBtn.addEventListener('click', function () {
    isDusk = !isDusk;
    toggleBtn.textContent = isDusk ? 'Siang' : 'Senja';
    sky.material.map = isDusk ? skyDuskTex : skyDayTex;
    sky.material.needsUpdate = true;
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
    M.glass.emissiveIntensity = t * 1.3;
    M.lampGlow.emissiveIntensity = t * 2.2;
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

    // Day/dusk blend
    var target = isDusk ? 1 : 0;
    if (Math.abs(duskMix - target) > 0.001) {
      duskMix += (target - duskMix) * Math.min(1, dt * 2.2);
      applyDayDusk();
    }

    // Selection ring pulse
    if (selectedId) {
      var ring = houseGroups[selectedId].userData.ring;
      ring.material.opacity = 0.6 + Math.sin(t * 3) * 0.25;
    }

    renderer.render(scene, camera);
  }
  applyOrbit();
  tick();

  // Debug hook for verification (harmless in production)
  window.__estate = {
    webglOk: function () { try { return !!renderer.getContext(); } catch (e) { return false; } },
    houses: HOUSES.length,
    revision: 'r147'
  };

})();
