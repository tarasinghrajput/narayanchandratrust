import React, { useState, useEffect } from 'react';
import axios from 'axios';

const RoomsStatus = () => {
  const [rooms, setRooms] = useState([]);
  const [studentsData, setStudentsData] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch rooms with student details populated
        const roomsResponse = await axios.get('http://localhost:3000/api/rooms');
        const roomsData = roomsResponse.data;

        // Extract all unique student IDs
        // const studentIds = roomsData
        //   .flatMap(room => room.currentOccupants)
        //   .map(student => student?._id);

        // Fetch student details in batch
        const studentsMap = roomsData.reduce((acc, room) => {
          room.currentOccupants.forEach(student => {
            if (student?._id) {
              acc[student._id] = student; // Store each student using their ID as key
            }
          });
          return acc;
        }, {});

        setStudentsData(studentsMap);
        setRooms(roomsData);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, []);

  // Ensure currentOccupants is always an array
  const normalizeOccupants = (occupants) => {
    if (!occupants) return [];
    if (Array.isArray(occupants)) return occupants;
    return [occupants];
  };

  return (
    <div className="p-4 bg-stone-900 min-h-screen text-white">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Room Management</h1>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg">
          Add New Room
        </button>
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-700">
        <table className="w-full">
          {/* Table headers remain same */}
          <tbody className="divide-y divide-gray-700 bg-gray-800">
            {rooms.map((room) => {
              const occupants = normalizeOccupants(room.currentOccupants);
              const status = room.status.toLowerCase();

              return (
                <tr key={room._id} className="hover:bg-gray-750 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap font-medium">
                    {room.roomNumber}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium 
                      ${status === 'available'
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-red-500/20 text-red-400'}`}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span>{occupants.length}/{room.capacity}</span>
                      <div className="w-24 h-2 bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${status === 'available' ? 'bg-green-500' : 'bg-red-500'}`}
                          style={{ width: `${(occupants.length / room.capacity) * 100}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {occupants.map((student, index) => {
                      const studentInfo = studentsData[student._id]; // Access student details by ID
                      return (
                        <div key={student._id || index} className="text-gray-400 text-sm">
                          {studentInfo?.name || student?.name || `Student ${index + 1}`}
                        </div>
                      );
                    })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {/* Actions remain same */}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RoomsStatus; 