/**
 * Admin Gallery Component
 *
 * Complete admin gallery interface for viewing, filtering, and exporting photos.
 */

import { useState, useEffect, useMemo } from 'react';
import type { GalleryPhoto, GalleryFilters, GalleryStats } from '../../types';
import {
  getAllPhotos,
  deletePhoto,
  clearGallery,
  getGalleryStats,
} from '../../services/galleryStorage.service';
import {
  exportPhotosAsZip,
  exportMetadataAsJSON,
  downloadPhoto,
} from '../../utils/galleryExport.utils';

interface AdminGalleryProps {
  onClose: () => void;
}

export const AdminGallery = ({ onClose }: AdminGalleryProps) => {
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [stats, setStats] = useState<GalleryStats | null>(null);
  const [filters, setFilters] = useState<GalleryFilters>({
    celebrityFilter: null,
    modeFilter: 'all',
    storageFilter: 'all',
    dateRange: { from: null, to: null },
    sortBy: 'newest',
    searchQuery: '',
  });
  const [selectedPhoto, setSelectedPhoto] = useState<GalleryPhoto | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

  // Load photos and stats
  useEffect(() => {
    loadPhotos();
  }, []);

  const loadPhotos = () => {
    const allPhotos = getAllPhotos();
    setPhotos(allPhotos);
    setStats(getGalleryStats());
  };

  // Filter and sort photos
  const filteredPhotos = useMemo(() => {
    let result = [...photos];

    // Celebrity filter
    if (filters.celebrityFilter) {
      result = result.filter((p) => p.metadata.celebrityName === filters.celebrityFilter);
    }

    // Mode filter
    if (filters.modeFilter !== 'all') {
      result = result.filter((p) => p.metadata.generationMode === filters.modeFilter);
    }

    // Storage filter
    if (filters.storageFilter === 'cloud') {
      result = result.filter((p) => !!p.metadata.cloudinaryUrl);
    } else if (filters.storageFilter === 'local') {
      result = result.filter((p) => !p.metadata.cloudinaryUrl);
    }

    // Search query
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      result = result.filter((p) =>
        p.metadata.celebrityName.toLowerCase().includes(query)
      );
    }

    // Sort
    switch (filters.sortBy) {
      case 'newest':
        result.sort((a, b) => b.timestamp - a.timestamp);
        break;
      case 'oldest':
        result.sort((a, b) => a.timestamp - b.timestamp);
        break;
      case 'celebrity-az':
        result.sort((a, b) => a.metadata.celebrityName.localeCompare(b.metadata.celebrityName));
        break;
      case 'celebrity-za':
        result.sort((a, b) => b.metadata.celebrityName.localeCompare(a.metadata.celebrityName));
        break;
    }

    return result;
  }, [photos, filters]);

  // Get unique celebrity names for filter dropdown
  const celebrityNames = useMemo(() => {
    const names = new Set(photos.map((p) => p.metadata.celebrityName));
    return Array.from(names).sort();
  }, [photos]);

  const handleDelete = (photoId: string) => {
    if (confirm('Delete this photo?')) {
      deletePhoto(photoId);
      loadPhotos();
      setSelectedPhoto(null);
    }
  };

  const handleClearAll = () => {
    if (confirm('Delete ALL photos? This cannot be undone!')) {
      if (confirm('Are you REALLY sure? This will delete all ' + photos.length + ' photos!')) {
        clearGallery();
        loadPhotos();
        setSelectedPhoto(null);
      }
    }
  };

  const handleExportZip = async () => {
    setIsExporting(true);
    try {
      await exportPhotosAsZip(filteredPhotos);
      alert(`Exported ${filteredPhotos.length} photos as ZIP`);
    } catch (error) {
      alert('Export failed: ' + (error as Error).message);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportJSON = () => {
    exportMetadataAsJSON(filteredPhotos);
    alert(`Exported metadata for ${filteredPhotos.length} photos`);
  };

  const handleCopyCloudinaryUrl = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    } catch (error) {
      console.error('Copy failed:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-go1-navy">Go1 Booth - Admin Gallery</h1>
              <p className="text-sm text-slate-600 mt-1">
                Learning Technologies 2026 • {photos.length} photos
              </p>
            </div>
            <button onClick={onClose} className="btn-secondary px-6">
              ← Back to Booth
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Statistics Dashboard */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="card-go1 p-6">
              <div className="text-3xl font-bold text-go1-navy">{stats.totalPhotos}</div>
              <div className="text-sm text-slate-600 mt-1">Total Photos</div>
            </div>
            <div className="card-go1 p-6">
              <div className="text-3xl font-bold text-go1-rust">{stats.modeBreakdown.go1}</div>
              <div className="text-sm text-slate-600 mt-1">Go1 Mode</div>
            </div>
            <div className="card-go1 p-6">
              <div className="text-3xl font-bold text-go1-canary">{stats.modeBreakdown.freestyle}</div>
              <div className="text-sm text-slate-600 mt-1">Freestyle Mode</div>
            </div>
            <div className="card-go1 p-6">
              <div className="text-2xl font-bold text-slate-700">
                {stats.storageUsed?.toFixed(2) || 0} MB
              </div>
              <div className="text-sm text-slate-600 mt-1">Storage Used</div>
            </div>
          </div>
        )}

        {/* Popular Celebrities */}
        {stats && stats.popularCelebrities.length > 0 && (
          <div className="card-go1 p-6 mb-8">
            <h3 className="font-bold text-go1-navy mb-4">Most Popular Celebrities</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {stats.popularCelebrities.slice(0, 5).map((celeb, idx) => (
                <div key={idx} className="text-center">
                  <div className="text-2xl font-bold text-go1-rust">{celeb.count}</div>
                  <div className="text-xs text-slate-600">{celeb.name}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Filters and Controls */}
        <div className="card-go1 p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {/* Search */}
            <input
              type="text"
              placeholder="Search celebrity..."
              value={filters.searchQuery}
              onChange={(e) => setFilters({ ...filters, searchQuery: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:border-go1-rust focus:outline-none"
            />

            {/* Celebrity Filter */}
            <select
              value={filters.celebrityFilter || ''}
              onChange={(e) => setFilters({ ...filters, celebrityFilter: e.target.value || null })}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:border-go1-rust focus:outline-none"
            >
              <option value="">All Celebrities</option>
              {celebrityNames.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>

            {/* Mode Filter */}
            <select
              value={filters.modeFilter}
              onChange={(e) =>
                setFilters({ ...filters, modeFilter: e.target.value as any })
              }
              className="px-4 py-2 border border-gray-300 rounded-lg focus:border-go1-rust focus:outline-none"
            >
              <option value="all">All Modes</option>
              <option value="go1">Go1 Mode</option>
              <option value="freestyle">Freestyle Mode</option>
            </select>

            {/* Storage Filter */}
            <select
              value={filters.storageFilter}
              onChange={(e) =>
                setFilters({ ...filters, storageFilter: e.target.value as any })
              }
              className="px-4 py-2 border border-gray-300 rounded-lg focus:border-go1-rust focus:outline-none"
            >
              <option value="all">All Storage</option>
              <option value="cloud">☁️ Cloud Only</option>
              <option value="local">💾 Local Only</option>
            </select>

            {/* Sort */}
            <select
              value={filters.sortBy}
              onChange={(e) => setFilters({ ...filters, sortBy: e.target.value as any })}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:border-go1-rust focus:outline-none"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="celebrity-az">Celebrity A-Z</option>
              <option value="celebrity-za">Celebrity Z-A</option>
            </select>
          </div>

          {/* Export Controls */}
          <div className="flex gap-3 mt-4 pt-4 border-t border-gray-200">
            <button
              onClick={handleExportZip}
              disabled={isExporting || filteredPhotos.length === 0}
              className="btn-primary px-6 disabled:opacity-50"
            >
              {isExporting ? 'Exporting...' : `📦 Export ${filteredPhotos.length} as ZIP`}
            </button>
            <button
              onClick={handleExportJSON}
              disabled={filteredPhotos.length === 0}
              className="btn-secondary px-6"
            >
              📄 Export Metadata JSON
            </button>
            <button onClick={loadPhotos} className="btn-secondary px-6">
              🔄 Refresh
            </button>
            <button
              onClick={handleClearAll}
              disabled={photos.length === 0}
              className="btn-secondary px-6 text-red-600 hover:bg-red-50"
            >
              🗑️ Clear All
            </button>
          </div>
        </div>

        {/* Photos Grid */}
        {filteredPhotos.length === 0 ? (
          <div className="card-go1 p-12 text-center">
            <div className="text-4xl mb-4">📸</div>
            <h3 className="text-xl font-semibold text-go1-navy mb-2">No Photos Yet</h3>
            <p className="text-slate-600">
              Generated photos will appear here automatically. Go create some celebrity selfies!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredPhotos.map((photo) => (
              <div
                key={photo.id}
                className="card-go1 p-3 group cursor-pointer hover:shadow-go1-lg transition-all"
                onClick={() => setSelectedPhoto(photo)}
              >
                <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-gray-100 mb-3">
                  <img
                    src={photo.thumbnailUrl}
                    alt={photo.metadata.celebrityName}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                  <div className="absolute top-2 right-2 flex flex-col gap-1">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        photo.metadata.generationMode === 'go1'
                          ? 'bg-go1-rust text-white'
                          : 'bg-go1-canary text-go1-navy'
                      }`}
                    >
                      {photo.metadata.generationMode}
                    </span>
                    {photo.metadata.cloudinaryUrl ? (
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-500 text-white">
                        ☁️ Cloud
                      </span>
                    ) : (
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-500 text-white">
                        💾 Local
                      </span>
                    )}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="font-semibold text-sm text-go1-navy truncate">
                    {photo.metadata.celebrityName}
                  </div>
                  <div className="text-xs text-slate-500">
                    {new Date(photo.timestamp).toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Photo Lightbox Modal */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <div
            className="max-w-4xl w-full bg-white rounded-xl p-6 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedPhoto(null)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-2xl"
            >
              ×
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <img
                  src={selectedPhoto.imageUrl}
                  alt={selectedPhoto.metadata.celebrityName}
                  className="w-full rounded-lg"
                />
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-2xl font-bold text-go1-navy mb-2">
                    {selectedPhoto.metadata.celebrityName}
                  </h3>
                  <div className="flex gap-2 items-center mb-4">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        selectedPhoto.metadata.generationMode === 'go1'
                          ? 'bg-go1-rust text-white'
                          : 'bg-go1-canary text-go1-navy'
                      }`}
                    >
                      {selectedPhoto.metadata.generationMode}
                    </span>
                    <span className="text-sm text-slate-600">
                      {new Date(selectedPhoto.timestamp).toLocaleString()}
                    </span>
                  </div>
                </div>

                {selectedPhoto.metadata.cloudinaryUrl && (
                  <div className="bg-green-50 rounded-lg p-4 mb-2">
                    <div className="text-sm font-semibold text-green-700 mb-2 flex items-center gap-2">
                      ☁️ Cloud Storage
                    </div>
                    <button
                      onClick={() => handleCopyCloudinaryUrl(selectedPhoto.metadata.cloudinaryUrl!)}
                      className="text-xs text-blue-600 hover:text-blue-800 underline break-all text-left"
                    >
                      {copiedUrl ? '✓ Copied!' : 'Copy shareable link'}
                    </button>
                  </div>
                )}

                {selectedPhoto.metadata.promptText && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-sm font-semibold text-go1-navy mb-2">AI Prompt:</div>
                    <div className="text-xs text-slate-600 max-h-32 overflow-y-auto">
                      {selectedPhoto.metadata.promptText.substring(0, 200)}...
                    </div>
                  </div>
                )}

                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => downloadPhoto(selectedPhoto)}
                    className="btn-primary w-full"
                  >
                    📥 Download Photo
                  </button>
                  <button
                    onClick={() => handleDelete(selectedPhoto.id)}
                    className="btn-secondary w-full text-red-600 hover:bg-red-50"
                  >
                    🗑️ Delete Photo
                  </button>
                </div>

                <div className="text-xs text-slate-500 pt-4 border-t border-gray-200">
                  <div>Photo ID: {selectedPhoto.id}</div>
                  <div>Size: {((selectedPhoto.size || 0) / 1024).toFixed(1)} KB</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
