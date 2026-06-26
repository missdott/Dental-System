import React, { useContext, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppContext } from '../context/AppContext'
import axios from 'axios'
import { toast } from 'react-toastify'
import { assets } from '../assets/assets'

const MyAppointments = () => {
  const { backendUrl, token, userData, updateUserData } = useContext(AppContext)
  const navigate = useNavigate()
  const [appointments, setAppointments] = useState([])
  const [payment, setPayment] = useState('')
  const [loading, setLoading] = useState(true)

  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  const slotDateFormat = (slotDate) => {
    const [day, month, year] = slotDate.split('_')
    return `${day} ${months[Number(month) - 1]} ${year}`
  }
  // FIXED: Standardized headers with Bearer token + better error handling
  const getUserAppointments = async (appointmentId) => {
    if (!token || !userData?._id) {
      console.warn("⚠️ Missing token or userData:", { token: !!token, userId: userData?._id })
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      console.log("🔍 Fetching appointments for user:", userData._id)
      console.log("📍 Backend URL:", backendUrl)
      console.log("🔐 Token:", token?.substring(0, 20) + "...")
      
      const { data } = await axios.get(
        backendUrl + '/api/user/appointments',
        {
        headers: {
            Authorization: `Bearer ${token}`,
            },
        }
    );
      console.log("✅ API Response:", data)
      console.log("📋 Appointments received:", data.appointments)
      console.log("📊 Appointments count:", data.appointments?.length)
      console.log("📊 Is array?:", Array.isArray(data.appointments))
      
      // FIXED: Better null/undefined handling
      const appointmentsList = data.appointments || []
      console.log("🎯 appointmentsList before filter:", appointmentsList)
      const filtered = Array.isArray(appointmentsList) ? appointmentsList.reverse() : []
      console.log("🎯 filtered/reversed:", filtered)
      setAppointments(filtered)
      
    } catch (error) {
      console.error("❌ API Error:", error)
      console.error("❌ Error response:", error.response?.data)
      console.error("❌ Error message:", error.message)
      toast.error(error.response?.data?.message || error.message || "Failed to load appointments")
      setAppointments([]) // Ensure empty array on error
    } finally {
      setLoading(false)
    }
  }

  const cancelAppointment = async (appointmentId) => {
    try {
      const { data } = await axios.post(
        backendUrl + '/api/user/cancel-appointment',
        { appointmentId, userId: userData?._id },
        { 
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          } 
        }
      )

      if (data.success) {
        if (data.userBanned) {
          toast.warning(`Appointment cancelled. ${data.message}`)
        } else if (data.warnings > 0) {
          toast.warning(`Appointment cancelled. ${data.message}`)
        } else {
          toast.success(data.message)
        }
        getUserAppointments() // REFRESH appointments
        // Also reload user profile to update ban status in UI
        const { data: profileData } = await axios.get(
          backendUrl + '/api/user/get-profile',
          { headers: { Authorization: `Bearer ${token}` } }
        )
        if (profileData.success) {
          updateUserData(profileData.userData)
        }
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message)
    }
  }

  // Payment functions remain the same...
  const initPay = (order) => {
    const options = {
      key: import.meta.env.VITE_RAZORPAY_KEY_ID,
      amount: order.amount,
      currency: order.currency,
      name: 'Appointment Payment',
      description: "Appointment Payment",
      order_id: order.id,
      receipt: order.receipt,
      handler: async (response) => {
        try {
          const { data } = await axios.post(
            backendUrl + "/api/user/verifyRazorpay",
            response,
            { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
          )
          if (data.success) {
            navigate('/my-appointments')
            getUserAppointments() // REFRESH after payment
          }
        } catch (error) {
          toast.error(error.response?.data?.message || error.message)
        }
      }
    }
    const rzp = new window.Razorpay(options)
    rzp.open()
  }

  const appointmentRazorpay = async (appointmentId) => {
    try {
      const { data } = await axios.post(
        backendUrl + '/api/user/payment-razorpay',
        { appointmentId },
        { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
      )
      if (data.success) initPay(data.order)
      else toast.error(data.message)
    } catch (error) {
      toast.error(error.response?.data?.message || error.message)
    }
  }

  const appointmentStripe = async (appointmentId) => {
    try {
      const { data } = await axios.post(
        backendUrl + '/api/user/payment-stripe',
        { appointmentId },
        { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
      )
      if (data.success) {
        window.location.replace(data.session_url)
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message)
    }
  }

  // FIXED: Better dependency handling + immediate fetch
  useEffect(() => {
    console.log("🔄 useEffect triggered")
    console.log("  - token:", !!token)
    console.log("  - userData:", userData)
    console.log("  - userData._id:", userData?._id)
    console.log("  - userData type:", typeof userData)
    getUserAppointments()
  }, [token, userData?._id]) // FIXED: Proper dependency array

  const handleManualRefresh = () => {
    console.log("🔄 Manual refresh clicked")
    getUserAppointments()
  }

  return (
    <div>
      <div className="flex justify-between items-center mt-12 p-4">
        <p className="pb-3 text-lg font-medium text-gray-600 border-b">My appointments</p>
        <button 
          onClick={handleManualRefresh}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
        >
          🔄 Refresh
        </button>
      </div>

      {/* Warning/Ban Status */}
      {userData?.warnings > 0 || userData?.isBanned ? (
        <div className={`p-4 rounded-lg mb-4 ${userData?.isBanned ? 'bg-red-100 border border-red-300' : userData?.warnings >= 2 ? 'bg-orange-100 border border-orange-300' : 'bg-yellow-100 border border-yellow-300'}`}>
          <div className="flex items-center gap-2">
            {userData?.isBanned ? (
              <span className="text-red-600 text-lg">🚫</span>
            ) : (
              <span className="text-yellow-600 text-lg">⚠️</span>
            )}
            <div>
              {userData?.isBanned ? (
                <>
                  <p className="text-red-800 font-bold">Your account has been banned</p>
                  <p className="text-red-600 text-sm">You have received 3 warnings for appointment cancellations. Please contact support for more information.</p>
                </>
              ) : (
                <>
                  <p className="font-bold text-yellow-800">Warning: {userData.warnings}/3</p>
                  <p className="text-yellow-700 text-sm">
                    {userData.warnings === 1 
                      ? "You have received 1 warning for appointment cancellation. One more warning may result in restrictions." 
                      : "You have received 2 warnings. One more cancellation may result in account suspension."
                    }
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      ) : null}

      {loading ? (
        <div className="text-center py-8">
          <p className="text-gray-500">Loading appointments...</p>
        </div>
      ) : appointments.length === 0 ? (
        <div className="text-center py-8">
          <div className="max-w-md mx-auto">
            <div className="text-gray-400 mb-4">
              <svg className="w-16 h-16 mx-auto fill-none stroke-currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-gray-500 text-lg mb-2">No appointments found</p>
            <p className="text-gray-400 text-sm mb-6">You don't have any upcoming or past appointments booked.</p>
            {!userData?.isBanned && (
              <button 
                onClick={() => navigate('/doctors')}
                className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-all duration-300"
              >
                Book an Appointment
              </button>
            )}
          </div>
        </div>
      ) : (
        <div>
          <p className="text-sm text-gray-500 mt-2">Found {appointments.length} appointment(s)</p>
          {appointments.map((item, index) => (
            <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-4 md:flex md:gap-6 py-4 border-b">
              <div>
                <img className="w-36 bg-[#EAEFFF]" src={item.docData.image} alt="" />
              </div>
              <div className="flex-1">
                <p className="text-[#262626] text-base font-semibold">{item.docData.name}</p>
                <p>{item.docData.speciality}</p>
                <p className="text-[#464646] font-medium mt-1">Address</p>
                <p className={item.docData.address.line1} />
                <p className={item.docData.address.line2} />
                <p className="mt-1">
                  <span className="text-sm text-[#3C3C3C] font-medium">Date & Time:</span> {slotDateFormat(item.slotDate)} | {item.slotTime}
                </p>
                
                {/* Admin cancellation notice */}
                {item.cancelled && item.cancelledByAdmin && (
                  <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded">
                    <p className="text-red-700 text-xs font-medium">
                      ❌ Cancelled by Admin: This appointment was cancelled by administration. 
                      {userData?.warnings > 0 && ` You have received a warning.`}
                    </p>
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-2 justify-end text-sm text-center md:text-left">
                {!item.cancelled && !item.payment && !item.isCompleted && (
                  <button 
                    onClick={() => setPayment(item.id)}
                    className="text-[#696969] md:min-w-48 py-2 border rounded hover:bg-primary hover:text-white transition-all duration-300"
                  >
                    Pay Online
                  </button>
                )}
                
                {/* Payment buttons */}
                {payment === item.id && !item.cancelled && !item.payment && !item.isCompleted && (
                  <>
                    <button 
                      onClick={() => appointmentStripe(item.id)}
                      className="text-[#696969] md:min-w-48 py-2 border rounded hover:bg-gray-100 hover:text-white transition-all duration-300 flex items-center justify-center"
                    >
                      <img className="max-w-20 max-h-5" src={assets.stripeLogo} alt="" />
                    </button>
                    <button 
                      onClick={() => appointmentRazorpay(item.id)}
                      className="text-[#696969] md:min-w-48 py-2 border rounded hover:bg-gray-100 hover:text-white transition-all duration-300 flex items-center justify-center"
                    >
                      <img className="max-w-20 max-h-5" src={assets.razorpayLogo} alt="" />
                    </button>
                  </>
                )}
                
                {item.payment && !item.isCompleted && (
                  <button className="md:min-w-48 py-2 border rounded text-[#696969] bg-[#EAEFFD]">Paid</button>
                )}
                
                {item.isCompleted && (
                  <button className="md:min-w-48 py-2 border border-green-500 rounded text-green-500">Completed</button>
                )}
                
                {/* Cancel button */}
                {!item.cancelled && !item.isCompleted && !userData?.isBanned ? (
                  <button 
                    onClick={() => cancelAppointment(item._id)}
                    className="text-[#696969] md:min-w-48 py-2 border rounded hover:bg-red-600 hover:text-white transition-all duration-300"
                  >
                    Cancel appointment
                  </button>
                ) : item.cancelled && !item.isCompleted ? (
                  <button className="md:min-w-48 py-2 border border-red-500 rounded text-red-500">
                    Appointment cancelled
                  </button>
                ) : userData?.isBanned && !item.cancelled && !item.isCompleted ? (
                  <button disabled className="md:min-w-48 py-2 border rounded bg-gray-200 text-gray-500 cursor-not-allowed">
                    Account Banned
                  </button>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default MyAppointments