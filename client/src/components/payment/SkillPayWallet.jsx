import React, { useState, useEffect } from 'react';
import { 
  Wallet, 
  CreditCard, 
  History, 
  Gift, 
  Shield, 
  CheckCircle, 
  AlertCircle,
  Coins,
  TrendingUp
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import paymentService from '../../services/paymentService';
import RedeemCodeModal from './RedeemCodeModal';
import TransactionHistory from './TransactionHistory';
import ThemeToggle from '../common/ThemeToggle';
import DashboardButton from '../common/DashboardButton';

const SkillPayWallet = () => {
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showRedeemModal, setShowRedeemModal] = useState(false);
  const [showTransactions, setShowTransactions] = useState(false);
  const [activating, setActivating] = useState(false);

  useEffect(() => {
    fetchWallet();
  }, []);

  const fetchWallet = async () => {
    try {
      setLoading(true);
      const response = await paymentService.getWallet();
      setWallet(response.data);
    } catch (error) {
      toast.error(error.message || 'Failed to load wallet');
    } finally {
      setLoading(false);
    }
  };

  const activateWallet = async () => {
    try {
      setActivating(true);
      await paymentService.activateWallet();
      toast.success('SkillPay wallet activated successfully!');
      await fetchWallet();
    } catch (error) {
      toast.error(error.message || 'Failed to activate wallet');
    } finally {
      setActivating(false);
    }
  };

  const handleCodeRedeemed = async () => {
    await fetchWallet();
    setShowRedeemModal(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-card rounded w-1/3"></div>
            <div className="h-64 bg-card rounded-2xl"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!wallet?.isActivated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent mb-2">
                  SkillPay Wallet
                </h1>
                <p className="text-muted-foreground">Secure digital wallet for SkillWise credits</p>
              </div>
              
              {/* Theme Toggle */}
              <ThemeToggle size="md" />
            </div>
          </div>

          {/* Activation Card */}
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-primary/10 rounded-3xl blur-lg opacity-50"></div>
            <div className="relative bg-card/80 backdrop-blur-sm rounded-3xl p-8 border border-primary/20">
              <div className="text-center space-y-6">
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                  <Wallet className="w-10 h-10 text-primary" />
                </div>
                
                <div>
                  <h2 className="text-2xl font-bold text-foreground mb-2">Activate Your SkillPay Wallet</h2>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    Get started with SkillPay to redeem codes, earn credits, and unlock premium features.
                  </p>
                </div>

                {/* Features */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-8">
                  <div className="text-center space-y-2">
                    <Shield className="w-8 h-8 text-primary mx-auto" />
                    <h3 className="font-semibold">Secure</h3>
                    <p className="text-sm text-muted-foreground">Bank-level security</p>
                  </div>
                  <div className="text-center space-y-2">
                    <Gift className="w-8 h-8 text-primary mx-auto" />
                    <h3 className="font-semibold">Rewards</h3>
                    <p className="text-sm text-muted-foreground">Earn credits & bonuses</p>
                  </div>
                  <div className="text-center space-y-2">
                    <TrendingUp className="w-8 h-8 text-primary mx-auto" />
                    <h3 className="font-semibold">Growth</h3>
                    <p className="text-sm text-muted-foreground">Unlock premium content</p>
                  </div>
                </div>

                <button
                  onClick={activateWallet}
                  disabled={activating}
                  className="cosmic-button px-8 py-3 text-lg font-semibold disabled:opacity-50"
                >
                  {activating ? 'Activating...' : 'Activate SkillPay Wallet'}
                </button>

                <p className="text-xs text-muted-foreground">
                  By activating, you agree to our Terms of Service and Privacy Policy
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent mb-2">
              SkillPay Wallet
            </h1>
            <p className="text-muted-foreground">Manage your SkillWise credits</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle className="w-4 h-4 text-green-500" />
              Wallet Activated
            </div>
            
            {/* Action buttons */}
            <DashboardButton />
            <ThemeToggle size="md" />
          </div>
        </div>

        {/* Balance Card */}
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-primary/10 rounded-3xl blur-lg opacity-50"></div>
          <div className="relative bg-card/80 backdrop-blur-sm rounded-3xl p-8 border border-primary/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground mb-2">Current Balance</p>
                <div className="flex items-center gap-3">
                  <Coins className="w-8 h-8 text-primary" />
                  <span className="text-4xl font-bold text-foreground">{wallet.credits}</span>
                  <span className="text-xl text-muted-foreground">credits</span>
                </div>
              </div>
              <div className="text-right space-y-2">
                <div className="text-sm text-muted-foreground">
                  Total Earned: {wallet.wallet?.totalEarned || 0}
                </div>
                <div className="text-sm text-muted-foreground">
                  Total Spent: {wallet.wallet?.totalSpent || 0}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => setShowRedeemModal(true)}
            className="cosmic-button p-6 text-left space-y-2"
          >
            <div className="flex items-center gap-3">
              <Gift className="w-6 h-6" />
              <div>
                <h3 className="font-semibold">Redeem Code</h3>
                <p className="text-sm opacity-80">Enter a payment code to add credits</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => setShowTransactions(true)}
            className="cosmic-button p-6 text-left space-y-2"
          >
            <div className="flex items-center gap-3">
              <History className="w-6 h-6" />
              <div>
                <h3 className="font-semibold">Transaction History</h3>
                <p className="text-sm opacity-80">View your payment history</p>
              </div>
            </div>
          </button>
        </div>

        {/* Modals */}
        {showRedeemModal && (
          <RedeemCodeModal
            onClose={() => setShowRedeemModal(false)}
            onSuccess={handleCodeRedeemed}
          />
        )}

        {showTransactions && (
          <TransactionHistory
            onClose={() => setShowTransactions(false)}
          />
        )}
      </div>
    </div>
  );
};

export default SkillPayWallet;
