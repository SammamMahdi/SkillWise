import React, { useState } from 'react';
import { X, Lock } from 'lucide-react';
import toast from 'react-hot-toast';

const ChildLockModal = ({ isOpen, onClose, onVerify, feature }) => {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password.trim()) {
      toast.error('Please enter your child lock password');
      return;
    }

    setLoading(true);
    try {
      await onVerify(password);
      setPassword('');
      onClose();
    } catch (error) {
      toast.error(error.message || 'Invalid child lock password');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-card p-6 rounded-xl shadow-xl max-w-md w-full mx-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-orange-500" />
            <h3 className="text-lg font-semibold">Child Lock Verification</h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1 hover:bg-background rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-4">
          <p className="text-foreground/80 text-sm">
            This feature requires child lock verification. Please enter your child lock password to continue.
          </p>
          {feature && (
            <p className="text-foreground/60 text-xs mt-2">
              Feature: {feature.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="childLockPassword" className="block text-sm font-medium mb-2">
              Child Lock Password
            </label>
            <input
              type="password"
              id="childLockPassword"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="Enter child lock password"
              disabled={loading}
              autoFocus
            />
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-foreground/80 border border-border rounded-lg hover:bg-background transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !password.trim()}
              className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {loading ? 'Verifying...' : 'Verify'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChildLockModal;
