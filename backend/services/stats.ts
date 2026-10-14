import { PlayedGame } from '../repositories/game_repositories';

const RECENT_GAMES = 20;

const average = (values: number[]) =>
  values.length ? Math.round(values.reduce((a, b) => a + b, 0) / values.length) : null;

const winRate = (wins: number, games: number) => (games ? Math.round((wins / games) * 100) : 0);

// Statistiques d'un joueur, calculées à partir de ses parties (de la plus récente à la plus ancienne).
export function computeStats(games: PlayedGame[]) {
  const wins = games.filter((g) => g.won);
  const losses = games.filter((g) => !g.won);

  // Série en cours : victoires (positif) ou défaites (négatif) d'affilée en partant de la dernière partie.
  let currentStreak = 0;
  for (const game of games) {
    if (currentStreak !== 0 && game.won !== currentStreak > 0) break;
    currentStreak += game.won ? 1 : -1;
  }

  let bestWinStreak = 0;
  let streak = 0;
  for (const game of games) {
    streak = game.won ? streak + 1 : 0;
    bestWinStreak = Math.max(bestWinStreak, streak);
  }

  // Bilan contre chaque adversaire, du plus affronté au moins affronté.
  const opponents = new Map<string, { opponent: string | null; games: number; wins: number }>();
  for (const game of games) {
    const key = game.opponent ?? '';
    const entry = opponents.get(key) ?? { opponent: game.opponent, games: 0, wins: 0 };
    entry.games++;
    if (game.won) entry.wins++;
    opponents.set(key, entry);
  }

  return {
    summary: {
      games: games.length,
      wins: wins.length,
      losses: losses.length,
      winRate: winRate(wins.length, games.length),
      currentStreak,
      bestWinStreak,
      crapettesCalled: games.reduce((total, g) => total + g.myCrapettes, 0),
      crapettesSuffered: games.reduce((total, g) => total + g.opponentCrapettes, 0),
      averageDurationSeconds: average(games.map((g) => g.durationSeconds)),
      fastestWinSeconds: wins.length ? Math.min(...wins.map((g) => g.durationSeconds)) : null,
      // Cartes restant à l'adversaire quand on gagne : plus c'est haut, plus la victoire est nette.
      averageWinMargin: average(wins.map((g) => g.loserCardsLeft)),
      averageCardsLeftOnLoss: average(losses.map((g) => g.loserCardsLeft)),
    },
    opponents: [...opponents.values()]
      .map((o) => ({ ...o, losses: o.games - o.wins, winRate: winRate(o.wins, o.games) }))
      .sort((a, b) => b.games - a.games || b.wins - a.wins),
    recentGames: games.slice(0, RECENT_GAMES),
  };
}
