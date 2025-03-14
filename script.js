/// ================DATA================ \\\

/** @typedef {string} uuid UUID v4*/
/** @typedef {number} unix Unix timestamp*/

/**
 * @typedef {Object} Item
 * @property {uuid} id
 * @property {unix} created
 * @property {[number, number, number]} ona mije, tonsi, meli
 */
const newItem = (...ona) => {
  return { id: crypto.randomUUID(), created: Date.now(), ona };
};

const Db = class {
  static prefix = "tonsi-item";

  /** @returns {Item[]} */
  getAll() {
    return Object.keys(localStorage)
      .filter((key) => key.startsWith(Db.prefix))
      .map((key) => localStorage.getItem(key))
      .map((item) => JSON.parse(item));
  }

  /** @param {uuid} id */
  getItem(id) {
    return JSON.parse(localStorage.getItem(`${Db.prefix}-${id}`));
  }

  /** @param {Item} item */
  setItem(item) {
    return localStorage.setItem(
      `${Db.prefix}-${item.id}`,
      JSON.stringify(item)
    );
  }

  /** @param {uuid} id */
  delete(id) {
    localStorage.removeItem(`${Db.prefix}-${id}`);
  }
};
const db = new Db();

/// ================LOG DIALOG================ \\\

/** @type {HTMLTemplateElement} */
const dialogTemplate = document.getElementById("log-dialog");

{
  /// ===INIT DIALOG===\\\
  /** @type {HTMLTemplateElement} */
  const liTemplate = document.getElementById("range");
  /** @type {HTMLUListElement} */
  const list = dialogTemplate.content.querySelector("#ona-list");
  const onas = ["mije", "tonsi", "meli"].map((ona) => {
    /** @type {DocumentFragment} */
    const li = liTemplate.content.cloneNode(true);

    /** @type {HTMLInputElement} */
    const input = li.querySelector("input");
    /** @type {HTMLLabelElement} */
    const label = li.querySelector("label");

    input.id = `${ona}-input`;
    input.name = ona;
    label.for = input.id;
    label.textContent = ona;

    return li;
  });
  list.append(...onas);
}

const logBtn = document.getElementById("log");
logBtn.addEventListener("click", () => {
  // Create new tonsi log
  /** @type {DocumentFragment} */
  const fragment = dialogTemplate.content.cloneNode(true);
  /** @type {HTMLDialogElement} */
  const dialog = fragment.querySelector("dialog");

  console.log(dialog);

  const form = fragment.querySelector("form");
  form.addEventListener(
    "submit",
    /** @param {SubmitEvent} e */ (e) => {
      e.preventDefault();

      const data = new FormData(e.target);
      const mije = Number(data.get("mije"));
      const tonsi = Number(data.get("tonsi"));
      const meli = Number(data.get("meli"));
      console.log({ meji: mije, tonsi, meli });

      db.setItem(newItem(mije, tonsi, meli));

      dialog.close();
    }
  );

  document.body.appendChild(fragment);

  dialog.showModal();
});

/// ================DISPLAY DATA================ \\\
const items = db.getAll();
console.log(items);

const sum = (acc, n) => Math.abs(acc) + Math.abs(n);
const chart = (canvas, onas) =>
  new Chart(canvas, {
    type: "doughnut",
    data: {
      labels: ["mije", "tonsi", "meli"],
      datasets: [
        {
          label: "totals (%)",
          data: onas
            // turn [mije, tonsi, meli][] into [mije[], tonsi[], meli[]]
            .reduce(
              (acc, o) => acc.map((ona, i) => ona.concat(o[i])),
              [[], [], []]
            )
            // turn [mije[], tonsi[], meli[]] into [totalMije, totalTonsi, totalMeli]
            .map((a) => a.reduce(sum))
            // Make them all relative
            .map((s, _, arr) => {
              const total = Math.abs(arr.reduce(sum));
              if (total === 0) return (1 / arr.length) * 100;
              else return (s / total) * 100;
            }),
        },
      ],
    },
  });

chart(
  document.getElementById("canvas-totals"),
  items.map((item) => item.ona)
);
{
  const byDaySection = document.getElementById("by-day");
  // By day
  /** @type {Object} */
  const groupedByDate = Object.groupBy(
    items,
    /** @param {Item} item */ (item) => {
      const created = new Date(item.created);
      const date = created.getDate();
      return date;
    }
  );
  Object.keys(groupedByDate).forEach((date) => {
    /** @type {Item[]} */
    const itemsOnDate = groupedByDate[date];
    console.log({ date, itemsOnDate });
    const art = document.createElement("article");
    art.innerHTML = `<h3>${date}</h3>`;
    const ctxWrapper = document.createElement("div");
    const ctx = document.createElement("canvas");
    ctx.ariaLabel = date;
    ctxWrapper.appendChild(ctx);
    art.appendChild(ctxWrapper);
    byDaySection.appendChild(art);
    chart(
      ctx,
      itemsOnDate.map((o) => o.ona)
    );
  });
}
