// ─────────────────────────────────────────────────────────────────────────────
// Round 1 riddle chain.
//
// After the celestial boundary is decrypted, every target world carries a sealed
// riddle. Solving all of them is what authorises the one-time reference chart;
// the chart is in turn what tells a team which sign each world belongs to.
//
// The hand dealt to a squad is shuffled from this bank on every new mission, so
// two teams — or the same team on a new login — never see the same set of
// riddles against the same worlds.
// ─────────────────────────────────────────────────────────────────────────────
import { PlanetId } from './types';

export interface Riddle {
  id: string;
  /** The question put to the crew. */
  prompt: string;
  /** Accepted answers, already lower-case. Matching is case/punctuation blind. */
  answers: string[];
  /** One-line payoff shown after a correct answer. */
  fact: string;
}

/** The seven worlds that carry a riddle, in the order their digits form the code. */
export const RIDDLE_PLANETS: PlanetId[] = [
  'mercury',
  'venus',
  'mars',
  'jupiter',
  'saturn',
  'uranus',
  'neptune'
];

export const RIDDLE_BANK: Riddle[] = [
  {
    id: 'horizon',
    prompt: 'Nothing that crosses my edge can ever return — not even light. What am I?',
    answers: ['black hole', 'blackhole'],
    fact: 'A black hole: gravity so steep that escape velocity exceeds the speed of light.'
  },
  {
    id: 'nearest',
    prompt: 'I am the point in an orbit where the traveller is closest to its star. Name me.',
    answers: ['perihelion'],
    fact: 'Perihelion — from the Greek for "near the Sun".'
  },
  {
    id: 'farthest',
    prompt: 'I am the opposite of perihelion: the coldest, most distant point of an orbit.',
    answers: ['aphelion'],
    fact: 'Aphelion — the far end of the ellipse.'
  },
  {
    id: 'explosion',
    prompt: 'I am how a massive star dies: a single blast brighter than an entire galaxy.',
    answers: ['supernova'],
    fact: 'A supernova can outshine a hundred billion suns for a few weeks.'
  },
  {
    id: 'invisible-hand',
    prompt: 'I am the invisible hand that keeps moons on their rings and planets on their rounds.',
    answers: ['gravity'],
    fact: 'Gravity — the same curve that bends starlight and drops an apple.'
  },
  {
    id: 'halo',
    prompt: 'The Sun wears me as a pearl-white halo, seen only when the Moon hides its face.',
    answers: ['corona'],
    fact: 'The corona: the Sun\'s outer atmosphere, hotter than its surface.'
  },
  {
    id: 'backwards',
    prompt: 'When a planet seems to walk backwards against the stars, astronomers say it is in ___ motion.',
    answers: ['retrograde'],
    fact: 'Retrograde motion is a parallax illusion: Earth overtakes the slower outer world.'
  },
  {
    id: 'hide',
    prompt: 'I happen when one celestial body hides another from view. What am I?',
    answers: ['eclipse', 'occultation'],
    fact: 'An eclipse — a coincidence of geometry, not of darkness.'
  },
  {
    id: 'streak',
    prompt: 'I am the bright streak a space rock makes as it burns up in your atmosphere.',
    answers: ['meteor', 'shooting star'],
    fact: 'A meteor is the streak; the rock itself is a meteoroid.'
  },
  {
    id: 'icy-wanderer',
    prompt: 'I am ice and dust on a long ellipse, and my tail always points away from the Sun.',
    answers: ['comet'],
    fact: 'A comet\'s tail is blown outward by the solar wind, not dragged behind it.'
  },
  {
    id: 'distance',
    prompt: 'Earth is one of these from the Sun — a distance of about 150 million kilometres. What is it called?',
    answers: ['astronomical unit', 'au', 'astronomicalunit'],
    fact: 'One astronomical unit (AU) — the yardstick of the Solar System.'
  },
  {
    id: 'nursery',
    prompt: 'I am a vast cloud of gas and dust where new stars are born. Name me.',
    answers: ['nebula'],
    fact: 'A nebula — stellar nursery and, later, stellar graveyard.'
  },
  {
    id: 'city-of-stars',
    prompt: 'The Milky Way is one of these: a gravitationally bound city of billions of stars.',
    answers: ['galaxy'],
    fact: 'A galaxy — ours holds a few hundred billion stars.'
  },
  {
    id: 'companion',
    prompt: 'I orbit a larger body: natural like the Moon, or artificial like a relay. What am I?',
    answers: ['satellite', 'moon'],
    fact: 'A satellite — bound, not falling, because it moves sideways fast enough.'
  },
  {
    id: 'longest-day',
    prompt: 'The longest and shortest days of the year share one name. What is it?',
    answers: ['solstice'],
    fact: 'Solstice — from sol (sun) and sistere (to stand still).'
  },
  {
    id: 'equal-night',
    prompt: 'Twice a year day and night are equal everywhere. Name that date.',
    answers: ['equinox'],
    fact: 'Equinox — equal night, when the Sun sits on the celestial equator.'
  },
  {
    id: 'ruler',
    prompt: 'I am about 3.26 light years long, and astronomers measure star distances in me. What am I?',
    answers: ['parsec'],
    fact: 'A parsec is the parallax of one arcsecond — roughly 3.26 light years.'
  },
  {
    id: 'other-world',
    prompt: 'I am a world orbiting a star that is not the Sun. What am I called?',
    answers: ['exoplanet', 'extrasolar planet'],
    fact: 'Over five thousand exoplanets are confirmed so far.'
  },
  {
    id: 'polar-lights',
    prompt: 'I paint the polar skies green and violet when solar wind meets the magnetosphere.',
    answers: ['aurora', 'aurora borealis', 'northern lights'],
    fact: 'Aurora — atmospheric chemistry set alight by charged particles.'
  },
  {
    id: 'lighthouse',
    prompt: 'I am a spinning neutron star sweeping radiation beams like a lighthouse. Name me.',
    answers: ['pulsar'],
    fact: 'A pulsar can rotate hundreds of times per second.'
  },
  {
    id: 'leftover-rock',
    prompt: 'I am a rocky leftover of the Solar System, mostly found between Mars and Jupiter.',
    answers: ['asteroid'],
    fact: 'Asteroid — the belt holds millions, but they are spread incredibly thin.'
  },
  {
    id: 'sun-surface',
    prompt: 'I am the visible surface of the Sun, the layer your eyes actually see.',
    answers: ['photosphere'],
    fact: 'The photosphere is roughly 5,500 °C — cool by solar standards.'
  }
];

const normalise = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9 ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

/** Case, punctuation and spacing blind comparison against the accepted answers. */
export function matchesRiddleAnswer(riddle: Riddle, input: string): boolean {
  const candidate = normalise(input);
  if (!candidate) return false;
  return riddle.answers.some(answer => normalise(answer) === candidate);
}

const shuffle = <T,>(list: T[]): T[] => {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

/**
 * Deals one distinct riddle per target world. Random on every call, so a new
 * mission (or a fresh login) always presents a different set.
 */
export function assignRiddles(): Record<PlanetId, Riddle> {
  const hand = shuffle(RIDDLE_BANK).slice(0, RIDDLE_PLANETS.length);
  const assignment = {} as Record<PlanetId, Riddle>;
  RIDDLE_PLANETS.forEach((planet, index) => {
    assignment[planet] = hand[index] ?? RIDDLE_BANK[index];
  });
  return assignment;
}
