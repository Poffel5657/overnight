// Spielbarkeit (seit Chris' Regeln nach Tag 7): Jeder Gegenstand muss etwas tun und erreichbar sein.
// „Das Ding ist da, macht aber nichts“ oder „Es gibt es, aber man kommt nie dran“ ist kein fertiges Feature.
// Scheitert dieser Test, gib dem Gegenstand einen Zweck oder einen Weg in die Welt, nicht eine Ausnahme.
import { expect, test } from '@playwright/test';
import { ITEMS } from '../../content/items.js';
import { RECIPES } from '../../content/recipes.js';
import { SHOPS } from '../../content/shops.js';
import { QUESTS } from '../../content/quests.js';
import { WHEEL } from '../../content/wheel.js';
import { SPELL_COST } from '../../content/spells.js';
import { CREATURES } from '../../content/creatures.js';
import { MAPS } from '../../content/world.js';
import { MINING } from '../../content/trades.js';

const entities = Object.values(MAPS).flatMap((m) => m.entities);

// Wozu ein Gegenstand gut ist. Leere Liste = er tut nichts.
function usesOf(id) {
  const item = ITEMS[id];
  const uses = [];
  if (item.atk !== undefined) uses.push('Waffe');
  if (item.slot && item.def) uses.push('Rüstung');
  if (item.heal) uses.push('Getränk');
  if (item.spell) uses.push('Zauberbuch');
  if (RECIPES.some((r) => r.needs.includes(id))) uses.push('Zutat');
  if (QUESTS.some((q) => q.item === id)) uses.push('Quest');
  if (Object.values(SHOPS).some((s) => s.currency === id)) uses.push('Währung');
  if (WHEEL.cost === id) uses.push('Rad');
  if (SPELL_COST === id) uses.push('Tinte für Zauber');
  if (entities.some((e) => e.key === id)) uses.push('Schlüssel');
  if (id === MINING.tool && entities.some((e) => e.kind === 'vein')) uses.push('Werkzeug');
  return uses;
}

// Woher man ihn bekommt. Leere Liste = unerreichbar.
function sourcesOf(id) {
  const sources = [];
  if (entities.some((e) => e.item === id)) sources.push('liegt in der Welt');
  if (entities.some((e) => e.kind === 'vein' && e.ore === id)) sources.push('Ader');
  if (entities.some((e) => e.gift?.item === id)) sources.push('Geschenk');
  if (entities.some((e) => e.kind === 'inkwell') && id === SPELL_COST) sources.push('Tintenfass');
  if (Object.values(CREATURES).some((c) => c.drops?.some((d) => d.item === id))) sources.push('Beute');
  if (QUESTS.some((q) => q.reward?.item === id)) sources.push('Quest');
  if (Object.values(SHOPS).some((s) => s.stock.some((o) => o.item === id))) sources.push('Laden');
  if (RECIPES.some((r) => r.makes === id)) sources.push('Werkbank');
  if (WHEEL.wedges.some((w) => w.item === id)) sources.push('Rad');
  return sources;
}

for (const id of Object.keys(ITEMS)) {
  test(`${id}: hat einen Zweck und einen Weg in die Welt`, () => {
    const item = ITEMS[id];
    if (item.keepsake) {
      // Ausnahme nur mit Begründung: ein Andenken, das ein offener Faden später braucht.
      expect(typeof item.keepsake, `${id}: keepsake braucht eine Begründung als Text`).toBe('string');
    } else {
      expect(usesOf(id), `${id} tut nichts. Gib ihm einen Zweck (Waffe, Rüstung, Getränk, Zutat, Quest …).`).not.toEqual([]);
    }
    expect(sourcesOf(id), `${id} ist nirgends zu bekommen.`).not.toEqual([]);
    expect(item.text, `${id}: Beschreibung im Fenster BAG fehlt`).toBeTruthy();
  });
}

test('Höchstens zwei Andenken ohne Zweck gleichzeitig', () => {
  const keepsakes = Object.keys(ITEMS).filter((id) => ITEMS[id].keepsake);
  expect(keepsakes.length, `Andenken: ${keepsakes.join(', ')}`).toBeLessThanOrEqual(2);
});
