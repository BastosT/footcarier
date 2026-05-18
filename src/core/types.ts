/**
 * Types partagés pour le jeu de carrière footballistique.
 * Ce fichier contient les types fondamentaux utilisés à travers tous les systèmes.
 */

// ─── Types de base ───────────────────────────────────────────────────────────

export interface GameDate {
  day: number;
  month: number;
  year: number;
}

export type Position = 'GK' | 'CB' | 'LB' | 'RB' | 'CDM' | 'CM' | 'CAM' | 'LW' | 'RW' | 'ST';

export type Country = 'france' | 'spain' | 'england' | 'italy' | 'germany';

export type ClubTier = 'small' | 'medium' | 'big';

// ─── Division ────────────────────────────────────────────────────────────────

export interface Division {
  country: Country;
  level: number;       // 1 = première division, 2 = deuxième, etc.
  name: string;        // ex: "Ligue 1", "Premier League"
}

// ─── Apparence du joueur ─────────────────────────────────────────────────────

export interface PlayerAppearance {
  skinTone: number;
  hairStyle: number;
  hairColor: number;
  height: 'short' | 'medium' | 'tall';
}

// ─── Statistiques du joueur ──────────────────────────────────────────────────

export interface PlayerStats {
  pace: number;        // 1-99
  shooting: number;    // 1-99
  passing: number;     // 1-99
  dribbling: number;   // 1-99
  defending: number;   // 1-99
  physical: number;    // 1-99
}

// ─── Blessures ───────────────────────────────────────────────────────────────

export type InjuryType = 'muscle' | 'ligament' | 'fracture' | 'concussion' | 'fatigue';

export interface InjuryState {
  type: InjuryType;
  weeksRemaining: number;
  severity: 'minor' | 'moderate' | 'severe';
}

// ─── Joueur Personnage ───────────────────────────────────────────────────────

export interface PlayerCharacter {
  id: string;
  firstName: string;
  lastName: string;
  nationality: Country;
  position: Position;
  appearance: PlayerAppearance;
  age: number;
  jerseyNumber: number;
  stats: PlayerStats;
  potential: number;          // 1-99, plafond de progression
  overallRating: number;      // 1-99, calculé
  fitness: number;            // 0-100
  morale: number;             // 0-100
  injury: InjuryState | null;
}

// ─── Club et Effectif ────────────────────────────────────────────────────────

export interface SquadPlayer {
  id: string;
  name: string;
  position: Position;
  age: number;
  overallRating: number;
  potential: number;
  isPlayerCharacter: boolean;
}

export interface ClubFinances {
  budget: number;
  wageBill: number;
}

export interface Club {
  id: string;
  name: string;
  country: Country;
  division: Division;
  tier: ClubTier;
  squad: SquadPlayer[];
  finances: ClubFinances;
  stadium: string;
  colors: { primary: string; secondary: string };
}

// ─── Contrat ─────────────────────────────────────────────────────────────────

export interface Contract {
  clubId: string;
  weeklySalary: number;
  bonusPerGoal: number;
  bonusPerAssist: number;
  duration: number;        // en saisons
  seasonsRemaining: number;
  signingBonus: number;
}

// ─── Trophées ────────────────────────────────────────────────────────────────

export type TrophyType = 'league' | 'cup' | 'champions_league' | 'top_scorer' | 'best_player' | 'golden_boot';

export interface Trophy {
  id: string;
  type: TrophyType;
  season: number;
  competition: string;
}

// ─── État de Carrière ────────────────────────────────────────────────────────

export interface CareerState {
  currentClub: Club;
  contract: Contract;
  season: number;
  matchday: number;
  trophies: Trophy[];
  transferHistory: TransferRecord[];
  isCaptain: boolean;
}

export interface TransferRecord {
  fromClubId: string;
  toClubId: string;
  season: number;
  fee: number;
}

// ─── État Temporel ───────────────────────────────────────────────────────────

export interface TimeState {
  currentDate: GameDate;
  season: number;
  weekday: number;          // 0-6 (lundi-dimanche)
  eventsThisWeek: number;   // compteur pour limiter à 3/semaine
  schedule: MatchSchedule;
}

export interface MatchSchedule {
  nextMatch: ScheduledMatch | null;
  seasonMatches: ScheduledMatch[];
}

export interface ScheduledMatch {
  date: GameDate;
  homeTeam: string;   // club ID
  awayTeam: string;   // club ID
  competition: string;
  matchday: number;
}

// ─── État Social ─────────────────────────────────────────────────────────────

export interface SocialState {
  popularity: number;        // 0-100
  reputation: number;        // 0-100
  coachRelation: number;     // 0-100
  teamRelation: number;      // 0-100
  teamMorale: number;        // 0-100 — dépend des résultats (victoires/défaites)
  teamAmbiance: number;      // 0-100 — dépend des interactions (messages vestiaire)
  socialFeed: SocialPost[];
  pendingInterviews: Interview[];
}

export interface SocialPost {
  id: string;
  author: string;
  authorType: 'fan' | 'journalist' | 'player' | 'self';
  content: string;
  timestamp: GameDate;
  likes: number;
  sentiment: 'positive' | 'neutral' | 'negative';
}

export interface Interview {
  id: string;
  context: InterviewContext;
  questions: InterviewQuestion[];
}

export interface InterviewContext {
  type: 'post_match' | 'transfer' | 'trophy' | 'controversy' | 'general';
  relatedEvent?: string;
}

export interface InterviewQuestion {
  text: string;
  answers: [InterviewAnswer, InterviewAnswer, InterviewAnswer];
}

export interface InterviewAnswer {
  text: string;
  tone: 'humble' | 'confident' | 'controversial';
  impacts: {
    popularity: number;
    reputation: number;
    coachRelation: number;
    teamRelation: number;
  };
}

// ─── État Financier ──────────────────────────────────────────────────────────

export interface FinanceState {
  balance: number;
  weeklyIncome: number;
  history: FinanceTransaction[];
}

export type TransactionType = 'salary' | 'bonus' | 'signing_bonus' | 'sponsorship' | 'fine' | 'event';

export interface FinanceTransaction {
  date: GameDate;
  type: TransactionType;
  amount: number;
  description: string;
}

// ─── Championnat et Classement ───────────────────────────────────────────────

export interface TopScorer {
  playerId: string;
  playerName: string;
  clubId: string;
  clubName: string;
  goals: number;
  assists: number;
  matchesPlayed: number;
}

export interface LeagueState {
  division: Division;
  standings: LeagueStanding[];
  results: MatchResult[];
  season: number;
  topScorers: TopScorer[];
  schedule: ScheduledMatch[];
}

export interface LeagueStanding {
  clubId: string;
  clubName: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
  position: number;
}

export interface MatchResult {
  matchday: number;
  homeTeamId: string;
  awayTeamId: string;
  homeGoals: number;
  awayGoals: number;
  playerPerformance?: MatchPerformance;
}

export interface MatchPerformance {
  rating: number;          // 1-10
  goals: number;
  assists: number;
  minutesPlayed: number;
  shots: number;
  passAccuracy: number;
  dribbles: number;
  tackles: number;
}

// ─── Match ───────────────────────────────────────────────────────────────────

export interface MatchConfig {
  homeTeam: Club;
  awayTeam: Club;
  playerCharacter: PlayerCharacter;
  competition: string;
  matchday: number;
}

export type MatchActionType = 'shot' | 'pass' | 'dribble' | 'tackle' | 'header';

export interface MatchAction {
  type: MatchActionType;
  attacker: SquadPlayer;
  defender: SquadPlayer;
  context: ActionContext;
}

export interface ActionContext {
  minute: number;
  score: { home: number; away: number };
  isHomeTeam: boolean;
}

export type ActionOutcome = 'goal' | 'save' | 'miss' | 'intercept' | 'foul' | 'completed';

export interface ActionResult {
  success: boolean;
  outcome: ActionOutcome;
  xpGained: number;
  ratingImpact: number;
}

export type PlayerInputTiming = 'perfect' | 'good' | 'miss';

export interface PlayerInput {
  timing: PlayerInputTiming;
}

// ─── Transferts ──────────────────────────────────────────────────────────────

export type TransferWindow = 'summer' | 'winter';

export interface TransferOffer {
  id: string;
  fromClub: Club;
  salary: number;
  contractDuration: number; // en saisons
  signingBonus: number;
  division: Division;
  tier: ClubTier;
}

export interface TransferResult {
  success: boolean;
  newClub: Club;
  newContract: Contract;
}

// ─── Événements Aléatoires ───────────────────────────────────────────────────

export type EventCategory = 'financial' | 'physical' | 'social' | 'relational';

export interface RandomEvent {
  id: string;
  category: EventCategory;
  title: string;
  description: string;
  effects: EventEffects;
  choices?: EventChoice[];
}

export interface EventEffects {
  money?: number;
  fitness?: number;
  popularity?: number;
  coachRelation?: number;
  teamRelation?: number;
  injury?: InjuryRisk;
}

export interface InjuryRisk {
  probability: number;
  type: InjuryType;
  severity: 'minor' | 'moderate' | 'severe';
}

export interface EventChoice {
  text: string;
  effects: EventEffects;
}

// ─── Entraînement ────────────────────────────────────────────────────────────

export type TrainingIntensity = 'low' | 'medium' | 'high';

export type TrainingSkill = 'pace' | 'shooting' | 'passing' | 'dribbling' | 'defending' | 'physical';

export interface TrainingSession {
  skill: TrainingSkill;
  intensity: TrainingIntensity;
  isRehabilitation: boolean;
}

export interface TrainingResult {
  skill: TrainingSkill;
  previousValue: number;
  newValue: number;
  gain: number;
}

// ─── Résultats du Système Temporel ───────────────────────────────────────────

export interface DayActivity {
  type: 'training' | 'rest' | 'match' | 'event';
  description: string;
}

export interface DayResult {
  date: GameDate;
  events: RandomEvent[];
  isMatchDay: boolean;
  activities: DayActivity[];
}

export interface WeekSummary {
  startDate: GameDate;
  endDate: GameDate;
  events: RandomEvent[];
  trainingResults: TrainingResult[];
  matchDay: GameDate | null;
}

// ─── État Global du Jeu ──────────────────────────────────────────────────────

export interface PlayerSeasonStats {
  matchesPlayed: number;
  goals: number;
  assists: number;
  shots: number;
  dribbles: number;
  tackles: number;
  avgRating: number;
  totalRating: number; // sum of all ratings (for calculating avg)
  cleanSheets: number; // for GK
}

export interface PlayerCareerStats {
  season: PlayerSeasonStats;
  allTime: PlayerSeasonStats;
  clGoals: number;  // Compteur de buts en Ligue des Champions (carrière)
  seasonHistory: SeasonHistoryEntry[];
}

export interface SeasonHistoryEntry {
  season: number;
  clubName: string;
  clubId: string;
  goals: number;
  assists: number;
  matchesPlayed: number;
  avgRating: number;
}

export interface OwnedItem {
  id: string;
  name: string;
  category: 'house' | 'car' | 'jewelry' | 'fashion' | 'yacht' | 'jet';
  price: number;
  emoji: string;
  purchasedDate: GameDate;
}

// ─── Relations Amoureuses ────────────────────────────────────────────────────

export type RelationshipStatus = 'dating' | 'engaged' | 'married' | 'broken_up';

export type RelationshipAction = 'gift' | 'travel' | 'intimacy' | 'proposal' | 'wedding';

export interface Relationship {
  womanId: string;
  womanName: string;
  status: RelationshipStatus;
  love: number;           // 0-100, niveau d'amour/affection
  startDate: GameDate;
  lastInteraction: GameDate;
  giftsGiven: number;
  tripsCount: number;
  intimacyCount: number;
}

export interface RelationshipHistoryEntry {
  womanId: string;
  womanName: string;
  status: 'broken_up' | 'married';
  startDate: GameDate;
  endDate: GameDate;
}

export interface RelationshipState {
  current: Relationship | null;
  history: RelationshipHistoryEntry[];
}

// ─── Relations Célébrités ────────────────────────────────────────────────────

export interface CelebrityRelation {
  celebrityId: string;
  name: string;
  level: number;          // 0-100, niveau d'amitié
  isFollowing: boolean;   // suit sur Instagram
  interactions: number;   // nombre d'interactions
  lastInteraction: GameDate;
}

export interface CelebrityRelationsState {
  relations: CelebrityRelation[];
}

// ─── Sponsoring ──────────────────────────────────────────────────────────────

export interface SponsorContract {
  id: string;
  brand: string;
  emoji: string;
  monthlyPay: number;       // paiement mensuel en €
  startDate: GameDate;
  durationMonths: number;   // durée en mois
  monthsRemaining: number;
}

export interface LifestyleState {
  possessions: OwnedItem[];
  investments: Investment[];
  instagram: InstagramState;
  relationships: RelationshipState;
  celebrities: CelebrityRelationsState;
  sponsorContracts: SponsorContract[];
}

export interface Investment {
  id: string;
  name: string;
  type: 'real_estate' | 'stocks' | 'crypto' | 'business';
  emoji: string;
  investedAmount: number;
  currentValue: number;
  monthlyReturn: number; // percentage per month (can be negative for risky)
  risk: 'safe' | 'medium' | 'high';
  purchasedDate: GameDate;
}

export interface InstagramState {
  followers: number;
  posts: InstaPost[];
  weeklyPostDone: boolean;
}

export interface InstaPost {
  id: string;
  type: 'photo' | 'story' | 'reel';
  caption: string;
  likes: number;
  followersGained: number;
  date: GameDate;
  viral: boolean;
}

export interface GameState {
  version: string;
  player: PlayerCharacter;
  career: CareerState;
  time: TimeState;
  social: SocialState;
  finance: FinanceState;
  leagues: LeagueState[];
  saves: SaveMetadata;
  playerCareerStats: PlayerCareerStats;
  lifestyle: LifestyleState;
  championsLeague?: import('../systems/championsLeague/types').ChampionsLeagueState | null;
  nationalTeam?: import('../systems/career/NationalTeam').NationalTeamState | null;
}

export interface SaveMetadata {
  lastSaved: string; // ISO date string
  slot: number;
}

// ─── Sauvegarde ──────────────────────────────────────────────────────────────

export interface SaveSlot {
  slot: number;
  playerName: string;
  clubName: string;
  season: number;
  date: GameDate;
  lastSaved: Date;
  overallRating: number;
}
