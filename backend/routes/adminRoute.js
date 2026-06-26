import express from 'express';
import { loginAdmin, appointmentsAdmin, appointmentCancel, addDoctor, allDoctors, adminDashboard, deleteDoctor } from '../controllers/adminController.js';
import { changeAvailablity } from '../controllers/doctorController.js';
import authAdmin from '../middleware/authAdmin.js';
import upload from '../middleware/multer.js';
import Appointment from '../models/appointmentModel.js';
import User from '../models/userModel.js';

const adminRouter = express.Router();

adminRouter.post("/login", loginAdmin)
adminRouter.post("/add-doctor", authAdmin, upload.single('image'), addDoctor)

// Use the updated appointments route that includes warning/ban fields
adminRouter.get('/appointments', authAdmin, async (req, res) => {
  try {
    const Appointment = (await import('../models/appointmentModel.js')).default;
    
    // Since you have embedded data, no need to populate
    const appointments = await Appointment.find().sort({ date: -1 }); // Using date field for sorting

    res.json({ success: true, appointments });
  } catch (error) {
    console.error('Error fetching appointments:', error);
    res.json({ success: false, message: error.message });
  }
});

// Use the controller function
adminRouter.post('/cancel-appointment', authAdmin, async (req, res) => {
  try {
    const { appointmentId, cancellationReason } = req.body;

    // Validate required fields
    if (!appointmentId || !cancellationReason) {
      return res.json({ 
        success: false, 
        message: "Appointment ID and cancellation reason are required" 
      });
    }

    // Find the appointment
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.json({ success: false, message: "Appointment not found" });
    }

    // Check if appointment is already cancelled
    if (appointment.cancelled) {
      return res.json({ success: false, message: "Appointment is already cancelled" });
    }

    // Find the user
    const user = await User.findById(appointment.userId);
    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }

    // Check if user is already banned
    if (user.isBanned) {
      return res.json({ 
        success: false, 
        message: "Cannot cancel appointment - User is currently banned" 
      });
    }

    // Update appointment with cancellation details
    appointment.cancelled = true;
    appointment.cancelledBy = 'admin';
    appointment.cancellationReason = cancellationReason;
    appointment.cancelledAt = new Date();
    await appointment.save();

    // Increment user's cancellation count and apply warnings/ban
    user.cancellationCount += 1;
    user.lastCancellationDate = new Date();

    let warningMessage = '';
    let userBanned = false;

    // Apply warnings/ban based on cancellation count
    if (user.cancellationCount === 1) {
      user.warnings = 1;
      warningMessage = 'First warning issued. User has 1 cancellation.';
    } 
    else if (user.cancellationCount === 2) {
      user.warnings = 2;
      warningMessage = 'Second warning issued. User has 2 cancellations.';
    }
    else if (user.cancellationCount >= 3) {
      user.warnings = 3;
      user.isBanned = true;
      user.banReason = 'Exceeded maximum allowed appointment cancellations (3)';
      userBanned = true;
      warningMessage = 'User has been banned due to 3 appointment cancellations.';
    }

    // Save user updates
    await user.save();

    res.json({
      success: true,
      message: `Appointment cancelled successfully. ${warningMessage}`,
      userBanned,
      warnings: user.warnings,
      cancellationCount: user.cancellationCount,
      userName: user.name,
      cancellationReason: cancellationReason
    });

  } catch (error) {
    console.error('Error cancelling appointment:', error);
    res.json({ success: false, message: error.message });
  }
});

adminRouter.get("/all-doctors", authAdmin, allDoctors)
adminRouter.post("/change-availability", authAdmin, changeAvailablity)
adminRouter.get("/dashboard", authAdmin, adminDashboard)
adminRouter.delete("/delete-doctor/:doctorId", authAdmin, deleteDoctor)

export default adminRouter;