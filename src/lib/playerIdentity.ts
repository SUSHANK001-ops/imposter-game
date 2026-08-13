export const getPlayerId = (): string => {
  if (typeof window === 'undefined') return '';
  let playerId = localStorage.getItem('imposter_player_id');
  if (!playerId) {
    playerId = 'p_' + Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
    localStorage.setItem('imposter_player_id', playerId);
  }
  return playerId;
};

export const getSavedName = (): string => {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem('imposter_player_name') || '';
};

export const saveName = (name: string) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('imposter_player_name', name);
};
