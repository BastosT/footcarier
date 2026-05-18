/**
 * Phone — Écran téléphone avec disposition d'apps comme un vrai smartphone.
 * Apps : Messages, Instagram, Twitter/X, YouTube, Contacts.
 */

import { useState } from 'react';
import { useNavigation } from '../hooks/useNavigation';
import { useGameStore } from '../../store/gameStore';

type PhoneApp = 'home' | 'messages' | 'instagram' | 'twitter' | 'youtube';

export function Phone() {
  const { goHome } = useNavigation();
  const gameState = useGameStore((s) => s.gameState);
  const [currentApp, setCurrentApp] = useState<PhoneApp>('home');

  if (!gameState) return null;

  const instagram = gameState.lifestyle?.instagram ?? { followers: 1000, posts: [], weeklyPostDone: false };
  const youtube = gameState.lifestyle?.youtube ?? { subscribers: 0, videos: [], weeklyUploadDone: false, monthlyRevenue: 0 };

  const formatCount = (n: number): string => {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return `${n}`;
  };

  // App header with back button
  const AppHeader = ({ title, emoji }: { title: string; emoji: string }) => (
    <header className="bg-surface p-3 flex items-center gap-3 border-b border-surface-light/50">
      <button onClick={() => setCurrentApp('home')} className="text-primary-light text-sm">←</button>
      <span className="text-lg">{emoji}</span>
      <h1 className="text-sm font-bold text-text">{title}</h1>
    </header>
  );

  // ─── Home Screen (App Grid) ──────────────────────────────────────────────

  if (currentApp === 'home') {
    return (
      <div className="min-h-dvh flex flex-col bg-background">
        {/* Status bar */}
        <div className="flex items-center justify-between px-4 py-2 bg-background">
          <span className="text-[10px] text-text-muted">9:41</span>
          <button onClick={goHome} className="text-xs text-primary-light">Fermer</button>
        </div>

        {/* App grid */}
        <div className="flex-1 flex flex-col justify-center px-6 pb-20">
          <div className="grid grid-cols-4 gap-4">
            {/* Messages */}
            <button onClick={() => setCurrentApp('messages')} className="flex flex-col items-center gap-1 active:scale-90 transition-transform">
              <div className="w-14 h-14 bg-green-500 rounded-2xl flex items-center justify-center shadow-lg">
                <span className="text-2xl">💬</span>
              </div>
              <span className="text-[10px] text-text">Messages</span>
            </button>

            {/* Instagram */}
            <button onClick={() => setCurrentApp('instagram')} className="flex flex-col items-center gap-1 active:scale-90 transition-transform">
              <div className="w-14 h-14 bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 rounded-2xl flex items-center justify-center shadow-lg">
                <span className="text-2xl">📸</span>
              </div>
              <span className="text-[10px] text-text">Instagram</span>
            </button>

            {/* Twitter/X */}
            <button onClick={() => setCurrentApp('twitter')} className="flex flex-col items-center gap-1 active:scale-90 transition-transform">
              <div className="w-14 h-14 bg-black rounded-2xl flex items-center justify-center shadow-lg border border-surface-light">
                <span className="text-2xl font-bold text-white">𝕏</span>
              </div>
              <span className="text-[10px] text-text">X</span>
            </button>

            {/* YouTube */}
            <button onClick={() => setCurrentApp('youtube')} className="flex flex-col items-center gap-1 active:scale-90 transition-transform">
              <div className="w-14 h-14 bg-red-600 rounded-2xl flex items-center justify-center shadow-lg">
                <span className="text-2xl">▶️</span>
              </div>
              <span className="text-[10px] text-text">YouTube</span>
            </button>
          </div>

          {/* Quick stats below apps */}
          <div className="mt-8 bg-surface/50 rounded-2xl p-4 border border-surface-light/30">
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <p className="text-xs text-text-muted">📸 Insta</p>
                <p className="text-sm font-bold text-text">{formatCount(instagram.followers)}</p>
              </div>
              <div>
                <p className="text-xs text-text-muted">𝕏 Twitter</p>
                <p className="text-sm font-bold text-text">—</p>
              </div>
              <div>
                <p className="text-xs text-text-muted">▶️ YouTube</p>
                <p className="text-sm font-bold text-text">{formatCount(youtube.subscribers)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── Messages App ────────────────────────────────────────────────────────

  if (currentApp === 'messages') {
    return (
      <div className="min-h-dvh flex flex-col bg-background">
        <AppHeader title="Messages" emoji="💬" />
        <MessagesView />
      </div>
    );
  }

  // ─── Instagram App ───────────────────────────────────────────────────────

  if (currentApp === 'instagram') {
    return (
      <div className="min-h-dvh flex flex-col bg-background">
        <AppHeader title="Instagram" emoji="📸" />
        <InstagramView />
      </div>
    );
  }

  // ─── Twitter/X App ───────────────────────────────────────────────────────

  if (currentApp === 'twitter') {
    return (
      <div className="min-h-dvh flex flex-col bg-background">
        <AppHeader title="X (Twitter)" emoji="𝕏" />
        <TwitterSection />
      </div>
    );
  }

  // ─── YouTube App ─────────────────────────────────────────────────────────

  if (currentApp === 'youtube') {
    return (
      <div className="min-h-dvh flex flex-col bg-background">
        <AppHeader title="YouTube" emoji="▶️" />
        <YouTubeSection />
      </div>
    );
  }

  return null;
}

// ─── Messages View ───────────────────────────────────────────────────────────

type Contact = 'coach' | 'locker' | 'family' | 'agent';

interface ContactInfo {
  id: Contact;
  name: string;
  emoji: string;
  lastMessage: string;
}

function MessagesView() {
  const gameState = useGameStore((s) => s.gameState);
  const [activeContact, setActiveContact] = useState<Contact | null>(null);

  if (!gameState) return null;

  const { career } = gameState;

  const contacts: ContactInfo[] = [
    { id: 'coach', name: `Coach ${career.currentClub.name}`, emoji: '🧑‍💼', lastMessage: 'Touche pour discuter...' },
    { id: 'locker', name: 'Vestiaire', emoji: '👥', lastMessage: 'Groupe d\'équipe' },
    { id: 'family', name: 'Famille', emoji: '👨‍👩‍👦', lastMessage: 'On est fiers de toi !' },
    { id: 'agent', name: 'Agent', emoji: '🕴️', lastMessage: 'Des nouvelles du mercato...' },
  ];

  if (activeContact) {
    return <ChatView contact={activeContact} onBack={() => setActiveContact(null)} />;
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {contacts.map((contact) => (
        <button
          key={contact.id}
          onClick={() => setActiveContact(contact.id)}
          className="w-full flex items-center gap-3 p-4 border-b border-surface-light active:bg-surface transition-colors"
        >
          <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
            <span className="text-xl">{contact.emoji}</span>
          </div>
          <div className="flex-1 text-left">
            <p className="text-sm font-bold text-text">{contact.name}</p>
            <p className="text-xs text-text-muted truncate">{contact.lastMessage}</p>
          </div>
          <span className="text-text-muted text-xs">›</span>
        </button>
      ))}
    </div>
  );
}

// ─── Chat View ───────────────────────────────────────────────────────────────

const CHAT_DATA: Record<Contact, { messages: { text: string; effect?: number; effectType?: string; reply: string; requiresCaptain?: boolean; requiresNotCaptain?: boolean }[] }> = {
  coach: {
    messages: [
      // Général
      { text: '💪 Je suis motivé pour le prochain match', effect: 4, effectType: 'coachRelation', reply: 'J\'aime cette attitude ! Continue comme ça.' },
      { text: '🤝 Merci pour votre confiance coach', effect: 5, effectType: 'coachRelation', reply: 'Tu es important pour l\'équipe. Reste concentré.' },
      { text: '📈 Comment m\'améliorer ?', effect: 3, effectType: 'coachRelation', reply: 'Travaille ta condition et ta régularité. Les détails font la différence.' },
      // Demandes
      { text: '🙏 Demander plus de temps de jeu', effect: -3, effectType: 'coachRelation', reply: 'Je note. Prouve-le à l\'entraînement et en match.' },
      { text: '🔄 Je veux être transféré', effect: -10, effectType: 'coachRelation', reply: 'C\'est décevant. On en reparlera au mercato si tu insistes.' },
      { text: '😤 Pas d\'accord avec vos choix tactiques', effect: -7, effectType: 'coachRelation', reply: 'Je décide ici. Concentre-toi sur ton jeu, pas sur le mien.' },
      // Tactique
      { text: '📋 Quelle est la tactique pour le prochain match ?', effect: 2, effectType: 'coachRelation', reply: 'On va jouer en 4-3-3 offensif. Ton rôle sera clé dans la transition.' },
      { text: '🎯 Je veux jouer plus haut sur le terrain', effect: -2, effectType: 'coachRelation', reply: 'On verra selon l\'adversaire. Pour l\'instant, reste discipliné.' },
      { text: '🛡️ Je peux aider en défense aussi', effect: 4, effectType: 'coachRelation', reply: 'Bonne mentalité ! Un joueur complet, c\'est ce qu\'il me faut.' },
      // Repos
      { text: '🧘 J\'ai besoin d\'un jour de repos', effect: -1, effectType: 'coachRelation', reply: 'OK, prends demain. Mais je te veux à 100% après.' },
      { text: '💊 Je me sens un peu fatigué', effect: 1, effectType: 'coachRelation', reply: 'Va voir le kiné. Ta santé passe avant tout.' },
      // Capitanat
      { text: '©️ Je veux être capitaine', effect: -5, effectType: 'coachRelation', reply: 'Le brassard se mérite. Montre l\'exemple au quotidien et on en reparle.', requiresNotCaptain: true },
      { text: '©️ Merci pour le brassard, je ne vous décevrai pas', effect: 6, effectType: 'coachRelation', reply: 'Tu le mérites. Montre l\'exemple et guide cette équipe.', requiresCaptain: true },
      { text: '📣 En tant que capitaine, je propose un meeting d\'équipe', effect: 3, effectType: 'coachRelation', reply: 'Bonne initiative. Organise ça, je te fais confiance.', requiresCaptain: true },
    ],
  },
  locker: {
    messages: [
      // Général
      { text: '🎉 Bien joué les gars !', effect: 3, effectType: 'teamMorale', reply: 'Merci frérot ! On est une équipe 💪' },
      { text: '💪 On va gagner le prochain match', effect: 2, effectType: 'teamMorale', reply: 'Ouais ! On est chauds 🔥' },
      { text: '🍕 Qui veut sortir ce soir ?', effect: 4, effectType: 'teamMorale', reply: 'Moi ! On se retrouve au resto 🍝' },
      { text: '🤝 On est ensemble, quoi qu\'il arrive', effect: 5, effectType: 'teamMorale', reply: 'Toujours ! Un pour tous 🤜🤛' },
      { text: '⚽ Qui veut s\'entraîner en plus ?', effect: 3, effectType: 'teamMorale', reply: 'Je suis partant ! Demain après l\'entraînement ?' },
      { text: '😤 Faut se réveiller les gars', effect: -2, effectType: 'teamMorale', reply: 'Calme-toi... on fait ce qu\'on peut.' },
      // Social
      { text: '🎮 Soirée FIFA chez moi ce soir ?', effect: 4, effectType: 'teamMorale', reply: 'Grave ! J\'amène les manettes 🎮' },
      { text: '🎂 Joyeux anniversaire au vestiaire !', effect: 3, effectType: 'teamMorale', reply: 'Merci bro ! On fête ça après l\'entraînement 🎉' },
      { text: '🏖️ On organise un week-end team building ?', effect: 5, effectType: 'teamMorale', reply: 'Trop bien ! Paintball ou karting ? 🏎️' },
      // Conflits
      { text: '🤫 Y\'a des tensions dans le vestiaire ?', effect: -1, effectType: 'teamMorale', reply: 'Un peu entre certains... Rien de grave pour l\'instant.' },
      { text: '🕊️ Faut qu\'on règle les problèmes entre nous', effect: 3, effectType: 'teamMorale', reply: 'T\'as raison. On en parle au prochain repas d\'équipe.' },
      // Capitaine
      { text: '©️ Les gars, on doit se serrer les coudes !', effect: 7, effectType: 'teamMorale', reply: '🫡 Oui capitaine ! On te suit !', requiresCaptain: true },
      { text: '📢 Discours de motivation avant le match', effect: 8, effectType: 'teamMorale', reply: '🔥🔥🔥 ON EST PRÊTS ! ALLEZ LES GARS !!!', requiresCaptain: true },
      { text: '🛡️ En tant que capitaine, je prends la responsabilité', effect: 6, effectType: 'teamMorale', reply: 'Respect capitaine. On sait qu\'on peut compter sur toi 💪', requiresCaptain: true },
      { text: '⚔️ Ce soir on se bat pour le maillot !', effect: 7, effectType: 'teamMorale', reply: 'ALLEZ ! Pour le club, pour nous ! ⚽🔥', requiresCaptain: true },
      { text: '🤝 Résoudre un conflit entre coéquipiers', effect: 5, effectType: 'teamMorale', reply: 'Merci d\'avoir géré ça capitaine. L\'ambiance est meilleure maintenant.', requiresCaptain: true },
    ],
  },
  family: {
    messages: [
      { text: '❤️ Vous me manquez', reply: 'Tu nous manques aussi ! On regarde tous tes matchs à la télé 📺' },
      { text: '🏠 Je passe ce week-end', reply: 'Super ! Maman prépare ton plat préféré 🍲' },
      { text: '🎓 Tout va bien chez vous ?', reply: 'Oui ! Ton petit frère a eu son bac ! 🎉' },
      { text: '💰 J\'ai envoyé de l\'argent', reply: 'Merci mon fils, tu es trop généreux ❤️' },
      { text: '📺 Vous avez vu le match ?', reply: 'Oui !! On a crié quand tu as touché le ballon 😂' },
      { text: '🎄 On se voit pour les fêtes ?', reply: 'Évidemment ! Toute la famille sera là 🎄❤️' },
      { text: '📸 Je vous envoie des photos du stade', reply: 'Waouh c\'est immense ! On est tellement fiers 🥹' },
    ],
  },
  agent: {
    messages: [
      { text: '📋 Des clubs intéressés ?', reply: '__DYNAMIC_CLUBS__' },
      { text: '💰 Je veux une augmentation', reply: 'Je vais en parler au club. Avec tes stats actuelles, c\'est jouable.' },
      { text: '🌍 Je veux jouer à l\'étranger', reply: 'Intéressant. Je vais contacter mes réseaux.' },
      { text: '📰 Qu\'est-ce qu\'on dit de moi ?', reply: 'La presse parle de toi en bien. Ta cote monte !' },
      { text: '🤝 Merci pour ton travail', reply: 'C\'est mon job ! On va faire de grandes choses ensemble.' },
      { text: '📊 Quelle est ma valeur marchande ?', reply: '__DYNAMIC_VALUE__' },
      { text: '🎙️ Des opportunités de sponsoring ?', reply: 'J\'ai quelques pistes. Ta visibilité sur les réseaux aide beaucoup.' },
      { text: '🔄 Je veux changer d\'agent', reply: '__DYNAMIC_CHANGE_AGENT__' },
    ],
  },
};

function ChatView({ contact, onBack }: { contact: Contact; onBack: () => void }) {
  const gameState = useGameStore((s) => s.gameState);
  const [conversation, setConversation] = useState<{ from: 'player' | 'other'; text: string }[]>([]);
  const [showOptions, setShowOptions] = useState(true);

  if (!gameState) return null;

  const { career, social } = gameState;
  const isCaptain = career.isCaptain ?? false;

  // Filter messages based on captain status
  const allMessages = CHAT_DATA[contact].messages;
  const chatMessages = allMessages.filter((msg) => {
    if (msg.requiresCaptain && !isCaptain) return false;
    if (msg.requiresNotCaptain && isCaptain) return false;
    return true;
  });

  const contactNames: Record<Contact, string> = {
    coach: `Coach ${career.currentClub.name}`,
    locker: 'Vestiaire',
    family: 'Famille',
    agent: gameState.agent?.currentAgent.name ?? 'Agent',
  };
  const contactEmojis: Record<Contact, string> = { coach: '🧑‍💼', locker: '👥', family: '👨‍👩‍👦', agent: gameState.agent?.currentAgent.emoji ?? '🕴️' };

  const getRelationInfo = () => {
    if (contact === 'coach') return `Relation : ${social.coachRelation}/100${isCaptain ? ' • ©️ Capitaine' : ''}`;
    if (contact === 'locker') return `Ambiance : ${social.teamAmbiance ?? 50}/100${isCaptain ? ' • ©️ Capitaine' : ''}`;
    return '';
  };

  // Check if player can become captain (coachRelation >= 70 && teamRelation >= 60)
  const canBecomeCaptain = !isCaptain && social.coachRelation >= 70 && (social.teamRelation ?? 50) >= 60;

  const handleSend = (msg: typeof allMessages[0]) => {
    setConversation((prev) => [...prev, { from: 'player', text: msg.text }]);
    setShowOptions(false);

    // Special case: asking for captaincy
    const isAskingCaptain = msg.text.includes('Je veux être capitaine');

    setTimeout(() => {
      let replyText = msg.reply;

      // Dynamic agent replies
      if (contact === 'agent' && replyText === '__DYNAMIC_CLUBS__') {
        const state = useGameStore.getState();
        if (state.gameState?.agent) {
          const agent = state.gameState.agent;
          // Generate interested clubs
          const seed = state.gameState.time.currentDate.month * 100 + state.gameState.time.currentDate.day;
          let s = seed;
          const rand = () => { s = (s * 1664525 + 1013904223) & 0xFFFFFFFF; return (s >>> 0) / 0xFFFFFFFF; };

          const clubs = agent.interestedClubs.length > 0
            ? agent.interestedClubs
            : ['Aucun club pour le moment'];

          if (clubs[0] === 'Aucun club pour le moment') {
            replyText = `Pour l'instant, pas de clubs intéressés. Continue à performer et ça viendra. Mon réseau est ${agent.currentAgent.networkLevel <= 2 ? 'limité' : 'étendu'}.`;
          } else {
            replyText = `J'ai eu des contacts avec : ${clubs.join(', ')}. ${agent.currentAgent.tier === 'elite' ? 'Ils sont très chauds !' : 'On verra ce que ça donne au mercato.'}`;
          }
        } else {
          replyText = 'Je sonde le marché. Continue à performer.';
        }
      } else if (contact === 'agent' && replyText === '__DYNAMIC_VALUE__') {
        const state = useGameStore.getState();
        if (state.gameState) {
          const ovr = state.gameState.player.overallRating;
          const age = state.gameState.player.age;
          const value = Math.round(Math.pow(ovr / 60, 3) * 5_000_000 * (age <= 27 ? 1.5 : age <= 30 ? 1.2 : 0.8) / 100000) * 100000;
          const formatted = value >= 1_000_000 ? `${(value / 1_000_000).toFixed(1)}M€` : `${Math.round(value / 1000)}K€`;
          replyText = `Ta valeur marchande est estimée à ${formatted}. ${ovr >= 80 ? 'Les gros clubs te surveillent !' : ovr >= 70 ? 'Ça monte bien.' : 'Continue à progresser.'}`;
        }
      } else if (contact === 'agent' && replyText === '__DYNAMIC_CHANGE_AGENT__') {
        replyText = 'Tu veux changer d\'agent ? Va dans Joueur → Transferts pour voir les agents disponibles.';
      }

      // If asking for captain and eligible, grant it
      if (isAskingCaptain && canBecomeCaptain) {
        replyText = '©️ Tu sais quoi ? Tu le mérites. À partir de maintenant, tu es le capitaine de cette équipe. Montre l\'exemple !';
        const state = useGameStore.getState();
        if (state.gameState) {
          useGameStore.setState({
            gameState: {
              ...state.gameState,
              career: { ...state.gameState.career, isCaptain: true },
              social: {
                ...state.gameState.social,
                coachRelation: Math.min(100, state.gameState.social.coachRelation + 5),
                teamRelation: Math.min(100, (state.gameState.social.teamRelation ?? 50) + 5),
              },
            },
          });
        }
      } else {
        // Apply normal effect
        if (msg.effect && msg.effectType) {
          const state = useGameStore.getState();
          if (state.gameState) {
            const gs = state.gameState;
            if (msg.effectType === 'coachRelation') {
              const newVal = Math.max(0, Math.min(100, gs.social.coachRelation + msg.effect));
              useGameStore.setState({ gameState: { ...gs, social: { ...gs.social, coachRelation: newVal } } });
            } else if (msg.effectType === 'teamMorale') {
              const newVal = Math.max(0, Math.min(100, (gs.social.teamAmbiance ?? 50) + msg.effect));
              useGameStore.setState({ gameState: { ...gs, social: { ...gs.social, teamAmbiance: newVal } } });
            }
          }
        }
      }

      setConversation((prev) => [...prev, { from: 'other', text: replyText }]);
      setTimeout(() => setShowOptions(true), 500);
    }, 800);
  };

  return (
    <div className="flex-1 flex flex-col">
      {/* Chat header */}
      <div className="p-3 flex items-center gap-3 border-b border-surface-light bg-surface">
        <button onClick={onBack} className="text-primary-light text-sm">←</button>
        <div className="w-9 h-9 bg-primary/20 rounded-full flex items-center justify-center">
          <span className="text-base">{contactEmojis[contact]}</span>
        </div>
        <div>
          <p className="text-sm font-bold text-text">{contactNames[contact]}</p>
          {getRelationInfo() && <p className="text-xs text-text-muted">{getRelationInfo()}</p>}
        </div>
      </div>

      {/* Conversation */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {/* Captain status hint */}
        {contact === 'coach' && !isCaptain && canBecomeCaptain && (
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-2.5 text-center mb-2">
            <p className="text-xs text-yellow-400 font-medium">©️ Le coach est prêt à te donner le brassard ! Demande-le.</p>
          </div>
        )}
        {contact === 'coach' && !isCaptain && !canBecomeCaptain && (
          <div className="bg-surface rounded-xl p-2.5 text-center mb-2">
            <p className="text-xs text-text-muted">©️ Capitanat : Coach {social.coachRelation}/70 • Équipe {social.teamRelation ?? 50}/60</p>
          </div>
        )}

        {/* Initial message */}
        <div className="flex gap-2">
          <div className="w-7 h-7 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-xs">{contactEmojis[contact]}</span>
          </div>
          <div className="bg-surface rounded-2xl rounded-tl-sm p-3 max-w-[80%]">
            <p className="text-sm text-text">
              {contact === 'coach' && (isCaptain ? 'Salut capitaine ! Qu\'est-ce que je peux faire pour toi ?' : 'Salut ! Besoin de quelque chose ?')}
              {contact === 'locker' && (isCaptain ? 'Yo capitaine ! On t\'écoute 🫡' : 'Yo ! Quoi de neuf ? 🤙')}
              {contact === 'family' && 'Coucou mon fils ! Comment ça va ? ❤️'}
              {contact === 'agent' && 'Salut champion. Des questions ?'}
            </p>
          </div>
        </div>

        {conversation.map((msg, idx) => (
          <div key={idx} className={`flex gap-2 ${msg.from === 'player' ? 'justify-end' : ''}`}>
            {msg.from === 'other' && (
              <div className="w-7 h-7 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-xs">{contactEmojis[contact]}</span>
              </div>
            )}
            <div className={`rounded-2xl p-3 max-w-[80%] ${
              msg.from === 'player'
                ? 'bg-primary text-white rounded-tr-sm'
                : 'bg-surface rounded-tl-sm'
            }`}>
              <p className={`text-sm ${msg.from === 'player' ? 'text-white' : 'text-text'}`}>{msg.text}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Message options */}
      {showOptions && (
        <div className="p-3 border-t border-surface-light bg-background max-h-44 overflow-y-auto">
          <div className="grid grid-cols-1 gap-1.5">
            {chatMessages.map((msg, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(msg)}
                className="p-2.5 bg-surface rounded-xl text-left active:scale-[0.98] transition-all border border-surface-light"
              >
                <p className="text-xs text-text">{msg.text}</p>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Instagram View ──────────────────────────────────────────────────────────

function InstagramView() {
  const gameState = useGameStore((s) => s.gameState);
  const [postMessage, setPostMessage] = useState<string | null>(null);

  if (!gameState) return null;

  const instagram = gameState.lifestyle?.instagram ?? { followers: 1000, posts: [], weeklyPostDone: false };
  const { player, career } = gameState;

  const formatFollowers = (n: number): string => {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return `${n}`;
  };

  const postOptions = [
    { type: 'photo' as const, caption: '📸 Photo à l\'entraînement', emoji: '🏟️', baseGain: { min: 50, max: 200 } },
    { type: 'photo' as const, caption: '🏆 Selfie avec le trophée', emoji: '🤳', baseGain: { min: 100, max: 400 } },
    { type: 'photo' as const, caption: '👟 Nouvelle paire de crampons', emoji: '👟', baseGain: { min: 30, max: 150 } },
    { type: 'story' as const, caption: '🎬 Story jour de match', emoji: '📱', baseGain: { min: 20, max: 100 } },
    { type: 'story' as const, caption: '🍽️ Story au restaurant', emoji: '🍕', baseGain: { min: 10, max: 80 } },
    { type: 'reel' as const, caption: '🎥 Reel skills à l\'entraînement', emoji: '⚽', baseGain: { min: 200, max: 800 } },
    { type: 'reel' as const, caption: '🎥 Reel lifestyle', emoji: '🚗', baseGain: { min: 100, max: 500 } },
  ];

  const handleAcceptSponsoring = (dm: { id: string; brand: string; emoji: string; monthlyPay: number; durationMonths: number }) => {
    const state = useGameStore.getState();
    if (!state.gameState) return;

    const existing = state.gameState.lifestyle.sponsorContracts ?? [];
    if (existing.some((c) => c.id === dm.id)) {
      setPostMessage(`⚠️ Tu as déjà un contrat avec ${dm.brand}`);
      setTimeout(() => setPostMessage(null), 2000);
      return;
    }

    const newContract = {
      id: dm.id,
      brand: dm.brand,
      emoji: dm.emoji,
      monthlyPay: dm.monthlyPay,
      startDate: state.gameState.time.currentDate,
      durationMonths: dm.durationMonths,
      monthsRemaining: dm.durationMonths,
    };

    useGameStore.setState({
      gameState: {
        ...state.gameState,
        lifestyle: {
          ...state.gameState.lifestyle,
          sponsorContracts: [...existing, newContract],
        },
      },
    });

    setPostMessage(`✅ Contrat signé avec ${dm.brand} ! +${dm.monthlyPay.toLocaleString()}€/mois`);
    setTimeout(() => setPostMessage(null), 4000);
  };

  const handlePost = (option: typeof postOptions[0]) => {
    const state = useGameStore.getState();
    if (!state.gameState) return;

    const ig = state.gameState.lifestyle.instagram ?? { followers: 1000, posts: [], weeklyPostDone: false };

    if (ig.weeklyPostDone) {
      setPostMessage('⏳ Tu as déjà posté cette semaine !');
      setTimeout(() => setPostMessage(null), 3000);
      return;
    }

    // Calculate followers gained
    const rng = Math.random;
    const baseGain = option.baseGain.min + Math.floor(rng() * (option.baseGain.max - option.baseGain.min));

    // Bonus based on club tier and player rating
    const tierMultiplier = career.currentClub.tier === 'big' ? 3 : career.currentClub.tier === 'medium' ? 1.5 : 1;
    const ratingBonus = Math.max(0, Math.floor((player.overallRating - 60) * 5));

    // Viral chance: 10% for reels, 5% for photos, 2% for stories
    const viralChance = option.type === 'reel' ? 0.10 : option.type === 'photo' ? 0.05 : 0.02;
    const isViral = rng() < viralChance;
    const viralMultiplier = isViral ? 5 + Math.floor(rng() * 5) : 1; // 5x-10x if viral

    const followersGained = Math.max(1, Math.round((baseGain + ratingBonus) * tierMultiplier * viralMultiplier));
    const likes = Math.round(followersGained * (3 + rng() * 5));

    const newPost = {
      id: `post-${Date.now()}`,
      type: option.type,
      caption: option.caption,
      likes,
      followersGained,
      date: state.gameState.time.currentDate,
      viral: isViral,
    };

    const newFollowers = ig.followers + followersGained;

    // Re-read fresh state to avoid race conditions
    const freshState = useGameStore.getState();
    if (!freshState.gameState) return;
    const freshIg = freshState.gameState.lifestyle.instagram ?? ig;

    useGameStore.setState({
      gameState: {
        ...freshState.gameState,
        lifestyle: {
          ...freshState.gameState.lifestyle,
          instagram: {
            ...freshIg,
            followers: freshIg.followers + followersGained,
            posts: [newPost, ...freshIg.posts].slice(0, 50),
            weeklyPostDone: true,
          },
        },
      },
    });

    const actualNewFollowers = freshIg.followers + followersGained;

    if (isViral) {
      setPostMessage(`🔥 POST VIRAL ! +${followersGained} abonnés ! (${formatFollowers(actualNewFollowers)} total)`);
    } else {
      setPostMessage(`📸 Posté ! +${followersGained} abonnés (${formatFollowers(actualNewFollowers)} total)`);
    }
    setTimeout(() => setPostMessage(null), 4000);
  };

  return (
    <div className="flex-1 overflow-y-auto pb-20">
      {/* Instagram header */}
      <div className="p-4 bg-gradient-to-r from-purple-600/20 to-pink-500/20 border-b border-surface-light">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
              <span className="text-2xl">📸</span>
            </div>
            <div>
              <p className="text-sm font-bold text-text">@{player.firstName.toLowerCase()}{player.lastName.toLowerCase()}</p>
              <p className="text-xs text-text-muted">{career.currentClub.name}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xl font-black text-text">{formatFollowers(instagram.followers)}</p>
            <p className="text-xs text-text-muted">abonnés</p>
          </div>
        </div>
      </div>

      {/* Post message */}
      {postMessage && (
        <div className="mx-4 mt-3 p-3 bg-green-500/20 border border-green-500/40 rounded-xl text-center">
          <p className="text-sm text-green-400 font-medium">{postMessage}</p>
        </div>
      )}

      {/* Post options */}
      <div className="p-4">
        <h3 className="text-sm font-bold text-text mb-3">
          {instagram.weeklyPostDone ? '⏳ Prochain post la semaine prochaine' : '📸 Publier (1x/semaine)'}
        </h3>
        <div className="space-y-2">
          {postOptions.map((option, idx) => (
            <button
              key={idx}
              onClick={() => handlePost(option)}
              disabled={instagram.weeklyPostDone}
              className={`w-full p-3 rounded-xl flex items-center gap-3 border transition-all ${
                instagram.weeklyPostDone
                  ? 'bg-surface/50 border-surface-light opacity-50'
                  : 'bg-surface border-surface-light active:scale-[0.98]'
              }`}
            >
              <span className="text-2xl">{option.emoji}</span>
              <div className="flex-1 text-left">
                <p className="text-sm text-text">{option.caption}</p>
                <p className="text-xs text-text-muted">
                  {option.type === 'reel' ? '🎥 Reel' : option.type === 'story' ? '📱 Story' : '📷 Photo'}
                  {' • '}+{option.baseGain.min}-{option.baseGain.max} abonnés
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Recent posts */}
      {/* Recent posts */}
      {instagram.posts.length > 0 && (
        <div className="p-4 pt-0">
          <h3 className="text-sm font-bold text-text mb-3">📋 Derniers posts</h3>
          <div className="space-y-2">
            {instagram.posts.slice(0, 5).map((post) => (
              <div key={post.id} className="bg-surface rounded-xl p-3 border border-surface-light">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-text">{post.caption}</p>
                  {post.viral && <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full">🔥 Viral</span>}
                </div>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-xs text-text-muted">❤️ {post.likes.toLocaleString()}</span>
                  <span className="text-xs text-green-400">+{post.followersGained} abonnés</span>
                  <span className="text-xs text-text-muted">{post.date.day}/{post.date.month}</span>
                </div>
                {/* Random fan comments */}
                <div className="mt-2 space-y-1">
                  {generateFanComments(post, player.lastName).map((comment, i) => (
                    <p key={i} className="text-xs text-text-muted">
                      <span className="font-medium text-text">{comment.user}</span> {comment.text}
                    </p>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Milestones */}
      <div className="p-4 pt-0">
        <h3 className="text-sm font-bold text-text mb-3">🎯 Paliers</h3>
        <div className="space-y-2">
          {FOLLOWER_MILESTONES.map((milestone) => {
            const reached = instagram.followers >= milestone.count;
            return (
              <div key={milestone.count} className={`flex items-center gap-3 p-2 rounded-lg ${reached ? 'bg-green-500/10' : 'bg-surface'}`}>
                <span className="text-lg">{reached ? '✅' : '🔒'}</span>
                <div className="flex-1">
                  <p className={`text-xs font-medium ${reached ? 'text-green-400' : 'text-text-muted'}`}>
                    {formatFollowers(milestone.count)} abonnés
                  </p>
                  <p className="text-xs text-text-muted">{milestone.reward}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Brand DMs / Sponsoring */}
      <div className="p-4 pt-0">
        <h3 className="text-sm font-bold text-text mb-3">📩 Offres de sponsoring</h3>
        {instagram.followers >= 5000 ? (
          <div className="space-y-2">
            {generateBrandDMs(instagram.followers)
              .filter((dm) => {
                // Hide refused offers
                const refused = (gameState as any).refusedSponsors ?? [];
                if (refused.includes(dm.id)) return false;
                // Hide already signed
                if ((gameState.lifestyle.sponsorContracts ?? []).some((c) => c.id === dm.id)) return false;
                return true;
              })
              .map((dm) => {
              return (
                <div key={dm.id} className="bg-surface rounded-xl p-3 border border-surface-light">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm">{dm.emoji}</span>
                    <p className="text-xs font-bold text-text">{dm.brand}</p>
                    <span className="text-[10px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded">Sponsorisé</span>
                  </div>
                  <p className="text-xs text-text-muted">{dm.message}</p>
                  <p className="text-xs text-green-400 mt-1">💰 {dm.offer} ({dm.durationMonths} mois)</p>
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => handleAcceptSponsoring(dm)}
                        className="flex-1 py-1.5 bg-green-500/20 text-green-400 text-xs font-bold rounded-lg border border-green-500/40 active:scale-95"
                      >
                        ✅ Accepter
                      </button>
                      <button
                        onClick={() => {
                          // Track refused sponsor so it disappears
                          const s = useGameStore.getState();
                          if (s.gameState) {
                            const refused = (s.gameState as any).refusedSponsors ?? [];
                            useGameStore.setState({
                              gameState: { ...s.gameState, refusedSponsors: [...refused, dm.id] } as any,
                            });
                          }
                          setPostMessage(`❌ Offre de ${dm.brand} refusée`);
                          setTimeout(() => setPostMessage(null), 2000);
                        }}
                        className="flex-1 py-1.5 bg-red-500/20 text-red-400 text-xs font-bold rounded-lg border border-red-500/40 active:scale-95"
                      >
                        ❌ Refuser
                      </button>
                    </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-xs text-text-muted">Atteins 5K abonnés pour recevoir des offres de marques</p>
        )}
      </div>

      {/* Active sponsor contracts */}
      {(gameState.lifestyle.sponsorContracts ?? []).length > 0 && (
        <div className="p-4 pt-0">
          <h3 className="text-sm font-bold text-text mb-3">📋 Mes contrats de sponsoring</h3>
          <div className="space-y-2">
            {(gameState.lifestyle.sponsorContracts ?? []).map((contract) => (
              <div key={contract.id} className="bg-surface rounded-xl p-3 border border-surface-light">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{contract.emoji}</span>
                    <div>
                      <p className="text-xs font-bold text-text">{contract.brand}</p>
                      <p className="text-xs text-green-400">+{contract.monthlyPay.toLocaleString()}€/mois</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-text-muted">{contract.monthsRemaining} mois restants</p>
                  </div>
                </div>
              </div>
            ))}
            <div className="bg-green-500/10 rounded-lg p-2 text-center">
              <p className="text-xs text-green-400 font-medium">
                Total sponsoring : +{(gameState.lifestyle.sponsorContracts ?? []).reduce((sum, c) => sum + c.monthlyPay, 0).toLocaleString()}€/mois
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Feed — Other players */}
      <div className="p-4 pt-0">
        <h3 className="text-sm font-bold text-text mb-3">🌐 Feed</h3>
        <div className="space-y-3">
          {generateFeedPosts(career.currentClub.country).map((feedPost, idx) => (
            <div key={idx} className="bg-surface rounded-xl p-3 border border-surface-light">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 bg-primary/20 rounded-full flex items-center justify-center">
                  <span className="text-xs">⚽</span>
                </div>
                <p className="text-xs font-bold text-text">{feedPost.player}</p>
                <p className="text-xs text-text-muted">• {feedPost.club}</p>
              </div>
              <p className="text-sm text-text">{feedPost.caption}</p>
              <div className="flex items-center gap-3 mt-2">
                <span className="text-xs text-text-muted">❤️ {feedPost.likes.toLocaleString()}</span>
                <span className="text-xs text-text-muted">💬 {feedPost.comments}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Instagram Helpers ───────────────────────────────────────────────────────

const FOLLOWER_MILESTONES = [
  { count: 1000, reward: 'Début de carrière' },
  { count: 5000, reward: '🔓 Offres de marques débloquées' },
  { count: 10000, reward: '🔓 Badge vérifié' },
  { count: 50000, reward: '🔓 Partenariats premium' },
  { count: 100000, reward: '🔓 Statut influenceur' },
  { count: 500000, reward: '🔓 Contrats publicitaires' },
  { count: 1000000, reward: '🔓 Icône des réseaux' },
];

function generateFanComments(post: any, playerName: string): { user: string; text: string }[] {
  const comments = [
    { user: 'fan_foot_92', text: `🔥🔥🔥 ${playerName} le GOAT` },
    { user: 'soccer_lover', text: 'Trop fort ! 💪' },
    { user: 'ultras_paris', text: 'On est avec toi ! 🫶' },
    { user: 'football_daily', text: 'Quelle classe 👏' },
    { user: 'sport_news', text: 'Le futur Ballon d\'Or ? 🏆' },
    { user: 'maria_2003', text: '😍😍😍' },
    { user: 'coach_amateur', text: 'Quel talent ! Continue comme ça' },
    { user: 'hater_123', text: 'Surcoté...' },
  ];

  // Pick 2-3 random comments based on post id
  const seed = post.id.split('').reduce((s: number, c: string) => s + c.charCodeAt(0), 0);
  const count = 2 + (seed % 2);
  const selected: { user: string; text: string }[] = [];
  for (let i = 0; i < count; i++) {
    selected.push(comments[(seed + i * 3) % comments.length]);
  }
  return selected;
}

function generateBrandDMs(followers: number): { id: string; brand: string; emoji: string; message: string; offer: string; monthlyPay: number; minFollowers: number; durationMonths: number }[] {
  const allBrands = [
    { id: 'sp-nike', brand: 'Nike', emoji: '👟', message: 'On aimerait te proposer un partenariat...', offer: '2 000€/mois', monthlyPay: 2000, minFollowers: 5000, durationMonths: 12 },
    { id: 'sp-adidas', brand: 'Adidas', emoji: '⚽', message: 'Tu nous intéresses pour notre prochaine campagne', offer: '3 000€/mois', monthlyPay: 3000, minFollowers: 10000, durationMonths: 12 },
    { id: 'sp-puma', brand: 'Puma', emoji: '🐆', message: 'Collaboration possible ?', offer: '1 500€/mois', monthlyPay: 1500, minFollowers: 5000, durationMonths: 6 },
    { id: 'sp-hublot', brand: 'Hublot', emoji: '⌚', message: 'Ambassadeur de notre nouvelle collection ?', offer: '5 000€/mois', monthlyPay: 5000, minFollowers: 50000, durationMonths: 12 },
    { id: 'sp-gucci', brand: 'Gucci', emoji: '👔', message: 'On te veut pour notre défilé', offer: '8 000€/mois', monthlyPay: 8000, minFollowers: 100000, durationMonths: 12 },
    { id: 'sp-ea', brand: 'EA Sports', emoji: '🎮', message: 'Cover du prochain FC ?', offer: '15 000€/mois', monthlyPay: 15000, minFollowers: 500000, durationMonths: 12 },
    { id: 'sp-pepsi', brand: 'Pepsi', emoji: '🥤', message: 'Pub TV mondiale ?', offer: '25 000€/mois', monthlyPay: 25000, minFollowers: 1000000, durationMonths: 6 },
  ];

  return allBrands.filter((b) => followers >= b.minFollowers).slice(0, 5);
}

function generateFeedPosts(country: string): { player: string; club: string; caption: string; likes: number; comments: number }[] {
  const feedByCountry: Record<string, { player: string; club: string; caption: string }[]> = {
    france: [
      { player: 'K. Mbappé', club: 'PSG', caption: '⚡ Toujours plus vite, toujours plus haut' },
      { player: 'A. Griezmann', club: 'Atlético', caption: '🎮 Soirée Fortnite avec les potes' },
      { player: 'O. Dembélé', club: 'PSG', caption: '🏋️ No days off 💪' },
    ],
    england: [
      { player: 'E. Haaland', club: 'Man City', caption: '⚽ Another day, another goal' },
      { player: 'B. Saka', club: 'Arsenal', caption: '🌟 God is good 🙏' },
      { player: 'M. Salah', club: 'Liverpool', caption: '🏆 Never stop grinding' },
    ],
    spain: [
      { player: 'J. Bellingham', club: 'Real Madrid', caption: '🤍 Hala Madrid y nada más' },
      { player: 'L. Yamal', club: 'Barcelona', caption: '🔵🔴 Més que un club' },
      { player: 'A. Griezmann', club: 'Atlético', caption: '❤️🤍 Aúpa Atleti' },
    ],
    italy: [
      { player: 'L. Martínez', club: 'Inter', caption: '🖤💙 Forza Inter!' },
      { player: 'D. Vlahovic', club: 'Juventus', caption: '⚪⚫ Fino alla fine' },
      { player: 'R. Leão', club: 'AC Milan', caption: '🔴⚫ Rossoneri forever' },
    ],
    germany: [
      { player: 'H. Kane', club: 'Bayern', caption: '🔴 Mia san mia' },
      { player: 'F. Wirtz', club: 'Leverkusen', caption: '⚽ Living the dream' },
      { player: 'J. Musiala', club: 'Bayern', caption: '🇩🇪 Proud to represent' },
    ],
  };

  const posts = feedByCountry[country] ?? feedByCountry['france'];
  return posts.map((p) => ({
    ...p,
    likes: 50000 + Math.floor(Math.random() * 500000),
    comments: 200 + Math.floor(Math.random() * 5000),
  }));
}

// ─── Twitter/X Section ───────────────────────────────────────────────────────

const BEEF_SCENARIOS = [
  { rival: 'Marcus R.', rivalClub: 'Man United', message: 'Certains joueurs parlent trop et jouent peu... 🤷‍♂️', emoji: '🔥' },
  { rival: 'Neymar Jr', rivalClub: 'Al-Hilal', message: 'Le football européen n\'est plus ce qu\'il était...', emoji: '💀' },
  { rival: 'Zlatan', rivalClub: 'Retraité', message: 'Les jeunes d\'aujourd\'hui n\'ont aucun respect pour les légendes.', emoji: '🦁' },
  { rival: 'K. Benzema', rivalClub: 'Al-Ittihad', message: 'Ballon d\'Or ? Faut d\'abord gagner une Ligue des Champions...', emoji: '🏆' },
  { rival: 'J. Bellingham', rivalClub: 'Real Madrid', message: 'Trop de hype pour pas assez de trophées 🤔', emoji: '👀' },
  { rival: 'E. Haaland', rivalClub: 'Man City', message: 'Les stats c\'est bien, mais les titres c\'est mieux.', emoji: '🤖' },
  { rival: 'Vinícius Jr', rivalClub: 'Real Madrid', message: 'Y\'en a qui dansent plus qu\'ils ne marquent...', emoji: '💃' },
  { rival: 'B. Saka', rivalClub: 'Arsenal', message: 'Overrated. Change my mind.', emoji: '🧊' },
];

const POSITIVE_TWEETS = [
  'QUEL MATCH ! 🔥 @{player} est en feu cette saison !',
  '@{player} meilleur joueur du championnat, pas de débat. 🐐',
  'Encore un chef-d\'œuvre de @{player} ce week-end 🎨⚽',
  '@{player} c\'est le futur Ballon d\'Or, vous êtes pas prêts 🏆',
  'La performance de @{player} hier soir... INCROYABLE 🤯',
  '@{player} fait taire les haters match après match 💪',
  'Meilleur recrutement de la saison : @{player}. Point final.',
  '@{player} en mode Messi 2012, personne peut l\'arrêter 🚀',
];

const NEGATIVE_TWEETS = [
  '@{player} invisible ce week-end... Encore une fois 😴',
  'Surcoté. @{player} ne mérite pas sa place de titulaire.',
  '@{player} devrait se concentrer sur le terrain au lieu des réseaux...',
  'Transfert raté ? @{player} déçoit depuis le début de saison.',
];

function TwitterSection() {
  const gameState = useGameStore((s) => s.gameState);
  const [beefResponse, setBeefResponse] = useState<string | null>(null);

  if (!gameState) return null;

  const seasonStats = gameState.playerCareerStats?.season;
  const avgRating = seasonStats && seasonStats.matchesPlayed > 0
    ? seasonStats.totalRating / seasonStats.matchesPlayed
    : 0;
  const isPerforming = avgRating >= 7.0 || (seasonStats?.goals ?? 0) >= 5;
  const playerName = `${gameState.player.firstName} ${gameState.player.lastName}`;

  // Generate a beef scenario based on the current week (deterministic)
  const weekSeed = gameState.time.currentDate.year * 52 + Math.floor((gameState.time.currentDate.month * 30 + gameState.time.currentDate.day) / 7);
  const beefIdx = weekSeed % BEEF_SCENARIOS.length;
  const currentBeef = BEEF_SCENARIOS[beefIdx];

  // Generate performance tweets
  const tweetPool = isPerforming ? POSITIVE_TWEETS : NEGATIVE_TWEETS;
  const tweet1Idx = weekSeed % tweetPool.length;
  const tweet2Idx = (weekSeed + 3) % tweetPool.length;
  const tweets = [
    tweetPool[tweet1Idx].replace('{player}', playerName),
    tweetPool[tweet2Idx].replace('{player}', playerName),
  ];

  const handleBeefRespond = () => {
    // Responding to beef = controversy risk but popularity gain
    const state = useGameStore.getState();
    if (!state.gameState) return;

    const newControversy = (state.gameState.social.controversyCount ?? 0) + 1;
    useGameStore.setState({
      gameState: {
        ...state.gameState,
        social: {
          ...state.gameState.social,
          popularity: Math.min(100, state.gameState.social.popularity + 3),
          controversyCount: newControversy,
        },
      },
    });
    setBeefResponse(`🔥 Tu as répondu à ${currentBeef.rival} ! +3 popularité mais attention aux controverses...`);
    setTimeout(() => setBeefResponse(null), 4000);
  };

  const handleBeefIgnore = () => {
    // Ignoring = reputation gain
    const state = useGameStore.getState();
    if (!state.gameState) return;

    useGameStore.setState({
      gameState: {
        ...state.gameState,
        social: {
          ...state.gameState.social,
          reputation: Math.min(100, state.gameState.social.reputation + 2),
        },
      },
    });
    setBeefResponse(`🧘 Tu as ignoré ${currentBeef.rival}. +2 réputation. La classe.`);
    setTimeout(() => setBeefResponse(null), 3000);
  };

  return (
    <div className="p-4 pt-0">
      <h3 className="text-sm font-bold text-text mb-3">𝕏 Twitter / X</h3>

      {beefResponse && (
        <div className="bg-surface rounded-xl p-3 mb-3 text-center">
          <p className="text-xs text-text">{beefResponse}</p>
        </div>
      )}

      {/* Beef / Clash */}
      <div className="bg-surface rounded-xl p-3 border border-red-500/20 mb-3">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-lg">{currentBeef.emoji}</span>
          <div>
            <p className="text-xs font-bold text-text">{currentBeef.rival}</p>
            <p className="text-[10px] text-text-muted">{currentBeef.rivalClub}</p>
          </div>
          <span className="text-[10px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded ml-auto">Clash</span>
        </div>
        <p className="text-xs text-text mb-3">"{currentBeef.message}"</p>
        <div className="flex gap-2">
          <button
            onClick={handleBeefRespond}
            className="flex-1 py-1.5 bg-red-500/20 text-red-400 text-xs font-bold rounded-lg border border-red-500/30 active:scale-95"
          >
            🔥 Répondre
          </button>
          <button
            onClick={handleBeefIgnore}
            className="flex-1 py-1.5 bg-surface-light text-text-muted text-xs font-bold rounded-lg active:scale-95"
          >
            🧘 Ignorer
          </button>
        </div>
      </div>

      {/* Performance tweets */}
      <div className="space-y-2">
        {tweets.map((tweet, idx) => (
          <div key={idx} className="bg-surface rounded-xl p-3 border border-surface-light">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-6 h-6 bg-blue-500/20 rounded-full flex items-center justify-center">
                <span className="text-[10px]">𝕏</span>
              </div>
              <p className="text-[10px] font-bold text-text">
                {isPerforming ? ['@FootballDaily', '@LEquipe', '@BeinSports', '@RMCSport'][idx % 4] : ['@hater_foot', '@TrollFC', '@DebatFoot', '@ClashFoot'][idx % 4]}
              </p>
              <span className="text-[10px] text-text-muted">• {gameState.time.currentDate.day}/{gameState.time.currentDate.month}</span>
            </div>
            <p className="text-xs text-text">{tweet}</p>
            <div className="flex items-center gap-3 mt-2">
              <span className="text-[10px] text-text-muted">❤️ {(1000 + Math.floor(Math.random() * 50000)).toLocaleString()}</span>
              <span className="text-[10px] text-text-muted">🔁 {(100 + Math.floor(Math.random() * 5000)).toLocaleString()}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── YouTube / TikTok Section ────────────────────────────────────────────────

const VIDEO_OPTIONS = [
  { type: 'vlog' as const, title: '📹 Vlog journée type', emoji: '🎬', baseGain: { min: 100, max: 500 } },
  { type: 'challenge' as const, title: '🏆 Challenge football', emoji: '⚽', baseGain: { min: 200, max: 800 } },
  { type: 'skills' as const, title: '🎯 Tuto skills & dribbles', emoji: '🦶', baseGain: { min: 300, max: 1000 } },
  { type: 'gaming' as const, title: '🎮 Gaming session (FC 25)', emoji: '🎮', baseGain: { min: 150, max: 600 } },
  { type: 'podcast' as const, title: '🎙️ Podcast avec un invité', emoji: '🎧', baseGain: { min: 250, max: 900 } },
];

function YouTubeSection() {
  const gameState = useGameStore((s) => s.gameState);
  const [ytMessage, setYtMessage] = useState<string | null>(null);

  if (!gameState) return null;

  const youtube = gameState.lifestyle?.youtube ?? { subscribers: 0, videos: [], weeklyUploadDone: false, monthlyRevenue: 0 };
  const { player, career } = gameState;

  const formatSubs = (n: number): string => {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return `${n}`;
  };

  const handleUpload = (option: typeof VIDEO_OPTIONS[0]) => {
    const state = useGameStore.getState();
    if (!state.gameState) return;

    const yt = state.gameState.lifestyle.youtube ?? { subscribers: 0, videos: [], weeklyUploadDone: false, monthlyRevenue: 0 };

    if (yt.weeklyUploadDone) {
      setYtMessage('⏳ Tu as déjà posté cette semaine !');
      setTimeout(() => setYtMessage(null), 2000);
      return;
    }

    const rng = Math.random;
    const baseGain = option.baseGain.min + Math.floor(rng() * (option.baseGain.max - option.baseGain.min));

    // Bonus based on existing subscribers and player fame
    const fameMultiplier = career.currentClub.tier === 'big' ? 2.5 : career.currentClub.tier === 'medium' ? 1.5 : 1;
    const ratingBonus = Math.floor((player.overallRating - 50) * 3);

    // Viral chance: 8% for skills/challenges, 3% for others
    const viralChance = (option.type === 'skills' || option.type === 'challenge') ? 0.08 : 0.03;
    const isViral = rng() < viralChance;
    const viralMultiplier = isViral ? 8 + Math.floor(rng() * 7) : 1;

    const subscribersGained = Math.round((baseGain + ratingBonus) * fameMultiplier * viralMultiplier);
    const views = Math.round(subscribersGained * (5 + rng() * 15));

    const newVideo = {
      id: `yt-${Date.now()}`,
      type: option.type,
      title: option.title,
      views,
      subscribersGained,
      date: state.gameState.time.currentDate,
      viral: isViral,
    };

    const newSubscribers = yt.subscribers + subscribersGained;
    // Monthly revenue: ~1€ per 1000 subscribers
    const monthlyRevenue = Math.round(newSubscribers / 1000);

    useGameStore.setState({
      gameState: {
        ...state.gameState,
        lifestyle: {
          ...state.gameState.lifestyle,
          youtube: {
            subscribers: newSubscribers,
            videos: [newVideo, ...yt.videos].slice(0, 30),
            weeklyUploadDone: true,
            monthlyRevenue,
          },
        },
      },
    });

    if (isViral) {
      setYtMessage(`🔥 VIDÉO VIRALE ! +${subscribersGained.toLocaleString()} abonnés ! (${formatSubs(newSubscribers)} total)`);
    } else {
      setYtMessage(`📹 Vidéo publiée ! +${subscribersGained.toLocaleString()} abonnés (${formatSubs(newSubscribers)} total)`);
    }
    setTimeout(() => setYtMessage(null), 4000);
  };

  return (
    <div className="p-4 pt-0">
      <h3 className="text-sm font-bold text-text mb-3">📺 YouTube / TikTok</h3>

      {/* Channel stats */}
      <div className="bg-gradient-to-r from-red-500/20 to-pink-500/20 rounded-xl p-3 mb-3 border border-red-500/30">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-text-muted">Abonnés</p>
            <p className="text-lg font-black text-text">{formatSubs(youtube.subscribers)}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-text-muted">Revenus/mois</p>
            <p className="text-sm font-bold text-green-400">{youtube.monthlyRevenue.toLocaleString()}€</p>
          </div>
        </div>
      </div>

      {ytMessage && (
        <div className="bg-green-500/20 border border-green-500/40 rounded-xl p-2.5 mb-3 text-center">
          <p className="text-xs text-green-400 font-medium">{ytMessage}</p>
        </div>
      )}

      {/* Upload options */}
      <p className="text-xs text-text-muted mb-2">
        {youtube.weeklyUploadDone ? '⏳ Prochaine vidéo la semaine prochaine' : '🎬 Poster une vidéo (1x/semaine)'}
      </p>
      <div className="space-y-1.5 mb-3">
        {VIDEO_OPTIONS.map((option, idx) => (
          <button
            key={idx}
            onClick={() => handleUpload(option)}
            disabled={youtube.weeklyUploadDone}
            className={`w-full p-2.5 rounded-lg flex items-center gap-2 border transition-all ${
              youtube.weeklyUploadDone
                ? 'bg-surface/50 border-surface-light opacity-50'
                : 'bg-surface border-surface-light active:scale-[0.98]'
            }`}
          >
            <span className="text-lg">{option.emoji}</span>
            <div className="flex-1 text-left">
              <p className="text-xs text-text">{option.title}</p>
              <p className="text-[10px] text-text-muted">+{option.baseGain.min}-{option.baseGain.max} abonnés</p>
            </div>
          </button>
        ))}
      </div>

      {/* Recent videos */}
      {youtube.videos.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs text-text-muted font-medium">Dernières vidéos</p>
          {youtube.videos.slice(0, 3).map((video) => (
            <div key={video.id} className="bg-surface rounded-lg p-2 border border-surface-light flex items-center justify-between">
              <div>
                <p className="text-xs text-text">{video.title}</p>
                <p className="text-[10px] text-text-muted">{video.views.toLocaleString()} vues • +{video.subscribersGained} abo</p>
              </div>
              {video.viral && <span className="text-[10px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded">🔥 Viral</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
