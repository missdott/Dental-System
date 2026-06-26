import express from 'express';
import { loginUser, registerUser, getProfile, updateProfile, bookAppointment, listAppointment, cancelAppointment, paymentRazorpay, verifyRazorpay, paymentStripe, verifyStripe } from '../controllers/userController.js';
import upload from '../middleware/multer.js';
import authUser from '../middleware/authUser.js';
import appointmentModel from '../models/appointmentModel.js';

const userRouter = express.Router();

userRouter.post("/register", registerUser)
userRouter.post("/login", loginUser)

userRouter.get("/get-profile", authUser, getProfile)
userRouter.post("/update-profile", upload.single('image'), authUser, updateProfile)
userRouter.post("/book-appointment", authUser, bookAppointment)
userRouter.get('/appointments', authUser, listAppointment)
// FIXED: Also fix the cancel-appointment route to use the controller
userRouter.post('/cancel-appointment', authUser, cancelAppointment)
userRouter.post("/payment-razorpay", authUser, paymentRazorpay)
userRouter.post("/verifyRazorpay", authUser, verifyRazorpay)
userRouter.post("/payment-stripe", authUser, paymentStripe)
userRouter.post("/verifyStripe", authUser, verifyStripe)

// DIAGNOSTIC: Show all appointments (for debugging)
userRouter.get('/diagnostic/all-appointments', async (req, res) => {
    try {
        const allAppointments = await appointmentModel.find();
        const byUserId = {};
        allAppointments.forEach(a => {
            if (!byUserId[a.userId]) byUserId[a.userId] = [];
            byUserId[a.userId].push({ _id: a._id, userId: a.userId, userIdType: typeof a.userId, docId: a.docId, slotDate: a.slotDate });
        });
        res.json({ total: allAppointments.length, byUserId });
    } catch (error) {
        res.json({ error: error.message });
    }
});

// DIAGNOSTIC: Show current user's appointments (requires auth)
userRouter.get('/diagnostic/my-appointments-debug', authUser, async (req, res) => {
    try {
        const userId = req.userId?.toString() || String(req.userId);
        console.log('🔍 DEBUG: Looking for appointments with userId:', userId, 'type:', typeof userId);
        
        const userAppointments = await appointmentModel.find({ userId });
        const allAppointments = await appointmentModel.find();
        
        res.json({ 
            currentUserId: userId,
            userIdType: typeof userId,
            found: userAppointments.length,
            userAppointments: userAppointments.map(a => ({ _id: a._id, userId: a.userId })),
            allAppointmentUserIds: [...new Set(allAppointments.map(a => a.userId))]
        });
    } catch (error) {
        res.json({ error: error.message });
    }
});

// ADMIN FIX: Ensure all appointments have proper userId format (for troubleshooting)
userRouter.post('/diagnostic/fix-appointment-userids', async (req, res) => {
    try {
        const { fixCode } = req.body;
        if (fixCode !== 'EMERGENCY_FIX_2025') {
            return res.json({ success: false, message: 'Invalid fix code' });
        }
        
        const allAppointments = await appointmentModel.find();
        let fixed = 0;
        
        for (const appt of allAppointments) {
            // If userId is empty or not a string, try to get it from userData
            if (!appt.userId && appt.userData?._id) {
                appt.userId = String(appt.userData._id);
                await appt.save();
                fixed++;
                console.log('✅ Fixed appointment', appt._id, 'userId:', appt.userId);
            }
        }
        
        res.json({ success: true, message: `Fixed ${fixed} appointments`, total: allAppointments.length });
    } catch (error) {
        res.json({ success: false, error: error.message });
    }
});

export default userRouter;