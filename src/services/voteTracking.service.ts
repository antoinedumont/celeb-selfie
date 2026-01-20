/**
 * Vote Tracking Service
 *
 * Tracks user votes between Nano Banana Pro and PhotoMaker using localStorage.
 * Provides analytics on which model users prefer.
 */

import type { CompositeModel } from './composite/types';

const STORAGE_KEY = 'booth-selfie-votes';

export interface Vote {
  model: CompositeModel;
  timestamp: number;
  sessionId: string;
}

export interface VoteStats {
  nanoBananaVotes: number;
  photoMakerVotes: number;
  totalVotes: number;
  nanoBananaWinRate: number;
  photoMakerWinRate: number;
}

/**
 * Generate or retrieve session ID
 */
function getSessionId(): string {
  const SESSION_KEY = 'booth-selfie-session-id';
  let sessionId = localStorage.getItem(SESSION_KEY);

  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    localStorage.setItem(SESSION_KEY, sessionId);
  }

  return sessionId;
}

/**
 * Load all votes from localStorage
 */
function loadVotes(): Vote[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    return JSON.parse(data) as Vote[];
  } catch (error) {
    console.error('[Vote Tracking] Failed to load votes:', error);
    return [];
  }
}

/**
 * Save votes to localStorage
 */
function saveVotes(votes: Vote[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(votes));
  } catch (error) {
    console.error('[Vote Tracking] Failed to save votes:', error);
  }
}

/**
 * Record a vote for a model
 */
export function recordVote(model: CompositeModel): void {
  const votes = loadVotes();
  const vote: Vote = {
    model,
    timestamp: Date.now(),
    sessionId: getSessionId(),
  };

  votes.push(vote);
  saveVotes(votes);

  console.log(`[Vote Tracking] Recorded vote for ${model}`);
  console.log(`[Vote Tracking] Total votes: ${votes.length}`);
}

/**
 * Get vote statistics
 */
export function getVoteStats(): VoteStats {
  const votes = loadVotes();

  const nanoBananaVotes = votes.filter(v => v.model === 'nano-banana-pro').length;
  const photoMakerVotes = votes.filter(v => v.model === 'photomaker').length;
  const totalVotes = votes.length;

  const nanoBananaWinRate = totalVotes > 0 ? (nanoBananaVotes / totalVotes) * 100 : 0;
  const photoMakerWinRate = totalVotes > 0 ? (photoMakerVotes / totalVotes) * 100 : 0;

  return {
    nanoBananaVotes,
    photoMakerVotes,
    totalVotes,
    nanoBananaWinRate,
    photoMakerWinRate,
  };
}

/**
 * Get all votes (for export/analysis)
 */
export function getAllVotes(): Vote[] {
  return loadVotes();
}

/**
 * Clear all votes (admin/debug function)
 */
export function clearAllVotes(): void {
  localStorage.removeItem(STORAGE_KEY);
  console.log('[Vote Tracking] All votes cleared');
}

/**
 * Export votes as CSV
 */
export function exportVotesAsCSV(): string {
  const votes = loadVotes();

  const header = 'Model,Timestamp,Date,SessionId\n';
  const rows = votes.map(vote => {
    const date = new Date(vote.timestamp).toISOString();
    return `${vote.model},${vote.timestamp},${date},${vote.sessionId}`;
  }).join('\n');

  return header + rows;
}

/**
 * Download votes as CSV file
 */
export function downloadVotesCSV(): void {
  const csv = exportVotesAsCSV();
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `booth-selfie-votes-${Date.now()}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
  console.log('[Vote Tracking] Votes exported as CSV');
}
