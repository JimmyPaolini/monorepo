(function () {
  const MIN_RECONNECT_MS = 500;
  const MAX_RECONNECT_MS = 30000;
  const TOMBSTONE_AFTER_MS = 15000; // show the "paused" overlay after this long disconnected

  // Pure: next backoff delay (doubles, capped). Exported for unit tests.
  function nextReconnectDelay(current, max) {
    return Math.min(current * 2, max);
  }
  if (typeof module !== "undefined" && module.exports) {
    module.exports = {
      MAX_RECONNECT_MS,
      MIN_RECONNECT_MS,
      nextReconnectDelay,
      TOMBSTONE_AFTER_MS,
    };
  }

  // Everything below is browser-only; bail out when loaded in Node (tests).
  if (globalThis.window === undefined) return;

  let ws = null;
  let eventQueue = [];
  let reconnectDelay = MIN_RECONNECT_MS;
  let reconnectTimer = null;
  let disconnectedSince = null;
  let everConnected = false;
  let tombstoneShown = false;

  function sessionKey() {
    try {
      return (
        globalThis.sessionStorage &&
        globalThis.sessionStorage.getItem("brainstorm-session-key")
      );
    } catch {}
    return null;
  }

  function websocketUrl() {
    const key = sessionKey();
    return `ws://${globalThis.location.host}${key ? `/?key=${encodeURIComponent(key)}` : ""}`;
  }

  function reloadAfterRecovery() {
    const key = sessionKey();
    if (key) {
      globalThis.location.replace(`/?key=${encodeURIComponent(key)}`);
    } else {
      globalThis.location.reload();
    }
  }

  // Reflect connection state in the frame's status pill (absent on full-doc screens).
  function setStatus(state) {
    const el = document.querySelector(".status");
    if (!el) return;
    const map = {
      connected: ["Connected", "var(--success)"],
      connecting: ["Connecting…", "var(--text-tertiary)"],
      disconnected: ["Disconnected", "var(--error)"],
      reconnecting: ["Reconnecting…", "var(--warning)"],
    };
    const [text, color] = map[state] || map.disconnected;
    el.textContent = text;
    el.style.setProperty("--status-color", color);
  }

  // Self-styled so it works on framed and full-document screens alike.
  function showTombstone() {
    if (tombstoneShown) return;
    tombstoneShown = true;
    const el = document.createElement("div");
    el.id = "bs-tombstone";
    el.style.cssText =
      "position:fixed;inset:0;z-index:99999;display:flex;" +
      "align-items:center;justify-content:center;padding:2rem;text-align:center;" +
      "background:rgba(20,20,22,0.92);color:#f5f5f7;font-family:system-ui,sans-serif";
    el.innerHTML =
      '<div style="max-width:480px">' +
      '<h2 style="margin:0 0 .5rem;font-weight:600">Companion paused</h2>' +
      '<p style="margin:0;opacity:.85">This brainstorm companion has stopped. ' +
      "Ask your coding agent to bring it back — this page reconnects automatically.</p></div>";
    if (document.body) document.body.append(el);
  }

  function connect() {
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
    setStatus(everConnected ? "reconnecting" : "connecting");
    ws = new WebSocket(websocketUrl());

    ws.addEventListener("open", () => {
      const recovered = tombstoneShown;
      everConnected = true;
      disconnectedSince = null;
      reconnectDelay = MIN_RECONNECT_MS;
      tombstoneShown = false;
      setStatus("connected");
      eventQueue.forEach((e) => ws.send(JSON.stringify(e)));
      eventQueue = [];
      // Recovered from a tombstoned outage (e.g. the server restarted on the same
      // port) — reload through the keyed bootstrap when possible so the cookie is
      // refreshed before the visible URL returns to bare /.
      if (recovered) reloadAfterRecovery();
    });

    ws.onmessage = (msg) => {
      let data;
      try {
        data = JSON.parse(msg.data);
      } catch {
        return;
      }
      if (data.type === "reload") globalThis.location.reload();
    };

    ws.addEventListener("close", () => {
      ws = null;
      if (disconnectedSince === null) disconnectedSince = Date.now();
      if (Date.now() - disconnectedSince >= TOMBSTONE_AFTER_MS) {
        setStatus("disconnected");
        showTombstone();
      } else {
        setStatus("reconnecting");
      }
      reconnectTimer = setTimeout(connect, reconnectDelay);
      reconnectDelay = nextReconnectDelay(reconnectDelay, MAX_RECONNECT_MS);
    });

    // Let onclose own reconnection so we don't schedule it twice.
    ws.onerror = () => {
      try {
        ws.close();
      } catch {}
    };
  }

  function sendEvent(event) {
    event.timestamp = Date.now();
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(event));
    } else {
      eventQueue.push(event);
    }
  }

  // Capture clicks on choice elements
  document.addEventListener("click", (e) => {
    const target = e.target.closest("[data-choice]");
    if (!target) return;

    sendEvent({
      choice: target.dataset.choice,
      id: target.id || null,
      text: target.textContent.trim(),
      type: "click",
    });
  });

  // Frame UI: selection tracking
  globalThis.selectedChoice = null;

  globalThis.toggleSelect = function (el) {
    const container = el.closest(".options") || el.closest(".cards");
    const multi = container && container.dataset.multiselect !== undefined;
    if (container && !multi) {
      container
        .querySelectorAll(".option, .card")
        .forEach((o) => o.classList.remove("selected"));
    }
    if (multi) {
      el.classList.toggle("selected");
    } else {
      el.classList.add("selected");
    }
    globalThis.selectedChoice = el.dataset.choice;
  };

  // Expose API for explicit use
  globalThis.brainstorm = {
    choice: (value, metadata = {}) =>
      sendEvent({ type: "choice", value, ...metadata }),
    send: sendEvent,
  };

  connect();
})();
