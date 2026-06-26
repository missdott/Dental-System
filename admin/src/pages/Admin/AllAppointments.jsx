import React, { useEffect, useState } from 'react';
import { assets } from '../../assets/assets'
import { useContext } from 'react'
import { AdminContext } from '../../context/AdminContext'
import { AppContext } from '../../context/AppContext'

const AllAppointments = () => {
  const { aToken, appointments, cancelAppointment, getAllAppointments, warnUser } = useContext(AdminContext)
  const { slotDateFormat, calculateAge, currency } = useContext(AppContext)

  useEffect(() => {
    if (aToken) {
      getAllAppointments()
    }
  }, [aToken])

  // Function to handle cancellation with warning
  const handleCancelWithWarning = async (appointment) => {
    try {
      // First warn the user
      const warningResult = await warnUser(appointment.userData._id);
      
      if (warningResult.success) {
        // Then cancel the appointment
        await cancelAppointment(appointment._id);
      }
    } catch (error) {
      console.error('Error cancelling with warning:', error);
    }
  }

  return (
    <div className='w-full max-w-6xl m-5 '>

      <p className='mb-3 text-lg font-medium'>All Appointments</p>

      <div className='bg-white border rounded text-sm max-h-[80vh] overflow-y-scroll'>
        <div className='hidden sm:grid grid-cols-[0.5fr_3fr_1fr_3fr_3fr_1fr_1fr] grid-flow-col py-3 px-6 border-b'>
          <p>#</p>
          <p>Patient</p>
          <p>Age</p>
          <p>Date & Time</p>
          <p>Doctor</p>
          <p>Fees</p>
          <p>Action</p>
        </div>
        {appointments.map((item, index) => (
          <div className='flex flex-wrap justify-between max-sm:gap-2 sm:grid sm:grid-cols-[0.5fr_3fr_1fr_3fr_3fr_1fr_1fr] items-center text-gray-500 py-3 px-6 border-b hover:bg-gray-50' key={index}>
            <p className='max-sm:hidden'>{index+1}</p>
            
            {/* PATIENT SECTION */}
            <div className='flex items-center gap-2'>
              <img src={item.userData.image} className='w-8 rounded-full' alt="" /> 
              <div className="flex flex-col">
                <p>{item.userData.name}</p>
                {/* Show warning status */}
                {item.userData.warnings > 0 && (
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-red-500 font-medium">
                      Warnings: {item.userData.warnings}/3
                    </span>
                    {item.userData.warnings === 1 && (
                      <span className="text-xs text-yellow-500">⚠️</span>
                    )}
                    {item.userData.warnings === 2 && (
                      <span className="text-xs text-orange-500">⚠️⚠️</span>
                    )}
                  </div>
                )}
                {/* Show ban status */}
                {item.userData.isBanned && (
                  <span className="text-xs text-red-600 font-bold bg-red-50 px-1 rounded">
                    🔨 BANNED
                  </span>
                )}
              </div>
            </div>
            
            <p className='max-sm:hidden'>{calculateAge(item.userData.dob)}</p>
            <p>{slotDateFormat(item.slotDate)}, {item.slotTime}</p>
            <div className='flex items-center gap-2'>
              <img src={item.docData.image} className='w-8 rounded-full bg-gray-200' alt="" /> <p>{item.docData.name}</p>
            </div>
            <p>{currency}{item.amount}</p>
            
            {/* ACTION SECTION */}
            {item.cancelled ? (
              <p className='text-red-400 text-xs font-medium'>Cancelled</p>
            ) : item.isCompleted ? (
              <p className='text-green-500 text-xs font-medium'>Completed</p>
            ) : item.userData.isBanned ? (
              <p className='text-red-500 text-xs font-medium'>User Banned</p>
            ) : (
              <img 
                onClick={() => handleCancelWithWarning(item)} 
                className='w-10 cursor-pointer' 
                src={assets.cancel_icon} 
                alt="Cancel Appointment" 
                title="Cancel and issue warning to user"
              />
            )}
          </div>
        ))}
      </div>

    </div>
  )
}

export default AllAppointments