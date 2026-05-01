
/*
  ConceptFlow AI — Clean DSA Animation Engine
  Separate module to avoid repeating code inside main script.js
*/
(() => {
  const $ = (id) => document.getElementById(id);

  const DSA = {
    algo: "binarySearch",
    running: false,
    paused: false,
    timers: [],
    defaultArray: [2, 5, 8, 12, 16, 23, 38, 56, 72],

    meta: {
      binarySearch: {
        title: "Binary Search",
        complexity: "Time: O(log n) • Space: O(1)",
        pseudo: [
          "left = 0, right = n - 1",
          "while left <= right:",
          "mid = floor((left + right) / 2)",
          "if arr[mid] == target: found",
          "if arr[mid] < target: left = mid + 1",
          "else: right = mid - 1"
        ]
      },
      bubbleSort: {
        title: "Bubble Sort",
        complexity: "Time: O(n²) • Space: O(1)",
        pseudo: [
          "for i from 0 to n - 1:",
          "for j from 0 to n - i - 2:",
          "compare arr[j] and arr[j+1]",
          "if arr[j] > arr[j+1]: swap",
          "largest element moves to end"
        ]
      },
      selectionSort: {
        title: "Selection Sort",
        complexity: "Time: O(n²) • Space: O(1)",
        pseudo: [
          "for i from 0 to n - 1:",
          "minIndex = i",
          "find smallest element in remaining array",
          "swap arr[i] with arr[minIndex]",
          "left part becomes sorted"
        ]
      },
      insertionSort: {
        title: "Insertion Sort",
        complexity: "Time: O(n²) • Space: O(1)",
        pseudo: [
          "for i from 1 to n - 1:",
          "key = arr[i]",
          "move larger elements one position ahead",
          "insert key at correct position"
        ]
      },
      stack: {
        title: "Stack Push / Pop",
        complexity: "Push: O(1) • Pop: O(1) • LIFO",
        pseudo: [
          "push(value): add value at top",
          "pop(): remove value from top",
          "peek(): read top element",
          "Stack follows LIFO"
        ]
      },
      queue: {
        title: "Queue Enqueue / Dequeue",
        complexity: "Enqueue: O(1) • Dequeue: O(1) • FIFO",
        pseudo: [
          "enqueue(value): add value at rear",
          "dequeue(): remove value from front",
          "peek(): read front element",
          "Queue follows FIFO"
        ]
      },
      linkedList: {
        title: "Linked List Traversal",
        complexity: "Traversal: O(n) • Insert head: O(1)",
        pseudo: [
          "current = head",
          "while current != null:",
          "visit current node",
          "current = current.next"
        ]
      }
    }
  };

  function parseArray() {
    const raw = $("dsaArrayInput")?.value || "";
    const arr = raw.split(",").map(v => Number(v.trim())).filter(v => Number.isFinite(v));
    return arr.length ? arr : [...DSA.defaultArray];
  }

  function targetValue() {
    const value = Number(($("dsaTargetInput")?.value || "").trim());
    return Number.isFinite(value) ? value : 0;
  }

  function speed() {
    const raw = Number($("dsaSpeedInput")?.value || 550);
    return Math.max(120, Math.min(raw, 1400));
  }

  function setStatus(text, type = "ready") {
    const badge = $("dsaStatusBadge");
    if (!badge) return;
    badge.textContent = text;
    badge.style.background = type === "done" ? "rgba(34,197,94,.14)" :
      type === "running" ? "rgba(59,130,246,.14)" :
      type === "error" ? "rgba(239,68,68,.14)" :
      "rgba(148,163,184,.12)";
  }

  function setStep(text) {
    const el = $("dsaStepText");
    if (el) el.textContent = text;
  }

  function renderPseudo(activeIndex = -1) {
    const meta = DSA.meta[DSA.algo];
    const pre = $("dsaPseudoCode");
    if (!pre || !meta) return;
    pre.innerHTML = meta.pseudo.map((line, i) =>
      `<span class="dsa-pseudo-line ${i === activeIndex ? "active" : ""}">${escapeHtml(line)}</span>`
    ).join("");
  }

  function updateHeader() {
    const meta = DSA.meta[DSA.algo];
    if (!meta) return;
    if ($("dsaAlgoTitle")) $("dsaAlgoTitle").textContent = meta.title;
    if ($("dsaAlgoMeta")) $("dsaAlgoMeta").textContent = meta.complexity;
    renderPseudo();
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (c) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    }[c]));
  }

  function heightFor(value, arr) {
    const max = Math.max(...arr, 1);
    return Math.max(42, Math.round((value / max) * 150));
  }

  function renderBars(arr, options = {}) {
    const {
      active = [],
      compare = [],
      found = -1,
      sorted = [],
      pointers = {}
    } = options;

    const stage = $("dsaVisualStage");
    if (!stage) return;

    stage.innerHTML = `
      <div>
        <div class="dsa-bars">
          ${arr.map((value, index) => {
            const cls = [
              "dsa-bar",
              active.includes(index) ? "active" : "",
              compare.includes(index) ? "compare" : "",
              found === index ? "found" : "",
              sorted.includes(index) ? "sorted" : ""
            ].join(" ");

            return `
              <div class="dsa-bar-wrap">
                <div class="${cls}" style="height:${heightFor(value, arr)}px">${value}</div>
                <div class="dsa-bar-label">i:${index}</div>
              </div>
            `;
          }).join("")}
        </div>
        <div class="dsa-pointer-row">
          ${Object.entries(pointers).map(([key, value]) => `<span class="dsa-pointer">${key}: ${value}</span>`).join("")}
        </div>
      </div>
    `;
  }

  function renderStructure(values, options = {}) {
    const { mode = "queue", active = -1, label = "" } = options;
    const stage = $("dsaVisualStage");
    if (!stage) return;

    if (mode === "stack") {
      stage.innerHTML = `
        <div>
          <p class="dsa-pointer">${label || "Top is the last inserted value"}</p>
          <div class="dsa-stack">
            ${values.map((value, index) => `<div class="dsa-node ${index === active ? "active" : ""}">${value}</div>`).join("")}
          </div>
        </div>
      `;
      return;
    }

    stage.innerHTML = `
      <div>
        <p class="dsa-pointer">${label}</p>
        <div class="dsa-structure">
          ${values.map((value, index) => `
            <div class="dsa-node ${index === active ? "active" : ""}">${value}</div>
            ${index < values.length - 1 ? '<span class="dsa-arrow">→</span>' : ''}
          `).join("")}
        </div>
      </div>
    `;
  }

  async function wait() {
    let elapsed = 0;
    const chunk = 60;

    while (elapsed < speed()) {
      if (!DSA.running) throw new Error("stopped");
      while (DSA.paused) {
        await new Promise(resolve => setTimeout(resolve, 120));
        if (!DSA.running) throw new Error("stopped");
      }
      await new Promise(resolve => setTimeout(resolve, chunk));
      elapsed += chunk;
    }
  }

  function stop() {
    DSA.running = false;
    DSA.paused = false;
  }

  async function binarySearch() {
    const arr = parseArray().sort((a, b) => a - b);
    const target = targetValue();

    $("dsaArrayInput").value = arr.join(",");
    let left = 0;
    let right = arr.length - 1;

    renderBars(arr, { pointers: { left, right, target } });
    setStep("Binary Search needs sorted data. Array has been sorted automatically.");
    renderPseudo(0);
    await wait();

    while (left <= right) {
      const mid = Math.floor((left + right) / 2);

      renderBars(arr, { active: [mid], pointers: { left, mid, right, target } });
      setStep(`Checking middle index ${mid}. Value = ${arr[mid]}.`);
      renderPseudo(2);
      await wait();

      if (arr[mid] === target) {
        renderBars(arr, { found: mid, pointers: { foundIndex: mid, target } });
        setStep(`Found ${target} at index ${mid}.`);
        renderPseudo(3);
        setStatus("Found", "done");
        return;
      }

      if (arr[mid] < target) {
        left = mid + 1;
        setStep(`${arr[mid]} is smaller than ${target}, so search right half.`);
        renderPseudo(4);
      } else {
        right = mid - 1;
        setStep(`${arr[mid]} is greater than ${target}, so search left half.`);
        renderPseudo(5);
      }

      renderBars(arr, { compare: [mid], pointers: { left, right, target } });
      await wait();
    }

    renderBars(arr, { pointers: { target } });
    setStep(`${target} was not found in the array.`);
    setStatus("Not Found", "error");
  }

  async function bubbleSort() {
    const arr = parseArray();
    const sorted = [];

    for (let i = 0; i < arr.length; i++) {
      for (let j = 0; j < arr.length - i - 1; j++) {
        renderBars(arr, { compare: [j, j + 1], sorted });
        setStep(`Compare ${arr[j]} and ${arr[j + 1]}.`);
        renderPseudo(2);
        await wait();

        if (arr[j] > arr[j + 1]) {
          [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
          renderBars(arr, { active: [j, j + 1], sorted });
          setStep("Swapped because left value was greater.");
          renderPseudo(3);
          await wait();
        }
      }
      sorted.push(arr.length - i - 1);
    }

    renderBars(arr, { sorted: arr.map((_, i) => i) });
    setStep("Bubble Sort completed. Largest values repeatedly moved to the end.");
    setStatus("Sorted", "done");
  }

  async function selectionSort() {
    const arr = parseArray();
    const sorted = [];

    for (let i = 0; i < arr.length; i++) {
      let minIndex = i;
      renderPseudo(1);

      for (let j = i + 1; j < arr.length; j++) {
        renderBars(arr, { active: [minIndex], compare: [j], sorted });
        setStep(`Current minimum is ${arr[minIndex]}. Compare with ${arr[j]}.`);
        renderPseudo(2);
        await wait();

        if (arr[j] < arr[minIndex]) {
          minIndex = j;
          setStep(`New minimum found: ${arr[minIndex]}.`);
          await wait();
        }
      }

      [arr[i], arr[minIndex]] = [arr[minIndex], arr[i]];
      sorted.push(i);
      renderBars(arr, { active: [i], sorted });
      setStep(`Placed ${arr[i]} at sorted position ${i}.`);
      renderPseudo(3);
      await wait();
    }

    renderBars(arr, { sorted: arr.map((_, i) => i) });
    setStep("Selection Sort completed.");
    setStatus("Sorted", "done");
  }

  async function insertionSort() {
    const arr = parseArray();
    const sorted = [0];

    for (let i = 1; i < arr.length; i++) {
      const key = arr[i];
      let j = i - 1;

      renderBars(arr, { active: [i], sorted });
      setStep(`Pick key = ${key}. Compare with sorted left part.`);
      renderPseudo(1);
      await wait();

      while (j >= 0 && arr[j] > key) {
        arr[j + 1] = arr[j];
        renderBars(arr, { compare: [j, j + 1], sorted });
        setStep(`${arr[j]} is greater than ${key}, shift right.`);
        renderPseudo(2);
        await wait();
        j--;
      }

      arr[j + 1] = key;
      sorted.push(i);
      renderBars(arr, { active: [j + 1], sorted: arr.map((_, idx) => idx <= i ? idx : -1).filter(idx => idx >= 0) });
      setStep(`Inserted ${key} at correct position ${j + 1}.`);
      renderPseudo(3);
      await wait();
    }

    renderBars(arr, { sorted: arr.map((_, i) => i) });
    setStep("Insertion Sort completed.");
    setStatus("Sorted", "done");
  }

  async function stackDemo() {
    const values = parseArray().slice(0, 7);
    const stack = [];

    for (const value of values) {
      stack.push(value);
      renderStructure(stack, { mode: "stack", active: stack.length - 1, label: `Push ${value}` });
      setStep(`push(${value}) → value added at top. Stack follows LIFO.`);
      renderPseudo(0);
      await wait();
    }

    const popped = stack.pop();
    renderStructure(stack, { mode: "stack", active: stack.length - 1, label: `Pop ${popped}` });
    setStep(`pop() removed ${popped}, because it was at the top.`);
    renderPseudo(1);
    setStatus("Done", "done");
  }

  async function queueDemo() {
    const values = parseArray().slice(0, 7);
    const queue = [];

    for (const value of values) {
      queue.push(value);
      renderStructure(queue, { mode: "queue", active: queue.length - 1, label: `Enqueue ${value}` });
      setStep(`enqueue(${value}) → value added at rear. Queue follows FIFO.`);
      renderPseudo(0);
      await wait();
    }

    const removed = queue.shift();
    renderStructure(queue, { mode: "queue", active: 0, label: `Dequeue ${removed}` });
    setStep(`dequeue() removed ${removed}, because it was at the front.`);
    renderPseudo(1);
    setStatus("Done", "done");
  }

  async function linkedListDemo() {
    const values = parseArray().slice(0, 7);

    for (let i = 0; i < values.length; i++) {
      renderStructure(values, { mode: "linkedList", active: i, label: `Visit node ${i}` });
      setStep(`Current node value = ${values[i]}. Move pointer to next node.`);
      renderPseudo(i === 0 ? 0 : 2);
      await wait();
    }

    renderStructure(values, { mode: "linkedList", active: -1, label: "Traversal completed" });
    setStep("Linked List traversal completed.");
    setStatus("Done", "done");
  }

  async function runSelected() {
    if (DSA.running) return;
    DSA.running = true;
    DSA.paused = false;
    setStatus("Running", "running");
    updateHeader();

    try {
      const runners = {
        binarySearch,
        bubbleSort,
        selectionSort,
        insertionSort,
        stack: stackDemo,
        queue: queueDemo,
        linkedList: linkedListDemo
      };

      await runners[DSA.algo]();
      if (DSA.running) setStatus("Done", "done");
    } catch (error) {
      if (error.message !== "stopped") {
        setStep(error.message || "Something went wrong.");
        setStatus("Error", "error");
      }
    } finally {
      DSA.running = false;
      DSA.paused = false;
    }
  }

  function reset() {
    stop();
    const arr = parseArray();
    renderBars(arr);
    updateHeader();
    setStatus("Ready");
    setStep("Choose an algorithm and click Start.");
  }

  function explainWithAI() {
    const meta = DSA.meta[DSA.algo];
    const prompt = `Explain ${meta.title} with step-by-step dry run, pseudocode, time complexity, space complexity, example and interview points.`;
    const chat = document.getElementById("proChat");
    chat?.scrollIntoView({ behavior: "smooth", block: "start" });
    setTimeout(() => {
      if (typeof window.sendProChat === "function") {
        window.sendProChat(prompt);
      } else if (typeof sendProChat === "function") {
        sendProChat(prompt);
      }
    }, 350);
  }

  function bind() {
    if (!$("dsaEngine")) return;

    document.querySelectorAll("[data-dsa-algo]").forEach(btn => {
      btn.addEventListener("click", () => {
        if (DSA.running) stop();
        DSA.algo = btn.dataset.dsaAlgo;
        document.querySelectorAll("[data-dsa-algo]").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        reset();
      });
    });

    $("dsaStartBtn")?.addEventListener("click", runSelected);

    $("dsaPauseBtn")?.addEventListener("click", () => {
      if (!DSA.running) return;
      DSA.paused = !DSA.paused;
      $("dsaPauseBtn").textContent = DSA.paused ? "Resume" : "Pause";
      setStatus(DSA.paused ? "Paused" : "Running", DSA.paused ? "ready" : "running");
    });

    $("dsaResetBtn")?.addEventListener("click", () => {
      $("dsaPauseBtn").textContent = "Pause";
      reset();
    });

    $("dsaExplainBtn")?.addEventListener("click", explainWithAI);

    reset();
  }

  document.addEventListener("DOMContentLoaded", bind);
  setTimeout(bind, 700);
})();
