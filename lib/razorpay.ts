import Razorpay from 'razorpay';
import crypto from 'crypto';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || '',
  key_secret: process.env.RAZORPAY_KEY_SECRET || '',
});

// Create order
export const createOrder = async (
  amount: number,
  currency: string = 'INR',
  receipt: string,
  notes: object = {}
): Promise<any> => {
  try {
    const options = {
      amount: Math.round(amount * 100), // Convert to paise
      currency,
      receipt,
      notes,
      payment_capture: 1, // Auto capture
    };

    const order = await razorpay.orders.create(options);
    return order;
  } catch (error) {
    console.error('Razorpay create order error:', error);
    throw new Error('Failed to create payment order');
  }
};

// Verify payment signature
export const verifyPaymentSignature = (
  orderId: string,
  paymentId: string,
  signature: string
): boolean => {
  try {
    const body = orderId + '|' + paymentId;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '')
      .update(body)
      .digest('hex');

    return expectedSignature === signature;
  } catch (error) {
    console.error('Razorpay signature verification error:', error);
    return false;
  }
};

// Capture payment
export const capturePayment = async (paymentId: string, amount: number): Promise<any> => {
  try {
    const payment = await razorpay.payments.capture(paymentId, Math.round(amount * 100));
    return payment;
  } catch (error) {
    console.error('Razorpay capture payment error:', error);
    throw new Error('Failed to capture payment');
  }
};

// Fetch payment details
export const fetchPayment = async (paymentId: string): Promise<any> => {
  try {
    const payment = await razorpay.payments.fetch(paymentId);
    return payment;
  } catch (error) {
    console.error('Razorpay fetch payment error:', error);
    throw new Error('Failed to fetch payment details');
  }
};

// Refund payment
export const refundPayment = async (
  paymentId: string,
  amount?: number,
  notes: object = {}
): Promise<any> => {
  try {
    const options: any = { notes };
    if (amount) {
      options.amount = Math.round(amount * 100);
    }

    const refund = await razorpay.payments.refund(paymentId, options);
    return refund;
  } catch (error) {
    console.error('Razorpay refund error:', error);
    throw new Error('Failed to process refund');
  }
};

// Create transfer to connected account (for companion payouts)
export const createTransfer = async (
  paymentId: string,
  accountId: string,
  amount: number,
  currency: string = 'INR'
): Promise<any> => {
  try {
    const transfer = await razorpay.payments.transfer(paymentId, {
      transfers: [
        {
          account: accountId,
          amount: Math.round(amount * 100),
          currency,
        },
      ],
    });
    return transfer;
  } catch (error) {
    console.error('Razorpay transfer error:', error);
    throw new Error('Failed to create transfer');
  }
};

// Fetch order details
export const fetchOrder = async (orderId: string): Promise<any> => {
  try {
    const order = await razorpay.orders.fetch(orderId);
    return order;
  } catch (error) {
    console.error('Razorpay fetch order error:', error);
    throw new Error('Failed to fetch order details');
  }
};

// Fetch all payments for an order
export const fetchOrderPayments = async (orderId: string): Promise<any> => {
  try {
    const payments = await razorpay.orders.fetchPayments(orderId);
    return payments;
  } catch (error) {
    console.error('Razorpay fetch order payments error:', error);
    throw new Error('Failed to fetch order payments');
  }
};

// Create customer
export const createCustomer = async (
  name: string,
  email: string,
  contact: string,
  notes: object = {}
): Promise<any> => {
  try {
    const customer = await razorpay.customers.create({
      name,
      email,
      contact,
      notes,
    });
    return customer;
  } catch (error) {
    console.error('Razorpay create customer error:', error);
    throw new Error('Failed to create customer');
  }
};

// Create linked account for companion
export const createLinkedAccount = async (accountData: {
  email: string;
  phone: string;
  legal_business_name: string;
  business_type: string;
  contact_name: string;
  contact_info: {
    chargeback_email: string;
    primary_email: string;
    primary_phone: string;
  };
  profile: {
    category: string;
    subcategory: string;
    description: string;
  };
  legal_info: {
    pan: string;
    gst?: string;
  };
}): Promise<any> => {
  try {
    const account = await razorpay.accounts.create(accountData);
    return account;
  } catch (error) {
    console.error('Razorpay create linked account error:', error);
    throw new Error('Failed to create linked account');
  }
};

export default razorpay;
