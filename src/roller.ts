export type RollSettings = {
  amount: number;
  keep: number;
  bonus: number;
  keepHigh: boolean;
  explodesOn: number | null;
  rerollOnOne: boolean;
};

export type TenDiceRuleResult = {
  amount: number;
  keep: number;
  bonus: number;
};

export type RollResult = {
  id: string;
  createdAt: string;
  original: Pick<RollSettings, "amount" | "keep" | "bonus">;
  applied: TenDiceRuleResult;
  settings: RollSettings;
  rolls: number[];
  total: number;
};

export const DIE_SIDES = 10;
export const MAXIMUM_DICE = 10;
const BONUS_FOR_MORE_THAN_MAXIMUM_DICE = 2;

export function rollDice(settings: RollSettings): RollResult {
  const normalized = normalizeSettings(settings);
  const applied = applyTheTenDiceRule(normalized.amount, normalized.keep);
  const rolls = Array.from({ length: applied.amount }, () =>
    rollDie({ explodesOn: normalized.explodesOn, rerollOnOne: normalized.rerollOnOne }),
  ).sort(normalized.keepHigh ? descending : ascending);
  const total = calculateTotal(rolls, applied.keep, applied.bonus + normalized.bonus);

  return {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    original: {
      amount: normalized.amount,
      keep: normalized.keep,
      bonus: normalized.bonus,
    },
    applied,
    settings: normalized,
    rolls,
    total,
  };
}

export function applyTheTenDiceRule(amount: number, keep: number): TenDiceRuleResult {
  const realAmount = Math.min(amount, MAXIMUM_DICE);
  const extraAmount = amount <= MAXIMUM_DICE ? 0 : amount - MAXIMUM_DICE;
  const keepFromExtraRoll = Math.floor(extraAmount / 2);
  let bonusFromExtraRoll = (extraAmount % 2) * BONUS_FOR_MORE_THAN_MAXIMUM_DICE;

  let realKeep = keep;
  let bonusFromExtraKeep: number;

  if (realKeep > MAXIMUM_DICE) {
    bonusFromExtraRoll = extraAmount * BONUS_FOR_MORE_THAN_MAXIMUM_DICE;
    bonusFromExtraKeep = (realKeep - MAXIMUM_DICE) * BONUS_FOR_MORE_THAN_MAXIMUM_DICE;
    realKeep = MAXIMUM_DICE;
  } else if (realKeep + keepFromExtraRoll > MAXIMUM_DICE) {
    realKeep = MAXIMUM_DICE;
    bonusFromExtraKeep = (realKeep + keepFromExtraRoll - MAXIMUM_DICE) * BONUS_FOR_MORE_THAN_MAXIMUM_DICE;
  } else {
    realKeep += keepFromExtraRoll;
    bonusFromExtraKeep = 0;
  }

  return {
    amount: realAmount,
    keep: realKeep,
    bonus: bonusFromExtraRoll + bonusFromExtraKeep,
  };
}

export function rollDie(options: { explodesOn?: number | null; rerollOnOne?: boolean; testValue?: number } = {}): number {
  const explodesOn = options.explodesOn === undefined ? DIE_SIDES : options.explodesOn;
  const value = options.testValue ?? randomDie(options.rerollOnOne ?? false);

  if (explodesOn !== null && value >= explodesOn) {
    return value + rollDie({ explodesOn, rerollOnOne: false });
  }

  return value;
}

export function calculateTotal(rolls: number[], keep: number, bonus: number): number {
  return rolls.slice(0, keep).reduce((total, value) => total + value, 0) + bonus;
}

export function formatRoll(result: RollResult): string {
  const bonus = result.original.bonus;
  const bonusText = bonus === 0 ? "" : bonus > 0 ? `+${bonus}` : `${bonus}`;
  return `${result.original.amount}k${result.original.keep}${bonusText}`;
}

export function normalizeSettings(settings: RollSettings): RollSettings {
  const amount = clampInteger(settings.amount, 1, 30);
  const keep = clampInteger(settings.keep, 1, amount);
  const explodesOn = settings.explodesOn === null ? null : clampInteger(settings.explodesOn, 2, DIE_SIDES);

  return {
    amount,
    keep,
    bonus: clampInteger(settings.bonus, -99, 99),
    keepHigh: settings.keepHigh,
    explodesOn,
    rerollOnOne: settings.rerollOnOne,
  };
}

function randomDie(rerollOnOne: boolean): number {
  const minimumValue = rerollOnOne ? 2 : 1;
  return minimumValue + Math.floor(Math.random() * (DIE_SIDES - minimumValue + 1));
}

function clampInteger(value: number, min: number, max: number): number {
  const integer = Number.isFinite(value) ? Math.trunc(value) : min;
  return Math.min(Math.max(integer, min), max);
}

function descending(first: number, second: number): number {
  return second - first;
}

function ascending(first: number, second: number): number {
  return first - second;
}
