const { PaymentCode, Transaction } = require('../models/Payment');
const User = require('../models/User');
const { validationResult } = require('express-validator');

// @desc    Activate user wallet
// @route   POST /api/payments/wallet/activate
// @access  Private
const activateWallet = async (req, res) => {
  try {
    const userId = req.userId;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if wallet is already activated
    if (user.wallet && user.wallet.isActivated) {
      return res.status(400).json({
        success: false,
        message: 'Wallet is already activated'
      });
    }

    // Initialize wallet if it doesn't exist
    if (!user.wallet) {
      user.wallet = {};
    }

    // Activate wallet
    user.wallet.isActivated = true;
    user.wallet.activatedAt = new Date();
    user.wallet.termsAcceptedAt = new Date();
    user.wallet.totalEarned = 0;
    user.wallet.totalSpent = 0;

    await user.save();

    res.json({
      success: true,
      message: 'SkillPay wallet activated successfully!',
      data: {
        wallet: user.wallet,
        credits: user.credits
      }
    });

  } catch (error) {
    console.error('Activate wallet error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while activating wallet'
    });
  }
};

// @desc    Get wallet information
// @route   GET /api/payments/wallet
// @access  Private
const getWallet = async (req, res) => {
  try {
    const userId = req.userId;

    const user = await User.findById(userId).select('credits wallet');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: {
        credits: user.credits || 0,
        wallet: user.wallet || { isActivated: false },
        isActivated: user.wallet?.isActivated || false
      }
    });

  } catch (error) {
    console.error('Get wallet error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching wallet'
    });
  }
};

// @desc    Redeem payment code
// @route   POST /api/payments/redeem
// @access  Private
const redeemCode = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const userId = req.userId;
    const { code } = req.body;

    // Find the payment code
    const paymentCode = await PaymentCode.findOne({ 
      code: code.toUpperCase(),
      isRedeemed: false,
      expiresAt: { $gt: new Date() }
    });

    if (!paymentCode) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired code'
      });
    }

    // Get user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if wallet is activated
    if (!user.wallet?.isActivated) {
      return res.status(400).json({
        success: false,
        message: 'Please activate your SkillPay wallet first'
      });
    }

    // Start transaction
    const session = await User.startSession();
    session.startTransaction();

    try {
      // Mark code as redeemed
      paymentCode.isRedeemed = true;
      paymentCode.redeemedBy = userId;
      paymentCode.redeemedAt = new Date();
      await paymentCode.save({ session });

      // Update user credits
      const balanceBefore = user.credits || 0;
      const balanceAfter = balanceBefore + paymentCode.value;
      
      user.credits = balanceAfter;
      user.wallet.totalEarned = (user.wallet.totalEarned || 0) + paymentCode.value;
      user.wallet.lastTransactionAt = new Date();
      await user.save({ session });

      // Create transaction record
      const transaction = new Transaction({
        user: userId,
        type: 'credit',
        amount: paymentCode.value,
        description: `Redeemed payment code: ${code}`,
        reference: code,
        balanceBefore,
        balanceAfter,
        metadata: {
          codeId: paymentCode._id,
          redemptionMethod: 'manual'
        }
      });
      await transaction.save({ session });

      await session.commitTransaction();

      res.json({
        success: true,
        message: `Successfully redeemed ${paymentCode.value} credits!`,
        data: {
          credits: balanceAfter,
          transaction: {
            amount: paymentCode.value,
            newBalance: balanceAfter
          }
        }
      });

    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }

  } catch (error) {
    console.error('Redeem code error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while redeeming code'
    });
  }
};

// @desc    Get transaction history
// @route   GET /api/payments/transactions
// @access  Private
const getTransactions = async (req, res) => {
  try {
    const userId = req.userId;
    const { page = 1, limit = 20, type } = req.query;

    const query = { user: userId };
    if (type && ['credit', 'debit', 'refund', 'bonus'].includes(type)) {
      query.type = type;
    }

    const transactions = await Transaction.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Transaction.countDocuments(query);

    res.json({
      success: true,
      data: {
        transactions,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalTransactions: total,
          hasNextPage: page * limit < total,
          hasPrevPage: page > 1
        }
      }
    });

  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching transactions'
    });
  }
};

module.exports = {
  activateWallet,
  getWallet,
  redeemCode,
  getTransactions
};
