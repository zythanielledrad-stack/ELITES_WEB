if (!window.versionUpdaterLoaded) {

  window.versionUpdaterLoaded = true;

  let currentVersion = null;

  async function checkVersion() {

    try {

      const response = await fetch(`/version.json?t=${Date.now()}`);

      if (!response.ok) {
        throw new Error("version.json not found");
      }

      const data = await response.json();

      // FIRST LOAD
      if (currentVersion === null) {
        currentVersion = data.version;
        return;
      }

      // UPDATE DETECTED
      if (data.version !== currentVersion) {

        console.log("⚡ New update detected!");

        // PREVENT DUPLICATE MODAL
        if (document.getElementById("updateModal")) return;

        const modal = document.createElement("div");

        modal.id = "updateModal";

        modal.innerHTML = `
        
        <div id="updateOverlay">

          <div id="updateCard">

            <div id="updateIcon">
              ⬆
            </div>

            <h2 id="updateTitle">
              New Update Available
            </h2>

            <p id="updateText">
              The website has been updated with the latest improvements and features.
              Your page will refresh automatically to load the newest version.
            </p>

            <div id="updateLoader">
              <div id="updateProgress"></div>
            </div>

            <button id="refreshNowBtn">
              Refresh Now
            </button>

          </div>

        </div>

        <style>

          #updateOverlay{
            position:fixed;
            inset:0;
            background:rgba(15,23,42,0.75);
            backdrop-filter:blur(8px);
            display:flex;
            align-items:center;
            justify-content:center;
            z-index:999999;
            animation:fadeIn 0.3s ease;
            padding:20px;
          }

          #updateCard{
            width:100%;
            max-width:420px;
            background:#ffffff;
            border-radius:28px;
            padding:35px 30px;
            text-align:center;
            font-family:Inter,sans-serif;
            box-shadow:
              0 20px 60px rgba(0,0,0,0.25),
              0 5px 20px rgba(0,0,0,0.1);
            animation:popup 0.35s ease;
            position:relative;
            overflow:hidden;
          }

          #updateCard::before{
            content:'';
            position:absolute;
            top:0;
            left:0;
            width:100%;
            height:6px;
            background:linear-gradient(
              90deg,
              #2563eb,
              #7c3aed,
              #06b6d4
            );
          }

          #updateIcon{
            width:85px;
            height:85px;
            margin:0 auto 20px;
            border-radius:50%;
            background:linear-gradient(
              135deg,
              #2563eb,
              #7c3aed
            );
            display:flex;
            align-items:center;
            justify-content:center;
            color:white;
            font-size:38px;
            box-shadow:0 10px 25px rgba(37,99,235,0.35);
          }

          #updateTitle{
            margin:0;
            font-size:28px;
            font-weight:700;
            color:#0f172a;
            letter-spacing:-0.5px;
          }

          #updateText{
            margin-top:14px;
            color:#64748b;
            line-height:1.7;
            font-size:15px;
          }

          #updateLoader{
            width:100%;
            height:8px;
            background:#e2e8f0;
            border-radius:999px;
            margin-top:28px;
            overflow:hidden;
          }

          #updateProgress{
            width:100%;
            height:100%;
            background:linear-gradient(
              90deg,
              #2563eb,
              #7c3aed
            );
            border-radius:999px;
            animation:loading 25s linear forwards;
          }

          #refreshNowBtn{
            margin-top:28px;
            width:100%;
            border:none;
            outline:none;
            padding:15px;
            border-radius:16px;
            background:linear-gradient(
              135deg,
              #2563eb,
              #7c3aed
            );
            color:white;
            font-size:15px;
            font-weight:600;
            cursor:pointer;
            transition:all 0.25s ease;
            box-shadow:0 10px 20px rgba(37,99,235,0.25);
          }

          #refreshNowBtn:hover{
            transform:translateY(-2px);
            box-shadow:0 14px 25px rgba(37,99,235,0.35);
          }

          #refreshNowBtn:active{
            transform:scale(0.98);
          }

          @keyframes popup{
            from{
              opacity:0;
              transform:translateY(20px) scale(0.95);
            }
            to{
              opacity:1;
              transform:translateY(0) scale(1);
            }
          }

          @keyframes fadeIn{
            from{
              opacity:0;
            }
            to{
              opacity:1;
            }
          }

          @keyframes loading{
            from{
              width:100%;
            }
            to{
              width:0%;
            }
          }

        </style>
        `;

        document.body.appendChild(modal);

        // REFRESH BUTTON
        document
          .getElementById("refreshNowBtn")
          .addEventListener("click", () => {
            location.reload();
          });

        // AUTO REFRESH
        setTimeout(() => {
          location.reload();
        }, 25000);

      }

    } catch (error) {

      console.error("Version check failed:", error);

    }

  }

  // INITIAL CHECK
  checkVersion();

  // CHECK EVERY 5 SECONDS
  setInterval(checkVersion, 2000);

}