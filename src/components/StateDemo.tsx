// Demo component to showcase state management functionality

import {
  useProject,
  useTimeline,
  useMediaAssets,
  useUI,
  usePlayback,
} from '../state/hooks';

export function StateDemo() {
  const { project, createProject, isDirty } = useProject();
  const { timeline, addTimelineItem, timelineDuration } = useTimeline();
  const { mediaAssets, addMediaAsset } = useMediaAssets();
  const { ui, setCurrentView, toggleSidebar } = useUI();
  const { playback, togglePlayback, setVolume } = usePlayback();

  const handleCreateProject = () => {
    createProject('Demo Project');
  };

  const handleAddMediaAsset = () => {
    addMediaAsset({
      name: 'demo-video.mp4',
      type: 'video',
      url: 'blob:demo-url',
      duration: 30,
      metadata: {
        fileSize: 1024 * 1024,
        mimeType: 'video/mp4',
      },
    });
  };

  const handleAddTimelineItem = () => {
    if (mediaAssets.length > 0) {
      addTimelineItem({
        assetId: mediaAssets[0].id,
        startTime: 0,
        duration: 5,
        track: 0,
        type: 'video',
        properties: {},
        animations: [],
        keyframes: [],
      });
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="bg-gray-800 rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-4">State Management Demo</h3>

        {/* Project State */}
        <div className="mb-4">
          <h4 className="font-medium mb-2">Project State</h4>
          <div className="text-sm text-gray-300 mb-2">
            Project: {project ? project.name : 'None'}
            {isDirty && (
              <span className="text-yellow-400 ml-2">(Unsaved changes)</span>
            )}
          </div>
          <button
            onClick={handleCreateProject}
            className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm"
            disabled={!!project}
          >
            Create Demo Project
          </button>
        </div>

        {/* Media Assets */}
        <div className="mb-4">
          <h4 className="font-medium mb-2">
            Media Assets ({mediaAssets.length})
          </h4>
          <button
            onClick={handleAddMediaAsset}
            className="bg-green-600 hover:bg-green-700 px-3 py-1 rounded text-sm mr-2"
            disabled={!project}
          >
            Add Demo Asset
          </button>
          {mediaAssets.map((asset) => (
            <div key={asset.id} className="text-sm text-gray-300 mt-1">
              • {asset.name} ({asset.type})
            </div>
          ))}
        </div>

        {/* Timeline */}
        <div className="mb-4">
          <h4 className="font-medium mb-2">
            Timeline ({timeline.length} items, {timelineDuration}s duration)
          </h4>
          <button
            onClick={handleAddTimelineItem}
            className="bg-purple-600 hover:bg-purple-700 px-3 py-1 rounded text-sm"
            disabled={!project || mediaAssets.length === 0}
          >
            Add Timeline Item
          </button>
          {timeline.map((item) => (
            <div key={item.id} className="text-sm text-gray-300 mt-1">
              • Track {item.track}: {item.startTime}s -{' '}
              {item.startTime + item.duration}s
            </div>
          ))}
        </div>

        {/* UI State */}
        <div className="mb-4">
          <h4 className="font-medium mb-2">UI State</h4>
          <div className="text-sm text-gray-300 mb-2">
            Current View: {ui.currentView} | Sidebar:{' '}
            {ui.sidebarVisible ? 'Visible' : 'Hidden'}
          </div>
          <button
            onClick={() =>
              setCurrentView(
                ui.currentView === 'dashboard' ? 'studio' : 'dashboard'
              )
            }
            className="bg-orange-600 hover:bg-orange-700 px-3 py-1 rounded text-sm mr-2"
          >
            Switch View
          </button>
          <button
            onClick={toggleSidebar}
            className="bg-gray-600 hover:bg-gray-700 px-3 py-1 rounded text-sm"
          >
            Toggle Sidebar
          </button>
        </div>

        {/* Playback State */}
        <div className="mb-4">
          <h4 className="font-medium mb-2">Playback State</h4>
          <div className="text-sm text-gray-300 mb-2">
            Playing: {playback.isPlaying ? 'Yes' : 'No'} | Volume:{' '}
            {Math.round(playback.volume * 100)}% | Time: {playback.currentTime}s
          </div>
          <button
            onClick={togglePlayback}
            className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-sm mr-2"
          >
            {playback.isPlaying ? 'Pause' : 'Play'}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={playback.volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            className="ml-2"
          />
        </div>
      </div>
    </div>
  );
}
