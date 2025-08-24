import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import Sparkles from 'lucide-react/dist/esm/icons/sparkles.js';
import Download from 'lucide-react/dist/esm/icons/download.js';
import Monitor from 'lucide-react/dist/esm/icons/monitor.js';
import Smartphone from 'lucide-react/dist/esm/icons/smartphone.js';
import Globe from 'lucide-react/dist/esm/icons/globe.js';
import CheckCircle from 'lucide-react/dist/esm/icons/check-circle.js';
import ExternalLink from 'lucide-react/dist/esm/icons/external-link.js';
import Github from 'lucide-react/dist/esm/icons/github.js';

interface DownloadOption {
  platform: string;
  icon: React.ReactNode;
  version: string;
  size: string;
  description: string;
  downloadUrl: string;
  isRecommended?: boolean;
  requirements?: string[];
}

const Navigation: React.FC = () => {
  const navigate = useNavigate();

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold text-gray-900">Synapse Studio</h1>
          </div>
          
          <div className="flex items-center space-x-6">
            <button
              onClick={() => navigate('/')}
              className="text-gray-600 hover:text-purple-600 transition-colors"
            >
              Home
            </button>
            <button
              onClick={() => navigate('/projects')}
              className="text-gray-600 hover:text-purple-600 transition-colors"
            >
              Projects
            </button>
            <button
              onClick={() => navigate('/projects')}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Get Started
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

const DownloadCard: React.FC<{ option: DownloadOption }> = ({ option }) => {
  const handleDownload = () => {
    // In a real app, this would trigger the actual download
    console.log(`Downloading ${option.platform} version...`);
    // window.open(option.downloadUrl, '_blank');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      viewport={{ once: true }}
      className={`relative bg-white border-2 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-200 ${
        option.isRecommended 
          ? 'border-purple-500 ring-2 ring-purple-200' 
          : 'border-gray-200 hover:border-purple-300'
      }`}
    >
      {option.isRecommended && (
        <div className="absolute -top-3 left-6">
          <span className="bg-purple-600 text-white text-sm font-medium px-3 py-1 rounded-full">
            Recommended
          </span>
        </div>
      )}
      
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
            {option.icon}
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">{option.platform}</h3>
            <p className="text-sm text-gray-600">Version {option.version}</p>
          </div>
        </div>
        <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
          {option.size}
        </span>
      </div>

      <p className="text-gray-600 mb-4">{option.description}</p>

      {option.requirements && (
        <div className="mb-4">
          <h4 className="text-sm font-semibold text-gray-900 mb-2">Requirements:</h4>
          <ul className="space-y-1">
            {option.requirements.map((req, index) => (
              <li key={index} className="flex items-center text-sm text-gray-600">
                <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                {req}
              </li>
            ))}
          </ul>
        </div>
      )}

      <button
        onClick={handleDownload}
        className={`w-full font-semibold py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2 ${
          option.isRecommended
            ? 'bg-purple-600 hover:bg-purple-700 text-white'
            : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
        }`}
      >
        <Download className="w-5 h-5" />
        <span>Download for {option.platform}</span>
      </button>
    </motion.div>
  );
};

const DownloadsPage: React.FC = () => {
  const downloadOptions: DownloadOption[] = [
    {
      platform: 'Windows',
      icon: <Monitor className="w-6 h-6 text-purple-600" />,
      version: '1.0.0',
      size: '125 MB',
      description: 'Native Windows application with full desktop integration and performance optimization.',
      downloadUrl: '#',
      isRecommended: true,
      requirements: [
        'Windows 10 or later (64-bit)',
        '4GB RAM minimum, 8GB recommended',
        '2GB free disk space',
        'DirectX 11 compatible graphics'
      ]
    },
    {
      platform: 'macOS',
      icon: <Monitor className="w-6 h-6 text-purple-600" />,
      version: '1.0.0',
      size: '130 MB',
      description: 'Optimized for macOS with native Apple Silicon support and seamless integration.',
      downloadUrl: '#',
      requirements: [
        'macOS 11.0 (Big Sur) or later',
        'Intel or Apple Silicon processor',
        '4GB RAM minimum, 8GB recommended',
        '2GB free disk space'
      ]
    },
    {
      platform: 'Linux',
      icon: <Monitor className="w-6 h-6 text-purple-600" />,
      version: '1.0.0',
      size: '120 MB',
      description: 'AppImage format for universal Linux compatibility across all major distributions.',
      downloadUrl: '#',
      requirements: [
        'Ubuntu 18.04+ / Fedora 32+ / Arch Linux',
        'X11 or Wayland display server',
        '4GB RAM minimum, 8GB recommended',
        '2GB free disk space'
      ]
    },
    {
      platform: 'Web App',
      icon: <Globe className="w-6 h-6 text-purple-600" />,
      version: '1.0.0',
      size: 'No download',
      description: 'Run Synapse Studio directly in your browser. Perfect for quick edits and collaboration.',
      downloadUrl: '/projects',
      requirements: [
        'Modern web browser (Chrome, Firefox, Safari, Edge)',
        'WebGL 2.0 support',
        'Stable internet connection',
        '2GB RAM minimum'
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Download Synapse Studio
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Choose the perfect version for your platform. All versions include the same powerful features 
              for creating authentic, human-powered video content.
            </p>
          </motion.div>

          {/* Download Options */}
          <div className="grid md:grid-cols-2 gap-6 mb-12">
            {downloadOptions.map((option, index) => (
              <DownloadCard key={index} option={option} />
            ))}
          </div>

          {/* Additional Information */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="bg-white rounded-2xl p-8 shadow-lg"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-6">What's Included</h2>
            
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-8 h-8 text-purple-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Full Feature Set</h3>
                <p className="text-gray-600">
                  Complete video editing suite with timeline, effects, and export capabilities.
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Subscription</h3>
                <p className="text-gray-600">
                  One-time download, yours forever. No monthly fees or hidden costs.
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Github className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Open Source</h3>
                <p className="text-gray-600">
                  Built in the open with community contributions and transparency.
                </p>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-6">
              <div className="flex flex-col md:flex-row items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Need Help?</h3>
                  <p className="text-gray-600">
                    Check out our documentation and community support resources.
                  </p>
                </div>
                <div className="flex space-x-4 mt-4 md:mt-0">
                  <button className="flex items-center space-x-2 text-purple-600 hover:text-purple-700 font-medium">
                    <ExternalLink className="w-4 h-4" />
                    <span>Documentation</span>
                  </button>
                  <button className="flex items-center space-x-2 text-purple-600 hover:text-purple-700 font-medium">
                    <Github className="w-4 h-4" />
                    <span>GitHub</span>
                  </button>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Release Notes */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
            className="mt-8 bg-purple-50 border border-purple-200 rounded-2xl p-6"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Latest Release - v1.0.0</h3>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-start">
                <CheckCircle className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                <span>Initial release with full video editing capabilities</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                <span>Multi-track timeline with drag-and-drop support</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                <span>Real-time preview powered by Remotion</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                <span>Export to multiple formats (MP4, WebM, GIF)</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                <span>Cross-platform compatibility</span>
              </li>
            </ul>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default DownloadsPage;