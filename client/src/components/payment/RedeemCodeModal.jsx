import React, { useState } from 'react';
import { X, Gift, AlertCircle, CheckCircle, Loader } from 'lucide-react';
import { toast } from 'react-hot-toast';
import paymentService from '../../services/paymentService';

const RedeemCodeModal = ({ onClose, onSuccess }) => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const formatCode = (value) => {
    // Remove all non-alphanumeric characters
    const cleaned = value.replace(/[^A-Z0-9]/g, '').toUpperCase();
    
    // Add dashes every 4 characters
    const formatted = cleaned.match(/.{1,4}/g)?.join('-') || cleaned;
    
    // Limit to 14 characters (XXXX-XXXX-XXXX)
    return formatted.substring(0, 14);
  };

  const handleCodeChange = (e) => {
    const formatted = formatCode(e.target.value);
    setCode(formatted);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!code || code.length !== 14) {
      setError('Please enter a valid code in format XXXX-XXXX-XXXX');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      const response = await paymentService.redeemCode(code);
      
      toast.success(response.message);
      onSuccess();
      
    } catch (error) {
      setError(error.message || 'Failed to redeem code');
    } finally {
      setLoading(false);
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      <div className="relative bg-card/95 backdrop-blur-sm rounded-2xl p-6 w-full max-w-md border border-primary/20">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-primary/10 rounded-lg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Gift className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Redeem Code</h2>
          <p className="text-muted-foreground">Enter your payment code to add credits</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Payment Code
            </label>
            <input
              type="text"
              value={code}
              onChange={handleCodeChange}
              placeholder="XXXX-XXXX-XXXX"
              className="w-full px-4 py-3 bg-background/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-center text-lg font-mono tracking-wider"
              maxLength={14}
              autoComplete="off"
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground mt-1 text-center">
              Enter the 12-character code from your payment card
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-500">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || !code || code.length !== 14}
            className="w-full cosmic-button py-3 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <Loader className="w-5 h-5 animate-spin" />
                Redeeming...
              </div>
            ) : (
              'Redeem Code'
            )}
          </button>
        </form>

        {/* Help Text */}
        <div className="mt-6 p-4 bg-primary/5 rounded-lg">
          <h3 className="text-sm font-semibold text-foreground mb-2">How to get codes:</h3>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• Purchase from authorized retailers</li>
            <li>• Earn through special promotions</li>
            <li>• Receive as gifts from friends</li>
            <li>• Complete achievement milestones</li>
          </ul>
        </div>

        {/* Sample Codes for Testing */}
        <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
          <h4 className="text-sm font-semibold text-yellow-600 mb-2">Test Codes (Development):</h4>
          <div className="space-y-1">
            <button
              type="button"
              onClick={() => setCode('1MRE-HCZI-FD0B')}
              className="block w-full text-left text-xs font-mono text-yellow-600 hover:bg-yellow-500/10 p-1 rounded"
            >
              1MRE-HCZI-FD0B (10 credits)
            </button>
            <button
              type="button"
              onClick={() => setCode('7Y2C-0S1F-IBEM')}
              className="block w-full text-left text-xs font-mono text-yellow-600 hover:bg-yellow-500/10 p-1 rounded"
            >
              7Y2C-0S1F-IBEM (10 credits)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RedeemCodeModal;
