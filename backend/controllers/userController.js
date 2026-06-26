import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import validator from "validator";
import userModel from "../models/userModel.js";
import doctorModel from "../models/doctorModel.js";
import appointmentModel from "../models/appointmentModel.js";
import { v2 as cloudinary } from 'cloudinary'
import stripe from "stripe";
import razorpay from 'razorpay';

// Gateway Initialize
const stripeInstance = new stripe(process.env.STRIPE_SECRET_KEY)
const razorpayInstance = new razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
})

// API to register user
const registerUser = async (req, res) => {

    try {
        const { name, email, password } = req.body;

        // checking for all data to register user
        if (!name || !email || !password) {
            return res.json({ success: false, message: 'Missing Details' })
        }

        // validating email format
        if (!validator.isEmail(email)) {
            return res.json({ success: false, message: "Please enter a valid email" })
        }

        // validating strong password
        if (password.length < 8) {
            return res.json({ success: false, message: "Please enter a strong password" })
        }

        // hashing user password
        const salt = await bcrypt.genSalt(10); // the more no. round the more time it will take
        const hashedPassword = await bcrypt.hash(password, salt)

        const userData = {
            name,
            email,
            password: hashedPassword,
        }

        const newUser = new userModel(userData)
        const user = await newUser.save()
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET)

        res.json({ success: true, token })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to login user
const loginUser = async (req, res) => {

    try {
        const { email, password } = req.body;
        const user = await userModel.findOne({ email })

        if (!user) {
            return res.json({ success: false, message: "User does not exist" })
        }

        const isMatch = await bcrypt.compare(password, user.password)

        if (isMatch) {
            const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET)
            res.json({ success: true, token })
        }
        else {
            res.json({ success: false, message: "Invalid credentials" })
        }
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to get user profile data
const getProfile = async (req, res) => {
    try {
        const userId = req.userId; // Get from auth middleware, NOT from body
        console.log('🔍 Getting profile for userId:', userId);
        console.log('🔍 userId type:', typeof userId);
        
        const userData = await userModel.findById(userId).select('-password');
        
        console.log('✅ Found user data:', userData?._id);

        res.json({ success: true, userData });

    } catch (error) {
        console.log('❌ Error in getProfile:', error);
        res.json({ success: false, message: error.message });
    }
};

// API to update user profile
const updateProfile = async (req, res) => {

    try {

        const { userId, name, phone, address, dob, gender } = req.body
        const imageFile = req.file

        if (!name || !phone || !dob || !gender) {
            return res.json({ success: false, message: "Data Missing" })
        }

        await userModel.findByIdAndUpdate(userId, { name, phone, address: JSON.parse(address), dob, gender })

        if (imageFile) {

            // upload image to cloudinary
            const imageUpload = await cloudinary.uploader.upload(imageFile.path, { resource_type: "image" })
            const imageURL = imageUpload.secure_url

            await userModel.findByIdAndUpdate(userId, { image: imageURL })
        }

        res.json({ success: true, message: 'Profile Updated' })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to book appointment 
const bookAppointment = async (req, res) => {
  try {
    const authUserId = req.userId?.toString() || String(req.userId);  // Convert to string from token
    const { docId, slotDate, slotTime } = req.body;

    console.log('📝 Booking appointment for user:', authUserId);
    console.log('📝 authUserId type:', typeof authUserId);

    // Check if user is banned
    const user = await userModel.findById(authUserId).select("-password");
    if (user?.isBanned) {
      return res.json({ success: false, message: 'Your account has been banned. You cannot book new appointments. Please contact support.' });
    }

    const docData = await doctorModel.findById(docId).select("-password");
    if (!docData?.available) {
      return res.json({ success: false, message: 'Doctor Not Available' });
    }

    let slots_booked = docData.slots_booked || {};

    // slot availability
    if (slots_booked[slotDate]?.includes(slotTime)) {
      return res.json({ success: false, message: 'Slot Not Available' });
    }
    if (!slots_booked[slotDate]) slots_booked[slotDate] = [];
    slots_booked[slotDate].push(slotTime);

    const userData = await userModel.findById(authUserId).select("-password");

    // optional: avoid embedding full slots_booked in docData
    const docPlain = docData.toObject();
    delete docPlain.slots_booked;

    const appointmentData = {
      userId: authUserId,      // Store as string
      docId: String(docId),    // Ensure docId is also string
      userData,
      docData: docPlain,
      amount: docData.fees,
      slotTime,
      slotDate,
      date: Date.now(),
      cancelled: false,
      payment: false,
      isCompleted: false,
    };

    console.log('📋 Creating appointment with userId:', appointmentData.userId, 'type:', typeof appointmentData.userId);

    const newAppointment = new appointmentModel(appointmentData);
    await newAppointment.save();

    console.log('✅ Appointment saved with ID:', newAppointment._id);

    await doctorModel.findByIdAndUpdate(docId, { slots_booked });

    return res.json({ success: true, message: 'Appointment Booked', appointment: newAppointment });
  } catch (error) {
    console.log('❌ Error booking appointment:', error);
    return res.json({ success: false, message: error.message });
  }
};

// API to cancel appointment WITH WARNING/BAN SYSTEM
const cancelAppointment = async (req, res) => {
  try {
    const authUserId = req.userId;
    const { appointmentId } = req.body;

    const appointmentData = await appointmentModel.findById(appointmentId);
    if (!appointmentData) {
      return res.json({ success: false, message: 'Appointment not found' });
    }

    // verify appointment user by token, not body
    if (appointmentData.userId.toString() !== authUserId.toString()) {
      return res.json({ success: false, message: 'Unauthorized action' });
    }

        // Check if appointment is already cancelled or completed
        if (appointmentData.cancelled) {
            return res.json({ success: false, message: 'Appointment is already cancelled' });
        }
        if (appointmentData.isCompleted) {
            return res.json({ success: false, message: 'Cannot cancel completed appointment' });
        }

        // Find the user
        const user = await userModel.findById(authUserId);
        if (!user) {
            return res.json({ success: false, message: "User not found" });
        }

        // Check if user is already banned
        if (user.isBanned) {
            return res.json({ 
                success: false, 
                message: "Cannot cancel appointment - Your account is currently banned" 
            });
        }

        // Increment cancellation count
        user.cancellationCount += 1;
        user.lastCancellationDate = new Date();

        let warningMessage = '';
        let userBanned = false;

        // Apply warnings/ban based on cancellation count
        if (user.cancellationCount === 1) {
            user.warnings = 1;
            warningMessage = 'First warning: You have 1 cancellation.';
        } 
        else if (user.cancellationCount === 2) {
            user.warnings = 2;
            warningMessage = 'Second warning: You have 2 cancellations.';
        }
        else if (user.cancellationCount >= 3) {
            user.warnings = 3;
            user.isBanned = true;
            user.banReason = 'Exceeded maximum allowed appointment cancellations (3)';
            userBanned = true;
            warningMessage = 'Your account has been banned due to 3 appointment cancellations.';
        }

        // Save user updates
        await user.save();

        // Update appointment status
        appointmentData.cancelled = true;
        appointmentData.cancelledAt = new Date();
        await appointmentData.save();

        // releasing doctor slot 
        const { docId, slotDate, slotTime } = appointmentData

        const doctorData = await doctorModel.findById(docId)

        let slots_booked = doctorData.slots_booked

        slots_booked[slotDate] = slots_booked[slotDate].filter(e => e !== slotTime)

        await doctorModel.findByIdAndUpdate(docId, { slots_booked })

        res.json({
            success: true,
            message: `Appointment cancelled successfully. ${warningMessage}`,
            userBanned,
            warnings: user.warnings,
            cancellationCount: user.cancellationCount
        })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to get user appointments for frontend my-appointments page
const listAppointment = async (req, res) => {
    try {
        const userId = req.userId?.toString() || String(req.userId); // From auth middleware, convert to string
        
        console.log('🔍 Fetching appointments for user:', userId);
        console.log('🔍 User ID type:', typeof userId);
        
        if (!userId) {
            return res.json({ success: false, message: 'User ID is required' });
        }
        
        console.log('🔍 Searching for appointments with userId:', userId);
        
        const appointments = await appointmentModel.find({ userId }).sort({ date: -1 });
        
        console.log('✅ Found appointments:', appointments.length);
        console.log('📋 Appointment details:', appointments.map(a => ({ _id: a._id, userId: a.userId, docId: a.docId })));
        
        res.json({ success: true, appointments });

    } catch (error) {
        console.log('❌ Error in listAppointment:', error);
        res.json({ success: false, message: error.message });
    }
};

// API to make payment of appointment using razorpay
const paymentRazorpay = async (req, res) => {
    try {

        const { appointmentId } = req.body
        const appointmentData = await appointmentModel.findById(appointmentId)

        if (!appointmentData || appointmentData.cancelled) {
            return res.json({ success: false, message: 'Appointment Cancelled or not found' })
        }

        // creating options for razorpay payment
        const options = {
            amount: appointmentData.amount * 100,
            currency: process.env.CURRENCY,
            receipt: appointmentId,
        }

        // creation of an order
        const order = await razorpayInstance.orders.create(options)

        res.json({ success: true, order })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to verify payment of razorpay
const verifyRazorpay = async (req, res) => {
    try {
        const { razorpay_order_id } = req.body
        const orderInfo = await razorpayInstance.orders.fetch(razorpay_order_id)

        if (orderInfo.status === 'paid') {
            await appointmentModel.findByIdAndUpdate(orderInfo.receipt, { payment: true })
            res.json({ success: true, message: "Payment Successful" })
        }
        else {
            res.json({ success: false, message: 'Payment Failed' })
        }
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to make payment of appointment using Stripe
const paymentStripe = async (req, res) => {
    try {

        const { appointmentId } = req.body
        const { origin } = req.headers

        const appointmentData = await appointmentModel.findById(appointmentId)

        if (!appointmentData || appointmentData.cancelled) {
            return res.json({ success: false, message: 'Appointment Cancelled or not found' })
        }

        const currency = process.env.CURRENCY.toLocaleLowerCase()

        const line_items = [{
            price_data: {
                currency,
                product_data: {
                    name: "Appointment Fees"
                },
                unit_amount: appointmentData.amount * 100
            },
            quantity: 1
        }]

        const session = await stripeInstance.checkout.sessions.create({
            success_url: `${origin}/verify?success=true&appointmentId=${appointmentData._id}`,
            cancel_url: `${origin}/verify?success=false&appointmentId=${appointmentData._id}`,
            line_items: line_items,
            mode: 'payment',
        })

        res.json({ success: true, session_url: session.url });

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

const verifyStripe = async (req, res) => {
    try {

        const { appointmentId, success } = req.body

        if (success === "true") {
            await appointmentModel.findByIdAndUpdate(appointmentId, { payment: true })
            return res.json({ success: true, message: 'Payment Successful' })
        }

        res.json({ success: false, message: 'Payment Failed' })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }

}

export {
    loginUser,
    registerUser,
    getProfile,
    updateProfile,
    bookAppointment,
    listAppointment,
    cancelAppointment,
    paymentRazorpay,
    verifyRazorpay,
    paymentStripe,
    verifyStripe
}