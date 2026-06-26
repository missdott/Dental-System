import axios from "axios";
import { createContext, useState } from "react";
import { toast } from "react-toastify";




export const AdminContext = createContext()

const AdminContextProvider = (props) => {

    const backendUrl = import.meta.env.VITE_BACKEND_URL

    const [aToken, setAToken] = useState(localStorage.getItem('aToken') ? localStorage.getItem('aToken') : '')

    const [appointments, setAppointments] = useState([])
    const [doctors, setDoctors] = useState([])
    const [dashData, setDashData] = useState(false)

    // Getting all Doctors data from Database using API
    const getAllDoctors = async () => {

        try {

            const { data } = await axios.get(backendUrl + '/api/admin/all-doctors', { headers: { aToken } })
            if (data.success) {
                setDoctors(data.doctors)
            } else {
                toast.error(data.message)
            }

        } catch (error) {
            toast.error(error.message)
        }

    }



    // Function to change doctor availablity using API
    const changeAvailability = async (docId) => {
        try {

            const { data } = await axios.post(backendUrl + '/api/admin/change-availability', { docId }, { headers: { aToken } })
            if (data.success) {
                toast.success(data.message)
                getAllDoctors()
            } else {
                toast.error(data.message)
            }

        } catch (error) {
            console.log(error)
            toast.error(error.message)
        }
    }
    // Getting all appointment data from Database using API
    const getAllAppointments = async () => {

        try {

            const { data } = await axios.get(backendUrl + '/api/admin/appointments', { headers: { aToken } })
            if (data.success) {
                setAppointments(data.appointments.reverse())
            } else {
                toast.error(data.message)
            }

        } catch (error) {
            toast.error(error.message)
            console.log(error)
        }

    }

    // Function to cancel appointment using API
    const cancelAppointment = async (appointmentId) => {
  try {
    const { data } = await axios.post(
      backendUrl + '/api/admin/cancel-appointment', 
      { appointmentId }, 
      { headers: { aToken } }
    );

    if (data.success) {
      // Show appropriate message based on backend response
      if (data.userBanned) {
        toast.warning(`Appointment cancelled. ${data.userName} has been BANNED due to 3 cancellations.`);
      } else if (data.warnings > 0) {
        toast.warning(`Appointment cancelled. ${data.userName} has received warning ${data.warnings}/3.`);
      } else {
        toast.success(data.message);
      }
      getAllAppointments(); // Refresh the list
    } else {
      toast.error(data.message);
    }

    } catch (error) {
    toast.error(error.message);
    console.log(error);
    }
    };

    // Getting Admin Dashboard data from Database using API
    const getDashData = async () => {
        try {

            const { data } = await axios.get(backendUrl + '/api/admin/dashboard', { headers: { aToken } })

            if (data.success) {
                setDashData(data.dashData)
            } else {
                toast.error(data.message)
            }

        } catch (error) {
            console.log(error)
            toast.error(error.message)
        }

    }

    //Delete Doctor
const deleteDoctor = async (doctorId) => {
  try {
    const response = await fetch(`${backendUrl}/api/admin/delete-doctor/${doctorId}`, {
      method: "DELETE",
      headers: {
        aToken: aToken,
      },
    });

    const data = await response.json();

    if (data.success) {
      toast.success("Doctor deleted successfully");  // ✔ like Availability Changed
      getAllDoctors();
    } else {
      toast.error(data.message || "Failed to delete doctor");
    }

  } catch (error) {
    console.error(error);
    toast.error("Something went wrong");
  }
};
    const value = {
        aToken, setAToken,
        doctors,
        getAllDoctors,
        changeAvailability,
        deleteDoctor,
        appointments,
        getAllAppointments,
        getDashData,
        cancelAppointment,
        dashData
    }

    return (
        <AdminContext.Provider value={value}>
            {props.children}
        </AdminContext.Provider>
    )
}

export default AdminContextProvider