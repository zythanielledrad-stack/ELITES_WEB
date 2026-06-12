// ==============================
// OFFLINE CACHE LITE (AUTO MODE)
// ==============================

(function () {

  const CACHE_POSTS = "posts_cache_v1";
  const CACHE_SUBS = "subs_cache_v1";

  // Save to cache
  function save(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
  }

  function load(key) {
    try {
      return JSON.parse(localStorage.getItem(key)) || [];
    } catch {
      return [];
    }
  }

  // Offline banner
  function banner() {
    let el = document.getElementById("offline-banner");

    if (!el) {
      el = document.createElement("div");
      el.id = "offline-banner";
      el.style.cssText = `
        position:fixed;
        top:0;
        left:0;
        width:100%;
        padding:8px;
        text-align:center;
        font-weight:600;
        z-index:999999;
        color:white;
      `;
      document.body.prepend(el);
    }

    function update() {
      if (navigator.onLine) {
        el.style.background = "transparent";
        el.textContent = "";
      } else {
        el.style.background = "transparent";
        el.textContent = "";
      }
    }

    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    update();
  }

  banner();

  // Try hooking into Firebase snapshots (if available globally)
  function hookFirebase() {
    if (!window.onSnapshot) return;

    console.log("🔥 Offline Cache: Firebase detected");

    // intercept Firestore data by patching render behavior indirectly
    const originalConsole = console.log;

    console.log = function (...args) {
      originalConsole.apply(console, args);

      // simple auto-cache detection (posts/subscribers arrays)
      args.forEach(arg => {
        if (Array.isArray(arg)) {
          if (arg.length && arg[0]?.title) {
            save(CACHE_POSTS, arg);
          }
          if (arg.length && arg[0]?.email) {
            save(CACHE_SUBS, arg);
          }
        }
      });
    };
  }

  hookFirebase();

  // Auto fallback render helper
  function tryRenderFallback() {
    const list = document.getElementById("list");
    const subs = document.getElementById("subscribersList");

    if (list) {
      const posts = load(CACHE_POSTS);
      if (posts.length) {
        list.innerHTML = posts.map(p => `
          <div class="card">
            ${p.image ? `<img src="${p.image}" style="width:100%;height:180px;object-fit:cover;border-radius:16px;">` : ""}
            <h4>${p.title}</h4>
            <p>${p.description}</p>
          </div>
        `).join('');
      }
    }

    if (subs) {
      const data = load(CACHE_SUBS);
      if (data.length) {
        subs.innerHTML = data.map(s => `
          <div class="card">
            <h4>${s.email}</h4>
            <p>Cached Subscriber</p>
          </div>
        `).join('');
      }
    }
  }

  // run fallback check
  setTimeout(tryRenderFallback, 2000);

})();