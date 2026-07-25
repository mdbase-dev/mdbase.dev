// @ts-nocheck
(() => {
      const canvas = document.querySelector("#diagram");
      const context = canvas.getContext("2d", { alpha: true });
      const chapters = [...document.querySelectorAll(".chapter")];
      const sceneCount = document.querySelector("#scene-count");
      const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
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
      let scrollFrame = 0;
      const palette = {
        paper: "rgb(252 252 251)",
        ink: "rgb(25 27 31)",
        muted: "rgb(111 116 124)",
        line: "rgb(204 208 213)",
        lineSoft: "rgb(226 229 232)",
        accent: "rgb(42 104 143)"
      };

      function syncPalette() {
        const styles = getComputedStyle(document.documentElement);
        palette.paper = styles.getPropertyValue("--color-surface").trim() || palette.paper;
        palette.ink = styles.getPropertyValue("--color-text").trim() || palette.ink;
        palette.muted = styles.getPropertyValue("--color-text-muted").trim() || palette.muted;
        palette.line = styles.getPropertyValue("--color-border-strong").trim() || palette.line;
        palette.lineSoft = styles.getPropertyValue("--color-border").trim() || palette.lineSoft;
        palette.accent = styles.getPropertyValue("--color-accent").trim() || palette.accent;
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
          this.role = "record";
          this.path = null;
        }
      }

      function diagramBounds() {
        if (width <= 820) {
          return {
            x: width * 0.07,
            y: Math.max(76, height * 0.10),
            w: width * 0.86,
            h: Math.min(height * 0.37, 330)
          };
        }

        return {
          x: width * 0.52,
          y: height * 0.17,
          w: width * 0.43,
          h: height * 0.68
        };
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
        const node = { id, label, detail, box, kind };
        diagram.nodes.push(node);
        return node;
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
        const labelSpace = width <= 820 ? 24 : 31;
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
          particle.path = null;
        }
      }

      function pathParticles(start, count, points, role = "packet") {
        for (let localIndex = 0; localIndex < count; localIndex++) {
          const particle = particles[start + localIndex];
          particle.role = role;
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
          particle.path = null;

          if (reduceMotion) {
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

      function layoutAuthority(bounds) {
        const mainCopy = addNode(
          "main-copy",
          "Main copy",
          "source of truth",
          rect(bounds, 0.04, 0.14, 0.58, 0.72),
          "authority"
        );
        const workingCopy = addNode(
          "working-copy",
          "Working copy",
          "follows the main copy",
          rect(bounds, 0.73, 0.31, 0.26, 0.38),
          "replica"
        );
        const syncPath = [
          pointOnNode(mainCopy, "right"),
          pointOnNode(workingCopy, "left")
        ];

        addEdge(syncPath, null, "stays in step", true);
        gridParticles(0, 301, mainCopy);
        gridParticles(301, 60, workingCopy, "replica");
      }

      function layoutModes(bounds) {
        const local = addNode(
          "mode-local",
          "On your computer",
          "your Markdown folder",
          rect(bounds, 0.01, 0.18, 0.43, 0.66),
          "authority"
        );
        const hosted = addNode(
          "mode-hosted",
          "Hosted by mdbase",
          "available online",
          rect(bounds, 0.56, 0.18, 0.43, 0.66),
          "authority"
        );
        addNote("or", bounds.x + bounds.w * 0.50, bounds.y + bounds.h * 0.51);
        gridParticles(0, 181, local);
        gridParticles(181, 180, hosted);
      }

      function layoutIdentity(bounds) {
        const collection = addNode(
          "identity-collection",
          "Your collection",
          "the same data for every app",
          rect(bounds, 0.01, 0.13, 0.46, 0.72),
          "authority"
        );
        const connect = addNode(
          "identity-connect",
          "Connect",
          "permission gate",
          rect(bounds, 0.52, 0.33, 0.18, 0.34),
          "service"
        );
        const planner = addNode(
          "identity-planner",
          "Project planner",
          "one experience",
          rect(bounds, 0.78, 0.05, 0.21, 0.18),
          "app"
        );
        const notes = addNode(
          "identity-notes",
          "Notes app",
          "another experience",
          rect(bounds, 0.78, 0.41, 0.21, 0.18),
          "app"
        );
        const assistant = addNode(
          "identity-assistant",
          "AI assistant",
          "another experience",
          rect(bounds, 0.78, 0.77, 0.21, 0.18),
          "app"
        );
        const plannerPath = [
          pointOnNode(planner, "left"),
          pointOnNode(connect, "right", 0.22)
        ];
        const notesPath = [
          pointOnNode(notes, "left"),
          pointOnNode(connect, "right", 0.50)
        ];
        const assistantPath = [
          pointOnNode(assistant, "left"),
          pointOnNode(connect, "right", 0.78)
        ];

        addEdge(plannerPath, null, "connect", true);
        addEdge(notesPath, null, "", true);
        addEdge(assistantPath, null, "", true);
        gridParticles(0, 301, collection);
        pathParticles(301, 20, plannerPath);
        pathParticles(321, 20, notesPath);
        pathParticles(341, 20, assistantPath);
      }

      function layoutRequest(bounds) {
        const collection = addNode(
          "request-collection",
          "Your collection",
          "still private",
          rect(bounds, 0.01, 0.13, 0.48, 0.72),
          "authority"
        );
        const request = addNode(
          "request-gate",
          "Permission request",
          "waiting for you",
          rect(bounds, 0.57, 0.38, 0.18, 0.22),
          "service"
        );
        const app = addNode(
          "request-app",
          "The app",
          "asks first",
          rect(bounds, 0.81, 0.32, 0.18, 0.34),
          "app"
        );
        const requestPath = [
          pointOnNode(app, "left"),
          pointOnNode(request, "right")
        ];

        addEdge(requestPath, null, "asks to connect", true);
        gridParticles(0, 321, collection);
        pathParticles(321, 40, requestPath);
      }

      function layoutActions(bounds) {
        const collection = addNode(
          "actions-collection",
          "Your collection",
          "still private",
          rect(bounds, 0.01, 0.13, 0.43, 0.72),
          "authority"
        );
        const read = addNode(
          "action-read",
          "Read records",
          "see their contents",
          rect(bounds, 0.53, 0.09, 0.27, 0.20),
          "service"
        );
        const search = addNode(
          "action-search",
          "Search records",
          "find matches",
          rect(bounds, 0.53, 0.40, 0.27, 0.20),
          "service"
        );
        const change = addNode(
          "action-change",
          "Change records",
          "only if needed",
          rect(bounds, 0.53, 0.71, 0.27, 0.20),
          "service"
        );
        const app = addNode(
          "actions-app",
          "The app",
          "names each action",
          rect(bounds, 0.85, 0.29, 0.14, 0.42),
          "app"
        );
        const readPath = [
          pointOnNode(app, "left", 0.22),
          pointOnNode(read, "right")
        ];
        const searchPath = [
          pointOnNode(app, "left", 0.50),
          pointOnNode(search, "right")
        ];
        const changePath = [
          pointOnNode(app, "left", 0.78),
          pointOnNode(change, "right")
        ];

        addEdge(readPath, null, "", true);
        addEdge(searchPath, null, "", true);
        addEdge(changePath, null, "", true);
        addNote("the request", bounds.x + bounds.w * 0.665, bounds.y + bounds.h * 0.02);
        gridParticles(0, 301, collection);
        pathParticles(301, 20, readPath);
        pathParticles(321, 20, searchPath);
        pathParticles(341, 20, changePath);
      }

      function layoutGrant(bounds) {
        const collection = addNode(
          "grant-collection",
          "Chosen collection",
          "source of truth",
          rect(bounds, 0.01, 0.13, 0.48, 0.72),
          "authority"
        );
        const grant = addNode(
          "grant",
          "Your permission",
          "one app · one collection",
          rect(bounds, 0.57, 0.35, 0.19, 0.28),
          "service"
        );
        const app = addNode(
          "grant-app",
          "The app",
          "approved access",
          rect(bounds, 0.82, 0.31, 0.17, 0.36),
          "app"
        );
        const askPath = [pointOnNode(app, "left", 0.38), pointOnNode(grant, "right", 0.38)];
        const accessPath = [
          pointOnNode(grant, "left", 0.66),
          pointOnNode(collection, "right", 0.54)
        ];

        addEdge(askPath, null, "asks", true);
        addEdge(accessPath, null, "allowed actions", false);
        gridParticles(0, 321, collection);
        pathParticles(321, 20, askPath);
        pathParticles(341, 20, accessPath);
      }

      function layoutAccess(bounds) {
        const localBoundary = addNode(
          "access-local",
          "Local collection",
          "on your computer",
          rect(bounds, 0.01, 0.08, 0.36, 0.84),
          "boundary"
        );
        const connector = addNode(
          "access-connector",
          "mdbase connector",
          "checks each request",
          rect(bounds, 0.05, 0.19, 0.28, 0.18),
          "service"
        );
        const localFiles = addNode(
          "access-files",
          "Markdown folder",
          "main copy",
          rect(bounds, 0.05, 0.56, 0.28, 0.23),
          "authority"
        );
        const app = addNode(
          "access-app",
          "Approved app",
          "allowed actions only",
          rect(bounds, 0.43, 0.35, 0.14, 0.30),
          "app"
        );
        const hostedBoundary = addNode(
          "access-hosted",
          "Hosted collection",
          "available online",
          rect(bounds, 0.63, 0.08, 0.36, 0.84),
          "boundary"
        );
        const hosting = addNode(
          "access-hosting",
          "mdbase hosting",
          "main copy",
          rect(bounds, 0.67, 0.20, 0.28, 0.25),
          "authority"
        );
        const mirror = addNode(
          "access-mirror",
          "Markdown copy",
          "optional local mirror",
          rect(bounds, 0.67, 0.62, 0.28, 0.18),
          "replica"
        );

        const localPath = [
          pointOnNode(app, "left", 0.38),
          pointOnNode(connector, "right"),
          pointOnNode(connector, "bottom"),
          pointOnNode(localFiles, "top")
        ];
        const hostedPath = [
          pointOnNode(app, "right", 0.38),
          pointOnNode(hosting, "left")
        ];
        const mirrorPath = [
          pointOnNode(hosting, "bottom"),
          pointOnNode(mirror, "top")
        ];

        addEdge(localPath, null, "checked locally", false);
        addEdge(hostedPath, null, "checked online", false);
        addEdge(mirrorPath, null, "optional sync", true);
        gridParticles(0, 151, localFiles);
        gridParticles(151, 150, hosting);
        gridParticles(301, 30, mirror, "replica");
        pathParticles(331, 10, localPath);
        pathParticles(341, 10, hostedPath);
        pathParticles(351, 10, mirrorPath);
      }

      function layoutLocal(bounds) {
        const computer = addNode(
          "computer",
          "your computer",
          "where your files live",
          rect(bounds, 0.01, 0.06, 0.62, 0.88),
          "boundary"
        );
        const connector = addNode(
          "connector",
          "mdbase connector",
          "checks your permission",
          rect(bounds, 0.08, 0.13, 0.48, 0.14),
          "service"
        );
        const collection = addNode(
          "local-collection",
          "Your Markdown files",
          "source of truth",
          rect(bounds, 0.08, 0.34, 0.48, 0.49),
          "authority"
        );
        const app = addNode(
          "local-app",
          "Approved app",
          "direct or encrypted",
          rect(bounds, 0.76, 0.34, 0.23, 0.28),
          "app"
        );
        const accessPath = [
          pointOnNode(app, "left"),
          pointOnNode(connector, "right", 0.50),
          pointOnNode(collection, "top", 0.70)
        ];

        addEdge(accessPath, null, "permission checked here", false);
        gridParticles(0, 321, collection);
        pathParticles(321, 40, accessPath);
      }

      function layoutHosted(bounds) {
        const provider = addNode(
          "provider",
          "mdbase hosting",
          "source of truth",
          rect(bounds, 0.02, 0.11, 0.49, 0.72),
          "authority"
        );
        const app = addNode(
          "hosted-app",
          "Approved app",
          "allowed actions",
          rect(bounds, 0.70, 0.04, 0.27, 0.18),
          "app"
        );
        const cache = addNode(
          "cache",
          "Offline copy",
          "for this app",
          rect(bounds, 0.67, 0.38, 0.30, 0.20),
          "replica"
        );
        const mirror = addNode(
          "mirror",
          "Markdown copy",
          "optional on your computer",
          rect(bounds, 0.64, 0.72, 0.33, 0.20),
          "replica"
        );

        const appPath = [pointOnNode(app, "left"), pointOnNode(provider, "right", 0.24)];
        const cachePath = [pointOnNode(provider, "right", 0.50), pointOnNode(cache, "left")];
        const mirrorPath = [pointOnNode(provider, "right", 0.76), pointOnNode(mirror, "left")];

        addEdge(appPath, null, "approved access", false);
        addEdge(cachePath, null, "sync", true);
        addEdge(mirrorPath, null, "sync", true);
        gridParticles(0, 211, provider);
        gridParticles(211, 55, cache, "replica");
        gridParticles(266, 55, mirror, "replica");
        pathParticles(321, 14, appPath);
        pathParticles(335, 13, cachePath);
        pathParticles(348, 13, mirrorPath);
      }

      function buildScene(name) {
        const bounds = diagramBounds();
        diagram = { nodes: [], edges: [], notes: [] };
        diagramAlpha = 0;

        if (name === "intro") layoutIntro(bounds);
        else if (name === "collection") layoutCollection(bounds);
        else if (name === "structure") layoutStructure(bounds);
        else if (name === "authority") layoutAuthority(bounds);
        else if (name === "modes") layoutModes(bounds);
        else if (name === "identity") layoutIdentity(bounds);
        else if (name === "request") layoutRequest(bounds);
        else if (name === "actions") layoutActions(bounds);
        else if (name === "grant") layoutGrant(bounds);
        else if (name === "access") layoutAccess(bounds);
        else if (name === "local") layoutLocal(bounds);
        else layoutHosted(bounds);

        if (reduceMotion) {
          updateMovingTargets(0);
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

        particles.forEach((particle) => {
          particle.x = particle.x / previousWidth * width;
          particle.y = particle.y / previousHeight * height;
        });
        buildScene(activeScene);
      }

      function rebuildGrid() {
        for (let index = 0; index < grid.length; index++) {
          if (grid[index]) grid[index].length = 0;
        }

        particles.forEach((particle, index) => {
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
        const maximum = 2.5 + index % 5 * 0.08;
        if (speed > maximum) {
          particle.vx = particle.vx / speed * maximum;
          particle.vy = particle.vy / speed * maximum;
        }
        particle.x += particle.vx * step;
        particle.y += particle.vy * step;
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
        const dx = particle.tx - particle.x;
        const dy = particle.ty - particle.y;
        const strength = particle.role === "packet" ? 0.020 : 0.013;
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
        context.strokeStyle = "rgb(113 120 129 / 0.48)";
        context.lineWidth = 1;
        context.setLineDash(edge.dashed ? [4, 5] : []);
        context.beginPath();
        context.moveTo(points[0].x, points[0].y);
        points.slice(1).forEach((point) => context.lineTo(point.x, point.y));
        context.stroke();
        context.setLineDash([]);

        const finalPoint = points[points.length - 1];
        const previousPoint = points[points.length - 2];
        const angle = Math.atan2(finalPoint.y - previousPoint.y, finalPoint.x - previousPoint.x);
        context.fillStyle = "rgb(113 120 129 / 0.62)";
        context.beginPath();
        context.moveTo(finalPoint.x, finalPoint.y);
        context.lineTo(
          finalPoint.x - Math.cos(angle - 0.48) * 6,
          finalPoint.y - Math.sin(angle - 0.48) * 6
        );
        context.lineTo(
          finalPoint.x - Math.cos(angle + 0.48) * 6,
          finalPoint.y - Math.sin(angle + 0.48) * 6
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
        context.font =
          `${compact ? 8 : 9}px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`;
        const metrics = context.measureText(edge.label);
        context.fillStyle = "rgb(252 252 251 / 0.96)";
        context.fillRect(x - metrics.width / 2 - 4, y - 7, metrics.width + 8, 12);
        context.fillStyle = palette.muted;
        context.textAlign = "center";
        context.fillText(edge.label, x, y + 2);
        context.restore();
      }

      function drawNodeSurface(node, compact) {
        const { x, y, w, h } = node.box;
        context.save();

        if (node.kind === "boundary") {
          context.fillStyle = "rgb(252 252 251 / 0.42)";
          context.strokeStyle = "rgb(126 133 142 / 0.48)";
          context.setLineDash([5, 5]);
        } else {
          context.fillStyle =
            node.kind === "authority"
              ? "rgb(247 250 251 / 0.94)"
              : "rgb(252 252 251 / 0.90)";
          context.strokeStyle =
            node.kind === "authority"
              ? "rgb(42 104 143 / 0.62)"
              : "rgb(152 158 166 / 0.56)";
          context.setLineDash(node.kind === "replica" ? [4, 4] : []);
        }

        context.lineWidth = node.kind === "authority" ? 1.25 : 1;
        context.beginPath();
        context.roundRect(x, y, w, h, compact ? 3 : 5);
        context.fill();
        context.stroke();
        context.setLineDash([]);
        context.restore();
      }

      function drawNodeLabel(node, compact) {
        const { x, y, h } = node.box;
        context.save();
        const labelX = x + (compact ? 7 : 10);
        const labelY = y + (compact ? 12 : 15);
        context.textAlign = "left";
        context.fillStyle =
          node.kind === "authority" ? palette.accent : palette.ink;
        context.font =
          `600 ${compact ? 8.5 : 10}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
        context.fillText(node.label, labelX, labelY);

        if (node.detail && h > (compact ? 42 : 52)) {
          context.fillStyle = palette.muted;
          context.font =
            `${compact ? 7.5 : 8.5}px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`;
          context.fillText(node.detail, labelX, labelY + (compact ? 10 : 12));
        }
        context.restore();
      }

      function drawNote(note, compact) {
        context.save();
        context.fillStyle = palette.muted;
        context.font =
          `600 ${compact ? 9 : 10}px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`;
        context.textAlign = "center";
        context.fillText(note.text, note.x, note.y);
        context.restore();
      }

      function drawParticle(particle, compact) {
        const baseSize = compact ? 2.25 : 3.25;
        const size =
          particle.role === "packet"
            ? baseSize * 1.5
            : baseSize * particle.scale;
        const x = Math.round(particle.x - size / 2);
        const y = Math.round(particle.y - size / 2);

        if (particle.role === "replica") {
          context.strokeStyle = "rgb(81 87 95 / 0.62)";
          context.lineWidth = 0.8;
          context.strokeRect(x, y, Math.max(1.5, size), Math.max(1.5, size));
        } else {
          context.fillStyle =
            particle.role === "packet" || particle.role === "metadata"
              ? palette.accent
              : "rgb(25 27 31 / 0.88)";
          context.fillRect(x, y, Math.max(1.5, size), Math.max(1.5, size));
        }
      }

      function draw(now) {
        context.clearRect(0, 0, width, height);
        const compact = width <= 820;

        if (activeScene !== "intro") {
          context.save();
          context.globalAlpha = diagramAlpha;
          diagram.edges.forEach((edge) => drawEdge(edge, compact));
          diagram.nodes.forEach((node) => drawNodeSurface(node, compact));
          context.restore();
        }

        particles.forEach((particle) => drawParticle(particle, compact));

        if (activeScene !== "intro") {
          context.save();
          context.globalAlpha = diagramAlpha;
          diagram.edges.forEach((edge) => drawEdgeLabel(edge, compact));
          diagram.nodes.forEach((node) => drawNodeLabel(node, compact));
          diagram.notes.forEach((note) => drawNote(note, compact));
          context.restore();
        }
      }

      function frame(now) {
        if (!isAnimating) return;

        const elapsed = Math.min(32, now - previousTime || 16.67);
        const step = elapsed / 16.67;
        previousTime = now;

        if (activeScene === "intro") {
          rebuildGrid();
          particles.forEach((particle, index) => {
            updateFreeParticle(particle, index, now, step);
          });
        } else {
          updateMovingTargets(now);
          particles.forEach((particle) => updateFormationParticle(particle, step));
          diagramAlpha += (1 - diagramAlpha) * 0.045 * step;
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
        sceneCount.textContent =
          `${String(index + 1).padStart(2, "0")} / ${String(chapters.length).padStart(2, "0")}`;
        buildScene(scene);
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

        if (reduceMotion) draw(0);
      }

      function scheduleScrollUpdate() {
        if (scrollFrame) return;
        scrollFrame = requestAnimationFrame(updateScrollState);
      }

      function startAnimation() {
        if (reduceMotion || isAnimating) return;
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
        if (reduceMotion) draw(0);
      });
      addEventListener("pagehide", stopAnimation);
    })();
