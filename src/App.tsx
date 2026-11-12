
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { redirectToSpotifyAuth, getAccessToken, fetchTopArtists } from './spotifyAuth';
import html2canvas from 'html2canvas';

interface Artist {
  id: string;
  name: string;
}

type TimeRange = 'short_term' | 'medium_term' | 'long_term';
type ThemeKey =
  | 'ROCK'
  | 'SUNSET'
  | 'NEON'
  | 'OCEAN'
  | 'FOREST'
  | 'MONO'
  | 'PASTEL'
  | 'LUXURY'
  | 'PUNK'
  | 'CITYPOP';
type ViewMode = 'poster' | 'timetable';
type FontKey =
  | 'IMPACT'
  | 'CONDENSED'
  | 'FUTURE'
  | 'EDITORIAL'
  | 'TECHNO'
  | 'RETRO'
  | 'HEAVY'
  | 'MINIMAL';
type LayoutKey = 'CLASSIC' | 'LEFT' | 'DIAGONAL' | 'FRAME';

const THEMES = {
  ROCK: {
    label: 'Midnight Rock',
    poster: 'radial-gradient(circle at 50% 0%, #7c2d12 0%, #24100b 30%, #070708 72%)',
    text: '#ffffff', muted: '#d6d3d1', accent: '#ff5a1f', accent2: '#fbbf24',
    shadow: '0 3px 18px rgba(0,0,0,.85)',
  },
  SUNSET: {
    label: 'Coastal Sunset',
    poster: 'radial-gradient(circle at 20% 0%, #9f1239 0%, #4c1d95 34%, #06131f 76%)',
    text: '#ffffff', muted: '#e2e8f0', accent: '#fde047', accent2: '#67e8f9',
    shadow: '0 3px 18px rgba(0,0,0,.9)',
  },
  NEON: {
    label: 'Future Neon',
    poster: 'radial-gradient(circle at 85% 8%, #312e81 0%, #10172a 40%, #02040c 78%)',
    text: '#ffffff', muted: '#cbd5e1', accent: '#22d3ee', accent2: '#f472b6',
    shadow: '0 3px 16px rgba(0,0,0,.95),0 0 22px rgba(34,211,238,.24)',
  },
  OCEAN: {
    label: 'Deep Ocean',
    poster: 'radial-gradient(circle at 50% -10%, #0e7490 0%, #083344 37%, #020617 82%)',
    text: '#f0fdfa', muted: '#bae6fd', accent: '#2dd4bf', accent2: '#38bdf8',
    shadow: '0 3px 18px rgba(0,0,0,.9)',
  },
  FOREST: {
    label: 'Forest Ritual',
    poster: 'radial-gradient(circle at 12% 4%, #3f6212 0%, #17210f 35%, #070a06 80%)',
    text: '#f7fee7', muted: '#d9f99d', accent: '#a3e635', accent2: '#facc15',
    shadow: '0 3px 18px rgba(0,0,0,.9)',
  },
  MONO: {
    label: 'Monochrome Type',
    poster: 'linear-gradient(145deg, #242424 0%, #0a0a0a 50%, #000 100%)',
    text: '#ffffff', muted: '#d4d4d4', accent: '#ffffff', accent2: '#737373',
    shadow: '0 3px 14px rgba(0,0,0,.95)',
  },
  PASTEL: {
    label: 'Dreamy Pastel',
    poster: 'linear-gradient(145deg, #312e81 0%, #701a75 48%, #164e63 100%)',
    text: '#fff7ed', muted: '#f5d0fe', accent: '#f9a8d4', accent2: '#a5f3fc',
    shadow: '0 3px 18px rgba(30,27,75,.95)',
  },
  LUXURY: {
    label: 'Black & Gold',
    poster: 'radial-gradient(circle at 50% -5%, #3f3015 0%, #15120b 38%, #050505 82%)',
    text: '#fffdf5', muted: '#e7d7a7', accent: '#d4af37', accent2: '#fff1a8',
    shadow: '0 3px 18px rgba(0,0,0,.95)',
  },
  PUNK: {
    label: 'Acid Punk',
    poster: 'linear-gradient(135deg, #18181b 0 35%, #3f0712 35% 62%, #111827 62% 100%)',
    text: '#ffffff', muted: '#fecdd3', accent: '#bef264', accent2: '#fb7185',
    shadow: '3px 3px 0 rgba(190,242,100,.25),0 4px 18px rgba(0,0,0,.9)',
  },
  CITYPOP: {
    label: 'City Pop Night',
    poster: 'linear-gradient(180deg, #312e81 0%, #7e22ce 38%, #be185d 64%, #172554 100%)',
    text: '#ffffff', muted: '#fbcfe8', accent: '#fef08a', accent2: '#67e8f9',
    shadow: '0 3px 20px rgba(30,27,75,.9)',
  },
} as const;

const FONT_STYLES = {
  IMPACT: { label: 'Festival Impact', display: "'Bebas Neue', sans-serif", letterSpacing: '-0.03em' },
  CONDENSED: { label: 'Live Condensed', display: "'Oswald', sans-serif", letterSpacing: '-0.02em' },
  FUTURE: { label: 'Future Grotesk', display: "'Space Grotesk', sans-serif", letterSpacing: '-0.055em' },
  EDITORIAL: { label: 'Modern Editorial', display: "'Archivo Black', sans-serif", letterSpacing: '-0.045em' },
  TECHNO: { label: 'Techno Orbit', display: "'Orbitron', sans-serif", letterSpacing: '-0.025em' },
  RETRO: { label: 'Retro Display', display: "'Anton', sans-serif", letterSpacing: '0.005em' },
  HEAVY: { label: 'Heavy Headliner', display: "'Black Han Sans', sans-serif", letterSpacing: '-0.04em' },
  MINIMAL: { label: 'Clean Minimal', display: "'Montserrat', sans-serif", letterSpacing: '-0.035em' },
} as const;

const LAYOUT_STYLES: Record<LayoutKey, { label: string; note: string }> = {
  CLASSIC: { label: 'Classic Center', note: '王道の中央配置' },
  LEFT: { label: 'Editorial Left', note: '雑誌風の左揃え' },
  DIAGONAL: { label: 'Diagonal Rush', note: '斜めに動きのある配置' },
  FRAME: { label: 'Framed Luxury', note: '額縁のような構成' },
};

const RANGE_OPTIONS: { value: TimeRange; label: string; note: string }[] = [
  { value: 'short_term', label: '1 MONTH', note: '最近のムード' },
  { value: 'medium_term', label: '6 MONTHS', note: '今季の定番' },
  { value: 'long_term', label: 'ALL TIME', note: 'あなたの殿堂' },
];

const TIME_SLOTS = ["11:00", "12:00", "13:00", "14:15", "15:30", "16:45", "18:00", "19:15", "20:30"];

export const App: React.FC = () => {
  const [token, setToken] = useState<string | null>(null);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [userName, setUserName] = useState('MY');
  const [timeRange, setTimeRange] = useState<TimeRange>('short_term');
  const [theme, setTheme] = useState<ThemeKey>('ROCK');
  const [fontStyle, setFontStyle] = useState<FontKey>('IMPACT');
  const [layoutStyle, setLayoutStyle] = useState<LayoutKey>('CLASSIC');
  const [stageCount, setStageCount] = useState(2);
  const [viewMode, setViewMode] = useState<ViewMode>('poster');
  const [isEditingMode, setIsEditingMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const exportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const authError = params.get('error');

    if (authError) {
      setError(`認証エラー: ${authError}`);
      return;
    }
    if (!code) return;

    window.history.replaceState({}, document.title, window.location.pathname);
    setLoading(true);
    getAccessToken(code)
      .then(setToken)
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : '認証に失敗しました');
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    setLoading(true);
    setError(null);

    Promise.all([
      fetch('https://api.spotify.com/v1/me', {
        headers: { Authorization: `Bearer ${token}` },
      }).then(async (res) => {
        if (!res.ok) throw new Error('プロフィールを取得できませんでした');
        return res.json();
      }),
      fetchTopArtists(token, timeRange),
    ])
      .then(([profile, topArtists]) => {
        if (cancelled) return;
        const normalized = String(profile.display_name || 'MY')
          .replace(/[^a-zA-Z0-9]/g, '')
          .toUpperCase();
        setUserName(normalized || 'MY');
        setArtists(topArtists.items || []);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          console.error(err);
          setError(err instanceof Error ? err.message : 'データの取得に失敗しました');
        }
      })
      .finally(() => !cancelled && setLoading(false));

    return () => {
      cancelled = true;
    };
  }, [token, timeRange]);

  const currentTheme = THEMES[theme];
  const currentFont = FONT_STYLES[fontStyle];

  // 1 stage = 9 artists, 2 stages = 18, 3 stages = 27, 4 stages = 36.
  // Poster and timetable always use the same artist pool.
  const visibleArtistCount = Math.min(artists.length, TIME_SLOTS.length * stageCount);
  const visibleArtists = useMemo(
    () => artists.slice(0, visibleArtistCount),
    [artists, visibleArtistCount],
  );

  const posterTiers = useMemo(() => {
    const count = visibleArtists.length;
    const tier1End = Math.min(3, count);
    const tier2End = Math.min(tier1End + Math.max(0, Math.ceil((count - tier1End) * 0.28)), count);
    const tier3End = Math.min(tier2End + Math.max(0, Math.ceil((count - tier2End) * 0.48)), count);

    return {
      tier1: visibleArtists.slice(0, tier1End),
      tier2: visibleArtists.slice(tier1End, tier2End),
      tier3: visibleArtists.slice(tier2End, tier3End),
      tier4: visibleArtists.slice(tier3End),
    };
  }, [visibleArtists]);

  const stages = useMemo(() => {
    const names = ['MAIN STAGE', 'SECOND STAGE', 'INDIE STAGE', 'FOURTH STAGE'];
    return Array.from({ length: stageCount }, (_, stageIndex) => {
      const lineup = visibleArtists.filter((_, index) => index % stageCount === stageIndex);
      const headlineEnd = stageCount === 1 ? 3 : 1;
      const subEnd = stageCount === 1 ? 9 : 4;
      const midEnd = stageCount === 1 ? 20 : 10;
      return {
        name: names[stageIndex],
        fullLineup: lineup,
        headliners: lineup.slice(0, headlineEnd),
        subHeadliners: lineup.slice(headlineEnd, subEnd),
        midCard: lineup.slice(subEnd, midEnd),
        underCard: lineup.slice(midEnd, 50),
      };
    });
  }, [visibleArtists, stageCount]);

  const moveArtist = (index: number, direction: -1 | 1) => {
    const destination = index + direction;
    if (destination < 0 || destination >= artists.length) return;
    setArtists((current) => {
      const next = [...current];
      [next[index], next[destination]] = [next[destination], next[index]];
      return next;
    });
  };

  const downloadImage = async () => {
    if (!exportRef.current || saving) return;
    setSaving(true);
    try {
      const canvas = await html2canvas(exportRef.current, {
        scale: 3,
        useCORS: true,
        backgroundColor: '#08090c', // ⭕ 直接黒色を指定するように修正
        logging: false,
      });
      const link = document.createElement('a');
      link.download = `${userName}_FES_2026_${viewMode.toUpperCase()}.png`;
      link.href = canvas.toDataURL('image/png', 1);
      link.click();
    } catch (err) {
      console.error(err);
      setError('画像の保存に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  const shareText = `Spotifyの履歴から架空フェス「${userName} FES '26」の${viewMode === 'poster' ? 'ポスター' : 'タイムテーブル'}を作りました🎸\n\n#架空フェス #Spotifyフェス診断`;

  return (
    <div className="app">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Anton&family=Archivo+Black&family=Black+Han+Sans&family=DM+Sans:wght@400;500;600;700&family=Montserrat:wght@500;600;700;800&family=Orbitron:wght@500;600;700;800&family=Oswald:wght@500;700&family=Space+Grotesk:wght@500;600;700&display=swap');
        *{box-sizing:border-box} html{background:#08090c;color-scheme:dark} body{margin:0;background:#08090c;color:#f8fafc} button,select{font:inherit}
        .app{min-height:100vh;background:radial-gradient(circle at 20% -10%,rgba(255,77,21,.12),transparent 30%),#08090c;color:#f8fafc;font-family:'DM Sans',sans-serif;padding:32px 18px 64px;transition:background .35s ease}
        .shell{width:min(1120px,100%);margin:auto}.topbar{display:flex;align-items:center;justify-content:space-between;gap:18px;margin-bottom:28px}.brand{display:flex;align-items:center;gap:12px}.brandMark{width:42px;height:42px;border-radius:13px;background:#1ed760;display:grid;place-items:center;color:#07130b;font-size:20px;box-shadow:0 10px 30px rgba(30,215,96,.22)}
        .brandTitle{font-weight:800;letter-spacing:-.04em;font-size:19px}.brandSub{color:#94a3b8;font-size:12px;margin-top:2px}.badge{border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.06);backdrop-filter:blur(16px);padding:9px 12px;border-radius:999px;color:#cbd5e1;font-size:12px}
        .hero{text-align:center;margin:48px auto 34px;max-width:700px}.eyebrow{color:#1ed760;font-weight:800;letter-spacing:.18em;font-size:12px}.hero h1{color:#f8fafc!important;text-shadow:0 2px 24px rgba(0,0,0,.7);font-size:clamp(38px,7vw,76px);line-height:.96;margin:14px 0 18px;letter-spacing:-.06em}.hero p{color:#94a3b8;line-height:1.75;margin:auto;max-width:560px;font-size:15px}
        .loginCard{color:#f8fafc;max-width:520px;margin:40px auto 0;padding:32px;border:1px solid rgba(255,255,255,.1);border-radius:28px;background:rgba(255,255,255,.055);box-shadow:0 24px 80px rgba(0,0,0,.35);text-align:center;backdrop-filter:blur(18px)}
        .loginCard h2{color:#f8fafc!important}.primary{border:0;border-radius:14px;background:#1ed760;color:#06210f;font-weight:800;padding:14px 22px;cursor:pointer;box-shadow:0 12px 30px rgba(30,215,96,.22);transition:.2s}.primary:hover{transform:translateY(-2px);filter:brightness(1.05)}
        .workspace{display:grid;grid-template-columns:280px minmax(0,1fr);gap:24px;align-items:start}.panel{position:sticky;top:20px;border:1px solid rgba(255,255,255,.1);border-radius:22px;background:rgba(15,23,42,.64);padding:18px;backdrop-filter:blur(18px);box-shadow:0 20px 60px rgba(0,0,0,.28)}.panelTitle{font-size:12px;color:#64748b;font-weight:800;letter-spacing:.14em;margin-bottom:14px}.field{margin-bottom:18px}.field label{display:block;font-size:13px;font-weight:700;margin-bottom:8px}.select{width:100%;appearance:none;color:#f8fafc;background:#111827;border:1px solid #334155;border-radius:12px;padding:11px 12px;outline:none}.select:focus{border-color:#1ed760;box-shadow:0 0 0 3px rgba(30,215,96,.12)}
        .segmented{display:grid;gap:7px}.segment{border:1px solid #293548;padding:10px 11px;border-radius:12px;background:#111827;color:#94a3b8;text-align:left;cursor:pointer}.segment strong{display:block;color:#e2e8f0;font-size:12px}.segment span{font-size:11px}.segment.active{border-color:#1ed760;background:rgba(30,215,96,.1)}.segment.active strong{color:#86efac}
        .ghost{width:100%;border:1px solid #334155;border-radius:12px;background:#111827;color:#e2e8f0;font-weight:700;padding:11px;cursor:pointer}.ghost:hover{border-color:#64748b}.actionRow{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:16px}.action{display:flex;justify-content:center;align-items:center;min-height:46px;border-radius:14px;border:1px solid rgba(255,255,255,.12);font-weight:800;text-decoration:none;cursor:pointer}.save{background:#f8fafc;color:#0f172a}.share{background:#050505;color:#fff}
        .exportWrap{min-width:0}.poster{position:relative;overflow:hidden;min-height:760px;padding:56px 38px 34px;border:1px solid rgba(255,255,255,.13);border-radius:4px;text-align:center;text-transform:uppercase;box-shadow:0 34px 90px rgba(0,0,0,.48)}.poster:before{content:'';position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,.08) 0%,rgba(0,0,0,.2) 48%,rgba(0,0,0,.52) 100%),linear-gradient(115deg,transparent 0 45%,rgba(255,255,255,.04) 46%,transparent 48%),repeating-linear-gradient(0deg,rgba(255,255,255,.018) 0 1px,transparent 1px 5px);pointer-events:none}.poster:after{content:'2026';position:absolute;right:-18px;top:10px;font:700 128px/1 'Bebas Neue';color:rgba(255,255,255,.035);transform:rotate(90deg);transform-origin:center;pointer-events:none}.posterContent{position:relative;z-index:1}.presents{font-size:12px;letter-spacing:.42em;font-weight:800}.festivalTitle{color:#fff!important;font-size:clamp(58px,9vw,105px);line-height:.78;margin:24px 0 14px;letter-spacing:-.035em}.festivalTitle small{display:block;font-size:.27em;letter-spacing:.28em;margin:20px 0 0}.rule{width:72px;height:5px;margin:28px auto 35px;border-radius:9px}.stage{margin-bottom:34px}.stageLabel{display:inline-block;padding:5px 12px;margin-bottom:17px;font:700 12px/1 'DM Sans';letter-spacing:.16em;transform:skewX(-9deg)}.festivalTitle,.headliner,.subline,.midline,.under{text-shadow:0 2px 3px rgba(0,0,0,.95),0 5px 18px rgba(0,0,0,.75)}.headliner{-webkit-text-stroke:.5px rgba(0,0,0,.45)}.headliners{display:flex;flex-wrap:wrap;justify-content:center;gap:8px 22px;margin-bottom:18px}.headliner{color:#fff!important;font-weight:700;line-height:.95}.subline{color:#fff!important}.midline{color:#e2e8f0!important}.under{color:#cbd5e1!important}.subline,.midline{display:flex;flex-wrap:wrap;justify-content:center;gap:6px 16px;margin-bottom:15px}.under{font-family:'DM Sans';font-size:10px;line-height:1.7;font-weight:700;letter-spacing:.04em}.footerLine{border-top:1px solid rgba(255,255,255,.2);padding-top:18px;margin-top:32px;display:flex;justify-content:space-between;gap:12px;font:700 11px/1.3 'DM Sans';letter-spacing:.14em}
        

        .flatLineup{margin:12px auto 0;max-width:930px}
        .flatTier{display:flex;flex-wrap:wrap;align-items:baseline;justify-content:center;text-transform:uppercase}
        .flatTier1{gap:8px 25px;margin-bottom:19px}
        .flatTier1 span{color:#fff;font-size:clamp(38px,6vw,72px);font-weight:800;line-height:.92;text-shadow:0 3px 18px rgba(0,0,0,.9)}
        .flatTier2{gap:7px 19px;margin-bottom:17px}
        .flatTier2 span{color:#fff;font-size:clamp(23px,3.4vw,39px);font-weight:750;line-height:1}
        .flatTier3{gap:6px 15px;margin-bottom:15px}
        .flatTier3 span{color:#e2e8f0;font-size:clamp(16px,2.25vw,25px);font-weight:700;line-height:1.1}
        .flatTier4{color:#cbd5e1;font-size:clamp(10px,1.25vw,14px);line-height:1.75;font-family:'DM Sans',sans-serif;font-weight:700;letter-spacing:.045em}
        .flatDot{color:var(--poster-accent);padding:0 2px}
        .poster.layout-left{text-align:left;padding-left:clamp(28px,7vw,76px)}
        .layout-left .rule{margin-left:0}.layout-left .flatTier{justify-content:flex-start}.layout-left .festivalTitle{max-width:760px}.layout-left .footerLine{text-align:left}
        .poster.layout-diagonal .festivalTitle{transform:rotate(-3deg);margin-top:35px}.layout-diagonal .flatLineup{transform:rotate(-1.2deg)}.layout-diagonal .flatTier1 span:nth-child(even){transform:translateY(10px)}.layout-diagonal .flatTier2 span:nth-child(3n){color:var(--poster-accent)}
        .poster.layout-frame{margin:14px;border:2px solid var(--poster-accent);outline:1px solid rgba(255,255,255,.32);outline-offset:-12px;border-radius:0}.layout-frame .posterContent{padding:20px}.layout-frame .festivalTitle{border-top:1px solid rgba(255,255,255,.35);border-bottom:1px solid rgba(255,255,255,.35);padding:28px 0}
        .theme-punk .festivalTitle,.theme-punk .flatTier1{transform:skewY(-2deg)}.theme-punk .flatTier2 span:nth-child(odd){background:var(--poster-accent);color:#111;padding:1px 5px}
        .theme-mono:before{background:repeating-linear-gradient(90deg,rgba(255,255,255,.025) 0 1px,transparent 1px 9px),linear-gradient(180deg,rgba(0,0,0,.05),rgba(0,0,0,.62))}
        .theme-citypop:after{content:'NIGHT 2026';right:-92px;top:88px;color:rgba(255,255,255,.08);font-size:104px}


        /* タイムテーブル用スタイル */
        .ttLayout{padding:48px 32px;border:1px solid rgba(255,255,255,.13);border-radius:4px;box-shadow:0 34px 90px rgba(0,0,0,.48);position:relative;overflow:hidden;min-height:760px;}
        .ttLayout:before{content:'';position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,.4) 0%,rgba(0,0,0,.8) 100%);pointer-events:none;}
        .ttContent{position:relative;z-index:1;color:#fff}.ttContent .festivalTitle{color:#fff!important}
        .ttHeaderGrid{display:grid;gap:12px;margin-bottom:20px;border-bottom:2px solid rgba(255,255,255,.2);padding-bottom:16px;}
        .ttRow{display:grid;gap:12px;margin-bottom:14px;align-items:stretch;}
        .ttTime{font-size:22px;color:rgba(255,255,255,.7);text-align:right;padding-right:16px;border-right:1px solid rgba(255,255,255,.1);display:flex;align-items:center;justify-content:flex-end;}
        .ttAct{color:#f8fafc;background:rgba(255,255,255,.04);padding:14px 10px;border-radius:8px;font-family:'DM Sans',sans-serif;font-weight:700;display:flex;align-items:center;justify-content:center;text-align:center;font-size:clamp(12px, 1.8vw, 16px);line-height:1.2;border:1px solid rgba(255,255,255,.05);box-shadow:0 4px 12px rgba(0,0,0,.2);}
        .ttAct.headline{background:linear-gradient(135deg, rgba(255,255,255,.15), transparent);color:#fff;font-size:clamp(16px, 2.5vw, 22px);font-weight:800;border-left-width:4px !important;border-left-style:solid;}
        
        .editor{border:1px solid rgba(255,255,255,.1);background:rgba(15,23,42,.7);border-radius:22px;padding:20px}.editorHead{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:15px}.artistRow{display:flex;align-items:center;gap:12px;padding:11px 4px;border-bottom:1px solid rgba(255,255,255,.07)}.rank{width:28px;color:#64748b;font-weight:800}.artistName{flex:1;font-weight:700}.arrow{width:34px;height:34px;border-radius:10px;border:1px solid #334155;background:#111827;color:#fff;cursor:pointer}.arrow:disabled{opacity:.28;cursor:not-allowed}.error{padding:13px 15px;margin-bottom:18px;border:1px solid rgba(248,113,113,.35);border-radius:14px;background:rgba(127,29,29,.2);color:#fecaca}.status{text-align:center;padding:70px 12px;color:#94a3b8}.spinner{width:32px;height:32px;margin:0 auto 14px;border:3px solid #334155;border-top-color:#1ed760;border-radius:50%;animation:spin .8s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}
        @media(max-width:1020px){.ttLayout{overflow-x:auto}.ttContent{min-width:760px}}
        @media(max-width:820px){.workspace{grid-template-columns:1fr}.panel{position:static}.poster{padding:44px 20px 28px;min-height:680px}.ttLayout{padding:30px 15px}.footerLine{flex-direction:column}.topbar{align-items:flex-start}.badge{display:none}}
      `}</style>

      <div className="shell">
        <header className="topbar">
          <div className="brand">
            <div className="brandMark">♫</div>
            <div><div className="brandTitle">FES MAKER</div><div className="brandSub">Powered by your Spotify taste</div></div>
          </div>
          <div className="badge">Spotify Top Artists → Festival Poster & Timetable</div>
        </header>

        {!token ? (
          <>
            <section className="hero">
              <div className="eyebrow">YOUR MUSIC. YOUR FESTIVAL.</div>
              <h1>聴いてきた音楽を、<br />一枚のフェスに。</h1>
              <p>Spotifyのトップアーティストから、あなただけの架空フェスポスターを自動生成します。</p>
            </section>
            {error && <div className="error">{error}</div>}
            <div className="loginCard">
              <div style={{ fontSize: 42, marginBottom: 12 }}>🎧</div>
              <h2 style={{ margin: '0 0 8px' }}>ラインナップを作成</h2>
              <p style={{ color: '#94a3b8', lineHeight: 1.7, fontSize: 14, margin: '0 0 22px' }}>Spotifyにログインして、あなたの再生傾向をフェスの出演順に変換します。</p>
              <button className="primary" onClick={redirectToSpotifyAuth}>Spotifyでログイン</button>
            </div>
          </>
        ) : (
          <>
            <section className="hero" style={{ marginTop: 34 }}>
              <div className="eyebrow">LINEUP GENERATED</div>
              <h1 style={{ fontSize: 'clamp(34px,5vw,62px)' }}>{userName} FES ’26</h1>
              <p>ポスターとタイムテーブルを切り替えて、あなただけのフェスをシェアしよう。</p>
            </section>
            {error && <div className="error">{error}</div>}

            <div className="workspace">
              <aside className="panel">
                <div className="panelTitle">CUSTOMIZE</div>
                <div className="field">
                  <label>表示モード</label>
                  <div className="segmented" style={{ gridTemplateColumns: '1fr 1fr' }}>
                    <button className={`segment ${viewMode === 'poster' ? 'active' : ''}`} onClick={() => setViewMode('poster')} style={{ textAlign: 'center' }}>
                      <strong>ポスター</strong>
                    </button>
                    <button className={`segment ${viewMode === 'timetable' ? 'active' : ''}`} onClick={() => setViewMode('timetable')} style={{ textAlign: 'center' }}>
                      <strong>タイテ</strong>
                    </button>
                  </div>
                </div>
                <div className="field">
                  <label>デザインテーマ</label>
                  <select className="select" value={theme} onChange={(e) => setTheme(e.target.value as ThemeKey)}>
                    {(Object.keys(THEMES) as ThemeKey[]).map((key) => <option key={key} value={key}>{THEMES[key].label}</option>)}
                  </select>
                </div>
                <div className="field">
                  <label>ポスターレイアウト</label>
                  <div className="segmented">
                    {(Object.keys(LAYOUT_STYLES) as LayoutKey[]).map((key) => (
                      <button
                        key={key}
                        className={`segment ${layoutStyle === key ? 'active' : ''}`}
                        onClick={() => setLayoutStyle(key)}
                      >
                        <strong>{LAYOUT_STYLES[key].label}</strong>
                        <span>{LAYOUT_STYLES[key].note}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="field">
                  <label>ポスター字体</label>
                  <select className="select" value={fontStyle} onChange={(e) => setFontStyle(e.target.value as FontKey)}>
                    {(Object.keys(FONT_STYLES) as FontKey[]).map((key) => (
                      <option key={key} value={key}>{FONT_STYLES[key].label}</option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label>集計期間</label>
                  <div className="segmented">
                    {RANGE_OPTIONS.map((option) => (
                      <button key={option.value} className={`segment ${timeRange === option.value ? 'active' : ''}`} onClick={() => setTimeRange(option.value)}>
                        <strong>{option.label}</strong><span>{option.note}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="field">
                  <label>ステージ構成</label>
                  <select className="select" value={stageCount} onChange={(e) => setStageCount(Number(e.target.value))}>
                    <option value={1}>1 Stage（9組）</option><option value={2}>2 Stages（18組）</option><option value={3}>3 Stages（27組）</option><option value={4}>4 Stages（36組）</option>
                  </select>
                  <p style={{ margin: '8px 2px 0', color: '#94a3b8', fontSize: 11, lineHeight: 1.5 }}>
                    ポスター・タイムテーブルともに上位 {visibleArtistCount} 組を使用
                  </p>
                </div>
                <button className="ghost" onClick={() => setIsEditingMode((v) => !v)}>{isEditingMode ? '✓ 編集を完了' : '↕ 出演順を編集'}</button>
                {!isEditingMode && artists.length > 0 && (
                  <div className="actionRow">
                    <button className="action save" onClick={downloadImage} disabled={saving}>{saving ? '保存中…' : '↓ 画像保存'}</button>
                    <a className="action share" href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`} target="_blank" rel="noopener noreferrer">𝕏 シェア</a>
                  </div>
                )}
              </aside>

              <main className="exportWrap">
                {loading ? (
                  <div className="status"><div className="spinner" />ラインナップを構築中...</div>
                ) : isEditingMode ? (
                  <div className="editor">
                    <div className="editorHead"><div><h2 style={{ margin: 0 }}>出演順を編集</h2><p style={{ color: '#94a3b8', margin: '5px 0 0', fontSize: 13 }}>上位ほど後の時間（大トリ）になります</p></div><span className="badge">TOP {visibleArtistCount}</span></div>
                    {visibleArtists.map((artist, index) => (
                      <div className="artistRow" key={artist.id}>
                        <span className="rank">{String(index + 1).padStart(2, '0')}</span><span className="artistName">{artist.name}</span>
                        <button className="arrow" onClick={() => moveArtist(index, -1)} disabled={index === 0}>↑</button>
                        <button className="arrow" onClick={() => moveArtist(index, 1)} disabled={index === artists.length - 1}>↓</button>
                      </div>
                    ))}
                  </div>
                ) : artists.length > 0 ? (
                  <div ref={exportRef} style={{ background: currentTheme.poster, color: currentTheme.text }}>
                    
                    {viewMode === 'poster' ? (
                      <div
                          className={`poster layout-${layoutStyle.toLowerCase()} theme-${theme.toLowerCase()}`}
                          style={{
                            fontFamily: currentFont.display,
                            letterSpacing: currentFont.letterSpacing,
                            '--poster-accent': currentTheme.accent,
                          } as React.CSSProperties}
                        >
                        <div className="posterContent">
                          <div className="presents" style={{ color: currentTheme.accent }}>{userName} PRESENTS</div>
                          <h2 className="festivalTitle" style={{ textShadow: currentTheme.shadow }}>IMAGINARY<br />FESTIVAL<small>LIVE IN YOUR HEAD</small></h2>
                          <div className="rule" style={{ background: `linear-gradient(90deg,${currentTheme.accent},${currentTheme.accent2})` }} />
                          <div className="flatLineup">
                            <div className="flatTier flatTier1">
                              {posterTiers.tier1.map((artist) => (
                                <span key={artist.id}>{artist.name}</span>
                              ))}
                            </div>
                            <div className="flatTier flatTier2">
                              {posterTiers.tier2.map((artist) => (
                                <span key={artist.id}>{artist.name}</span>
                              ))}
                            </div>
                            <div className="flatTier flatTier3">
                              {posterTiers.tier3.map((artist) => (
                                <span key={artist.id}>{artist.name}</span>
                              ))}
                            </div>
                            <div className="flatTier4">
                              {posterTiers.tier4.map((artist, index) => (
                                <React.Fragment key={artist.id}>
                                  {index > 0 && <span className="flatDot"> • </span>}
                                  <span>{artist.name}</span>
                                </React.Fragment>
                              ))}
                            </div>
                          </div>
                          <div className="footerLine" style={{ color: currentTheme.accent }}><span>APRIL 1 / 2026
                            </span><span>VIRTUAL FESTIVAL / JAPAN</span></div>
                        </div>
                      </div>
                    ) : (
                      /* タイムテーブル表示モード */
                      <div className="ttLayout">
                        <div className="ttContent">
                          <div className="presents" style={{ color: currentTheme.accent, textAlign: 'center', marginBottom: 12 }}>{userName} PRESENTS : TIMETABLE</div>
                          <h2 className="festivalTitle" style={{ fontFamily: currentFont.display, textShadow: currentTheme.shadow, fontSize: 'clamp(40px,6vw,60px)', textAlign: 'center', margin: '0 0 32px' }}>TIMETABLE '26</h2>
                          
                          <div className="ttHeaderGrid" style={{ gridTemplateColumns: `80px repeat(${stageCount}, 1fr)` }}>
                            <div className="ttTime" style={{ fontFamily: currentFont.display, border: 'none' }}>TIME</div>
                            {stages.map(stage => (
                              <div key={stage.name} style={{ fontFamily: currentFont.display, fontSize: 24, textAlign: 'center', color: currentTheme.accent, letterSpacing: '2px' }}>
                                {stage.name}
                              </div>
                            ))}
                          </div>

                          {TIME_SLOTS.map((time, slotIndex) => {
                            const isHeadliner = slotIndex === TIME_SLOTS.length - 1;
                            return (
                              <div key={time} className="ttRow" style={{ gridTemplateColumns: `80px repeat(${stageCount}, 1fr)` }}>
                                <div className="ttTime" style={{ fontFamily: currentFont.display }}>{time}</div>
                                {stages.map(stage => {
                                  // ランキング上位（配列の先頭付近）を遅い時間（配列の最後付近）に割り当てる
                                  const artistIndex = TIME_SLOTS.length - 1 - slotIndex;
                                  const artist = stage.fullLineup[artistIndex];
                                  return (
                                    <div 
                                      key={stage.name} 
                                      className={`ttAct ${isHeadliner && artist ? 'headline' : ''}`}
                                      style={{ borderColor: isHeadliner ? currentTheme.accent : 'rgba(255,255,255,0.05)' }}
                                    >
                                      {artist ? artist.name : ''}
                                    </div>
                                  );
                                })}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                  </div>
                ) : <div className="status">表示できるアーティストがありません。</div>}
              </main>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default App;