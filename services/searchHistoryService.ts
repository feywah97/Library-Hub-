
const HISTORY_KEY = 'agripustaka_search_history';
const MAX_HISTORY = 10;

export const searchHistoryService = {
  saveQuery: (query: string) => {
    if (!query || query.trim().length < 2) return;
    
    // Don't save if it's an internal command like [ADVANCED]
    if (query.startsWith('[ADVANCED]')) return;

    const history = searchHistoryService.getHistory();
    const filtered = history.filter(h => h.toLowerCase() !== query.toLowerCase());
    const updated = [query, ...filtered].slice(0, MAX_HISTORY);
    
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
  },

  deleteQuery: (query: string) => {
    const history = searchHistoryService.getHistory();
    const updated = history.filter(h => h !== query);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
  },

  getHistory: (): string[] => {
    try {
      const data = localStorage.getItem(HISTORY_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  clearHistory: () => {
    localStorage.removeItem(HISTORY_KEY);
  }
};
