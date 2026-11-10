// Bericht des Probespielers für alle Kreaturen: node tests/balance/report.mjs [runs]
import { CREATURES } from '../../content/creatures.js';
import { STAGES } from '../../content/balance.js';
import { attackOf, defenseOf } from '../../src/game.js';
import { judge, pct, playerFor } from './probe.js';

const runs = Number(process.argv[2] ?? 60);
let bad = 0;
for (const id of Object.keys(STAGES)) {
  const s = playerFor(id);
  console.log(`Stufe ${id.padEnd(11)} Lv ${s.player.level}  HP ${s.player.maxHp}  ATK ${attackOf(s)}  DEF ${defenseOf(s)}`);
}
console.log('');
for (const type of Object.keys(CREATURES).filter((t) => !CREATURES[t].mark)) {
  const r = judge(type, { runs });
  const g = r.group ? ` | zu 3: ${pct(r.group.win)} (${pct(r.group.hpLost)} HP)` : '';
  console.log(`${type.padEnd(16)} ${String(r.role).padEnd(7)} rundenweise: ${pct(r.soloTurns.win)} (${pct(r.soloTurns.hpLost)} HP, ${r.soloTurns.tactic}) | live: ${pct(r.soloLive.win)} (${pct(r.soloLive.hpLost)} HP, ${r.soloLive.tactic})${g}`);
  if (r.lazy) console.log(`${''.padEnd(24)}ohne Ausweichen: ${pct(r.lazy.win)} ${r.group ? 'zu 3' : 'allein'}`);
  for (const p of r.problems) console.log(`    ✗ ${p}`);
  bad += r.problems.length;
}
console.log(bad ? `\n${bad} Probleme` : '\nAlles passt.');
