import { PokemonCard } from '@/types';

export function getCardType(card: PokemonCard): string {
  if (card.hp) return 'Pokémon';
  const stage = (card.stage ?? '').toLowerCase();
  if (stage.includes('supporter')) return 'Supporter';
  if (stage.includes('stadium')) return 'Stadium';
  if (stage.includes('tool')) return 'Pokémon Tool';
  if (stage.includes('item')) return 'Item';
  const nameLower = (card.name ?? '').toLowerCase();
  if (stage.includes('energy') || stage.includes('energi') || nameLower.includes('energy') || nameLower.includes('energi')) return 'Energi';
  return 'Lainnya';
}

export function getElements(card: PokemonCard): string[] {
  if (!card.types) return [];
  return card.types.map((url: string) => {
    const u = url.toLowerCase();
    if (u.includes('grass')) return 'Rumput';
    if (u.includes('fire')) return 'Api';
    if (u.includes('water')) return 'Air';
    if (u.includes('lightning')) return 'Listrik';
    if (u.includes('psychic')) return 'Psikis';
    if (u.includes('fighting')) return 'Petarung';
    if (u.includes('darkness') || u.includes('dark')) return 'Kegelapan';
    if (u.includes('metal')) return 'Baja';
    if (u.includes('fairy')) return 'Peri';
    if (u.includes('dragon')) return 'Naga';
    if (u.includes('colorless')) return 'Normal';
    return 'Lainnya';
  });
}

/**
 * Derives stage classification from card name and stage field.
 * Returns an array of stage tags (e.g., ['Basic', 'EX'] or ['VMAX']).
 * Special forms (V-UNION, VMAX, VSTAR) take priority over base stage.
 */
export function getStageInfo(card: PokemonCard): string[] {
  const nameUpper = (card.name ?? '').toUpperCase();
  const stageRaw = (card.stage ?? '').trim();
  const stageLower = stageRaw.toLowerCase();

  let base = 'Lainnya';
  if (stageLower.includes('basic') || stageLower === 'basic') base = 'Basic';
  else if (stageLower.includes('stage 1')) base = 'Stage 1';
  else if (stageLower.includes('stage 2')) base = 'Stage 2';
  else if (stageRaw) base = stageRaw;

  if (nameUpper.includes('V-UNION')) return ['V-UNION'];
  if (nameUpper.includes('VMAX')) return ['VMAX'];
  if (nameUpper.includes('VSTAR')) return ['VSTAR'];

  let suffix = '';
  if (nameUpper.endsWith(' EX') || nameUpper.includes(' EX ')) suffix = 'EX';
  else if (nameUpper.includes('GX')) suffix = 'GX';
  else if (nameUpper.endsWith(' V') || nameUpper.includes(' V ')) suffix = 'V';

  if (suffix && ['Basic', 'Stage 1', 'Stage 2'].includes(base)) {
    return [base, suffix];
  }
  return suffix ? [suffix] : [base];
}

/**
 * Returns the display-friendly stage label for card detail views.
 * Joins the stage array into a single string (e.g., "Basic EX").
 */
export function getStageLabel(card: PokemonCard): string {
  return getStageInfo(card).join(' ');
}
