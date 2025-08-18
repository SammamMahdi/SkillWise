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

// Function to generate random payment code
const generatePaymentCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  
  for (let i = 0; i < 12; i++) {
    if (i > 0 && i % 4 === 0) {
      code += '-';
    }
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return code;
};

// @desc    Generate payment codes (Admin only)
// @route   POST /api/payments/admin/generate-codes
// @access  Private (Admin)
const generateCodes = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { amount, quantity, description } = req.body;
    const generatedCodes = [];
    const failedCodes = [];

    console.log(`🔄 Generating ${quantity} payment codes of ${amount} credits each...`);

    for (let i = 0; i < quantity; i++) {
      let attempts = 0;
      let success = false;
      
      while (attempts < 10 && !success) {
        try {
          const code = generatePaymentCode();
          
          // Check if code already exists
          const existingCode = await PaymentCode.findOne({ code });
          if (existingCode) {
            attempts++;
            continue;
          }

          // Create new payment code
          const paymentCode = new PaymentCode({
            code,
            value: amount,
            createdBy: req.userId,
            description: description || `Generated ${amount} credit code`,
            batchId: new Date().toISOString().split('T')[0] // Use date as batch ID
          });

          await paymentCode.save();
          generatedCodes.push({
            code,
            value: amount,
            expiresAt: paymentCode.expiresAt
          });
          
          success = true;
        } catch (error) {
          attempts++;
          if (attempts >= 10) {
            failedCodes.push(`Failed after 10 attempts`);
          }
        }
      }
      
      if (!success) {
        failedCodes.push(`Code ${i + 1}`);
      }
    }

    console.log(`✅ Successfully generated ${generatedCodes.length} payment codes`);
    if (failedCodes.length > 0) {
      console.log(`❌ Failed to generate ${failedCodes.length} codes`);
    }

    res.json({
      success: true,
      message: `Successfully generated ${generatedCodes.length} payment codes`,
      data: {
        generatedCodes,
        failedCount: failedCodes.length,
        totalGenerated: generatedCodes.length,
        totalRequested: quantity
      }
    });

  } catch (error) {
    console.error('Generate codes error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while generating payment codes'
    });
  }
};

// @desc    Get payment codes with pagination (Admin only)
// @route   GET /api/payments/admin/codes
// @access  Private (Admin)
const getPaymentCodes = async (req, res) => {
  try {
    const { page = 1, limit = 20, status = 'all' } = req.query;

    let query = {};
    if (status === 'active') {
      query = { isRedeemed: false, expiresAt: { $gt: new Date() } };
    } else if (status === 'redeemed') {
      query = { isRedeemed: true };
    }

    const codes = await PaymentCode.find(query)
      .populate('redeemedBy', 'name email username')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await PaymentCode.countDocuments(query);

    res.json({
      success: true,
      data: {
        codes,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalCodes: total,
          hasNextPage: page * limit < total,
          hasPrevPage: page > 1
        }
      }
    });

  } catch (error) {
    console.error('Get payment codes error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching payment codes'
    });
  }
};

// @desc    Get payment codes statistics (Admin only)
// @route   GET /api/payments/admin/codes/stats
// @access  Private (Admin)
const getCodeStats = async (req, res) => {
  try {
    const stats = await PaymentCode.aggregate([
      {
        $group: {
          _id: null,
          totalCodes: { $sum: 1 },
          totalValue: { $sum: '$value' },
          redeemedCodes: {
            $sum: { $cond: ['$isRedeemed', 1, 0] }
          },
          redeemedValue: {
            $sum: { $cond: ['$isRedeemed', '$value', 0] }
          },
          activeCodes: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$isRedeemed', false] },
                    { $gt: ['$expiresAt', new Date()] }
                  ]
                },
                1,
                0
              ]
            }
          },
          activeValue: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$isRedeemed', false] },
                    { $gt: ['$expiresAt', new Date()] }
                  ]
                },
                '$value',
                0
              ]
            }
          }
        }
      }
    ]);

    // Get codes by value breakdown
    const valueBreakdown = await PaymentCode.aggregate([
      {
        $group: {
          _id: '$value',
          total: { $sum: 1 },
          redeemed: {
            $sum: { $cond: ['$isRedeemed', 1, 0] }
          },
          active: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$isRedeemed', false] },
                    { $gt: ['$expiresAt', new Date()] }
                  ]
                },
                1,
                0
              ]
            }
          }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    const result = stats[0] || {
      totalCodes: 0,
      totalValue: 0,
      redeemedCodes: 0,
      redeemedValue: 0,
      activeCodes: 0,
      activeValue: 0
    };

    res.json({
      success: true,
      data: {
        overview: result,
        valueBreakdown
      }
    });

  } catch (error) {
    console.error('Get code stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching code statistics'
    });
  }
};

module.exports = {
  activateWallet,
  getWallet,
  redeemCode,
  getTransactions,
  generateCodes,
  getPaymentCodes,
  getCodeStats
};
