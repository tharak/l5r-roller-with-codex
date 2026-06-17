import "./styles.css";
import { formatRoll, normalizeSettings, rollDice, type RollResult, type RollSettings } from "./roller";

const historyKey = "l5r-roller-history";
const characterKey = "l5r-characters";
const maximumHistory = 20;
const bookBaseUrl = "https://raw.githubusercontent.com/tharak/LegendOfTheFiveRings/main/Sources/LegendOfTheFiveRings/Resources";

const tabs = [
  { id: "characters", label: "Characters", icon: "people" },
  { id: "dice", label: "Dice", icon: "die" },
  { id: "book", label: "Book", icon: "book" },
  { id: "history", label: "Rolls", icon: "scroll" },
] as const;

type TabId = (typeof tabs)[number]["id"];
type BookItem = Record<string, unknown> & { name: string; description?: string; clan?: string; benefit?: string; skills?: string; honor?: string };
type BookSection = { id: string; label: string; file: string; items: BookItem[]; loaded: boolean; failed: boolean };
type RingName = "earth" | "air" | "water" | "fire" | "void";
type TraitName = "stamina" | "willpower" | "reflexes" | "awareness" | "strength" | "perception" | "agility" | "intelligence" | "void";
type CharacterRecord = {
  id: string;
  name: string;
  xp: number;
  clan: string;
  family: string;
  school: string;
  honor: number;
  glory: number;
  status: number;
  taint: number;
  traits: Record<TraitName, number>;
  skills: string[];
  createdAt: string;
};

type Route = { tab: TabId; characterId?: string; editing?: boolean; sectionId?: string };

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
let characters = loadCharacters();
let route = parseRoute();
let bookSections: BookSection[] = [];
let bookLoadStarted = false;

function render(): void {
  settings = normalizeSettings(settings);

  if ((route.tab === "book" || route.tab === "characters") && !bookLoadStarted) {
    void loadBook();
  }

  app.innerHTML = `
    <header class="masthead app-shell-head">
      <div>
        <p class="eyebrow">Legend of the Five Rings</p>
        <h1>${pageTitle()}</h1>
      </div>
      ${route.tab === "characters" ? `<button class="ghost-button" id="new-character" type="button">New Character</button>` : ""}
      ${route.tab === "history" ? `<button class="ghost-button" id="clear-history" type="button">Clear History</button>` : ""}
    </header>

    <nav class="tab-bar" aria-label="Primary">
      ${tabs.map(tabLink).join("")}
    </nav>

    <main>${pageMarkup()}</main>
  `;

  bindSharedEvents();
  if (route.tab === "dice") bindDiceEvents();
  if (route.tab === "history") bindHistoryEvents();
  if (route.tab === "characters") bindCharacterEvents();
  if (route.tab === "book") bindBookEvents();
}

function pageTitle(): string {
  if (route.tab === "characters") {
    if (route.editing && !route.characterId) return "New Character";
    const character = route.characterId ? characters.find((item) => item.id === route.characterId) : null;
    if (character) return route.editing ? `Edit ${character.name}` : character.name;
  }
  return tabs.find((tab) => tab.id === route.tab)?.label ?? "Characters";
}

function pageMarkup(): string {
  if (route.tab === "dice") return dicePageMarkup();
  if (route.tab === "history") return historyPageMarkup(true);
  if (route.tab === "book") return bookPageMarkup();
  return characterPageMarkup();
}

function tabLink(tab: (typeof tabs)[number]): string {
  const active = route.tab === tab.id ? " active" : "";
  return `<a class="tab-link${active}" href="#${tab.id}" aria-current="${route.tab === tab.id ? "page" : "false"}">${icon(tab.icon)}<span>${tab.label}</span></a>`;
}

function dicePageMarkup(): string {
  return `
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

    ${historyPageMarkup(false)}
  `;
}

function historyPageMarkup(standalone: boolean): string {
  const className = standalone ? "history-panel full-panel" : "history-panel";
  return `
    <section class="${className}" aria-label="Roll history">
      <h2>${standalone ? "Rolls" : "History"}</h2>
      ${history.length === 0 ? `<p class="muted">No rolls yet.</p>` : `<ol>${history.map(historyItem).join("")}</ol>`}
    </section>
  `;
}

function characterPageMarkup(): string {
  const selected = route.characterId ? characters.find((character) => character.id === route.characterId) : (characters[0] ?? null);

  if (route.editing) {
    return characterFormMarkup(selected ?? undefined);
  }

  return `
    <section class="split-page">
      <aside class="list-panel">
        ${characters.length === 0 ? emptyCharactersMarkup() : `<div class="character-list">${characters.map(characterListItem).join("")}</div>`}
      </aside>
      <section class="detail-panel">
        ${selected ? characterDetailMarkup(selected) : firstCharacterMarkup()}
      </section>
    </section>
  `;
}

function bookPageMarkup(): string {
  const section = route.sectionId ? bookSections.find((item) => item.id === route.sectionId) : null;
  if (section) {
    return `
      <section class="book-detail full-panel">
        <div class="panel-title-row">
          <h2>${section.label}</h2>
          <a class="ghost-link" href="#book">All Sections</a>
        </div>
        ${bookStatusMarkup(section)}
        <div class="book-items">${section.items.map(bookItemMarkup).join("")}</div>
      </section>
    `;
  }

  return `
    <section class="book-grid" aria-label="Book sections">
      ${bookSections.map(bookSectionCard).join("")}
    </section>
  `;
}

function bindSharedEvents(): void {
  app.querySelector<HTMLButtonElement>("#new-character")?.addEventListener("click", () => {
    location.hash = "characters/new";
  });
}

function bindDiceEvents(): void {
  getRequiredElement<HTMLFormElement>("#roller-form").addEventListener("submit", (event) => {
    event.preventDefault();
    updateSettingsFromForm();
    performRoll();
  });

  for (const input of app.querySelectorAll<HTMLInputElement | HTMLSelectElement>("#roller-form input, #roller-form select")) {
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
}

function bindHistoryEvents(): void {
  app.querySelector<HTMLButtonElement>("#clear-history")?.addEventListener("click", () => {
    history = [];
    latest = null;
    localStorage.removeItem(historyKey);
    render();
  });
}

function bindCharacterEvents(): void {
  app.querySelector<HTMLFormElement>("#character-form")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const form = event.currentTarget as HTMLFormElement;
    const data = new FormData(form);
    const saved = saveCharacterFromForm(data, form.dataset.characterId || undefined);
    location.hash = `characters/${saved.id}`;
  });

  app.querySelector<HTMLButtonElement>("#cancel-character")?.addEventListener("click", () => {
    const id = app.querySelector<HTMLFormElement>("#character-form")?.dataset.characterId;
    location.hash = id ? `characters/${id}` : "characters";
  });

  app.querySelector<HTMLButtonElement>("#delete-character")?.addEventListener("click", () => {
    const id = app.querySelector<HTMLButtonElement>("#delete-character")?.dataset.characterId;
    if (!id) return;
    characters = characters.filter((character) => character.id !== id);
    saveCharacters();
    location.hash = "characters";
    render();
  });

  for (const field of app.querySelectorAll<HTMLSelectElement>("#clan, #family")) {
    field.addEventListener("change", syncCreationOptions);
  }
}

function bindBookEvents(): void {
  for (const input of app.querySelectorAll<HTMLInputElement>("[data-book-filter]")) {
    input.addEventListener("input", () => {
      const query = input.value.trim().toLowerCase();
      for (const item of app.querySelectorAll<HTMLElement>(".book-item")) {
        item.hidden = query.length > 0 && !item.textContent?.toLowerCase().includes(query);
      }
    });
  }
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

function characterFormMarkup(character?: CharacterRecord): string {
  const selectedClan = character?.clan ?? "Crab";
  const families = familyOptions(selectedClan);
  const schools = schoolOptions(selectedClan);
  const selectedFamily = character?.family ?? families[0]?.name ?? "Hida";
  const selectedSchool = character?.school ?? schools[0]?.name ?? "Hida Bushi";

  return `
    <form class="editor-panel full-panel" id="character-form" data-character-id="${character?.id ?? ""}">
      <div class="form-grid">
        ${textControl("name", "Name", character?.name ?? "")}
        ${numberInput("xp", "Initial XP", character?.xp ?? 40, 0, 999)}
        <label class="field">
          <span>Clan</span>
          <select id="clan" name="clan">${clans().map((clan) => option(clan, selectedClan)).join("")}</select>
        </label>
        <label class="field">
          <span>Family</span>
          <select id="family" name="family">${families.map((family) => option(family.name, selectedFamily, family.benefit)).join("")}</select>
        </label>
        <label class="field">
          <span>School</span>
          <select id="school" name="school">${schools.map((school) => option(school.name, selectedSchool, school.benefit)).join("")}</select>
        </label>
      </div>
      <div class="button-row">
        <button class="roll-button" type="submit">Save</button>
        <button class="ghost-button" id="cancel-character" type="button">Cancel</button>
      </div>
    </form>
  `;
}

function syncCreationOptions(): void {
  const clan = app.querySelector<HTMLSelectElement>("#clan")?.value ?? "Crab";
  const familySelect = app.querySelector<HTMLSelectElement>("#family");
  const schoolSelect = app.querySelector<HTMLSelectElement>("#school");
  if (!familySelect || !schoolSelect) return;
  familySelect.innerHTML = familyOptions(clan).map((family) => option(family.name, familySelect.value, family.benefit)).join("");
  schoolSelect.innerHTML = schoolOptions(clan).map((school) => option(school.name, schoolSelect.value, school.benefit)).join("");
}

function saveCharacterFromForm(data: FormData, id?: string): CharacterRecord {
  const family = String(data.get("family") || "Hida");
  const school = String(data.get("school") || "Hida Bushi");
  const familyItem = bookSections.find((section) => section.id === "families")?.items.find((item) => item.name === family);
  const schoolItem = bookSections.find((section) => section.id === "schools")?.items.find((item) => item.name === school);
  const existing = id ? characters.find((character) => character.id === id) : undefined;
  const character: CharacterRecord = {
    id: existing?.id ?? crypto.randomUUID(),
    name: String(data.get("name") || "Unnamed Samurai"),
    xp: Number(data.get("xp") || 40),
    clan: String(data.get("clan") || "Crab"),
    family,
    school,
    honor: parseHonor(schoolItem?.honor),
    glory: schoolItem && String(schoolItem.discipline).toLowerCase() === "monk" ? 0 : 1,
    status: 1,
    taint: existing?.taint ?? 0,
    traits: buildTraits([String(familyItem?.benefit ?? ""), String(schoolItem?.benefit ?? "")]),
    skills: parseSkills(String(schoolItem?.skills ?? "")),
    createdAt: existing?.createdAt ?? new Date().toISOString(),
  };

  characters = existing ? characters.map((item) => (item.id === existing.id ? character : item)) : [character, ...characters];
  saveCharacters();
  return character;
}

function characterListItem(character: CharacterRecord): string {
  const active = (route.characterId ?? characters[0]?.id) === character.id ? " active" : "";
  return `
    <a class="character-row${active}" href="#characters/${character.id}">
      <strong>${escapeHtml(character.name)}</strong>
      <span>${escapeHtml(character.clan)} - ${escapeHtml(character.school)}</span>
    </a>
  `;
}

function characterDetailMarkup(character: CharacterRecord): string {
  return `
    <div class="panel-title-row">
      <div>
        <h2>${escapeHtml(character.name)}</h2>
        <p class="muted">${escapeHtml(character.family)} family, ${escapeHtml(character.school)}</p>
      </div>
      <div class="button-row compact">
        <a class="ghost-link" href="#characters/${character.id}/edit">XP ${character.xp}</a>
        <button class="ghost-button danger" id="delete-character" data-character-id="${character.id}" type="button">Delete</button>
      </div>
    </div>

    <section class="stat-strip">
      ${stat("Honor", character.honor.toFixed(1))}
      ${stat("Glory", character.glory.toFixed(1))}
      ${stat("Status", character.status.toFixed(1))}
      ${stat("Taint", character.taint.toFixed(1))}
    </section>

    <section class="ring-grid">
      ${ringMarkup("Earth", ringValue(character, "earth"), "Stamina", character.traits.stamina, "Willpower", character.traits.willpower)}
      ${ringMarkup("Air", ringValue(character, "air"), "Reflexes", character.traits.reflexes, "Awareness", character.traits.awareness)}
      ${ringMarkup("Water", ringValue(character, "water"), "Strength", character.traits.strength, "Perception", character.traits.perception)}
      ${ringMarkup("Fire", ringValue(character, "fire"), "Agility", character.traits.agility, "Intelligence", character.traits.intelligence)}
      ${ringMarkup("Void", ringValue(character, "void"), "Void", character.traits.void, "Insight Rank", rank(character), true)}
    </section>

    <section class="combat-grid">
      ${stat("Initiative", `${rank(character)}k${character.traits.reflexes}`)}
      ${stat("Insight", String(insight(character)))}
      ${stat("Wounds / Rank", String(ringValue(character, "earth") * 2))}
      ${stat("Healthy", String(ringValue(character, "earth") * 5))}
    </section>

    <section class="skills-panel">
      <h2>Skills</h2>
      <div class="chip-row">${character.skills.length ? character.skills.map((skill) => `<span class="chip">${escapeHtml(skill)}</span>`).join("") : `<span class="muted">No school skills listed.</span>`}</div>
    </section>
  `;
}

function emptyCharactersMarkup(): string {
  return `<div class="empty-panel"><p class="muted">No characters yet.</p><a class="roll-button link-button" href="#characters/new">Create your first character</a></div>`;
}

function firstCharacterMarkup(): string {
  return `<div class="empty-panel"><h2>Create your first character</h2><p class="muted">Pick a clan, family, and school from the original book data.</p><a class="roll-button link-button" href="#characters/new">New Character</a></div>`;
}

function bookSectionCard(section: BookSection): string {
  return `
    <a class="book-card" href="#book/${section.id}">
      <span>${section.label}</span>
      <strong>${section.items.length}</strong>
      <small>${section.loaded ? "Loaded" : section.failed ? "Fallback" : "Loading"}</small>
    </a>
  `;
}

function bookStatusMarkup(section: BookSection): string {
  return `
    <label class="field search-field">
      <span>Search ${section.label}</span>
      <input data-book-filter="${section.id}" type="search" placeholder="Filter by name or text" />
    </label>
    ${section.failed ? `<p class="muted">Showing fallback data because the original resource could not be loaded.</p>` : ""}
  `;
}

function bookItemMarkup(item: BookItem): string {
  const meta = [item.clan, item.benefit, item.honor ? `Honor ${item.honor}` : null].filter(Boolean).join(" - ");
  return `
    <article class="book-item">
      <h3>${escapeHtml(item.name)}</h3>
      ${meta ? `<p class="book-meta">${escapeHtml(meta)}</p>` : ""}
      <p>${escapeHtml(String(item.description ?? item.skills ?? "No description."))}</p>
    </article>
  `;
}

async function loadBook(): Promise<void> {
  bookLoadStarted = true;
  await Promise.all(
    bookSections.map(async (section) => {
      try {
        const response = await fetch(`${bookBaseUrl}/${section.file}`);
        if (!response.ok) throw new Error(`Failed to load ${section.file}`);
        const items = (await response.json()) as BookItem[];
        section.items = items.filter((item) => typeof item.name === "string");
        section.loaded = true;
      } catch {
        section.failed = true;
      }
    }),
  );
  if (route.tab === "book" || route.tab === "characters") render();
}

function createBookSections(): BookSection[] {
  return [
    { id: "advantages", label: "Advantages", file: "Advantages.json", items: fallbackAdvantages, loaded: false, failed: false },
    { id: "ancestors", label: "Ancestors", file: "Ancestors.json", items: fallbackAncestors, loaded: false, failed: false },
    { id: "armors", label: "Armors", file: "Armors.json", items: fallbackArmors, loaded: false, failed: false },
    { id: "clans", label: "Clans", file: "Clans.json", items: fallbackClans, loaded: false, failed: false },
    { id: "disadvantages", label: "Disadvantages", file: "Disadvantages.json", items: fallbackDisadvantages, loaded: false, failed: false },
    { id: "families", label: "Families", file: "Families.json", items: fallbackFamilies, loaded: false, failed: false },
    { id: "katas", label: "Katas", file: "Katas.json", items: fallbackKatas, loaded: false, failed: false },
    { id: "kihos", label: "Kihos", file: "Kihos.json", items: fallbackKihos, loaded: false, failed: false },
    { id: "schools", label: "Schools", file: "Schools.json", items: fallbackSchools, loaded: false, failed: false },
    { id: "shadowlands", label: "Shadowlands Powers", file: "ShadowlandsPowers.json", items: fallbackShadowlands, loaded: false, failed: false },
    { id: "skills", label: "Skills", file: "Skills.json", items: fallbackSkills, loaded: false, failed: false },
    { id: "spells", label: "Spells", file: "Spells.json", items: fallbackSpells, loaded: false, failed: false },
    { id: "tattoos", label: "Tattoos", file: "Tattoos.json", items: fallbackTattoos, loaded: false, failed: false },
    { id: "weapons", label: "Weapons", file: "Weapons.json", items: fallbackWeapons, loaded: false, failed: false },
  ];
}

function familyOptions(clan: string): BookItem[] {
  return optionsFor("families", clan);
}

function schoolOptions(clan: string): BookItem[] {
  return optionsFor("schools", clan);
}

function optionsFor(sectionId: string, clan: string): BookItem[] {
  const section = bookSections.find((item) => item.id === sectionId);
  const filtered = section?.items.filter((item) => String(item.clan ?? "").toLowerCase() === clan.toLowerCase()) ?? [];
  return filtered.length ? filtered : section?.items.slice(0, 8) ?? [];
}

function clans(): string[] {
  const names = new Set<string>();
  for (const sectionId of ["families", "schools"]) {
    const section = bookSections.find((item) => item.id === sectionId);
    for (const item of section?.items ?? []) {
      if (item.clan) names.add(String(item.clan));
    }
  }
  return [...names].sort();
}

function buildTraits(benefits: string[]): Record<TraitName, number> {
  const traits: Record<TraitName, number> = {
    stamina: 2,
    willpower: 2,
    reflexes: 2,
    awareness: 2,
    strength: 2,
    perception: 2,
    agility: 2,
    intelligence: 2,
    void: 2,
  };
  for (const benefit of benefits) {
    for (const trait of Object.keys(traits) as TraitName[]) {
      if (benefit.toLowerCase().includes(trait)) traits[trait] += 1;
    }
  }
  return traits;
}

function parseSkills(value: string): string[] {
  return value
    .split(",")
    .map((skill) => skill.trim().replace(/\s+\d+$/, ""))
    .filter(Boolean)
    .slice(0, 12);
}

function parseHonor(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 2.5;
}

function ringValue(character: CharacterRecord, ring: RingName): number {
  if (ring === "earth") return Math.min(character.traits.stamina, character.traits.willpower);
  if (ring === "air") return Math.min(character.traits.reflexes, character.traits.awareness);
  if (ring === "water") return Math.min(character.traits.strength, character.traits.perception);
  if (ring === "fire") return Math.min(character.traits.agility, character.traits.intelligence);
  return character.traits.void;
}

function insight(character: CharacterRecord): number {
  return character.skills.length + (["earth", "air", "water", "fire", "void"] as RingName[]).reduce((total, ring) => total + ringValue(character, ring), 0) * 10;
}

function rank(character: CharacterRecord): number {
  return Math.min(10, Math.max(1, Math.floor((insight(character) - 125) / 25) + 1));
}

function ringMarkup(name: string, value: number, firstName: string, first: number, secondName: string, second: number, compact = false): string {
  return `
    <article class="ring-card${compact ? " compact" : ""}">
      <strong>${value}</strong>
      <span>${name}</span>
      <small>${firstName} ${first}</small>
      <small>${secondName} ${second}</small>
    </article>
  `;
}

function stat(label: string, value: string): string {
  return `<div class="stat"><span>${label}</span><strong>${value}</strong></div>`;
}

function numberControl(id: keyof Pick<RollSettings, "amount" | "keep" | "bonus">, label: string, value: number, min: number, max: number): string {
  return `
    <label class="field">
      <span>${label}</span>
      <input id="${id}" name="${id}" type="number" min="${min}" max="${max}" value="${value}" inputmode="numeric" />
    </label>
  `;
}

function numberInput(id: string, label: string, value: number, min: number, max: number): string {
  return `<label class="field"><span>${label}</span><input id="${id}" name="${id}" type="number" min="${min}" max="${max}" value="${value}" /></label>`;
}

function textControl(id: string, label: string, value: string): string {
  return `<label class="field"><span>${label}</span><input id="${id}" name="${id}" type="text" value="${escapeHtml(value)}" required /></label>`;
}

function option(value: string, selected: string, detail = ""): string {
  return `<option value="${escapeHtml(value)}" ${value === selected ? "selected" : ""}>${escapeHtml(detail ? `${value} ${detail}` : value)}</option>`;
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

function parseRoute(): Route {
  const parts = location.hash.replace(/^#\/?/, "").split("/").filter(Boolean);
  const tab = tabs.some((item) => item.id === parts[0]) ? (parts[0] as TabId) : "characters";
  if (tab === "characters" && parts[1] === "new") return { tab, editing: true };
  if (tab === "characters" && parts[1]) return { tab, characterId: parts[1], editing: parts[2] === "edit" };
  if (tab === "book" && parts[1]) return { tab, sectionId: parts[1] };
  return { tab };
}

function loadHistory(): RollResult[] {
  const stored = localStorage.getItem(historyKey);
  if (!stored) return [];
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

function loadCharacters(): CharacterRecord[] {
  const stored = localStorage.getItem(characterKey);
  if (!stored) return [];
  try {
    const parsed = JSON.parse(stored) as CharacterRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveCharacters(): void {
  localStorage.setItem(characterKey, JSON.stringify(characters));
}

function icon(name: string): string {
  const icons: Record<string, string> = {
    people: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M16 11a4 4 0 1 0-3.3-6.3A5 5 0 0 1 14 8a5 5 0 0 1-1.3 3.3A4 4 0 0 0 16 11Zm-8 1a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm0 2c-3.3 0-6 1.8-6 4v1h12v-1c0-2.2-2.7-4-6-4Zm8-.5c-.9 0-1.8.2-2.6.5 1.6.9 2.6 2.3 2.6 4v1h6v-1c0-2.5-2.7-4.5-6-4.5Z"/></svg>`,
    die: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Zm3 5.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Zm8 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Zm-4 5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Zm-4 5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Zm8 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z"/></svg>`,
    book: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4.5A2.5 2.5 0 0 1 7.5 2H20v17H7.5A2.5 2.5 0 0 0 5 21.5v-17Zm2.5-.5a.5.5 0 0 0-.5.5v12.6c.2-.1.3-.1.5-.1H18V4H7.5Z"/></svg>`,
    scroll: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3h11a3 3 0 0 1 3 3v13a2 2 0 0 1-2 2H7a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3Zm11 16a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h10ZM8 8h8v2H8V8Zm0 4h8v2H8v-2Z"/></svg>`,
  };
  return icons[name] ?? "";
}

function escapeHtml(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}

function getRequiredElement<T extends HTMLElement>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (!element) throw new Error(`Missing element: ${selector}`);
  return element;
}

const fallbackFamilies: BookItem[] = [
  { name: "Hida", clan: "Crab", benefit: "+1 Strength", description: "Powerful Crab defenders trained for endurance and brutal force." },
  { name: "Doji", clan: "Crane", benefit: "+1 Awareness", description: "Masters of courtly influence, culture, and political grace." },
  { name: "Mirumoto", clan: "Dragon", benefit: "+1 Agility", description: "Dragon samurai known for practical rule and two-sword technique." },
  { name: "Akodo", clan: "Lion", benefit: "+1 Agility", description: "Lion tacticians and battle leaders with a calm martial tradition." },
  { name: "Bayushi", clan: "Scorpion", benefit: "+1 Agility", description: "Scorpion courtiers and duelists trained in secrets and misdirection." },
];
const fallbackSchools: BookItem[] = [
  { name: "Hida Bushi", clan: "Crab", benefit: "+1 Stamina", honor: "3.5", skills: "Athletics, Defense, Heavy Weapons, Intimidation, Kenjutsu, Lore: Shadowlands", description: "A heavy infantry school built around endurance and crushing attacks." },
  { name: "Doji Courtier", clan: "Crane", benefit: "+1 Awareness", honor: "6.5", skills: "Courtier, Etiquette, Sincerity, Calligraphy, Lore: Heraldry", description: "A school focused on alliances, etiquette, and social advantage." },
  { name: "Mirumoto Bushi", clan: "Dragon", benefit: "+1 Agility", honor: "4.5", skills: "Defense, Kenjutsu, Lore: Shugenja, Meditation, Theology", description: "The Dragon two-sword bushi tradition." },
  { name: "Akodo Bushi", clan: "Lion", benefit: "+1 Agility", honor: "6.5", skills: "Battle, Defense, Kenjutsu, Kyujutsu, Lore: History", description: "A disciplined battlefield command and weapon school." },
  { name: "Bayushi Courtier", clan: "Scorpion", benefit: "+1 Awareness", honor: "2.5", skills: "Courtier, Etiquette, Intimidation, Sincerity, Temptation", description: "A manipulative court school built around pressure and leverage." },
];
const fallbackAdvantages: BookItem[] = [{ name: "Ally", description: "A useful social connection with influence and devotion." }];
const fallbackAncestors: BookItem[] = [{ name: "Ancestral Guidance", description: "A remembered ancestor whose legacy shapes the character." }];
const fallbackArmors: BookItem[] = [{ name: "Light Armor", description: "Common battlefield protection with modest penalties." }];
const fallbackClans: BookItem[] = [{ name: "Crab", description: "Defenders of the Empire against the Shadowlands." }];
const fallbackDisadvantages: BookItem[] = [{ name: "Bad Fortune", description: "An ill omen or recurring trouble in the character's life." }];
const fallbackKatas: BookItem[] = [{ name: "Striking as Fire", description: "A martial kata focused on decisive attacks." }];
const fallbackKihos: BookItem[] = [{ name: "Ki Protection", description: "A monk technique that channels inner energy defensively." }];
const fallbackShadowlands: BookItem[] = [{ name: "Dark Paragon", description: "A corrupt power associated with Shadowlands influence." }];
const fallbackSkills: BookItem[] = [{ name: "Kenjutsu", description: "The sword skill used for katana and wakizashi attacks." }];
const fallbackSpells: BookItem[] = [{ name: "Commune", description: "A basic spell used to speak with the kami." }];
const fallbackTattoos: BookItem[] = [{ name: "Dragon Tattoo", description: "A mystical tattoo of the Togashi orders." }];
const fallbackWeapons: BookItem[] = [{ name: "Katana", description: "The signature samurai sword." }];

bookSections = createBookSections();
window.addEventListener("hashchange", () => {
  route = parseRoute();
  render();
});
render();
