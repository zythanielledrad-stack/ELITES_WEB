async function loadAssets() {

  try {

    const response = await fetch(`version.json?t=${Date.now()}`);

    if (!response.ok) {
      throw new Error("version.json not found");
    }

    const data = await response.json();

    const version = data.version;

    // LOAD CSS
    const css = document.createElement("link");

    css.rel = "stylesheet";

    // CORRECT PATH
    css.href = `assets/css/templatemo-grad-school.css?v=${version}`;

    document.head.appendChild(css);

    // LOAD JS
    const script = document.createElement("script");

    script.type = "module";

    // CORRECT PATH
    script.src = `js/app.js?v=${version}`;

    document.body.appendChild(script);

  } catch (error) {

    console.error("Asset loader failed:", error);

  }

}

loadAssets();