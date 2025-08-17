const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const { PaymentCode } = require('../models/Payment');
require('dotenv').config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Parse payment codes from the generated file
const parsePaymentCodes = () => {
  const filePath = path.join(__dirname, '../generated-codes/payment-codes-2025-08-17.txt');
  
  if (!fs.existsSync(filePath)) {
    console.error('❌ Payment codes file not found:', filePath);
    return [];
  }

  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const codes = [];

  let currentValue = 0;

  for (const line of lines) {
    const trimmedLine = line.trim();

    // Detect value sections
    if (trimmedLine.includes('CREDIT CODES')) {
      const match = trimmedLine.match(/(\d+)\s+CREDIT\s+CODES/);
      if (match) {
        currentValue = parseInt(match[1]);
        continue;
      }
    }

    // Check if line matches code format
    if (/^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(trimmedLine)) {
      codes.push({
        code: trimmedLine,
        value: currentValue
      });
    }
  }

  return codes;
};

// Populate database with payment codes
const populatePaymentCodes = async () => {
  try {
    console.log('🔄 Parsing payment codes...');
    const codes = parsePaymentCodes();
    
    if (codes.length === 0) {
      console.log('❌ No valid payment codes found');
      return;
    }

    console.log(`📊 Found ${codes.length} payment codes`);

    // Clear existing codes (optional - remove this if you want to keep existing codes)
    console.log('🗑️  Clearing existing payment codes...');
    await PaymentCode.deleteMany({});

    // Insert new codes
    console.log('💾 Inserting payment codes...');
    const result = await PaymentCode.insertMany(codes);
    
    console.log(`✅ Successfully inserted ${result.length} payment codes`);
    
    // Show summary
    const summary = await PaymentCode.aggregate([
      {
        $group: {
          _id: '$value',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    console.log('\n📈 Payment Codes Summary:');
    summary.forEach(item => {
      console.log(`   ${item._id} credits: ${item.count} codes`);
    });

  } catch (error) {
    console.error('❌ Error populating payment codes:', error);
  }
};

// Main function
const main = async () => {
  await connectDB();
  await populatePaymentCodes();
  await mongoose.disconnect();
  console.log('✅ Database disconnected');
  process.exit(0);
};

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { populatePaymentCodes, parsePaymentCodes };
