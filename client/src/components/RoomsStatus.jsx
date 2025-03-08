import React, { useState, useEffect } from 'react';
import axios from 'axios';

const RoomsStatus = () => {
  const [rooms, setRooms] = useState([]);
  const [studentsData, setStudentsData] = useState({});
  const [filter, setFilter] = useState('all'); // 'all', 'available', 'occupied'
  const [sortBy, setSortBy] = useState('roomNumber');

  const normalizeStatus = (status) => status?.toLowerCase() || 'available';

  const filteredRooms = rooms.filter(room => {
    const status = normalizeStatus(room.status);
    const isFullyOccupied = room.currentOccupants.length >= room.capacity;
    
    if (filter === 'occupied') {
      return isFullyOccupied;  // Only show fully occupied rooms
    }
    
    if (filter === 'available') {
      return !isFullyOccupied; // Show rooms with at least 1 available spot
    }
  
    return true; // Show all rooms
  });
  

  const fetchData = async () => {
    try {
      const roomsResponse = await axios.get('http://localhost:3000/api/rooms');
      const roomsData = roomsResponse.data;

      const studentIds = roomsData.flatMap(room => room.currentOccupants.map(student => student._id));
      if (studentIds.length > 0) {
        const studentsResponse = await axios.post('http://localhost:3000/api/student/batch', { ids: studentIds });
        const studentsMap = studentsResponse.data.reduce((acc, student) => {
          acc[student._id] = student;
          return acc;
        }, {});
        setStudentsData(studentsMap);
      }

      setRooms(roomsData);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Sorting logic
  const sortedRooms = filteredRooms.sort((a, b) => {
    if (sortBy === 'roomNumber') return a.roomNumber.localeCompare(b.roomNumber, undefined, { numeric: true });
    if (sortBy === 'occupancy') return b.currentOccupants.length - a.currentOccupants.length;
    return 0;
  });

  const normalizeOccupants = (occupants) => Array.isArray(occupants) ? occupants : [];

  return (
    <div className="px-8 py-20 bg-stone-900 min-h-screen text-white">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Room Management</h1>
          <div className="text-gray-400">
            {rooms.filter(room => room.currentOccupants.length > 0).length} / 35 rooms occupied
          </div>
        </div>

        <div className="flex gap-4 mb-4">
          <select
            className="bg-gray-800 text-white px-4 py-2 rounded-lg"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">All Rooms</option>
            <option value="available">Available</option>
            <option value="occupied">Occupied</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-700">
        <table className="w-full">
          {/* Table Header */}
          <thead className="bg-gray-700 text-gray-300 uppercase text-sm">
            <tr>
              <th className="px-6 py-3 text-left">Room Number</th>
              <th className="px-6 py-3 text-left">Status</th>
              <th className="px-6 py-3 text-left">Occupancy</th>
              <th className="px-6 py-3 text-left">Occupied By</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700 bg-gray-800">
            {sortedRooms.map((room) => {
              const occupants = normalizeOccupants(room.currentOccupants);
              return (
                <tr key={room._id} className="hover:bg-gray-750 transition-colors">
                  <td className="px-6 py-4 font-medium">{room.roomNumber}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium 
    ${occupants.length < 2 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                      {occupants.length < 2 ? "Available" : "Occupied"}
                    </span>
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span>{occupants.length}/2</span>
                      <div className="w-24 h-2 bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${occupants.length !== 2 ? 'bg-green-500' : 'bg-red-500'}`}
                          style={{ width: `${(occupants.length / 2) * 100}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {occupants.length === 0 ? (
                      <span className="text-gray-500 italic">No occupants</span>
                    ) : (
                      occupants.map((student, index) => {
                        const studentInfo = studentsData[student._id]; // Access student details by ID
                        return (
                          <div key={student._id || index} className="text-gray-400 text-sm">
                            {studentInfo?.name || student?.name || `Student ${index + 1}`}
                          </div>
                        );
                      })
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filteredRooms.length === 0 && (
          <div className="p-6 text-center text-gray-400">
            No rooms found matching the current filter.
          </div>
        )}
      </div>
    </div>
  );
};

export default RoomsStatus;
