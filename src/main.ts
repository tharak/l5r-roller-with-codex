import "./styles.css";
import { formatRoll, normalizeSettings, rollDice, type RollResult, type RollSettings } from "./roller";

const historyKey = "l5r-roller-history";
const maximumHistory = 20;

const app = getRequiredElement<HTMLElement>("#app");

let settings: RollSettings = {
  amount: 5,
  keep: 2,
  bonus: 0,
  keepHigh: true,
  explodesOn: 10,
  rerollOnOne: false,
};
let history = loadHistory();
let latest: RollResult | null = history[0] ?? null;

render();

function render(): void {
  settings = normalizeSettings(settings);
  app.innerHTML = `
    <header class="masthead">
      <div>
        <p class="eyebrow">Legend of the Five Rings</p>
        <h1>L5R Roll & Keep</h1>
      </div>
      <button class="ghost-button" id="clear-history" type="button">Clear History</button>
    </header>

    <section class="roller-grid" aria-label="Dice roller">
      <form class="control-panel" id="roller-form">
        ${numberControl("amount", "Roll", settings.amount, 1, 30)}
        ${numberControl("keep", "Keep", settings.keep, 1, settings.amount)}
        ${numberControl("bonus", "Bonus", settings.bonus, -99, 99)}

        <fieldset class="option-group">
          <legend>Keep</legend>
          <label class="segmented-option">
            <input type="radio" name="keepHigh" value="true" ${settings.keepHigh ? "checked" : ""} />
            <span>High</span>
          </label>
          <label class="segmented-option">
            <input type="radio" name="keepHigh" value="false" ${!settings.keepHigh ? "checked" : ""} />
            <span>Low</span>
          </label>
        </fieldset>

        <label class="field">
          <span>Explodes</span>
          <select id="explodesOn" name="explodesOn">
            <option value="none" ${settings.explodesOn === null ? "selected" : ""}>None</option>
            <option value="9" ${settings.explodesOn === 9 ? "selected" : ""}>9 and 10</option>
            <option value="10" ${settings.explodesOn === 10 ? "selected" : ""}>10</option>
          </select>
        </label>

        <label class="toggle-row">
          <input id="rerollOnOne" name="rerollOnOne" type="checkbox" ${settings.rerollOnOne ? "checked" : ""} />
          <span>Re-roll on 1</span>
        </label>

        <button class="roll-button" type="submit">Roll ${notation(settings)}</button>
      </form>

      <section class="result-panel" aria-live="polite">
        ${latest ? resultMarkup(latest) : emptyResultMarkup()}
      </section>
    </section>

    <section class="preset-row" aria-label="Preset rolls">
      ${presetButton(1, 1)}
      ${presetButton(2, 2)}
      ${presetButton(3, 3)}
      ${presetButton(4, 4)}
      ${presetButton(5, 5)}
    </section>

    <section class="history-panel" aria-label="Roll history">
      <h2>History</h2>
      ${history.length === 0 ? `<p class="muted">No rolls yet.</p>` : `<ol>${history.map(historyItem).join("")}</ol>`}
    </section>
  `;

  bindEvents();
}

function bindEvents(): void {
  getRequiredElement<HTMLFormElement>("#roller-form").addEventListener("submit", (event) => {
    event.preventDefault();
    updateSettingsFromForm();
    performRoll();
  });

  for (const input of app.querySelectorAll<HTMLInputElement | HTMLSelectElement>("input, select")) {
    input.addEventListener("change", () => {
      updateSettingsFromForm();
      render();
    });
  }

  for (const button of app.querySelectorAll<HTMLButtonElement>("[data-preset]")) {
    button.addEventListener("click", () => {
      const value = Number(button.dataset.preset);
      settings = normalizeSettings({ ...settings, amount: value, keep: value, bonus: 0 });
      performRoll();
    });
  }

  getRequiredElement<HTMLButtonElement>("#clear-history").addEventListener("click", () => {
    history = [];
    latest = null;
    localStorage.removeItem(historyKey);
    render();
  });
}

function updateSettingsFromForm(): void {
  const form = getRequiredElement<HTMLFormElement>("#roller-form");
  const data = new FormData(form);
  settings = normalizeSettings({
    amount: Number(data.get("amount")),
    keep: Number(data.get("keep")),
    bonus: Number(data.get("bonus")),
    keepHigh: data.get("keepHigh") !== "false",
    explodesOn: data.get("explodesOn") === "none" ? null : Number(data.get("explodesOn")),
    rerollOnOne: data.get("rerollOnOne") === "on",
  });
}

function performRoll(): void {
  latest = rollDice(settings);
  history = [latest, ...history].slice(0, maximumHistory);
  saveHistory();
  render();
}

function numberControl(id: keyof Pick<RollSettings, "amount" | "keep" | "bonus">, label: string, value: number, min: number, max: number): string {
  return `
    <label class="field">
      <span>${label}</span>
      <input id="${id}" name="${id}" type="number" min="${min}" max="${max}" value="${value}" inputmode="numeric" />
    </label>
  `;
}

function resultMarkup(result: RollResult): string {
  const appliedBonus = result.applied.bonus === 0 ? "" : ` Rule bonus ${signed(result.applied.bonus)}.`;
  return `
    <div class="result-total">
      <span>${formatRoll(result)}</span>
      <strong>${result.total}</strong>
    </div>
    <div class="dice-row">${result.rolls.map(dieMarkup).join("")}</div>
    <p class="muted">Rolled ${result.applied.amount}, kept ${result.applied.keep}.${appliedBonus}</p>
  `;
}

function emptyResultMarkup(): string {
  return `
    <div class="result-total empty">
      <span>Ready</span>
      <strong>${notation(settings)}</strong>
    </div>
    <p class="muted">Choose a pool and roll.</p>
  `;
}

function dieMarkup(value: number): string {
  const exploded = value > 10 ? " exploded" : "";
  return `<span class="die${exploded}" aria-label="Die result ${value}">${value}</span>`;
}

function historyItem(result: RollResult): string {
  const time = new Intl.DateTimeFormat(undefined, { hour: "2-digit", minute: "2-digit" }).format(new Date(result.createdAt));
  return `
    <li>
      <span>${formatRoll(result)}</span>
      <strong>${result.total}</strong>
      <small>${result.rolls.join(" + ")} - ${time}</small>
    </li>
  `;
}

function presetButton(amount: number, keep: number): string {
  return `<button type="button" data-preset="${amount}">${amount}k${keep}</button>`;
}

function notation(value: Pick<RollSettings, "amount" | "keep" | "bonus">): string {
  const bonus = value.bonus === 0 ? "" : value.bonus > 0 ? `+${value.bonus}` : `${value.bonus}`;
  return `${value.amount}k${value.keep}${bonus}`;
}

function signed(value: number): string {
  return value > 0 ? `+${value}` : `${value}`;
}

function loadHistory(): RollResult[] {
  const stored = localStorage.getItem(historyKey);
  if (!stored) {
    return [];
  }

  try {
    const parsed = JSON.parse(stored) as RollResult[];
    return Array.isArray(parsed) ? parsed.slice(0, maximumHistory) : [];
  } catch {
    return [];
  }
}

function saveHistory(): void {
  localStorage.setItem(historyKey, JSON.stringify(history));
}

function getRequiredElement<T extends HTMLElement>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (!element) {
    throw new Error(`Missing element: ${selector}`);
  }
  return element;
}
