// @ts-nocheck
(() => {
      const canvas = document.querySelector("#diagram");
      const context = canvas.getContext("2d", { alpha: true });
      const chapters = [...document.querySelectorAll(".chapter")];
      const motionPreference = matchMedia("(prefers-reduced-motion: reduce)");
      let reduceMotion = motionPreference.matches;
      let refined = true;
      const particleCount = 361;
      const cellSize = 104;
      const particles = [];
      const grid = [];
      const pointer = { x: -10_000, y: -10_000, active: false };

      let width = 0;
      let height = 0;
      let ratio = 1;
      let gridColumns = 0;
      let gridRows = 0;
      let activeScene = "intro";
      let activeIndex = 0;
      let diagram = { nodes: [], edges: [], notes: [] };
      let diagramAlpha = 0;
      let previousTime = 0;
      let animationFrame = 0;
      let isAnimating = false;
      let previewPaused = false;
      let scrollFrame = 0;
      let simulationTime = 0;
      let sceneStartedAt = 0;
      let introInitialized = false;
      let flockBounds;
      const palette = {
        paper: "rgb(252 252 251)",
        surface: "rgb(252 252 251)",
        surfaceSubtle: "rgb(247 248 249)",
        ink: "rgb(25 27 31)",
        soft: "rgb(68 73 80)",
        muted: "rgb(111 116 124)",
        line: "rgb(204 208 213)",
        lineSoft: "rgb(226 229 232)",
        accent: "rgb(42 104 143)",
        particle: "rgb(25 27 31 / 0.88)",
        particleIntro: "rgb(25 27 31 / 0.88)",
        replica: "rgb(81 87 95 / 0.62)",
        warning: "rgb(150 110 40)"
      };

      function syncPalette() {
        const styles = getComputedStyle(document.documentElement);
        const dark = styles.colorScheme === "dark";
        palette.paper = styles.getPropertyValue("--color-surface").trim() || palette.paper;
        palette.surface = styles.getPropertyValue("--color-surface").trim() || palette.surface;
        palette.surfaceSubtle =
          styles.getPropertyValue("--color-surface-subtle").trim() || palette.surfaceSubtle;
        palette.ink = styles.getPropertyValue("--color-text").trim() || palette.ink;
        palette.soft = styles.getPropertyValue("--color-text-soft").trim() || palette.soft;
        palette.muted = styles.getPropertyValue("--color-text-muted").trim() || palette.muted;
        palette.line = dark
          ? styles.getPropertyValue("--color-text-faint").trim() || palette.muted
          : styles.getPropertyValue("--color-text-muted").trim() || palette.muted;
        palette.lineSoft = styles.getPropertyValue("--color-border").trim() || palette.lineSoft;
        palette.accent = styles.getPropertyValue("--color-accent").trim() || palette.accent;
        palette.particle = dark
          ? styles.getPropertyValue("--color-text-muted").trim() || palette.muted
          : styles.getPropertyValue("--color-text").trim() || palette.ink;
        palette.particleIntro = dark
          ? styles.getPropertyValue("--color-text-soft").trim() || palette.soft
          : styles.getPropertyValue("--color-text").trim() || palette.ink;
        palette.warning = styles.getPropertyValue("--color-warning-text").trim() || palette.warning;
        palette.replica =
          styles.getPropertyValue("--color-text-muted").trim() || palette.muted;
      }

      class Particle {
        constructor(index) {
          const angle = Math.random() * Math.PI * 2;
          this.index = index;
          this.x = innerWidth * (0.7 + (Math.random() - 0.5) * 0.24);
          this.y = innerHeight * (0.5 + (Math.random() - 0.5) * 0.32);
          this.vx = Math.cos(angle) * (0.4 + Math.random());
          this.vy = Math.sin(angle) * (0.4 + Math.random());
          this.tx = this.x;
          this.ty = this.y;
          this.phase = Math.random();
          this.scale = 0.78 + Math.random() * 0.44;
          this.depth = Math.random();
          this.response = 0.022 + Math.random() * 0.015;
          this.releaseAt = 0;
          this.group = 'flock';
          this.px = this.x; this.py = this.y;
          this.pvx = this.vx; this.pvy = this.vy;
          this.nearest = [];
          this.distances = [];
          this.role = "record";
          this.path = null;
        }
      }

      function diagramBounds() {
        if (width <= 820) {
          const headerBottom = document.querySelector(".site-header")?.getBoundingClientRect().bottom || 76;
          const top = Math.max(headerBottom + 12, height * 0.10);
          return {
            x: width * 0.07,
            y: top,
            w: width * 0.86,
            h: Math.max(190, Math.min(height * 0.45 - top, 300))
          };
        }

        return {
          x: width * 0.52,
          y: height * 0.17,
          w: width * 0.43,
          h: height * 0.68
        };
      }

      function introBounds() {
        if (width <= 820) return diagramBounds();
        return { x: width * 0.45, y: height * 0.08, w: width * 0.53, h: height * 0.84 };
      }

      function rect(bounds, x, y, w, h) {
        return {
          x: bounds.x + bounds.w * x,
          y: bounds.y + bounds.h * y,
          w: bounds.w * w,
          h: bounds.h * h
        };
      }

      function addNode(id, label, detail, box, kind = "standard") {
        const node = { id, label, detail, box, kind, heading: fitNodeLabel(label, box) };
        diagram.nodes.push(node);
        return node;
      }

      // Measure once per scene, not on every animation frame. Keep labels inside
      // their boxes and reserve the same measured space above record particles.
      function fitNodeLabel(label, box) {
        const compact = width <= 820;
        const padding = compact ? 7 : 10;
        const availableWidth = Math.max(1, box.w - padding * 2);
        const availableHeight = Math.max(1, box.h - padding * 2);
        let lines = [];
        let size = compact ? 14 : 17;
        for (; size >= (compact ? 11 : 12); size--) {
          context.font = `${size}px "Atkinson Hyperlegible", sans-serif`;
          lines = [];
          let line = "";
          for (const word of label.split(" ")) {
            const candidate = line ? `${line} ${word}` : word;
            if (line && context.measureText(candidate).width > availableWidth) {
              lines.push(line);
              line = word;
            } else line = candidate;
          }
          if (line) lines.push(line);
          if (lines.every((line) => context.measureText(line).width <= availableWidth)
            && lines.length * Math.ceil(size * 1.15) <= availableHeight) break;
        }
        size = Math.max(compact ? 11 : 12, size);
        const lineHeight = Math.ceil(size * 1.15);
        const maxLines = Math.max(1, Math.floor(availableHeight / lineHeight));
        const overflow = lines.length > maxLines;
        lines = lines.slice(0, maxLines);
        context.font = `${size}px "Atkinson Hyperlegible", sans-serif`;
        lines = lines.map((line, index) => {
          if (context.measureText(line).width <= availableWidth
            && !(overflow && index === lines.length - 1)) return line;
          while (line && context.measureText(`${line}…`).width > availableWidth) {
            line = line.slice(0, -1);
          }
          return `${line}…`;
        });
        return { lines, size, lineHeight, padding, height: padding + lines.length * lineHeight };
      }

      function pointOnNode(node, side, offset = 0.5) {
        const { x, y, w, h } = node.box;
        if (side === "left") return { x, y: y + h * offset };
        if (side === "right") return { x: x + w, y: y + h * offset };
        if (side === "top") return { x: x + w * offset, y };
        return { x: x + w * offset, y: y + h };
      }

      function addEdge(from, to, label = "", dashed = false) {
        const edge = { from, to, label, dashed };
        diagram.edges.push(edge);
        return edge;
      }

      function addNote(text, x, y) {
        diagram.notes.push({ text, x, y });
      }

      function gridParticles(start, count, node, role = "record") {
        const labelSpace = node.heading.height + 5;
        const padding = width <= 820 ? 7 : 11;
        const area = {
          x: node.box.x + padding,
          y: node.box.y + labelSpace,
          w: Math.max(10, node.box.w - padding * 2),
          h: Math.max(10, node.box.h - labelSpace - padding)
        };
        const aspect = Math.max(0.4, area.w / Math.max(area.h, 1));
        const columns = Math.max(1, Math.ceil(Math.sqrt(count * aspect)));
        const rows = Math.max(1, Math.ceil(count / columns));

        for (let localIndex = 0; localIndex < count; localIndex++) {
          const particle = particles[start + localIndex];
          const column = localIndex % columns;
          const row = Math.floor(localIndex / columns);
          particle.tx = area.x + (column + 0.5) * area.w / columns;
          particle.ty = area.y + (row + 0.5) * area.h / rows;
          particle.role = role;
          particle.group = node.id;
          particle.path = null;
        }
      }

      function pathParticles(start, count, points, role = "packet") {
        for (let localIndex = 0; localIndex < count; localIndex++) {
          const particle = particles[start + localIndex];
          particle.role = role;
          particle.group = `path-${start}`;
          particle.path = points;
          particle.phase = localIndex / count;
        }
      }

      function layoutIntro(bounds) {
        diagram.nodes = [];
        diagram.edges = [];
        diagram.notes = [];
        const centerX = bounds.x + bounds.w * 0.53;
        const centerY = bounds.y + bounds.h * 0.5;

        particles.forEach((particle, index) => {
          particle.role = "record";
          particle.group = 'flock';
          particle.path = null;
          particle.releaseAt = 0;

          if (reduceMotion || previewPaused) {
            const angle = index * 2.399963;
            const radius = Math.sqrt(index / particleCount);
            particle.tx = centerX + Math.cos(angle) * bounds.w * 0.34 * radius;
            particle.ty = centerY + Math.sin(angle) * bounds.h * 0.30 * radius;
          }
        });
      }

      function layoutCollection(bounds) {
        const collection = addNode(
          "collection-folder",
          "mdbase collection",
          "a folder you can keep",
          rect(bounds, 0.01, 0.05, 0.98, 0.90),
          "boundary"
        );
        const records = addNode(
          "collection-records",
          "Markdown records",
          "one useful item per file",
          rect(bounds, 0.06, 0.18, 0.59, 0.66),
          "standard"
        );
        const types = addNode(
          "collection-types",
          "types",
          "what records mean",
          rect(bounds, 0.71, 0.18, 0.24, 0.25),
          "service"
        );
        const settings = addNode(
          "collection-settings",
          "settings",
          "shared rules",
          rect(bounds, 0.71, 0.59, 0.24, 0.25),
          "service"
        );

        gridParticles(0, 321, records);
        gridParticles(321, 20, types, "metadata");
        gridParticles(341, 20, settings, "metadata");
      }

      function layoutStructure(bounds) {
        const collection = addNode(
          "structured-collection",
          "one collection",
          "different kinds of records",
          rect(bounds, 0.01, 0.06, 0.98, 0.88),
          "boundary"
        );
        const projects = addNode(
          "projects",
          "projects",
          "status · owner",
          rect(bounds, 0.05, 0.21, 0.27, 0.59),
          "standard"
        );
        const people = addNode(
          "people",
          "people",
          "name · role",
          rect(bounds, 0.365, 0.21, 0.27, 0.59),
          "standard"
        );
        const notes = addNode(
          "notes",
          "meeting notes",
          "date · project",
          rect(bounds, 0.68, 0.21, 0.27, 0.59),
          "standard"
        );

        gridParticles(0, 121, projects);
        gridParticles(121, 120, people);
        gridParticles(241, 120, notes);
      }

      // Cards carry real text: a file, an edit, a permission. Lines are plain
      // strings or { text, tone } where tone is add · remove · held · faint.
      function addCard(id, label, lines, box, kind = "card") {
        const node = addNode(id, label, "", box, kind);
        node.lines = lines.map((line) => typeof line === "string" ? { text: line, tone: "" } : line);
        node.mono = fitCardLines(node);
        const needed = node.heading.height + 10 + node.lines.length * node.mono.lineHeight + node.heading.padding;
        // Shrink or grow around the centre so text is never clipped at the size floor.
        box.y += (box.h - needed) / 2;
        box.h = needed;
        return node;
      }

      function fitCardLines(node) {
        const compact = width <= 820;
        const padding = node.heading.padding;
        const available = Math.max(1, node.box.w - padding * 2 - 8);
        const room = Math.max(1, node.box.h - node.heading.height - padding - 4);
        const floor = compact ? 11 : 12;
        let size = compact ? 12 : 13;
        for (; size > floor; size--) {
          context.font = `${size}px "Azeret Mono", ui-monospace, monospace`;
          const widest = Math.max(...node.lines.map((line) => context.measureText(line.text).width));
          if (widest <= available && node.lines.length * Math.ceil(size * 1.55) <= room) break;
        }
        return { size, lineHeight: Math.ceil(size * 1.55) };
      }

      function ambient(start, count = particleCount - start) {
        for (let index = start; index < start + count; index++) {
          const particle = particles[index];
          particle.role = "ambient";
          particle.group = "ambient";
          particle.path = null;
          const bounds = diagramBounds();
          const angle = index * 2.399963;
          const radius = Math.sqrt((index - start + .5) / count);
          particle.tx = bounds.x + bounds.w * (.5 + Math.cos(angle) * radius * .46);
          particle.ty = bounds.y + bounds.h * (.5 + Math.sin(angle) * radius * .46);
        }
      }

      function layoutMerge(bounds) {
        const compact = bounds.w < 480;
        const laptop = addCard("merge-laptop", "Laptop · text editor", [
          { text: "status: active", tone: "remove" },
          { text: "status: done", tone: "add" }
        ], compact ? rect(bounds, 0.00, 0.00, 0.48, 0.36) : rect(bounds, 0.00, 0.06, 0.40, 0.28));
        const phone = addCard("merge-phone", "Phone · TaskNotes", [
          { text: "due: 2026-11-02", tone: "add" }
        ], compact ? rect(bounds, 0.52, 0.00, 0.48, 0.36) : rect(bounds, 0.00, 0.66, 0.40, 0.28));
        const result = addCard("merge-result", "website-redesign.md", [
          { text: "---", tone: "faint" },
          "title: Website redesign",
          { text: "status: done", tone: "add" },
          'owner: "[[people/sam.md]]"',
          { text: "due: 2026-11-02", tone: "add" },
          { text: "---", tone: "faint" }
        ], compact ? rect(bounds, 0.14, 0.50, 0.72, 0.50) : rect(bounds, 0.53, 0.25, 0.47, 0.50));
        const fromLaptop = compact
          ? [pointOnNode(laptop, "bottom"), pointOnNode(result, "top", 0.3)]
          : [pointOnNode(laptop, "right"), pointOnNode(result, "left", 0.3)];
        const fromPhone = compact
          ? [pointOnNode(phone, "bottom"), pointOnNode(result, "top", 0.7)]
          : [pointOnNode(phone, "right"), pointOnNode(result, "left", 0.7)];
        addEdge(fromLaptop, null, "one field", true);
        addEdge(fromPhone, null, "another field", true);
        if (!compact) addNote("both changes kept", result.box.x + result.box.w / 2, result.box.y + result.box.h + 26);
        pathParticles(0, 10, fromLaptop);
        pathParticles(10, 10, fromPhone);
        ambient(20);
      }

      function lockedLines(count) {
        return Array.from({ length: count }, (_, index) =>
          ({ text: "▒▒▒▒▒▒▒▒  locked", tone: index === count - 1 ? "add" : "faint" }));
      }

      function layoutApps(bounds) {
        const compact = bounds.w < 480;
        const collection = addNode("apps-collection", "one collection", "",
          compact ? rect(bounds, 0.00, 0.00, 0.40, 1.00) : rect(bounds, 0.01, 0.13, 0.42, 0.74), "standard");
        const apps = [
          ["Editor", "any collection"],
          ["TaskNotes", "tasks"],
          ["Reader", "papers · web pages"],
          ["Writer", "long documents"]
        ];
        let next = 0;
        const step = compact ? 0.255 : 0.235;
        const top = compact ? 0.0 : 0.04;
        apps.forEach(([label, line], index) => {
          const card = addCard(`app-${index}`, label, [{ text: line, tone: "faint" }],
            compact ? rect(bounds, 0.52, top + index * step, 0.48, 0.22) : rect(bounds, 0.62, top + index * step, 0.38, 0.19), "app");
          const path = [pointOnNode(card, "left"), pointOnNode(collection, "right", 0.2 + index * 0.2)];
          addEdge(path, null, "", true);
          pathParticles(260 + next, 6, index % 2 ? path.slice().reverse() : path);
          next += 6;
        });
        gridParticles(0, 260, collection);
        ambient(260 + next);
      }

      function layoutSync(bounds) {
        const compact = bounds.w < 480;
        const log = addCard("sync-log", "mdbase sync", lockedLines(3),
          compact ? rect(bounds, 0.27, 0.36, 0.46, 0.30) : rect(bounds, 0.31, 0.36, 0.38, 0.28), "log");
        const devices = [
          ["sync-laptop", "Laptop", rect(bounds, 0.00, 0.00, 0.27, 0.30), "right", 0.15, "standard"],
          ["sync-phone", "Phone", rect(bounds, 0.73, 0.00, 0.27, 0.30), "left", 0.15, "standard"],
          ["sync-desktop", "Work desktop", rect(bounds, 0.00, 0.70, 0.27, 0.30), "right", 0.85, "standard"],
          ["sync-tablet", "Tablet · offline", rect(bounds, 0.73, 0.70, 0.27, 0.30), "left", 0.85, "replica"]
        ].map(([id, label, box, side, offset, kind]) => ({ node: addNode(id, label, "", box, kind), side, offset }));
        let next = 0;
        devices.forEach(({ node, side, offset }, index) => {
          const corner = pointOnNode(node, side === "right" ? "right" : "left", 0.5);
          const logPoint = pointOnNode(log, side === "right" ? "left" : "right", offset < 0.5 ? 0.3 : 0.7);
          const offline = index === 3;
          addEdge([corner, logPoint], null, "", true).relationship = offline;
          gridParticles(next, 64, node, offline ? "replica" : "record");
          next += 64;
          if (!offline) {
            // Each online device sends sealed entries and receives everyone else's.
            pathParticles(next, 6, index % 2 ? [logPoint, corner] : [corner, logPoint]);
            next += 6;
          }
        });
        if (!compact) addNote("passes changes along,\ncan’t read them", log.box.x + log.box.w / 2, log.box.y + log.box.h + 24);
        ambient(next);
      }

      function layoutOptions(bounds) {
        const compact = bounds.w < 480;
        const panels = [
          ["cloud", "Cloud copy", 0.00],
          ["private", "Private", 0.53]
        ];
        let next = 0;
        panels.forEach(([id, label, x]) => {
          addNode(`${id}-panel`, label, "", rect(bounds, x, 0.02, 0.47, 0.96), "boundary");
          const devices = addNode(`${id}-devices`, "your devices", "", rect(bounds, x + 0.04, 0.14, 0.39, 0.22), "standard");
          const log = addCard(`${id}-log`, "mdbase sync", [{ text: "▒▒▒▒▒▒  locked", tone: "faint" }],
            rect(bounds, x + 0.04, 0.47, 0.39, 0.15), "log");
          const cloud = id === "cloud"
            ? addNode(`${id}-copy`, compact ? "readable copy" : "readable copy · apps work while devices are off", "", rect(bounds, x + 0.04, 0.70, 0.39, 0.24), "accent")
            : addCard(`${id}-copy`, compact ? "locked" : "locked · only your devices", [{ text: "apps go through", tone: "faint" }, { text: "your devices", tone: "faint" }],
              rect(bounds, x + 0.04, 0.70, 0.39, 0.24), "replica");
          const up = [pointOnNode(devices, "bottom"), pointOnNode(log, "top")];
          addEdge(up, null, "", false).relationship = true;
          gridParticles(next, 90, devices);
          next += 90;
          pathParticles(next, 6, up);
          next += 6;
          if (id === "cloud") {
            const down = [pointOnNode(log, "bottom"), pointOnNode(cloud, "top")];
            addEdge(down, null, "", false).relationship = true;
            gridParticles(next, 90, cloud, "metadata");
            next += 90;
            pathParticles(next, 6, down);
            next += 6;
          }
        });
        ambient(next);
      }

      function layoutGrant(bounds) {
        const compact = bounds.w < 480;
        const collection = addNode("grant-collection", "projects", "",
          compact ? rect(bounds, 0.00, 0.00, 0.44, 1.00) : rect(bounds, 0.01, 0.13, 0.40, 0.72), "standard");
        const grant = addCard("grant", "Project planner may", [
          { text: "find projects", tone: "add" },
          { text: "create projects", tone: "add" },
          { text: "edit projects", tone: "add" },
          { text: "delete records", tone: "blocked" }
        ], compact ? rect(bounds, 0.54, 0.00, 0.46, 0.62) : rect(bounds, 0.52, 0.22, 0.30, 0.48));
        const app = addNode("grant-app", "Project planner", "",
          compact ? rect(bounds, 0.54, 0.76, 0.46, 0.24) : rect(bounds, 0.86, 0.36, 0.14, 0.20), "app");
        const askPath = compact
          ? [pointOnNode(app, "top"), pointOnNode(grant, "bottom")]
          : [pointOnNode(app, "left"), pointOnNode(grant, "right", 0.38)];
        const accessPath = [pointOnNode(grant, "left", 0.5), pointOnNode(collection, "right", 0.5)];
        addEdge(askPath, null, "", true);
        addEdge(accessPath, null, "", false);
        gridParticles(0, 200, collection);
        pathParticles(200, 8, askPath);
        pathParticles(208, 8, accessPath);
        ambient(216);
      }

      function layoutSharing(bounds) {
        const collection = addNode("sharing-collection", "shared collection", "",
          rect(bounds, 0.01, 0.13, 0.42, 0.72), "standard");
        const viewer = addNode("sharing-viewer", "Viewer · reads", "",
          rect(bounds, 0.60, 0.00, 0.40, 0.24), "standard");
        const editor = addNode("sharing-editor", "Editor · reads and edits", "",
          rect(bounds, 0.60, 0.31, 0.40, 0.24), "standard");
        addCard("sharing-removed", "Member removed", [
          { text: "keeps files they had", tone: "faint" },
          { text: "no new changes", tone: "remove" }
        ], rect(bounds, 0.60, 0.66, 0.40, 0.30), "replica");
        const viewerPath = [pointOnNode(collection, "right", 0.15), pointOnNode(viewer, "left")];
        const editorPath = [pointOnNode(collection, "right", 0.50), pointOnNode(editor, "left")];
        addEdge(viewerPath, null, "", false);
        addEdge(editorPath, null, "", false);
        gridParticles(0, 160, collection);
        gridParticles(160, 48, viewer, "replica");
        gridParticles(208, 48, editor);
        pathParticles(256, 6, viewerPath);
        pathParticles(262, 8, editorPath.slice().reverse());
        ambient(270);
      }

      function buildScene(name, stagger = false) {
        const bounds = diagramBounds();
        diagram = { nodes: [], edges: [], notes: [] };
        if (stagger) {
          diagramAlpha = 0;
          sceneStartedAt = simulationTime;
        }

        const layouts = {
          intro: layoutIntro, collection: layoutCollection, structure: layoutStructure,
          apps: layoutApps, merge: layoutMerge, sync: layoutSync, options: layoutOptions,
          grant: layoutGrant, sharing: layoutSharing
        };
        (layouts[name] || layoutIntro)(bounds);

        if (stagger && name !== 'intro') {
          const groups = new Map();
          particles.forEach(particle => {
            if (particle.role === "ambient") { particle.releaseAt = 0; return; }
            if (!groups.has(particle.group)) groups.set(particle.group, groups.size);
            particle.releaseAt = simulationTime + (refined ? groups.get(particle.group) * 115 + particle.depth * 110 + particle.index % 11 * 8 : 0);
          });
        }

        if (reduceMotion) {
          updateMovingTargets(simulationTime);
          particles.forEach((particle) => {
            particle.x = particle.tx;
            particle.y = particle.ty;
            particle.vx = 0;
            particle.vy = 0;
          });
          diagramAlpha = 1;
          draw(0);
        }
      }

      function resize() {
        const previousWidth = width || innerWidth;
        const previousHeight = height || innerHeight;
        const previousBounds = width ? diagramBounds() : null;
        width = innerWidth;
        height = innerHeight;
        ratio = Math.max(
          0.75,
          Math.min(devicePixelRatio || 1, 1.5, Math.sqrt(5_000_000 / (width * height)))
        );
        canvas.width = Math.round(width * ratio);
        canvas.height = Math.round(height * ratio);
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
        context.setTransform(ratio, 0, 0, ratio, 0, 0);

        gridColumns = Math.max(1, Math.ceil(width / cellSize));
        gridRows = Math.max(1, Math.ceil(height / cellSize));
        grid.length = gridColumns * gridRows;

        const nextBounds = diagramBounds();
        particles.forEach((particle) => {
          if (refined && previousBounds) {
            particle.x = nextBounds.x + (particle.x - previousBounds.x) / previousBounds.w * nextBounds.w;
            particle.y = nextBounds.y + (particle.y - previousBounds.y) / previousBounds.h * nextBounds.h;
            particle.vx *= nextBounds.w / previousBounds.w;
            particle.vy *= nextBounds.h / previousBounds.h;
          } else {
            particle.x = particle.x / previousWidth * width;
            particle.y = particle.y / previousHeight * height;
          }
        });
        flockBounds = nextBounds;
        if (!introInitialized && refined && activeScene === 'intro') {
          const bounds = diagramBounds();
          particles.forEach((p, index) => {
            const angle = index * 2.399963;
            const radius = Math.sqrt((index + .5) / particleCount);
            p.x = bounds.x + bounds.w * (.52 + Math.cos(angle) * radius * .34);
            p.y = bounds.y + bounds.h * (.50 + Math.sin(angle) * radius * .26);
          });
        }
        introInitialized = true;
        buildScene(activeScene);
      }

      function rebuildGrid() {
        for (let index = 0; index < grid.length; index++) {
          if (grid[index]) grid[index].length = 0;
        }

        particles.forEach((particle, index) => {
          // Every bird steers from the same previous-frame state, not partially
          // updated neighbours. This removes index-order bias in the flock.
          particle.px = particle.x; particle.py = particle.y;
          particle.pvx = particle.vx; particle.pvy = particle.vy;
          const column = Math.max(0, Math.min(gridColumns - 1, Math.floor(particle.x / cellSize)));
          const row = Math.max(0, Math.min(gridRows - 1, Math.floor(particle.y / cellSize)));
          const gridIndex = row * gridColumns + column;
          if (!grid[gridIndex]) grid[gridIndex] = [];
          grid[gridIndex].push(index);
        });
      }

      function updateFreeParticle(particle, index, now, step) {
        let separationX = 0;
        let separationY = 0;
        let alignmentX = 0;
        let alignmentY = 0;
        let cohesionX = 0;
        let cohesionY = 0;
        let neighbors = 0;

        const column = Math.max(0, Math.min(gridColumns - 1, Math.floor(particle.x / cellSize)));
        const row = Math.max(0, Math.min(gridRows - 1, Math.floor(particle.y / cellSize)));

        for (let rowOffset = -1; rowOffset <= 1; rowOffset++) {
          const nearbyRow = row + rowOffset;
          if (nearbyRow < 0 || nearbyRow >= gridRows) continue;

          for (let columnOffset = -1; columnOffset <= 1; columnOffset++) {
            const nearbyColumn = column + columnOffset;
            if (nearbyColumn < 0 || nearbyColumn >= gridColumns) continue;

            const nearby = grid[nearbyRow * gridColumns + nearbyColumn];
            if (!nearby) continue;

            for (const otherIndex of nearby) {
              if (otherIndex === index) continue;
              const other = particles[otherIndex];
              const dx = other.x - particle.x;
              const dy = other.y - particle.y;
              const distanceSquared = dx * dx + dy * dy;

              if (distanceSquared < 10_400) {
                neighbors++;
                alignmentX += other.vx;
                alignmentY += other.vy;
                cohesionX += other.x;
                cohesionY += other.y;

                if (distanceSquared < 760 && distanceSquared > 0.01) {
                  const pressure = 1 / Math.max(distanceSquared, 70);
                  separationX -= dx * pressure;
                  separationY -= dy * pressure;
                }
              }
            }
          }
        }

        let accelerationX = separationX * 0.58;
        let accelerationY = separationY * 0.58;

        if (neighbors) {
          accelerationX +=
            (alignmentX / neighbors - particle.vx) * 0.018 +
            (cohesionX / neighbors - particle.x) * 0.00025;
          accelerationY +=
            (alignmentY / neighbors - particle.vy) * 0.018 +
            (cohesionY / neighbors - particle.y) * 0.00025;
        }

        const bounds = diagramBounds();
        const centerX =
          bounds.x + bounds.w * (0.52 + 0.12 * Math.sin(now * 0.00018));
        const centerY =
          bounds.y + bounds.h * (0.50 + 0.12 * Math.sin(now * 0.00027 + 1.1));
        accelerationX += (centerX - particle.x) * 0.00024;
        accelerationY += (centerY - particle.y) * 0.00024;
        accelerationX += Math.cos(now * 0.0005 + particle.phase * 8) * 0.008;
        accelerationY += Math.sin(now * 0.0017 + particle.phase * 9) * 0.006;

        if (pointer.active) {
          const dx = particle.x - pointer.x;
          const dy = particle.y - pointer.y;
          const distanceSquared = dx * dx + dy * dy;
          if (distanceSquared < 22_500 && distanceSquared > 1) {
            const distance = Math.sqrt(distanceSquared);
            const force = (1 - distance / 150) * 0.18;
            accelerationX += dx / distance * force;
            accelerationY += dy / distance * force;
          }
        }

        particle.vx += accelerationX * step;
        particle.vy += accelerationY * step;
        const speed = Math.hypot(particle.vx, particle.vy);
        const maximum = 1.7 + index % 5 * 0.06;
        if (speed > maximum) {
          particle.vx = particle.vx / speed * maximum;
          particle.vy = particle.vy / speed * maximum;
        }
        particle.x += particle.vx * step;
        particle.y += particle.vy * step;
      }

      function updateRefinedParticle(particle, now, step) {
        const nearest = particle.nearest, distances = particle.distances;
        nearest.length = 0; distances.length = 0;
        let separationX = 0, separationY = 0;
        const compact = width <= 820;
        const separationRadiusSquared = compact ? 144 : 324;
        const column = Math.max(0, Math.min(gridColumns - 1, Math.floor(particle.px / cellSize)));
        const row = Math.max(0, Math.min(gridRows - 1, Math.floor(particle.py / cellSize)));
        for (let dy = -1; dy <= 1; dy++) {
          const r = row + dy;
          if (r < 0 || r >= gridRows) continue;
          for (let dx = -1; dx <= 1; dx++) {
            const c = column + dx;
            if (c < 0 || c >= gridColumns) continue;
            for (const index of grid[r * gridColumns + c] || []) {
              const other = particles[index];
              if (other === particle) continue;
              const x = other.px - particle.px, y = other.py - particle.py;
              const distance = x * x + y * y;
              if (distance < separationRadiusSquared && distance > .01) {
                const pressure = .72 / Math.max(distance, 70);
                separationX -= x * pressure; separationY -= y * pressure;
              }
              if (distance >= 10400) continue;
              // Seven nearest neighbours carry a turn locally instead of
              // averaging the entire surrounding patch into a rigid blob.
              let slot = 0;
              while (slot < distances.length && distances[slot] < distance) slot++;
              if (slot < 7) {
                distances.splice(slot, 0, distance); nearest.splice(slot, 0, index);
                if (nearest.length > 7) { nearest.pop(); distances.pop(); }
              }
            }
          }
        }
        let ax = separationX, ay = separationY;
        if (nearest.length) {
          let x = 0, y = 0, vx = 0, vy = 0;
          nearest.forEach(index => {
            const p = particles[index]; x += p.px; y += p.py;
            vx += p.pvx; vy += p.pvy;
          });
          const count = nearest.length;
          ax += (vx / count - particle.pvx) * particle.response + (x / count - particle.px) * .00042;
          ay += (vy / count - particle.pvy) * particle.response + (y / count - particle.py) * .00042;
        }
        const bounds = flockBounds;
        const t = now / 1000;
        const centerX = bounds.x + bounds.w * (.52 + Math.sin(t * .17) * .06);
        const centerY = bounds.y + bounds.h * (.50 + Math.sin(t * .23 + 1) * .08);
        const nx = (particle.px - centerX) / (bounds.w * .44);
        const ny = (particle.py - centerY) / (bounds.h * .37);
        const wind = window.mdbaseAtmosphere?.wind(particle.px / width, particle.py / height)
          || { x: Math.sin(t * .22 + ny * 2), y: Math.cos(t * .19 + nx * 2) * .6 };
        const depthSpeed = (.85 + particle.depth * .3) * (compact ? .72 : 1);
        let targetX = (wind.x * .75 - ny * 1.1 + Math.sin(t * .6 + ny * 3) * .45) * depthSpeed;
        let targetY = (wind.y * .75 + nx * .85 + Math.cos(t * .43 + nx * 3) * .28) * depthSpeed;
        const targetSpeed = Math.hypot(targetX, targetY);
        if (targetSpeed > 1.3) { targetX *= 1.3 / targetSpeed; targetY *= 1.3 / targetSpeed; }
        ax += (targetX - particle.pvx) * .027;
        ay += (targetY - particle.pvy) * .027;
        // Very weak central cohesion; soft walls protect the reading column
        // without prescribing the flock's silhouette or teleporting a bird.
        ax += (centerX - particle.px) * .00006;
        ay += (centerY - particle.py) * .00006;
        const paddingX = bounds.w * .09, paddingY = bounds.h * .09;
        const wallStrength = compact ? .0024 : .0012;
        ax += Math.max(0, bounds.x + paddingX - particle.px) * wallStrength;
        ax -= Math.max(0, particle.px - (bounds.x + bounds.w - paddingX)) * wallStrength;
        ay += Math.max(0, bounds.y + paddingY - particle.py) * wallStrength;
        ay -= Math.max(0, particle.py - (bounds.y + bounds.h - paddingY)) * wallStrength;
        if (pointer.active) {
          const x = particle.px - pointer.x, y = particle.py - pointer.y;
          const distance = Math.hypot(x, y);
          if (distance > 1 && distance < 150) {
            const force = (1 - distance / 150) * .12;
            ax += x / distance * force; ay += y / distance * force;
          }
        }
        const acceleration = Math.hypot(ax, ay);
        if (acceleration > .11) { ax *= .11 / acceleration; ay *= .11 / acceleration; }
        particle.vx += ax * step; particle.vy += ay * step;
        const speed = Math.hypot(particle.vx, particle.vy);
        const maximum = 1.55 + particle.depth * .3;
        if (speed > maximum) { particle.vx *= maximum / speed; particle.vy *= maximum / speed; }
        particle.x += particle.vx * step; particle.y += particle.vy * step;
      }

      function updateMovingTargets(now) {
        particles.forEach((particle) => {
          if (!particle.path) return;

          const progress =
            0.5 - 0.5 * Math.cos(((now * 0.00016 + particle.phase) % 1) * Math.PI * 2);
          const segmentCount = particle.path.length - 1;
          const scaled = progress * segmentCount;
          const segment = Math.min(segmentCount - 1, Math.floor(scaled));
          const localProgress = scaled - segment;
          const from = particle.path[segment];
          const to = particle.path[segment + 1];
          particle.tx = from.x + (to.x - from.x) * localProgress;
          particle.ty = from.y + (to.y - from.y) * localProgress;
        });
      }

      function updateFormationParticle(particle, step) {
        if (particle.role === "ambient" && !reduceMotion && !previewPaused) {
          updateRefinedParticle(particle, simulationTime, step);
          return;
        }
        if (refined && simulationTime < particle.releaseAt) {
          updateRefinedParticle(particle, simulationTime, step);
          return;
        }
        const dx = particle.tx - particle.x;
        const dy = particle.ty - particle.y;
        const progress = refined ? Math.min(1, Math.max(0, (simulationTime - particle.releaseAt) / 280)) : 1;
        const ease = progress * progress * (3 - 2 * progress);
        const strength = (particle.role === "packet" ? 0.020 : 0.013) * ease;
        particle.vx += dx * strength * step;
        particle.vy += dy * strength * step;

        const damping = Math.pow(particle.role === "packet" ? 0.80 : 0.84, step);
        particle.vx *= damping;
        particle.vy *= damping;

        const speed = Math.hypot(particle.vx, particle.vy);
        const maximum = particle.role === "packet" ? 8.5 : 7;
        if (speed > maximum) {
          particle.vx = particle.vx / speed * maximum;
          particle.vy = particle.vy / speed * maximum;
        }

        particle.x += particle.vx * step;
        particle.y += particle.vy * step;
      }

      function drawEdge(edge, compact) {
        const points = edge.from;
        if (!points || points.length < 2) return;

        context.save();
        context.strokeStyle = palette.muted;
        context.globalAlpha *= 0.52;
        context.lineWidth = 1;
        context.setLineDash(edge.dashed ? [3, 5] : []);
        context.beginPath();
        context.moveTo(points[0].x, points[0].y);
        points.slice(1).forEach((point) => context.lineTo(point.x, point.y));
        context.stroke();
        context.setLineDash([]);

        if (edge.relationship) {
          context.restore();
          return;
        }
        const finalPoint = points[points.length - 1];
        const previousPoint = points[points.length - 2];
        const angle = Math.atan2(finalPoint.y - previousPoint.y, finalPoint.x - previousPoint.x);
        context.fillStyle = palette.muted;
        context.globalAlpha *= 0.62 / 0.52;
        context.beginPath();
        context.moveTo(finalPoint.x, finalPoint.y);
        context.lineTo(
          finalPoint.x - Math.cos(angle - 0.48) * 5,
          finalPoint.y - Math.sin(angle - 0.48) * 5
        );
        context.lineTo(
          finalPoint.x - Math.cos(angle + 0.48) * 5,
          finalPoint.y - Math.sin(angle + 0.48) * 5
        );
        context.closePath();
        context.fill();
        context.restore();
      }

      function drawEdgeLabel(edge, compact) {
        const points = edge.from;
        if (!edge.label || !points || points.length < 2) return;

        const midpoint = points[Math.floor((points.length - 1) / 2)];
        const next = points[Math.floor((points.length - 1) / 2) + 1];
        const x = (midpoint.x + next.x) / 2;
        const y = (midpoint.y + next.y) / 2 - 8;
        context.save();
        context.font = `${compact ? 11 : 12}px "Azeret Mono", ui-monospace, monospace`;
        const metrics = context.measureText(edge.label);
        context.fillStyle = palette.surface;
        context.fillRect(x - metrics.width / 2 - 5, y - 10, metrics.width + 10, 17);
        context.fillStyle = palette.muted;
        context.textAlign = "center";
        context.fillText(edge.label, x, y + 2);
        context.restore();
      }

      function drawNodeSurface(node, compact) {
        const { x, y, w, h } = node.box;
        const solid = ["card", "log", "held", "app", "accent"].includes(node.kind) || node.lines;
        context.save();
        context.fillStyle = palette.surface;
        context.strokeStyle = node.kind === "held" ? palette.warning
          : node.kind === "log" || node.kind === "accent" ? palette.accent
          : node.kind === "boundary" ? palette.lineSoft : palette.muted;
        context.globalAlpha *= node.kind === "boundary" ? 0.5 : 0.94;
        context.lineWidth = 1;
        context.setLineDash(
          node.kind === "boundary" || node.kind === "replica" ? [3, 5] : []
        );
        context.beginPath();
        context.rect(x, y, w, h);
        context.fill();
        context.stroke();
        context.setLineDash([]);
        context.restore();
      }

      function drawNodeLabel(node, compact) {
        const { x, y, w, h } = node.box;
        const { lines, size, lineHeight, padding } = node.heading;
        context.save();
        context.beginPath();
        context.rect(x, y, w, h);
        context.clip();
        context.textAlign = "left";
        context.textBaseline = "top";
        context.fillStyle = palette.ink;
        context.globalAlpha *= 0.95;
        context.font = `${size}px "Atkinson Hyperlegible", sans-serif`;
        lines.forEach((line, index) => {
          context.fillText(line, x + padding, y + padding + index * lineHeight);
        });
        context.restore();
      }

      function drawCardLines(node) {
        if (!node.lines) return;
        const { x, y, w, h } = node.box;
        const { size, lineHeight } = node.mono;
        const padding = node.heading.padding;
        context.save();
        context.beginPath();
        context.rect(x, y, w, h);
        context.clip();
        context.textBaseline = "top";
        context.font = `${size}px "Azeret Mono", ui-monospace, monospace`;
        node.lines.forEach((line, index) => {
          const lineX = x + padding + 8;
          const lineY = y + node.heading.height + 6 + index * lineHeight;
          const colour = line.tone === "add" ? palette.accent
            : line.tone === "held" ? palette.warning
            : line.tone === "remove" || line.tone === "faint" || line.tone === "blocked" ? palette.muted
            : palette.ink;
          context.fillStyle = colour;
          context.globalAlpha = diagramAlpha;
          if (line.tone === "blocked") context.fillText("×", x + padding - 2, lineY);
          if (line.tone === "add" || line.tone === "held") {
            context.fillRect(x + padding, lineY + 1, 2, size + 1);
          }
          context.fillText(line.text, lineX, lineY);
          if (line.tone === "remove") {
            const textWidth = context.measureText(line.text).width;
            context.fillRect(lineX, lineY + size * 0.55, textWidth, 1);
          }
        });
        context.restore();
      }

      function drawNote(note, compact) {
        context.save();
        context.fillStyle = palette.muted;

        context.font = `${compact ? 14 : 17}px "Atkinson Hyperlegible", sans-serif`;
        context.textAlign = "center";
        note.text.split("\n").forEach((line, index) =>
          context.fillText(line, note.x, note.y + index * (compact ? 18 : 22)));
        context.restore();
      }

      function particleFill(particle) {
        if (particle.role === "packet" || particle.role === "metadata") {
          return palette.accent;
        }
        if (activeScene === "intro") {
          return particle.index % 17 === 0
            ? palette.accent
            : palette.particleIntro;
        }
        return palette.particle;
      }

      function drawParticle(particle, compact) {
        const baseSize = compact ? 1.8 : 2.25;
        const depthBlend = !refined ? 0 : activeScene === 'intro' ? 1 : 1 - Math.min(1, Math.max(0, (simulationTime - particle.releaseAt) / 750));
        const depthScale = 1 + (particle.depth - .5) * .42 * depthBlend;
        const size = (particle.role === "packet" ? baseSize * 1.35 : baseSize * particle.scale) * depthScale;
        const x = refined ? particle.x - size / 2 : Math.round(particle.x - size / 2);
        const y = refined ? particle.y - size / 2 : Math.round(particle.y - size / 2);

        context.save();
        context.globalAlpha = particle.role === "packet" ? 0.82
          : particle.role === "ambient" ? 0.16 + particle.depth * 0.12
          : .62 + (particle.depth - .5) * .30 * depthBlend;
        if (particle.role === "replica") {
          context.strokeStyle = palette.replica;
          context.lineWidth = 0.8;
          context.strokeRect(x, y, Math.max(1.5, size), Math.max(1.5, size));
        } else {
          context.fillStyle = particleFill(particle);
          context.fillRect(x, y, Math.max(1.5, size), Math.max(1.5, size));
        }
        context.restore();
      }

      function draw(now) {
        context.clearRect(0, 0, width, height);
        const compact = width <= 820;

        if (activeScene !== "intro") {
          particles.forEach((particle) => {
            if (particle.role === "ambient") drawParticle(particle, compact);
          });
          context.save();
          context.globalAlpha = diagramAlpha;
          diagram.edges.forEach((edge) => drawEdge(edge, compact));
          diagram.nodes.forEach((node) => drawNodeSurface(node, compact));
          context.restore();
        }

        particles.forEach((particle) => {
          if (activeScene === "intro" || particle.role !== "ambient") drawParticle(particle, compact);
        });

        if (activeScene !== "intro") {
          context.save();
          context.globalAlpha = diagramAlpha;
          diagram.nodes.forEach((node) => drawNodeLabel(node, compact));
          diagram.nodes.forEach((node) => drawCardLines(node));
          diagram.edges.forEach((edge) => drawEdgeLabel(edge, compact));
          diagram.notes.forEach((note) => drawNote(note, compact));
          context.restore();
        }
      }

      function frame(now) {
        if (!isAnimating) return;

        const elapsed = Math.min(32, now - previousTime || 16.67);
        const step = elapsed / 16.67;
        previousTime = now;
        simulationTime += elapsed;
        flockBounds = activeScene === "intro" ? introBounds() : diagramBounds();

        if (activeScene === "intro") {
          rebuildGrid();
          particles.forEach((particle, index) => {
            if (refined) updateRefinedParticle(particle, simulationTime, step);
            else updateFreeParticle(particle, index, simulationTime, step);
          });
        } else {
          rebuildGrid();
          updateMovingTargets(simulationTime);
          particles.forEach((particle) => updateFormationParticle(particle, step));
          const age = simulationTime - sceneStartedAt;
          if (!refined || age > 180) diagramAlpha += (1 - diagramAlpha) * (refined ? .026 : .045) * step;
        }

        draw(now);
        animationFrame = requestAnimationFrame(frame);
      }

      function setScene(scene, index) {
        if (scene === activeScene && index === activeIndex) return;
        activeScene = scene;
        activeIndex = index;
        chapters.forEach((chapter, chapterIndex) => {
          chapter.classList.toggle("is-active", chapterIndex === index);
        });
        document.querySelectorAll(".chapter-index a").forEach((link, linkIndex) => {
          if (linkIndex === index) link.setAttribute("aria-current", "step");
          else link.removeAttribute("aria-current");
        });
        buildScene(scene, true);
      }

      function updateScrollState() {
        scrollFrame = 0;
        const viewportFocus = innerHeight * 0.48;
        let nearestIndex = 0;
        let nearestDistance = Infinity;

        chapters.forEach((chapter, index) => {
          const box = chapter.getBoundingClientRect();
          const chapterCenter = box.top + box.height * 0.5;
          const distance = Math.abs(chapterCenter - viewportFocus);
          if (distance < nearestDistance) {
            nearestDistance = distance;
            nearestIndex = index;
          }
        });

        const maximumScroll = document.documentElement.scrollHeight - innerHeight;
        const progress = maximumScroll > 0 ? scrollY / maximumScroll : 0;
        document.documentElement.style.setProperty(
          "--scroll-progress",
          String(Math.max(0, Math.min(1, progress)))
        );

        const chapter = chapters[nearestIndex];
        setScene(chapter.dataset.scene, nearestIndex);

        if (reduceMotion || previewPaused) {
          particles.forEach(p => { p.x = p.tx; p.y = p.ty; });
          diagramAlpha = 1;
          draw(0);
        }
      }

      function scheduleScrollUpdate() {
        if (scrollFrame) return;
        scrollFrame = requestAnimationFrame(updateScrollState);
      }

      function startAnimation() {
        if (reduceMotion || previewPaused || isAnimating || document.hidden) return;
        isAnimating = true;
        previousTime = performance.now();
        animationFrame = requestAnimationFrame(frame);
      }

      function stopAnimation() {
        isAnimating = false;
        cancelAnimationFrame(animationFrame);
      }

      function updatePointer(event) {
        pointer.x = event.clientX;
        pointer.y = event.clientY;
        pointer.active = true;
      }

      for (let index = 0; index < particleCount; index++) {
        particles.push(new Particle(index));
      }

      // Preview controls and acceptance tests share this narrow bridge.
      window.murmurationPreview = {
        particles,
        get scene() { return activeScene; },
        get refined() { return refined; },
        get time() { return simulationTime; },
        setRefined(value) {
          if (refined === value) return;
          refined = value;
          particles.forEach(p => { p.releaseAt = simulationTime; });
          draw(simulationTime);
        },
        pause(value) {
          previewPaused = value;
          if (value) stopAnimation();
          else startAnimation();
        }
      };

      // Font loading can change measured line breaks after the first paint.
      document.fonts.ready.then(() => buildScene(activeScene));
      syncPalette();
      resize();
      updateScrollState();
      startAnimation();

      addEventListener("resize", () => {
        resize();
        scheduleScrollUpdate();
      });
      addEventListener("scroll", scheduleScrollUpdate, { passive: true });
      addEventListener("pointermove", updatePointer, { passive: true });
      addEventListener("blur", () => {
        pointer.active = false;
      });
      document.documentElement.addEventListener("pointerleave", () => {
        pointer.active = false;
      });
      document.addEventListener("visibilitychange", () => {
        if (document.hidden) stopAnimation();
        else startAnimation();
      });
      addEventListener("mdbase:themechange", () => {
        syncPalette();
        buildScene(activeScene);
        if (reduceMotion || previewPaused) draw(0);
      });
      motionPreference.addEventListener('change', event => {
        reduceMotion = event.matches;
        if (reduceMotion) { stopAnimation(); buildScene(activeScene); }
        else startAnimation();
      });
      addEventListener("pagehide", stopAnimation);
    })();
