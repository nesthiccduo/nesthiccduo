/* NESTHICCDUO TRAFFIC TRACKER
   Add this file to the website and include:
   <script src="tracker.js" defer></script>
*/
(() => {
  const API = "https://stats.nesthiccduo.link";
  const REF_PARAM = "ref";
  const REF_KEY = "ntd_first_ref";
  const VISITOR_KEY = "ntd_visitor_id";
  const SENT_VISIT_KEY = "ntd_visit_sent";

  const makeId = () =>
    (crypto.randomUUID ? crypto.randomUUID() :
      "v-" + Date.now() + "-" + Math.random().toString(36).slice(2));

  let visitorId = localStorage.getItem(VISITOR_KEY);
  if (!visitorId) {
    visitorId = makeId();
    localStorage.setItem(VISITOR_KEY, visitorId);
  }

  const params = new URLSearchParams(location.search);
  const incomingRef = (params.get(REF_PARAM) || "").trim();

  // First-touch attribution: once a worker gets credit, later direct visits
  // do not overwrite it.
  let firstRef = localStorage.getItem(REF_KEY);
  if (!firstRef && /^[A-Za-z0-9_-]{3,40}$/.test(incomingRef)) {
    firstRef = incomingRef;
    localStorage.setItem(REF_KEY, firstRef);
  }

  const send = (payload, keepalive = true) => {
    fetch(API + "/event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        visitorId,
        ref: firstRef || null,
        ...payload
      }),
      keepalive,
      mode: "cors"
    }).catch(() => {});
  };

  // Count one unique visitor. Reloads are ignored for 24h.
  if (!sessionStorage.getItem(SENT_VISIT_KEY)) {
    sessionStorage.setItem(SENT_VISIT_KEY, "1");
    send({ type: "visit" });
  }

  // Any link marked data-track="fan" becomes a fan conversion.
  document.addEventListener("click", (e) => {
    const link = e.target.closest("a[data-track='fan']");
    if (!link) return;

    const destination = link.dataset.destination || "other";
    send({
      type: "fan",
      destination
    });
  });
})();
